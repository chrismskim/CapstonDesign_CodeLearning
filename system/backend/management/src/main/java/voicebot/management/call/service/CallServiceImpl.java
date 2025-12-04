package voicebot.management.call.service;

import com.fasterxml.jackson.core.JsonParser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import voicebot.management.call.dto.ConsultationStatusDto;
import voicebot.management.call.dto.QueueItem;
import voicebot.management.call.dto.VulnerableResponse;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.repository.ConsultationRepository;
import voicebot.management.question.entity.QuestionSet;
import voicebot.management.question.repository.QuestionSetRepository;
import voicebot.management.vulnerable.entity.Vulnerable;
import voicebot.management.vulnerable.repository.VulnerableRepository;
import voicebot.management.vulnerable.session.entity.VulnerableSession;
import voicebot.management.vulnerable.session.repository.VulnerableSessionRepository;
import voicebot.management.call.dto.LlmResultDto;
import com.fasterxml.jackson.core.type.TypeReference;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CallServiceImpl implements CallService {

    private final VulnerableRepository vulnerableRepository;
    private final QuestionSetRepository questionSetRepository;
    private final ConsultationRepository consultationRepository;
    private final MonitoringService monitoringService;
    private final VulnerableSessionRepository vulnerableSessionRepository;
    private final WebClient.Builder webClientBuilder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String WAITING_QUEUE_KEY = "queue:waiting";
    private static final String QUESTION_CACHE_PREFIX = "questions:";
    private static final long QUESTION_CACHE_TTL = 1; // hour

    private static final String ACCOUNT_MAPPING_PREFIX = "consult:account:";

    @Value("${orchestrator.api.base-url}")
    private String orchestratorBaseUrl;

    @Override
    public List<String> addBatchToQueue(List<String> vulnerableIds, String questionSetId) {
        QuestionSet questionSet = questionSetRepository.findById(questionSetId)
                .orElseThrow(() -> new IllegalArgumentException("QuestionSet not found with id: " + questionSetId));

        // Cache the question set in Redis
        String questionCacheKey = QUESTION_CACHE_PREFIX + questionSetId;
        redisTemplate.opsForValue().set(questionCacheKey, questionSet, QUESTION_CACHE_TTL, TimeUnit.HOURS);
        log.info("Cached QuestionSet {} in Redis.", questionSetId);

        return vulnerableIds.stream()
                .map(vId -> {
                    vulnerableRepository.findById(vId)
                            .orElseThrow(() -> new IllegalArgumentException("Vulnerable not found with id: " + vId));

                    QueueItem item = new QueueItem(
                            UUID.randomUUID().toString(),
                            vId,
                            questionSetId,
                            "WAITING",
                            LocalDateTime.now(),
                            null,
                            null
                    );

                    redisTemplate.opsForList().rightPush(WAITING_QUEUE_KEY, item);
                    log.info("Added to waiting queue: {}", item.getQueueId());
                    return item.getQueueId();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<VulnerableResponse> searchVulnerablesByName(String name) {
        return vulnerableRepository.findByNameContaining(name).stream()
                .map(v -> VulnerableResponse.builder()
                        .userId(v.getUserId())
                        .name(v.getName())
                        .phoneNumber(v.getPhoneNumber())
                        .address(String.format("%s %s %s %s",
                                v.getAddress().getState(),
                                v.getAddress().getCity(),
                                v.getAddress().getAddress1(),
                                v.getAddress().getAddress2()).trim())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<ConsultationStatusDto> getQueueStatus() {
        List<Object> items = redisTemplate.opsForList().range(WAITING_QUEUE_KEY, 0, -1);
        if (items == null) {
            return Collections.emptyList();
        }

        return items.stream()
                .map(obj -> {
                    // QueueItem 역직렬화 처리
                    QueueItem item;
                    if (obj instanceof QueueItem) {
                        item = (QueueItem) obj;
                    } else {
                        item = objectMapper.convertValue(obj, QueueItem.class);
                    }

                    Vulnerable vulnerable = vulnerableRepository.findById(item.getVulnerableId()).orElse(null);

                    // QuestionSet 캐시에서 가져오기 (역직렬화 포함)
                    Object rawQuestion = redisTemplate.opsForValue()
                            .get(QUESTION_CACHE_PREFIX + item.getQuestionSetId());
                    QuestionSet questionSet = null;
                    if (rawQuestion instanceof QuestionSet) {
                        questionSet = (QuestionSet) rawQuestion;
                    } else if (rawQuestion != null) {
                        questionSet = objectMapper.convertValue(rawQuestion, QuestionSet.class);
                    }
                    if (questionSet == null) {
                        questionSet = questionSetRepository.findById(item.getQuestionSetId()).orElse(null);
                    }

                    if (vulnerable == null || questionSet == null) {
                        log.warn("Could not find Vulnerable or QuestionSet for queue item: {}", item.getQueueId());
                        return null;
                    }

                    return new ConsultationStatusDto(
                            item.getVulnerableId(),
                            vulnerable.getName(),
                            questionSet.getTitle(),
                            item.getState(),
                            null
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    public void startNextConsultation() {
        // 큐에서 다음 아이템 꺼내면서 역직렬화 처리
        Object raw = redisTemplate.opsForList().leftPop(WAITING_QUEUE_KEY);
        if (raw == null) {
            log.info("Consultation queue is empty. Nothing to start.");
            return;
        }

        QueueItem item;
        if (raw instanceof QueueItem) {
            item = (QueueItem) raw;
        } else {
            item = objectMapper.convertValue(raw, QueueItem.class);
        }

        final String vulnerableId = item.getVulnerableId();

        Vulnerable vulnerable = vulnerableRepository.findById(vulnerableId).orElse(null);
        if (vulnerable == null) {
            log.error("Vulnerable not found for ID: {}. Skipping consultation.", vulnerableId);
            return;
        }
        String accountId = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                accountId = auth.getName();  // 보통 userId / username
            }
        } catch (Exception e) {
            log.warn("Failed to read accountId from SecurityContext", e);
        }

        // QuestionSet 캐시에서 가져오기 (역직렬화 포함)
        Object rawQuestion = redisTemplate.opsForValue()
                .get(QUESTION_CACHE_PREFIX + item.getQuestionSetId());
        QuestionSet initialQuestionSet = null;
        if (rawQuestion instanceof QuestionSet) {
            initialQuestionSet = (QuestionSet) rawQuestion;
        } else if (rawQuestion != null) {
            initialQuestionSet = objectMapper.convertValue(rawQuestion, QuestionSet.class);
        }

        if (initialQuestionSet == null) {
            initialQuestionSet = questionSetRepository.findById(item.getQuestionSetId())
                    .orElseThrow(() -> {
                        log.error("QuestionSet not found in cache or DB for ID: {}. Skipping consultation.", item.getQuestionSetId());
                        return new IllegalStateException("QuestionSet not found");
                    });
        }
        final QuestionSet questionSet = initialQuestionSet;

        // 세션 인덱스 관리
        VulnerableSession session = vulnerableSessionRepository.findById(vulnerableId)
                .orElse(new VulnerableSession(vulnerableId, 0));
        int newSessionIndex = session.getSessionIndex() + 1;
        session.setSessionIndex(newSessionIndex);
        vulnerableSessionRepository.save(session);
        log.info("Vulnerable [{}], New Session Index: {}", vulnerableId, newSessionIndex);

        if (accountId != null) {
            String key = ACCOUNT_MAPPING_PREFIX + vulnerableId + ":" + newSessionIndex;
            redisTemplate.opsForValue().set(key, accountId, 1, TimeUnit.DAYS);
            log.info("Saved account mapping: {} -> {}", key, accountId);
        } else {
            log.info("No accountId resolved for this consultation (maybe anonymous/system).");
        }

        // 상태 IN_PROGRESS
        item.setState("IN_PROGRESS");
        item.setStartTime(LocalDateTime.now());

        monitoringService.sendUpdate(new ConsultationStatusDto(
                item.getVulnerableId(),
                vulnerable.getName(),
                questionSet.getTitle(),
                "IN_PROGRESS",
                null
        ));

        log.info("Starting consultation for: {}", item);
        Map<String, Object> body = createOrchestratorRequest(vulnerable, questionSet, newSessionIndex);
        log.info("Sending to Orchestrator: {}", body);

        WebClient webClient = webClientBuilder.baseUrl(orchestratorBaseUrl).build();
        webClient.post()
                .uri("/api/receive")
                .bodyValue(createOrchestratorRequest(vulnerable, questionSet, newSessionIndex))
                .retrieve()
                .bodyToMono(String.class)  // ← 문자열로 변경
                .doOnSuccess(response -> {
                    log.info("FastAPI response: {}", response);

//                    item.setState("COMPLETED");
                    item.setEndTime(LocalDateTime.now());
//
//                    monitoringService.sendUpdate(
//                            new ConsultationStatusDto(
//                                    item.getVulnerableId(),
//                                    vulnerable.getName(),
//                                    questionSet.getTitle(),
//                                    "COMPLETED",
//                                    null
//                            )
//                    );
                })
                .doOnError(error -> {
                    log.error("Consultation failed for {}: {}", vulnerableId, error.getMessage());
                    item.setState("FAILED");
                    item.setEndTime(LocalDateTime.now());

                    monitoringService.sendUpdate(new ConsultationStatusDto(
                            item.getVulnerableId(),
                            vulnerable.getName(),
                            questionSet.getTitle(),
                            "FAILED",
                            error.getMessage()
                    ));
                })
                .subscribe();
    }

    @Override
    public void handleLlmResult(LlmResultDto dto) {
        log.info("Handling LLM result for vulnerableId={}, sessionIndex={}, questionSetId={}",
                dto.getVulnerableId(), dto.getSessionIndex(), dto.getQuestionSetId());

        String resolvedAccountId = null;
        if (dto.getVulnerableId() != null && dto.getSessionIndex() != null) {
            String mapKey = ACCOUNT_MAPPING_PREFIX + dto.getVulnerableId() + ":" + dto.getSessionIndex();
            Object rawAccount = redisTemplate.opsForValue().get(mapKey);
            if (rawAccount != null) {
                resolvedAccountId = rawAccount.toString();
                // 1회용으로 쓰고 지우고 싶으면 주석 해제
                // redisTemplate.delete(mapKey);
            }
            log.info("Resolved accountId from mapping [{}] = {}", mapKey, resolvedAccountId);
        }
        // 취약계층 먼저 조회 (나중에 업데이트에도 사용)
        Vulnerable vulnerable = null;
        if (dto.getVulnerableId() != null) {
            vulnerable = vulnerableRepository.findById(dto.getVulnerableId()).orElse(null);
        }

        if (vulnerable == null) {
            log.warn("Vulnerable not found for id={}", dto.getVulnerableId());
        }

        try {
            Consultation consultation = new Consultation();

            consultation.setVulnerableId(dto.getVulnerableId());
            consultation.setQuestionSetId(dto.getQuestionSetId());

            Integer sessionIndex = dto.getSessionIndex();
            consultation.setSIndex(sessionIndex != null ? sessionIndex : 0);

            if (dto.getTime() != null) {
                try {
                    consultation.setTime(LocalDateTime.parse(dto.getTime()));
                } catch (Exception e) {
                    log.warn("Invalid time format from dto: {} , using now()", dto.getTime());
                    consultation.setTime(LocalDateTime.now());
                }
            } else {
                consultation.setTime(LocalDateTime.now());
            }

            Long runtime = dto.getRuntime();
            consultation.setRuntime(runtime != null ? runtime : 0L);

            consultation.setOverallScript(dto.getOverallScript());
            consultation.setSummary(dto.getSummary());

            Integer result = dto.getResult();
            consultation.setResult(result != null ? result : 0);

            Integer failCode = dto.getFailCode();
            consultation.setFailCode(failCode != null ? failCode : 0);

            Integer needHuman = dto.getNeedHuman();
            consultation.setNeedHuman(needHuman != null ? needHuman : 0);

            consultation.setResultVulnerabilities(dto.getResultVulnerabilities());
            consultation.setDeleteVulnerabilities(dto.getDeleteVulnerabilities());
            consultation.setNewVulnerabilities(dto.getNewVulnerabilities());

            String finalAccountId = dto.getAccountId() != null ? dto.getAccountId() : resolvedAccountId;
            consultation.setAccountId(finalAccountId);

            // 1) 상담 내역 저장
            consultationRepository.save(consultation);
            log.info("Saved consultation result. consultationId={}, accountId={}",
                    consultation.getId(), finalAccountId);
            monitoringService.sendUpdate(
                    new ConsultationStatusDto(
                            dto.getVulnerableId(),
                            vulnerable != null ? vulnerable.getName() : null,
                            null,
                            "COMPLETED",
                            null
                    )
            );
            if (vulnerable != null && consultation.getResultVulnerabilities() != null) {
                Consultation.VulnerabilityInfo rv = consultation.getResultVulnerabilities();

                Vulnerable.Vulnerability vulnInfo = vulnerable.getVulnerabilities();
                if (vulnInfo == null) {
                    vulnInfo = new Vulnerable.Vulnerability();
                }

                vulnInfo.setSummary(consultation.getSummary());

                List<Vulnerable.Risk> riskList =
                        Optional.ofNullable(rv.getRiskList()).orElse(Collections.emptyList())
                                .stream()
                                .map(r -> Vulnerable.Risk.builder()
                                        .riskType(r.getRiskIndexList())
                                        .content(r.getContent())
                                        .build()
                                )
                                .toList();

                List<Vulnerable.Desire> desireList =
                        Optional.ofNullable(rv.getDesireList()).orElse(Collections.emptyList())
                                .stream()
                                .map(d -> Vulnerable.Desire.builder()
                                        .desireType(d.getDesireIndexList())
                                        .content(d.getContent())
                                        .build()
                                )
                                .toList();

                vulnInfo.setRiskList(riskList);
                vulnInfo.setDesireList(desireList);

                vulnerable.setVulnerabilities(vulnInfo);
                vulnerableRepository.save(vulnerable);

                log.info("Updated Vulnerable {} vulnerabilities from consultation {}",
                        vulnerable.getUserId(), consultation.getId());
            }

        } catch (Exception e) {
            log.error("Failed to save consultation result from LLM dto: {}", dto, e);
        }
    }

    private Map<String, Object> createOrchestratorRequest(Vulnerable vulnerable,
                                                          QuestionSet questionSet,
                                                          int sessionIndex) {
        Map<String, Object> address = Map.of(
                "state", vulnerable.getAddress().getState(),
                "city",  vulnerable.getAddress().getCity(),
                "address1", vulnerable.getAddress().getAddress1(),
                "address2", vulnerable.getAddress().getAddress2()
        );

        List<Map<String, Object>> riskListMap = Collections.emptyList();
        List<Map<String, Object>> desireListMap = Collections.emptyList();

        if (vulnerable.getVulnerabilities() != null) {
            Vulnerable.Vulnerability vulnInfo = vulnerable.getVulnerabilities();

            if (vulnInfo.getRiskList() != null) {
                riskListMap = vulnInfo.getRiskList().stream()
                        .map(r -> {
                            Map<String, Object> m = new HashMap<>();
                            List<Integer> riskType =
                                    Optional.ofNullable(r.getRiskType())
                                            .orElse(Collections.emptyList());

                            m.put("risk_index_list", riskType);
                            m.put("content", r.getContent());
                            return m;
                        })
                        .toList();
            }

            if (vulnInfo.getDesireList() != null) {
                desireListMap = vulnInfo.getDesireList().stream()
                        .map(d -> {
                            Map<String, Object> m = new HashMap<>();
                            List<Integer> desireType =
                                    Optional.ofNullable(d.getDesireType())
                                            .orElse(Collections.emptyList());

                            m.put("desire_type", desireType);
                            m.put("content", d.getContent());
                            return m;
                        })
                        .toList();
            }

        }

        Map<String, Object> vulnerabilities = Map.of(
                "risk_list", riskListMap,
                "desire_list", desireListMap
        );

        List<Map<String, Object>> questionListParsed =
                questionSet.getFlow().stream()
                        .map(q -> {
                            Map<String, Object> qMap = new HashMap<>();
                            qMap.put("text", q.getText());

                            List<Map<String, Object>> expectedAnswers =
                                    q.getExpectedResponse().stream()
                                            .map(exp -> {
                                                Map<String, Object> expMap = new HashMap<>();
                                                expMap.put("text", exp.getText());

                                                List<Map<String, Object>> responseTypes =
                                                        exp.getResponseTypeList().stream()
                                                                .map(rt -> {
                                                                    Map<String, Object> rtMap = new HashMap<>();
                                                                    rtMap.put("response_type", rt.getResponseType());
                                                                    rtMap.put("response_index", rt.getResponseIndex());
                                                                    return rtMap;
                                                                })
                                                                .toList();

                                                expMap.put("response_type_list", responseTypes);
                                                return expMap;
                                            })
                                            .toList();

                            qMap.put("expected_answer", expectedAnswers);
                            return qMap;
                        })
                        .toList();

        return Map.of(
                "vulnerable_id", vulnerable.getUserId(), //취약문제 index
                "s_index", sessionIndex,  // [추가] 회차 정보 전달
                "q_id", questionSet.getId(),
                "name", vulnerable.getName(),
                "phone", vulnerable.getPhoneNumber(),
                "gender", vulnerable.getGender(),
                "birth_date", vulnerable.getBirthDate().toString(),
                "address", address,
                "question_list", questionListParsed,
                "vulnerabilities", vulnerabilities
        );
    }
}

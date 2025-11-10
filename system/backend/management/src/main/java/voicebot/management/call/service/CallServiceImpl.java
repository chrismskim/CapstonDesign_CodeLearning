package voicebot.management.call.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import voicebot.management.call.dto.QueueItem;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.repository.ConsultationRepository;
import voicebot.management.question.entity.QuestionSet;
import voicebot.management.question.repository.QuestionSetRepository;
import voicebot.management.vulnerable.entity.Vulnerable;
import voicebot.management.vulnerable.repository.VulnerableRepository;
import voicebot.management.vulnerable.session.entity.VulnerableSession;
import voicebot.management.vulnerable.session.repository.VulnerableSessionRepository;
import voicebot.management.call.dto.ConsultationStatusDto;
import voicebot.management.call.dto.VulnerableResponse;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
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

    private static final String WAITING_QUEUE_KEY = "queue:waiting";
    private static final String QUESTION_CACHE_PREFIX = "questions:";
    private static final long QUESTION_CACHE_TTL = 1;

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

        List<String> queueIds = vulnerableIds.stream().map(vId -> {
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
        }).collect(Collectors.toList());

        return queueIds;
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
                    if (!(obj instanceof QueueItem)) {
                        log.warn("Invalid object type in queue: {}", obj.getClass().getName());
                        return null;
                    }
                    QueueItem item = (QueueItem) obj;
                    Vulnerable vulnerable = vulnerableRepository.findById(item.getVulnerableId()).orElse(null);
                    QuestionSet questionSet = (QuestionSet) redisTemplate.opsForValue().get(QUESTION_CACHE_PREFIX + item.getQuestionSetId());
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
        QueueItem item = (QueueItem) redisTemplate.opsForList().leftPop(WAITING_QUEUE_KEY);
        if (item == null) {
            log.info("Consultation queue is empty. Nothing to start.");
            return;
        }

        final String vulnerableId = item.getVulnerableId();

        Vulnerable vulnerable = vulnerableRepository.findById(vulnerableId).orElse(null);
        if (vulnerable == null) {
            log.error("Vulnerable not found for ID: {}. Skipping consultation.", vulnerableId);
            return;
        }

        QuestionSet initialQuestionSet = (QuestionSet) redisTemplate.opsForValue().get(QUESTION_CACHE_PREFIX + item.getQuestionSetId());
        if (initialQuestionSet == null) {
            initialQuestionSet = questionSetRepository.findById(item.getQuestionSetId())
                    .orElseThrow(() -> {
                        log.error("QuestionSet not found in cache or DB for ID: {}. Skipping consultation.", item.getQuestionSetId());
                        return new IllegalStateException("QuestionSet not found");
                    });
        }
        final QuestionSet questionSet = initialQuestionSet;

        VulnerableSession session = vulnerableSessionRepository.findById(vulnerableId)
                .orElse(new VulnerableSession(vulnerableId, 0));
        int newSessionIndex = session.getSessionIndex() + 1;
        session.setSessionIndex(newSessionIndex);
        vulnerableSessionRepository.save(session);
        log.info("Vulnerable [{}], New Session Index: {}", vulnerableId, newSessionIndex);

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

        WebClient webClient = webClientBuilder.baseUrl(orchestratorBaseUrl).build();
        webClient.post()
                .uri("/api/v1/voice-bot/consult")
                .bodyValue(createOrchestratorRequest(vulnerable, questionSet, newSessionIndex))
                .retrieve()
                .bodyToMono(Consultation.class)
                .doOnSuccess(consultationResult -> {
                    consultationResult.setSIndex(newSessionIndex);
                    consultationResult.setVulnerableId(vulnerableId);
                    consultationResult.setQuestionSetId(item.getQuestionSetId());
                    consultationResult.setTime(item.getStartTime());
                    consultationRepository.save(consultationResult);

                    item.setState("COMPLETED");
                    item.setEndTime(LocalDateTime.now());
                    
                    monitoringService.sendUpdate(new ConsultationStatusDto(
                            item.getVulnerableId(),
                            vulnerable.getName(),
                            questionSet.getTitle(),
                            "COMPLETED",
                            null
                    ));

                    log.info("Consultation successful for {}", vulnerableId);
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

    private Object createOrchestratorRequest(Vulnerable vulnerable, QuestionSet questionSet, int sessionIndex) {
        return java.util.Map.of(
                "name", vulnerable.getName(),
                "phone", vulnerable.getPhoneNumber(),
                "gender", vulnerable.getGender(),
                "birth_date", vulnerable.getBirthDate().toString(),
                "address", vulnerable.getAddress(),
                "question_list", questionSet.getFlow(),
                "vulnerabilities", vulnerable.getVulnerabilities()
        );
    }
} 
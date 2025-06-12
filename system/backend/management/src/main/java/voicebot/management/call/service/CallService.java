package voicebot.management.call.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import voicebot.management.call.dto.QueueBatchRequest;
import voicebot.management.call.dto.QueueItem;
import voicebot.management.call.dto.VulnerableResponse;
import voicebot.management.call.dto.VulnerableSearchRequest;
import voicebot.management.vulnerable.entity.Vulnerable;
import voicebot.management.vulnerable.repository.VulnerableRepository;
import org.springframework.scheduling.annotation.Async;

import java.time.LocalDate;
import java.time.Period;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CallService {

    private final VulnerableRepository vulnerableRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final MonitoringService monitoringService;

    public CallService(VulnerableRepository vulnerableRepository, StringRedisTemplate redisTemplate, ObjectMapper objectMapper, MonitoringService monitoringService) {
        this.vulnerableRepository = vulnerableRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.monitoringService = monitoringService;
    }

    public List<VulnerableResponse> searchVulnerables(VulnerableSearchRequest request) {
        return vulnerableRepository.findAllByDeletedIsFalse().stream()
                .filter(v -> matches(v, request))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private boolean matches(Vulnerable v, VulnerableSearchRequest r) {
        if (r.getName() != null && !v.getName().contains(r.getName())) return false;
        if (r.getLocation() != null && !v.getAddress().getCity().contains(r.getLocation())) return false;
        // Add more filter logic for ageRange and vulnerabilityType if needed
        return true;
    }

    private VulnerableResponse toResponse(Vulnerable v) {
        VulnerableResponse res = new VulnerableResponse();
        res.setId(v.getUserId());
        res.setName(v.getName());
        res.setAge(Period.between(LocalDate.parse(v.getBirthDate()), LocalDate.now()).getYears());
        res.setLocation(v.getAddress().getState() + " " + v.getAddress().getCity());
        // Vulnerability types mapping logic here
        return res;
    }

    public List<String> registerBatchToQueue(QueueBatchRequest request) throws JsonProcessingException {
        List<String> queueIds = request.getVulnerableIds().stream()
                .map(vId -> {
                    String queueId = UUID.randomUUID().toString();
                    QueueItem item = new QueueItem();
                    item.setQueueId(queueId);
                    item.setVulnerableId(vId);
                    item.setQuestionsId(request.getQuestionsId());
                    item.setState("WAITING");
                    item.setCreatedTime(LocalDateTime.now());
                    try {
                        String json = objectMapper.writeValueAsString(item);
                        redisTemplate.opsForList().leftPush("waiting_queue", json);
                        return queueId;
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException("Failed to serialize QueueItem", e);
                    }
                })
                .collect(Collectors.toList());
        return queueIds;
    }

    @Async
    public void processAllWaitingCallsAsync() {
        while (true) {
            try {
                String itemJson = redisTemplate.opsForList().rightPop("waiting_queue");
                if (itemJson == null) {
                    break; // No more items in queue
                }

                QueueItem item = objectMapper.readValue(itemJson, QueueItem.class);
                
                // 1. 상태를 IN_PROGRESS로 변경하고 알림
                item.setState("IN_PROGRESS");
                item.setStartTime(LocalDateTime.now());
                monitoringService.pushUpdates(item);

                // 2. (시뮬레이션) 상담 진행을 흉내 내기 위해 잠시 대기
                Thread.sleep(5000); // 5초 대기

                // 3. 상태를 COMPLETED로 변경하고 알림
                item.setState("COMPLETED");
                item.setEndTime(LocalDateTime.now());
                monitoringService.pushUpdates(item);
                
                // 실제로는 여기에 콜봇 API 호출 및 결과 저장 로직이 들어갑니다.

            } catch (JsonProcessingException | InterruptedException e) {
                // 에러 처리 로직
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
} 
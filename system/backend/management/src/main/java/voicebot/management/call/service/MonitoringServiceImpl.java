package voicebot.management.call.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import voicebot.management.call.dto.ConsultationStatusDto;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class MonitoringServiceImpl implements MonitoringService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private static final Long SSE_EMITTER_TIMEOUT = 60 * 60 * 1000L; // 1시간

    @Override
    public SseEmitter subscribe(String adminId) {
        SseEmitter emitter = new SseEmitter(SSE_EMITTER_TIMEOUT);
        emitters.add(emitter);
        log.info("New SSE Emitter subscribed for admin: {}. Total emitters: {}", adminId, emitters.size());

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.info("SSE Emitter completed for admin: {}. Total emitters: {}", adminId, emitters.size());
        });
        emitter.onTimeout(() -> {
            emitter.complete();
            log.info("SSE Emitter timed out for admin: {}", adminId);
        });
        emitter.onError(e -> {
            emitter.complete();
            log.error("SSE Emitter error for admin: {}", adminId, e);
        });

        // 초기 연결 시 더미 데이터 전송
        try {
            emitter.send(SseEmitter.event().name("connect").data("Connection successful"));
        } catch (IOException e) {
            log.error("Error sending initial SSE event to admin: {}", adminId, e);
        }

        return emitter;
    }

    @Override
    public void sendUpdate(ConsultationStatusDto statusDto) {
        log.info("Sending update to {} emitters: {}", emitters.size(), statusDto);
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("statusUpdate").data(statusDto));
            } catch (IOException e) {
                log.warn("Failed to send SSE update, assuming client disconnected.", e);
                // 에러 발생 시 리스트에서 제거하는 로직은 onCompletion 콜백에서 처리됨
            }
        }
    }
} 
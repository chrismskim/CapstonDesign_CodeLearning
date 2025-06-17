package voicebot.management.call.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import voicebot.management.call.dto.ConsultationStatusDto;

public interface MonitoringService {
    SseEmitter subscribe(String adminId);
    void sendUpdate(ConsultationStatusDto statusDto);
} 
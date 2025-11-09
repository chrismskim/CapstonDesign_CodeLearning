package voicebot.management.history.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import voicebot.management.history.dto.CallHistoryDto;
import voicebot.management.history.entity.Consultation;

import java.util.Optional;

public interface HistoryService {
    Page<CallHistoryDto> getCallHistory(String searchTerm, Integer sIndex, Pageable pageable);

    Optional<Consultation> getCallHistoryDetail(String callId);
} 
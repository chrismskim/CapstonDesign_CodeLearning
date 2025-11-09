package voicebot.management.history.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.history.dto.CallHistoryDto;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.service.HistoryService;

@RestController
@RequestMapping("/api/call/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    @GetMapping
    public ResponseEntity<Page<CallHistoryDto>> getCallHistory(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Integer sIndex,
            // Additional filters can be added here
            Pageable pageable) {
        Page<CallHistoryDto> historyPage = historyService.getCallHistory(searchTerm, sIndex, pageable);
        return ResponseEntity.ok(historyPage);
    }

    @GetMapping("/{callId}")
    public ResponseEntity<Consultation> getCallHistoryDetail(@PathVariable String callId) {
        return historyService.getCallHistoryDetail(callId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
} 
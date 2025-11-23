package voicebot.management.history.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.history.dto.CallHistoryDto;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.service.HistoryService;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/call")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;


    @GetMapping("/history")
    public ResponseEntity<Page<CallHistoryDto>> getCallHistory(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Integer sIndex,
            @PageableDefault(size = 10, sort = "time", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        Page<CallHistoryDto> page = historyService.getCallHistory(searchTerm, sIndex, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/history/{id}")
    public ResponseEntity<Consultation> getCallHistoryDetail(@PathVariable String id) {
        Optional<Consultation> opt = historyService.getCallHistoryDetail(id);
        return opt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

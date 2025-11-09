package voicebot.management.call.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import voicebot.management.call.dto.ConsultationStatusDto;
import voicebot.management.call.dto.QueueBatchRequest;
import voicebot.management.call.dto.VulnerableResponse;
import voicebot.management.call.service.CallService;
import voicebot.management.call.service.MonitoringService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/call")
@RequiredArgsConstructor
public class CallController {

    private final CallService callService;
    private final MonitoringService monitoringService;

    @GetMapping("/vulnerable/search")
    public ResponseEntity<List<VulnerableResponse>> searchVulnerables(@RequestParam String name) {
        List<VulnerableResponse> vulnerables = callService.searchVulnerablesByName(name);
        return ResponseEntity.ok(vulnerables);
    }

    @PostMapping("/queue/batch")
    public ResponseEntity<Void> addBatchToQueue(@RequestBody QueueBatchRequest request) {
        callService.addBatchToQueue(request.getVulnerableIds(), request.getQuestionSetId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/queue/status")
    public ResponseEntity<List<ConsultationStatusDto>> getQueueStatus() {
        List<ConsultationStatusDto> queueStatus = callService.getQueueStatus();
        return ResponseEntity.ok(queueStatus);
    }

    @PostMapping("/start")
    public ResponseEntity<Void> startConsultation() {
        callService.startNextConsultation();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/sse/{adminId}")
    public SseEmitter subscribe(@PathVariable String adminId) {
        return monitoringService.subscribe(adminId);
    }
} 
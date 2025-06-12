package voicebot.management.call.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.call.dto.QueueBatchRequest;
import voicebot.management.call.dto.VulnerableResponse;
import voicebot.management.call.dto.VulnerableSearchRequest;
import voicebot.management.call.service.CallService;
import voicebot.management.call.service.MonitoringService;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.net.URI;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/call")
public class CallController {

    private final CallService callService;
    private final MonitoringService monitoringService;

    public CallController(CallService callService, MonitoringService monitoringService) {
        this.callService = callService;
        this.monitoringService = monitoringService;
    }

    @GetMapping("/vulnerable/search")
    public ResponseEntity<Map<String, Object>> searchVulnerables(VulnerableSearchRequest request) {
        List<VulnerableResponse> result = callService.searchVulnerables(request);
        return ResponseEntity.ok(Map.of("vulnerables", result));
    }

    @PostMapping("/queue/batch")
    public ResponseEntity<?> registerBatch(@RequestBody QueueBatchRequest request) {
        try {
            List<String> queueIds = callService.registerBatchToQueue(request);
            return ResponseEntity.ok(Map.of("success", true, "queueIds", queueIds));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/start")
    public ResponseEntity<Void> startAllCalls() {
        callService.processAllWaitingCallsAsync();
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .location(URI.create("/dashboard/consultations/status"))
                .build();
    }

    @GetMapping(value = "/sse", produces = "text/event-stream")
    public SseEmitter streamEvents() {
        SseEmitter emitter = new SseEmitter(0L);
        monitoringService.register(emitter);
        return emitter;
    }
} 
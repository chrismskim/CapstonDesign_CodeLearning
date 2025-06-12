package voicebot.management.vulnerable.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.vulnerable.dto.VulnerableDto;
import voicebot.management.vulnerable.service.VulnerableService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vulnerables")
@RequiredArgsConstructor
public class VulnerableController {

    private final VulnerableService vulnerableService;

    @PostMapping
    public ResponseEntity<?> createVulnerable(@RequestBody VulnerableDto dto) {
        VulnerableDto created = vulnerableService.createVulnerable(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "message", "상담 대상자가 등록되었습니다.", "vulnerable", created));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<VulnerableDto>>> getAllVulnerables() {
        List<VulnerableDto> vulnerables = vulnerableService.getAllVulnerables();
        return ResponseEntity.ok(Map.of("vulnerables", vulnerables));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<VulnerableDto> getVulnerableById(@PathVariable String userId) {
        return ResponseEntity.ok(vulnerableService.getVulnerableById(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateVulnerable(@PathVariable String userId, @RequestBody VulnerableDto dto) {
        VulnerableDto updated = vulnerableService.updateVulnerable(userId, dto);
        return ResponseEntity.ok(Map.of("success", true, "message", "상담 대상자 정보가 수정되었습니다.", "vulnerable", updated));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteVulnerable(@PathVariable String userId) {
        vulnerableService.deleteVulnerable(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "상담 대상자가 삭제되었습니다."));
    }

    @DeleteMapping("/batch")
    public ResponseEntity<?> deleteVulnerables(@RequestBody Map<String, List<String>> payload) {
        List<String> userIds = payload.get("userIds");
        if (userIds == null || userIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "userIds가 비어있습니다."));
        }
        userIds.forEach(vulnerableService::deleteVulnerable);
        return ResponseEntity.ok(Map.of("success", true, "message", "선택된 상담 대상자가 삭제되었습니다."));
    }
}

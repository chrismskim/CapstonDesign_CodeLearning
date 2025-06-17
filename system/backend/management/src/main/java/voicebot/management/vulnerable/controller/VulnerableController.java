package voicebot.management.vulnerable.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.vulnerable.dto.VulnerableDto;
import voicebot.management.vulnerable.service.VulnerableService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/vulnerable")
@RequiredArgsConstructor
public class VulnerableController {

    private final VulnerableService vulnerableService;

    @PostMapping("/add")
    @Operation(summary = "취약계층 등록")
    public ResponseEntity<?> create(@RequestBody VulnerableDto dto) {
        log.info("[VULNERABLE][CONTROLLER][POST] 등록 요청: {}", dto.getUserId());
        try {
            return ResponseEntity.ok(vulnerableService.create(dto));
        } catch (IllegalStateException e) {
            log.warn("[VULNERABLE][CONTROLLER][POST] 중복 ID 등록 시도: {}", dto.getUserId());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/list")
    @Operation(summary = "취약계층 전체 조회")
    public ResponseEntity<List<VulnerableDto>> findAll() {
        log.info("[VULNERABLE][CONTROLLER][GET] 전체 조회 요청");
        return ResponseEntity.ok(vulnerableService.findAll());
    }

    @GetMapping("/{userId}")
    @Operation(summary = "취약계층 단건 조회")
    public ResponseEntity<?> findById(@PathVariable String userId) {
        log.info("[VULNERABLE][CONTROLLER][GET] 단건 조회 요청: {}", userId);
        VulnerableDto dto = vulnerableService.findById(userId).orElse(null);
        if (dto == null) {
            log.warn("[VULNERABLE][CONTROLLER][GET] 존재하지 않는 ID 조회 시도: {}", userId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{userId}")
    @Operation(summary = "취약계층 수정")
    public ResponseEntity<?> update(@PathVariable String userId, @RequestBody VulnerableDto dto) {
        log.info("[VULNERABLE][CONTROLLER][PUT] 수정 요청: {}", userId);
        VulnerableDto updated = vulnerableService.update(userId, dto);
        if (updated == null) {
            log.warn("[VULNERABLE][CONTROLLER][PUT] 존재하지 않는 ID 수정 시도: {}", userId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "취약계층 삭제")
    public ResponseEntity<?> delete(@PathVariable String userId) {
        log.info("[VULNERABLE][CONTROLLER][DELETE] 삭제 요청: {}", userId);
        boolean deleted = vulnerableService.delete(userId);
        if (!deleted) {
            log.warn("[VULNERABLE][CONTROLLER][DELETE] 존재하지 않는 ID 삭제 시도: {}", userId);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}

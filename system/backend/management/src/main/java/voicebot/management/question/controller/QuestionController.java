package voicebot.management.question.controller;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.question.dto.QuestionSetDto;
import voicebot.management.question.service.QuestionService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/question")
@RequiredArgsConstructor
@Slf4j
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping("/add")
    @Operation(summary = "질문 세트 등록")
    public ResponseEntity<?> create(@RequestBody QuestionSetDto dto) {
        log.info("[QUESTION][CONTROLLER][POST] 등록 요청: {}", dto.getId());
        try {
            return ResponseEntity.ok(questionService.create(dto));
        } catch (IllegalStateException e) {
            log.warn("[QUESTION][CONTROLLER][POST] 중복 ID 등록 시도: {}", dto.getId());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/list")
    @Operation(summary = "질문 세트 전체 조회")
    public ResponseEntity<List<QuestionSetDto>> findAll() {
        log.info("[QUESTION][CONTROLLER][GET] 전체 조회 요청");
        return ResponseEntity.ok(questionService.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "질문 세트 단건 조회")
    public ResponseEntity<?> findById(@PathVariable String id) {
        log.info("[QUESTION][CONTROLLER][GET] 단건 조회 요청: {}", id);
        Optional<QuestionSetDto> dto = questionService.findById(id);
        if (dto.isEmpty()) {
            log.warn("[QUESTION][CONTROLLER][GET] 존재하지 않는 ID 조회 시도: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    @Operation(summary = "질문 세트 수정")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody QuestionSetDto dto) {
        log.info("[QUESTION][CONTROLLER][PUT] 수정 요청: {}", id);
        QuestionSetDto updated = questionService.update(id, dto);
        if (updated == null) {
            log.warn("[QUESTION][CONTROLLER][PUT] 존재하지 않는 ID 수정 시도: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "질문 세트 삭제")
    public ResponseEntity<?> delete(@PathVariable String id) {
        log.info("[QUESTION][CONTROLLER][DELETE] 삭제 요청: {}", id);
        boolean deleted = questionService.delete(id);
        if (!deleted) {
            log.warn("[QUESTION][CONTROLLER][DELETE] 존재하지 않는 ID 삭제 시도: {}", id);
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}




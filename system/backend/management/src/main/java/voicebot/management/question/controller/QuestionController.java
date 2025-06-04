package voicebot.management.question.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.question.dto.QuestionSetDto;
import voicebot.management.question.service.QuestionService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/question")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;


    // 전체 질문 세트 목록 조회
    // GET /api/question/list
    @GetMapping("/list")
    public ResponseEntity<List<QuestionSetDto>> getAll() {
        log.info("📥 [GET] /api/question/list 요청");
        return ResponseEntity.ok(questionService.getAll());
    }


    // 특정 질문 세트 조회
    // GET /api/question/{question_id}
    @GetMapping("/{question_id}")
    public ResponseEntity<QuestionSetDto> get(@PathVariable("question_id") String questionId) {
        QuestionSetDto dto = questionService.getById(questionId);
        log.info("📥 [GET] /api/question/{} 요청", questionId);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }


    // 새로운 질문 세트 등록
    // POST /api/question/add
    @PostMapping("/add")
    public ResponseEntity<QuestionSetDto> add(@RequestBody QuestionSetDto dto) {
        log.info("📥 [POST] /api/question/add 요청: {}", dto);
        return ResponseEntity.ok(questionService.create(dto));
    }


    // 기존 질문 세트 수정
    // PUT /api/question/{question_id}
    @PutMapping("/{question_id}")
    public ResponseEntity<QuestionSetDto> update(@PathVariable("question_id") String questionId,
                                                 @RequestBody QuestionSetDto dto) {
        QuestionSetDto updated = questionService.update(questionId, dto);
        log.info("📥 [PUT] /api/question/{} 요청 - 수정 DTO: {}", questionId, dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }


    // 질문 세트 삭제
    // DELETE /api/question/{question_id}
    @DeleteMapping("/{question_id}")
    public ResponseEntity<Void> delete(@PathVariable("question_id") String questionId) {
        boolean success = questionService.delete(questionId);
        log.info("📥 [DELETE] /api/question/{} 요청", questionId);
        return success ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}



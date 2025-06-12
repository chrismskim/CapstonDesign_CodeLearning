package voicebot.management.question.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.question.dto.QuestionSetDto;
import voicebot.management.question.service.QuestionService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    public ResponseEntity<?> createQuestionSet(@RequestBody QuestionSetDto dto) {
        QuestionSetDto createdDto = questionService.createQuestionSet(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "message", "질문 세트가 등록되었습니다.", "questionSet", createdDto));
    }

    @GetMapping
    public ResponseEntity<Map<String, List<QuestionSetDto>>> getAllQuestionSets() {
        List<QuestionSetDto> questionSets = questionService.getAllQuestionSets();
        return ResponseEntity.ok(Map.of("questions", questionSets));
    }

    @GetMapping("/{questionsId}")
    public ResponseEntity<QuestionSetDto> getQuestionSetById(@PathVariable String questionsId) {
        QuestionSetDto dto = questionService.getQuestionSetById(questionsId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{questionsId}")
    public ResponseEntity<?> updateQuestionSet(@PathVariable String questionsId, @RequestBody QuestionSetDto dto) {
        QuestionSetDto updatedDto = questionService.updateQuestionSet(questionsId, dto);
        return ResponseEntity.ok(Map.of("success", true, "message", "질문 세트가 수정되었습니다."));
    }

    @DeleteMapping("/{questionsId}")
    public ResponseEntity<?> deleteQuestionSet(@PathVariable String questionsId) {
        questionService.deleteQuestionSet(questionsId);
        return ResponseEntity.ok(Map.of("success", true, "message", "질문 세트가 삭제되었습니다."));
    }
}


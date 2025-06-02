package voicebot.management.question.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import voicebot.management.question.dto.QuestionSetDto;
import voicebot.management.question.service.QuestionService;

import java.util.List;

@RestController
@RequestMapping("/api/question")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/list")
    public ResponseEntity<List<QuestionSetDto>> getAllSets() {
        return ResponseEntity.ok(questionService.getAllQuestionSets());
    }

    @GetMapping("/{question_id}")
    public ResponseEntity<QuestionSetDto> getSet(@PathVariable String question_id) {
        return ResponseEntity.ok(questionService.getQuestionSetById(question_id));
    }

    @PostMapping("/add")
    public ResponseEntity<QuestionSetDto> addSet(@RequestBody QuestionSetDto dto) {
        return ResponseEntity.ok(questionService.saveQuestionSet(dto));
    }

    @PutMapping("/{question_id}")
    public ResponseEntity<QuestionSetDto> updateSet(@PathVariable String question_id,
                                                    @RequestBody QuestionSetDto dto) {
        return ResponseEntity.ok(questionService.updateQuestionSet(question_id, dto));
    }

    @DeleteMapping("/{question_id}")
    public ResponseEntity<Void> deleteSet(@PathVariable String question_id) {
        questionService.deleteQuestionSet(question_id);
        return ResponseEntity.noContent().build();
    }
}


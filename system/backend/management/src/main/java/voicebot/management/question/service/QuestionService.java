package voicebot.management.question.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import voicebot.management.question.dto.*;
import voicebot.management.question.entity.*;
import voicebot.management.question.repository.QuestionSetRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionSetRepository questionSetRepository;

    public List<QuestionSetDto> getAllQuestionSets() {
        return questionSetRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public QuestionSetDto getQuestionSetById(String id) {
        return questionSetRepository.findById(id)
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional
    public QuestionSetDto saveQuestionSet(QuestionSetDto dto) {
        QuestionSet saved = questionSetRepository.save(toEntity(dto));
        return toDto(saved);
    }

    @Transactional
    public QuestionSetDto updateQuestionSet(String id, QuestionSetDto dto) {
        Optional<QuestionSet> optional = questionSetRepository.findById(id);
        if (optional.isEmpty()) return null;

        // 기존 데이터 삭제 후 새로 저장
        questionSetRepository.deleteById(id);
        return saveQuestionSet(dto);
    }

    public void deleteQuestionSet(String id) {
        questionSetRepository.deleteById(id);
    }

    // ---------------------- Mapper ----------------------
    private QuestionSetDto toDto(QuestionSet entity) {
        return QuestionSetDto.builder()
                .questionsId(entity.getQuestionsId())
                .title(entity.getTitle())
                .time(entity.getTime())
                .flow(entity.getFlow().stream().map(this::toDto).collect(Collectors.toList()))
                .build();
    }

    private QuestionDto toDto(Question entity) {
        return QuestionDto.builder()
                .questionId(entity.getQuestionId())
                .text(entity.getText())
                .type(entity.getType())
                .expectedResponse(
                        entity.getExpectedResponses().stream().map(this::toDto).collect(Collectors.toList()))
                .build();
    }

    private ExpectedResponseDto toDto(ExpectedResponse entity) {
        return ExpectedResponseDto.builder()
                .text(entity.getText())
                .responseType(entity.getResponseType())
                .build();
    }

    private QuestionSet toEntity(QuestionSetDto dto) {
        List<Question> questionList = dto.getFlow().stream().map(qDto -> {
            List<ExpectedResponse> responses = qDto.getExpectedResponse().stream()
                    .map(er -> ExpectedResponse.builder()
                            .text(er.getText())
                            .responseType(er.getResponseType())
                            .build())
                    .collect(Collectors.toList());

            Question question = Question.builder()
                    .questionId(qDto.getQuestionId())
                    .text(qDto.getText())
                    .type(qDto.getType())
                    .expectedResponses(responses)
                    .build();

            responses.forEach(r -> r.setQuestion(question));
            return question;
        }).collect(Collectors.toList());

        QuestionSet qs = QuestionSet.builder()
                .questionsId(dto.getQuestionsId())
                .title(dto.getTitle())
                .time(dto.getTime())
                .flow(questionList)
                .build();

        questionList.forEach(q -> q.setQuestionSet(qs));
        return qs;
    }
}

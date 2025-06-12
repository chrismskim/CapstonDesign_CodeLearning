package voicebot.management.question.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import voicebot.management.question.dto.ExpectedResponseDto;
import voicebot.management.question.dto.QuestionDto;
import voicebot.management.question.dto.QuestionSetDto;
import voicebot.management.question.dto.ResponseTypeDto;
import voicebot.management.question.entity.ExpectedResponse;
import voicebot.management.question.entity.Question;
import voicebot.management.question.entity.QuestionSet;
import voicebot.management.question.entity.ResponseType;
import voicebot.management.question.repository.QuestionSetRepository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionSetRepository questionSetRepository;

    // C: 새로운 질문 세트 생성 (Soft Delete 적용 불필요)
    public QuestionSetDto createQuestionSet(QuestionSetDto dto) {
        QuestionSet questionSet = toEntity(dto);
        questionSet.setQuestionsId(UUID.randomUUID().toString()); // 고유 ID 생성
        questionSet.setTime(LocalDateTime.now());
        questionSet.setDeleted(false);
        QuestionSet saved = questionSetRepository.save(questionSet);
        return toDto(saved);
    }

    // R: 모든 질문 세트 조회 (Soft Delete 적용)
    public List<QuestionSetDto> getAllQuestionSets() {
        return questionSetRepository.findAllByDeletedIsFalse().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // R: ID로 특정 질문 세트 조회 (Soft Delete 적용)
    public QuestionSetDto getQuestionSetById(String id) {
        return questionSetRepository.findByQuestionsIdAndDeletedIsFalse(id)
                .map(this::toDto)
                .orElseThrow(() -> new NoSuchElementException("QuestionSet not found with id: " + id));
    }

    // U: 질문 세트 수정
    public QuestionSetDto updateQuestionSet(String id, QuestionSetDto dto) {
        QuestionSet existing = questionSetRepository.findByQuestionsIdAndDeletedIsFalse(id)
                .orElseThrow(() -> new NoSuchElementException("QuestionSet not found with id: " + id));

        existing.setTitle(dto.getTitle());
        if (dto.getQuestionList() != null) {
            existing.setQuestionList(dto.getQuestionList().stream().map(this::toEntity).collect(Collectors.toList()));
        } else {
            existing.setQuestionList(Collections.emptyList());
        }
        existing.setTime(LocalDateTime.now()); // 업데이트 시간 갱신

        QuestionSet updated = questionSetRepository.save(existing);
        return toDto(updated);
    }

    // D: 질문 세트 삭제 (Soft Delete)
    public void deleteQuestionSet(String id) {
        QuestionSet questionSet = questionSetRepository.findByQuestionsIdAndDeletedIsFalse(id)
                .orElseThrow(() -> new NoSuchElementException("QuestionSet not found with id: " + id));
        questionSet.setDeleted(true);
        questionSetRepository.save(questionSet);
    }

    // ---------------------- Mapper ----------------------

    private QuestionSetDto toDto(QuestionSet entity) {
        QuestionSetDto dto = new QuestionSetDto();
        dto.setQuestionsId(entity.getQuestionsId());
        dto.setTitle(entity.getTitle());
        dto.setTime(entity.getTime());
        if (entity.getQuestionList() != null) {
            dto.setQuestionList(entity.getQuestionList().stream().map(this::toDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private QuestionDto toDto(Question entity) {
        QuestionDto dto = new QuestionDto();
        dto.setText(entity.getText());
        if (entity.getExpectedAnswer() != null) {
            dto.setExpectedAnswer(entity.getExpectedAnswer().stream().map(this::toDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private ExpectedResponseDto toDto(ExpectedResponse entity) {
        ExpectedResponseDto dto = new ExpectedResponseDto();
        dto.setText(entity.getText());
        if (entity.getResponseTypeList() != null) {
            dto.setResponseTypeList(entity.getResponseTypeList().stream().map(this::toDto).collect(Collectors.toList()));
        }
        return dto;
    }

    private ResponseTypeDto toDto(ResponseType entity) {
        ResponseTypeDto dto = new ResponseTypeDto();
        dto.setResponseType(entity.getResponseType());
        dto.setResponseIndex(entity.getResponseIndex());
        return dto;
    }

    private QuestionSet toEntity(QuestionSetDto dto) {
        QuestionSet entity = new QuestionSet();
        entity.setQuestionsId(dto.getQuestionsId());
        entity.setTitle(dto.getTitle());
        entity.setTime(dto.getTime());
        if (dto.getQuestionList() != null) {
            entity.setQuestionList(dto.getQuestionList().stream().map(this::toEntity).collect(Collectors.toList()));
        }
        return entity;
    }

    private Question toEntity(QuestionDto dto) {
        Question entity = new Question();
        entity.setText(dto.getText());
        if (dto.getExpectedAnswer() != null) {
            entity.setExpectedAnswer(dto.getExpectedAnswer().stream().map(this::toEntity).collect(Collectors.toList()));
        }
        return entity;
    }

    private ExpectedResponse toEntity(ExpectedResponseDto dto) {
        ExpectedResponse entity = new ExpectedResponse();
        entity.setText(dto.getText());
        if (dto.getResponseTypeList() != null) {
            entity.setResponseTypeList(dto.getResponseTypeList().stream().map(this::toEntity).collect(Collectors.toList()));
        }
        return entity;
    }

    private ResponseType toEntity(ResponseTypeDto dto) {
        ResponseType entity = new ResponseType();
        entity.setResponseType(dto.getResponseType());
        entity.setResponseIndex(dto.getResponseIndex());
        return entity;
    }
}

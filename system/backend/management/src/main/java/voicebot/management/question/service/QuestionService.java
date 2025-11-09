package voicebot.management.question.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import voicebot.management.question.dto.*;
import voicebot.management.question.entity.*;
import voicebot.management.question.repository.QuestionSetRepository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionSetRepository repository;

    public List<QuestionSetDto> findAll() {
        log.info("[QUESTION][SERVICE][FIND_ALL] 전체 조회 요청");
        return repository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public Optional<QuestionSetDto> findById(String questionId) {
        log.info("[QUESTION][SERVICE][FIND_BY_ID] 조회 요청: {}", questionId);
        return repository.findById(questionId)
                .map(entity -> {
                    log.info("[QUESTION][SERVICE][FIND_BY_ID] 조회 성공: {}", questionId);
                    return toDto(entity);
                });
    }

    public QuestionSetDto create(QuestionSetDto dto) {
        log.info("[QUESTION][SERVICE][CREATE] 생성 요청: {}", dto.getId());

        if (dto.getId() == null || dto.getId().isEmpty()) {
            List<QuestionSet> all = repository.findAll();
            int max = all.stream()
                    .map(q -> q.getId().replace("Q", ""))
                    .mapToInt(Integer::parseInt)
                    .max()
                    .orElse(0);
            dto.setId(String.format("Q%03d", max + 1));
        }

        if (repository.existsById(dto.getId())) {
            log.warn("[QUESTION][SERVICE][CREATE] 중복 ID: {}", dto.getId());
            throw new IllegalStateException("이미 존재하는 questionId입니다.");
        }

        QuestionSet saved = repository.save(toEntity(dto));
        log.info("[QUESTION][SERVICE][CREATE] 저장 완료: {}", saved.getId());
        return toDto(saved);
    }

    public QuestionSetDto update(String questionId, QuestionSetDto dto) {
        log.info("[QUESTION][SERVICE][UPDATE] 수정 요청: {}", questionId);
        if (!repository.existsById(questionId)) {
            log.warn("[QUESTION][SERVICE][UPDATE] 존재하지 않음: {}", questionId);
            return null;
        }
        dto.setId(questionId);
        QuestionSet updated = repository.save(toEntity(dto));
        log.info("[QUESTION][SERVICE][UPDATE] 수정 완료: {}", questionId);
        return toDto(updated);
    }

    public boolean delete(String questionId) {
        log.info("[QUESTION][SERVICE][DELETE] 삭제 요청: {}", questionId);
        if (!repository.existsById(questionId)) {
            log.warn("[QUESTION][SERVICE][DELETE] 존재하지 않음: {}", questionId);
            return false;
        }
        repository.deleteById(questionId);
        log.info("[QUESTION][SERVICE][DELETE] 삭제 완료: {}", questionId);
        return true;
    }

    private QuestionSet toEntity(QuestionSetDto dto) {
        List<QuestionItem> flow = dto.getFlow() == null ? Collections.emptyList() :
                dto.getFlow().stream().map(q -> {
                    List<ExpectedResponse> erList = q.getExpectedResponse() == null ? Collections.emptyList() :
                            q.getExpectedResponse().stream().map(er ->
                                    ExpectedResponse.builder()
                                            .text(er.getText())
                                            .responseTypeList(er.getResponseTypeList() == null ? Collections.emptyList() :
                                                    er.getResponseTypeList().stream().map(rt ->
                                                                    ResponseTypeInfo.builder()
                                                                            .responseType(rt.getResponseType())
                                                                            .responseIndex(rt.getResponseIndex())
                                                                            .build())
                                                            .toList())
                                            .build()
                            ).toList();

                    return QuestionItem.builder()
                            .text(q.getText())
                            .expectedResponse(erList)
                            .build();
                }).toList();

        return QuestionSet.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .time(dto.getTime())
                .flow(flow)
                .build();
    }

    private QuestionSetDto toDto(QuestionSet entity) {
        List<QuestionItemDto> flow = entity.getFlow() == null ? Collections.emptyList() :
                entity.getFlow().stream().map(q -> {
                    List<ExpectedResponseDto> erList = q.getExpectedResponse() == null ? Collections.emptyList() :
                            q.getExpectedResponse().stream().map(er ->
                                    ExpectedResponseDto.builder()
                                            .text(er.getText())
                                            .responseTypeList(er.getResponseTypeList() == null ? Collections.emptyList() :
                                                    er.getResponseTypeList().stream().map(rt ->
                                                                    ResponseTypeInfoDto.builder()
                                                                            .responseType(rt.getResponseType())
                                                                            .responseIndex(rt.getResponseIndex())
                                                                            .build())
                                                            .toList())
                                            .build()
                            ).toList();

                    return QuestionItemDto.builder()
                            .text(q.getText())
                            .expectedResponse(erList)
                            .build();
                }).toList();

        return QuestionSetDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .time(entity.getTime())
                .flow(flow)
                .build();
    }
}

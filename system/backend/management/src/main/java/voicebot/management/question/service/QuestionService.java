package voicebot.management.question.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import voicebot.management.question.dto.*;
import voicebot.management.question.entity.*;
import voicebot.management.question.repository.QuestionSetRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionSetRepository repository;

    // 질문 세트 전체 조회
    public List<QuestionSetDto> getAll() {
        log.info("📦 [Service] 모든 질문 세트 조회");
        return repository.findAll().stream()
                .map(this::toDto) // Entity → DTO 변환
                .toList();
    }

    // 특정 질문 세트 조회
    public QuestionSetDto getById(String id) {
        log.info("🔍 [Service] 질문 세트 ID 조회: {}", id);
        return repository.findById(id)
                .map(this::toDto) // Entity → DTO
                .orElse(null);
    }

    // 질문 세트 새로 저장
    public QuestionSetDto create(QuestionSetDto dto) {
        log.info("📝 [Service] 질문 세트 생성 요청: {}", dto);
        QuestionSet saved = repository.save(toEntity(dto)); // DTO → Entity → 저장
        log.info("✅ [Service] 저장 완료: {}", saved);
        return toDto(saved); // 저장된 Entity → DTO 변환
    }

    // 기존 질문 세트 수정
    public QuestionSetDto update(String id, QuestionSetDto dto) {
        log.info("✏️ [Service] 질문 세트 수정 요청: ID={}, DTO={}", id, dto);
        if (!repository.existsById(id)) {
            log.warn("⚠️ [Service] 수정 실패 - 존재하지 않음: {}", id);
            return null;
        }
        dto.setId(id);
        return toDto(repository.save(toEntity(dto))); // 저장 후 DTO로 리턴
    }

    // 질문 세트 삭제
    public boolean delete(String id) {
        log.info("🗑 [Service] 질문 세트 삭제 요청: {}", id);

        if (!repository.existsById(id)) {
            log.warn("⚠️ [Service] 삭제 실패 - 존재하지 않음: {}", id);
            return false;
        }
        repository.deleteById(id);
        return true;
    }

    //──────────── DTO → Entity 변환 ──────────────
    private QuestionSet toEntity(QuestionSetDto dto) {
        List<QuestionItem> flow = dto.getFlow().stream().map(q -> {
            List<ExpectedResponse> erList = q.getExpectedResponse().stream().map(er ->
                    ExpectedResponse.builder()
                            .text(er.getText())
                            .responseTypeList(er.getResponseTypeList() == null ? null :
                                    er.getResponseTypeList().stream().map(rt ->
                                            ResponseTypeInfo.builder()
                                                    .responseType(rt.getResponseType())
                                                    .responseIndex(rt.getResponseIndex())
                                                    .build()
                                    ).toList()
                            )
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

    //──────────── Entity → DTO 변환 ──────────────
    private QuestionSetDto toDto(QuestionSet entity) {
        List<QuestionItemDto> flow = entity.getFlow().stream().map(q -> {
            List<ExpectedResponseDto> erList = q.getExpectedResponse().stream().map(er ->
                    ExpectedResponseDto.builder()
                            .text(er.getText())
                            .responseTypeList(er.getResponseTypeList() == null ? null :
                                    er.getResponseTypeList().stream().map(rt ->
                                            ResponseTypeInfoDto.builder()
                                                    .responseType(rt.getResponseType())
                                                    .responseIndex(rt.getResponseIndex())
                                                    .build()
                                    ).toList()
                            )
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


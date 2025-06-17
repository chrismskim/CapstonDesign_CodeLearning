package voicebot.management.question.dto;

import lombok.*;
import voicebot.management.question.entity.QuestionItem;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionSetDto {
    private String id; // 질문 세트 ID

    private LocalDateTime time; // 질문 세트 생성 시간

    private String title; // 시나리오 제목

    private List<QuestionItemDto> flow; // 질문 리스트
}

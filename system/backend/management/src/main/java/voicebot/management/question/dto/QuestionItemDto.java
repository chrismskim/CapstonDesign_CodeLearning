package voicebot.management.question.dto;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionItemDto {

    private String text; // 질문 텍스트

    private List<ExpectedResponseDto> expectedResponse; // 예상 답변 리스트
}

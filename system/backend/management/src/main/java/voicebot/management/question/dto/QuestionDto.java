package voicebot.management.question.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDto {
    private String questionId;
    private String text;
    private int type;
    private List<ExpectedResponseDto> expectedResponse;
}

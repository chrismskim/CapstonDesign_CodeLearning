package voicebot.management.question.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpectedResponseDto {
    private String text;
    private int responseType;
}
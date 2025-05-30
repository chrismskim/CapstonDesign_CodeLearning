package voicebot.management.question.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionSetDto {
    private String questionsId;
    private String title;
    private LocalDateTime time;
    private List<QuestionDto> flow;
}

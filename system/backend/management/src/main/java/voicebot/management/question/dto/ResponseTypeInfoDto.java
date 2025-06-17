package voicebot.management.question.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResponseTypeInfoDto {

    private int responseType;

    private int responseIndex;
}

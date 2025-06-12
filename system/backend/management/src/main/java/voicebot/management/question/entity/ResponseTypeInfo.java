package voicebot.management.question.entity;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ResponseTypeInfo {

    private int responseType;

    private int responseIndex;
}

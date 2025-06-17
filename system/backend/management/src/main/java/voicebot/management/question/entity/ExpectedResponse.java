package voicebot.management.question.entity;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExpectedResponse {

    private String text; // 예상 답변 내용

    private List<ResponseTypeInfo> responseTypeList; // 응답 분류 정보(위기, 욕구)
}

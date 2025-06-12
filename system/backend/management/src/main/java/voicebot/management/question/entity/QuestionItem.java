package voicebot.management.question.entity;

import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionItem {
    
    private String text; // 실제 질문 문장
    
    private List<ExpectedResponse> expectedResponse; // 예상 답변 리스트
}

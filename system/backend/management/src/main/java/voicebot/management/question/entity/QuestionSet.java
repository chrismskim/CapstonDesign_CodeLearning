package voicebot.management.question.entity;

import jakarta.persistence.Id;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "question_sets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionSet {
    @Id
    private String id;

    private LocalDateTime time; // 질문 세트 생성 시각

    private String title; // 질문 세트의 제목 (시나리오 제목)

    private List<QuestionItem> flow; // 질문 리스트 (시나리오 흐름)
}
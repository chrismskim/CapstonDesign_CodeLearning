package voicebot.management.question.entity;

import jakarta.persistence.*;
import lombok.*;
import voicebot.management.question.entity.QuestionSet;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    private String questionId; // "Q1"

    private String text;

    private int type;

    @ManyToOne
    @JoinColumn(name = "questions_id")
    private QuestionSet questionSet;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpectedResponse> expectedResponses;
}

package voicebot.management.question.dto;

import java.time.LocalDateTime;
import java.util.List;

public class QuestionSetDto {
    private String questionsId;
    private String title;
    private LocalDateTime time;
    private List<QuestionDto> questionList;

    public String getQuestionsId() {
        return questionsId;
    }

    public void setQuestionsId(String questionsId) {
        this.questionsId = questionsId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public List<QuestionDto> getQuestionList() {
        return questionList;
    }

    public void setQuestionList(List<QuestionDto> questionList) {
        this.questionList = questionList;
    }
}

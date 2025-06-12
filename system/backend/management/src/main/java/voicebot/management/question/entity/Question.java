package voicebot.management.question.entity;

import java.util.List;

public class Question {

    private String text; // 질문 내용

    private List<ExpectedResponse> expectedAnswer;

    // Manual Getters and Setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<ExpectedResponse> getExpectedAnswer() {
        return expectedAnswer;
    }

    public void setExpectedAnswer(List<ExpectedResponse> expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }
}

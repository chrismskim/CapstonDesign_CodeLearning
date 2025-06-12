package voicebot.management.question.dto;

import java.util.List;

public class QuestionDto {
    private String text;
    private List<ExpectedResponseDto> expectedAnswer;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<ExpectedResponseDto> getExpectedAnswer() {
        return expectedAnswer;
    }

    public void setExpectedAnswer(List<ExpectedResponseDto> expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }
}

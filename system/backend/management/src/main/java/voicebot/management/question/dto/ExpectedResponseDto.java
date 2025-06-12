package voicebot.management.question.dto;

import java.util.List;

public class ExpectedResponseDto {
    private String text;
    private List<ResponseTypeDto> responseTypeList;

    public ExpectedResponseDto() {
    }

    public ExpectedResponseDto(String text, List<ResponseTypeDto> responseTypeList) {
        this.text = text;
        this.responseTypeList = responseTypeList;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<ResponseTypeDto> getResponseTypeList() {
        return responseTypeList;
    }

    public void setResponseTypeList(List<ResponseTypeDto> responseTypeList) {
        this.responseTypeList = responseTypeList;
    }
}
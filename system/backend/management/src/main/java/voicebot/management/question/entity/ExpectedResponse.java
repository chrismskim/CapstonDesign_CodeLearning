package voicebot.management.question.entity;

import org.springframework.data.mongodb.core.mapping.Field;
import java.util.List;

public class ExpectedResponse {

    private String text; // 예상 답변 내용

    @Field("response_type_list")
    private List<ResponseType> responseTypeList;

    // Manual Getters and Setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<ResponseType> getResponseTypeList() {
        return responseTypeList;
    }

    public void setResponseTypeList(List<ResponseType> responseTypeList) {
        this.responseTypeList = responseTypeList;
    }
}

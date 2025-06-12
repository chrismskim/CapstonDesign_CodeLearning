package voicebot.management.question.entity;

import org.springframework.data.mongodb.core.mapping.Field;

public class ResponseType {

    @Field("response_type")
    private int responseType; // 답변(위기, 욕구) 타입

    @Field("response_index")
    private int responseIndex; // 답변 코드

    // Manual Getters and Setters
    public int getResponseType() {
        return responseType;
    }

    public void setResponseType(int responseType) {
        this.responseType = responseType;
    }

    public int getResponseIndex() {
        return responseIndex;
    }

    public void setResponseIndex(int responseIndex) {
        this.responseIndex = responseIndex;
    }
} 
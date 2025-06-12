package voicebot.management.vulnerable.dto;

import java.util.List;

public class DesireDto {
    private List<Integer> desireType;
    private String content;

    // Manual Getters and Setters
    public List<Integer> getDesireType() {
        return desireType;
    }

    public void setDesireType(List<Integer> desireType) {
        this.desireType = desireType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 
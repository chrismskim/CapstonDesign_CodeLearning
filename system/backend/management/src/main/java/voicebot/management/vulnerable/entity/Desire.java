package voicebot.management.vulnerable.entity;

import java.util.List;

public class Desire {
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
package voicebot.management.vulnerable.entity;

import java.util.List;

public class Risk {
    private List<Integer> riskType;
    private String content;

    // Manual Getters and Setters
    public List<Integer> getRiskType() {
        return riskType;
    }

    public void setRiskType(List<Integer> riskType) {
        this.riskType = riskType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 
package voicebot.management.vulnerable.entity;

import java.util.List;

public class Vulnerabilities {
    private String summary;
    private List<Risk> riskList;
    private List<Desire> desireList;

    // Manual Getters and Setters
    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<Risk> getRiskList() {
        return riskList;
    }

    public void setRiskList(List<Risk> riskList) {
        this.riskList = riskList;
    }

    public List<Desire> getDesireList() {
        return desireList;
    }

    public void setDesireList(List<Desire> desireList) {
        this.desireList = desireList;
    }
} 
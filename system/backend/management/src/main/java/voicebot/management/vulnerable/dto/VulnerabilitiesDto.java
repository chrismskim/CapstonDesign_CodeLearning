package voicebot.management.vulnerable.dto;

import java.util.List;

public class VulnerabilitiesDto {
    private String summary;
    private List<RiskDto> riskList;
    private List<DesireDto> desireList;

    // Manual Getters and Setters
    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<RiskDto> getRiskList() {
        return riskList;
    }

    public void setRiskList(List<RiskDto> riskList) {
        this.riskList = riskList;
    }

    public List<DesireDto> getDesireList() {
        return desireList;
    }

    public void setDesireList(List<DesireDto> desireList) {
        this.desireList = desireList;
    }
} 
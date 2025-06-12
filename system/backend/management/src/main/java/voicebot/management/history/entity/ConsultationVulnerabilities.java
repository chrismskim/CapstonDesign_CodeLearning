package voicebot.management.history.entity;

import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;
import java.util.Map;

public class ConsultationVulnerabilities {
    @Field("risk_list")
    private List<ConsultationRisk> riskList;

    @Field("desire_list")
    private List<ConsultationDesire> desireList;

    @Field("risk_index_count")
    private Map<String, Integer> riskIndexCount;

    @Field("desire_index_count")
    private Map<String, Integer> desireIndexCount;

    // Manual Getters and Setters
    public List<ConsultationRisk> getRiskList() {
        return riskList;
    }

    public void setRiskList(List<ConsultationRisk> riskList) {
        this.riskList = riskList;
    }

    public List<ConsultationDesire> getDesireList() {
        return desireList;
    }

    public void setDesireList(List<ConsultationDesire> desireList) {
        this.desireList = desireList;
    }

    public Map<String, Integer> getRiskIndexCount() {
        return riskIndexCount;
    }

    public void setRiskIndexCount(Map<String, Integer> riskIndexCount) {
        this.riskIndexCount = riskIndexCount;
    }

    public Map<String, Integer> getDesireIndexCount() {
        return desireIndexCount;
    }

    public void setDesireIndexCount(Map<String, Integer> desireIndexCount) {
        this.desireIndexCount = desireIndexCount;
    }
} 
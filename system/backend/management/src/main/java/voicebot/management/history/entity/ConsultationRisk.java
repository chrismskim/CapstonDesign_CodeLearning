package voicebot.management.history.entity;

import org.springframework.data.mongodb.core.mapping.Field;
import java.util.List;

public class ConsultationRisk {
    @Field("risk_index_list")
    private List<Integer> riskIndexList;
    private String content;

    // Manual Getters and Setters
    public List<Integer> getRiskIndexList() {
        return riskIndexList;
    }

    public void setRiskIndexList(List<Integer> riskIndexList) {
        this.riskIndexList = riskIndexList;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 
package voicebot.management.call.dto;

import java.util.List;

public class QueueBatchRequest {
    private List<String> vulnerableIds;
    private String questionsId;

    // Manual Getters and Setters
    public List<String> getVulnerableIds() { return vulnerableIds; }
    public void setVulnerableIds(List<String> vulnerableIds) { this.vulnerableIds = vulnerableIds; }
    public String getQuestionsId() { return questionsId; }
    public void setQuestionsId(String questionsId) { this.questionsId = questionsId; }
} 
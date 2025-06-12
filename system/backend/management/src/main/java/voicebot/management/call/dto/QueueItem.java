package voicebot.management.call.dto;

import java.time.LocalDateTime;

public class QueueItem {
    private String queueId;
    private String vulnerableId;
    private String questionsId;
    private String state; // WAITING | IN_PROGRESS | COMPLETED | FAILED
    private LocalDateTime createdTime;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Getters and Setters
    public String getQueueId() {
        return queueId;
    }

    public void setQueueId(String queueId) {
        this.queueId = queueId;
    }

    public String getVulnerableId() {
        return vulnerableId;
    }

    public void setVulnerableId(String vulnerableId) {
        this.vulnerableId = vulnerableId;
    }

    public String getQuestionsId() {
        return questionsId;
    }

    public void setQuestionsId(String questionsId) {
        this.questionsId = questionsId;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public LocalDateTime getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
} 
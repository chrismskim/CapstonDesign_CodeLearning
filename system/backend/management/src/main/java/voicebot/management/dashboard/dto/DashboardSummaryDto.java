package voicebot.management.dashboard.dto;

import java.util.Map;

public class DashboardSummaryDto {
    private long totalVulnerableCount;
    private long todayConsultationCount;
    private long totalConsultationCount;
    private Map<String, Long> consultationResultRatio;
    private Map<String, Long> topCrisisTypes;
    private Map<String, Long> topDesireTypes;

    // Getters and Setters
    public long getTotalVulnerableCount() { return totalVulnerableCount; }
    public void setTotalVulnerableCount(long totalVulnerableCount) { this.totalVulnerableCount = totalVulnerableCount; }
    public long getTodayConsultationCount() { return todayConsultationCount; }
    public void setTodayConsultationCount(long todayConsultationCount) { this.todayConsultationCount = todayConsultationCount; }
    public long getTotalConsultationCount() { return totalConsultationCount; }
    public void setTotalConsultationCount(long totalConsultationCount) { this.totalConsultationCount = totalConsultationCount; }
    public Map<String, Long> getConsultationResultRatio() { return consultationResultRatio; }
    public void setConsultationResultRatio(Map<String, Long> consultationResultRatio) { this.consultationResultRatio = consultationResultRatio; }
    public Map<String, Long> getTopCrisisTypes() { return topCrisisTypes; }
    public void setTopCrisisTypes(Map<String, Long> topCrisisTypes) { this.topCrisisTypes = topCrisisTypes; }
    public Map<String, Long> getTopDesireTypes() { return topDesireTypes; }
    public void setTopDesireTypes(Map<String, Long> topDesireTypes) { this.topDesireTypes = topDesireTypes; }
} 
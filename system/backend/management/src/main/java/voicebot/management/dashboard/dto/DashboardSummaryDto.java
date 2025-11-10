package voicebot.management.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DashboardSummaryDto {
    private long totalVulnerableCount;
    private long todayConsultationCount;
    private long totalConsultationCount;
    private Map<String, Long> consultationResultRatio;
    private Map<String, Long> topCrisisTypes;
    private Map<String, Long> topDesireTypes;
} 
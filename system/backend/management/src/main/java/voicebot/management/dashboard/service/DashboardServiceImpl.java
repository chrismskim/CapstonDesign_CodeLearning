package voicebot.management.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import voicebot.management.dashboard.dto.DashboardSummaryDto;
import voicebot.management.history.repository.ConsultationRepository;
import voicebot.management.vulnerable.repository.VulnerableRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Map;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final VulnerableRepository vulnerableRepository;
    private final ConsultationRepository consultationRepository;

    @Override
    public DashboardSummaryDto getDashboardSummary() {
        long totalVulnerableCount = vulnerableRepository.count();
        long totalConsultationCount = consultationRepository.count();

        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        long todayConsultationCount = consultationRepository.countByTimeBetween(todayStart, todayEnd);

        // TODO: Implement actual aggregation queries for chart data
        Map<String, Long> consultationResultRatio = Map.of("상담 필요", 15L, "상담 불필요", 75L, "상담 불가", 10L);
        Map<String, Long> topCrisisTypes = Map.of("주거위기", 25L, "고용위기", 20L, "건강위기", 15L);
        Map<String, Long> topDesireTypes = Map.of("안전", 30L, "건강", 25L, "경제", 20L);

        return DashboardSummaryDto.builder()
                .totalVulnerableCount(totalVulnerableCount)
                .totalConsultationCount(totalConsultationCount)
                .todayConsultationCount(todayConsultationCount)
                .consultationResultRatio(consultationResultRatio)
                .topCrisisTypes(topCrisisTypes)
                .topDesireTypes(topDesireTypes)
                .build();
    }
} 
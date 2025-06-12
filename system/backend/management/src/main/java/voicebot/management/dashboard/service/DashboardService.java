package voicebot.management.dashboard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.repository.ConsultationRepository;
import voicebot.management.vulnerable.repository.VulnerableRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VulnerableRepository vulnerableRepository;
    private final ConsultationRepository consultationRepository;

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();

        // 1. 총 취약 계층 수
        summary.put("totalVulnerables", vulnerableRepository.count());

        // 2. 오늘 상담 건수
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);
        summary.put("todayConsultations", consultationRepository.countByTimeBetween(startOfToday, endOfToday));

        // 3. 누적 상담 건수
        summary.put("totalConsultations", consultationRepository.count());

        // 4. 전체 상담 데이터 조회
        List<Consultation> allConsultations = consultationRepository.findAll();

        // 5. 상담 결과 통계 (result 필드 사용)
        Map<String, Long> consultationResultStats = allConsultations.stream()
                .collect(Collectors.groupingBy(c -> String.valueOf(c.getResult()), Collectors.counting()));
        summary.put("consultationResultStats", consultationResultStats);

        // 6. 주요 위기 유형 (상위 5개) (getRiskIndexList 사용)
        Map<String, Long> topRiskTypes = allConsultations.stream()
                .filter(c -> c.getResultVulnerabilities() != null && c.getResultVulnerabilities().getRiskList() != null)
                .flatMap(c -> c.getResultVulnerabilities().getRiskList().stream())
                .filter(risk -> risk != null && risk.getRiskIndexList() != null)
                .flatMap(risk -> risk.getRiskIndexList().stream())
                .collect(Collectors.groupingBy(String::valueOf, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, HashMap::new));
        summary.put("topRiskTypes", topRiskTypes);

        // 7. 주요 욕구 유형 (상위 5개) (getDesireIndexList 사용)
        Map<String, Long> topDesireTypes = allConsultations.stream()
                .filter(c -> c.getResultVulnerabilities() != null && c.getResultVulnerabilities().getDesireList() != null)
                .flatMap(c -> c.getResultVulnerabilities().getDesireList().stream())
                .filter(desire -> desire != null && desire.getDesireIndexList() != null)
                .flatMap(desire -> desire.getDesireIndexList().stream())
                .collect(Collectors.groupingBy(String::valueOf, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, HashMap::new));
        summary.put("topDesireTypes", topDesireTypes);

        return summary;
    }
} 
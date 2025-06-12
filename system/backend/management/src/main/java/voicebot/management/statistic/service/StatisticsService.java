package voicebot.management.statistic.service;

import org.springframework.stereotype.Service;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.entity.ConsultationSession;
import voicebot.management.history.repository.ConsultationRepository;
import voicebot.management.history.repository.ConsultationSessionRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final ConsultationRepository consultationRepository;
    private final ConsultationSessionRepository sessionRepository;

    public StatisticsService(ConsultationRepository consultationRepository, ConsultationSessionRepository sessionRepository) {
        this.consultationRepository = consultationRepository;
        this.sessionRepository = sessionRepository;
    }

    public List<ConsultationSession> getAllSessions() {
        return sessionRepository.findAll();
    }

    public Map<String, Object> aggregateStatistics(String index) {
        List<Consultation> consultations;
        if ("all".equalsIgnoreCase(index)) {
            consultations = consultationRepository.findAllByDeletedIsFalse();
        } else {
            int sessionIndex = Integer.parseInt(index);
            consultations = consultationRepository.findBySessionIndexAndDeletedIsFalse(sessionIndex);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total_consultations", consultations.size());

        stats.put("deep_counseling_target", consultations.stream().filter(c -> c.getResult() == 2).count());
        stats.put("non_target", consultations.stream().filter(c -> c.getResult() == 1).count());
        stats.put("counseling_unavailable", consultations.stream().filter(c -> c.getResult() == 0).count());
        
        stats.put("request_counseling_count", consultations.stream().filter(c -> c.getNeedHuman() == 1).count());
        stats.put("critical_vulnerability_count", consultations.stream().filter(c -> c.getNeedHuman() == 2).count());

        // 위기 정보별 통계
        Map<String, Long> crisisInfo = consultations.stream()
                .filter(c -> c.getResultVulnerabilities() != null && c.getResultVulnerabilities().getRiskIndexCount() != null)
                .flatMap(c -> c.getResultVulnerabilities().getRiskIndexCount().entrySet().stream())
                .collect(Collectors.groupingBy(entry -> entry.getKey(), Collectors.summingLong(entry -> entry.getValue())));

        // 욕구 정보별 통계
        Map<String, Long> desireInfo = consultations.stream()
                .filter(c -> c.getResultVulnerabilities() != null && c.getResultVulnerabilities().getDesireIndexCount() != null)
                .flatMap(c -> c.getResultVulnerabilities().getDesireIndexCount().entrySet().stream())
                .collect(Collectors.groupingBy(entry -> entry.getKey(), Collectors.summingLong(entry -> entry.getValue())));

        stats.put("crisis_info", crisisInfo);
        stats.put("desire_info", desireInfo);

        return stats;
    }
} 
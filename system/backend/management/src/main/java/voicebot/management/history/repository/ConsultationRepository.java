package voicebot.management.history.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import voicebot.management.history.entity.Consultation;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends MongoRepository<Consultation, String> {

    // 삭제되지 않은 특정 상담 내역 조회
    Optional<Consultation> findByIdAndDeletedIsFalse(String id);

    // 삭제되지 않은 모든 상담 내역 조회
    List<Consultation> findAllByDeletedIsFalse();

    // 특정 취약계층의 삭제되지 않은 모든 상담 내역 조회
    List<Consultation> findByVulnerableIdAndDeletedIsFalse(String vulnerableId);

    List<Consultation> findBySessionIndexAndDeletedIsFalse(int sessionIndex);

    long countByDeletedIsFalse();

    long countByTimeAfterAndDeletedIsFalse(LocalDateTime startTime);

    long countByTimeBetween(LocalDateTime start, LocalDateTime end);
}
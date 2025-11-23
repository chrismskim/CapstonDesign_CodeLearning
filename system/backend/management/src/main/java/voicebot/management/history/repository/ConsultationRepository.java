package voicebot.management.history.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import voicebot.management.history.entity.Consultation;

import java.time.LocalDateTime;

@Repository
public interface ConsultationRepository extends MongoRepository<Consultation, String> {
    long countByTimeBetween(LocalDateTime todayStart, LocalDateTime todayEnd);
}

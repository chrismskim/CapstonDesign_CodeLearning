package voicebot.management.history.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import voicebot.management.history.entity.ConsultationSession;

@Repository
public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, Integer> {
} 
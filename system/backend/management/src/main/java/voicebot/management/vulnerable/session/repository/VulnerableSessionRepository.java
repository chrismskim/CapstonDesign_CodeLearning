package voicebot.management.vulnerable.session.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import voicebot.management.vulnerable.session.entity.VulnerableSession;

public interface VulnerableSessionRepository extends JpaRepository<VulnerableSession, String> {
} 
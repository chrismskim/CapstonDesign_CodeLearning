package voicebot.management.vulnerable.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import voicebot.management.vulnerable.entity.Vulnerable;

public interface VulnerableRepository extends MongoRepository<Vulnerable, String> {
}


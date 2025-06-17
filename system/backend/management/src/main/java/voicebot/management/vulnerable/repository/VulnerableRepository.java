package voicebot.management.vulnerable.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import voicebot.management.vulnerable.entity.Vulnerable;

import java.util.List;

public interface VulnerableRepository extends MongoRepository<Vulnerable, String> {
    List<Vulnerable> findByNameContaining(String name);
}


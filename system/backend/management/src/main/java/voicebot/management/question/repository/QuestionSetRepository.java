package voicebot.management.question.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import voicebot.management.question.entity.QuestionSet;

public interface QuestionSetRepository extends MongoRepository<QuestionSet, String> {
}
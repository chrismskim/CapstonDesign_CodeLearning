package voicebot.management.question.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import voicebot.management.question.entity.QuestionSet;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, String> {
}

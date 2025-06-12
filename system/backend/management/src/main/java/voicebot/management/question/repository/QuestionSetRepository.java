package voicebot.management.question.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import voicebot.management.question.entity.QuestionSet;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionSetRepository extends MongoRepository<QuestionSet, String> {

    // 삭제되지 않은 특정 질문 세트 조회
    Optional<QuestionSet> findByQuestionsIdAndDeletedIsFalse(String questionsId);

    // 삭제되지 않은 모든 질문 세트 조회
    List<QuestionSet> findAllByDeletedIsFalse();
}

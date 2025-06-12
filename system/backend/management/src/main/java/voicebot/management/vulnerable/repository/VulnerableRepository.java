package voicebot.management.vulnerable.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import voicebot.management.vulnerable.entity.Vulnerable;

import java.util.List;
import java.util.Optional;

@Repository
public interface VulnerableRepository extends MongoRepository<Vulnerable, String> {

    // 삭제되지 않은 특정 사용자 조회
    Optional<Vulnerable> findByUserIdAndDeletedIsFalse(String userId);

    // 삭제되지 않은 모든 사용자 조회
    List<Vulnerable> findAllByDeletedIsFalse();

    // userId 존재 여부 확인 (삭제된 사용자 포함)
    boolean existsByUserId(String userId);

    // 삭제되지 않은 취약 계층의 총 인원 수 조회
    long countByDeletedIsFalse();
}

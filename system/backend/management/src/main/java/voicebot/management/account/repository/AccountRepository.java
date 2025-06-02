package voicebot.management.account.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import voicebot.management.account.entity.Account;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUserId(String userId);
    boolean existsByUserId(String userId);
} 
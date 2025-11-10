package voicebot.management.account.bootstrap;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import voicebot.management.account.entity.Account;
import voicebot.management.account.repository.AccountRepository;

@Component @RequiredArgsConstructor
public class RootSeeder implements CommandLineRunner {

    private final AccountRepository repo; private final BCryptPasswordEncoder encoder;

    @Override public void run(String... args) {
        String rootId = System.getenv().getOrDefault("ROOT_ID", "admin");
        String rootPw = System.getenv().getOrDefault("ROOT_PW", "12345678");
        if (!repo.existsByUserId(rootId)) {
            Account a = new Account();
            a.setUserId(rootId);
            a.setPassword(encoder.encode(rootPw));
            a.setEmail("root@example.com");
            a.setPhoneNumber("010-0000-0000");
            a.setRoot(true);
            a.setApproved(true);
            repo.save(a);
            System.out.println("== ROOT ADMIN CREATED: " + rootId + " ==");
        }
    }
}

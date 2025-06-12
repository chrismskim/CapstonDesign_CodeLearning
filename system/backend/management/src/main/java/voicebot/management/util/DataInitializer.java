package voicebot.management.util;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import voicebot.management.account.entity.Account;
import voicebot.management.account.repository.AccountRepository;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 루트 관리자 계정 생성 (존재하지 않을 경우)
        if (accountRepository.findByUserId("rootadmin").isEmpty()) {
            Account rootAdmin = new Account();
            rootAdmin.setId(UUID.randomUUID().toString());
            rootAdmin.setUserId("rootadmin");
            rootAdmin.setPassword(passwordEncoder.encode("password123"));
            rootAdmin.setEmail("root@example.com");
            rootAdmin.setPhoneNumber("010-0000-0000");
            rootAdmin.setRoot(true);
            rootAdmin.setApproved(true);
            accountRepository.save(rootAdmin);
            System.out.println("Created root admin account: rootadmin / password123");
        }

        // 일반 관리자 계정 생성 (존재하지 않을 경우)
        if (accountRepository.findByUserId("testadmin").isEmpty()) {
            Account testAdmin = new Account();
            testAdmin.setId(UUID.randomUUID().toString());
            testAdmin.setUserId("testadmin");
            testAdmin.setPassword(passwordEncoder.encode("password123"));
            testAdmin.setEmail("test@example.com");
            testAdmin.setPhoneNumber("010-1234-5678");
            testAdmin.setRoot(false);
            testAdmin.setApproved(true);
            accountRepository.save(testAdmin);
            System.out.println("Created test admin account: testadmin / password123");
        }
    }
} 
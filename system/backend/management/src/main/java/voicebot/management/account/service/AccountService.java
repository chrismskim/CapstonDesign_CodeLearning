package voicebot.management.account.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import voicebot.management.account.dto.AccountDTO;
import voicebot.management.account.dto.LoginRequestDTO;
import voicebot.management.account.dto.LoginResponseDTO;
import voicebot.management.account.entity.Account;
import voicebot.management.account.repository.AccountRepository;
import voicebot.management.account.util.JwtUtil;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Transactional
    public AccountDTO authenticate(String userId, String password) throws AuthenticationException {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userId, password)
        );
        Account account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Authenticate passed but user not found"));
        return convertToDTO(account);
    }

    @Transactional
    public void logout(String token) {
        tokenBlacklistService.blacklistToken(token);
    }

    @Transactional
    public AccountDTO register(AccountDTO accountDTO) {
        if (accountRepository.existsByUserId(accountDTO.getUserId())) {
            throw new RuntimeException("이미 존재하는 사용자 ID입니다.");
        }

        Account account = new Account();
        account.setId(UUID.randomUUID().toString());
        account.setUserId(accountDTO.getUserId());
        account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        account.setPhoneNumber(accountDTO.getPhoneNumber());
        account.setEmail(accountDTO.getEmail());

        // 'rootadmin' 사용자는 항상 루트 권한을 가지며 자동으로 승인됩니다.
        if ("rootadmin".equals(accountDTO.getUserId())) {
            account.setRoot(true);
            account.setApproved(true);
        } else {
            // 그 외의 경우, 첫 가입자인지 확인하여 루트 권한 부여
            boolean isFirstUser = accountRepository.count() == 0;
            account.setRoot(isFirstUser);
            account.setApproved(isFirstUser); // 첫 사용자는 바로 승인
        }

        Account savedAccount = accountRepository.save(account);
        return convertToDTO(savedAccount);
    }

    @Transactional(readOnly = true)
    public AccountDTO getAccountInfo(String userId) {
        Account account = accountRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return convertToDTO(account);
    }

    @Transactional
    public AccountDTO updateAccount(String userId, AccountDTO accountDTO) {
        Account account = accountRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (accountDTO.getPassword() != null && !accountDTO.getPassword().isEmpty()) {
            account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        }
        if (accountDTO.getPhoneNumber() != null) {
            account.setPhoneNumber(accountDTO.getPhoneNumber());
        }
        if (accountDTO.getEmail() != null) {
            account.setEmail(accountDTO.getEmail());
        }

        Account updatedAccount = accountRepository.save(account);
        return convertToDTO(updatedAccount);
    }

    private AccountDTO convertToDTO(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setUserId(account.getUserId());
        dto.setPhoneNumber(account.getPhoneNumber());
        dto.setEmail(account.getEmail());
        dto.setRoot(account.isRoot());
        dto.setApproved(account.isApproved());
        return dto;
    }
} 
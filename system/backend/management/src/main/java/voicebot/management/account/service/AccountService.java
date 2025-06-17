package voicebot.management.account.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUserId(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);

        return new LoginResponseDTO(token, request.getUserId());
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
        account.setUserId(accountDTO.getUserId());
        account.setPassword(passwordEncoder.encode(accountDTO.getPassword()));
        account.setPhoneNumber(accountDTO.getPhoneNumber());
        account.setEmail(accountDTO.getEmail());

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
        return dto;
    }
} 
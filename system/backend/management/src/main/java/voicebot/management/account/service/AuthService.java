package voicebot.management.account.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import voicebot.management.account.dto.*;
import voicebot.management.account.entity.Account;
import voicebot.management.account.repository.AccountRepository;
import voicebot.management.security.JwtProvider;

import java.util.List;

@Service @RequiredArgsConstructor
public class AuthService {

    private final AccountRepository repo;
    private final BCryptPasswordEncoder encoder;
    private final JwtProvider jwtProvider;

    @Transactional
    public void register(RegisterRequest req) {
        if (repo.existsByUserId(req.getUserId()))
            throw new IllegalArgumentException("이미 존재하는 user_id 입니다.");

        Account a = new Account();
        a.setUserId(req.getUserId());
        a.setPassword(encoder.encode(req.getPassword()));
        a.setEmail(req.getEmail());
        a.setPhoneNumber(req.getPhoneNumber());
        a.setApproved(false);
        a.setRoot(false);
        repo.save(a);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest req) {
        Account a = repo.findByUserId(req.getUserId())
                .orElseThrow(() -> new RuntimeException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!a.isApproved())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "승인 대기 중인 계정입니다.");

        if (!encoder.matches(req.getPassword(), a.getPassword()))
            throw new RuntimeException("아이디 또는 비밀번호가 올바르지 않습니다.");

        String access = jwtProvider.createAccessToken(a.getUserId(), a.isRoot());
        String refresh = jwtProvider.createRefreshToken(a.getUserId());
        return new TokenResponse(true, access, refresh);
    }

    @Transactional(readOnly = true)
    public AccountDto me(String userId) {
        Account a = repo.findByUserId(userId).orElseThrow();
        return toDto(a);
    }

    @Transactional
    public void updateContact(String userId, UpdateContactRequest req) {
        Account a = repo.findByUserId(userId).orElseThrow();
        a.setEmail(req.getEmail());
        a.setPhoneNumber(req.getPhoneNumber());
    }
    @Transactional(readOnly = true)
    public List<PendingAccountDto> getPendingAccounts() {
        return repo.findByIsApprovedFalseOrderByCreatedAtAsc()
                .stream()
                .map(a -> new PendingAccountDto(
                        a.getId(),
                        a.getUserId(),
                        a.getEmail(),
                        a.getPhoneNumber(),
                        a.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest req) {
        Account a = repo.findByUserId(userId).orElseThrow();
        if (!encoder.matches(req.getCurrentPassword(), a.getPassword()))
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        a.setPassword(encoder.encode(req.getNewPassword()));
    }

    @Transactional
    public void approveOrReject(String rootUserId, ApproveRequest req) {
        Account target = repo.findByUserId(req.getUserId())
                .orElseThrow(() -> new RuntimeException("계정을 찾을 수 없습니다."));
        if (req.isApprove()) {
            target.setApproved(true);
        } else {
            repo.delete(target);
        }
    }

    private AccountDto toDto(Account a) {
        return new AccountDto(a.getUserId(), a.isRoot(), a.isApproved(), a.getEmail(), a.getPhoneNumber());
    }
}

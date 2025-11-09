package voicebot.management.account.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import voicebot.management.account.dto.*;
import voicebot.management.account.entity.Account;
import voicebot.management.account.service.AuthService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AccountController {

    private final AuthService authService;

    @PostMapping("/account/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok().body(
                java.util.Map.of("success", true, "message", "가입 요청이 접수되었습니다. 관리자 승인 대기 중입니다.")
        );
    }

    @PostMapping("/auth/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/account/me")
    public ResponseEntity<AccountDto> me(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(authService.me(userId));
    }

    @PutMapping("/account/contact")
    public ResponseEntity<?> updateContact(@AuthenticationPrincipal String userId,
                                           @Valid @RequestBody UpdateContactRequest req) {
        authService.updateContact(userId, req);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @PutMapping("/account/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal String userId,
                                            @Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(userId, req);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @GetMapping("/account/pending")
    public ResponseEntity<?> getPendingAccounts() {
        return ResponseEntity.ok(authService.getPendingAccounts());
    }

    @PostMapping("/account/approve")
    public ResponseEntity<?> approve(@AuthenticationPrincipal String rootUserId,
                                     @Valid @RequestBody ApproveRequest req) {
        authService.approveOrReject(rootUserId, req);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }
}

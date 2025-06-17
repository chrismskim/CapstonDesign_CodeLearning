package voicebot.management.account.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import voicebot.management.account.dto.AccountDTO;
import voicebot.management.account.dto.LoginRequestDTO;
import voicebot.management.account.dto.LoginResponseDTO;
import voicebot.management.account.service.AccountService;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(accountService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
        accountService.logout(token.substring(7)); // "Bearer " 제거
        return ResponseEntity.ok().build();
    }

    @PostMapping("/add")
    public ResponseEntity<AccountDTO> register(@Valid @RequestBody AccountDTO accountDTO) {
        return ResponseEntity.ok(accountService.register(accountDTO));
    }

    @PostMapping("/info")
    public ResponseEntity<AccountDTO> getAccountInfo(Authentication authentication) {
        return ResponseEntity.ok(accountService.getAccountInfo(authentication.getName()));
    }

    @PutMapping("/change")
    public ResponseEntity<AccountDTO> updateAccount(
            Authentication authentication,
            @Valid @RequestBody AccountDTO accountDTO) {
        return ResponseEntity.ok(accountService.updateAccount(authentication.getName(), accountDTO));
    }
} 
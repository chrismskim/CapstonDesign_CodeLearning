package voicebot.management.account.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import voicebot.management.account.dto.AccountDTO;
import voicebot.management.account.service.AccountService;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
        accountService.logout(token.substring(7)); // "Bearer " 제거
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AccountDTO> getMyAccountInfo(Authentication authentication) {
        return ResponseEntity.ok(accountService.getAccountInfo(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<AccountDTO> updateMyAccount(
            Authentication authentication,
            @Valid @RequestBody AccountDTO accountDto) {
        return ResponseEntity.ok(accountService.updateAccount(authentication.getName(), accountDto));
    }
} 
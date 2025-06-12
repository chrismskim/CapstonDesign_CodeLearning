package voicebot.management.account.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import voicebot.management.account.dto.AccountDTO;
import voicebot.management.account.dto.LoginRequestDTO;
import voicebot.management.account.service.AccountService;
import voicebot.management.account.util.JwtUtil;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AccountService accountService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        try {
            AccountDTO account = accountService.authenticate(loginRequest.getUserId(), loginRequest.getPassword());

            if (!account.isApproved()) {
                // 승인되지 않은 경우 -> 403 Forbidden 반환
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "관리자 승인 대기 중입니다."));
            }

            List<GrantedAuthority> authorities = new ArrayList<>();
            if (account.isRoot()) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ROOT"));
            } else {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }

            UserDetails userDetails = new User(account.getUserId(), "", authorities);
            String token = jwtUtil.generateToken(userDetails);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", token,
                    "account", account
            ));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "아이디 또는 비밀번호가 일치하지 않습니다"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AccountDTO accountDto) {
        AccountDTO registeredAccount = accountService.register(accountDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "가입 요청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다."));
    }
} 
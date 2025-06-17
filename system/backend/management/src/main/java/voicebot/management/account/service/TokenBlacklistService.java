package voicebot.management.account.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {
    private final ConcurrentHashMap<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token) {
        blacklistedTokens.put(token, System.currentTimeMillis());
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.containsKey(token);
    }

    // 주기적으로 만료된 토큰을 정리하는 메서드 (선택적)
    public void cleanupExpiredTokens() {
        long currentTime = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> 
            currentTime - entry.getValue() > 24 * 60 * 60 * 1000); // 24시간
    }
} 
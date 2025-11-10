package voicebot.management.account.dto;
import java.time.LocalDateTime;

public record PendingAccountDto(
        Long id,
        String userId,
        String email,
        String phoneNumber,
        LocalDateTime createdAt
) {}

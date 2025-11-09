package voicebot.management.account.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class TokenResponse {
    private boolean success;
    private String accessToken;
    private String refreshToken;
}

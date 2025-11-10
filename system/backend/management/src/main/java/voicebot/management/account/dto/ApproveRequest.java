package voicebot.management.account.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApproveRequest {
    @NotBlank
    private String userId;
    private boolean approve;
}

package voicebot.management.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountDTO {
    @NotBlank
    @Size(max = 20)
    private String userId;

    @NotBlank
    @Size(max = 16)
    private String password;

    @NotBlank
    private String phoneNumber;

    @Email
    @NotBlank
    private String email;
} 
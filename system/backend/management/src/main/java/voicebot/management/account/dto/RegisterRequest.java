package voicebot.management.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank
    @Size(min=5, max=20)
    private String userId;
    @NotBlank @Size(min=8, max=64)
    private String password;
    @Email
    @NotBlank
    private String email;
    private String phoneNumber;
}

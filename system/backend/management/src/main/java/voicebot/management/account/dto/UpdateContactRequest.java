package voicebot.management.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateContactRequest {
    @Email
    @NotBlank
    private String email;
    private String phoneNumber;
}

package voicebot.management.account.dto;

import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class AccountDto {
    private String userId;
    private boolean isRoot;
    private boolean isApproved;
    private String email;
    private String phoneNumber;
}


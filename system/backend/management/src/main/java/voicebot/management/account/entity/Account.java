package voicebot.management.account.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter; import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="account")
@Getter @Setter
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(min=5, max=20)
    @Column(name="user_id", unique = true, nullable = false, length = 20)
    private String userId;

    @NotBlank
    private String password;

    @Email @NotBlank
    @Column(length = 100)
    private String email;

    @Column(name="phone_number", length=20)
    private String phoneNumber;

    @Column(name="is_root", nullable=false)
    private boolean isRoot = false;

    @Column(name="is_approved", nullable=false)
    private boolean isApproved = false;

    @Column(name="created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}

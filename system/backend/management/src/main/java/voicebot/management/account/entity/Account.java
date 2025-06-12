package voicebot.management.account.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "Account")
@SQLDelete(sql = "UPDATE Account SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Account {
    @Id
    private String id;

    @NotBlank
    @Size(min = 5, max = 20)
    @Pattern(regexp = "^[a-z0-9_-]*[a-z]+[a-z0-9_-]*$")
    @Column(unique = true, nullable = false)
    private String userId;

    private String password;

    private String phoneNumber;

    @Email
    private String email;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isRoot;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean isApproved;

    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean deleted = false;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isRoot() {
        return isRoot;
    }

    public void setRoot(boolean root) {
        isRoot = root;
    }

    public boolean isApproved() {
        return isApproved;
    }

    public void setApproved(boolean approved) {
        isApproved = approved;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
} 
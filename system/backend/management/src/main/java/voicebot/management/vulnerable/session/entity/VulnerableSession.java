package voicebot.management.vulnerable.session.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vulnerable_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VulnerableSession {

    @Id
    private String vulnerableId; // MongoDB의 vulnerable 도큐먼트의 user_id와 동일한 값

    private int sessionIndex; // 해당 취약계층의 마지막 상담 회차
} 
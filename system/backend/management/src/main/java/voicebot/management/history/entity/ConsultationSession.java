package voicebot.management.history.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "ConsultationSession")
@Getter
@Setter
@SQLDelete(sql = "UPDATE ConsultationSession SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class ConsultationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id; // 상담 회차 고유 ID

    @Column(nullable = false, length = 100)
    private String alias; // 상담 회차 별칭

    private boolean deleted = false; // Soft delete 필드
} 
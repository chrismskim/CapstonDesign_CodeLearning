package voicebot.management.call.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationStatusDto {
    private String vulnerableId;
    private String vulnerableName;
    private String questionSetTitle;
    private String status; // e.g., "WAITING", "IN_PROGRESS", "COMPLETED", "FAILED"
    private String errorMessage;
} 
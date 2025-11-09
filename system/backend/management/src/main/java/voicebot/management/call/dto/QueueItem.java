package voicebot.management.call.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueItem implements Serializable {
    private String queueId;
    private String vulnerableId;
    private String questionSetId;
    private String state; // WAITING, IN_PROGRESS, COMPLETED, FAILED
    private LocalDateTime createdTime;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
} 
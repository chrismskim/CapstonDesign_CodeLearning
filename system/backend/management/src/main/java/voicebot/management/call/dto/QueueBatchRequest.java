package voicebot.management.call.dto;

import lombok.Data;
import java.util.List;

@Data
public class QueueBatchRequest {
    private List<String> vulnerableIds;
    private String questionSetId;
} 
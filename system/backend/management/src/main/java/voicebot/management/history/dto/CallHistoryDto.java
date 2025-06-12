package voicebot.management.history.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CallHistoryDto {
    private String id;
    private String v_name;
    private String q_title;
    private String start_time;
    private String result;
    private int riskCount;
    private int desireCount;
    private int s_index;
} 
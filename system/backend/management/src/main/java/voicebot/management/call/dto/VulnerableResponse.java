package voicebot.management.call.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VulnerableResponse {
    private String userId;
    private String name;
    private String phoneNumber;
    private String address; // 예: "서울특별시 강남구"
} 
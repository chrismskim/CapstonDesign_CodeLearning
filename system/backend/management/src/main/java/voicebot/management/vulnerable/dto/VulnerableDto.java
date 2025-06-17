package voicebot.management.vulnerable.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VulnerableDto {
    private String userId;
    private String name;
    private String gender;
    private LocalDate birthDate;
    private String phoneNumber;
    private AddressDto address;
    private VulnerabilityDto vulnerabilities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddressDto {
        private String state;
        private String city;
        private String address1;
        private String address2;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VulnerabilityDto {
        private String summary;
        private List<RiskDto> riskList;
        private List<DesireDto> desireList;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskDto {
        private List<Integer> riskType;
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DesireDto {
        private List<Integer> desireType;
        private String content;
    }
}

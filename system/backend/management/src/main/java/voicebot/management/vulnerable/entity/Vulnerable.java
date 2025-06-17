package voicebot.management.vulnerable.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "vulnerable")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vulnerable {
    @Id
    private String userId;  // 예: "U20250521"

    private String name;
    private String gender; // "M", "F"
    private LocalDate birthDate;
    private String phoneNumber;

    private Address address;
    private Vulnerability vulnerabilities;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Address {
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
    public static class Vulnerability {
        private String summary;
        private List<Risk> riskList;
        private List<Desire> desireList;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Risk {
        private List<Integer> riskType;
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Desire {
        private List<Integer> desireType;
        private String content;
    }
}
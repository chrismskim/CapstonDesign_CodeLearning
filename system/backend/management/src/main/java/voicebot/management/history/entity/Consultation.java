package voicebot.management.history.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Data
@Document(collection = "consultation")
public class Consultation {

    @Id
    private String id;

    @Field("account_id")
    private String accountId;

    @Field("s_index")
    private int sIndex;

    @Field("v_id")
    private String vulnerableId;

    @Field("q_id")
    private String questionSetId;

    @Field("time")
    private LocalDateTime time;

    @Field("runtime")
    private long runtime;

    @Field("overall_script")
    private String overallScript;

    private String summary;

    // 0 = 상담 불가, 1 = 필요 없음, 2 = 상담 필요
    private int result;

    @Field("fail_code")
    private int failCode;

    @Field("need_human")
    private int needHuman;

    @Field("result_vulnerabilities")
    private VulnerabilityInfo resultVulnerabilities;

    @Field("delete_vulnerabilities")
    private VulnerabilityInfo deleteVulnerabilities;

    @Field("new_vulnerabilities")
    private VulnerabilityInfo newVulnerabilities;


    @Data
    public static class VulnerabilityInfo {
        @Field("risk_list")
        private List<RiskDetail> riskList;

        @Field("desire_list")
        private List<DesireDetail> desireList;

        @Field("risk_index_count")
        private Map<String, Integer> riskIndexCount;

        @Field("desire_index_count")
        private Map<String, Integer> desireIndexCount;
    }

    @Data
    public static class RiskDetail {
        @Field("risk_index_list")
        private List<Integer> riskIndexList;
        private String content;
    }

    @Data
    public static class DesireDetail {
        @Field("desire_index_list")
        private List<Integer> desireIndexList;
        private String content;
    }
} 
package voicebot.management.history.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Document(collection = "consultation")
public class Consultation {

    @Id
    @JsonProperty("id")
    private String id;

    @Field("account_id")
    @JsonProperty("account_id")
    private String accountId;

    @Field("s_index")
    @JsonProperty("s_index")
    private int sIndex;

    @Field("v_id")
    @JsonProperty("v_id")
    private String vulnerableId;

    @Field("q_id")
    @JsonProperty("q_id")
    private String questionSetId;

    @Field("time")
    @JsonProperty("time")
    private LocalDateTime time;

    @Field("runtime")
    @JsonProperty("runtime")
    private long runtime;

    @Field("overall_script")
    @JsonProperty("overall_script")
    private String overallScript;

    @JsonProperty("summary")
    private String summary;

    // 0 = 상담 불가, 1 = 필요 없음, 2 = 상담 필요
    @JsonProperty("result")
    private int result;

    @Field("fail_code")
    @JsonProperty("fail_code")
    private int failCode;

    @Field("need_human")
    @JsonProperty("need_human")
    private int needHuman;

    @Field("result_vulnerabilities")
    @JsonProperty("result_vulnerabilities")
    private VulnerabilityInfo resultVulnerabilities;

    @Field("delete_vulnerabilities")
    @JsonProperty("delete_vulnerabilities")
    private VulnerabilityInfo deleteVulnerabilities;

    @Field("new_vulnerabilities")
    @JsonProperty("new_vulnerabilities")
    private VulnerabilityInfo newVulnerabilities;


    @Data
    public static class VulnerabilityInfo {

        @Field("risk_list")
        @JsonProperty("risk_list")
        private List<RiskDetail> riskList;

        @Field("desire_list")
        @JsonProperty("desire_list")
        private List<DesireDetail> desireList;

        @Field("risk_index_count")
        @JsonProperty("risk_index_count")
        private Map<String, Integer> riskIndexCount;

        @Field("desire_index_count")
        @JsonProperty("desire_index_count")
        private Map<String, Integer> desireIndexCount;
    }

    @Data
    public static class RiskDetail {

        @Field("risk_index_list")
        @JsonProperty("risk_index_list")
        private List<Integer> riskIndexList;

        @JsonProperty("content")
        private String content;
    }

    @Data
    public static class DesireDetail {

        @Field("desire_index_list")
        @JsonProperty("desire_index_list")
        private List<Integer> desireIndexList;

        @JsonProperty("content")
        private String content;
    }
}

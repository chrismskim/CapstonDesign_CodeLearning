package voicebot.management.call.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import voicebot.management.history.entity.Consultation;

import java.util.Map;

/**
 * Calling Orchestrator → Spring 으로 전달되는 LLM 상담 결과 DTO
 * FastAPI에서 내려주는 JSON 구조에 맞춰서 사용.
 */
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class LlmResultDto {

    @JsonProperty("account_id")
    private String accountId;

    @JsonProperty("s_index")
    private Integer sessionIndex;

    @JsonProperty("v_id")
    private String vulnerableId;

    @JsonProperty("q_id")
    private String questionSetId;

    @JsonProperty("overall_script")
    private String overallScript;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("result")
    private Integer result;

    @JsonProperty("fail_code")
    private Integer failCode;

    @JsonProperty("need_human")
    private Integer needHuman;

    @JsonProperty("result_vulnerabilities")
    private Consultation.VulnerabilityInfo resultVulnerabilities;

    @JsonProperty("delete_vulnerabilities")
    private Consultation.VulnerabilityInfo deleteVulnerabilities;

    @JsonProperty("new_vulnerabilities")
    private Consultation.VulnerabilityInfo newVulnerabilities;

    @JsonProperty("time")
    private String time;

    @JsonProperty("runtime")
    private Long runtime;
}

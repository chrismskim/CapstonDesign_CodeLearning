package voicebot.management.history.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "consultations")
public class Consultation {

    @Id
    private String id; // 상담 문서 ID

    @Field("account_id")
    private String accountId;

    @Field("s_index")
    private int sessionIndex; // 상담 회차

    @Field("v_id")
    private String vulnerableId;

    @Field("q_id")
    private String questionSetId;

    private LocalDateTime time; // 상담 시작 시각
    private long runtime; // 상담 소요 시간

    @Field("overall_script")
    private String overallScript;

    private String summary;
    private int result;
    private int failCode;
    private int needHuman;

    @Field("result_vulnerabilities")
    private ConsultationVulnerabilities resultVulnerabilities;

    @Field("delete_vulnerabilities")
    private ConsultationVulnerabilities deleteVulnerabilities;

    @Field("new_vulnerabilities")
    private ConsultationVulnerabilities newVulnerabilities;

    private boolean deleted = false; // Soft delete 필드

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAccountId() { return accountId; }
    public void setAccountId(String accountId) { this.accountId = accountId; }
    public int getSessionIndex() { return sessionIndex; }
    public void setSessionIndex(int sessionIndex) { this.sessionIndex = sessionIndex; }
    public String getVulnerableId() { return vulnerableId; }
    public void setVulnerableId(String vulnerableId) { this.vulnerableId = vulnerableId; }
    public String getQuestionSetId() { return questionSetId; }
    public void setQuestionSetId(String questionSetId) { this.questionSetId = questionSetId; }
    public LocalDateTime getTime() { return time; }
    public void setTime(LocalDateTime time) { this.time = time; }
    public long getRuntime() { return runtime; }
    public void setRuntime(long runtime) { this.runtime = runtime; }
    public String getOverallScript() { return overallScript; }
    public void setOverallScript(String overallScript) { this.overallScript = overallScript; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public int getResult() { return result; }
    public void setResult(int result) { this.result = result; }
    public int getFailCode() { return failCode; }
    public void setFailCode(int failCode) { this.failCode = failCode; }
    public int getNeedHuman() { return needHuman; }
    public void setNeedHuman(int needHuman) { this.needHuman = needHuman; }
    public ConsultationVulnerabilities getResultVulnerabilities() { return resultVulnerabilities; }
    public void setResultVulnerabilities(ConsultationVulnerabilities resultVulnerabilities) { this.resultVulnerabilities = resultVulnerabilities; }
    public ConsultationVulnerabilities getDeleteVulnerabilities() { return deleteVulnerabilities; }
    public void setDeleteVulnerabilities(ConsultationVulnerabilities deleteVulnerabilities) { this.deleteVulnerabilities = deleteVulnerabilities; }
    public ConsultationVulnerabilities getNewVulnerabilities() { return newVulnerabilities; }
    public void setNewVulnerabilities(ConsultationVulnerabilities newVulnerabilities) { this.newVulnerabilities = newVulnerabilities; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
} 
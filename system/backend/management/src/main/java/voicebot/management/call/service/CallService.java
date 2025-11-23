package voicebot.management.call.service;

import voicebot.management.call.dto.ConsultationStatusDto;
import voicebot.management.call.dto.LlmResultDto;
import voicebot.management.call.dto.QueueItem;
import voicebot.management.call.dto.VulnerableResponse;

import java.util.List;

public interface CallService {
    /**
     * 지정된 취약계층 목록과 질문 세트 ID를 사용하여 상담 대기열에 작업을 추가합니다.
     * @param vulnerableIds 대상자 ID 목록
     * @param questionSetId 질문 세트 ID
     * @return 생성된 큐 아이템 ID 목록
     */
    List<String> addBatchToQueue(List<String> vulnerableIds, String questionSetId);

    /**
     * 대기열에서 다음 상담을 시작합니다.
     */
    void startNextConsultation();

    /**
     * 이름으로 취약계층을 검색합니다.
     * @param name 검색할 이름
     * @return 검색된 취약계층 정보 목록
     */
    List<VulnerableResponse> searchVulnerablesByName(String name);

    /**
     * 현재 대기열 상태를 반환합니다.
     * @return 대기열에 있는 모든 항목의 상태 목록
     */
    List<ConsultationStatusDto> getQueueStatus();

    void handleLlmResult(LlmResultDto resultDto);

} 
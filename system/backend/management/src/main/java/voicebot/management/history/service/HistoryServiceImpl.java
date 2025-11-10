package voicebot.management.history.service;

import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import voicebot.management.history.dto.CallHistoryDto;
import voicebot.management.history.entity.Consultation;
import voicebot.management.history.repository.ConsultationRepository;
import voicebot.management.question.entity.QuestionSet;
import voicebot.management.vulnerable.entity.Vulnerable;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class HistoryServiceImpl implements HistoryService {

    private final ConsultationRepository consultationRepository;
    private final MongoTemplate mongoTemplate;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public Page<CallHistoryDto> getCallHistory(String searchTerm, Integer sIndex, Pageable pageable) {
        // 1. Aggregation 파이프라인 생성
        List<AggregationOperation> aggregationOperations = new ArrayList<>();

        // 2. $lookup으로 vulnerable, question_sets 컬렉션 조인
        aggregationOperations.add(Aggregation.lookup("vulnerable", "vulnerableId", "userId", "vulnerableInfo"));
        aggregationOperations.add(Aggregation.lookup("question_sets", "questionSetId", "id", "questionSetInfo"));

        // 3. $unwind로 조인된 배열을 객체로 변환
        aggregationOperations.add(Aggregation.unwind("vulnerableInfo", true));
        aggregationOperations.add(Aggregation.unwind("questionSetInfo", true));

        // 4. 필터링 조건 (sIndex, searchTerm)
        Criteria criteria = new Criteria();
        if (sIndex != null) {
            criteria.and("sIndex").is(sIndex);
        }
        if (StringUtils.hasText(searchTerm)) {
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("vulnerableInfo.name").regex(searchTerm, "i"),
                    Criteria.where("questionSetInfo.title").regex(searchTerm, "i")
            );
            // searchTerm이 ObjectId 형식인지 확인
            if (ObjectId.isValid(searchTerm)) {
                searchCriteria.orOperator(Criteria.where("_id").is(new ObjectId(searchTerm)));
            }
            criteria.andOperator(searchCriteria);
        }
        aggregationOperations.add(Aggregation.match(criteria));

        // 5. 페이지네이션을 위한 전체 카운트 조회
        GroupOperation countGroup = Aggregation.group().count().as("total");
        Aggregation countAggregation = Aggregation.newAggregation(new ArrayList<>(aggregationOperations){{ add(countGroup); }});
        Long total = Optional.ofNullable(mongoTemplate.aggregate(countAggregation, "consultation", CountResult.class).getUniqueMappedResult())
                             .map(CountResult::getTotal)
                             .orElse(0L);

        // 6. 실제 데이터 조회를 위한 정렬, 건너뛰기, 제한 추가
        aggregationOperations.add(Aggregation.sort(pageable.getSort()));
        aggregationOperations.add(Aggregation.skip(pageable.getOffset()));
        aggregationOperations.add(Aggregation.limit(pageable.getPageSize()));

        // 7. DTO 프로젝션
        aggregationOperations.add(Aggregation.project("id", "sIndex")
                .and("vulnerableInfo.name").as("v_name")
                .and("questionSetInfo.title").as("q_title")
                .and("time").as("start_time")
                .and("result").as("result_code")
                .and("resultVulnerabilities.riskList").as("risk_list")
                .and("resultVulnerabilities.desireList").as("desire_list")
        );

        // 8. Aggregation 실행
        Aggregation aggregation = Aggregation.newAggregation(aggregationOperations);
        List<ConsultationProjection> results = mongoTemplate.aggregate(aggregation, "consultation", ConsultationProjection.class).getMappedResults();

        // 9. DTO로 변환
        List<CallHistoryDto> dtos = results.stream().map(this::mapToDto).toList();

        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    public Optional<Consultation> getCallHistoryDetail(String callId) {
        return consultationRepository.findById(callId);
    }

    private CallHistoryDto mapToDto(ConsultationProjection projection) {
        return CallHistoryDto.builder()
                .id(projection.getId())
                .v_name(projection.getV_name())
                .q_title(projection.getQ_title())
                .start_time(projection.getStart_time() != null ? projection.getStart_time().format(FORMATTER) : null)
                .result(mapResultCodeToString(projection.getResult_code()))
                .riskCount(projection.getRisk_list() != null ? projection.getRisk_list().size() : 0)
                .desireCount(projection.getDesire_list() != null ? projection.getDesire_list().size() : 0)
                .s_index(projection.getS_index())
                .build();
    }

    private String mapResultCodeToString(int resultCode) {
        return switch (resultCode) {
            case 0 -> "상담 불가";
            case 1 -> "상담 양호";
            case 2 -> "심층 상담 필요";
            default -> "알 수 없음";
        };
    }

    // 카운트 결과를 받기 위한 내부 클래스
    private static class CountResult {
        private long total;
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
    }

    // 프로젝션 결과를 받기 위한 내부 인터페이스
    private interface ConsultationProjection {
        String getId();
        String getV_name();
        String getQ_title();
        java.time.LocalDateTime getStart_time();
        int getResult_code();
        List<?> getRisk_list();
        List<?> getDesire_list();
        int getS_index();
    }
} 
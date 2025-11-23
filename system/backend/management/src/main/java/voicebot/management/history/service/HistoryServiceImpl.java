package voicebot.management.history.service;

import lombok.Data;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryServiceImpl implements HistoryService {

    private final ConsultationRepository consultationRepository;
    private final MongoTemplate mongoTemplate;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public Page<CallHistoryDto> getCallHistory(String searchTerm, Integer sIndex, Pageable pageable) {

        List<AggregationOperation> aggregationOperations = new ArrayList<>();

        aggregationOperations.add(
                Aggregation.lookup("vulnerable", "v_id", "_id", "vulnerableInfo")
        );
        aggregationOperations.add(
                Aggregation.lookup("question_sets", "q_id", "_id", "questionSetInfo")
        );

        aggregationOperations.add(Aggregation.unwind("vulnerableInfo", true));
        aggregationOperations.add(Aggregation.unwind("questionSetInfo", true));

        List<Criteria> conditions = new ArrayList<>();

        if (sIndex != null) {
            conditions.add(Criteria.where("s_index").is(sIndex));
        }

        if (StringUtils.hasText(searchTerm)) {
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("vulnerableInfo.name").regex(searchTerm, "i"),
                    Criteria.where("questionSetInfo.title").regex(searchTerm, "i")
            );
            if (ObjectId.isValid(searchTerm)) {
                searchCriteria.orOperator(
                        Criteria.where("_id").is(new ObjectId(searchTerm))
                );
            }
            conditions.add(searchCriteria);
        }

        if (!conditions.isEmpty()) {
            Criteria finalCriteria = new Criteria().andOperator(
                    conditions.toArray(new Criteria[0])
            );
            aggregationOperations.add(Aggregation.match(finalCriteria));
        }

        // ====== total count ======
        List<AggregationOperation> countOps = new ArrayList<>(aggregationOperations);
        countOps.add(Aggregation.group().count().as("total"));

        Aggregation countAggregation = Aggregation.newAggregation(countOps);
        Long total = Optional.ofNullable(
                        mongoTemplate.aggregate(countAggregation, "consultation", CountResult.class)
                                .getUniqueMappedResult()
                )
                .map(CountResult::getTotal)
                .orElse(0L);

        // ====== 정렬 / 페이징 ======
        if (pageable.getSort().isSorted()) {
            aggregationOperations.add(Aggregation.sort(pageable.getSort()));
        }
        aggregationOperations.add(Aggregation.skip(pageable.getOffset()));
        aggregationOperations.add(Aggregation.limit(pageable.getPageSize()));

        // ====== 프로젝션 (위기/욕구 리스트는 여기서 안 가져옴) ======
        aggregationOperations.add(
                Aggregation.project()
                        .and("_id").as("id")
                        .and("s_index").as("s_index")
                        .and("vulnerableInfo.name").as("v_name")
                        .and("questionSetInfo.title").as("q_title")
                        .and("time").as("start_time")
                        .and("result").as("result_code")
        );

        Aggregation aggregation = Aggregation.newAggregation(aggregationOperations);

        List<ConsultationProjection> results =
                mongoTemplate.aggregate(aggregation, "consultation", ConsultationProjection.class)
                        .getMappedResults();

        // ====== 여기서 실제 Consultation 엔티티를 다시 읽어서 risk/desire 개수 계산 ======
        List<String> ids = results.stream()
                .map(ConsultationProjection::getId)
                .filter(Objects::nonNull)
                .toList();

        Map<String, Consultation> consultationMap =
                consultationRepository.findAllById(ids).stream()
                        .collect(Collectors.toMap(Consultation::getId, c -> c));

        List<CallHistoryDto> dtos = results.stream()
                .map(p -> mapToDto(p, consultationMap.get(p.getId())))
                .toList();

        return new PageImpl<>(dtos, pageable, total);
    }

    @Override
    public Optional<Consultation> getCallHistoryDetail(String callId) {
        return consultationRepository.findById(callId);
    }

    private CallHistoryDto mapToDto(ConsultationProjection p, Consultation c) {
        int riskCount = 0;
        int desireCount = 0;

        if (c != null && c.getResultVulnerabilities() != null) {
            if (c.getResultVulnerabilities().getRiskList() != null) {
                riskCount = c.getResultVulnerabilities().getRiskList().size();
            }
            if (c.getResultVulnerabilities().getDesireList() != null) {
                desireCount = c.getResultVulnerabilities().getDesireList().size();
            }
        }

        return CallHistoryDto.builder()
                .id(p.getId())
                .v_name(p.getV_name())
                .q_title(p.getQ_title())
                .start_time(formatTime(p.getStart_time()))
                .result(mapResultCodeToString(p.getResult_code()))
                .riskCount(riskCount)
                .desireCount(desireCount)
                .s_index(p.getS_index())
                .build();
    }

    private String formatTime(LocalDateTime time) {
        return time != null ? time.format(FORMATTER) : null;
    }

    private String mapResultCodeToString(int resultCode) {
        return switch (resultCode) {
            case 0 -> "상담 불가";
            case 1 -> "상담 양호";
            case 2 -> "심층 상담 필요";
            default -> "알 수 없음";
        };
    }

    /** count stage 결과용 */
    private static class CountResult {
        private long total;
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }
    }

    /** aggregation 프로젝션 결과를 매핑하기 위한 클래스 */
    @Data
    private static class ConsultationProjection {
        private String id;
        private String v_name;
        private String q_title;
        private LocalDateTime start_time;
        private int result_code;
        private int s_index;
    }
}

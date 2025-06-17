package voicebot.management.vulnerable.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import voicebot.management.vulnerable.dto.VulnerableDto;
import voicebot.management.vulnerable.entity.Vulnerable;
import voicebot.management.vulnerable.repository.VulnerableRepository;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VulnerableService {

    private final VulnerableRepository vulnerableRepository;

    public List<VulnerableDto> findAll() {
        log.info("[VULNERABLE][SERVICE][FIND_ALL] 전체 조회 요청");
        return vulnerableRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public Optional<VulnerableDto> findById(String userId) {
        log.info("[VULNERABLE][SERVICE][FIND_BY_ID] 조회 요청: {}", userId);
        return vulnerableRepository.findById(userId)
                .map(entity -> {
                    log.info("[VULNERABLE][SERVICE][FIND_BY_ID] 조회 성공: {}", userId);
                    return toDto(entity);
                });
    }

    public VulnerableDto create(VulnerableDto dto) {
        log.info("[VULNERABLE][SERVICE][CREATE] 생성 요청: {}", dto.getUserId());

        if (dto.getUserId() == null || dto.getUserId().isEmpty()) {
            List<Vulnerable> all = vulnerableRepository.findAll();
            int max = all.stream()
                    .map(v -> v.getUserId().replace("V", ""))
                    .mapToInt(Integer::parseInt)
                    .max()
                    .orElse(0);
            dto.setUserId(String.format("V%03d", max + 1));
        }

        if (vulnerableRepository.existsById(dto.getUserId())) {
            log.warn("[VULNERABLE][SERVICE][CREATE] 중복 userId: {}", dto.getUserId());
            throw new IllegalStateException("이미 존재하는 userId입니다.");
        }

        Vulnerable saved = vulnerableRepository.save(toEntity(dto));
        log.info("[VULNERABLE][SERVICE][CREATE] 저장 완료: {}", saved.getUserId());
        return toDto(saved);
    }


    public VulnerableDto update(String userId, VulnerableDto dto) {
        log.info("[VULNERABLE][SERVICE][UPDATE] 수정 요청: {}", userId);
        if (!vulnerableRepository.existsById(userId)) {
            log.warn("[VULNERABLE][SERVICE][UPDATE] 존재하지 않는 userId: {}", userId);
            return null;
        }
        dto.setUserId(userId);
        Vulnerable updated = vulnerableRepository.save(toEntity(dto));
        log.info("[VULNERABLE][SERVICE][UPDATE] 수정 완료: {}", userId);
        return toDto(updated);
    }

    public boolean delete(String userId) {
        log.info("[VULNERABLE][SERVICE][DELETE] 삭제 요청: {}", userId);
        if (!vulnerableRepository.existsById(userId)) {
            log.warn("[VULNERABLE][SERVICE][DELETE] 존재하지 않는 userId: {}", userId);
            return false;
        }
        vulnerableRepository.deleteById(userId);
        log.info("[VULNERABLE][SERVICE][DELETE] 삭제 완료: {}", userId);
        return true;
    }

    private Vulnerable toEntity(VulnerableDto dto) {
        VulnerableDto.VulnerabilityDto vulnDto = dto.getVulnerabilities();

        return Vulnerable.builder()
                .userId(dto.getUserId())
                .name(dto.getName())
                .gender(dto.getGender())
                .birthDate(dto.getBirthDate())
                .phoneNumber(dto.getPhoneNumber())
                .address(dto.getAddress() == null ? null : Vulnerable.Address.builder()
                        .state(dto.getAddress().getState())
                        .city(dto.getAddress().getCity())
                        .address1(dto.getAddress().getAddress1())
                        .address2(dto.getAddress().getAddress2())
                        .build())
                .vulnerabilities(vulnDto == null ? null : Vulnerable.Vulnerability.builder()
                        .summary(vulnDto.getSummary())
                        .riskList(vulnDto.getRiskList() == null ? Collections.emptyList() :
                                vulnDto.getRiskList().stream()
                                        .map(r -> Vulnerable.Risk.builder()
                                                .riskType(r.getRiskType())
                                                .content(r.getContent())
                                                .build())
                                        .toList())
                        .desireList(vulnDto.getDesireList() == null ? Collections.emptyList() :
                                vulnDto.getDesireList().stream()
                                        .map(d -> Vulnerable.Desire.builder()
                                                .desireType(d.getDesireType())
                                                .content(d.getContent())
                                                .build())
                                        .toList())
                        .build())
                .build();
    }

    private VulnerableDto toDto(Vulnerable entity) {
        Vulnerable.Vulnerability vulnerability = entity.getVulnerabilities();

        return VulnerableDto.builder()
                .userId(entity.getUserId())
                .name(entity.getName())
                .gender(entity.getGender())
                .birthDate(entity.getBirthDate())
                .phoneNumber(entity.getPhoneNumber())
                .address(entity.getAddress() == null ? null : VulnerableDto.AddressDto.builder()
                        .state(entity.getAddress().getState())
                        .city(entity.getAddress().getCity())
                        .address1(entity.getAddress().getAddress1())
                        .address2(entity.getAddress().getAddress2())
                        .build())
                .vulnerabilities(vulnerability == null ? null : VulnerableDto.VulnerabilityDto.builder()
                        .summary(vulnerability.getSummary())
                        .riskList(vulnerability.getRiskList() == null ? Collections.emptyList() :
                                vulnerability.getRiskList().stream()
                                        .map(r -> VulnerableDto.RiskDto.builder()
                                                .riskType(r.getRiskType())
                                                .content(r.getContent())
                                                .build())
                                        .toList())
                        .desireList(vulnerability.getDesireList() == null ? Collections.emptyList() :
                                vulnerability.getDesireList().stream()
                                        .map(d -> VulnerableDto.DesireDto.builder()
                                                .desireType(d.getDesireType())
                                                .content(d.getContent())
                                                .build())
                                        .toList())
                        .build())
                .build();
    }
}

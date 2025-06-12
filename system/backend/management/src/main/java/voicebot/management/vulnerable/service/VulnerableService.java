package voicebot.management.vulnerable.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import voicebot.management.vulnerable.dto.*;
import voicebot.management.vulnerable.entity.*;
import voicebot.management.vulnerable.repository.VulnerableRepository;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VulnerableService {

    private final VulnerableRepository vulnerableRepository;

    public VulnerableDto createVulnerable(VulnerableDto dto) {
        if (dto.getUserId() != null && vulnerableRepository.existsByUserId(dto.getUserId())) {
            throw new IllegalArgumentException("User ID already exists: " + dto.getUserId());
        }
        Vulnerable vulnerable = dtoToVulnerable(dto);
        vulnerable.setUserId(UUID.randomUUID().toString());
        vulnerable.setDeleted(false);
        Vulnerable saved = vulnerableRepository.save(vulnerable);
        return vulnerableToDto(saved);
    }

    public List<VulnerableDto> getAllVulnerables() {
        return vulnerableRepository.findAllByDeletedIsFalse().stream()
                .map(this::vulnerableToDto)
                .collect(Collectors.toList());
    }

    public VulnerableDto getVulnerableById(String userId) {
        return vulnerableRepository.findByUserIdAndDeletedIsFalse(userId)
                .map(this::vulnerableToDto)
                .orElseThrow(() -> new NoSuchElementException("Vulnerable not found with id: " + userId));
    }

    public VulnerableDto updateVulnerable(String userId, VulnerableDto dto) {
        Vulnerable existing = vulnerableRepository.findByUserIdAndDeletedIsFalse(userId)
                .orElseThrow(() -> new NoSuchElementException("Vulnerable not found with id: " + userId));

        existing.setName(dto.getName());
        existing.setGender(dto.getGender());
        existing.setBirthDate(dto.getBirthDate());
        existing.setPhoneNumber(dto.getPhoneNumber());
        existing.setAddress(dtoToAddress(dto.getAddress()));
        existing.setVulnerabilities(dtoToVulnerabilities(dto.getVulnerabilities()));

        Vulnerable updated = vulnerableRepository.save(existing);
        return vulnerableToDto(updated);
    }

    public void deleteVulnerable(String userId) {
        Vulnerable vulnerable = vulnerableRepository.findByUserIdAndDeletedIsFalse(userId)
                .orElseThrow(() -> new NoSuchElementException("Vulnerable not found with id: " + userId));
        vulnerable.setDeleted(true);
        vulnerableRepository.save(vulnerable);
    }

    // Mappers
    private VulnerableDto vulnerableToDto(Vulnerable entity) {
        if (entity == null) return null;
        VulnerableDto dto = new VulnerableDto();
        dto.setUserId(entity.getUserId());
        dto.setName(entity.getName());
        dto.setGender(entity.getGender());
        dto.setBirthDate(entity.getBirthDate());
        dto.setPhoneNumber(entity.getPhoneNumber());
        dto.setAddress(addressToDto(entity.getAddress()));
        dto.setVulnerabilities(vulnerabilitiesToDto(entity.getVulnerabilities()));
        return dto;
    }

    private Vulnerable dtoToVulnerable(VulnerableDto dto) {
        if (dto == null) return null;
        Vulnerable entity = new Vulnerable();
        entity.setName(dto.getName());
        entity.setGender(dto.getGender());
        entity.setBirthDate(dto.getBirthDate());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setAddress(dtoToAddress(dto.getAddress()));
        entity.setVulnerabilities(dtoToVulnerabilities(dto.getVulnerabilities()));
        return entity;
    }

    private AddressDto addressToDto(Address entity) {
        if (entity == null) return null;
        AddressDto dto = new AddressDto();
        dto.setState(entity.getState());
        dto.setCity(entity.getCity());
        dto.setAddress1(entity.getAddress1());
        dto.setAddress2(entity.getAddress2());
        return dto;
    }

    private Address dtoToAddress(AddressDto dto) {
        if (dto == null) return null;
        Address entity = new Address();
        entity.setState(dto.getState());
        entity.setCity(dto.getCity());
        entity.setAddress1(dto.getAddress1());
        entity.setAddress2(dto.getAddress2());
        return entity;
    }

    private VulnerabilitiesDto vulnerabilitiesToDto(Vulnerabilities entity) {
        if (entity == null) return null;
        VulnerabilitiesDto dto = new VulnerabilitiesDto();
        dto.setSummary(entity.getSummary());
        dto.setRiskList(entity.getRiskList() != null ? entity.getRiskList().stream().map(this::riskToDto).collect(Collectors.toList()) : Collections.emptyList());
        dto.setDesireList(entity.getDesireList() != null ? entity.getDesireList().stream().map(this::desireToDto).collect(Collectors.toList()) : Collections.emptyList());
        return dto;
    }

    private Vulnerabilities dtoToVulnerabilities(VulnerabilitiesDto dto) {
        if (dto == null) return null;
        Vulnerabilities entity = new Vulnerabilities();
        entity.setSummary(dto.getSummary());
        entity.setRiskList(dto.getRiskList() != null ? dto.getRiskList().stream().map(this::dtoToRisk).collect(Collectors.toList()) : Collections.emptyList());
        entity.setDesireList(dto.getDesireList() != null ? dto.getDesireList().stream().map(this::dtoToDesire).collect(Collectors.toList()) : Collections.emptyList());
        return entity;
    }

    private RiskDto riskToDto(Risk entity) {
        if (entity == null) return null;
        RiskDto dto = new RiskDto();
        dto.setRiskType(entity.getRiskType());
        dto.setContent(entity.getContent());
        return dto;
    }

    private Risk dtoToRisk(RiskDto dto) {
        if (dto == null) return null;
        Risk entity = new Risk();
        entity.setRiskType(dto.getRiskType());
        entity.setContent(dto.getContent());
        return entity;
    }

    private DesireDto desireToDto(Desire entity) {
        if (entity == null) return null;
        DesireDto dto = new DesireDto();
        dto.setDesireType(entity.getDesireType());
        dto.setContent(entity.getContent());
        return dto;
    }

    private Desire dtoToDesire(DesireDto dto) {
        if (dto == null) return null;
        Desire entity = new Desire();
        entity.setDesireType(dto.getDesireType());
        entity.setContent(dto.getContent());
        return entity;
    }
}

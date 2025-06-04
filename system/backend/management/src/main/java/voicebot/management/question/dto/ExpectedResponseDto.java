package voicebot.management.question.dto;

import lombok.*;
import voicebot.management.question.entity.ResponseTypeInfo;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExpectedResponseDto {
    private String text; // 예상 답변 내용
    private List<ResponseTypeInfoDto> responseTypeList;
}
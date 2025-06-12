package voicebot.management.history.entity;

import org.springframework.data.mongodb.core.mapping.Field;
import java.util.List;

public class ConsultationDesire {
    @Field("desire_index_list")
    private List<Integer> desireIndexList;
    private String content;

    // Manual Getters and Setters
    public List<Integer> getDesireIndexList() {
        return desireIndexList;
    }

    public void setDesireIndexList(List<Integer> desireIndexList) {
        this.desireIndexList = desireIndexList;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 
package voicebot.management.call.dto;

import java.util.List;

public class VulnerableResponse {
    private String id;
    private String name;
    private int age;
    private String location;
    private List<String> vulnerabilityTypes;

    // Manual Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public List<String> getVulnerabilityTypes() { return vulnerabilityTypes; }
    public void setVulnerabilityTypes(List<String> vulnerabilityTypes) { this.vulnerabilityTypes = vulnerabilityTypes; }
} 
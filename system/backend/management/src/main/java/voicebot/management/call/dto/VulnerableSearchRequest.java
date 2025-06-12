package voicebot.management.call.dto;

public class VulnerableSearchRequest {
    private String name;
    private String ageRange;
    private String location;
    private String vulnerabilityType;

    // Manual Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAgeRange() { return ageRange; }
    public void setAgeRange(String ageRange) { this.ageRange = ageRange; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getVulnerabilityType() { return vulnerabilityType; }
    public void setVulnerabilityType(String vulnerabilityType) { this.vulnerabilityType = vulnerabilityType; }
} 
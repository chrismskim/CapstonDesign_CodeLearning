package voicebot.management.vulnerable.dto;

public class VulnerableDto {
    private String userId;
    private String name;
    private String gender;
    private String birthDate;
    private String phoneNumber;
    private AddressDto address;
    private VulnerabilitiesDto vulnerabilities;

    // Manual Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getBirthDate() { return birthDate; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public AddressDto getAddress() { return address; }
    public void setAddress(AddressDto address) { this.address = address; }
    public VulnerabilitiesDto getVulnerabilities() { return vulnerabilities; }
    public void setVulnerabilities(VulnerabilitiesDto vulnerabilities) { this.vulnerabilities = vulnerabilities; }
}

import os

class Settings:
    PROJECT_NAME: str = "Calling Orchestrator"
    API_V1_STR: str = "/api/v1"
    # Add other settings like database URLs, API keys, etc. here
    # Example:
    # TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    # TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    # TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    # REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost")
    # AI_SERVICE_URL: str = os.getenv("AI_SERVICE_URL", "")
    # RECOGNITION_SERVICE_URL: str = os.getenv("RECOGNITION_SERVICE_URL", "")
    # SYNTHESIS_SERVICE_URL: str = os.getenv("SYNTHESIS_SERVICE_URL", "")

settings = Settings() 
from pydantic import BaseModel

# Add your data models here 

class InitiateCallRequest(BaseModel):
    phone_number: str
    user_id: str

class InitiateCallResponse(BaseModel):
    call_id: str
    status: str

class RecognitionResult(BaseModel):
    call_id: str
    text: str
    confidence: float = 0.0

class SynthesisRequest(BaseModel):
    call_id: str
    text: str

class LogEntry(BaseModel):
    call_id: str | None = None
    user_id: str | None = None
    event_type: str
    details: dict 
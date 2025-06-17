from fastapi import FastAPI, Query
from app.routes import format_phone_number, TWILIO_WEBHOOK_URL
from app.services import twilio_service
from pydantic import BaseModel

app = FastAPI()

class PhoneRequest(BaseModel):
    phone: str

@app.post("/api/test_twilio")
async def test_twilio(data: PhoneRequest):
    try:
        formatted_phone = format_phone_number(data.phone)
        sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)
        return {"result": "전화연결 가능", "call_sid": sid}
    except Exception as e:
        return {"result": "전화연결 불가", "error": str(e)}

from fastapi import FastAPI
from app.routes import format_phone_number, TWILIO_WEBHOOK_URL
from app.services import twilio_service
from pydantic import BaseModel
from fastapi.responses import Response

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

@app.post("/api/test_twilio_webhook")
async def test_twilio_webhook():
    twiml = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Say>테스트 통화 연결 성공</Say>\n</Response>"""
    return Response(content=twiml, media_type="application/xml")

# 실행 방법:
# uvicorn app.test.test:app --reload
# Postman에서 URL: http://localhost:8000/api/test_twilio
# Method: POST, Body(raw, JSON): {"phone": "01012345678"}
# Twilio Webhook URL: http://<서버주소>:8000/api/test_twilio_webhook




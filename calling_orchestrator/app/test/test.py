from fastapi import FastAPI
from app.services.twilio_service import format_phone_number
import os
from app.services import twilio_service
from pydantic import BaseModel
from fastapi.responses import Response

TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "https://9eca-211-178-193-29.ngrok-free.app/api/twilio/voice")

app = FastAPI()

# 요청용 Pydantic 모델
class PhoneRequest(BaseModel):
    phone: str  # 예: "01012345678"

# 실제 통화 테스트용 엔드포인트
@app.post("/api/test_twilio")
async def test_twilio(data: PhoneRequest):
    try:
        # Twilio 호환 번호 포맷으로 변환
        formatted_phone = format_phone_number(data.phone)
        
        # Twilio를 이용해 전화 걸기
        sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)
        
        return {"result": "전화연결 가능", "call_sid": sid}
    except Exception as e:
        return {"result": "전화연결 불가", "error": str(e)}

# Webhook: Twilio가 이 URL을 호출하면 응답할 XML 반환
@app.post("/api/test_twilio_webhook")
async def test_twilio_webhook():
    twiml = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Response>\n    <Say>테스트 통화 연결 성공</Say>\n</Response>"""
    return Response(content=twiml, media_type="application/xml")

# 실행 방법:
# uvicorn app.test.test:app --reload
# Postman에서 URL: http://localhost:8000/api/test_twilio
# Method: POST, Body(raw, JSON): {"phone": "01012345678"}
# Twilio Webhook URL: http://<서버주소>:8000/api/test_twilio_webhook

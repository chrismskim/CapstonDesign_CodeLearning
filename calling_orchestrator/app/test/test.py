from fastapi import FastAPI
from app.services.twilio_service import format_phone_number
import os
from app.services import twilio_service
from pydantic import BaseModel
from fastapi.responses import Response

TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "https://e432-211-178-193-29.ngrok-free.app/api/test_twilio_webhook")

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
@app.api_route("/api/test_twilio_webhook", methods=["GET", "POST"])
async def test_twilio_webhook():
    twiml = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
    <Response>
        <Say>Hello World</Say>
    </Response>"""
    return Response(content=twiml, media_type="application/xml")

# 실행 방법:
# uvicorn app.test.test:app --reload
# Postman에서 URL: http://localhost:8000/api/test_twilio
# Method: POST, Body(raw, JSON): {"phone": "01012345678"}
# Twilio Webhook URL: http://<서버주소>:8000/api/test_twilio_webhook


@app.post("/api/llm_test", summary="LLM 취약유형 요약 테스트", tags=["Test"])
async def llm_test(request: Request):
    data = await request.json()
    # data가 리스트로 바로 들어오는 경우와 dict로 들어오는 경우 모두 처리
    if isinstance(data, list):
        script = data
    elif isinstance(data, dict):
        script = data.get("script")
    else:
        return {"error": "script 필드를 리스트로 보내거나, {\"script\": [...]} 형태로 보내세요."}
    if not script:
        return {"error": "script 필드는 필수입니다."}
    # script가 리스트면 문자열로 합치기
    if isinstance(script, list):
        script_text = "\n".join(script)
    else:
        script_text = str(script)
    from app.services import llm_service
    prompt = (
        "아래는 상담 대화 스크립트입니다. "
        "이 대화에서 드러난 취약유형(문제)의 개수와, 각 취약유형이 무엇인지, 그리고 각 문제에 대해 간단히 요약해 주세요. "
        "출력 예시: {'count': 2, 'types': ['경제적 어려움', '주거 문제'], 'summary': '...'}\n"
        f"대화 스크립트:\n{script_text}"
    )
    result = llm_service.generate_response(prompt)
    return {"llm_result": result}

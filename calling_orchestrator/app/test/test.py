from fastapi import FastAPI, Request, HTTPException
from app.services.twilio_service import format_phone_number
import os
from app.services import twilio_service
from pydantic import BaseModel
from fastapi.responses import Response

TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "https://b871-211-178-193-29.ngrok-free.app/api/test_twilio_webhook")

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
        
        # Twilio를 이용해 전화 걸기 (동기/비동기 모두 대응)
        sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)
        if callable(getattr(sid, "__await__", None)):
            sid = await sid
        
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


@app.post("/api/test_redis", summary="Redis 테스트 API", tags=["Test"])
async def test_redis(request: Request):
    data = await request.json()
    name = data.get("name")
    phone = data.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="phone 필드는 필수입니다.")
    from app.services.session_service import save_session, get_session as get_session_async
    await save_session(phone, data)
    loaded = await get_session_async(phone)
    result = {
        "이름": loaded.get("name"),
        "전화번호": loaded.get("phone"),
        "취약정보": loaded.get("vulnerabilities") or loaded.get("vulnerability") or loaded.get("risk_list")
    }
    return result

# 3. 질문 리스트 음성 안내 및 답변 테스트용 엔드포인트
@app.post("/api/test_question_flow", summary="질문 리스트 음성 안내 및 답변 테스트", tags=["Test"])
async def test_question_flow(request: Request):
    data = await request.json()
    question_list = data.get("question_list", [])
    answers = data.get("answers", [])
    result = []
    for idx, q in enumerate(question_list):
        q_text = q["text"] if isinstance(q, dict) and "text" in q else str(q)
        a_text = answers[idx] if idx < len(answers) else "(미응답)"
        # 최근에 불편하신게 있나요? 질문에 대한 답변 분기 처리
        if "불편하신게 있나요" in q_text:
            if "없" in a_text:
                return {"출력": "상담을 종료해도 될까요?"}
            else:
                return {"출력": "어떤게 불편하신가요?"}
        result.append({"콜 봇 질문": q_text, "상담자 답변": a_text})
    return {"질문_응답_흐름": result}

# 4. 추가 불편사항 확인 및 vulnerable 리스트 추가 테스트용 엔드포인트
@app.post("/api/test_add_vulnerable", summary="추가 불편사항 vulnerable 리스트 추가 테스트", tags=["Test"])
async def test_add_vulnerable(request: Request):
    data = await request.json()
    vulnerable = data.get("vulnerable_list", [])
    extra = data.get("extra", "")
    if extra:
        vulnerable.append({"content": extra, "type": "추가"})
    return {"최종_vulnerable_list": vulnerable}

# 취약 항목(문제) 해결 여부에 따라 리스트에서 삭제/유지 테스트용 엔드포인트
@app.post("/api/test_vulnerable_update", summary="취약 항목 해결 시 리스트 삭제/유지 테스트", tags=["Test"])
async def test_vulnerable_update(request: Request):
    data = await request.json()
    vulnerable_list = data.get("vulnerable_list", [])
    answers = data.get("answers", [])
    result = []
    for idx, item in enumerate(vulnerable_list):
        content = item.get("content") if isinstance(item, dict) else str(item)
        answer = answers[idx] if idx < len(answers) else "(미응답)"
        # 답변에 '해결' 또는 '아니오' 등 부정이 포함되면 삭제, 아니면 유지
        if any(x in answer for x in ["해결", "아니오", "없음", "괜찮"]):
            continue  # 리스트에서 삭제(유지하지 않음)
        result.append(item)  # 유지
    return {"updated_vulnerable_list": result}

# 통합 상담 시나리오 테스트용 엔드포인트
@app.post("/api/test_full_consult_flow", summary="상담 전체 플로우 통합 테스트", tags=["Test"])
async def test_full_consult_flow(request: Request):
    data = await request.json()
    vulnerable_list = data.get("vulnerable_list", [])
    answers = data.get("answers", [])
    extra = data.get("extra", "")
    script = []
    # 1. 문제 해결 여부에 따라 vulnerable 리스트 업데이트
    updated_vulnerable = []
    for idx, item in enumerate(vulnerable_list):
        content = item.get("content") if isinstance(item, dict) else str(item)
        answer = answers[idx] if idx < len(answers) else "(미응답)"
        script.append(f"Q: {content} A: {answer}")
        if any(x in answer for x in ["해결", "아니오", "없음", "괜찮"]):
            continue  # 해결된 항목은 삭제
        updated_vulnerable.append(item)  # 미해결 항목 유지
    # 2. 추가 불편사항 처리
    if extra:
        updated_vulnerable.append({"content": extra, "type": "추가"})
        script.append(f"Q: 추가로 불편한 점 있으신가요? A: {extra}")
    else:
        script.append("Q: 추가로 불편한 점 있으신가요? A: 없음")
    # 3. 상담 종료 안내
    script.append("상담을 종료합니다.")
    # 4. 결과 요약(간단 요약)
    summary = f"상담 종료. 남은 취약 항목: {len(updated_vulnerable)}개. 추가 불편사항: {'있음' if extra else '없음'}"
    # 5. 외부 시스템 전송(여기선 응답에 포함)
    result = {
        "상담_스크립트": script,
        "상담_요약": summary,
        "최종_vulnerable_list": updated_vulnerable
    }
    return result

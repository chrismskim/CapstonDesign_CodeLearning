### routes.py
from fastapi import APIRouter, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, twilio_service, stt_service, llm_service, tts_service, script_logger
from fastapi.responses import Response, JSONResponse
import httpx
import time
import os

router = APIRouter()

TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "http://localhost:8000/twilio/voice")
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

@router.post("/receive")
async def receive_user_data(user: UserData):
    try:
        question_data = jsonable_encoder(user.question_list)
        await redis_service.save_question_list(question_data)

        sid = twilio_service.make_call(user.phone, twiml_url=TWILIO_WEBHOOK_URL)

        return {
            "message": "User data received and call initiated.",
            "call_sid": sid,
            "question_count": len(user.question_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/twilio/voice")
async def handle_twilio_voice(request: Request):
    form_data = await request.form()
    audio_url = form_data.get("RecordingUrl")

    try:
        user_input = await stt_service.speech_to_text(audio_url)
        answer = await redis_service.find_answer(user_input)
        if not answer:
            answer = llm_service.generate_response(user_input)

        script_logger.log_interaction(user_input, answer)
        twiml_response = await tts_service.text_to_twiml(answer)
        return Response(content=twiml_response, media_type="application/xml")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LLM 분석 결과를 받아 Spring Boot로 전송하는 엔드포인트
@router.post("/send_llm_result")
async def send_llm_result(llm_result: dict):
    """
    llm_result는 실제 LLM이 생성한 상담 요약/분석 결과를 그대로 받음
    - 예외처리(type 0): 상담 불가 사유가 있으면 summary에 반드시 포함 (최대 1개)
    - 위기상황(type 1), 욕구상황(type 2): 취약계층 정보 업데이트
    - 심층상담(type 3): 심층상담 대상이면 summary에 반드시 포함 (최대 1개)
    """
    # 예외처리/심층상담 요약 조건 체크 및 summary 자동 보정 예시
    summary = llm_result.get("summary", "")
    exception_types = [
        "신상정보불일치", "상담거부", "의사소통불가", "부적절한답변", "연결끊어짐", "전화미수신"
    ]
    deep_types = ["심층상담을 원함", "알아낸 취약 정보가 중대함"]
    # 예외처리(type 0) 보장
    if llm_result.get("result", 0) == 0:
        found = any(t in summary for t in exception_types)
        if not found:
            summary = f"상담 불가: {exception_types[0]}"  # 기본값 추가
    # 심층상담(type 3) 보장
    if llm_result.get("need_human", 0) in [1,2]:
        found = any(t in summary for t in deep_types)
        if not found:
            summary = summary + " 심층상담 필요."
    llm_result["summary"] = summary
    async with httpx.AsyncClient() as client:
        response = await client.post(SPRING_BOOT_URL, json=llm_result)
        return JSONResponse(content={"spring_response": response.json(), "sent_data": llm_result})

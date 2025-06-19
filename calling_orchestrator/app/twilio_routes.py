from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, twilio_service, stt_service, llm_service, tts_service, script_logger
from fastapi.responses import Response, JSONResponse
import httpx
import time
import os

router = APIRouter()

TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "https://caef-221-140-126-21.ngrok-free.app/api/twilio/voice")
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

def format_phone_number(phone: str) -> str:
    # 공백, 하이픈 등 제거
    digits = ''.join(filter(str.isdigit, phone))
    if digits.startswith('0'):
        # 한국 번호: 01012345678 → +821012345678
        digits = digits[1:]
        return f'+82{digits}'
    elif digits.startswith('1') and len(digits) == 11:
        # 미국 번호: 1XXXXXXXXXX → +1XXXXXXXXXX
        return f'+{digits}'
    else:
        # 기타: 국제번호가 이미 붙어있거나, 예외 상황
        if digits.startswith('00'):
            return f'+{digits[2:]}'
        return f'+{digits}'

# [POST] /api/receive
@router.post("/api/receive", summary="Spring Boot → FastAPI: 사용자 정보 및 질문 리스트 수신", tags=["REST API"])
async def receive_user_data(user: UserData):
    """
    Spring Boot에서 사용자 정보 및 질문 리스트를 전달받아 Redis에 저장하고, Twilio로 전화를 발신합니다.
    - 요청 데이터: UserData(JSON)
    - 응답: 처리 결과 및 call sid
    """
    try:
        question_data = jsonable_encoder(user.question_list)
        await redis_service.save_question_list(question_data)

        # 번호 포맷 변환
        formatted_phone = format_phone_number(user.phone)
        sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)

        return {
            "message": "User data received and call initiated.",
            "call_sid": sid,
            "question_count": len(user.question_list)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# [POST] /api/twilio/voice
@router.post("/api/twilio/voice")
async def handle_twilio_voice(request: Request):
    print("twilio voice called")
    """
    Twilio에서 음성 녹음이 완료되면 호출되는 webhook
    STT로 음성을 텍스트로 변환하고, LLM으로 응답을 생성한 후 TTS로 변환
    """
    try:
        form_data = await request.form()
        
        # 녹음된 오디오 URL 가져오기
        recording_url = form_data.get("RecordingUrl")
        
        if not recording_url:
            # 녹음이 없으면 기본 메시지 반환
            twiml_response = tts_service.text_to_twiml("안녕하세요. 무엇을 도와드릴까요?")
            return Response(content=twiml_response, media_type="application/xml")
        
        # STT: 음성을 텍스트로 변환
        print(f"STT 처리 시작: {recording_url}")
        try:
            user_input = await stt_service.speech_to_text(recording_url)
            print(f"STT 결과: {user_input}")
        except Exception as stt_error:
            print(f"STT 오류: {stt_error}")
            twiml_response = tts_service.text_to_twiml("죄송합니다. 음성 인식 중 오류가 발생했습니다.")
            return Response(content=twiml_response, media_type="application/xml")
        
        if not user_input or user_input.strip() == "":
            # 음성 인식 실패 시
            twiml_response = tts_service.text_to_twiml("죄송합니다. 말씀을 잘 들리지 못했습니다. 다시 한 번 말씀해 주세요.")
            return Response(content=twiml_response, media_type="application/xml")
        
        # Redis에서 미리 정의된 답변 찾기
        try:
            answer = await redis_service.find_answer(user_input)
        except Exception as redis_error:
            print(f"Redis 오류: {redis_error}")
            answer = None
        
        if not answer:
            # LLM으로 응답 생성
            print(f"LLM 처리 시작: {user_input}")
            try:
                answer = llm_service.generate_response(user_input)
                print(f"LLM 결과: {answer}")
            except Exception as llm_error:
                print(f"LLM 오류: {llm_error}")
                answer = "죄송합니다. 응답 생성 중 오류가 발생했습니다."
        
        # 상호작용 로깅
        try:
            script_logger.log_interaction(user_input, answer)
        except Exception as log_error:
            print(f"로깅 오류: {log_error}")
        
        # TTS: 텍스트를 TwiML로 변환
        try:
            twiml_response = tts_service.text_to_twiml(answer)
        except Exception as tts_error:
            print(f"TTS 오류: {tts_error}")
            twiml_response = f"""
            <Response>
                <Say language="ko-KR">{answer}</Say>
                <Record maxLength="10" action="/api/twilio/voice" method="POST" />
            </Response>
            """.strip()
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"Twilio webhook 오류: {e}")
        # 오류 발생 시 기본 메시지 반환
        error_response = f"""
        <Response>
            <Say language="ko-KR">죄송합니다. 시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</Say>
            <Record maxLength="10" action="/api/twilio/voice" method="POST" />
        </Response>
        """.strip()
        return Response(content=error_response, media_type="application/xml")

# [POST] /api/send_llm_result
@router.post("/api/send_llm_result", summary="FastAPI → Spring Boot: 상담 결과 전송", tags=["REST API"])
async def send_llm_result(llm_result: dict):
    """
    FastAPI가 상담 요약/분석 결과를 Spring Boot로 전송합니다.
    - 요청 데이터: LLM 결과(JSON)
    - 응답: Spring Boot의 응답
    """
    summary = llm_result.get("summary", "")
    exception_types = [
        "신상정보불일치", "상담거부", "의사소통불가", "부적절한답변", "연결끊어짐", "전화미수신"
    ]
    deep_types = ["심층상담을 원함", "알아낸 취약 정보가 중대함"]
    if llm_result.get("result", 0) == 0:
        found = any(t in summary for t in exception_types)
        if not found:
            summary = f"상담 불가: {exception_types[0]}"
    if llm_result.get("need_human", 0) in [1,2]:
        found = any(t in summary for t in deep_types)
        if not found:
            summary = summary + " 심층상담 필요."
    llm_result["summary"] = summary
    async with httpx.AsyncClient() as client:
        response = await client.post(SPRING_BOOT_URL, json=llm_result)
        return JSONResponse(content={"spring_response": response.json(), "sent_data": llm_result})

# [POST] /api/test_twilio
@router.post("/api/test_twilio")
async def test_twilio(phone: str = Query(..., description="테스트할 전화번호")):
    """
    Twilio 전화를 테스트합니다. 주어진 전화번호로 전화를 걸고, 결과를 반환합니다.
    - 요청 데이터: 전화번호
    - 응답: 전화 연결 결과 및 call sid
    """
    try:
        formatted_phone = format_phone_number(phone)
        sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)
        return {"result": "전화연결 가능", "call_sid": sid}
    except Exception as e:
        return {"result": "전화연결 불가", "error": str(e)} 
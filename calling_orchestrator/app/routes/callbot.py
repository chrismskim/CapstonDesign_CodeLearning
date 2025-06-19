from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Response, Body
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, twilio_service, stt_service, llm_service, script_logger, tts_service
from app.services.classify_service import classify_answer
from app.utils.diff_utils import count_index, diff_list
from app.services.session_service import save_session, get_session, clear_session
from app.services.question_service import get_next_question, is_end
from app.services.answer_service import save_answer, update_vulnerabilities
from app.services.result_service import build_output, send_result_to_spring
from app.config import TWILIO_WEBHOOK_URL
import time
import httpx
import os

SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

router = APIRouter()

@router.post("/api/receive", summary="Spring Boot → FastAPI: 취약계층 콜봇 전체 플로우", tags=["REST API"])
async def receive_user_data(user: UserData, background_tasks: BackgroundTasks):
    try:
        # 세션 정보 Redis에 저장 (전화번호를 call_sid로 사용)
        session_data = {
            "current_idx": 0,
            "risk_list": [r.model_dump() for r in user.vulnerabilities.risk_list],
            "desire_list": [d.model_dump() for d in user.vulnerabilities.desire_list],
            "script": [],
            "answers": [],
            "start_time": time.time(),
            "before_risk": [r.model_dump() for r in user.vulnerabilities.risk_list],
            "before_desire": [d.model_dump() for d in user.vulnerabilities.desire_list],
            "user_phone": user.phone
        }
        await save_session(user.phone, session_data)
        question_data = jsonable_encoder(user.question_list)
        await redis_service.save_question_list(question_data)
        output = await callbot_flow(user, background_tasks)
        return output
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[ERROR /api/receive] {e}\n{tb}")
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{tb}")

async def callbot_flow(user: UserData, background_tasks: BackgroundTasks):
    formatted_phone = twilio_service.format_phone_number(user.phone)
    sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)
    # 질문만 Twilio로 전달하고, 음성 인식 및 답변 처리는 /api/twilio/voice에서 담당
    return {"result": "콜봇 플로우 시작", "call_sid": sid}

@router.api_route("/api/twilio/voice")
async def twilio_voice(request: Request):
    form = await request.form()
    audio_url = form.get("RecordingUrl")
    call_sid = form.get("CallSid")
    # Redis에서 세션 정보 조회 (call_sid는 Twilio에서 부여, 여기서는 phone을 사용)
    state = await get_session(call_sid)
    if not state:
        # 세션이 없으면 에러 응답
        return Response(content="<Response><Say language=\"ko-KR\">세션 정보가 없습니다. 상담을 종료합니다.</Say></Response>", media_type="application/xml")
    risk_list = state["risk_list"]
    desire_list = state["desire_list"]
    idx = state["current_idx"]
    if audio_url:
        user_text = await stt_service.speech_to_text(audio_url)
        question = get_next_question(risk_list, idx)
        save_answer(state, question, user_text)
        updated_risk_list, updated_desire_list = update_vulnerabilities(risk_list, desire_list, user_text)
        state["risk_list"] = updated_risk_list
        state["desire_list"] = updated_desire_list
        idx += 1
        state["current_idx"] = idx
        await save_session(call_sid, state)
        if not is_end(idx, updated_risk_list):
            next_question = get_next_question(updated_risk_list, idx)
            twiml = f'''
            <Response>
                <Say language="ko-KR">{next_question}</Say>
                <Record maxLength="10" action="/api/twilio/voice" method="POST" />
            </Response>
            '''.strip()
            return Response(content=twiml, media_type="application/xml")
        else:
            output = build_output(state)
            await send_result_to_spring(call_sid, output)
            await clear_session(call_sid)
            twiml = tts_service.text_to_twiml("상담을 종료합니다. 감사합니다.")
            return Response(content=twiml, media_type="application/xml")
    else:
        greeting = "안녕하십니까? AI 보이스 봇 입니다. 몇가지 궁금한 상황에 대해 여쭈어 보겠습니다."
        if risk_list:
            first_question = get_next_question(risk_list, 0)
        else:
            first_question = "질문이 없습니다."
        twiml = f'''
        <Response>
            <Say language="ko-KR">{greeting}</Say>
            <Pause length="1"/>
            <Say language="ko-KR">{first_question}</Say>
            <Record maxLength="10" action="/api/twilio/voice" method="POST" />
        </Response>
        '''.strip()
        return Response(content=twiml, media_type="application/xml")

@router.post("/api/test_redis", summary="Redis 테스트 API", tags=["Test"])
async def test_redis(request: Request):
    data = await request.json()
    name = data.get("name")
    phone = data.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="phone 필드는 필수입니다.")
    # Redis에 저장
    from app.services.session_service import save_session, get_session as get_session_async
    await save_session(phone, data)
    # Redis에서 꺼내오기
    loaded = await get_session_async(phone)
    return {
        "name": loaded.get("name"),
        "phone": loaded.get("phone")
    }


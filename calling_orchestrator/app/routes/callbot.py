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

# 콜봇(상담) 플로우 및 Twilio Webhook, 세션 관리 API
# 주요 엔드포인트: /api/receive, /api/twilio/voice 등
# 이 파일은 콜봇의 핵심 상담 흐름과 세션, 음성처리, Twilio 연동을 담당합니다.

SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

router = APIRouter()

@router.post("/api/receive", summary="Spring Boot → FastAPI: 취약계층 콜봇 전체 플로우", tags=["REST API"])
async def receive_user_data(user: UserData, background_tasks: BackgroundTasks):
    try:
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
    return {"result": "콜봇 플로우 시작", "call_sid": sid}

@router.api_route("/api/twilio/voice", methods=["GET", "POST"])
async def twilio_voice(request: Request):
    form = await request.form()
    audio_url = form.get("RecordingUrl")
    call_sid = form.get("CallSid")
    print(f"[Twilio Voice Webhook] method={request.method}, CallSid={call_sid}, RecordingUrl={audio_url}")
    state = await get_session(call_sid)
    if not state:
        twiml = """
        <Response>
            <Say language="ko-KR">세션 정보가 없습니다. 상담을 종료합니다.</Say>
        </Response>
        """
        return Response(content=twiml.strip(), media_type="application/xml")

    risk_list = state.get("risk_list", [])
    desire_list = state.get("desire_list", [])
    idx = state.get("current_idx", 0)
    # 추가: vulnerable 리스트가 끝난 후 추가 질문 플래그
    additional_check = state.get("additional_check", False)
    additional_asked = state.get("additional_asked", False)
    additional_answered = state.get("additional_answered", False)
    try:
        if audio_url:
            user_text = await stt_service.speech_to_text(audio_url)
            # vulnerable 리스트가 남아있으면 기존대로 처리
            if idx < len(risk_list):
                question = get_next_question(risk_list, idx)
                save_answer(state, question, user_text)
                state["script"].append(f"Q: {question} A: {user_text}")
                updated_risk_list, updated_desire_list = update_vulnerabilities(risk_list, desire_list, user_text)
                state["risk_list"] = updated_risk_list
                state["desire_list"] = updated_desire_list
                idx += 1
                state["current_idx"] = idx
                await save_session(call_sid, state)
                if idx < len(updated_risk_list):
                    next_question = get_next_question(updated_risk_list, idx)
                    twiml = f"""
                    <Response>
                        <Say language=\"ko-KR\">{next_question}</Say>
                        <Record maxLength=\"10\" action=\"{TWILIO_WEBHOOK_URL}\" method=\"POST\" />
                    </Response>
                    """
                    return Response(content=twiml.strip(), media_type="application/xml")
                else:
                    # vulnerable 리스트가 끝났으니 추가 질문 단계로
                    state["additional_check"] = True
                    state["additional_asked"] = False
                    await save_session(call_sid, state)
            # vulnerable 리스트가 끝난 후 추가 질문 단계
            if state.get("additional_check", False):
                if not state.get("additional_asked", False):
                    # 추가 불편사항 질문
                    twiml = f"""
                    <Response>
                        <Say language=\"ko-KR\">추가로 불편한 점 있으신가요? 있다면 말씀해 주세요. 없다면 '없다'고 말씀해 주세요.</Say>
                        <Record maxLength=\"10" action="{TWILIO_WEBHOOK_URL}" method="POST" />
                    </Response>
                    """
                    state["additional_asked"] = True
                    await save_session(call_sid, state)
                    return Response(content=twiml.strip(), media_type="application/xml")
                else:
                    # 답변 분석
                    if user_text.strip() and user_text.strip() not in ["없다", "없어요", "없습니다"]:
                        # LLM으로 타입 분류 후 리스트에 추가
                        try:
                            llm_type = await llm_service.classify_vulnerability(user_text)
                        except Exception:
                            llm_type = "기타"
                        state["risk_list"].append({"type": llm_type, "desc": user_text})
                        state["script"].append(f"Q: 추가로 불편한 점 있으신가요? A: {user_text} (분류: {llm_type})")
                        state["current_idx"] = len(state["risk_list"]) - 1
                        # 추가 질문 루프 재시작
                        state["additional_check"] = False
                        state["additional_asked"] = False
                        await save_session(call_sid, state)
                        next_question = get_next_question(state["risk_list"], state["current_idx"])
                        twiml = f"""
                        <Response>
                            <Say language=\"ko-KR\">{next_question}</Say>
                            <Record maxLength=\"10" action="{TWILIO_WEBHOOK_URL}" method="POST" />
                        </Response>
                        """
                        return Response(content=twiml.strip(), media_type="application/xml")
                    else:
                        # 추가 불편사항 없음 → 상담 종료 여부 확인
                        state["additional_answered"] = True
                        await save_session(call_sid, state)
                        twiml = f"""
                        <Response>
                            <Say language=\"ko-KR\">상담을 종료해도 괜찮으신가요?</Say>
                            <Record maxLength=\"10" action="{TWILIO_WEBHOOK_URL}" method="POST" />
                        </Response>
                        """
                        return Response(content=twiml.strip(), media_type="application/xml")
            # 상담 종료 여부 확인 단계
            if state.get("additional_answered", False):
                if user_text.strip() in ["네", "예", "괜찮아요", "종료", "네 종료해도 돼요"]:
                    output = build_output(state)
                    await send_result_to_spring(call_sid, output)
                    await clear_session(call_sid)
                    twiml = tts_service.text_to_twiml("상담을 종료합니다. 감사합니다.")
                    return Response(content=twiml, media_type="application/xml")
                else:
                    # 종료 거부 시 추가 질문 루프 재시작
                    state["additional_check"] = True
                    state["additional_asked"] = False
                    state["additional_answered"] = False
                    await save_session(call_sid, state)
                    twiml = f"""
                    <Response>
                        <Say language=\"ko-KR\">그렇다면 추가로 불편한 점 있으신가요? 있다면 말씀해 주세요.</Say>
                        <Record maxLength=\"10" action="{TWILIO_WEBHOOK_URL}" method="POST" />
                    </Response>
                    """
                    return Response(content=twiml.strip(), media_type="application/xml")
        else:
            greeting = "안녕하십니까? AI 보이스 봇 입니다. 몇가지 궁금한 상황에 대해 여쭈어 보겠습니다."
            first_question = get_next_question(risk_list, 0) if risk_list else "질문이 없습니다."
            twiml = f"""
            <Response>
                <Say language=\"ko-KR\">{greeting}</Say>
                <Pause length=\"1\" />
                <Say language=\"ko-KR\">{first_question}</Say>
                <Record maxLength=\"10" action="{TWILIO_WEBHOOK_URL}" method="POST" />
            </Response>
            """
            return Response(content=twiml.strip(), media_type="application/xml")
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[ERROR /api/twilio/voice] {e}\n{tb}")
        twiml = """
        <Response>
            <Say language="ko-KR">처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</Say>
        </Response>
        """
        return Response(content=twiml.strip(), media_type="application/xml")

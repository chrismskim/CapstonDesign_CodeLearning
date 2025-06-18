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
            "risk_list": [r.dict() for r in user.vulnerabilities.risk_list],
            "desire_list": [d.dict() for d in user.vulnerabilities.desire_list],
            "script": [],
            "answers": [],
            "start_time": time.time(),
            "before_risk": [r.dict() for r in user.vulnerabilities.risk_list],
            "before_desire": [d.dict() for d in user.vulnerabilities.desire_list],
            "user_phone": user.phone
        }
        await save_session(user.phone, session_data)
        question_data = jsonable_encoder(user.question_list)
        await redis_service.save_question_list(question_data)
        output = await callbot_flow(user, background_tasks)
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def callbot_flow(user: UserData, background_tasks: BackgroundTasks):
    formatted_phone = twilio_service.format_phone_number(user.phone)
    sid = twilio_service.make_call(formatted_phone)
    start_time = time.time()
    before_risk = list(user.vulnerabilities.risk_list)
    before_desire = list(user.vulnerabilities.desire_list)
    overall_script = []
    exception_handled = False
    deep_handled = False
    for risk in user.vulnerabilities.risk_list[:]:
        question = risk.content + " 아직도 문제가 있으신가요?"
        twilio_service.speak(formatted_phone, question)
        answer = await stt_service.listen(formatted_phone)
        script_logger.log_interaction(question, answer)
        overall_script.append(f"Q: {question} A: {answer}")
        result = classify_answer(answer)
        if result["type"] == 0 and not exception_handled:
            end_time = time.time()
            output = {
                "overall_script": "\n".join(overall_script),
                "summary": result["reason"],
                "result": 0,
                "fail_code": result["fail_code"],
                "need_human": 0,
                "runtime": int(end_time - start_time),
                "result_vulnerabilities": {},
                "delete_vulnerabilities": {},
                "new_vulnerabilities": {}
            }
            exception_handled = True
            return output
        elif result["type"] == 3 and not deep_handled:
            deep_handled = True
            need_human = 1
        elif result["type"] == 1:
            if not any(r.content == result["category"] for r in user.vulnerabilities.risk_list):
                user.vulnerabilities.risk_list.append(type(risk)(risk_index_list=[0], content=result["category"]))
        elif result["type"] == 2:
            if not any(d.content == result["category"] for d in user.vulnerabilities.desire_list):
                user.vulnerabilities.desire_list.append(type(user.vulnerabilities.desire_list[0])(desire_type=[0], content=result["category"]))
    twilio_service.speak(formatted_phone, "추가 불편사항 있으신가요?")
    extra = await stt_service.listen(formatted_phone)
    overall_script.append(f"Q: 추가 불편사항 있으신가요? A: {extra}")
    if extra and extra.strip():
        user.vulnerabilities = llm_service.update_vulnerable_list(user.vulnerabilities, extra)
    twilio_service.speak(formatted_phone, "통화를 종료합니다.")
    end_time = time.time()
    after_risk = user.vulnerabilities.risk_list
    after_desire = user.vulnerabilities.desire_list
    deleted_risk, new_risk = diff_list(before_risk, after_risk), diff_list(after_risk, before_risk)
    deleted_desire, new_desire = diff_list(before_desire, after_desire), diff_list(after_desire, before_desire)
    risk_index_count = count_index(after_risk, 'risk_index_list')
    desire_index_count = count_index(after_desire, 'desire_type')
    del_risk_index_count = count_index(deleted_risk[0], 'risk_index_list')
    del_desire_index_count = count_index(deleted_desire[0], 'desire_type')
    new_risk_index_count = count_index(new_risk[0], 'risk_index_list')
    new_desire_index_count = count_index(new_desire[0], 'desire_type')
    summary = llm_service.generate_response("다음 대화 내용을 요약해줘: " + " ".join(overall_script))
    result = 2 if not exception_handled else 0
    fail_code = 0
    need_human = 1 if deep_handled else 0
    output = {
        "overall_script": "\n".join(overall_script),
        "summary": summary,
        "result": result,
        "fail_code": fail_code,
        "need_human": need_human,
        "runtime": int(end_time - start_time),
        "result_vulnerabilities": {
            "risk_list": [r.dict() for r in after_risk],
            "desire_list": [d.dict() for d in after_desire],
            "risk_index_count": risk_index_count,
            "desire_index_count": desire_index_count
        },
        "delete_vulnerabilities": {
            "risk_list": [r.dict() for r in deleted_risk[0]],
            "desire_list": [d.dict() for d in deleted_desire[0]],
            "risk_index_count": del_risk_index_count,
            "desire_index_count": del_desire_index_count
        },
        "new_vulnerabilities": {
            "risk_list": [r.dict() for r in new_risk[0]],
            "desire_list": [d.dict() for d in new_desire[0]],
            "risk_index_count": new_risk_index_count,
            "desire_index_count": new_desire_index_count
        }
    }
    return output

@router.post("/api/twilio/voice")
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

@router.post("/api/llm_test", summary="LLM 취약유형 요약 테스트", tags=["Test"])
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

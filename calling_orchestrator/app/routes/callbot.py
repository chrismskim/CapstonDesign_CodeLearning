from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Response
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, twilio_service, stt_service, llm_service, script_logger, tts_service
from app.services.classify_service import classify_answer
from app.utils.diff_utils import count_index, diff_list
import time
import httpx
import os

SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

router = APIRouter()

@router.post("/api/receive", summary="Spring Boot → FastAPI: 취약계층 콜봇 전체 플로우", tags=["REST API"])
async def receive_user_data(user: UserData, background_tasks: BackgroundTasks):
    try:
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

# 임시 세션 상태 저장 (실제 서비스는 Redis/DB 사용 권장)
session_state = {}

@router.post("/api/twilio/voice")
async def twilio_voice(request: Request):
    form = await request.form()
    audio_url = form.get("RecordingUrl")
    call_sid = form.get("CallSid")
    start_time = session_state.get(call_sid, {}).get("start_time") or time.time()

    if call_sid not in session_state:
        dummy_risk_list = ["주거문제", "의료문제", "경제문제"]
        dummy_desire_list = []
        session_state[call_sid] = {
            "current_idx": 0,
            "risk_list": dummy_risk_list,
            "desire_list": dummy_desire_list,
            "script": [],
            "answers": [],
            "start_time": start_time,
            "before_risk": list(dummy_risk_list),
            "before_desire": list(dummy_desire_list)
        }

    state = session_state[call_sid]
    risk_list = state["risk_list"]
    desire_list = state["desire_list"]
    idx = state["current_idx"]
    script = state["script"]
    answers = state["answers"]
    before_risk = state["before_risk"]
    before_desire = state["before_desire"]

    if audio_url:
        user_text = await stt_service.speech_to_text(audio_url)
        question = f"{idx+1}번째 질문입니다. {risk_list[idx]}는 아직도 문제가 있으신가요?"
        script.append(f"Q: {question} A: {user_text}")
        answers.append(user_text)
        # LLM을 이용해 risk_list/desire_list 업데이트
        updated_risk_list = llm_service.update_vulnerable_list(risk_list, user_text)
        updated_desire_list = llm_service.update_vulnerable_list(desire_list, user_text)
        state["risk_list"] = updated_risk_list
        state["desire_list"] = updated_desire_list
        idx += 1
        state["current_idx"] = idx
        if idx < len(updated_risk_list):
            next_question = f"{idx+1}번째 질문입니다. {updated_risk_list[idx]}는 아직도 문제가 있으신가요?"
            twiml = f'''
            <Response>
                <Say language="ko-KR">{next_question}</Say>
                <Record maxLength="10" action="/api/twilio/voice" method="POST" />
            </Response>
            '''.strip()
            return Response(content=twiml, media_type="application/xml")
        else:
            # 상담 종료: Spring Boot로 전체 결과 전달
            end_time = time.time()
            runtime = int(end_time - start_time)
            after_risk = updated_risk_list
            after_desire = updated_desire_list
            # diff 계산
            from app.utils.diff_utils import count_index, diff_list
            deleted_risk, new_risk = diff_list(before_risk, after_risk), diff_list(after_risk, before_risk)
            deleted_desire, new_desire = diff_list(before_desire, after_desire), diff_list(after_desire, before_desire)
            risk_index_count = count_index(after_risk, 'risk_index_list') if after_risk and hasattr(after_risk[0], 'risk_index_list') else {}
            desire_index_count = count_index(after_desire, 'desire_type') if after_desire and hasattr(after_desire[0], 'desire_type') else {}
            del_risk_index_count = count_index(deleted_risk[0], 'risk_index_list') if deleted_risk and deleted_risk[0] else {}
            del_desire_index_count = count_index(deleted_desire[0], 'desire_type') if deleted_desire and deleted_desire[0] else {}
            new_risk_index_count = count_index(new_risk[0], 'risk_index_list') if new_risk and new_risk[0] else {}
            new_desire_index_count = count_index(new_desire[0], 'desire_type') if new_desire and new_desire[0] else {}
            summary = llm_service.generate_response("다음 대화 내용을 요약해줘: " + " ".join(script))
            result = 2  # 실제 로직에 따라 0/1/2 결정
            fail_code = 0
            need_human = 0
            output = {
                "overall_script": "\n".join(script),
                "summary": summary,
                "result": result,
                "fail_code": fail_code,
                "need_human": need_human,
                "runtime": runtime,
                "result_vulnerabilities": {
                    "risk_list": [r for r in after_risk],
                    "desire_list": [d for d in after_desire],
                    "risk_index_count": risk_index_count,
                    "desire_index_count": desire_index_count
                },
                "delete_vulnerabilities": {
                    "risk_list": [r for r in deleted_risk[0]] if deleted_risk and deleted_risk[0] else [],
                    "desire_list": [d for d in deleted_desire[0]] if deleted_desire and deleted_desire[0] else [],
                    "risk_index_count": del_risk_index_count,
                    "desire_index_count": del_desire_index_count
                },
                "new_vulnerabilities": {
                    "risk_list": [r for r in new_risk[0]] if new_risk and new_risk[0] else [],
                    "desire_list": [d for d in new_desire[0]] if new_desire and new_desire[0] else [],
                    "risk_index_count": new_risk_index_count,
                    "desire_index_count": new_desire_index_count
                }
            }
            async with httpx.AsyncClient() as client:
                await client.post(SPRING_BOOT_URL, json=output)
            del session_state[call_sid]
            twiml = tts_service.text_to_twiml("상담을 종료합니다. 감사합니다.")
            return Response(content=twiml, media_type="application/xml")
    else:
        greeting = "안녕하십니까? AI 보이스 봇 입니다. 몇가지 궁금한 상황에 대해 여쭈어 보겠습니다."
        if risk_list:
            first_question = f"첫 번째 질문입니다. {risk_list[0]}는 아직도 문제가 있으신가요?"
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

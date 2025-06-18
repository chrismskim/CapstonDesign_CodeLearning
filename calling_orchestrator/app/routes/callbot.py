from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, twilio_service, stt_service, llm_service, script_logger
from app.services.classify_service import classify_answer
from app.utils.diff_utils import count_index, diff_list
import time

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

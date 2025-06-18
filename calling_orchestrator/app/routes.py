### routes.py
from fastapi import APIRouter, HTTPException, Request, Query, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, twilio_service, stt_service, llm_service, tts_service, script_logger
from fastapi.responses import Response, JSONResponse
import httpx
import time
import os

router = APIRouter()

TWILIO_WEBHOOK_URL = os.getenv("TWILIO_WEBHOOK_URL", "https://9b3e-211-178-193-29.ngrok-free.app/api/twilio/voice")
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

def make_vulnerable_question(item: str) -> str:
    # 취약 항목별 질문 생성
    if item == "주거문제":
        return "주거문제는 아직도 문제가 있으신가요?"
    # 필요시 다른 항목 추가
    return f"{item}에 대해 아직도 문제가 있으신가요?"

def count_index(list_items, index_field):
    count = {}
    for item in list_items:
        for idx in getattr(item, index_field):
            count[str(idx)] = count.get(str(idx), 0) + 1
    return count

def diff_list(before, after, key='content'):
    before_set = set(getattr(x, key) for x in before)
    after_set = set(getattr(x, key) for x in after)
    deleted = [x for x in before if getattr(x, key) not in after_set]
    new = [x for x in after if getattr(x, key) not in before_set]
    return deleted, new

async def callbot_flow(user: UserData, background_tasks: BackgroundTasks):
    from app.services import twilio_service, stt_service, llm_service, redis_service, script_logger
    formatted_phone = format_phone_number(user.phone)
    sid = twilio_service.make_call(formatted_phone, twiml_url=TWILIO_WEBHOOK_URL)
    start_time = time.time()
    before_risk = list(user.vulnerabilities.risk_list)
    before_desire = list(user.vulnerabilities.desire_list)
    overall_script = []
    exception_handled = False
    deep_handled = False
    # risk_list 기반 질문/응답/판별/저장
    for risk in user.vulnerabilities.risk_list[:]:
        question = risk.content + " 아직도 문제가 있으신가요?"
        twilio_service.speak(formatted_phone, question)
        answer = await stt_service.listen(formatted_phone)
        script_logger.log_interaction(question, answer)
        overall_script.append(f"Q: {question} A: {answer}")
        result = classify_answer(answer)
        if result["type"] == 0 and not exception_handled:
            # 예외처리: 상담 불가
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
            # 심층상담
            deep_handled = True
            need_human = 1
        elif result["type"] == 1:
            # 위기상황: risk_list 업데이트(중복 방지)
            if not any(r.content == result["category"] for r in user.vulnerabilities.risk_list):
                user.vulnerabilities.risk_list.append(type(risk)(risk_index_list=[0], content=result["category"]))
        elif result["type"] == 2:
            # 욕구상황: desire_list 업데이트(중복 방지)
            if not any(d.content == result["category"] for d in user.vulnerabilities.desire_list):
                user.vulnerabilities.desire_list.append(type(user.vulnerabilities.desire_list[0])(desire_type=[0], content=result["category"]))
    # 추가 불편사항
    twilio_service.speak(formatted_phone, "추가 불편사항 있으신가요?")
    extra = await stt_service.listen(formatted_phone)
    overall_script.append(f"Q: 추가 불편사항 있으신가요? A: {extra}")
    if extra and extra.strip():
        user.vulnerabilities = llm_service.update_vulnerable_list(user.vulnerabilities, extra)
    twilio_service.speak(formatted_phone, "통화를 종료합니다.")
    end_time = time.time()
    # diff 계산
    after_risk = user.vulnerabilities.risk_list
    after_desire = user.vulnerabilities.desire_list
    deleted_risk, new_risk = diff_list(before_risk, after_risk), diff_list(after_risk, before_risk)
    deleted_desire, new_desire = diff_list(before_desire, after_desire), diff_list(after_desire, before_desire)
    # count 계산
    risk_index_count = count_index(after_risk, 'risk_index_list')
    desire_index_count = count_index(after_desire, 'desire_type')
    del_risk_index_count = count_index(deleted_risk[0], 'risk_index_list')
    del_desire_index_count = count_index(deleted_desire[0], 'desire_type')
    new_risk_index_count = count_index(new_risk[0], 'risk_index_list')
    new_desire_index_count = count_index(new_desire[0], 'desire_type')
    # 요약/상담 결과(LLM 활용 예시)
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

def classify_answer(answer: str) -> dict:
    """
    답변을 분석해 type 0(예외처리), 1(위기), 2(욕구), 3(심층상담) 분류
    욕구 관련 답변은 LLM을 이용해 type/카테고리 판별
    """
    from app.services import llm_service
    exception_keywords = ["신상정보불일치", "상담거부", "의사소통불가", "부적절한답변", "연결끊어짐", "전화미수신"]
    risk_keywords = ["요금체납", "주거위기", "고용위기", "급여", "긴급상황", "건강위기", "에너지위기"]
    deep_keywords = ["심층상담", "중대함"]
    for idx, word in enumerate(exception_keywords, 1):
        if word in answer:
            return {"type": 0, "reason": word, "fail_code": idx}
    for word in deep_keywords:
        if word in answer:
            return {"type": 3, "reason": word}
    for word in risk_keywords:
        if word in answer:
            return {"type": 1, "category": word}
    # 욕구 관련 답변은 LLM으로 판별
    prompt = f"다음 답변이 욕구(Desire) 상황에 해당하면 type 2, 심층상담이면 type 3, 아니면 -1을 반환하고, 해당하는 욕구 카테고리(안전, 건강, 일상생활유지, 가족관계, 사회적 관계, 경제, 교육, 고용, 생활환경, 법률 및 권익보장, 기타) 또는 심층상담 사유를 함께 알려줘. 답변: {answer}"
    llm_result = llm_service.generate_response(prompt)
    # 예시: 'type:2, category:경제' 또는 'type:3, reason:심층상담을 원함'
    import re
    m = re.search(r'type\s*:?\s*(\d+)', llm_result)
    if m:
        type_num = int(m.group(1))
        if type_num == 2:
            cat = re.search(r'category\s*:?\s*([\w가-힣]+)', llm_result)
            return {"type": 2, "category": cat.group(1) if cat else "기타"}
        elif type_num == 3:
            reason = re.search(r'reason\s*:?\s*([\w가-힣 ]+)', llm_result)
            return {"type": 3, "reason": reason.group(1) if reason else "심층상담"}
    return {"type": -1}  # 분류 불가

# [POST] /api/receive
@router.post("/api/receive", summary="Spring Boot → FastAPI: 취약계층 콜봇 전체 플로우", tags=["REST API"])
async def receive_user_data(user: UserData, background_tasks: BackgroundTasks):
    """
    Spring Boot에서 사용자 정보 및 질문 리스트를 전달받아 Redis에 저장하고, Twilio로 전화를 발신합니다.
    - 요청 데이터: UserData(JSON)
    - 응답: 처리 결과 및 call sid
    """
    try:
        question_data = jsonable_encoder(user.question_list)
        await redis_service.save_question_list(question_data)
        # user 전체를 콜봇 플로우에 전달
        output = await callbot_flow(user, background_tasks)
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# [POST] /api/twilio/voice
@router.post("/api/twilio/voice")
async def handle_twilio_voice(request: Request):
    form_data = await request.form()
    audio_url = form_data.get("RecordingUrl")

    try:
        # 최초 진입: 사용자 입력이 없으면 인사말 먼저 출력
        if audio_url is None:
            greeting = "안녕하십니까. 상담을 시작하겠습니다. 질문에 답변해 주세요."
            twiml_response = tts_service.text_to_twiml(greeting)
            return Response(content=twiml_response, media_type="application/xml")

        user_input = await stt_service.speech_to_text(audio_url)
        answer = await redis_service.find_answer(user_input)
        if not answer:
            answer = llm_service.generate_response(user_input)

        script_logger.log_interaction(user_input, answer)
        twiml_response = tts_service.text_to_twiml(answer)
        return Response(content=twiml_response, media_type="application/xml")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

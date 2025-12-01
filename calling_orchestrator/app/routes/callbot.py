from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Response, Body, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from app.models import UserData
# 'classify_service'를 추가로 import 합니다.
from app.services import redis_service, llm_service, classify_service
from app.services.answer_service import save_answer, update_vulnerabilities
# 세션 서비스 함수의 파라미터 이름이 변경됨에 따라 코드를 수정합니다.
from app.services.session_service import save_session, get_session, clear_session
from app.services.question_service import get_next_question
from app.services.result_service import build_output, send_result_to_spring
import time
import os
import traceback # 오류 추적을 위해 추가

SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

router = APIRouter()

@router.post("/api/receive", summary="Spring Boot → FastAPI: 상담 시작 데이터 수신", tags=["REST API"])
async def receive_user_data(user: UserData):
    try:
        session_data = {
            "v_id": user.vulnerable_id,  # [추가] Spring Boot에서 받은 ID를 세션에 저장
            "s_index": user.s_index, # [추가] 세션에 저장
            "current_idx": 0,
            "q_id": user.q_id,
            "risk_list": [r.model_dump() for r in user.vulnerabilities.risk_list],
            "desire_list": [d.model_dump() for d in user.vulnerabilities.desire_list],
            "script": [],
            "answers": [],
            "start_time": time.time(),
            "before_risk": [r.model_dump() for r in user.vulnerabilities.risk_list],
            "before_desire": [d.model_dump() for d in user.vulnerabilities.desire_list],
            "user_phone": user.phone,
            "need_human": 0 # [추가] 상담사 연결 요청 플래그
        }
        session_key = user.phone.replace("-", "") 
        await save_session(session_key, session_data)
        question_data = jsonable_encoder(user.question_list)
        await redis_service.save_question_list(question_data)
        return {"result": "상담 데이터 저장 완료, 웹소켓 연결 대기중", "user_phone": user.phone}
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR /api/receive] {e}\n{tb}")
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{tb}")

@router.websocket("/api/ws/call/{user_phone}")
async def websocket_call_endpoint(websocket: WebSocket, user_phone: str):
    await websocket.accept()
    state = await get_session(user_phone)

    if not state:
        await websocket.send_text("세션 정보가 없습니다. 연결을 종료합니다.")
        await websocket.close()
        return

    try:
        # === 1단계: 인사 ===
        greeting = "안녕하십니까? AI 보이스 봇 입니다. 몇가지 궁금한 상황에 대해 여쭈어 보겠습니다."
        await websocket.send_text(greeting)
        
        risk_list = state.get("risk_list", [])
        state["current_idx"] = 0 # 인덱스 초기화

        # === 2단계: 기존 위기/욕구 목록 확인 루프 ===
        while state["current_idx"] < len(risk_list):
            current_idx = state["current_idx"]
            # [수정] risk_list[current_idx]가 딕셔너리인지 확인
            if not isinstance(risk_list[current_idx], dict) or 'content' not in risk_list[current_idx]:
                print(f"잘못된 risk_list 항목: {risk_list[current_idx]}. 스킵합니다.")
                state["current_idx"] += 1
                continue

            question_content = risk_list[current_idx]['content']
            question = f"{current_idx + 1}번째 질문입니다. '{question_content}' 문제는 아직도 해결되지 않으셨나요?"
            
            await websocket.send_text(question)
            state["script"].append(f"Q: {question}")
            
            user_text = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][extra_answer] {repr(user_text)}")
            save_answer(state, question, user_text)

            # [MOD 1] 문제가 해결되었는지 간단히 확인
            is_resolved = any(keyword in user_text for keyword in ["해결", "없", "아니", "괜찮"])

            if not is_resolved:
                # 1-A. 문제가 해결되지 않음 (예: "네, 그대로입니다")
                help_question = f"'{question_content}' 문제 해결을 위해 전문 상담사를 연결해 드릴까요?"
                await websocket.send_text(help_question)
                state["script"].append(f"Q: {help_question}")

                help_answer = await websocket.receive_text()
                save_answer(state, help_question, help_answer)
                
                if any(keyword in help_answer for keyword in ["네", "예", "연결", "필요"]):
                    state["need_human"] = 1 # 1 = 사용자 요청
                    state["script"].append(f"(사용자가 '{question_content}' 관련 상담사 연결 요청함)")
            
            # 1-B. 문제가 해결됨 (예: "해결 되었습니다")
            # (else: is_resolved) -> 아무것도 안하고 다음 질문으로 넘어감

            # (공통) 사용자의 답변을 기반으로 리스트 업데이트 (기존 로직 유지)
            updated_risk_list, updated_desire_list = update_vulnerabilities(state["risk_list"], state["desire_list"], user_text)
            state["risk_list"] = updated_risk_list
            state["desire_list"] = updated_desire_list

            # 다음 질문으로 이동
            state["current_idx"] += 1
            await save_session(user_phone, state)
            
            # 업데이트된 리스트를 기준으로 다음 루프를 돌아야 하므로 risk_list 갱신
            risk_list = state.get("risk_list", [])

        # === 3단계: 추가 불편 사항 질문 루프 ===
        while True:
            extra_question = "추가로 불편한 점이 있으신가요? 있다면 말씀해주시고, 없다면 '없다'고 말씀해주세요."
            await websocket.send_text(extra_question)
            state["script"].append(f"Q: {extra_question}")

            extra_answer = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][extra_answer] {repr(extra_answer)}")
            save_answer(state, extra_question, extra_answer)

            if any(keyword in extra_answer for keyword in ["없", "아니", "괜찮"]):
                # (예: "아니요 없습니다.") -> 루프 종료
                break
            
            # [MOD 2] 신규 문제가 있음 (예: "네 있어요" 또는 "요즘 허리가 않좋습니다.")
            
            # === 추가된 로직 시작: 무엇이 불편한지, 왜 불편한지 상세 질문 ===
            
            # 1. 무엇이 불편한지 질문
            what_question = "어디가 어떻게 불편하신지 구체적으로 말씀해 주시겠습니까?"
            await websocket.send_text(what_question)
            state["script"].append(f"Q: {what_question}")
            
            what_answer = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][what_answer] {repr(what_answer)}")
            save_answer(state, what_question, what_answer)

            # 2. 왜 불편한지(원인) 질문
            why_question = "그러한 문제가 발생한 원인이나 이유를 알고 계신가요?"
            await websocket.send_text(why_question)
            state["script"].append(f"Q: {why_question}")
            
            why_answer = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][what_answer] {repr(why_answer)}")

            save_answer(state, why_question, why_answer)
            
            # === 추가된 로직 끝 ===

            # [수정됨] 3. 상세 질문 3종 (긴급성 -> 일상생활 -> 보호자)
            
            # 3-1. 긴급성 확인
            urgency_question = "지금 당장 응급조치가 필요한가요?"
            await websocket.send_text(urgency_question)
            state["script"].append(f"Q: {urgency_question}")
            
            urgency_answer = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][what_answer] {repr(urgency_answer)}")
            save_answer(state, urgency_question, urgency_answer)

            # 3-2. 일상생활 불편 확인
            adl_question = "일상생활에 얼마나 불편을 주나요?"
            await websocket.send_text(adl_question)
            state["script"].append(f"Q: {adl_question}")
            
            adl_answer = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][what_answer] {repr(adl_answer)}")
            save_answer(state, adl_question, adl_answer)

            # 3-3. 보호자 여부 확인
            guardian_question = "곁에 도와줄 분이 계신가요?"
            await websocket.send_text(guardian_question)
            state["script"].append(f"Q: {guardian_question}")
            
            guardian_answer = await websocket.receive_text()
            print(f"[WS RECV][{user_phone}][what_answer] {repr(guardian_answer)}")
            save_answer(state, guardian_question, guardian_answer)

            # 4. LLM을 이용해 문제 카테고리화 (예: "허리 통증")
            try:
                # 수집된 모든 답변(상세 3종 포함)을 프롬프트에 포함
                prompt = (f"다음 사용자 불편 사항을 2-3 단어의 명사형(예: '허리 통증', '경제적 어려움')으로 요약해줘: "
                          f"'{extra_answer} {what_answer} {why_answer}. "
                          f"긴급성: {urgency_answer}, 일상생활: {adl_answer}, 보호자: {guardian_answer}'")
                
                problem_category = llm_service.generate_response(prompt)
                if not problem_category: # LLM 실패 시 fallback
                    problem_category = what_answer[:10] + "..."
            except Exception as e:
                print(f"LLM 요약 실패: {e}")
                problem_category = what_answer[:10] + "..." # Fallback
            
            # 5. 카테고리화된 문제로 후속 질문 (예: "'허리 통증' 관련하여...")
            offer_help_question = f"혹시, '{problem_category}' 관련하여 상담사 연결이 필요하신가요?"
            await websocket.send_text(offer_help_question)
            state["script"].append(f"Q: {offer_help_question}")
            
            offer_help_answer = await websocket.receive_text()
            save_answer(state, offer_help_question, offer_help_answer)

            if any(keyword in offer_help_answer for keyword in ["네", "예", "연결", "필요"]):
                state["need_human"] = 1 # 1 = 사용자 요청
                state["script"].append(f"(사용자가 '{problem_category}' 관련 상담사 연결 요청함)")

            # 6. 분석된 신규 문제를 최종 결과에 포함하기 위해 state에 저장
            # 내용에 긴급성, ADL, 보호자 답변을 모두 포함하여 저장
            new_problem_content = (f"{problem_category}: {what_answer} "
                                   f"(원인: {why_answer}, 긴급성: {urgency_answer}, "
                                   f"생활불편: {adl_answer}, 보호자: {guardian_answer})")
            
            # [수정] 분류 서비스 호출 (점수 분석 포함)
            classification_result = classify_service.classify_answer(new_problem_content)
            problem_type = classification_result.get("type", -1)
            
            # [수정] 점수 정보가 포함된 상세 내용(content)을 저장
            final_content = classification_result.get("content", new_problem_content)

            if problem_type == 1: # 위기 (주의 단계)
                state["risk_list"].append({
                    "risk_index_list": [classification_result.get("category_index", 99)], 
                    "content": final_content
                })
            else: # 욕구 또는 기타 (양호 단계)
                state["desire_list"].append({
                    "desire_type": [classification_result.get("category_index", 99)], 
                    "content": final_content
                })
            
            if problem_type == 3: # 심층상담 (심각 단계)
                state["need_human"] = 2 # 2 = 중대사항 발견 (즉시 알림 대상)
                # 심각한 경우 명시적으로 위기 리스트에 추가 (카테고리 99: 긴급)
                state["risk_list"].append({
                    "risk_index_list": [99], 
                    "content": final_content
                })

            await save_session(user_phone, state)
            
            # [MOD 3] 루프 처음으로 돌아가 "추가로 불편한 점이..." 다시 질문

        # === 4단계: 상담 종료 ===
        await websocket.send_text("상담을 종료합니다. 감사합니다.")
        output = build_output(state, result=1, need_human=state.get("need_human", 0)) # result=1 (상담 양호)
        
        # need_human이 1(요청) 또는 2(중대)이면 result=2(심층상담필요)로 변경
        if state.get("need_human", 0) > 0:
            output["result"] = 2 

        await send_result_to_spring(user_phone, output)
        await clear_session(user_phone)

    except WebSocketDisconnect:
        print(f"클라이언트 연결이 끊어졌습니다: {user_phone}")
        # 연결 끊어짐 (fail_code=5)
        output = build_output(state, result=0, fail_code=5, need_human=state.get("need_human", 0))
        await send_result_to_spring(user_phone, output)
        await clear_session(user_phone)
    
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR /api/ws/call] {e}\n{tb}")
        # 기타 오류 (fail_code=99)
        output = build_output(state, result=0, fail_code=99, need_human=state.get("need_human", 0))
        await send_result_to_spring(user_phone, output)
        await clear_session(user_phone)

    finally:
        if websocket.client_state.name != 'DISCONNECTED':
             await websocket.close()
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Response, Body, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from app.models import UserData
from app.services import redis_service, llm_service
from app.services.answer_service import save_answer, update_vulnerabilities
from app.services.session_service import save_session, get_session, clear_session
from app.services.question_service import get_next_question
from app.services.result_service import build_output, send_result_to_spring
import time
import os

SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

router = APIRouter()

@router.post("/api/receive", summary="Spring Boot → FastAPI: 상담 시작 데이터 수신", tags=["REST API"])
async def receive_user_data(user: UserData):
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
        return {"result": "상담 데이터 저장 완료, 웹소켓 연결 대기중", "user_phone": user.phone}
    except Exception as e:
        import traceback
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
        greeting = "안녕하십니까? AI 보이스 봇 입니다. 몇가지 궁금한 상황에 대해 여쭈어 보겠습니다."
        await websocket.send_text(greeting)
        
        risk_list = state.get("risk_list", [])
        question = get_next_question(risk_list, 0) if risk_list else "드릴 질문이 없습니다. 상담을 종료합니다."
        await websocket.send_text(question)
        state["script"].append(f"Q: {question}")
        
        async for user_text in websocket.iter_text():
            question_asked = get_next_question(risk_list, state.get("current_idx", 0))
            save_answer(state, question_asked, user_text)
            
            updated_risk_list, updated_desire_list = update_vulnerabilities(state["risk_list"], state["desire_list"], user_text)
            state["risk_list"] = updated_risk_list
            state["desire_list"] = updated_desire_list
            
            state["current_idx"] += 1
            await save_session(user_phone, state)

            next_question = get_next_question(updated_risk_list, state["current_idx"])
            
            if next_question:
                await websocket.send_text(next_question)
            else:
                await websocket.send_text("추가로 불편한 점이 있으신가요? 있다면 말씀해주시고, 없다면 '없다'고 말씀해주세요.")
                
                extra_answer = await websocket.receive_text()
                save_answer(state, "추가로 불편한 점이 있으신가요?", extra_answer)

                if "없" in extra_answer:
                    await websocket.send_text("상담을 종료합니다. 감사합니다.")
                    output = build_output(state)
                    await send_result_to_spring(user_phone, output)
                    await clear_session(user_phone)
                    break
                else:
                    try:
                        llm_type = llm_service.classify_vulnerability(extra_answer)
                    except Exception:
                        llm_type = "기타"
                    state["risk_list"].append({"type": llm_type, "desc": extra_answer})
                    state["current_idx"] = len(state["risk_list"]) - 1
                    await save_session(user_phone, state)

                    new_question = get_next_question(state["risk_list"], state["current_idx"])
                    await websocket.send_text(new_question)

    except WebSocketDisconnect:
        print(f"클라이언트 연결이 끊어졌습니다: {user_phone}")
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[ERROR /api/ws/call] {e}\n{tb}")
    finally:
        if websocket.client_state.name != 'DISCONNECTED':
             await websocket.close()
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response
import os

app = FastAPI()

# [정리] 삭제된 twilio_service를 사용하던 테스트 코드를 모두 삭제합니다.

@app.post("/api/llm_test", summary="LLM 취약유형 요약 테스트", tags=["Test"])
async def llm_test(request: Request):
    data = await request.json()
    if isinstance(data, list):
        script = data
    elif isinstance(data, dict):
        script = data.get("script")
    else:
        return {"error": "script 필드를 리스트로 보내거나, {\"script\": [...]} 형태로 보내세요."}
    if not script:
        return {"error": "script 필드는 필수입니다."}
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


@app.post("/api/test_redis", summary="Redis 테스트 API", tags=["Test"])
async def test_redis(request: Request):
    data = await request.json()
    name = data.get("name")
    phone = data.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="phone 필드는 필수입니다.")
    from app.services.session_service import save_session, get_session as get_session_async
    await save_session(phone, data)
    loaded = await get_session_async(phone)
    result = {
        "이름": loaded.get("name"),
        "전화번호": loaded.get("phone"),
        "취약정보": loaded.get("vulnerabilities") or loaded.get("vulnerability") or loaded.get("risk_list")
    }
    return result

# ... (이하 나머지 테스트 코드는 동일) ...
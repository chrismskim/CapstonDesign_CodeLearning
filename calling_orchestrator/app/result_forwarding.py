# result_forwarding.py
# LLM 결과 Spring Boot 전송 등 외부 연동/보조 API
# Twilio Webhook, 전화 발신 등은 callbot.py로 통합됨
# 이 파일은 보조적 외부 연동 기능만 담당합니다.

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import httpx
import os

router = APIRouter()

SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/consult/result")

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

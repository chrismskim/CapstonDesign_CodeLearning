import httpx
import os
from datetime import datetime # [추가] 시간 처리를 위해 import
from app.utils.diff_utils import count_index, diff_list
from app.services import llm_service

# [수정] URL 일치시킴
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080/api/call/send_llm_result")

def build_output(state, result=2, fail_code=0, need_human=0):
    script = state["script"]
    before_risk = state["before_risk"]
    before_desire = state["before_desire"]
    after_risk = state["risk_list"]
    after_desire = state["desire_list"]
    
    import time
    runtime = int(time.time() - state["start_time"])
    
    # [추가] 현재 시간을 ISO 8601 포맷 문자열로 생성
    current_time_str = datetime.now().isoformat()

    deleted_risk, new_risk = diff_list(before_risk, after_risk), diff_list(after_risk, before_risk)
    deleted_desire, new_desire = diff_list(before_desire, after_desire), diff_list(after_desire, before_desire)
    
    risk_index_count = count_index(after_risk, 'risk_index_list') if after_risk and after_risk[0] and hasattr(after_risk[0], 'risk_index_list') else {}
    desire_index_count = count_index(after_desire, 'desire_type') if after_desire and after_desire[0] and hasattr(after_desire[0], 'desire_type') else {}
    del_risk_index_count = count_index(deleted_risk[0], 'risk_index_list') if deleted_risk and deleted_risk[0] else {}
    del_desire_index_count = count_index(deleted_desire[0], 'desire_type') if deleted_desire and deleted_desire[0] else {}
    new_risk_index_count = count_index(new_risk[0], 'risk_index_list') if new_risk and new_risk[0] else {}
    new_desire_index_count = count_index(new_desire[0], 'desire_type') if new_desire and new_desire[0] else {}

    summary = llm_service.generate_response("다음 대화 내용을 요약해줘: " + " ".join(script))
    
    output = {
        # [추가] 취약계층 ID 포함 (세션에 저장된 경우)
        "v_id": state.get("v_id"), 
        "s_index": state.get("s_index", 0), # [추가] 결과에 포함
        "q_id": state.get("q_id"),
        "overall_script": "\n".join(script),
        "summary": summary,
        "result": result,
        "fail_code": fail_code,
        "need_human": need_human,
        "runtime": runtime,
        "time": current_time_str, # [추가] 시간 필드 포함
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
    print(f"[INFO build_output] Built output: {output}")
    return output

async def send_result_to_spring(user_phone, output):
    output['user_phone'] = user_phone 
    async with httpx.AsyncClient() as client:
        await client.post(SPRING_BOOT_URL, json=output)
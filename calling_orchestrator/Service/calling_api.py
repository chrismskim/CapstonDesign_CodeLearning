# ✅ calling_orchestrator/Service/calling_api.py
import requests
import os

CALLING_SERVICE_URL = os.getenv("CALLING_SERVICE_URL", "http://localhost:8000/api/call_result")


def send_call_result(call_sid: str, summary: str, full_log: str):
    data = {
        "call_sid": call_sid,
        "summary": summary,
        "full_log": full_log,
        "needs_followup": "Y" if "상담" in summary else "N"
    }
    try:
        response = requests.post(CALLING_SERVICE_URL, json=data)
        print(f"[Calling API] 상태코드 {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[Calling API 오류] {str(e)}")

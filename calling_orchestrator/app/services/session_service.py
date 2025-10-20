import json
import time
from app.config import REDIS_URL
import redis.asyncio as redis

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Redis 기반 세션 관리
# [개선] 파라미터 이름을 'call_sid' -> 'session_key'로 변경하여 가독성을 높였습니다.
async def save_session(session_key: str, state: dict):
    await redis_client.set(f"session:{session_key}", json.dumps(state))

async def get_session(session_key: str):
    data = await redis_client.get(f"session:{session_key}")
    if data:
        return json.loads(data)
    return {
        "current_idx": 0,
        "risk_list": [],
        "desire_list": [],
        "script": [],
        "answers": [],
        "start_time": time.time(),
        "before_risk": [],
        "before_desire": []
    }

async def clear_session(session_key: str):
    await redis_client.delete(f"session:{session_key}")
import json
import time
from app.config import REDIS_URL
import redis.asyncio as redis

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Redis 기반 세션 관리
async def save_session(call_sid: str, state: dict):
    await redis_client.set(f"session:{call_sid}", json.dumps(state))

async def get_session(call_sid: str):
    data = await redis_client.get(f"session:{call_sid}")
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

async def clear_session(call_sid: str):
    await redis_client.delete(f"session:{call_sid}")

import json
from app.config import REDIS_URL
import redis.asyncio as redis

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

async def save_question_list(question_list):
    await redis_client.set("cached_question_list", json.dumps(question_list))

async def find_answer(user_input: str):
    cached = await redis_client.get("cached_question_list")
    if not cached:
        return None

    questions = json.loads(cached)
    for q in questions:
        if q["text"] in user_input:
            return q["expected_answer"][0]["text"]
    return None
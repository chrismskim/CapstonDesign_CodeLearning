import asyncio
import httpx

BASE_URL = "http://localhost:8000"

# 테스트용 사용자 데이터
user_data = {
    "name": "홍길동",
    "phone": "01012345678",
    "gender": "M",
    "birth_date": "1990-01-01",
    "address": {
        "state": "서울",
        "city": "강남구",
        "address1": "테헤란로",
        "address2": "123"
    },
    "question_list": [],
    "vulnerabilities": {
        "risk_list": [
            {"risk_index_list": [1], "content": "주거문제"}
        ],
        "desire_list": []
    }
}

async def test_redis_session():
    async with httpx.AsyncClient() as client:
        # 1. 사용자 정보 저장
        res = await client.post(f"{BASE_URL}/api/receive", json=user_data)
        print("/api/receive 응답:", res.status_code, res.json())
        # 2. Redis 세션 확인
        res2 = await client.get(f"{BASE_URL}/api/session/{user_data['phone']}")
        print("/api/session/{phone} 응답:", res2.status_code, res2.json())
        assert res2.status_code == 200
        assert res2.json().get("risk_list") is not None

if __name__ == "__main__":
    asyncio.run(test_redis_session())

from fastapi import FastAPI
from app.routes import router
import uvicorn
import os

app = FastAPI()

# 라우터 등록 (POST /receive 등 api 정의가 routes.py에 있다고 가정)
app.include_router(router)

#port 번호는 나중에 결정
if __name__ == "__main__":
    port = int(os.getenv("PORT", 6379))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)



#1. docker 실행
#2. uvicorn app.main:app --reload
#3. ngrok 실행 후 url get
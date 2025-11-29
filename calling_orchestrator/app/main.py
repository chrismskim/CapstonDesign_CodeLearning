from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # [추가] CORS 미들웨어
from app.routes.callbot import router as callbot_router
from app.result_forwarding import router as result_forwarding_router
import uvicorn
import os

app = FastAPI()

# [추가] CORS 설정: 모든 도메인에서의 요청 허용 (개발 환경용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(callbot_router)
app.include_router(result_forwarding_router)

# static 폴더를 / 경로에 마운트하여 index.html을 기본 페이지로 제공
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")

if __name__ == "__main__":
    # 포트 번호를 8000으로 설정
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
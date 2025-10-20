from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # 추가
from app.routes import callbot as callbot_router
from app.result_forwarding import router as result_forwarding_router
import uvicorn
import os

app = FastAPI()

# static 폴더를 / 경로에 마운트하여 index.html을 기본 페이지로 제공 (추가)
app.mount("/", StaticFiles(directory="app/static", html = True), name="static")

app.include_router(callbot_router)
app.include_router(result_forwarding_router)

if __name__ == "__main__":
    # 포트 번호를 8000으로 변경 (Redis 포트와 겹칠 수 있음)
    port = int(os.getenv("PORT", 8000)) 
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
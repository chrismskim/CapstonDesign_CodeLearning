from fastapi import FastAPI
from app.routes.callbot import router as callbot_router
from app.result_forwarding import router as result_forwarding_router
import uvicorn
import os
app = FastAPI()

app.include_router(callbot_router)
app.include_router(result_forwarding_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 6379))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)



#1. docker 실행
#2. uvicorn app.main:app --reload
#3. ngrok 실행 후 url get
# calling_orchestrator/main.py

import asyncio
import subprocess
from calling_orchestrator.Service.twilio_stream_handler import main as websocket_main

def run_fastapi_webhook():
    subprocess.Popen([
        "uvicorn",
        "calling_orchestrator.Service.twilio_handler:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ])

def run():
    print("[Main] 시스템 초기화 중...")
    run_fastapi_webhook()
    print("[Main] FastAPI webhook 서버 실행됨")
    print("[Main] Twilio WebSocket 서버 실행됨")
    asyncio.run(websocket_main())

if __name__ == "__main__":
    run()

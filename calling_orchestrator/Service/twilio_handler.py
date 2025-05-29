# ✅ calling_orchestrator/Service/twilio_handler.py
from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from xml.etree.ElementTree import Element, tostring
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

WS_URL = os.getenv("TWILIO_WS_URL", "wss://localhost:8765")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/twilio-webhook")
async def twilio_webhook(request: Request):
    print("[Twilio Webhook] 전화 연결 요청 수신")

    # WebSocket으로 전환하는 TwiML XML 생성
    response = Element("Response")
    start = Element("Start")
    stream = Element("Stream")
    stream.set("url", WS_URL)
    start.append(stream)
    response.append(start)

    return Response(content=tostring(response), media_type="application/xml")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
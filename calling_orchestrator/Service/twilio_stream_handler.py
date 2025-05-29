import asyncio
import websockets
import json
import base64

from calling_orchestrator.Service.stt_service import STTService
from calling_orchestrator.Service.tts_service import TTSService
from calling_orchestrator.Service.llm_orchestrator import answer_question

stt = STTService()
tts = TTSService()

# 오디오 버퍼 처리기
audio_buffer = {}


async def handle_connection(websocket):
    print("[WebSocket] 연결됨")

    try:
        async for message in websocket:
            data = json.loads(message)
            event = data.get("event")

            if event == "start":
                call_sid = data["start"]["callSid"]
                print(f"[WebSocket] 통화 시작: {call_sid}")
                audio_buffer[call_sid] = bytearray()

            elif event == "media":
                call_sid = data["media"]["track"]
                payload = base64.b64decode(data["media"]["payload"])
                audio_buffer[call_sid] += payload

            elif event == "stop":
                call_sid = data["stop"]["callSid"]
                print(f"[WebSocket] 통화 종료: {call_sid}")

                audio = bytes(audio_buffer.get(call_sid, b""))
                if not audio:
                    print("[오류] 오디오 없음")
                    return

                transcript = stt.transcribe(audio)
                print(f"[STT] 인식 결과: {transcript}")

                answer = answer_question(transcript)
                print(f"[LLM 응답] {answer}")

                audio_reply = tts.speak(answer)

                await websocket.send(json.dumps({
                    "event": "media",
                    "media": {
                        "payload": base64.b64encode(audio_reply).decode('utf-8')
                    }
                }))

    except websockets.exceptions.ConnectionClosed:
        print("[WebSocket] 연결 종료")


async def main():
    print("[WebSocket 서버] 시작 중 (0.0.0.0:8765)...")
    async with websockets.serve(handle_connection, "0.0.0.0", 8765):
        await asyncio.Future()  # run forever


if __name__ == '__main__':
    asyncio.run(main())

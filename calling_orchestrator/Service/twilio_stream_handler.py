# services/twilio_stream_handler.py
# Twilio WebSocket 연결 수신 핸들러

import asyncio
import websockets
import base64
import json
from .stt_service import STTService
from .tts_service import TTSService

stt_service = STTService()
tts_service = TTSService()


async def handle_connection(websocket, path):
    print("[Twilio] WebSocket 연결됨")

    async for message in websocket:
        data = json.loads(message)

        # Twilio에서 전송한 사용자 오디오 수신
        if data.get("event") == "media":
            audio_base64 = data["media"]["payload"]
            audio_bytes = base64.b64decode(audio_base64)

            # STT 처리
            transcript = stt_service.transcribe(audio_bytes)
            print(f"[STT] 결과: {transcript}")

            # TTS 변환
            audio_response = tts_service.speak(transcript, call_sid="dummy")  # 실제 call_sid 필요 없음

            # Twilio에 음성 전송 (base64 인코딩)
            response_payload = base64.b64encode(audio_response).decode("utf-8")
            response_msg = {
                "event": "media",
                "media": {
                    "payload": response_payload
                }
            }
            await websocket.send(json.dumps(response_msg))

        elif data.get("event") == "start":
            print(f"[Twilio] 통화 시작 이벤트 수신: {data}")
        elif data.get("event") == "stop":
            print("[Twilio] 통화 종료")
            break


# WebSocket 서버 실행
if __name__ == "__main__":
    start_server = websockets.serve(handle_connection, "0.0.0.0", 8765)
    print("[Twilio] WebSocket 서버 시작됨 (port 8765)")
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

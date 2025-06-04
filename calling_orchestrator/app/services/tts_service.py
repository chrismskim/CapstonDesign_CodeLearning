import grpc
from app.config import GRPC_TTS_URL
from app.protos import tts_pb2, tts_pb2_grpc

async def text_to_twiml(text: str) -> str:
    async with grpc.aio.insecure_channel(GRPC_TTS_URL) as channel:
        stub = tts_pb2_grpc.TTSServiceStub(channel)
        request = tts_pb2.TTSRequest(text=text)
        response = await stub.Synthesize(request)

    # <Play>로 답변 음성 재생 후, <Record>로 다음 사용자 입력을 받음 (반복 구조)
    return f"""
    <Response>
        <Play>{response.audio_url}</Play>
        <Record maxLength=\"10\" action=\"/twilio/voice\" method=\"POST\" />
    </Response>
    """.strip()
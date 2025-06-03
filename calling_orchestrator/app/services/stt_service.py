import grpc
import aiohttp
from app.config import GRPC_STT_URL
from app.protos import stt_pb2, stt_pb2_grpc

async def speech_to_text(audio_url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(audio_url) as resp:
            audio_bytes = await resp.read()

    async with grpc.aio.insecure_channel(GRPC_STT_URL) as channel:
        stub = stt_pb2_grpc.STTServiceStub(channel)
        request = stt_pb2.STTRequest(audio_data=audio_bytes)
        response = await stub.Transcribe(request)
        return response.text
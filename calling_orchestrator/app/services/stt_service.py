import aiohttp
import tempfile
import whisper

model = whisper.load_model("base")  # 필요시 small/medium/large로 변경

async def speech_to_text(audio_url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(audio_url) as resp:
            audio_bytes = await resp.read()

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    result = model.transcribe(tmp_path, language="ko")  # 한국어 음성일 경우
    return result["text"]
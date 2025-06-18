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

async def listen(phone_number: str) -> str:
    """
    Twilio 콜 세션에서 음성 입력을 받아 텍스트로 변환 (예시)
    실제 구현은 webhook에서 audio_url을 받아 speech_to_text 호출
    """
    # 실제로는 Twilio webhook에서 audio_url을 받아 처리해야 함
    return ""
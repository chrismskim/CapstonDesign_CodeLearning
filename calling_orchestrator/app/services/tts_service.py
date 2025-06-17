import tempfile
import os
import whisper
import gtts

model = whisper.load_model("base")  # 필요시 small/medium/large로 변경

def text_to_twiml(text: str) -> str:
    # gTTS로 텍스트를 mp3로 변환
    tts = gtts.gTTS(text, lang='ko')
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tts.save(tmp.name)
        audio_url = f"/static/{os.path.basename(tmp.name)}"
    # 실제 서비스에서는 이 파일을 static 경로에 복사하거나, S3 등 외부 URL로 제공해야 함
    return f"""
    <Response>
        <Play>{audio_url}</Play>
        <Record maxLength=\"10\" action=\"/twilio/voice\" method=\"POST\" />
    </Response>
    """.strip()
import tempfile
import os
import whisper
import gtts

model = whisper.load_model("base")  # 필요시 small/medium/large로 변경

def text_to_twiml(text: str) -> str:
    # Twilio <Say>로 바로 음성 출력 (mp3 파일 생성/호스팅 불필요)
    return f'''
    <Response>
        <Say language="ko-KR">{text}</Say>
        <Record maxLength="10" action="/twilio/voice" method="POST" />
    </Response>
    '''.strip()
from twilio.rest import Client
from app.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def make_call(phone_number: str, twiml_url: str):
    call = client.calls.create(
        to=phone_number,
        from_=TWILIO_FROM_PHONE,
        url=twiml_url
    )
    return call.sid

def speak(phone_number: str, text: str):
    """
    Twilio TTS로 지정된 번호에 음성 송출 (예: TwiML <Say> 활용)
    실제 구현은 Twilio Studio/Voice API와 연동 필요
    """
    # Twilio의 <Say>를 활용한 예시 (실제 서비스에서는 webhook 등과 연동 필요)
    # 이 함수는 콜 세션 내에서만 동작해야 하며, 실제로는 Twilio webhook에서 처리
    pass

def listen(phone_number: str) -> str:
    """
    지정된 번호의 콜 세션에서 음성 입력(STT) 결과를 반환
    실제 구현은 Twilio webhook과 연동 필요
    """
    pass
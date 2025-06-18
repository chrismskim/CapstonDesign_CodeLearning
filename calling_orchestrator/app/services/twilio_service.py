from twilio.rest import Client
from app.config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def format_phone_number(phone: str) -> str:
    # 공백, 하이픈 등 제거
    digits = ''.join(filter(str.isdigit, phone))
    if digits.startswith('0'):
        # 한국 번호: 01012345678 → +821012345678
        digits = digits[1:]
        return f'+82{digits}'
    elif digits.startswith('1') and len(digits) == 11:
        # 미국 번호: 1XXXXXXXXXX → +1XXXXXXXXXX
        return f'+{digits}'
    else:
        # 국제번호 등 기타
        if digits.startswith('00'):
            return f'+{digits[2:]}'
        return f'+{digits}'

def make_call(phone_number: str, twiml_url: str):
    call = client.calls.create(
        to=phone_number,
        from_=TWILIO_FROM_PHONE,
        url=twiml_url
    )
    return call.sid

def speak(text: str) -> str:
    """
    Twilio <Say>로 안내할 텍스트를 TwiML로 반환
    실제로는 FastAPI 엔드포인트에서 이 함수를 호출해 TwiML을 반환하면 됨
    """
    return f'<Response><Say language="ko-KR">{text}</Say></Response>'
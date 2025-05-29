import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# 환경 변수에서 Twilio 인증 정보 불러오기
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")  # 구매한 발신 번호

# 수신자 번호와 Webhook URL은 동적으로 전달 가능하게 구성
def make_call(to_number: str, webhook_url: str):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    call = client.calls.create(
        to=to_number,
        from_=TWILIO_PHONE_NUMBER,
        url=webhook_url  # TwiML 또는 WebSocket 진입점
    )

    print(f"[Twilio] 발신 성공. SID: {call.sid}")
    return call.sid
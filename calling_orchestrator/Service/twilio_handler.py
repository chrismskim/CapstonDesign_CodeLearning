#통화 연결
from twilio.rest import Client

def Twilio(Number):
    # Twilio 계정 SID와 인증 토큰 설정
    account_sid = '계정 SID 값'  # 실제 값으로 변경
    auth_token = 'token'    # 실제 값으로 변경
    client = Client(account_sid, auth_token)
    # 전화 걸기
    call = client.calls.create(
    to='+82~~~',  # 수신자 전화번호 (국가번호 포함)
    from_='+1~',      # 구매한 Twilio 전화번호
    url='http://demo.twilio.com/docs/voice.xml')  # 통화 시 실행될 TwiML URL
    print(call.sid)  # 통화 ID 출력

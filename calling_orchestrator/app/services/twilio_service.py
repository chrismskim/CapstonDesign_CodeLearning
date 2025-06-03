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
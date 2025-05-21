from fastapi import APIRouter, Depends, Request
from app.models.schemas import InitiateCallRequest, InitiateCallResponse, RecognitionResult
from app.services.calling_service import CallingService
from app.services.recognition_service import RecognitionService
from app.services.ai_service import AIService
from app.services.synthesis_service import SynthesisService
from app.services.log_service import LogService
from app.services.user_service import UserService

router = APIRouter()

# Initialize services (in a real app, use dependency injection)
calling_service = CallingService()
recognition_service = RecognitionService()
ai_service = AIService()
synthesis_service = SynthesisService()
log_service = LogService()
user_service = UserService()

@router.post("/initiate_call", response_model=InitiateCallResponse)
def initiate_call(request: InitiateCallRequest):
    # 1. Log the initiation request
    log_entry = {"event_type": "call_initiation_requested", "details": request.dict()}
    log_service.log_event(log_entry)

    # 2. Get user information (example interaction with UserService)
    user_info = user_service.get_user(request.user_id)
    if not user_info:
        # Handle user not found error
        print(f"[API] User not found: {request.user_id}")
        # In a real app, return HTTPException
        return {"call_id": "", "status": "failed - user not found"}

    # Use the phone number from the request, or potentially from user_info if stored
    target_phone_number = request.phone_number # Or user_info.get("phone_number")

    # 3. Initiate the call via CallingService (which interacts with Twilio)
    try:
        call_id = calling_service.initiate_call(target_phone_number, request.user_id)
        status = "initiated"
        print(f"[API] Call initiated with ID: {call_id}")

        # 4. Log successful initiation
        log_entry = {"call_id": call_id, "user_id": request.user_id, "event_type": "call_initiated_successfully", "details": {"phone_number": target_phone_number}}
        log_service.log_event(log_entry)

        return {"call_id": call_id, "status": status}

    except Exception as e:
        # Log initiation failure
        print(f"[API] Failed to initiate call: {e}")
        log_entry = {"user_id": request.user_id, "event_type": "call_initiation_failed", "details": {"phone_number": target_phone_number, "error": str(e)}}
        log_service.log_event(log_entry)
        # In a real app, return HTTPException
        return {"call_id": "", "status": "failed"}

# Placeholder endpoint for Twilio webhooks
# Twilio will send events here (e.g., when a call connects, when speech is detected)
@router.post("/twilio_webhook")
async def handle_twilio_webhook(request: Request):
    # Twilio sends data in the request body (usually form data)
    form_data = await request.form()
    webhook_data = dict(form_data)

    print("[API] Received Twilio webhook data:", webhook_data)

    # 1. Log the incoming webhook event
    log_entry = {"event_type": "twilio_webhook_received", "details": webhook_data}
    log_service.log_event(log_entry)

    # 2. Pass webhook data to the CallingService for processing
    # The CallingService will contain the logic to interpret Twilio events
    # and orchestrate interactions with other services (Recognition, AI, Synthesis)
    calling_service.handle_twilio_webhook(webhook_data)

    # Twilio expects a TwiML response to control the call flow
    # For now, return an empty response or basic TwiML
    # In a real application, generate TwiML dynamically based on call state and service responses
    return {"message": "Webhook received"} # Or return TwiML response

# Add other calling related endpoints here (e.g., for getting call status) 
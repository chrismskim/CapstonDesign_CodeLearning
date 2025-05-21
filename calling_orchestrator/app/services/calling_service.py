from twilio.rest import Client
# Import TwiML to generate responses for Twilio
from twilio.twiml.voice_response import VoiceResponse, Gather, Say, Play, Hangup
from app.core.config import settings
from app.models.schemas import RecognitionResult, LogEntry
from app.services.recognition_service import RecognitionService
from app.services.ai_service import AIService
from app.services.synthesis_service import SynthesisService
from app.services.log_service import LogService
from app.services.user_service import UserService
# You might need a way to manage call state, e.g., using Redis
# import redis

class CallingService:
    def __init__(self):
        # Initialize Twilio client (replace with actual credentials/config lookup)
        # self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # Initialize other services (in a real app, use dependency injection)
        self.recognition_service = RecognitionService()
        self.ai_service = AIService()
        self.synthesis_service = SynthesisService()
        self.log_service = LogService()
        self.user_service = UserService()

        # Initialize Redis client for state management (optional)
        # self.redis_client = redis.Redis.from_url(settings.REDIS_URL)

        print("[CallingService] Initializing Calling Service")
        pass

    def initiate_call(self, phone_number: str, user_id: str) -> str:
        # Logic to initiate a call using Twilio
        print(f"[CallingService] Initiating call to {phone_number} for user {user_id}")
        # Example using Twilio client:
        # try:
        #     call = self.client.calls.create(
        #         url='http://your-webhook-url/api/v1/twilio_webhook', # Webhook for call events
        #         to=phone_number,
        #         from_=settings.TWILIO_PHONE_NUMBER
        #     )
        #     call_id = call.sid

        #     # In a real application, save initial call state to Redis or DB
        #     self.redis_client.set(f"call_state:{call_id}", "initiated")

        #     return call_id
        # except Exception as e:
        #     print(f"[CallingService] Error initiating call: {e}")
        #     # Log the error
        #     log_entry = LogEntry(user_id=user_id, event_type="call_initiation_twilio_failed", details={"phone_number": phone_number, "error": str(e)})
        #     self.log_service.log_event(log_entry)
        #     raise # Re-raise the exception to be caught by the API endpoint

        # For now, return dummy call_id and log it
        dummy_call_id = "dummy_call_id_" + str(hash(phone_number + user_id))
        print(f"[CallingService] Dummy call initiated with ID: {dummy_call_id}")
        log_entry = LogEntry(call_id=dummy_call_id, user_id=user_id, event_type="dummy_call_initiated", details={})
        self.log_service.log_event(log_entry)
        return dummy_call_id

    def handle_twilio_webhook(self, webhook_data: dict) -> VoiceResponse:
        # Logic to handle incoming Twilio webhook events
        print("[CallingService] Handling Twilio webhook:", webhook_data)

        call_sid = webhook_data.get('CallSid')
        event_status = webhook_data.get('CallStatus')
        speech_result = webhook_data.get('SpeechResult') # From <Gather> noun
        # Add other relevant webhook parameters as needed (e.g., 'Digits', 'DialCallStatus')
        # For a <Gather> with speech, Twilio sends a new request to the 'action' URL with SpeechResult

        # Log the incoming webhook event
        log_entry = LogEntry(
            call_id=call_sid,
            event_type=f"twilio_webhook_{event_status or 'voice'}", # Use status or 'voice' if speech result is present
            details=webhook_data
        )
        self.log_service.log_event(log_entry)

        response = VoiceResponse()

        if event_status == 'answered':
            print(f"[CallingService] Call {call_sid} answered.")
            # When call is answered, play a greeting and prompt for user input (speech)
            response.say("Hello! How can I help you today?")
            # Use <Gather> to collect speech input. Set action to this webhook URL.
            response.gather(
                input='speech',
                action='/api/v1/twilio_webhook', # Twilio sends the speech result back here
                method='POST',
                speechTimeout='auto' # or a specific number of seconds
            )

        elif event_status == 'completed':
            print(f"[CallingService] Call {call_sid} completed.")
            # Clean up any state related to this call
            # try:
            #     self.redis_client.delete(f"call_state:{call_sid}")
            #     print(f"[CallingService] Cleaned up state for call {call_sid}")
            # except Exception as e:
            #     print(f"[CallingService] Error cleaning up state for call {call_sid}: {e}")
            pass # No TwiML response needed for a completed call

        elif event_status == 'failed':
             print(f"[CallingService] Call {call_sid} failed.")
             # Handle failed call (logging, cleanup)
             # try:
             #     self.redis_client.delete(f"call_state:{call_sid}")
             #     print(f"[CallingService] Cleaned up state for call {call_sid} after failure.")
             # except Exception as e:
             #     print(f"[CallingService] Error cleaning up state for call {call_sid} after failure: {e}")
             pass # No TwiML response needed for a failed call

        # Handle incoming speech/voice data from <Gather> action
        if speech_result:
            print(f"[CallingService] Received speech result for call {call_sid}: '{speech_result}'")

            # 1. Process recognized speech using RecognitionService (if not using Twilio's STT, this would be called with audio data)
            # For now, assuming Twilio's SpeechResult is the recognized text:
            recognized_text = speech_result

            # In a real app, retrieve call state (e.g., conversation history) from Redis/DB using call_sid
            # current_state = self.redis_client.get(f"call_state:{call_sid}") # Example

            # 2. Send recognized text to AI Service for processing
            # Pass call_id to AI Service for potential context/state management within AI
            try:
                ai_response_text = self.ai_service.process(recognized_text, call_id)
                print(f"[CallingService] AI responded for call {call_sid}: '{ai_response_text}'")

                # 3. Synthesize AI response text using SynthesisService
                # Pass call_id to Synthesis Service if needed
                synthesized_audio_data = self.synthesis_service.synthesize_speech(ai_response_text, call_id)
                print(f"[CallingService] Synthesized audio for call {call_sid}, size: {len(synthesized_audio_data)}")

                # 4. Play synthesized audio back to the user via Twilio
                # This requires hosting the audio data and providing Twilio with a URL
                # In a real app, you would save synthesized_audio_data to a temporary URL (e.g., AWS S3, your web server)
                audio_url = "http://your-audio-hosting-url/dummy_audio.wav" # Replace with actual hosted audio URL
                print(f"[CallingService] Playing audio from URL: {audio_url}")
                response.play(audio_url)

                # After playing the response, you typically want to <Gather> more input to continue the conversation
                response.gather(
                    input='speech',
                    action='/api/v1/twilio_webhook', # Loop back to this webhook
                    method='POST',
                    speechTimeout='auto'
                )

            except Exception as e:
                print(f"[CallingService] Error during voice processing for call {call_sid}: {e}")
                # Log the error
                log_entry = LogEntry(
                    call_id=call_sid,
                    event_type="voice_processing_error",
                    details={"error": str(e), "input_text": recognized_text}
                )
                self.log_service.log_event(log_entry)
                # Play an error message to the user and perhaps hang up
                response.say("Sorry, I encountered an error. Please try again.")
                response.hangup()

        # If no specific handling for an event, Twilio's default behavior occurs (often hanging up)
        # Ensure you return a VoiceResponse object for events where you want to control the call
        print(f"[CallingService] Returning TwiML response: {str(response)}")
        return response

    # Add other calling related methods as needed (e.g., hangup_call) 
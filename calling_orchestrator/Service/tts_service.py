# calling_orchestrator/Service/tts_service.py
import grpc
from grpc_proto import tts_pb2, tts_pb2_grpc

class TTSService:
    def __init__(self):
        self.channel = grpc.insecure_channel('localhost:50052')
        self.stub = tts_pb2_grpc.TTSStub(self.channel)

    def speak(self, text, call_sid):
        request = tts_pb2.TextInput(text=text)
        response = self.stub.Synthesize(request)
        return response.audio

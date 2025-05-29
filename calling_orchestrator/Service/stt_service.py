import grpc
from grpc_proto import stt_pb2, stt_pb2_grpc

class STTService:
    def __init__(self):
        self.channel = grpc.insecure_channel('localhost:50051')
        self.stub = stt_pb2_grpc.STTStub(self.channel)

    def transcribe(self, audio_bytes):
        request = stt_pb2.AudioInput(audio=audio_bytes)
        response = self.stub.Transcribe(request)
        return response.transcript

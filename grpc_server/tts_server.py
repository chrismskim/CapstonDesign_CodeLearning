from concurrent.futures import ThreadPoolExecutor
import grpc
from grpc_proto import tts_pb2, tts_pb2_grpc
from gtts import gTTS
import io

class TTSServicer(tts_pb2_grpc.TTSServicer):
    def Synthesize(self, request, context):
        print("[TTS 서버] 텍스트 수신:", request.text)
        tts = gTTS(text=request.text, lang='ko')
        buffer = io.BytesIO()
        tts.write_to_fp(buffer)
        audio_data = buffer.getvalue()
        return tts_pb2.AudioOutput(audio=audio_data)

def serve():
    server = grpc.server(ThreadPoolExecutor(max_workers=10))
    tts_pb2_grpc.add_TTSServicer_to_server(TTSServicer(), server)
    server.add_insecure_port("[::]:50052")
    print("[TTS gRPC 서버] 포트 50052 실행 중")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()

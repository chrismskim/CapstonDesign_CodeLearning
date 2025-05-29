# grpc_server/stt_server.py

from concurrent import futures
import grpc
from grpc_proto import stt_pb2, stt_pb2_grpc

import tempfile
import whisper
import os

model = whisper.load_model("base")  # 또는 "small", "medium", "large"

class STTServicer(stt_pb2_grpc.STTServicer):
    def Transcribe(self, request, context):
        print("[STT 서버] 오디오 수신: {} bytes".format(len(request.audio)))

        # 임시 wav 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(request.audio)
            tmp_path = tmp.name

        # Whisper로 인식
        try:
            result = model.transcribe(tmp_path, language='ko')
            transcript = result['text']
        except Exception as e:
            transcript = f"[오류] Whisper 인식 실패: {str(e)}"
        finally:
            os.remove(tmp_path)

        return stt_pb2.TranscriptOutput(transcript=transcript)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    stt_pb2_grpc.add_STTServicer_to_server(STTServicer(), server)
    server.add_insecure_port("[::]:50051")
    print("[STT gRPC 서버] 포트 50051 실행 중")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()

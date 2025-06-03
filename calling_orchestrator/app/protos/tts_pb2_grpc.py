class TTSServiceStub:
    def __init__(self, channel):
        pass
    async def Synthesize(self, request):
        return TTSResponse("GRPC TTS 음성 서버 URL 추가 하면 됨")

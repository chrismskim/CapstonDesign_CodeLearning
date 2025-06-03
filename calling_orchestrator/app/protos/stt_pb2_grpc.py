class STTServiceStub:
    def __init__(self, channel):
        pass
    async def Transcribe(self, request):
        return STTResponse("sample transcription")
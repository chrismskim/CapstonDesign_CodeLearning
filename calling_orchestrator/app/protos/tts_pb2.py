class TTSRequest:
    def __init__(self, text):
        self.text = text

class TTSResponse:
    def __init__(self, audio_url):
        self.audio_url = audio_url
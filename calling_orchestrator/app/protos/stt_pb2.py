class STTRequest:
    def __init__(self, audio_data):
        self.audio_data = audio_data

class STTResponse:
    def __init__(self, text):
        self.text = text
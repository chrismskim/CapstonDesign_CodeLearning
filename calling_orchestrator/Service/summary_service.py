# calling_orchestrator/Service/summary_service.py

from transformers import pipeline

# HuggingFace summarization 모델 사용
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def summarize_conversation(conversation: str) -> str:
    try:
        summary = summarizer(conversation, max_length=60, min_length=20, do_sample=False)
        return summary[0]["summary_text"]
    except Exception as e:
        return f"[요약 오류] {str(e)}"

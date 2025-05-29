# ✅ calling_orchestrator/Service/llm_orchestrator.py

from transformers import pipeline

# HuggingFace의 distilgpt2 모델을 사용하는 로컬 텍스트 생성기
text_generator = pipeline("text-generation", model="distilgpt2")

def answer_question(text: str) -> str:
    try:
        result = text_generator(text, max_length=50, num_return_sequences=1)
        return result[0]["generated_text"].strip()
    except Exception as e:
        return f"[LLM 오류] {str(e)}"

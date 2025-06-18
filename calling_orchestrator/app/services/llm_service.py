from langchain_openai import ChatOpenAI
from app.config import LANGCHAIN_API_KEY
import os

os.environ["OPENAI_API_KEY"] = LANGCHAIN_API_KEY

#(gpt-3.5-turbo)로 지정
chat = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)

def generate_response(user_input: str) -> str:
    return chat.predict(user_input)

def is_resolved(item: str, answer: str) -> bool:
    """
    LLM을 이용해 답변이 해당 문제(예: 주거문제)가 해결되었는지 판별
    """
    prompt = f'"{item}"에 대해 "{answer}"라는 답변이 문제 해결을 의미합니까? "예" 또는 "아니오"로만 답하세요.'
    result = chat.predict(prompt)
    return "예" in result

def update_vulnerable_list(vulnerable_list: list, extra: str) -> list:
    """
    LLM을 이용해 추가 불편사항을 vulnerable_list에 반영
    """
    prompt = f'기존 취약 리스트: {vulnerable_list}\n추가 불편사항: {extra}\n이 정보를 반영해 새로운 취약 리스트를 파이썬 리스트 형태로 출력하세요.'
    result = chat.predict(prompt)
    try:
        # LLM이 파이썬 리스트 형태로 반환한다고 가정
        new_list = eval(result)
        if isinstance(new_list, list):
            return new_list
    except Exception:
        pass
    return vulnerable_list
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

chat = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"), # .env에 모델 이름이 없다면 gpt-3.5-turbo 사용
    temperature=0.7,
)

def generate_response(prompt: str) -> str:
    """
    주어진 프롬프트를 기반으로 LLM 응답을 생성합니다.
    """
    try:
        response = chat.invoke(prompt)
        result = response.content
        # LLM 응답에서 불필요한 따옴표 제거 (예: "허리 통증" -> 허리 통증)
        return result.strip().strip("'\"")
    except Exception as e:
        print(f"LLM generate_response 오류: {e}")
        return "" # 오류 시 빈 문자열 반환

def update_vulnerable_list(risk_list, user_text):

    # 프롬프트 정의 (예시입니다. 실제 코드에 맞게 수정하세요)
    prompt_template = """
    기존 위험 목록: {risk_list}
    사용자 발화: {user_text}
    
    사용자 발화를 바탕으로 기존 위험 목록을 업데이트하세요.
    (여기에 실제 프롬프트 내용이 들어갑니다...)
    """
    
    prompt = PromptTemplate.from_template(prompt_template).format(
        risk_list=risk_list, 
        user_text=user_text
    )


    response = chat.invoke(prompt)
    result = response.content

    try:
        
        updated_list = result.split("\n") # (이 부분은 실제 로직에 맞게 수정 필요)
        return result # (기존 코드의 반환 타입에 맞게 수정하세요)
    
    except Exception as e:
        print(f"LLM 응답 파싱 중 오류 발생: {e}")
        return risk_list # 오류 발생 시 기존 리스트 반환
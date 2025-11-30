import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# ChatOpenAI 객체 초기화
chat = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),  # .env에 모델 이름이 없다면 gpt-3.5-turbo 사용
    temperature=0.7,
    # OPENAI_API_KEY는 환경 변수에서 자동으로 읽어옵니다.
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
        return ""  # 오류 시 빈 문자열 반환

def update_vulnerable_list(original_list, user_text):
    """
    사용자 발화를 기반으로 기존 목록(risk_list 또는 desire_list)을 업데이트합니다.
    LLM을 호출하여 해결된 항목을 목록에서 제거합니다.
    """

    # 프롬프트 정의 (JSON 반환 형식 명시)
    # [수정] 예시 JSON의 중괄호 { }를 {{ }}로 두 번 감싸서 LangChain 변수로 인식되지 않도록 수정했습니다.
    prompt_template = """
    너는 상담 데이터를 처리하는 AI다.
    기존 목록: {original_list}
    사용자 발화: {user_text}

    사용자 발화를 분석해. 만약 발화 내용이 기존 목록의 항목 중 하나가 '해결되었다'는 의미(예: "해결됐어요", "괜찮아요", "없어졌어요")를 포함한다면, 그 항목을 목록에서 '제거'해.
    만약 '해결되지 않았다'거나 '새로운 문제'를 의미한다면, 기존 목록을 '그대로' 둬.
    
    반드시 결과물로 '업데이트된 목록'만 JSON 리스트 형식으로 반환해.
    
    예시 1:
    기존 목록: [{{'risk_index_list': [1], 'content': '주거 문제'}}]
    사용자 발화: "네, 아직 그대로입니다."
    결과: [{{'risk_index_list': [1], 'content': '주거 문제'}}]
    
    예시 2:
    기존 목록: [{{'risk_index_list': [2], 'content': '건강 악화 문제'}}]
    사용자 발화: "해결 되었습니다."
    결과: []
    
    예시 3:
    기존 목록: [{{'content': '주거 문제'}}, {{'content': '건강 문제'}}]
    사용자 발화: "주거 문제는 아직 그대로인데, 건강은 괜찮아졌어요."
    결과: [{{'content': '주거 문제'}}]
    
    예시 4:
    기존 목록: []
    사용자 발화: "허리가 아파요."
    결과: []

    이제 다음을 처리해줘:
    기존 목록: {original_list}
    사용자 발화: {user_text}
    결과:
    """
    
    prompt = PromptTemplate.from_template(prompt_template).format(
        original_list=original_list, 
        user_text=user_text
    )

    try:
        response = chat.invoke(prompt)
        result = response.content.strip()  # LLM 응답(JSON 문자열)

        # === JSON 파싱 로직 ===
        # LLM이 마크다운 코드 블록(```json ... ```)을 반환할 경우 대비
        if result.startswith("```json"):
            result = result[7:-3].strip()
        elif result.startswith("```"):
             result = result[3:-3].strip()
        
        # '[', '{'로 시작하지 않는 비정상 응답 처리
        if not result.startswith('[') and not result.startswith('{'):
             print(f"LLM 파싱 오류: JSON 형식이 아님. LLM 응답: {result}")
             return original_list

        updated_list = json.loads(result)
        
        # 파싱된 객체가 리스트가 맞는지 확인
        if not isinstance(updated_list, list):
            print(f"LLM 파싱 오류: 결과가 리스트가 아님. LLM 응답: {result}")
            return original_list  # 실패 시 원본 리스트 반환
            
        print(f"LLM 목록 업데이트 성공. {len(original_list)}개 -> {len(updated_list)}개")
        return updated_list  # 성공 시 파싱된 리스트 반환
    
    except json.JSONDecodeError:
        print(f"LLM 파싱 오류: JSON 디코딩 실패. LLM 응답: {result}")
        return original_list  # JSON 파싱 실패 시 원본 리스트 반환
    except Exception as e:
        print(f"LLM 응답 파싱 중 알 수 없는 오류 발생: {e}")
        return original_list  # 기타 오류 시 원본 리스트 반환
    
    
def analyze_user_situation(user_text: str) -> dict:
    """
    사용자의 발화를 분석하여 긴급성, 일상생활 저해, 보호자 여부를 점수화하여 반환합니다.
    """
    prompt_template = """
    너는 독거노인 상담 전문 AI야. 아래 대화 내용을 분석해서 3가지 항목(긴급성, 일상생활, 보호자)에 대해 가장 적절한 등급을 판정해줘.
    
    [판정 기준]
    1. 긴급성 (Urgency)
       - 0점: 없음 (특이사항 없음)
       - 1점: 추후 경과 살필 필요 있음 (만성 통증, 경미한 불편)
       - 3점: 즉시 출동 요망 (호흡곤란, 의식소실, 극심한 고통, 자살 암시)

    2. 일상생활 저해 (ADL Impact)
       - 0점: 활동 가능
       - 1점: 조금 불편 (자가 케어 가능)
       - 2점: 보통 불편 (일부 도움 필요)
       - 3점: 많이 불편 (대부분 도움 필요)
       - 4점: 거동 불가 (와상 상태, 이동 불가)

    3. 보호자 여부 (Guardian)
       - 0점: 보호자 동반 거주
       - 1점: 1시간 이내 거주 및 즉각적 도움 가능
       - 2점: 조금 멀지만 도움 받을 수 있음 (전화/간헐적 방문)
       - 3점: 아주 멀어서 즉각적 도움 불가
       - 4점: 없음 (고립, 연락두절)
       - 2점: (정보 없음/알 수 없음 - 기본값)

    [대화 내용]
    "{user_text}"

    반드시 아래 JSON 형식으로만 답해줘:
    {{
      "urgency_score": 점수(숫자),
      "adl_score": 점수(숫자),
      "guardian_score": 점수(숫자),
      "reason": "판단 근거 한 줄 요약"
    }}
    """
    
    try:
        # chat 객체는 기존에 정의된 것을 사용
        prompt = PromptTemplate.from_template(prompt_template).format(user_text=user_text)
        response = chat.invoke(prompt)
        result_text = response.content.strip()
        
        # JSON 파싱 전처리 (마크다운 코드블록 제거)
        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()
        elif result_text.startswith("```"):
            result_text = result_text[3:-3].strip()
            
        data = json.loads(result_text)

        # 안전장치: LLM이 숫자("3")를 문자열로 주더라도 강제로 숫자(3)로 변환
        return {
            "urgency_score": int(data.get("urgency_score", 0)),
            "adl_score": int(data.get("adl_score", 0)),
            "guardian_score": int(data.get("guardian_score", 0)),
            "reason": str(data.get("reason", ""))}
    except Exception as e:
        print(f"LLM 분석 실패: {e}")
        # 실패 시 안전한 기본값 반환
        return {
            "urgency_score": 1, 
            "adl_score": 1, 
            "guardian_score": 2, 
            "reason": "분석 실패"
        }
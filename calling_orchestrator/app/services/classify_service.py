from app.services import llm_service
import re

def classify_answer(answer: str) -> dict:
    """
    답변을 분석하여 3가지 지표의 개별 점수를 포함한 상세 내용과
    점수 조합에 따른 상담 유형(Type)을 반환합니다.
    """
    
    # 1. 예외 키워드 처리 (기존 로직 유지)
    exception_keywords = ["신상정보불일치", "상담거부", "욕설", "연결끊어짐", "전화미수신"]
    for idx, word in enumerate(exception_keywords, 1):
        if word in answer:
            return {"type": 0, "reason": word, "fail_code": idx}

    # 2. [NEW] LLM 상세 분석 실행
    analysis = llm_service.analyze_user_situation(answer)
    
    # 점수 추출 (없으면 기본값 0)
    u_score = analysis.get("urgency_score", 0)   # 0 ~ 3
    a_score = analysis.get("adl_score", 0)       # 0 ~ 4
    g_score = analysis.get("guardian_score", 0)  # 0 ~ 4
    
    # 3. [NEW] 상세 내용 포맷팅 (담당자가 볼 최종 텍스트)
    # 예: "허리 통증 호소 [긴급성(1), 일상생활(3), 보호자(0)]"
    detail_content = (f"{analysis.get('reason', '')} "
                      f"[긴급성({u_score}), "
                      f"일상생활({a_score}), "
                      f"보호자({g_score})]")

    # 4. [NEW] 판단 로직: 과락(Cut-off) 기반 분류
    
    # Case 1: [심각 - Type 3] (즉시 개입 필요)
    # 조건: 긴급성이 최고점(3)이거나, 거동불가(4)인데 보호자도 없음(4)
    if u_score >= 3 or (a_score >= 4 and g_score >= 4):
        return {
            "type": 3, 
            "reason": "응급 상황 또는 고위험 고립 가구", 
            "content": detail_content
        }

    # Case 2: [주의 - Type 1] (위기 리스트 등록)
    # 조건: 긴급성(1 이상) OR 생활불편(3 이상) OR 보호자 부재(3 이상)
    elif u_score >= 1 or a_score >= 3 or g_score >= 3:
        return {
            "type": 1, 
            "category_index": 1, # 1: 건강/안전 (예시)
            "content": detail_content
        }

    # Case 3: [양호 - Type 2] (단순 욕구/일반)
    else:
        return {
            "type": 2, 
            "category_index": 0, # 0: 기타/일반
            "content": detail_content
        }
from app.services import llm_service
import re

def classify_answer(answer: str) -> dict:
    """
    답변을 분석해 type 0(예외처리), 1(위기), 2(욕구), 3(심층상담) 분류
    욕구 관련 답변은 LLM을 이용해 type/카테고리 판별
    """
    exception_keywords = ["신상정보불일치", "상담거부", "의사소통불가", "부적절한답변", "연결끊어짐", "전화미수신"]
    risk_keywords = ["요금체납", "주거위기", "고용위기", "급여", "긴급상황", "건강위기", "에너지위기"]
    deep_keywords = ["심층상담", "중대함"]
    for idx, word in enumerate(exception_keywords, 1):
        if word in answer:
            return {"type": 0, "reason": word, "fail_code": idx}
    for word in deep_keywords:
        if word in answer:
            return {"type": 3, "reason": word}
    for word in risk_keywords:
        if word in answer:
            return {"type": 1, "category": word}
    # 욕구 관련 답변은 LLM으로 판별
    prompt = f"다음 답변이 욕구(Desire) 상황에 해당하면 type 2, 심층상담이면 type 3, 아니면 -1을 반환하고, 해당하는 욕구 카테고리(안전, 건강, 일상생활유지, 가족관계, 사회적 관계, 경제, 교육, 고용, 생활환경, 법률 및 권익보장, 기타) 또는 심층상담 사유를 함께 알려줘. 답변: {answer}"
    llm_result = llm_service.generate_response(prompt)
    m = re.search(r'type\s*:?\s*(\d+)', llm_result)
    if m:
        type_num = int(m.group(1))
        if type_num == 2:
            cat = re.search(r'category\s*:?\s*([\w가-힣]+)', llm_result)
            return {"type": 2, "category": cat.group(1) if cat else "기타"}
        elif type_num == 3:
            reason = re.search(r'reason\s*:?\s*([\w가-힣 ]+)', llm_result)
            return {"type": 3, "reason": reason.group(1) if reason else "심층상담"}
    return {"type": -1}

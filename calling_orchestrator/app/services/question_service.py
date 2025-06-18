# 질문 생성 및 종료 판정

def get_next_question(risk_list, idx):
    if idx < len(risk_list):
        return f"{idx+1}번째 질문입니다. {risk_list[idx]}는 아직도 문제가 있으신가요?"
    return None

def is_end(idx, risk_list):
    return idx >= len(risk_list)

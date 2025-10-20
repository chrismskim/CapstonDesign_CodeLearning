# 질문 생성 및 종료 판정

def get_next_question(risk_list, idx):
    if idx < len(risk_list):
        # [개선] 딕셔너리에서 'content' 값을 추출하여 자연스러운 질문을 생성합니다.
        question_content = risk_list[idx]['content']
        return f"{idx+1}번째 질문입니다. '{question_content}' 문제는 아직도 해결되지 않으셨나요?"
    return None

def is_end(idx, risk_list):
    return idx >= len(risk_list)
from app.services import llm_service

def save_answer(state, question, user_text):
    state["script"].append(f"Q: {question}, A: {user_text}")
    state["answers"].append(user_text)

# LLM을 이용해 risk_list/desire_list 업데이트

def update_vulnerabilities(risk_list, desire_list, user_text):
    updated_risk_list = llm_service.update_vulnerable_list(risk_list, user_text)
    updated_desire_list = llm_service.update_vulnerable_list(desire_list, user_text)
    return updated_risk_list, updated_desire_list

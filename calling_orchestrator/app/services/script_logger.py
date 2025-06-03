import datetime
conversation_log = []

LOG_FILE = "conversation_log.txt"

def log_interaction(user_input: str, answer: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {"timestamp": timestamp, "user": user_input, "system": answer}
    conversation_log.append(log_entry)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] USER: {user_input}\n[{timestamp}] SYSTEM: {answer}\n")

def get_conversation_log():
    return conversation_log
from langchain_openai import ChatOpenAI
from app.config import LANGCHAIN_API_KEY
import os

os.environ["OPENAI_API_KEY"] = LANGCHAIN_API_KEY

chat = ChatOpenAI(temperature=0.7)

def generate_response(user_input: str) -> str:
    return chat.predict(user_input)
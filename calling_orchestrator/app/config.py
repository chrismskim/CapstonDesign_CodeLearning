import os
from dotenv import load_dotenv

load_dotenv()

def get_env_or_raise(key: str, default=None, required=False):
    value = os.getenv(key, default)
    if required and (value is None or value == ""):
        raise RuntimeError(f"환경 변수 {key}가 설정되어 있지 않습니다. .env 파일을 확인하세요.")
    return value

TWILIO_ACCOUNT_SID = get_env_or_raise("TWILIO_ACCOUNT_SID", required=True)
TWILIO_AUTH_TOKEN = get_env_or_raise("TWILIO_AUTH_TOKEN", required=True)
TWILIO_FROM_PHONE = get_env_or_raise("TWILIO_FROM_PHONE", required=True)
TWILIO_WEBHOOK_URL = get_env_or_raise("TWILIO_WEBHOOK_URL", required=True)

REDIS_HOST = get_env_or_raise("REDIS_HOST", "localhost")
REDIS_PORT = int(get_env_or_raise("REDIS_PORT", 6379))
REDIS_DB = int(get_env_or_raise("REDIS_DB", 0))
REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

LANGCHAIN_API_KEY = get_env_or_raise("LANGCHAIN_API_KEY", required=True)

GRPC_STT_URL = get_env_or_raise("GRPC_STT_URL", "localhost:50051")
GRPC_TTS_URL = get_env_or_raise("GRPC_TTS_URL", "localhost:50052")
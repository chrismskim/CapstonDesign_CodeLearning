# calling_orchestrator

AI 음성 상담 자동화 시스템의 콜링 및 대화 관리 서버

---

## 📁 디렉토리 구조

```
calling_orchestrator/
├── readme.md
├── requierment.txt
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── main.py
│   ├── models.py
│   ├── routes.py
│   ├── protos/
│   │   ├── __init__.py
│   │   ├── stt_pb2.py
│   │   ├── stt_pb2_grpc.py
│   │   ├── tts_pb2.py
│   │   ├── tts_pb2_grpc.py
│   └── services/
│       ├── __init__.py
│       ├── llm_service.py
│       ├── redis_service.py
│       ├── script_logger.py
│       ├── stt_service.py
│       ├── tts_service.py
│       ├── twilio_service.py
```

---

## 📄 주요 파일별 설명 및 기능

### app/

- **main.py** : FastAPI 앱 실행 및 라우터 등록(서버 진입점)
- **config.py** : 환경 변수(.env) 로드 및 Twilio, Redis, LLM, gRPC 등 설정 관리
- **models.py** : 사용자 데이터, 질문, 취약 정보 등 Pydantic 데이터 모델 정의
- **routes.py** :
  - `/receive` : 사용자 데이터 수신, 질문 리스트 Redis 저장, Twilio 전화 발신
  - `/twilio/voice` : Twilio Webhook, 음성(STT) → 답변 생성(redis/LLM) → TTS → TwiML 반환(반복 구조)
  - `/send_llm_result` : LLM 상담 요약/분석 결과를 Spring Boot로 전송

### app/services/

- **llm_service.py** : OpenAI 기반 LLM 답변 생성 (질문/대화 요약)
- **redis_service.py** : 질문 리스트 Redis 저장, 유사 질문 답변 탐색
- **script_logger.py** : 대화 로그 기록 및 조회
- **stt_service.py** : gRPC로 음성(STT) 변환
- **tts_service.py** : gRPC로 텍스트(TTS) 변환, TwiML(XML) 생성(반복 구조)
- **twilio_service.py** : Twilio API로 전화 발신

### app/protos/

- **stt_pb2.py, stt_pb2_grpc.py** : gRPC STT Stub
- **tts_pb2.py, tts_pb2_grpc.py** : gRPC TTS Stub

---

## ⚙️ 전체 실행 및 구현 흐름

1. **서버 실행**

   - `python -m app.main` 또는 uvicorn으로 FastAPI 서버 실행
   - 환경 변수는 `.env` 파일에서 자동 로드

2. **상담 시작**

   - `/receive`로 사용자 정보 및 질문 리스트 POST
   - 질문 리스트를 Redis에 저장, Twilio로 전화 발신(상담 대상자에게)

3. **음성 대화 반복**

   - 사용자가 전화를 받으면 Twilio가 `/twilio/voice`로 Webhook POST
   - FastAPI가 녹음 URL을 받아 STT 변환 → 텍스트로 변환
   - Redis에서 질문 매칭 답변 탐색, 없으면 LLM(OpenAI)로 답변 생성
   - 답변을 gRPC TTS로 음성 변환, TwiML(XML)로 `<Play>`+`<Record>` 반환
   - Twilio가 답변 음성 재생 후, `<Record>`로 다음 사용자 발화 녹음 → 다시 `/twilio/voice`로 POST (무한 반복)
   - 각 대화는 script_logger로 로그 기록

4. **상담 종료 및 요약**
   - 대화 종료 후, 전체 대화 로그를 LLM에 전달해 요약/분석
   - `/send_llm_result`로 Spring Boot 백엔드에 결과 전송

---

## 📝 설명

- Twilio와 FastAPI Webhook, gRPC STT/TTS, Redis, OpenAI LLM 연동
- TwiML `<Play>`+`<Record>` 반복 구조 사용 => 대화 지속 가능
- 모든 대화 로그 자동 기록 및 상담 요약 자동화

---

## 💡 실행 방법

1. `.env` 파일에 Twilio, Redis, OpenAI 등 환경 변수 설정
2. `pip install -r requierment.txt`로 의존성 설치
3. `python -m app.main` 또는 `uvicorn app.main:app --reload`로 서버 실행

---

## 문의 및 참고

- Twilio, FastAPI, gRPC, OpenAI, Redis 공식 문서 참고
- 추가 기능/구조 문의는 개발자에게 연락

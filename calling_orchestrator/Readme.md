# 콜봇 시스템 (CapstonDesign_CodeLearning)

## 개요

이 프로젝트는 취약계층 등 사용자에게 자동 전화 상담을 제공하는 콜봇 시스템입니다. Spring Boot(backend)에서 사용자 정보를 받아 FastAPI가 Twilio를 통해 전화를 걸고, 음성 인식(STT), LLM 분석, 상담 결과 저장/전송까지 자동으로 처리합니다.

---

## 전체 파일 구조

```
calling_orchestrator/
  requirements.txt
  Readme.md
  app/
    __init__.py
    config.py
    main.py                  # FastAPI 앱 실행 및 라우터 등록
    models.py                # 데이터(Pydantic) 모델 정의
    result_forwarding.py     # LLM 결과 등 외부 전송 라우터
    protos/
      __init__.py
      stt_pb2.py
      stt_pb2_grpc.py
      tts_pb2.py
      tts_pb2_grpc.py
      __pycache__/
    routes/
      __init__.py
      callbot.py             # 콜봇 플로우 및 주요 엔드포인트 (상담 전체 흐름)
      __pycache__/
    services/
      __init__.py
      answer_service.py
      classify_service.py
      llm_service.py         # LLM 활용(분류, 요약 등)
      question_service.py
      redis_service.py
      result_service.py
      script_logger.py
      session_service.py     # Redis 세션 관리
      stt_service.py         # 음성(STT) → 텍스트 변환
      tts_service.py
      twilio_service.py      # Twilio 전화/음성 송출/수신
      __pycache__/
    static/
    test/
      test.py
      test_redis_session.py
      __pycache__/
    utils/
      __init__.py
      diff_utils.py
      __pycache__/
    __pycache__/
```

---

## 전체 동작 흐름

1. **Spring Boot → FastAPI `/api/receive`**

   - Spring Boot가 사용자 정보(전화번호, 이름, vulnerable/위기·욕구 리스트, 질문 리스트 등)를 FastAPI `/api/receive`로 POST
   - FastAPI는 받은 정보를 Redis 등 세션 저장소에 저장

2. **FastAPI → Twilio 전화 발신**

   - FastAPI가 Twilio API로 전화번호로 전화를 걸고, Webhook URL(`/api/twilio/voice`)로 상담 흐름을 제어

3. **Twilio Webhook → FastAPI `/api/twilio/voice`**

   - Twilio가 전화 연결 후 `/api/twilio/voice`로 상담 흐름을 위임
   - vulnerable 리스트 각 항목에 대해 “아직도 문제가 있으신가요?” 등 질문을 음성으로 안내
   - 사용자가 음성으로 답하면 Twilio가 녹음, 오디오 URL을 FastAPI로 POST
   - FastAPI가 오디오를 STT로 텍스트 변환, classify로 분석해 해결 여부 판단(해결 시 리스트에서 삭제)

4. **vulnerable 리스트 종료 후**

   - “추가로 불편한 점 있으신가요?” 질문
   - 있으면 답변을 받아 LLM으로 타입 분류 후 리스트에 추가, 다시 상담 루프
   - 없으면 상담 종료 여부 확인

5. **상담 종료**
   - “상담을 종료합니다” 안내 후 통화 종료
   - 상담 결과(스크립트, 요약, 최종 vulnerable 리스트 등)를 Spring Boot 등 외부 시스템으로 전송 또는 저장 (`/api/send_llm_result`)

---

## API 요약

- `POST /api/receive` : Spring Boot → FastAPI, 사용자 정보 및 상담 시작
- `POST /api/twilio/voice` : Twilio Webhook, 음성 응답 처리 및 상담 흐름 제어
- `POST /api/send_llm_result` : FastAPI → Spring Boot, 상담 결과 전송

---

## 기타

- Redis를 세션 저장소로 사용
- LLM(OpenAI 등)으로 답변 분류/요약/상담 결과 생성
- Twilio로 전화 발신 및 음성 안내/녹음/수신

---

## 실행 방법

1. 의존성 설치: `pip install -r requirements.txt`
2. FastAPI 실행: `uvicorn app.main:app --reload`
3. (개발용) ngrok 등으로 외부 Webhook URL 연결

---

### 확장

- 주요 로직: `app/routes/callbot.py`, `app/services/`, `app/result_forwarding.py`
- Spring Boot 연동: system/backend/
- 프론트엔드: system/frontend/

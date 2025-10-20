# 콜봇 시스템 (CapstonDesign_CodeLearning)

## 개요

이 프로젝트는 취약계층 등 사용자에게 **웹 기반의 자동 음성 상담**을 제공하는 콜봇 시스템입니다. Spring Boot(backend)에서 사용자 정보를 받아 FastAPI가 **WebSocket**을 통해 클라이언트(웹 브라우저)와 연결하고, 브라우저의 음성 인식(STT)/음성 합성(TTS) 기능과 서버의 LLM 분석을 연동하여 상담을 진행하고, 그 결과를 다시 Spring Boot로 전송합니다.

---

## 전체 동작 흐름

1.  **Spring Boot → FastAPI `/api/receive`**

    - Spring Boot가 상담에 필요한 사용자 정보(전화번호, 이름, 초기 위기/욕구 리스트 등)를 FastAPI의 `/api/receive` 엔드포인트로 POST합니다.
    - FastAPI는 받은 정보를 바탕으로 Redis에 사용자의 세션 데이터를 생성하고 저장합니다.

2.  **사용자(웹) → FastAPI WebSocket 연결**

    - 사용자가 프론트엔드 웹 페이지(`index.html`)에 접속합니다.
    - '상담 시작' 버튼을 누르면, 프론트엔드는 FastAPI의 `/api/ws/call/{user_phone}` WebSocket 엔드포인트로 연결을 시작합니다.

3.  **상담 진행 (WebSocket 통신)**

    - WebSocket 연결이 수립되면 FastAPI는 Redis에서 해당 사용자의 세션 정보를 가져와 첫 질문을 **텍스트**로 전송합니다.
    - **프론트엔드**: 서버로부터 받은 질문 텍스트를 브라우저의 **TTS(Text-to-Speech) API**로 사용자에게 음성으로 안내합니다.
    - **프론트엔드**: AI의 안내가 끝나면, 사용자의 음성 답변을 브라우저의 **STT(Speech-to-Text) API**를 통해 텍스트로 변환하고, 이 텍스트를 WebSocket을 통해 FastAPI 서버로 전송합니다.
    - **FastAPI**: 받은 텍스트 답변을 분석하고, 시나리오에 따라 다음 질문을 생성하여 다시 프론트엔드로 전송합니다. 이 과정이 모든 시나리오가 끝날 때까지 반복됩니다.

4.  **상담 종료**
    - 모든 상담 시나리오가 완료되면, FastAPI는 최종 상담 결과(전체 스크립트, LLM 요약, 분석 데이터 등)를 종합하여 Spring Boot의 API로 전송하고 WebSocket 연결을 종료합니다.

---

## API 요약

- `POST /api/receive` : Spring Boot → FastAPI, 상담 시작을 위한 사용자 데이터 저장
- `WS /api/ws/call/{user_phone}` : 웹 클라이언트 ↔ FastAPI, 실시간 음성 상담 진행
- `POST /api/send_llm_result` : FastAPI → Spring Boot, 최종 상담 결과 전송

---

## 실행 방법

1.  의존성 설치: `pip install -r requirements.txt`
2.  FastAPI 실행: `uvicorn app.main:app --reload`
3.  웹 브라우저에서 `http://localhost:8000`으로 접속하여 상담을 시작합니다.

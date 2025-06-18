# 콜봇 시스템 (CapstonDesign_CodeLearning)

## 개요

이 프로젝트는 취약계층 대상 자동 전화 상담(콜봇) 시스템입니다.
Spring(backend)에서 사용자 정보를 받아, FastAPI 기반 콜봇이 Twilio를 통해 전화를 걸고, LLM을 활용해 상담/분류/요약/상담결과를 자동으로 처리합니다.

---

## 전체 파일 구조 및 역할

```
calling_orchestrator/
  app/
    main.py                  # FastAPI 앱 실행 및 라우터 등록
    models.py                # 데이터(Pydantic) 모델 정의
    routes/
      callbot.py             # 콜봇 플로우 및 엔드포인트
    services/
      twilio_service.py      # Twilio 전화/음성 송출/수신
      stt_service.py         # 음성(STT) → 텍스트 변환
      llm_service.py         # LLM 활용(답변 판별, 요약, 욕구 분류 등)
      redis_service.py       # 질문 리스트 캐싱/조회
      script_logger.py       # 대화 스크립트 저장
      classify_service.py    # 답변 분류(예외/위기/욕구/심층상담, LLM 활용)
    utils/
      diff_utils.py          # 리스트 diff, count 등 유틸 함수
```

---

## 주요 동작 흐름

1. **system(Spring)** → **FastAPI `/api/receive`**

   - 사용자 정보, 질문, 취약정보 등 JSON을 POST
   - `UserData` 모델로 파싱

2. **콜봇 플로우 실행** (`routes/callbot.py`)

   - Twilio로 전화 연결
   - risk_list(위기정보) 기반 질문/응답 반복
   - 각 답변을 `classify_service.classify_answer`로 분류
     - 예외처리(type 0): 즉시 상담 종료 및 결과 반환
     - 심층상담(type 3): need_human=1로 표시
     - 위기상황(type 1): risk_list에 추가/업데이트
     - 욕구상황(type 2): LLM으로 카테고리 판별, desire_list에 추가/업데이트
   - 추가 불편사항 질문/답변 → LLM으로 vulnerabilities 업데이트
   - 전체 대화 스크립트, 요약, 상담 결과 등 output(JSON) 생성 및 반환

3. **서비스/유틸 함수**
   - Twilio, STT, LLM, Redis, ScriptLogger 등은 각각의 서비스 파일에서 관리
   - diff, count 등 리스트 비교/집계는 utils에서 관리

---

## 주요 함수 및 데이터 흐름

- `receive_user_data(user: UserData, background_tasks)`

  - system에서 받은 JSON을 UserData로 파싱
  - 질문 리스트를 redis에 저장
  - 콜봇 플로우 실행: `callbot_flow(user, background_tasks)`

- `callbot_flow(user: UserData, background_tasks)`

  - Twilio로 전화 연결, 질문/응답 반복, 답변 분류 및 취약정보 업데이트
  - 추가 불편사항 질문/답변, 상담 결과 output 생성

- `classify_service.classify_answer(answer: str)`

  - 답변을 예외/위기/욕구/심층상담으로 분류 (욕구는 LLM 활용)

- `llm_service.generate_response(prompt)`

  - LLM(OpenAI 등)으로 프롬프트에 대한 답변 생성

- `utils.diff_utils.diff_list`, `count_index`
  - 상담 전후 리스트의 diff(삭제/신규) 및 index별 개수 집계

---

## output 예시

```
{
  "overall_script": "대화 내용 전체 스크립트",
  "summary": "상담 내역 요약",
  "result": 2,
  "fail_code": 0,
  "need_human": 0,
  "runtime": 120,
  "result_vulnerabilities": { ... },
  "delete_vulnerabilities": { ... },
  "new_vulnerabilities": { ... }
}
```

---

## 실행 방법

1. Twilio, OpenAI 등 환경변수/설정 파일 준비
2. `main.py`로 FastAPI 서버 실행
3. system(Spring)에서 `/api/receive`로 데이터 POST
4. 콜봇이 자동으로 전화 및 상담 진행, 결과 output 반환

---

## 확장/유지보수

- 각 기능별로 파일이 분리되어 있어, 서비스/유틸/플로우별로 독립적 유지보수 가능
- LLM 프롬프트, 분류 로직, output 포맷 등은 각 파일에서 쉽게 수정 가능

# 콜봇 시스템 (CapstonDesign_CodeLearning)

## Test 방법
### 1 단계: (최초 1회) 환경 준비

1-1)Docker Desktop 실행
가장 먼저, PC에 설치된 Docker Desktop을 실행
<br>
<br>
1-2)의존성 설치
**pip install -r requirements.txt**

---
### 2단계: Redis 서버 시작 (Docker)
VS Code 터미널(터미널 1) 열고  
<br>
**docker run -d --name my-redis -p 6379:6379 redis**

---

### 3단계: FastAPI 서버 시작
새로운 VS Code 터미널(터미널 2) 열기. (기존 1번 터미널은 그대로 두기.) 
<br>
<br>
**uvicorn app.main:app --reload**

---

### 4단계: 테스트 데이터 주입
또 새로운 VS Code 터미널(터미널 3)을 열기. (1, 2번 터미널은 그대로 두기.)
<br>
<br>
**python app/test/test_redis_session.py**

---
### 5단계: 웹 브라우저에서 상담 시뮬레이션

웹 브라우저 열기--> http://localhost:8000을 입력

4단계에서 데이터를 주입한 번호인 "01012345678(여기서 test 번호)"입력

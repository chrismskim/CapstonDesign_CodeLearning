```
src/
└── 
    ├── project/
    │   
    │      
    │   ├── CallingOrchestratorApplication.java   # 메인 애플리케이션
    │   ├── config/                              # 환경 설정
    │   │   └── TwilioConfig.java               # Twilio 설정
    │   ├── controller/                         # REST API 엔드포인트
    │   │   ├── CallController.java            # 통화 제어 엔드포인트
    │   │   └── STTController.java             # STT/TTS 처리
    │   ├── service/                            # 비즈니스 로직
    │   │   ├── CallService.java               # 통화 흐름 관리
    │   ├── STTService.java                # STT 변환 처리
    │   │   ├── TTSService.java                # TTS 변환 처리
    │   │   ├── LLMAdapterService.java         # LLM (GPT) 통합
    │   │   └── NoiseFilterService.java        # 노이즈 필터링
    │   ├── model/                              # 데이터 모델
    │   │   ├── CallSession.java               # 통화 세션
    │   │   └── UserMessage.java               # 사용자 메시지
    │   ├── repository/                         # 데이터 접근 계층
    │   │   └── CallSessionRepository.java     # 통화 세션 저장소
    │   ├── utils/                              # 유틸리티 클래스
    │   │   └── ResponseParser.java            # 응답 파서
    │   |── statemachine/                       # 상태 관리
    │        └── CallState.java                 # 통화 상태 정의
    │        └── CallStateMachine.java          # 상태 전이 로직
    └── resources/
        ├── application.yml                            # 애플리케이션 설정 파일
        ├── messages.properties                        # 다국어 메시지 파일
        └── templates/                                # HTML 템플릿 (필요시)
            └── call_summary.html                     # 통화 요약 템플릿

```

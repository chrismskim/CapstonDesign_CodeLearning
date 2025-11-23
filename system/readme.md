(작성중)

# Calling System (관리자 웹/백엔드)

AI 보이스봇을 활용한 취약계층 발굴 서비스의 **관리 시스템(Calling System)** 입니다.  
관리자는 이 서비스를 통해 다음을 수행할 수 있습니다.

- 취약계층 대상자 등록/수정/삭제/조회
- 질문 세트 관리
- 상담 대기열 생성 및 상담 시작
- 상담 결과/이력 조회
- 상담 통계 조회
- 관리자 계정/승인 관리


## 1. 기술 스택

- **Backend**
  - Java 17
  - Spring Boot 3.x
  - Gradle
  - Spring Data JPA / Spring Data MongoDB
- **Database**
  - MySQL : 관리자 계정
  - MongoDB : 취약계층, 질문 세트, 상담 이력
  - Redis : 상담 대기열, 질문 세트 캐싱
- **Frontend**
  - Next.js 14
 
## 2. 실행을 위한 요구사항
- 자동 생성 계정
  - ID: admin
  - Password: 12345678
- Docker로 실행
  - MySQL
  - MongoDB
  - Redis
<img width="1038" height="116" alt="image" src="https://github.com/user-attachments/assets/b7afecd5-b77a-423b-9182-82b2201bcdb4" />

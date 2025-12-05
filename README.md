# mzc-lp

> LMS (Learning Management System) 플랫폼

---

## 1. 프로젝트 개요

### 예상 아키텍처 참고

https://github.com/shsh99/lms-architecture

### 모듈 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      Core Engine                            │
│  (Course, Curriculum, Enrollment, User, Content, Progress)  │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  B2B 확장     │   │  B2C 확장     │   │  K-Pop 확장   │
│               │   │               │   │               │
│ • Tenant      │   │ • Instructor  │   │ • Promotion   │
│ • Org         │   │ • Payment     │   │ • Camp        │
│ • Analytics   │   │ • Discovery   │   │ • Subscription│
│               │   │               │   │ • Video FB    │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 2. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Backend** | Spring Boot / Java | 3.2.11 / 21 |
| **Frontend** | React / TypeScript / Vite | 19.x / 5.x / 7.x |
| **Styling** | TailwindCSS | - |
| **Database** | MySQL (prod) / H2 (dev) | 8.0 |
| **Infra** | AWS (ECS, RDS, S3, CloudFront) | - |
| **인증** | JWT (Access + Refresh Token) | - |

---

## 3. 저장소 구조 (분리형)

```
mzc-lp-backend/     # Backend 전용
├── src/main/java/.../
├── build.gradle
└── README.md

mzc-lp-frontend/    # Frontend 전용
├── src/
├── vite.config.ts
└── README.md
```

### 환경별 배포

| 환경 | Backend | Frontend | Database |
|------|---------|----------|----------|
| **Local** | Port 8080 | Port 3000 | H2 (In-memory) |
| **Dev** | ECS (Private Subnet) | S3 + CloudFront | RDS db.t3.micro |
| **Prod** | ECS Multi-AZ | S3 + CloudFront | RDS Multi-AZ |

---

## 4. 브랜치 전략

### 구조

```
main (배포)
  └── dev (개발 통합)
        ├── feat/이슈번호-기능명
        ├── fix/이슈번호-버그명
        └── refactor/이슈번호-개선명
```

### 브랜치 규칙

| 브랜치 | 역할 | 규칙 |
|--------|------|------|
| `main` | 프로덕션 배포 | 직접 Push 금지, PR만 |
| `dev` | 개발 통합 | 직접 Push 금지, PR만 |
| `feat/*` | 기능 개발 | dev에서 분기 → PR |
| `fix/*` | 버그 수정 | dev에서 분기 → PR |
| `hotfix/*` | 긴급 수정 | main에서 분기 → 양쪽 병합 |

### 브랜치 네이밍

```
타입/이슈번호-설명

feat/123-user-login
fix/456-auth-validation
refactor/789-service-split
```

### 커밋 메시지

```
[태그] 제목 (#이슈번호)

- 변경사항 1
- 변경사항 2
```

| 태그 | 예시 |
|------|------|
| `Feat` | `[Feat] 로그인 API 구현 (#123)` |
| `Fix` | `[Fix] 토큰 검증 오류 (#456)` |
| `Refactor` | `[Refactor] 서비스 분리 (#789)` |
| `Docs` | `[Docs] API 명세 작성` |
| `Test` | `[Test] 로그인 테스트 추가` |

**규칙**: 제목 50자 이내, 명령문

### 워크플로우

```bash
# 1. 브랜치 생성
git checkout dev && git pull origin dev
git checkout -b feat/123-user-login

# 2. 개발 & 커밋
git add . && git commit -m "[Feat] 로그인 구현 (#123)"

# 3. Push
git push origin feat/123-user-login

# 4. GitHub에서 PR 생성 (Squash and merge)

# 5. 정리
git checkout dev && git pull origin dev
git branch -d feat/123-user-login
```

---

## 5. 개발 컨벤션

> 컨벤션 문서: `C:\Users\MZC01-\Desktop\docs`

### 컨벤션 목록

#### Backend (01-09)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 01 | PROJECT-STRUCTURE | 프로젝트 구조 |
| 02 | GIT-CONVENTIONS | Git 브랜치, 커밋 메시지 |
| 03 | CONTROLLER | REST API, HTTP 규칙 |
| 04 | SERVICE | 비즈니스 로직, 트랜잭션 |
| 05 | REPOSITORY | 데이터 접근, N+1 해결 |
| 06 | ENTITY | 도메인 모델, Setter 금지 |
| 07 | DTO | Request/Response, Record |
| 08 | EXCEPTION | 예외 처리, ErrorCode |
| 09 | GIT-SUBMODULE | 민감 정보 관리 |

#### Infrastructure & 품질 (17-24)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 17 | DESIGN | TailwindCSS, 디자인 시스템 |
| 18 | DOCKER | Docker, docker-compose |
| 19 | DATABASE | MySQL, 스키마 설계 |
| 20 | AWS | ECS, RDS, S3, CI/CD |
| 21 | SECURITY | 인증, 보안, 취약점 방지 |
| 22 | PERFORMANCE | N+1, 캐싱, 최적화 |
| 23 | EXTERNAL-API | 외부 연동, 재시도, 타임아웃 |
| 24 | MULTI-TENANCY | 멀티테넌시 설계 |

### 핵심 코딩 규칙

**Backend:**
```
✅ Entity: Setter 금지 → 비즈니스 메서드 사용
✅ Service: @Transactional(readOnly=true) 클래스 레벨
✅ Controller: try-catch 금지 → GlobalExceptionHandler
✅ DTO: Java Record + from() 정적 팩토리
✅ Enum: @Enumerated(EnumType.STRING)
```

**Frontend:**
```
✅ any 타입 금지 → 명시적 타입 정의
✅ 서버 상태: React Query (useState는 UI 상태만)
✅ API: Axios Instance + handleApiError
✅ 컴포넌트: Props Destructuring + Early Return
```

### 작업 순서

| 작업 유형 | 순서 |
|----------|------|
| **Backend CRUD** | Entity → Repository → DTO → Exception → Service → Controller → Test |
| **Frontend 페이지** | Types → API Service → React Query Hook → Component → Test |

---

## 6. 인프라 정보

> 민감한 인프라 정보는 별도 문서로 관리됩니다.
>
> 담당자에게 문의하세요.

---

## 7. 개발 서버 실행

```bash
# Backend (Port 8080)
cd backend && ./gradlew bootRun

# Frontend (Port 3000)
cd frontend && npm run dev
```

| 항목 | 값 |
|------|-----|
| Backend | `http://localhost:8080/api/*` |
| Frontend | `http://localhost:3000` |

---

## 8. 관련 문서

| 문서 | 위치 |
|------|------|
| 컨벤션 | `C:\Users\MZC01-\Desktop\docs\conventions\` |
| 인프라 | `C:\Users\MZC01-\Desktop\set\` |
| 아키텍처 | https://github.com/shsh99/lms-architecture |

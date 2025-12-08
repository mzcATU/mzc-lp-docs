# mzc-lp

> MZC Learn Platform - 멀티테넌시 학습 플랫폼

---

### 예상 아키텍처 참고

https://lms-architecture.vercel.app/

## 1. 프로젝트 개요

### 플랫폼 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    ┌───────────────────────┐                        │
│                    │      B2C (코어)       │                        │
│                    │   인프런/Udemy 스타일  │                        │
│                    │   www.learn.mzc.com   │                        │
│                    └───────────┬───────────┘                        │
│                                │                                    │
│                         테넌트화 (브랜딩 + 커스터마이징)             │
│                                │                                    │
│              ┌─────────────────┴─────────────────┐                  │
│              ▼                                   ▼                  │
│   ┌─────────────────────┐             ┌─────────────────────┐      │
│   │        B2B          │             │        KPOP         │      │
│   │     기업 전용 LMS    │             │   외국인 단기 연수   │      │
│   │ samsung.learn.mzc.com│             │   kpop.mzc.com     │      │
│   └─────────────────────┘             └─────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**핵심 개념**: B2C가 코어 시스템이고, B2B와 KPOP은 B2C를 기반으로 테넌트화하여 각 도메인에 맞게 커스터마이징한 버전

### 플랫폼별 특징

| 플랫폼 | URL | 컨셉 | 대상 |
|--------|-----|------|------|
| **B2C** | `www.learn.mzc.com` | 인프런/Udemy 스타일 오픈 마켓플레이스 | 일반 사용자 |
| **B2B** | `{company}.learn.mzc.com` | 기업 맞춤형 LMS (화이트라벨) | 기업 임직원 |
| **KPOP** | `kpop.mzc.com` | K-POP 교육 (2~3주 연수 프로그램) | 외국인 연수생 |

### 기능 비교표

| 기능 | B2C | B2B | KPOP |
|------|:---:|:---:|:----:|
| **강의 생성** | USER 가능 | TENANT_OPERATOR만 | OPERATOR만 |
| **강사 배정** | OPERATOR | TENANT_OPERATOR | OPERATOR |
| **개인 결제** | ✅ | ❌ | ✅ |
| **기업 결제** | ❌ | ✅ | ❌ |
| **조직 관리** | ❌ | ✅ | ❌ |
| **스케줄/시설 관리** | ❌ | ❌ | ✅ |
| **팀 구성/채팅** | ❌ | ❌ | ✅ |
| **영상 피드백** | ❌ | ❌ | ✅ |
| **브랜딩** | ❌ | ✅ | ✅ (고정) |
| **SSO** | ❌ | ✅ | ❌ |

### 역할 체계

```
SystemRole (플랫폼 전체)
└── SUPER_ADMIN ─────────── MZC 내부 관리자

TenantRole (테넌트별)
├── TENANT_ADMIN ────────── 테넌트 최고 관리자
├── OPERATOR (B2C/KPOP) ─── 운영자
├── USER (B2C/KPOP) ─────── 일반 사용자
├── TENANT_OPERATOR (B2B) ─ 테넌트 운영자
└── MEMBER (B2B) ────────── 일반 직원

CourseRole (강의별)
├── OWNER ───────────────── 강의 생성자
└── INSTRUCTOR ──────────── 강사 (배정받음)
```

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
│ • Tenant      │   │ • Instructor  │   │ • Schedule    │
│ • Org         │   │ • Payment     │   │ • Team/Chat   │
│ • Analytics   │   │ • Discovery   │   │ • Facility    │
│ • SSO         │   │ • Review      │   │ • Video FB    │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 2. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Backend** | Spring Boot / Java | 3.2.11 / 21 |
| **Frontend** | React / TypeScript / Vite | 19.x / 5.x / 7.x |
| **Styling** | TailwindCSS | - |
| **Database** | MySQL | 8.0 |
| **Infra** | AWS (ECS, RDS, S3, CloudFront) | - |
| **인증** | JWT (Access + Refresh Token) | - |

---

## 3. 저장소 구조

### Option A: 모노레포 예상 구조(권장)

```
mzc-lp/
├── backend/                              # Spring Boot API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mzc/lp/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── user/
│   │   │   │   │   │   ├── controller/
│   │   │   │   │   │   │   └── UserController.java
│   │   │   │   │   │   ├── service/
│   │   │   │   │   │   │   └── UserService.java
│   │   │   │   │   │   ├── repository/
│   │   │   │   │   │   │   └── UserRepository.java
│   │   │   │   │   │   ├── entity/
│   │   │   │   │   │   │   └── User.java
│   │   │   │   │   │   ├── dto/
│   │   │   │   │   │   │   ├── UserRequest.java
│   │   │   │   │   │   │   └── UserResponse.java
│   │   │   │   │   │   └── exception/
│   │   │   │   │   │       └── UserNotFoundException.java
│   │   │   │   │   ├── course/
│   │   │   │   │   │   └── (동일 구조)
│   │   │   │   │   └── enrollment/
│   │   │   │   │       └── (동일 구조)
│   │   │   │   │
│   │   │   │   ├── global/
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   │   └── JpaConfig.java
│   │   │   │   │   ├── exception/
│   │   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   │   ├── ErrorCode.java
│   │   │   │   │   │   └── ErrorResponse.java
│   │   │   │   │   ├── security/
│   │   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   │   └── JwtAuthenticationFilter.java
│   │   │   │   │   └── common/
│   │   │   │   │       ├── BaseEntity.java
│   │   │   │   │       └── PageResponse.java
│   │   │   │   │
│   │   │   │   └── MzcLpApplication.java
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-local.yml
│   │   │       ├── application-dev.yml
│   │   │       └── application-prod.yml
│   │   │
│   │   └── test/
│   │       └── java/com/mzc/lp/
│   │           └── domain/user/
│   │               ├── controller/UserControllerTest.java
│   │               └── service/UserServiceTest.java
│   │
│   ├── build.gradle
│   ├── settings.gradle
│   └── Dockerfile
│
├── frontend/                             # React Web App
│   ├── src/
│   │   ├── pages/                        # 페이지 컴포넌트
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── SignupPage.tsx
│   │   │   ├── course/
│   │   │   │   ├── CourseListPage.tsx
│   │   │   │   └── CourseDetailPage.tsx
│   │   │   └── user/
│   │   │       └── ProfilePage.tsx
│   │   │
│   │   ├── components/                   # 재사용 컴포넌트
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Loading.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── hooks/                        # Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCourses.ts
│   │   │   └── useUser.ts
│   │   │
│   │   ├── services/                     # API 호출
│   │   │   ├── api.ts                    # Axios Instance
│   │   │   ├── authService.ts
│   │   │   ├── courseService.ts
│   │   │   └── userService.ts
│   │   │
│   │   ├── stores/                       # 전역 상태 (필요시)
│   │   │   └── authStore.ts
│   │   │
│   │   ├── types/                        # TypeScript 타입
│   │   │   ├── auth.types.ts
│   │   │   ├── course.types.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── utils/                        # 유틸리티
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.development
│
├── docs/                                 # 문서
│   ├── CLAUDE.md
│   ├── MONOREPO.md
│   ├── SEPARATED-REPOS.md
│   ├── conventions/
│   └── templates/
│
├── .github/                              # GitHub 설정
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── docker-compose.yml                    # 로컬 개발용 Docker
├── .gitignore
└── README.md
```

**개발 서버 실행:**
```bash
# Backend (Port 8080)
cd backend && ./gradlew bootRun

# Frontend (Port 3000) - 별도 터미널
cd frontend && npm run dev

# Docker로 MySQL 실행 (최초 1회)
docker-compose up -d mysql
```

---

### Option B: 분리형

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

---

### 환경별 구성

| 환경 | Backend | Frontend | Database |
|------|---------|----------|----------|
| **Local** | `./gradlew bootRun` (8080) | Vite Dev Server (3000) | MySQL (Docker) |
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

> 컨벤션 문서: `docs/conventions/`

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

#### Frontend (10-16)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 10 | REACT-TYPESCRIPT-CORE | TypeScript 기본, any 금지 |
| 11 | REACT-PROJECT-STRUCTURE | 폴더 구조, 파일 규칙 |
| 12 | REACT-COMPONENT | 컴포넌트 설계, Props |
| 13 | REACT-STATE-MANAGEMENT | React Query, 상태 관리 |
| 14 | REACT-API-INTEGRATION | Axios, API 연동 |
| 15 | BACKEND-TEST | JUnit, 테스트 전략 |
| 16 | FRONTEND-TEST | Jest, React Testing Library |

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
| AI 가이드 | [docs/CLAUDE.md](docs/CLAUDE.md) |
| 모노레포 | [docs/MONOREPO.md](docs/MONOREPO.md) |
| 분리형 | [docs/SEPARATED-REPOS.md](docs/SEPARATED-REPOS.md) |
| 컨벤션 | [docs/conventions/](docs/conventions/) |
| 템플릿 | [docs/templates/](docs/templates/) |
| 아키텍처 | https://lms-architecture.vercel.app/ |

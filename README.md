# mzc-lp

> MZC Learn Platform - 멀티테넌시 학습 플랫폼 (문서 저장소)

---

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

---

## 2. 저장소 구조 (Poly-Repo)

```
GitHub Organization: mzcATU/
├── mzc-lp/                      # 공통 문서 저장소 (현재)
├── mzc-lp-backend/              # Backend API 서버
├── mzc-lp-frontend/             # Frontend 웹 앱
└── mzc-lp-infra/                # (선택) IaC, 배포 스크립트
```

### 저장소별 역할

| 저장소 | 역할 | 기술 스택 |
|--------|------|----------|
| **mzc-lp** | 공통 문서, 컨벤션, 설계 문서 | Markdown |
| **mzc-lp-backend** | REST API, 비즈니스 로직 | Java 21, Spring Boot 3.x, JPA |
| **mzc-lp-frontend** | 웹 UI, 사용자 인터페이스 | React 19, TypeScript, Vite |
| **mzc-lp-infra** | Terraform, Docker, CI/CD | Terraform, GitHub Actions |

### Backend 구조 (mzc-lp-backend)

```
mzc-lp-backend/
├── .github/workflows/           # CI/CD
├── src/main/java/com/mzc/lp/
│   ├── common/                  # 공통 (config, exception, response)
│   ├── domain/                  # 도메인 모듈
│   │   ├── user/                # UM (User Master)
│   │   ├── course/              # CM (Course Matrix) + CR (Course Relation)
│   │   ├── content/             # CMS (Content Management)
│   │   ├── learning/            # LO (Learning Object)
│   │   ├── enrollment/          # SIS (Student Info System)
│   │   └── instructor/          # IIS (Instructor Info System)
│   └── infra/                   # S3, Redis 연동
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   └── application-prod.yml
├── build.gradle
├── Dockerfile
├── docker-compose.yml           # 로컬 DB
├── .gitignore
├── .env.example
└── README.md
```

### Frontend 구조 (mzc-lp-frontend)

```
mzc-lp-frontend/
├── .github/workflows/           # CI/CD
├── src/
│   ├── api/                     # API 클라이언트
│   ├── components/              # 공통 컴포넌트
│   ├── features/                # 기능별 모듈
│   ├── hooks/                   # 공통 훅
│   ├── stores/                  # 상태 관리 (Zustand)
│   ├── types/                   # TypeScript 타입
│   └── utils/                   # 유틸리티
├── package.json
├── vite.config.ts
├── .gitignore
├── .env.example
└── README.md
```

---

## 3. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Backend** | Spring Boot / Java | 3.2.11 / 21 |
| **Frontend** | React / TypeScript / Vite | 19.x / 5.x / 7.x |
| **Styling** | TailwindCSS | - |
| **Database** | MySQL | 8.0 |
| **Infra** | AWS (EC2, RDS, ECR, S3, CloudFront) | - |
| **인증** | JWT (Access + Refresh Token) | - |

---

## 4. 인프라 환경

### AWS 아키텍처 (ap-northeast-2)

```
┌─────────────────────────────────────────────────────────┐
│                  AWS Cloud (ap-northeast-2)              │
├─────────────────────────────────────────────────────────┤
│  [Public Subnet]                                         │
│    Bastion Server ──→ NAT Gateway                       │
│                                                          │
│  [Private Subnet - App]                                  │
│    API Server (EC2)                                      │
│                                                          │
│  [Private Subnet - DB]                                   │
│    RDS MySQL                                             │
│                                                          │
│  ECR ──→ Docker Image                                    │
│  CloudFront + S3 (Frontend) - 필요시 구성                │
└─────────────────────────────────────────────────────────┘
```

### 현재 인프라 정보

| 구분 | 값 |
|------|-----|
| **Region** | ap-northeast-2 (서울) |
| **Domain** | api.mzanewlp.cloudclass.co.kr |
| **ECR** | 697924056608.dkr.ecr.ap-northeast-2.amazonaws.com/mza-newlp-repo |

#### RDS (MySQL)

| 항목 | 값 |
|------|-----|
| Host | mza-newlp-db-instance.cni8cqie2yhm.ap-northeast-2.rds.amazonaws.com |
| Port | 3306 |
| Database | mza_newlp |

#### EC2 접속

| 서버 | 명령어 |
|------|--------|
| Bastion | `ssh -i "mza-newlp-key.pem" ec2-user@43.201.252.223` |
| API Server | Bastion 내부에서: `ssh -i "mza-newlp-key.pem" ec2-user@10.50.101.214` |

### 환경별 URL

| 환경 | Backend | Frontend | Database |
|------|---------|----------|----------|
| Local | localhost:8080 | localhost:3000 | Docker MySQL |
| Dev | api.mzanewlp.cloudclass.co.kr | (추후 구성) | RDS MySQL |

---

## 5. 개발 환경 실행

### 실행 순서

```bash
# 1. Backend DB 실행 (mzc-lp-backend)
cd mzc-lp-backend
docker-compose up -d

# 2. Backend 실행
./gradlew bootRun

# 3. Frontend 실행 (새 터미널, mzc-lp-frontend)
cd mzc-lp-frontend
npm install && npm run dev
```

### 로컬 환경 흐름

```
Browser (:3000) → Frontend (Vite) → Backend (:8080) → MySQL (Docker)
```

---

## 6. 브랜치 전략

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

---

## 7. 모듈 구조

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

### 백엔드 모듈

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              mzc-lp Platform                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌──────────────┐      ┌──────────────┐             │
│                              │   Learning   │◄────►│   Content    │             │
│                              │    Object    │      │  Management  │             │
│                              │     (LO)     │      │    (CMS)     │             │
│                              └──────┬───────┘      └──────────────┘             │
│                                     │                                            │
│                                     ▼                                            │
│  ┌──────────┐     ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    UM    │     │   IIS    │    │    Course    │    │    Course    │          │
│  │   User   │────►│Instructor│    │    Matrix    │◄───│   Relation   │          │
│  │  Master  │     │   Info   │    │     (CM)     │    │     (CR)     │          │
│  └────┬─────┘     └────┬─────┘    └──────┬───────┘    └──────────────┘          │
│       │                │                 │                                       │
│       │           ┌────┴─────────────────┘                                       │
│       │           │                                                              │
│       │           ▼                                                              │
│       │     ┌──────────┐                                                         │
│       └────►│    TS    │                                                         │
│             │   Time   │                                                         │
│       ┌────►│ Schedule │                                                         │
│       │     └────┬─────┘                                                         │
│       │          │                                                               │
│  ┌────┴─────┐    │                                                               │
│  │   SIS    │◄───┘                                                               │
│  │ Student  │                                                                    │
│  │   Info   │                                                                    │
│  └──────────┘                                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 컨벤션 요약

### Backend 핵심 규칙

```
✅ Entity: Setter 금지 → 비즈니스 메서드 사용
✅ Service: @Transactional(readOnly=true) 클래스 레벨
✅ Controller: try-catch 금지 → GlobalExceptionHandler
✅ DTO: Java Record + from() 정적 팩토리
✅ Enum: @Enumerated(EnumType.STRING)
```

### Frontend 핵심 규칙

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

## 9. 관련 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| AI 가이드 | [docs/CLAUDE.md](docs/CLAUDE.md) | Claude 작업 가이드 |
| 폴리레포 | [docs/POLY-REPO.md](docs/POLY-REPO.md) | 저장소 구성 개요 |
| Backend 설정 | [docs/context/backend-setup.md](docs/context/backend-setup.md) | Backend 상세 설정 |
| Frontend 설정 | [docs/context/frontend-setup.md](docs/context/frontend-setup.md) | Frontend 상세 설정 |
| 아키텍처 | [docs/context/architecture.md](docs/context/architecture.md) | 시스템 아키텍처 |
| 모듈 구조 | [docs/context/module-structure.md](docs/context/module-structure.md) | 백엔드 모듈 상세 |
| 컨벤션 | [docs/conventions/](docs/conventions/) | 개발 컨벤션 |

---

## 10. 저장소 생성 체크리스트

### Backend (mzc-lp-backend)

- [ ] GitHub 저장소 생성
- [ ] Spring Boot 프로젝트 초기화 (Java 21)
- [ ] `.gitignore`, `.env.example` 설정
- [ ] `application.yml` 환경별 설정
- [ ] `Dockerfile`, `docker-compose.yml`
- [ ] `.github/workflows/` CI/CD
- [ ] README.md

### Frontend (mzc-lp-frontend)

- [ ] GitHub 저장소 생성
- [ ] Vite + React 19 + TypeScript 초기화
- [ ] `.gitignore`, `.env.example` 설정
- [ ] API 클라이언트 설정
- [ ] `.github/workflows/` CI/CD
- [ ] README.md

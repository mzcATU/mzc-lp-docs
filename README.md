# mzc-lp

> MZC Learn Platform - 멀티테넌시 학습 플랫폼 (문서 저장소)

---

## 1. 프로젝트 개요

### 플랫폼 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ┌───────────────────────┐                        │
│                    │      B2C (코어)       │                        │
│                    │   인프런/Udemy 스타일  │                        │
│                    └───────────┬───────────┘                        │
│                         테넌트화 (브랜딩 + 커스터마이징)             │
│              ┌─────────────────┴─────────────────┐                  │
│              ▼                                   ▼                  │
│   ┌─────────────────────┐             ┌─────────────────────┐      │
│   │        B2B          │             │        KPOP         │      │
│   │     기업 전용 LMS    │             │   외국인 단기 연수   │      │
│   └─────────────────────┘             └─────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

**핵심 개념**: B2C가 코어 시스템이고, B2B와 KPOP은 B2C를 기반으로 테넌트화

### 플랫폼별 특징

| 플랫폼 | 컨셉 | 대상 |
|--------|------|------|
| **B2C** | 인프런/Udemy 스타일 오픈 마켓플레이스 | 일반 사용자 |
| **B2B** | 기업 맞춤형 LMS (화이트라벨) | 기업 임직원 |
| **KPOP** | K-POP 교육 (2~3주 연수 프로그램) | 외국인 연수생 |

---

## 2. 저장소 구조 (Poly-Repo)

```
GitHub Organization: mzcATU/
├── mzc-lp-docs/         # 공통 문서 저장소 (현재)
├── mzc-lp-backend/      # Backend API 서버
└── mzc-lp-frontend/     # Frontend 웹 앱
```

| 저장소 | 역할 | 기술 스택 |
|--------|------|----------|
| **mzc-lp-docs** | 공통 문서, 컨벤션, 설계 문서 | Markdown |
| **mzc-lp-backend** | REST API, 비즈니스 로직 | Java 21, Spring Boot 3.x |
| **mzc-lp-frontend** | 웹 UI, 사용자 인터페이스 | React 19, TypeScript, Vite |

> 상세 구조 및 설정 → [docs/POLY-REPO.md](docs/POLY-REPO.md)

---

## 3. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **Backend** | Spring Boot / Java | 3.4.12 / 21 |
| **Frontend** | React / TypeScript / Vite | 19.x / 5.x / 7.x |
| **Styling** | TailwindCSS | - |
| **Database** | MySQL | 8.0 |
| **Infra** | AWS (EC2, RDS, ECR, S3) | - |
| **인증** | JWT (Access + Refresh Token) | - |

---

## 4. 개발 환경

### 실행 순서

```bash
# 1. Backend DB 실행 (mzc-lp-backend)
cd mzc-lp-backend && docker-compose up -d

# 2. Backend 실행
./gradlew bootRun

# 3. Frontend 실행 (새 터미널, mzc-lp-frontend)
cd mzc-lp-frontend && npm install && npm run dev
```

### 환경별 URL

| 환경 | Backend | Frontend |
|------|---------|----------|
| Local | localhost:8080 | localhost:3000 |
| Dev | api.mzanewlp.cloudclass.co.kr | (추후 구성) |

> 인프라 상세 → [docs/POLY-REPO.md](docs/POLY-REPO.md)

---

## 5. 브랜치 전략

```
main (배포)
  └── dev (개발 통합)
        ├── feat/이슈번호-기능명
        ├── fix/이슈번호-버그명
        └── refactor/이슈번호-개선명
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

---

## 6. 모듈 구조

```
UM (User Master)     ← 사용자 관리
CM (Course Matrix)   ← 강의 구조
CR (Course Relation) ← 강의 연관관계
LO (Learning Object) ← 학습 콘텐츠
CMS (Content Mgmt)   ← 콘텐츠 관리
SIS (Student Info)   ← 수강 정보
IIS (Instructor)     ← 강사 정보
```

> 상세 모듈 구조 → [docs/context/module-structure.md](docs/context/module-structure.md)

---

## 7. 컨벤션 요약

### Backend 핵심 규칙

```
✅ Entity: Setter 금지 → 비즈니스 메서드 사용
✅ Service: @Transactional(readOnly=true) 클래스 레벨
✅ Controller: try-catch 금지 → GlobalExceptionHandler
✅ DTO: Java Record + from() 정적 팩토리
```

### Frontend 핵심 규칙

```
✅ any 타입 금지 → 명시적 타입 정의
✅ 서버 상태: React Query (useState는 UI 상태만)
✅ API: Axios Instance + handleApiError
✅ 컴포넌트: Props Destructuring + Early Return
```

> 전체 컨벤션 → [docs/conventions/](docs/conventions/)

---

## 8. 관련 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| AI 가이드 | [docs/CLAUDE.md](docs/CLAUDE.md) | Claude 작업 가이드 |
| 폴리레포 | [docs/POLY-REPO.md](docs/POLY-REPO.md) | 저장소 구성, 인프라, 설정 |
| 아키텍처 | [docs/context/architecture.md](docs/context/architecture.md) | 시스템 아키텍처 |
| 모듈 구조 | [docs/context/module-structure.md](docs/context/module-structure.md) | 백엔드 모듈 상세 |
| 컨벤션 | [docs/conventions/](docs/conventions/) | 개발 컨벤션 |
| 화면 정의서 | [docs/design-specs/](docs/design-specs/) | TO/TU 화면 설계 |

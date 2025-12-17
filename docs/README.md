# 문서 가이드

> AI(Claude)와 협업하여 일관된 개발을 진행하기 위한 문서 모음

---

## 문서 구조

```
📁 docs/
├── 📄 CLAUDE.md                 # AI 작업 가이드 (핵심 진입점)
├── 📄 PHASE-ROADMAP.md          # 개발 로드맵 (B2C→B2B→KPOP)
├── 📄 POLY-REPO.md              # 폴리레포 구성 가이드
├── 📄 MONOREPO.md               # 모노레포 설정 가이드
│
├── 📁 conventions/              # 코딩 컨벤션
│   ├── 00-CONVENTIONS-CORE.md   # 공통 핵심 규칙
│   ├── 01~09: Backend 컨벤션
│   ├── 10~16: Frontend 컨벤션
│   ├── design/: Design 컨벤션 (00-02)
│   ├── 17~19: Infrastructure 컨벤션
│   └── 20~24: 품질/기타 컨벤션
│
├── 📁 context/                  # 프로젝트 컨텍스트
│   ├── architecture.md          # 시스템 아키텍처
│   ├── module-structure.md      # 모듈 구조
│   ├── multi-tenancy.md         # 멀티테넌시 설계
│   ├── user-roles.md            # 사용자 역할 체계
│   ├── backend-setup.md         # Backend 설정 상세
│   └── frontend-setup.md        # Frontend 설정 상세
│
├── 📁 structure/                # 모듈별 상세 구조
│   ├── backend/                 # Backend 모듈 문서
│   └── frontend/                # Frontend 모듈 문서
│
├── 📁 dev-logs/                 # 개발 로그
│   ├── backend/                 # 백엔드 모듈별 로그
│   └── frontend/                # 프론트엔드 역할별 로그
│
└── 📁 templates/                # 작업 템플릿
    ├── md-writing-guide.md      # 문서 작성 가이드
    ├── task-workflow.md         # AI 작업 진행 규칙
    └── ...
```

---

## 컨벤션 목록

### Backend (00-09)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 00 | CONVENTIONS-CORE | 공통 핵심 규칙 |
| 01 | PROJECT-STRUCTURE | 프로젝트 구조 |
| 02 | GIT-CONVENTIONS | Git 브랜치, 커밋 메시지 |
| 03 | CONTROLLER | REST API, HTTP 규칙 |
| 04 | SERVICE | 비즈니스 로직, 트랜잭션 |
| 05 | REPOSITORY | 데이터 접근, N+1 해결 |
| 06 | ENTITY | 도메인 모델, Setter 금지 |
| 07 | DTO | Request/Response, Record |
| 08 | EXCEPTION | 예외 처리, ErrorCode |
| 09 | GIT-SUBMODULE | 민감 정보 관리 |

### Frontend (10-16)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 10 | REACT-TYPESCRIPT-CORE | React+TS 핵심 규칙 |
| 11 | REACT-PROJECT-STRUCTURE | 폴더 구조 |
| 12 | REACT-COMPONENT | 컴포넌트 작성 규칙 |
| 13 | REACT-STATE-MANAGEMENT | 상태 관리 (React Query) |
| 14 | REACT-API-INTEGRATION | API 통신, Axios |
| 15 | BACKEND-TEST | JUnit5, MockMvc |
| 16 | FRONTEND-TEST | Vitest, React Testing Library |

### Design (design/00-02)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 00 | DESIGN-CONVENTIONS | TailwindCSS, CVA, Radix UI |
| 01 | DESIGN-TOKENS-COMMON | Admin 공통 디자인 토큰 |
| 02 | DESIGN-TOKENS-TENANT | 테넌시별 디자인 토큰 |

### Infrastructure & 품질 (17-24)

| # | 컨벤션 | 설명 |
|---|--------|------|
| 17 | DOCKER | Docker, docker-compose |
| 18 | DATABASE | MySQL, 스키마 설계 |
| 19 | AWS | ECS, RDS, S3, CI/CD |
| 20 | SECURITY | 인증, 보안, 취약점 방지 |
| 21 | PERFORMANCE | N+1, 캐싱, 최적화 |
| 22 | EXTERNAL-API | 외부 연동, 재시도 |
| 23 | MULTI-TENANCY | 멀티테넌트 아키텍처 |
| 24 | IGNORE | .gitignore, .dockerignore |

---

## 문서 활용 가이드

| 상황 | 참조 문서 |
|------|----------|
| AI 작업 시작 전 | CLAUDE.md (핵심 진입점) |
| 개발 로드맵 확인 | PHASE-ROADMAP.md |
| 특정 레이어 개발 | conventions/해당 번호 컨벤션 |
| 전체 구조 파악 | context/architecture.md |
| 저장소 설정 | POLY-REPO.md → backend-setup.md, frontend-setup.md |
| 문서 작성 | templates/md-writing-guide.md |
| 개발 로그 | dev-logs/ (백엔드/프론트엔드) |

---

## 핵심 철학: 맥도날드화 원칙

| 원칙 | 설명 | 적용 방식 |
|------|------|----------|
| **효율성** | 최적의 방법으로 목표 달성 | 필요한 컨벤션만 선택적 로딩 |
| **계산 가능성** | 결과를 측정 가능하게 | PRD 템플릿으로 범위 명확화 |
| **예측 가능성** | 동일 입력 → 동일 결과 | 7단계 워크플로우 일관 적용 |
| **통제** | 규칙 기반 판단 | MoSCoW 우선순위로 범위 제한 |

---

## 문서 특징

1. **계층적 구조**: CLAUDE.md 하나로 시작 → 필요시 상세 문서 참조
2. **선택적 로딩**: 작업별 필요한 컨벤션만 참조
3. **200줄 제한**: 핵심 가이드는 200줄 이하, 상세 내용은 분리
4. **중복 제거**: 한 곳에서만 정의, 다른 곳은 참조

---

> 프로젝트 개요 → [../README.md](../README.md)

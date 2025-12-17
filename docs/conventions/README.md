# Conventions - 전체 목록

> 컨벤션 문서 전체 목록 및 선택 가이드
> **작업별로 필요한 문서만 선택적으로 읽기**

---

## 빠른 선택 가이드

| 작업 | 읽을 문서 |
|------|----------|
| Entity 생성 | 06 (+ 00 참조) |
| Repository 생성 | 05 (+ 06 참조) |
| Service 생성 | 04 (+ 07, 08 참조) |
| Controller 생성 | 03 (+ 07 참조) |
| DTO 생성 | 07 |
| Exception 생성 | 08 |
| React 컴포넌트 | 12 (+ 10 참조) |
| API 연동 | 14 (+ 13 참조) |
| 디자인/UI | 17 |
| 테스트 | 15 (Backend) / 16 (Frontend) |
| Docker | 18 |
| DB 설계 | 19 |
| AWS 배포 | 20 |
| 보안 | 21 |
| 성능 최적화 | 22 |
| 외부 API | 23 |
| Ignore 설정 | 25 (+ 02, 18 참조) |

---

## Backend (00-09)

| # | 문서 | 설명 | 필수 |
|---|------|------|:----:|
| 00 | [CONVENTIONS-CORE](./00-CONVENTIONS-CORE.md) | 공통 핵심 규칙 | ⭐ |
| 01 | [PROJECT-STRUCTURE](./01-PROJECT-STRUCTURE.md) | 프로젝트 구조 | |
| 02 | [GIT-CONVENTIONS](./02-GIT-CONVENTIONS.md) | Git 브랜치, 커밋 | |
| 03 | [CONTROLLER](./03-CONTROLLER-CONVENTIONS.md) | HTTP, REST API | |
| 04 | [SERVICE](./04-SERVICE-CONVENTIONS.md) | 비즈니스 로직, 트랜잭션 | |
| 05 | [REPOSITORY](./05-REPOSITORY-CONVENTIONS.md) | 데이터 접근, N+1 해결 | |
| 06 | [ENTITY](./06-ENTITY-CONVENTIONS.md) | 도메인 모델, Setter 금지 | |
| 07 | [DTO](./07-DTO-CONVENTIONS.md) | Request/Response, Record | |
| 08 | [EXCEPTION](./08-EXCEPTION-CONVENTIONS.md) | 예외 처리, ErrorCode | |
| 09 | [GIT-SUBMODULE](./09-GIT-SUBMODULE-CONVENTIONS.md) | 민감 정보 관리 | |

---

## Frontend (10-16)

| # | 문서 | 설명 | 필수 |
|---|------|------|:----:|
| 10 | [REACT-TYPESCRIPT-CORE](./10-REACT-TYPESCRIPT-CORE.md) | React+TS 핵심 규칙 | ⭐ |
| 11 | [REACT-PROJECT-STRUCTURE](./11-REACT-PROJECT-STRUCTURE.md) | 폴더 구조 | |
| 12 | [REACT-COMPONENT](./12-REACT-COMPONENT-CONVENTIONS.md) | 컴포넌트 작성 | |
| 13 | [REACT-STATE-MANAGEMENT](./13-REACT-STATE-MANAGEMENT.md) | 상태 관리 | |
| 14 | [REACT-API-INTEGRATION](./14-REACT-API-INTEGRATION.md) | API 통신, Axios | |
| 15 | [BACKEND-TEST](./15-BACKEND-TEST-CONVENTIONS.md) | JUnit5, MockMvc | |
| 16 | [FRONTEND-TEST](./16-FRONTEND-TEST-CONVENTIONS.md) | Vitest, RTL | |

---

## Infrastructure (17-20)

| # | 문서 | 설명 |
|---|------|------|
| 17-18 | [DESIGN](./design/) | TailwindCSS, 디자인 시스템, 디자인 토큰 |
| 18 | [DOCKER](./18-DOCKER-CONVENTIONS.md) | Docker, docker-compose |
| 19 | [DATABASE](./19-DATABASE-CONVENTIONS.md) | MySQL, 스키마 설계 |
| 20 | [AWS](./20-AWS-CONVENTIONS.md) | ECS, RDS, S3, CI/CD |

---

## 품질 (21-23)

| # | 문서 | 설명 |
|---|------|------|
| 21 | [SECURITY](./21-SECURITY-CONVENTIONS.md) | 인증, 보안, 취약점 방지 |
| 22 | [PERFORMANCE](./22-PERFORMANCE-CONVENTIONS.md) | N+1, 캐싱, 최적화 |
| 23 | [EXTERNAL-API](./23-EXTERNAL-API-CONVENTIONS.md) | 외부 연동, 재시도, 타임아웃 |

---

## 기타 (24-25)

| # | 문서 | 설명 |
|---|------|------|
| 24 | [MULTI-TENANCY](./24-MULTI-TENANCY-CONVENTIONS.md) | 멀티테넌트 아키텍처 |
| 25 | [IGNORE](./25-IGNORE-CONVENTIONS.md) | .gitignore, .dockerignore 설정 |

---

## 문서 통계

```
총 문서 수: 26개 (컨벤션)
- Backend: 10개 (00-09)
- Frontend: 7개 (10-16)
- Infrastructure: 4개 (17-20)
- 품질: 3개 (21-23)
- 기타: 2개 (24-25)
```

---

## 관련 문서

### 루트
- [CLAUDE.md](../CLAUDE.md) - AI 작업 가이드 (핵심)
- [MONOREPO.md](../MONOREPO.md) - 모노레포 설정
- [POLY-REPO.md](../POLY-REPO.md) - 폴리레포 가이드

### 컨텍스트 (context/)
- [architecture.md](../context/architecture.md) - 시스템 아키텍처
- [module-structure.md](../context/module-structure.md) - 모듈 구조
- [multi-tenancy.md](../context/multi-tenancy.md) - 멀티테넌시 설계
- [user-roles.md](../context/user-roles.md) - 사용자 역할 체계
- [backend-setup.md](../context/backend-setup.md) - Backend 설정
- [frontend-setup.md](../context/frontend-setup.md) - Frontend 설정

### 구조 (structure/) - API/DB 스펙
- [backend/course/](../structure/backend/course/) - 강의 API, DB
- [backend/content/](../structure/backend/content/) - 컨텐츠 API, DB
- [backend/learning/](../structure/backend/learning/) - 학습객체 API, DB
- [backend/common/](../structure/backend/common/) - 공통 컴포넌트
- [frontend/api.md](../structure/frontend/api.md) - API 클라이언트
- [frontend/pages.md](../structure/frontend/pages.md) - 페이지 구성

### 템플릿 (templates/)
- [task-workflow.md](../templates/task-workflow.md) - AI 작업 규칙
- [prd.md](../templates/prd.md) - 기능 기획
- [project-specification.md](../templates/project-specification.md) - 프로젝트 기획서 템플릿
- [pr-guide.md](../templates/pr-guide.md) - PR 문서 최신화 가이드
- [feature-docs-guide.md](../templates/feature-docs-guide.md) - guide.md/notes.md 작성 규칙
- [code-review-checklist.md](../templates/code-review-checklist.md) - 코드 리뷰

---

> **원칙**: 필요한 문서만 선택적으로 읽기. 모든 문서를 한 번에 읽지 않기.

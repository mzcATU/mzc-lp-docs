# mzc-lp - AI 작업 가이드

> **핵심 원칙**: 이 문서만으로 대부분의 작업 시작 가능. 부족하면 부록 참조.
> **필수 작업 규칙**: 모든 작업은 **반드시 계획 먼저 제시** → 승인 → 순차 진행 → 완료 보고

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **Backend** | Spring Boot 3.4.12, Java 21 |
| **Frontend** | React 19.x, TypeScript 5.x, Vite 7.x, TailwindCSS |
| **Database** | MySQL 8.0 |
| **Infra** | AWS (ECS, RDS, S3, CloudFront), Docker |
| **인증** | JWT (Access + Refresh Token) |

### 저장소 구조

> 폴리레포 (3개 저장소) → [POLY-REPO.md](./POLY-REPO.md)

---

## 핵심 규칙 (Must-Know)

### Backend
```
✅ Entity: Setter 금지 → 비즈니스 메서드 사용
✅ Service: @Transactional(readOnly=true) 클래스 레벨
✅ Controller: try-catch 금지 → GlobalExceptionHandler
✅ DTO: Java Record + from() 정적 팩토리
✅ Enum: @Enumerated(EnumType.STRING)
```

### Frontend
```
✅ any 타입 금지 → 명시적 타입 정의
✅ 서버 상태: React Query (useState는 UI 상태만)
✅ API: Axios Instance + handleApiError
✅ 컴포넌트: Props Destructuring + Early Return
```

---

## 컨벤션 로딩 (작업별 선택)

| 작업 | 필수 컨벤션 |
|------|------------|
| 프로젝트 구조 | `01-PROJECT-STRUCTURE` |
| Git | `02-GIT-CONVENTIONS` |
| Controller | `03-CONTROLLER-CONVENTIONS` |
| Service | `04-SERVICE-CONVENTIONS` |
| Repository | `05-REPOSITORY-CONVENTIONS` |
| Entity | `06-ENTITY-CONVENTIONS` |
| DTO | `07-DTO-CONVENTIONS` |
| Exception | `08-EXCEPTION-CONVENTIONS` |
| React Core | `10-REACT-TYPESCRIPT-CORE` |
| React 구조 | `11-REACT-PROJECT-STRUCTURE` |
| Component | `12-REACT-COMPONENT-CONVENTIONS` |
| State 관리 | `13-REACT-STATE-MANAGEMENT` |
| API Service | `14-REACT-API-INTEGRATION` |
| Backend Test | `15-BACKEND-TEST-CONVENTIONS` |
| Frontend Test | `16-FRONTEND-TEST-CONVENTIONS` |
| Design/UI | `17-DESIGN-CONVENTIONS` |
| Docker | `18-DOCKER-CONVENTIONS` |
| Database | `19-DATABASE-CONVENTIONS` |
| AWS 배포 | `20-AWS-CONVENTIONS` |
| 보안 | `21-SECURITY-CONVENTIONS` |
| 성능 | `22-PERFORMANCE-CONVENTIONS` |
| 외부 API | `23-EXTERNAL-API-CONVENTIONS` |
| 멀티테넌시 | `24-MULTI-TENANCY` |

> 컨벤션 위치: `docs/conventions/`

---

## 작업 순서

**Backend CRUD**: Entity → Repository → DTO → Exception → Service → Controller → Test

**Frontend 페이지**: Types → API Service → React Query Hook → Component → Test

---

## 프로젝트 구조

```
backend/.../domain/
├── user/           # controller, service, repository, entity, dto, exception
├── course/
└── enrollment/
global/             # config, exception, common

frontend/src/
├── pages/          # 페이지 컴포넌트
├── components/     # 재사용 컴포넌트 (common, layout)
├── services/       # API 호출
├── hooks/          # Custom Hooks (React Query 래핑)
├── stores/         # 전역 상태 (필요시)
├── types/          # TypeScript 타입
└── utils/          # 유틸리티 함수
```

---

## 자주 하는 실수

| 실수 | 해결 |
|------|------|
| Entity Setter | `updateXxx()` 메서드 |
| Controller try-catch | GlobalExceptionHandler |
| DTO toEntity() | Entity.create() |
| useState 서버상태 | React Query |
| N+1 쿼리 | Fetch Join |

---

## Git

**Commit**: `[Feat] 로그인 API 구현 (#123)` / `[Fix] 토큰 검증 오류 (#456)`

**Branch**: main → dev → feat/* / fix/*

---

## AI 작업 규칙 (필수)

```
⚠️ 코드 작성 전 반드시 계획부터 제시할 것!
```

1. **계획 제시** → 작업 목록 테이블로 보여주기
2. **승인 대기** → 사용자 확인 후 진행
3. **순차 작업** → TodoWrite로 추적하며 진행
4. **완료 보고** → 결과 요약 제시

> 단순 질문/조회는 예외. 코드 생성/수정 작업은 무조건 계획 먼저.

---

## 워크플로우

**7단계**: 요구사항 → UX → 의존성 → 계획 → 리스크 → 구현 → 테스트

**MoSCoW 우선순위**:
- 🔴 Must - 필수 (릴리스 필수)
- 🟡 Should - 권장 (중요하나 필수 아님)
- 🟢 Could - 선택 (시간 허락시)
- ⚪ Won't - 제외 (이번 버전 제외)

---

## 시스템 컨텍스트 (아키텍처 이해)

| 궁금한 것 | 참조 문서 |
|----------|----------|
| 전체 구조, 사이트별 차이 | [context/architecture.md](./context/architecture.md) |
| 모듈 관계, 단방향 통신 | [context/module-structure.md](./context/module-structure.md) |
| 테넌트 분리, Row-Level Security | [context/multi-tenancy.md](./context/multi-tenancy.md) |
| 역할 정의, 부여 플로우 | [context/user-roles.md](./context/user-roles.md) |
| 권한 검증, RBAC 매트릭스 | [context/authorization-model.md](./context/authorization-model.md) |
| 진도/성적/수료 (LMS) | [context/lms-architecture.md](./context/lms-architecture.md) |
| Race Condition, 트랜잭션 | [context/transaction-boundaries.md](./context/transaction-boundaries.md) |

---

## 참조 문서

| 분류 | 문서 |
|------|------|
| **환경** | [POLY-REPO](./POLY-REPO.md) |
| **컨텍스트** | [context/](./context/) |
| **컨벤션** | [conventions/](./conventions/) |
| **템플릿** | [templates/](./templates/) |

---

**웬만한 작업은 이 문서만으로 시작 가능. 부족하면 위 참조 문서에서 찾으세요.**

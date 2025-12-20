# Repository 분리 전략

> 코드는 Polyrepo, 문서는 중앙 집중형으로 운영하는 이유

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 섹션/문서 |
|----------|---------------|
| 왜 코드/문서 저장소를 분리? | 섹션 2, 3 |
| Polyrepo vs Monorepo 이유? | 섹션 2. 왜 코드는 Polyrepo인가? |
| 문서 중앙 집중 이유? | 섹션 3. 왜 문서는 중앙 집중형인가? |
| API 변경 시 워크플로우? | 섹션 4.1 API 변경 시 |
| 새 기능 개발 워크플로우? | 섹션 4.2 새 기능 개발 시 |
| 문서 저장소 구조? | 섹션 5. 문서 저장소 구조 |
| 백엔드 설정 상세? | [backend-setup.md](./backend-setup.md) |
| 프론트엔드 설정 상세? | [frontend-setup.md](./frontend-setup.md) |

---

## 1. 전체 구조

```
mzc-lp (프로젝트 루트)
├── mzc-lp-frontend/     # Frontend Repository
│   └── (React, TypeScript 코드)
│
├── mzc-lp-backend/      # Backend Repository
│   └── (Spring Boot, Java 코드)
│
└── mzc-lp-docs/         # Documentation Repository (이 저장소)
    └── (모든 프로젝트 문서)
```

---

## 2. 왜 코드는 Polyrepo인가?

### 2.1 독립적 배포 사이클

```
Frontend: 빠른 UI 변경, 즉시 배포
Backend:  DB 마이그레이션 포함, 신중한 배포
```

배포 주기가 다르므로 분리하여 각 팀이 독립적으로 릴리즈할 수 있다.

### 2.2 기술 스택 분리

| Repository | 기술 스택 | 빌드 도구 |
|------------|----------|----------|
| Frontend | React, TypeScript, Vite | npm/pnpm |
| Backend | Spring Boot, Java 21 | Gradle |

빌드 환경과 CI/CD 파이프라인이 완전히 다르다.

### 2.3 팀 책임 분리

- Frontend 팀: UI/UX, 사용자 인터랙션
- Backend 팀: API, 비즈니스 로직, 데이터

---

## 3. 왜 문서는 중앙 집중형인가?

### 3.1 문제: 분산된 문서의 위험

```
❌ 만약 문서가 각 레포에 분산되어 있다면:

mzc-lp-backend/docs/
  └── api-spec.md       # Backend 팀이 수정

mzc-lp-frontend/docs/
  └── api-usage.md      # Frontend 팀이 참조

→ Backend에서 API 변경 시 Frontend가 놓칠 수 있음
→ 통합 작업 시 "요구사항 누락" 발생
```

### 3.2 해결: Single Source of Truth

```
✅ 문서를 한 곳에 모아두면:

mzc-lp-docs/
  ├── structure/backend/   # API 스펙
  ├── structure/frontend/  # 컴포넌트 스펙
  └── context/             # 공통 컨텍스트

→ API 변경 → 같은 저장소에서 프론트 스펙도 확인 가능
→ PR 리뷰 시 양쪽 영향 즉시 파악
```

### 3.3 핵심 이점

| 이점 | 설명 |
|------|------|
| **교차 가시성** | API 변경이 프론트 문서와 같은 PR에서 검토됨 |
| **요구사항 추적** | 기획 → 백엔드 → 프론트 흐름이 한 곳에서 보임 |
| **통합 계약서** | API 스펙이 양 팀의 공식 계약서 역할 |
| **리뷰 효율** | 변경 영향도를 한 번에 파악 |

---

## 4. 실제 워크플로우

### 4.1 API 변경 시

```
1. Backend 팀: mzc-lp-backend에서 코드 구현
       │
       ▼
2. Backend 팀: mzc-lp-docs에서 API 스펙 문서 업데이트
       │
       ▼
3. Frontend 팀: 같은 docs 저장소에서 변경 확인
       │
       ▼
4. Frontend 팀: mzc-lp-frontend에서 코드 구현
```

### 4.2 새 기능 개발 시

```
1. 기획/요구사항 정의 (mzc-lp-docs/context/)
       │
       ▼
2. API 설계 (mzc-lp-docs/structure/backend/)
       │
       ▼
3. 컴포넌트 설계 (mzc-lp-docs/structure/frontend/)
       │
       ▼
4. 양 팀 동시 구현 (각 코드 저장소)
```

---

## 5. 문서 저장소 구조

```
mzc-lp-docs/
├── CLAUDE.md              # AI 협업 가이드
├── docs/
│   ├── context/           # 시스템 컨텍스트 (이 파일이 여기 있음)
│   │   ├── architecture.md
│   │   ├── multi-tenancy.md
│   │   ├── user-roles.md
│   │   └── ...
│   │
│   ├── structure/         # 기술 스펙
│   │   ├── backend/       # API, DB 스키마
│   │   └── frontend/      # 컴포넌트, 타입 정의
│   │
│   ├── conventions/       # 코딩 컨벤션
│   │
│   └── dev-logs/          # 개발 진행 로그
```

---

## 6. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [module-structure.md](./module-structure.md) | 모듈별 구조 |
| [01-PROJECT-STRUCTURE.md](../conventions/01-PROJECT-STRUCTURE.md) | 코드 디렉토리 구조 |

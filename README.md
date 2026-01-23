# MZC Learning Platform

> 기업용 멀티테넌트 학습 관리 시스템 (LMS)

---

## 1. 프로젝트 개요

MZC Learning Platform은 기업 교육을 위한 **멀티테넌트 LMS**입니다.

### 주요 특징

| 특징 | 설명 |
|------|------|
| **멀티테넌트** | Row-Level Security 기반 테넌트 데이터 격리 |
| **6-tier 역할 시스템** | SYSTEM_ADMIN → TENANT_ADMIN → OPERATOR → DESIGNER → INSTRUCTOR → USER |
| **JWT 인증** | Access Token (1h) + Refresh Token (7d) |
| **강의 생명주기** | Course(템플릿) → Snapshot(불변본) → CourseTime(차수) → Enrollment(수강) |

### 참고 아키텍처

https://github.com/shsh99/lms-architecture

### 시스템 구성

```
┌─────────────────────────────────────────────────┐
│            사용자 (브라우저)                      │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────────────┐
│         React 19 Frontend (Vite)                │
│  - Zustand (클라이언트 상태)                     │
│  - React Query (서버 상태)                       │
│  - TailwindCSS + Radix UI                       │
└────────────────┬────────────────────────────────┘
                 │ REST API (JWT)
                 ▼
┌─────────────────────────────────────────────────┐
│       Spring Boot 3.4 Backend (Java 21)         │
│  - Spring Security + JWT                        │
│  - Spring Data JPA + Hibernate                  │
│  - TenantContext (ThreadLocal)                  │
└────────────────┬────────────────────────────────┘
                 │ JDBC
                 ▼
┌─────────────────────────────────────────────────┐
│            MySQL 8.0 Database                   │
│  - Row-Level 테넌트 격리 (tenant_id)             │
│  - 29개 테이블, Flyway 마이그레이션              │
└─────────────────────────────────────────────────┘
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
| **Styling** | TailwindCSS | 3.4 |
| **UI Components** | Radix UI | - |
| **Database** | MySQL | 8.0 |
| **State (Client)** | Zustand | - |
| **State (Server)** | React Query | 5.x |
| **Routing** | react-router-dom | 7.x |
| **HTTP Client** | Axios | - |
| **Infra** | AWS (EC2, RDS, S3, CloudFront) | - |
| **CI/CD** | GitHub Actions | - |

---

## 3. 백엔드 모듈 구조

> 자세한 내용은 [module-structure.md](./docs/module-structure.md) 참조

### 핵심 도메인 모듈

| 분류 | 모듈 | 설명 |
|------|------|------|
| **사용자/인증** | user | 사용자, 인증, JWT, 역할 관리 |
| **테넌트** | tenant | 테넌트, 테넌트 설정 |
| **강의 관리** | course | 강의 템플릿 |
| | content | 콘텐츠 (파일, 동영상) |
| | learning | 학습 객체 (LO) |
| | snapshot | 강의 불변 사본 |
| | ts | 차수(CourseTime) 관리 |
| **수강 관리** | enrollment | 수강 신청, 수강 관리 |
| | iis | 강사 배정 |
| | student | 학생 그룹 |
| **평가** | assignment | 과제 |
| | certificate | 수료증 |
| **커뮤니티** | community | 게시판, Q&A |
| **알림** | notification | 알림 |
| | notice | 공지사항 |
| **기타** | cart, wishlist | 장바구니, 위시리스트 |
| | category, department | 카테고리, 부서 |
| | analytics, dashboard | 분석, 대시보드 |

### 강의 생명주기

```
[Course]              [Snapshot]           [CourseTime]         [Enrollment]
강의 템플릿      →     불변 사본 생성    →    차수 개설       →    수강 신청
(DESIGNER)           (승인 시)            (OPERATOR)           (USER)
    │                     │                    │                    │
    │   APPROVED          │                    │                    │
    └────────────────────►│                    │                    │
                          │   차수 생성         │                    │
                          └───────────────────►│                    │
                                               │   수강 신청         │
                                               └───────────────────►│
                                                                    │
                                                              학습 진행
```

---

## 4. 저장소 구조 (서브모듈)

```
mzc-lp/                     # 메인 저장소
├── mzc-lp-backend/         # Backend 서브모듈
│   ├── src/main/java/com/mzc/lp/
│   │   ├── domain/         # 도메인 모듈 (user, course, enrollment 등)
│   │   ├── global/         # 공통 모듈 (config, exception, security)
│   │   └── LpApplication.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/   # Flyway 마이그레이션
│   └── build.gradle
│
├── mzc-lp-frontend/        # Frontend 서브모듈
│   ├── src/
│   │   ├── components/     # 공통 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   ├── stores/         # Zustand 스토어
│   │   └── types/          # TypeScript 타입
│   └── vite.config.ts
│
└── mzc-lp-docs/            # 문서 서브모듈 (이 저장소)
    ├── docs/               # 핵심 기술 문서 (13개)
    ├── user-flows/         # 역할별 사용자 플로우 (6개)
    ├── use-cases/          # 유스케이스 명세
    └── storyboards/        # 화면 설계 및 UI 가이드
```

### 서브모듈 초기화

```bash
git submodule update --init --recursive
```

---

## 5. 브랜치 전략

### 브랜치 구조

```
main (프로덕션 배포)
  └── dev (개발 통합)
        ├── feat/이슈번호-기능명
        ├── fix/이슈번호-버그명
        └── refactor/이슈번호-개선명
```

### 브랜치 규칙

| 브랜치 | 역할 | 규칙 |
|--------|------|------|
| `main` | 프로덕션 배포 | PR만 허용, 직접 Push 금지 |
| `dev` | 개발 통합 | PR만 허용, 직접 Push 금지 |
| `feat/*` | 기능 개발 | dev → PR → Squash Merge |
| `fix/*` | 버그 수정 | dev → PR → Squash Merge |
| `hotfix/*` | 긴급 수정 | main → PR → 양쪽 병합 |

### 커밋 메시지 규칙

```
[태그] 제목 (#이슈번호)

- 변경사항 1
- 변경사항 2
```

| 태그 | 용도 | 예시 |
|------|------|------|
| `Feat` | 기능 추가 | `[Feat] 로그인 API 구현 (#123)` |
| `Fix` | 버그 수정 | `[Fix] 토큰 검증 오류 (#456)` |
| `Refactor` | 리팩토링 | `[Refactor] 서비스 분리 (#789)` |
| `Docs` | 문서 | `[Docs] API 명세 작성` |
| `Test` | 테스트 | `[Test] 로그인 테스트 추가` |
| `Chore` | 설정/빌드 | `[Chore] 의존성 업데이트` |

### 개발 워크플로우

```bash
# 1. 브랜치 생성
git checkout dev && git pull origin dev
git checkout -b feat/123-user-login

# 2. 개발 & 커밋
git add .
git commit -m "[Feat] 로그인 구현 (#123)"

# 3. Push & PR
git push origin feat/123-user-login
# GitHub에서 PR 생성 (Squash and merge)

# 4. 정리
git checkout dev && git pull origin dev
git branch -d feat/123-user-login
```

> 자세한 내용은 [development-workflow.md](./docs/development-workflow.md) 참조

---

## 6. 개발 서버 실행

> 자세한 설정은 [setup-guide.md](./docs/setup-guide.md) 참조

### 사전 요구사항

| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| Java | 21+ | Backend |
| Node.js | 20+ | Frontend |
| MySQL | 8.0+ | Database |
| Git | 최신 | 버전 관리 |

### 실행 명령

```bash
# 1. 데이터베이스 생성
mysql -u root -p -e "CREATE DATABASE mzclp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Backend 실행 (Port 8080)
cd mzc-lp-backend
./gradlew bootRun --args='--spring.profiles.active=local'

# 3. Frontend 실행 (Port 5173)
cd mzc-lp-frontend
npm install
npm run dev
```

### 접속 URL

| 항목 | URL |
|------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080/api/* |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |

### 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| SYSTEM_ADMIN | admin@system.com | admin123! |
| TENANT_ADMIN | admin@tenant.com | admin123! |
| USER | user@test.com | user123! |

---

## 7. 핵심 코딩 규칙

### Backend 규칙

```java
// ✅ Entity: Setter 금지 → 비즈니스 메서드 사용
public void updateName(String name) {
    this.name = name;
}

// ✅ Service: 클래스 레벨 readOnly, 쓰기는 메서드 레벨
@Transactional(readOnly = true)
public class UserService {
    @Transactional
    public User create(...) { }
}

// ✅ Controller: try-catch 금지 → GlobalExceptionHandler
// ✅ DTO: Java Record + from() 정적 팩토리
public record UserResponse(Long id, String name) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName());
    }
}

// ✅ Enum: 문자열로 저장
@Enumerated(EnumType.STRING)
private UserStatus status;
```

### Frontend 규칙

```typescript
// ✅ any 타입 금지 → 명시적 타입 정의
interface User {
  id: number;
  name: string;
}

// ✅ 서버 상태: React Query
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// ✅ 클라이언트 상태: Zustand (UI 상태만)
const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// ✅ 컴포넌트: Props Destructuring + Early Return
function UserCard({ user, onSelect }: UserCardProps) {
  if (!user) return null;
  return <div onClick={() => onSelect(user)}>{user.name}</div>;
}
```

### 작업 순서

| 작업 유형 | 순서 |
|----------|------|
| **Backend CRUD** | Entity → Repository → DTO → Exception → Service → Controller → Test |
| **Frontend 페이지** | Types → API Service → React Query Hook → Component → Test |

---

## 8. 구현 현황

> 자세한 내용은 [implementation-status.md](./docs/implementation-status.md) 참조

| 영역 | 완료율 | 상태 |
|------|--------|------|
| **인증/권한** | 100% | ✅ 완료 |
| **사용자 관리** | 90% | ✅ 안정 |
| **강의 관리** | 95% | ✅ 안정 |
| **수강 신청** | 100% | ✅ 완료 |
| **학습 진도** | 80% | ⚠️ 개발 중 |
| **평가 시스템** | 70% | ⚠️ 개발 중 |
| **알림 시스템** | 60% | ⚠️ 개발 중 |
| **분석/리포팅** | 50% | ⚠️ 개발 중 |

### 주요 완료 기능

- ✅ JWT 인증 (로그인, 토큰 갱신, 역할 전환)
- ✅ 멀티테넌트 Row-Level Security
- ✅ 사용자 CRUD + 대량 업로드
- ✅ 강의 CRUD + 승인 워크플로우
- ✅ 차수 관리 + 정원 관리 (동시성 제어)
- ✅ 수강 신청 + 대기자 명단
- ✅ CI/CD 파이프라인 (GitHub Actions)

---

## 9. 문서 가이드

> **[전체 문서 인벤토리](./DOCUMENTATION_INVENTORY.md)** - 31개 문서 목록 및 상태

### 핵심 기술 문서

| 문서 | 설명 |
|------|------|
| [architecture.md](./docs/architecture.md) | 시스템 아키텍처, 멀티테넌트, 인증 |
| [module-structure.md](./docs/module-structure.md) | 백엔드/프론트엔드 모듈 상세 |
| [api-specification.md](./docs/api-specification.md) | REST API 전체 명세 (10개 도메인) |
| [database-schema.md](./docs/database-schema.md) | DB 스키마 (29개 테이블 DDL) |
| [page-routing.md](./docs/page-routing.md) | 프론트엔드 페이지 URL 라우팅 |
| [business-logic.md](./docs/context/business-logic.md) | 도메인별 비즈니스 로직, 상태 전이 |

### 개발/운영 문서

| 문서 | 설명 |
|------|------|
| [setup-guide.md](./docs/setup-guide.md) | 개발 환경 설정 가이드 |
| [development-workflow.md](./docs/development-workflow.md) | Git 브랜치/PR/코드리뷰 |
| [deployment-guide.md](./docs/deployment-guide.md) | 배포 절차 및 롤백 |
| [configuration-guide.md](./docs/configuration-guide.md) | 환경별 설정 관리 |
| [troubleshooting.md](./docs/troubleshooting.md) | 문제 해결 가이드 |
| [testing-guide.md](./docs/testing-guide.md) | Unit/Integration/E2E 테스트 |
| [cicd.md](./docs/context/cicd.md) | GitHub Actions CI/CD 파이프라인 |

### 사용자 플로우 (5/6 역할 완료)

| 문서 | 역할 | 설명 |
|------|------|------|
| [learner-flow.md](./user-flows/learner-flow.md) | USER | 강의 탐색 → 수강 → 학습 → 수료 |
| [designer-flow.md](./user-flows/designer-flow.md) | DESIGNER | 강의 생성 → 커리큘럼 → 승인 요청 |
| [instructor-flow.md](./user-flows/instructor-flow.md) | INSTRUCTOR | 출석 → 과제 채점 → 성적 관리 |
| [operator-flow.md](./user-flows/operator-flow.md) | OPERATOR | 차수 개설 → 수강생 관리 → CS |
| [admin-flow.md](./user-flows/admin-flow.md) | TENANT_ADMIN | 사용자 → 부서 → 강의 승인 → 설정 |

### 화면 설계

| 문서 | 설명 |
|------|------|
| [SB-302-ui-components.md](./storyboards/SB-302-ui-components.md) | UI 컴포넌트 가이드, 디자인 시스템 |
| [SB-002-course-enrollment.md](./storyboards/SB-002-course-enrollment.md) | 수강 신청 화면 플로우 |
| [SB-003-learning-flow.md](./storyboards/SB-003-learning-flow.md) | 학습 진행 화면 플로우 |
| [SB-101-course-creation.md](./storyboards/SB-101-course-creation.md) | 강의 생성/편집 화면 플로우 |

---

## 10. 환경별 배포

| 환경 | Backend | Frontend | Database |
|------|---------|----------|----------|
| **Local** | Port 8080 | Port 5173 | MySQL 8.0 |
| **Dev** | EC2 (Private) | S3 + CloudFront | RDS db.t3.micro |
| **Prod** | EC2 (Multi-AZ) | S3 + CloudFront | RDS Multi-AZ |

### CI/CD 파이프라인

```
[Push to dev]
     │
     ▼
[CI] Build → Test → Lint
     │
     ▼ (Success)
[CD] Deploy to Dev Server
     │
     ▼
[Tag v1.x.x]
     │
     ▼
[CD] Deploy to Production
```

> 자세한 내용은 [deployment-guide.md](./docs/deployment-guide.md), [cicd.md](./docs/context/cicd.md) 참조

---

## 11. 문의

| 영역 | 담당 |
|------|------|
| Backend | Backend 팀 |
| Frontend | Frontend 팀 |
| DevOps/Infra | DevOps 팀 |

> 인프라 민감 정보는 별도 문서로 관리됩니다. 담당자에게 문의하세요.

---

**최종 업데이트**: 2026-01-23
**문서 버전**: 2.0.0

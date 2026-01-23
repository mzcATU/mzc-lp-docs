# MZC Learning Platform 아키텍처

## 목차
1. [시스템 개요](#시스템-개요)
2. [멀티테넌트 아키텍처](#멀티테넌트-아키텍처)
3. [인증/권한 체계](#인증권한-체계)
4. [백엔드 아키텍처](#백엔드-아키텍처)
5. [프론트엔드 아키텍처](#프론트엔드-아키텍처)
6. [데이터 흐름](#데이터-흐름)
7. [기술 스택](#기술-스택)

---

## 시스템 개요

**MZC Learning Platform**은 멀티테넌트 학습 관리 시스템(LMS)으로, 하나의 플랫폼에서 여러 기업(테넌트)이 독립적으로 교육 서비스를 운영할 수 있습니다.

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
│  - Spring Data JPA                              │
│  - TenantContext (ThreadLocal)                  │
└────────────────┬────────────────────────────────┘
                 │ JDBC
                 ▼
┌─────────────────────────────────────────────────┐
│            MySQL 8.0 Database                   │
│  - Row-Level 테넌트 격리 (tenant_id)             │
│  - Hibernate @Filter 자동 적용                   │
└─────────────────────────────────────────────────┘
```

---

## 멀티테넌트 아키텍처

### Row-Level Security 패턴

모든 테넌트 데이터가 `tenant_id` 컬럼으로 격리됩니다.

```
┌──────────────────────────────────────────┐
│  요청 (JWT Authorization Header)         │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  TenantFilter                            │
│  - JWT에서 tenantId 추출                 │
│  - TenantContext.setTenantId(tenantId)   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  TenantContext (ThreadLocal)             │
│  - 현재 스레드에 tenantId 저장            │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  Hibernate @Filter 자동 적용              │
│  - 모든 쿼리에 WHERE tenant_id = ?       │
└──────────────────────────────────────────┘
```

### 핵심 컴포넌트

#### 1. TenantEntity (부모 클래스)
```java
@FilterDef(name = "tenantFilter",
          parameters = @ParamDef(name = "tenantId", type = Long.class),
          defaultCondition = "tenant_id = :tenantId")
@Filter(name = "tenantFilter")
public abstract class TenantEntity extends BaseTimeEntity {
    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;

    @PrePersist
    protected void prePersistTenant() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getCurrentTenantId();
        }
    }
}
```

#### 2. TenantContext (ThreadLocal)
```java
public class TenantContext {
    private static final ThreadLocal<Long> tenantId = new ThreadLocal<>();

    public static void setTenantId(Long id) {
        tenantId.set(id);
    }

    public static Long getCurrentTenantId() {
        // 1. ThreadLocal 조회
        // 2. SecurityContext 조회 (테스트용)
        // 3. 기본값 1L (테스트 환경)
    }

    public static void clear() {
        tenantId.remove();  // 메모리 릭 방지
    }
}
```

#### 3. TenantFilter (HTTP 필터)
```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(...) {
        try {
            Long tenantId = extractTenantId(request);
            if (tenantId != null) {
                TenantContext.setTenantId(tenantId);
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private Long extractTenantId(HttpServletRequest request) {
        // 1. JWT Authorization 헤더
        // 2. X-Subdomain 헤더
        // 3. /api/auth/* → null (전체 조회 필요)
        // 4. 기타 → defaultTenantId(1)
    }
}
```

---

## 인증/권한 체계

### JWT 기반 인증

```
┌─────────────┐
│   로그인    │
│ (이메일+PW) │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│  AuthService.login()             │
│  - 이메일/비밀번호 검증            │
│  - JWT 토큰 생성                  │
│  - RefreshToken DB 저장           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  TokenResponse                   │
│  - accessToken (1시간)            │
│  - refreshToken (7일)             │
│  - user { id, email, role, roles }│
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│  Frontend: localStorage 저장      │
│  - 모든 API 요청에 토큰 첨부       │
└──────────────────────────────────┘
```

### AccessToken Claims
```json
{
  "sub": "userId",
  "email": "user@example.com",
  "role": "TENANT_ADMIN",
  "roles": ["TENANT_ADMIN", "OPERATOR", "DESIGNER"],
  "currentRole": "TENANT_ADMIN",
  "tenantId": 1,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 역할 체계 (6단계)

| 역할 | 코드 | 권한 |
|------|------|------|
| **시스템 관리자** | SYSTEM_ADMIN | 플랫폼 전체 관리, 테넌트 생성/삭제 |
| **테넌트 관리자** | TENANT_ADMIN | 테넌트 설정, 사용자 역할 부여 |
| **운영자** | OPERATOR | 강의 검토, 차수 생성, 수강 관리 |
| **설계자** | DESIGNER | 강의 개설 신청, 콘텐츠 제작 |
| **강사** | INSTRUCTOR | 배정된 차수 강의 진행 |
| **학습자** | USER | 수강, 학습 |

### 다중 역할 지원

```
User (1) ←→ (N) UserRole
         └── TENANT_ADMIN
         └── OPERATOR
         └── DESIGNER
```

**역할 전환 흐름:**
```
UI: GlobalRoleSwitcher 클릭
    ↓
POST /api/auth/switch-role
    ↓
새 역할로 JWT 재발급
    ↓
Frontend: authStore 업데이트
    ↓
자동 리다이렉트 (/sa, /ta, /co, /tu)
```

---

## 백엔드 아키텍처

### 계층 구조

```
┌─────────────────────────────────────┐
│  @RestController                    │
│  - DTO 검증 (@Valid)                │
│  - HTTP 상태 코드                    │
│  - ApiResponse<T> 래핑              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  @Service                           │
│  - @Transactional(readOnly=true)    │
│  - 비즈니스 로직                     │
│  - 권한 검증                         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  @Repository                        │
│  - Spring Data JPA                  │
│  - 테넌트 격리 쿼리                  │
│  - 낙관적/비관적 락                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Database (MySQL)                   │
└─────────────────────────────────────┘
```

### 표준 응답 형식

```java
{
    "success": true,
    "data": { /* 실제 데이터 */ },
    "error": null
}

// 에러 시
{
    "success": false,
    "data": null,
    "error": {
        "code": "USER_NOT_FOUND",
        "message": "사용자를 찾을 수 없습니다."
    }
}
```

### 예외 처리

```
BusinessException (상위)
├── UserNotFoundException
├── InvalidCredentialsException
├── CourseNotFoundException
├── TenantNotFoundException
├── CapacityExceededException
└── ...

GlobalExceptionHandler
└── @ExceptionHandler(BusinessException.class)
    └── ResponseEntity<ApiResponse<Void>>
```

### 동시성 제어

#### 낙관적 락 (@Version)
```java
@Entity
public class Course extends TenantEntity {
    @Version
    private Long version;  // 동시 수정 감지
}
```

#### 비관적 락 (수강신청)
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT ct FROM CourseTime ct WHERE ct.id = :id")
Optional<CourseTime> findByIdWithLock(@Param("id") Long id);
```

---

## 프론트엔드 아키텍처

### 상태 관리 전략

```
┌─────────────────────────────────────┐
│  클라이언트 상태 (Zustand)           │
│  - 인증 (authStore)                  │
│  - UI 상태 (sidebarStore)            │
│  - 테마                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  서버 상태 (React Query)             │
│  - API 데이터 캐싱                   │
│  - 자동 리프레시                      │
│  - 낙관적 업데이트                    │
└─────────────────────────────────────┘
```

### 라우팅 구조

```
/                       → 랜딩 페이지
/auth/login             → 로그인
/auth/register          → 회원가입

/sa/*                   → System Admin
/ta/*                   → Tenant Admin
/co/*                   → Course Operator
/tu/*                   → Tenant User

/{subdomain}/ta/*       → 테넌트별 TA 페이지
/{subdomain}/co/*       → 테넌트별 CO 페이지
/{subdomain}/tu/*       → 테넌트별 TU 페이지
```

### 컴포넌트 구조

```
components/
├── common/             # 재사용 가능 UI 컴포넌트 (59개)
│   ├── Button, Input, Select
│   ├── Dialog, Drawer, Popover
│   ├── Table, DataTable
│   └── Form, Chart, Timeline
│
├── domain/             # 도메인 특화 컴포넌트
│   ├── admin/
│   ├── co/
│   ├── ta/
│   └── tu/
│
└── layout/             # 레이아웃
    ├── common/         # BaseSidebar, GlobalRoleSwitcher
    ├── sa/             # SystemAdminSidebar
    ├── ta/             # TenantAdminSidebar
    ├── co/             # CourseOperatorSidebar
    └── tu/             # TenantUserSidebar
```

---

## 데이터 흐름

### 로그인 흐름

```
[사용자] 로그인 폼 제출
    ↓
[Frontend] authService.login(email, password)
    ↓
POST /api/auth/login
    ↓
[Backend] UserController.login()
    ├─ UserService.login()
    │   ├─ 이메일/비밀번호 검증
    │   ├─ JWT 토큰 생성
    │   └─ RefreshToken DB 저장
    │
    └─ TokenResponse 반환
    ↓
[Frontend]
    ├─ localStorage에 토큰 저장
    ├─ authStore.setAuth()
    ├─ Axios 인터셉터 설정
    └─ 역할별 페이지로 리다이렉트
```

### 수강신청 흐름

```
[사용자] 수강신청 버튼 클릭
    ↓
[Frontend] enrollmentService.enroll(courseTimeId)
    ↓
POST /api/enrollments
    ↓
[Backend] EnrollmentController.enroll()
    ├─ EnrollmentService.enroll()
    │   ├─ CourseTime 비관적 락 획득
    │   ├─ 정원 체크
    │   ├─ 중복 신청 체크
    │   ├─ Enrollment 생성
    │   ├─ currentEnrollment++
    │   └─ Commit
    │
    └─ EnrollmentResponse 반환
    ↓
[Frontend]
    ├─ React Query 캐시 무효화
    ├─ 수강 목록 자동 리프레시
    └─ 성공 메시지 표시
```

---

## 기술 스택

### 백엔드
| 구분 | 기술 | 버전 |
|------|------|------|
| Language | Java | 21 |
| Framework | Spring Boot | 3.4.12 |
| ORM | Spring Data JPA | Hibernate |
| Database | MySQL | 8.0 |
| Build | Gradle | 8.5 |
| Auth | JWT | JJWT 0.12.6 |
| Documentation | Swagger/OpenAPI | 2.7.0 |
| Testing | JUnit 5, JaCoCo | - |

### 프론트엔드
| 구분 | 기술 | 버전 |
|------|------|------|
| Language | TypeScript | 5.x |
| Framework | React | 19 |
| Build | Vite | 7.x |
| Styling | TailwindCSS | 3.4 |
| UI Components | Radix UI | - |
| State (Client) | Zustand | - |
| State (Server) | React Query | 5.x |
| Routing | react-router-dom | 7 |
| HTTP Client | Axios | - |

---

## 다음 단계

- [모듈 구조 문서](./module-structure.md)
- [API 명세서](./api-specification.md)
- [개발 환경 설정](./setup-guide.md)

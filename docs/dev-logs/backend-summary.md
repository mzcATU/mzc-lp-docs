# Backend 개발 작업 요약

> 2025-12-09 ~ 2025-12-12 작업 내역

---

## PR 히스토리

| PR | 제목 | 브랜치 | 머지일 |
|----|------|--------|--------|
| #38 | 회원 탈퇴 API RefreshToken 삭제 로직 추가 | feat/um-withdraw | 2025-12-12 |
| #37 | GitHub 이슈 마크다운 템플릿 추가 | chore/github-issue-templates | 2025-12-12 |
| #36 | [Feat] TS 모듈 기반 구조 구현 | feat/ts-module-foundation | 2025-12-12 |
| #19 | [Refactor] UserCourseRole 엔티티 멀티테넌시 적용 | refactor/um-tenant-filtering | 2025-12-11 |
| #18 | [Chore] 불필요한 파일 제거 | chore/cleanup-files | 2025-12-11 |
| #17 | [Feat] CourseRole 관리 API (역할 부여/회수) | feat/um-course-role-admin | 2025-12-11 |
| #16 | [Feat] CourseRole API (DESIGNER 역할 요청/조회) | feat/um-course-role | 2025-12-11 |
| #15 | [Feat] User 관리 API (OPERATOR 권한) | feat/um-user-admin | 2025-12-11 |
| #14 | [Feat] User API 확장 (/me 엔드포인트) | feat/um-user-api | 2025-12-11 |
| #5 | [Chore] GitHub 템플릿 추가 | chore/github-templates | 2025-12-11 |
| #4 | [Refactor] AuthController @Validated 추가 | feat/user-convention-fix | 2025-12-10 |
| #3 | [Feat] 로그인/로그아웃 API 및 JWT 인증 | feat/user-login | 2025-12-10 |
| #2 | [Feat] User 도메인 기본 구조 및 회원가입 API | feat/user-register | 2025-12-10 |
| #1 | [Feat] 프로젝트 초기 구조 | feat/init-structure | 2025-12-09 |

---

## 모듈별 구현 현황

### UM (User Master) 모듈

#### Phase 1: User API (/me 엔드포인트)

| Method | Endpoint | 기능 |
|--------|----------|------|
| GET | `/api/users/me` | 내 정보 조회 |
| PUT | `/api/users/me` | 내 정보 수정 |
| PUT | `/api/users/me/password` | 비밀번호 변경 |
| DELETE | `/api/users/me` | 회원 탈퇴 |

#### Phase 2: User 관리 API (OPERATOR/TENANT_ADMIN)

| Method | Endpoint | 권한 | 기능 |
|--------|----------|------|------|
| GET | `/api/users` | OPERATOR, TENANT_ADMIN | 사용자 목록 조회 |
| GET | `/api/users/{userId}` | OPERATOR, TENANT_ADMIN | 사용자 상세 조회 |
| PUT | `/api/users/{userId}/role` | TENANT_ADMIN | 역할 변경 |
| PUT | `/api/users/{userId}/status` | OPERATOR, TENANT_ADMIN | 상태 변경 |

#### Phase 3: CourseRole API

| Method | Endpoint | 권한 | 기능 |
|--------|----------|------|------|
| POST | `/api/users/me/course-roles/designer` | 인증된 사용자 | DESIGNER 역할 요청 |
| GET | `/api/users/me/course-roles` | 인증된 사용자 | 내 강의 역할 조회 |
| POST | `/api/users/{userId}/course-roles` | OPERATOR, TENANT_ADMIN | 역할 부여 |
| DELETE | `/api/users/{userId}/course-roles/{id}` | OPERATOR, TENANT_ADMIN | 역할 회수 |

#### Auth API (인증)

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 갱신 |

---

### TS (Time Schedule) 모듈

#### 기반 구조 (PR #36)

| 구성요소 | 파일 |
|----------|------|
| Entity | Program.java, CourseTime.java, Category.java |
| Repository | ProgramRepository.java, CourseTimeRepository.java, CategoryRepository.java |
| Service | ProgramService.java, CourseTimeService.java |
| Controller | (다음 Phase에서 구현) |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Spring Boot 3.4.x |
| Language | Java 21 |
| Database | MySQL 8.0 |
| ORM | Spring Data JPA + Hibernate |
| Security | Spring Security + JWT |
| Build | Gradle |
| Test | JUnit 5 + MockMvc |

---

## 프로젝트 구조

```
src/main/java/com/mzc/lp/
├── common/
│   ├── config/          # SecurityConfig, JwtConfig
│   ├── constant/        # ErrorCode
│   ├── dto/             # ApiResponse
│   ├── entity/          # BaseTimeEntity, TenantEntity
│   ├── exception/       # GlobalExceptionHandler
│   └── security/        # JwtTokenProvider, JwtAuthenticationFilter
├── domain/
│   ├── user/            # UM 모듈
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   └── exception/
│   └── schedule/        # TS 모듈
│       ├── entity/
│       ├── repository/
│       └── service/
└── MzcLpApplication.java
```

---

## 테스트 현황

| 모듈 | 테스트 수 |
|------|----------|
| Auth API | 20+ |
| User API (/me) | 11 |
| User 관리 API | 14 |
| CourseRole API | 15 |
| **합계** | **51+** |

---

## 컨벤션 준수

- [x] Controller: `@RestController`, `@RequiredArgsConstructor`, `@Validated`
- [x] Service: `@Transactional(readOnly=true)`, 쓰기는 `@Transactional`
- [x] Repository: JpaRepository + Custom Repository 패턴
- [x] Entity: `@NoArgsConstructor(protected)`, `@Getter`, Setter 금지
- [x] DTO: Java Record, `from()` 정적 팩토리 메서드
- [x] Exception: `BusinessException` 상속, `ErrorCode` 사용
- [x] Security: `@PreAuthorize` 메서드 레벨 권한 검증
- [x] Multi-tenancy: `TenantEntity` 상속, 자동 tenant_id 필터링

---

## 다음 작업

- [ ] TS 모듈 API 구현 (Program CRUD)
- [ ] 프로필 이미지 업로드 API (현재 작업 중)
- [ ] CM (Course Management) 모듈 기반 구조

---

*최종 업데이트: 2025-12-12*

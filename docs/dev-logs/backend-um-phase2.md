# Backend UM 모듈 개발 로그 - Phase 2

> User 관리 API (OPERATOR/TENANT_ADMIN 권한) 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-11 |
| **관련 이슈** | [#12](https://github.com/mzcATU/mzc-lp-backend/issues/12) |
| **담당 모듈** | UM (User Master) |
| **브랜치** | `feat/um-user-admin` |

---

## 1. 구현 개요

OPERATOR/TENANT_ADMIN 권한을 가진 관리자가 사용자를 관리할 수 있는 API 4개 구현:

| Method | Endpoint | 권한 | 기능 | HTTP Status |
|--------|----------|------|------|-------------|
| GET | `/api/users` | OPERATOR, TENANT_ADMIN | 사용자 목록 조회 (페이징/필터링/검색) | 200 OK |
| GET | `/api/users/{userId}` | OPERATOR, TENANT_ADMIN | 사용자 상세 조회 | 200 OK |
| PUT | `/api/users/{userId}/role` | TENANT_ADMIN | 역할 변경 | 200 OK |
| PUT | `/api/users/{userId}/status` | OPERATOR, TENANT_ADMIN | 상태 변경 (정지/활성화) | 200 OK |

---

## 2. 신규 생성 파일 (8개)

### DTO - Request (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| ChangeRoleRequest.java | `dto/request/` | 역할 변경 요청 (role) |
| ChangeStatusRequest.java | `dto/request/` | 상태 변경 요청 (status, reason) |
| UserSearchRequest.java | `dto/request/` | 검색 조건 (keyword, role, status) |

### DTO - Response (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| UserListResponse.java | `dto/response/` | 사용자 목록 응답 |
| UserRoleResponse.java | `dto/response/` | 역할 변경 응답 |
| UserStatusResponse.java | `dto/response/` | 상태 변경 응답 |

### Repository (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| UserRepositoryCustom.java | `repository/` | 검색용 커스텀 인터페이스 |
| UserRepositoryImpl.java | `repository/` | JPA Criteria API 동적 검색 구현 |

---

## 3. 수정 파일 (5개)

### SecurityConfig.java

```java
// @EnableMethodSecurity 어노테이션 추가
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // 추가
@RequiredArgsConstructor
public class SecurityConfig { ... }
```

### GlobalExceptionHandler.java

```java
// AccessDeniedException 핸들러 추가
@ExceptionHandler(AccessDeniedException.class)
protected ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException e) {
    log.error("AccessDeniedException: {}", e.getMessage());
    return ResponseEntity
            .status(ErrorCode.ACCESS_DENIED.getStatus())
            .body(ApiResponse.error(ErrorCode.ACCESS_DENIED));
}
```

### UserController.java

```java
// Admin API 엔드포인트 추가
@GetMapping
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<ApiResponse<Page<UserListResponse>>> getUsers(...) { ... }

@GetMapping("/{userId}")
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<ApiResponse<UserDetailResponse>> getUser(...) { ... }

@PutMapping("/{userId}/role")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public ResponseEntity<ApiResponse<UserRoleResponse>> changeUserRole(...) { ... }

@PutMapping("/{userId}/status")
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<ApiResponse<UserStatusResponse>> changeUserStatus(...) { ... }
```

### UserService.java (인터페이스)

```java
// Admin 메서드 추가
Page<UserListResponse> getUsers(UserSearchRequest request, Pageable pageable);
UserDetailResponse getUserById(Long userId);
UserRoleResponse changeUserRole(Long userId, ChangeRoleRequest request);
UserStatusResponse changeUserStatus(Long userId, ChangeStatusRequest request);
```

### UserServiceImpl.java (구현체)

```java
// Admin 메서드 구현
@Override
public Page<UserListResponse> getUsers(UserSearchRequest request, Pageable pageable) { ... }

@Override
public UserDetailResponse getUserById(Long userId) { ... }

@Override
@Transactional
public UserRoleResponse changeUserRole(Long userId, ChangeRoleRequest request) { ... }

@Override
@Transactional
public UserStatusResponse changeUserStatus(Long userId, ChangeStatusRequest request) { ... }
```

---

## 4. 파일 구조

```
domain/user/
├── controller/
│   ├── AuthController.java      (기존)
│   └── UserController.java      (수정) +4 엔드포인트
├── service/
│   ├── AuthService.java         (기존)
│   ├── UserService.java         (수정) +4 메서드
│   └── UserServiceImpl.java     (수정) +4 메서드
├── repository/
│   ├── UserRepository.java      (기존, extends UserRepositoryCustom)
│   ├── UserRepositoryCustom.java    ✅ 신규
│   └── UserRepositoryImpl.java      ✅ 신규
├── dto/
│   ├── request/
│   │   ├── (기존 DTO들...)
│   │   ├── ChangeRoleRequest.java      ✅ 신규
│   │   ├── ChangeStatusRequest.java    ✅ 신규
│   │   └── UserSearchRequest.java      ✅ 신규
│   └── response/
│       ├── (기존 DTO들...)
│       ├── UserListResponse.java       ✅ 신규
│       ├── UserRoleResponse.java       ✅ 신규
│       └── UserStatusResponse.java     ✅ 신규
└── ...

common/
├── config/
│   └── SecurityConfig.java      (수정) @EnableMethodSecurity
└── exception/
    └── GlobalExceptionHandler.java (수정) AccessDeniedException 핸들러
```

---

## 5. 테스트 케이스 (14개)

### GET /api/users - 사용자 목록 조회 (5개)

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - OPERATOR가 사용자 목록 조회 | 200 OK, 목록 반환 |
| 성공 - TENANT_ADMIN이 사용자 목록 조회 | 200 OK, 목록 반환 |
| 성공 - 키워드 검색 | 200 OK, 필터링된 결과 |
| 성공 - 역할 필터링 | 200 OK, 필터링된 결과 |
| 실패 - USER 권한으로 접근 | 403 Forbidden |

### GET /api/users/{userId} - 사용자 상세 조회 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - OPERATOR가 사용자 상세 조회 | 200 OK, 상세 정보 반환 |
| 실패 - 존재하지 않는 사용자 | 404 Not Found, U001 |
| 실패 - USER 권한으로 접근 | 403 Forbidden |

### PUT /api/users/{userId}/role - 역할 변경 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - TENANT_ADMIN이 역할 변경 | 200 OK, 변경된 역할 |
| 실패 - OPERATOR 권한으로 역할 변경 시도 | 403 Forbidden |
| 실패 - 존재하지 않는 사용자 | 404 Not Found, U001 |

### PUT /api/users/{userId}/status - 상태 변경 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - OPERATOR가 사용자 정지 | 200 OK, SUSPENDED |
| 성공 - 정지 사용자 활성화 | 200 OK, ACTIVE |
| 실패 - USER 권한으로 상태 변경 시도 | 403 Forbidden |

---

## 6. 권한 매트릭스

| API | USER | OPERATOR | TENANT_ADMIN |
|-----|------|----------|--------------|
| GET /api/users | ❌ | ✅ | ✅ |
| GET /api/users/{userId} | ❌ | ✅ | ✅ |
| PUT /api/users/{userId}/role | ❌ | ❌ | ✅ |
| PUT /api/users/{userId}/status | ❌ | ✅ | ✅ |

---

## 7. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@PreAuthorize` 권한 검증
- [x] Service만 호출 (비즈니스 로직 없음)
- [x] Pageable 파라미터 사용

### Service (04-SERVICE-CONVENTIONS)

- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`
- [x] 로깅: INFO(상태 변경), DEBUG(조회)

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JPA Criteria API 동적 쿼리
- [x] Custom Repository 패턴 적용

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션
- [x] Response: `from()` 정적 팩토리 메서드

### Security (21-SECURITY-CONVENTIONS)

- [x] `@EnableMethodSecurity` 활성화
- [x] `@PreAuthorize` 메서드 레벨 권한 검증
- [x] AccessDeniedException → 403 Forbidden

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc` 통합 테스트
- [x] `@Nested` 그룹화
- [x] 권한별 접근 제어 검증

---

## 8. API 테스트 검증 (실제 MySQL 연동)

### 테스트 환경

- DB: MySQL 8.0 (`mza_newlp`)
- 서버: `http://localhost:8080`

### 테스트 결과

| API | 요청 | 결과 |
|-----|------|------|
| GET /api/users | OPERATOR 권한 | ✅ 200 OK |
| GET /api/users/1 | OPERATOR 권한 | ✅ 200 OK |
| PUT /api/users/1/role | OPERATOR 권한 | ✅ 403 Forbidden (정상) |
| PUT /api/users/1/role | TENANT_ADMIN 권한 | ✅ 200 OK |
| PUT /api/users/1/status | OPERATOR 권한 | ✅ 200 OK |

---

## 9. PR 정보

| 항목 | 내용 |
|------|------|
| **PR 브랜치** | `feat/um-user-admin` → `dev` |
| **커밋** | `7d918f0` - [Feat] User 관리 API (OPERATOR 권한) 구현 - #12 |
| **관련 이슈** | closes #12 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-11 | Claude Code | Phase 2 구현 완료 (API 4개, 테스트 14개) |

---

*최종 업데이트: 2025-12-11*

# Backend UM 모듈 개발 로그 - Phase 1

> User API 확장 (/me 엔드포인트) 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-11 |
| **관련 이슈** | [#11](https://github.com/mzcATU/mzc-lp-backend/issues/11) |
| **담당 모듈** | UM (User Master) |

---

## 1. 구현 개요

사용자 본인 정보 관련 API 4개 구현:

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| GET | `/api/users/me` | 내 정보 조회 | 200 OK |
| PUT | `/api/users/me` | 내 정보 수정 | 200 OK |
| PUT | `/api/users/me/password` | 비밀번호 변경 | 200 OK |
| DELETE | `/api/users/me` | 회원 탈퇴 | 204 No Content |

---

## 2. 신규 생성 파일 (9개)

### Controller

| 파일 | 경로 | 설명 |
|------|------|------|
| UserController.java | `controller/` | /me API 엔드포인트 |

### Service

| 파일 | 경로 | 설명 |
|------|------|------|
| UserService.java | `service/` | 인터페이스 |
| UserServiceImpl.java | `service/` | 구현체 |

### DTO - Request

| 파일 | 경로 | 설명 |
|------|------|------|
| UpdateProfileRequest.java | `dto/request/` | 프로필 수정 (name, phone, profileImageUrl) |
| ChangePasswordRequest.java | `dto/request/` | 비밀번호 변경 (currentPassword, newPassword) |
| WithdrawRequest.java | `dto/request/` | 회원 탈퇴 (password, reason) |

### DTO - Response

| 파일 | 경로 | 설명 |
|------|------|------|
| UserDetailResponse.java | `dto/response/` | 사용자 상세 정보 응답 |

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| PasswordMismatchException.java | `exception/` | 비밀번호 불일치 예외 |

### Test

| 파일 | 경로 | 테스트 수 |
|------|------|----------|
| UserControllerTest.java | `test/.../controller/` | 11개 |

---

## 3. 수정 파일 (2개)

### ErrorCode.java

```java
// 추가된 코드
PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "U004", "Current password is incorrect"),
USER_ALREADY_WITHDRAWN(HttpStatus.BAD_REQUEST, "U005", "User already withdrawn"),
```

### AuthService.java

```java
// login() 메서드에 추가
// 탈퇴/정지 사용자 체크
if (user.getStatus() == UserStatus.WITHDRAWN || user.getStatus() == UserStatus.SUSPENDED) {
    throw new InvalidCredentialsException();
}
```

---

## 4. 파일 구조

```
domain/user/
├── controller/
│   ├── AuthController.java      (기존)
│   └── UserController.java      ✅ 신규
├── service/
│   ├── AuthService.java         (수정)
│   ├── UserService.java         ✅ 신규
│   └── UserServiceImpl.java     ✅ 신규
├── dto/
│   ├── request/
│   │   ├── LoginRequest.java        (기존)
│   │   ├── RegisterRequest.java     (기존)
│   │   ├── RefreshTokenRequest.java (기존)
│   │   ├── UpdateProfileRequest.java    ✅ 신규
│   │   ├── ChangePasswordRequest.java   ✅ 신규
│   │   └── WithdrawRequest.java         ✅ 신규
│   └── response/
│       ├── UserResponse.java        (기존)
│       ├── TokenResponse.java       (기존)
│       └── UserDetailResponse.java  ✅ 신규
├── exception/
│   ├── UserNotFoundException.java       (기존)
│   ├── DuplicateEmailException.java     (기존)
│   ├── InvalidCredentialsException.java (기존)
│   ├── InvalidTokenException.java       (기존)
│   └── PasswordMismatchException.java   ✅ 신규
└── ...
```

---

## 5. 테스트 케이스 (11개)

### GET /api/users/me - 내 정보 조회

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - 내 정보 조회 | 200 OK, 사용자 정보 반환 |
| 실패 - 인증 없이 접근 | 403 Forbidden |

### PUT /api/users/me - 내 정보 수정

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - 프로필 수정 | 200 OK, 수정된 정보 반환 |
| 성공 - 부분 수정 (이름만) | 200 OK |
| 실패 - 인증 없이 접근 | 403 Forbidden |

### PUT /api/users/me/password - 비밀번호 변경

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - 비밀번호 변경 | 200 OK |
| 실패 - 현재 비밀번호 불일치 | 400 Bad Request, U004 |
| 실패 - 새 비밀번호 형식 오류 | 400 Bad Request |

### DELETE /api/users/me - 회원 탈퇴

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - 회원 탈퇴 | 204 No Content |
| 실패 - 비밀번호 불일치 | 400 Bad Request, U004 |
| 실패 - 인증 없이 접근 | 403 Forbidden |

---

## 6. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@RestController`, `@RequestMapping`, `@RequiredArgsConstructor`, `@Validated`
- [x] `@Valid @RequestBody` 사용
- [x] try-catch 미사용 (GlobalExceptionHandler 위임)
- [x] Service만 호출 (비즈니스 로직 없음)

### Service (04-SERVICE-CONVENTIONS)

- [x] `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`
- [x] 로깅: INFO(주요 이벤트), DEBUG(조회)

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@Size`, `@Pattern`)
- [x] Response: `from()` 정적 팩토리 메서드

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] `BusinessException` 상속
- [x] `ErrorCode` 사용

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc` 통합 테스트
- [x] `@DisplayName` 한글 설명
- [x] Given-When-Then 패턴
- [x] `@Nested` 그룹화

---

## 7. 다음 작업 (Phase 2)

### 이슈 #12: User 관리 API (OPERATOR 권한)

| Method | Endpoint | 기능 |
|--------|----------|------|
| GET | `/api/users` | 사용자 목록 (페이징/필터) |
| GET | `/api/users/{userId}` | 사용자 상세 |
| PUT | `/api/users/{userId}/role` | 역할 변경 |
| PUT | `/api/users/{userId}/status` | 상태 변경 |

**필요 작업:**
- UserRepository 검색/필터 메서드 추가
- DTO 생성 (UserListResponse, ChangeRoleRequest, ChangeStatusRequest)
- `@PreAuthorize` 권한 검증 적용

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-11 | Claude Code | Phase 1 구현 완료 (API 4개, 테스트 11개) |

---

*최종 업데이트: 2025-12-11*

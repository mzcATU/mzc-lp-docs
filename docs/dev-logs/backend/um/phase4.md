# Backend UM 모듈 개발 로그 - Phase 4

> 회원 탈퇴 API RefreshToken 삭제 로직 추가

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업 일자** | 2025-12-12 |
| **관련 이슈** | [#24](https://github.com/mzcATU/mzc-lp-backend/issues/24) |
| **관련 PR** | [#38](https://github.com/mzcATU/mzc-lp-backend/pull/38) |
| **담당 모듈** | UM (User Master) |
| **브랜치** | `feat/um-withdraw` |

---

## 1. 구현 개요

회원 탈퇴 시 보안 강화를 위해 모든 RefreshToken을 자동 삭제하는 로직 추가:

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| DELETE | `/api/users/me` | 회원 탈퇴 (RefreshToken 삭제 포함) | 204 No Content |

---

## 2. 비즈니스 로직

### 회원 탈퇴 플로우

```
1. 현재 비밀번호 검증
2. 사용자 상태 WITHDRAWN으로 변경 (soft delete)
3. 모든 RefreshToken 삭제 ✅ 신규 추가
4. 탈퇴 사유 로그 출력
```

### 보안 고려사항

- 탈퇴 후에도 AccessToken 만료 전까지 접근 가능 → RefreshToken 삭제로 토큰 갱신 차단
- 탈퇴된 사용자의 로그인 시도 → AuthService에서 WITHDRAWN 상태 체크로 차단

---

## 3. 수정 파일 (1개)

### UserServiceImpl.java

```java
// 의존성 추가
private final RefreshTokenRepository refreshTokenRepository;

@Override
@Transactional
public void withdraw(Long userId, WithdrawRequest request) {
    User user = userRepository.findById(userId)
            .orElseThrow(UserNotFoundException::new);

    // 비밀번호 검증
    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
        throw new PasswordMismatchException();
    }

    // 상태 변경
    user.withdraw();

    // RefreshToken 전체 삭제 ✅ 신규 추가
    refreshTokenRepository.deleteByUserId(userId);

    log.info("User withdrawn: userId={}, reason={}", userId, request.reason());
}
```

---

## 4. API 스펙

### Request

```http
DELETE /api/users/me
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "password": "Test1234!",
  "reason": "더 이상 사용하지 않습니다"
}
```

### Response

```http
HTTP/1.1 204 No Content
```

---

## 5. 테스트 케이스

### 기존 테스트 (UserControllerTest)

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - 회원 탈퇴 | 204 No Content |
| 실패 - 비밀번호 불일치 | 400 Bad Request, U004 |
| 실패 - 인증 없이 접근 | 403 Forbidden |

---

## 6. 컨벤션 준수 체크

### Service (04-SERVICE-CONVENTIONS)

- [x] `@Transactional` 쓰기 메서드
- [x] 로깅: INFO(주요 이벤트)
- [x] Repository 직접 호출

### Security (21-SECURITY-CONVENTIONS)

- [x] RefreshToken 무효화로 보안 강화
- [x] Soft delete 방식 유지

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2025-12-12 | Phase 4 구현 완료 (RefreshToken 삭제 로직) |

---

*최종 업데이트: 2025-12-12*

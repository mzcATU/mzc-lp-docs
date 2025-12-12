# Backend CMS 모듈 테스트 로그

> Content Management System - 통합 테스트 결과 및 수정 사항

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **담당 모듈** | CMS (Content Management) |
| **테스트 브랜치** | `feat/cms-module` |

---

## 1. 테스트 개요

### 테스트 환경

| 항목 | 설정 |
|------|------|
| 테스트 프레임워크 | JUnit 5 + Spring Boot Test |
| 데이터베이스 | H2 In-Memory |
| 어노테이션 | `@SpringBootTest`, `@AutoConfigureMockMvc` |
| 트랜잭션 | `@Transactional` (테스트 후 롤백) |

### 테스트 대상 API

| Method | Endpoint | 테스트 케이스 |
|--------|----------|--------------|
| POST | `/api/contents/upload` | 파일 업로드 성공/실패 |
| POST | `/api/contents/external-link` | 외부 링크 등록 성공/실패 |
| GET | `/api/contents` | 목록 조회 (필터/페이징) |
| GET | `/api/contents/{id}` | 상세 조회 성공/404 |
| GET | `/api/contents/{id}/stream` | 스트리밍 |
| GET | `/api/contents/{id}/download` | 다운로드 |
| PATCH | `/api/contents/{id}` | 메타데이터 수정 |
| DELETE | `/api/contents/{id}` | 삭제 |

---

## 2. 테스트 결과

### 최종 결과

```
BUILD SUCCESSFUL in 22s
5 actionable tasks: 3 executed, 2 up-to-date
```

### 테스트 케이스 (17개)

| # | 테스트 | 상태 |
|---|--------|------|
| 1 | `uploadFile_Success` | ✅ PASS |
| 2 | `uploadFile_UnsupportedFileType` | ✅ PASS |
| 3 | `uploadFile_EmptyFile` | ✅ PASS |
| 4 | `uploadFile_Unauthorized` | ✅ PASS |
| 5 | `createExternalLink_Success` | ✅ PASS |
| 6 | `createExternalLink_InvalidUrl` | ✅ PASS |
| 7 | `getContents_Success` | ✅ PASS |
| 8 | `getContents_WithFilters` | ✅ PASS |
| 9 | `getContents_Pagination` | ✅ PASS |
| 10 | `getContent_Success` | ✅ PASS |
| 11 | `getContent_NotFound` | ✅ PASS |
| 12 | `streamContent_Success` | ✅ PASS |
| 13 | `downloadContent_Success` | ✅ PASS |
| 14 | `updateContent_Success` | ✅ PASS |
| 15 | `updateContent_NotFound` | ✅ PASS |
| 16 | `deleteContent_Success` | ✅ PASS |
| 17 | `deleteContent_NotFound` | ✅ PASS |

---

## 3. 발생 오류 및 해결

### 오류 1: `UserPrincipal.tenantId()` 메서드 없음

**증상**
```
error: cannot find symbol
  symbol:   method tenantId()
  location: variable principal of type UserPrincipal
```

**원인**
- `ContentController`에서 `principal.tenantId()`를 사용하지만, `UserPrincipal` 레코드에 `tenantId` 필드가 없었음
- JWT 토큰에 tenantId claim이 포함되어 있지 않았음

**해결**

| 파일 | 수정 내용 |
|------|----------|
| `UserPrincipal.java` | `tenantId` 필드 추가 |
| `JwtProvider.java` | `createAccessToken()`에 tenantId 파라미터 추가, `getTenantId()` 메서드 추가 |
| `JwtAuthenticationFilter.java` | 토큰에서 tenantId 추출하여 UserPrincipal 생성 시 전달 |
| `AuthService.java` | `createAccessToken()` 호출 시 `user.getTenantId()` 전달 |

**수정 코드**

```java
// UserPrincipal.java
public record UserPrincipal(
        Long id,
        String email,
        String role,
        Long tenantId  // 추가
) {}

// JwtProvider.java
public String createAccessToken(Long userId, String email, String role, Long tenantId) {
    return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim("role", role)
            .claim("tenantId", tenantId)  // 추가
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
}

public Long getTenantId(String token) {  // 추가
    return getClaims(token).get("tenantId", Long.class);
}

// JwtAuthenticationFilter.java
Long tenantId = jwtProvider.getTenantId(token);  // 추가
UserPrincipal principal = new UserPrincipal(userId, email, role, tenantId);

// AuthService.java
String accessToken = jwtProvider.createAccessToken(
        user.getId(),
        user.getEmail(),
        user.getRole().name(),
        user.getTenantId()  // 추가
);
```

---

### 오류 2: `Instant`를 `LocalDateTime`으로 변환 불가

**증상**
```
error: incompatible types: Instant cannot be converted to LocalDateTime
        entity.getCreatedAt(),
```

**원인**
- `BaseTimeEntity`의 `createdAt`, `updatedAt` 필드 타입이 `Instant`
- `ContentResponse`, `ContentListResponse` DTO에서 `LocalDateTime` 타입으로 선언

**해결**

| 파일 | 수정 내용 |
|------|----------|
| `ContentResponse.java` | `LocalDateTime` → `Instant` 변경 |
| `ContentListResponse.java` | `LocalDateTime` → `Instant` 변경 |

**수정 코드**

```java
// ContentResponse.java
public record ContentResponse(
        Long id,
        // ... 기타 필드
        Instant createdAt,   // LocalDateTime → Instant
        Instant updatedAt    // LocalDateTime → Instant
) {
    public static ContentResponse from(Content entity) {
        return new ContentResponse(
                entity.getId(),
                // ...
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
```

---

### 오류 3: `LearningObjectRepository` 클래스 없음

**증상**
```
error: cannot find symbol
  symbol:   class LearningObjectRepository
```

**원인**
- 테스트 코드에서 `LearningObjectRepository`를 import했으나, CMS 브랜치에는 LO 모듈이 없음
- CMS와 LO는 별도 브랜치로 분리되어 있음

**해결**
- `ContentControllerTest.java`에서 `LearningObjectRepository` import 및 관련 코드 제거

---

### 오류 4: 필드명 불일치 (`contentId` vs `id`)

**증상**
- Response DTO의 필드명과 Entity의 필드명 불일치

**해결**
- `ContentResponse`, `ContentListResponse`의 `contentId` → `id`로 변경
- Entity의 `getId()` 메서드와 일치

---

## 4. 테스트 설정 파일

### test/resources/application.yml 추가 내용

```yaml
file:
  upload-dir: ${java.io.tmpdir}/test-uploads
  max-size:
    video: 10485760      # 10MB (테스트용)
    audio: 5242880       # 5MB
    document: 1048576    # 1MB
    image: 524288        # 512KB
```

---

## 5. 신규 생성 파일

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentControllerTest.java | `src/test/java/com/mzc/lp/domain/content/controller/` | CMS API 통합 테스트 (17개 케이스) |

---

## 6. 수정 파일 요약

| 파일 | 수정 사유 |
|------|----------|
| `UserPrincipal.java` | tenantId 필드 추가 (멀티테넌시 지원) |
| `JwtProvider.java` | tenantId claim 추가 |
| `JwtAuthenticationFilter.java` | tenantId 추출 로직 추가 |
| `AuthService.java` | createAccessToken() 호출 시 tenantId 전달 |
| `ContentResponse.java` | LocalDateTime → Instant, contentId → id |
| `ContentListResponse.java` | LocalDateTime → Instant, contentId → id |
| `test/resources/application.yml` | 파일 저장 설정 추가 |

---

## 7. 커밋 정보

| 항목 | 내용 |
|------|------|
| 브랜치 | `feat/cms-module` |
| 커밋 해시 | `00b3df2` |
| 커밋 메시지 | `[Feat] CMS 모듈 테스트 코드 및 tenantId 지원 추가` |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | CMS 모듈 통합 테스트 작성 (17개 케이스) |
| 2025-12-12 | Claude Code | tenantId 지원을 위한 JWT/Security 수정 |
| 2025-12-12 | Claude Code | DTO 타입 수정 (Instant, 필드명) |

---

*최종 업데이트: 2025-12-12*

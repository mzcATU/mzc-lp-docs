# Backend LO 모듈 테스트 로그

> Learning Object - 학습객체 및 콘텐츠 폴더 통합 테스트 결과 및 수정 사항

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **담당 모듈** | LO (Learning Object) |
| **테스트 브랜치** | `feat/cms-lo-module` |

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

**LearningObjectController**

| Method | Endpoint | 테스트 케이스 |
|--------|----------|--------------|
| POST | `/api/learning-objects` | 학습객체 생성 |
| GET | `/api/learning-objects` | 목록 조회 (필터/페이징) |
| GET | `/api/learning-objects/{id}` | 단건 조회 |
| GET | `/api/learning-objects/content/{contentId}` | 콘텐츠 ID로 조회 |
| PATCH | `/api/learning-objects/{id}` | 수정 |
| PATCH | `/api/learning-objects/{id}/folder` | 폴더 이동 |
| DELETE | `/api/learning-objects/{id}` | 삭제 |

**ContentFolderController**

| Method | Endpoint | 테스트 케이스 |
|--------|----------|--------------|
| POST | `/api/content-folders` | 폴더 생성 |
| GET | `/api/content-folders/tree` | 폴더 트리 조회 |
| GET | `/api/content-folders/{id}` | 단건 조회 |
| GET | `/api/content-folders/{id}/children` | 하위 폴더 조회 |
| PUT | `/api/content-folders/{id}` | 수정 |
| PUT | `/api/content-folders/{id}/move` | 폴더 이동 |
| DELETE | `/api/content-folders/{id}` | 삭제 |

---

## 2. 테스트 결과

### 최종 결과

```
BUILD SUCCESSFUL in 13s
5 actionable tasks: 1 executed, 4 up-to-date
```

### 테스트 케이스 (25개)

**LearningObjectControllerTest (13개)**

| # | 테스트 | 상태 |
|---|--------|------|
| 1 | `createLearningObject_Success` | PASS |
| 2 | `createLearningObject_WithFolder` | PASS |
| 3 | `getLearningObjects_Success` | PASS |
| 4 | `getLearningObjects_WithFolderFilter` | PASS |
| 5 | `getLearningObjects_WithKeyword` | PASS |
| 6 | `getLearningObject_Success` | PASS |
| 7 | `getLearningObject_NotFound` | PASS |
| 8 | `getLearningObjectByContentId_Success` | PASS |
| 9 | `updateLearningObject_Success` | PASS |
| 10 | `moveToFolder_Success` | PASS |
| 11 | `deleteLearningObject_Success` | PASS |
| 12 | `deleteLearningObject_NotFound` | PASS |
| 13 | `accessWithoutAuth_Forbidden` | PASS |

**ContentFolderControllerTest (12개)**

| # | 테스트 | 상태 |
|---|--------|------|
| 1 | `createFolder_Root_Success` | PASS |
| 2 | `createFolder_Child_Success` | PASS |
| 3 | `createFolder_MaxDepthExceeded` | PASS |
| 4 | `getFolderTree_Success` | PASS |
| 5 | `getFolder_Success` | PASS |
| 6 | `getFolder_NotFound` | PASS |
| 7 | `getChildFolders_Success` | PASS |
| 8 | `updateFolder_Success` | PASS |
| 9 | `moveFolder_Success` | PASS |
| 10 | `deleteFolder_Success` | PASS |
| 11 | `deleteFolder_NotFound` | PASS |
| 12 | `accessWithoutAuth_Forbidden` | PASS |

---

## 3. 발생 오류 및 해결

### 오류 1: `Instant`를 `LocalDateTime`으로 변환 불가

**증상**
```
error: incompatible types: Instant cannot be converted to LocalDateTime
        folder.getCreatedAt(),
```

**원인**
- `BaseTimeEntity`의 `createdAt`, `updatedAt` 필드 타입이 `Instant`
- `LearningObjectResponse`, `ContentFolderResponse` DTO에서 `LocalDateTime` 타입으로 선언

**해결**
- DTO 필드 타입은 `LocalDateTime` 유지 (API 응답 일관성)
- `from()` 메서드에서 `Instant` → `LocalDateTime` 변환 로직 추가

| 파일 | 수정 내용 |
|------|----------|
| `LearningObjectResponse.java` | `from()` 메서드에서 Instant → LocalDateTime 변환 |
| `ContentFolderResponse.java` | `from()`, `fromWithChildren()` 메서드에서 Instant → LocalDateTime 변환 |

**수정 코드**

```java
// LearningObjectResponse.java
import java.time.LocalDateTime;
import java.time.ZoneId;

lo.getCreatedAt() != null
        ? LocalDateTime.ofInstant(lo.getCreatedAt(), ZoneId.systemDefault())
        : null,
lo.getUpdatedAt() != null
        ? LocalDateTime.ofInstant(lo.getUpdatedAt(), ZoneId.systemDefault())
        : null
```

---

### 오류 2: 인증 없는 요청 응답 코드

**증상**
- 테스트에서 401 (Unauthorized) 기대했으나 실패

**원인**
- Spring Security 설정에서 인증 없는 요청에 403 (Forbidden) 반환

**해결**
- 테스트 기대값을 `isUnauthorized()` → `isForbidden()`으로 변경

---

### 오류 3: 기존 UM/auth 코드 변경 문제

**증상**
- `UserPrincipal`에 tenantId 필드를 추가하여 기존 코드가 깨짐
- 다른 모듈에서 기존 `UserPrincipal(id, email, role)` 사용 중

**원인**
- CMS/LO Controller에서 tenantId가 필요하여 UserPrincipal에 tenantId 필드를 추가했으나, 이는 기존 코드에 영향을 미침

**해결**
- 기존 코드 **원복** (추가가 아닌 변경은 허용되지 않음)
- Controller에서 `UserRepository`를 주입받아 userId로 User를 조회하여 tenantId 획득

| 파일 | 원복/수정 내용 |
|------|---------------|
| `UserPrincipal.java` | tenantId 필드 제거 (원복) |
| `JwtProvider.java` | 기존 `createAccessToken(userId, email, role)` 유지 + tenantId 포함 오버로드 **추가** |
| `JwtAuthenticationFilter.java` | tenantId 추출 로직 제거 (원복) |
| `AuthService.java` | 기존 3인자 `createAccessToken` 호출로 원복 |
| `ContentController.java` | UserRepository 주입, `getTenantId(userId)` 헬퍼 메서드 추가 |
| `LearningObjectController.java` | UserRepository 주입, `getTenantId(userId)` 헬퍼 메서드 추가 |
| `ContentFolderController.java` | UserRepository 주입, `getTenantId(userId)` 헬퍼 메서드 추가 |

**수정 코드**

```java
// Controller의 getTenantId 헬퍼 메서드
private Long getTenantId(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(UserNotFoundException::new);
    return user.getTenantId();
}

// 사용 예시
@PostMapping
public ResponseEntity<ApiResponse<LearningObjectResponse>> create(
        @Valid @RequestBody CreateLearningObjectRequest request,
        @AuthenticationPrincipal UserPrincipal principal
) {
    Long tenantId = getTenantId(principal.id());
    LearningObjectResponse response = learningObjectService.create(request, tenantId);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
}
```

---

### 오류 4: TenantRole.DESIGNER 미존재

**증상**
```
error: cannot find symbol
        testUser.updateRole(TenantRole.DESIGNER);
                                      ^
```

**원인**
- `TenantRole` enum에 `DESIGNER`가 없음 (TENANT_ADMIN, OPERATOR, USER만 존재)
- DESIGNER는 CourseRole에 해당

**해결**
- 테스트에서 `TenantRole.OPERATOR` 사용 (Controller에서 `hasAnyRole('DESIGNER', 'OPERATOR', 'TENANT_ADMIN')` 체크)

---

## 4. 브랜치 통합

### 통합 사유

LO 모듈이 CMS 모듈(content 패키지)에 의존하여 단독 빌드 불가

### 통합 과정

```bash
# CMS 브랜치 기준으로 LO 브랜치 머지
git checkout feat/cms-module
git merge feat/lo-module --no-edit

# 브랜치명 변경
git branch -m feat/cms-module feat/cms-lo-module
```

### 통합 브랜치

| 항목 | 내용 |
|------|------|
| 브랜치명 | `feat/cms-lo-module` |
| 포함 모듈 | CMS + LO |
| 커밋 이력 | 양쪽 브랜치 커밋 모두 유지 |

---

## 5. 신규 생성 파일

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectControllerTest.java | `src/test/java/com/mzc/lp/domain/learning/controller/` | 학습객체 API 통합 테스트 (13개 케이스) |
| ContentFolderControllerTest.java | `src/test/java/com/mzc/lp/domain/learning/controller/` | 콘텐츠 폴더 API 통합 테스트 (12개 케이스) |

---

## 6. 수정 파일 요약

| 파일 | 수정 사유 |
|------|----------|
| `LearningObjectResponse.java` | Instant → LocalDateTime 변환 로직 추가 |
| `ContentFolderResponse.java` | Instant → LocalDateTime 변환 로직 추가 |
| `LearningObjectController.java` | UserRepository 주입, getTenantId() 헬퍼 메서드 추가 |
| `ContentFolderController.java` | UserRepository 주입, getTenantId() 헬퍼 메서드 추가 |
| `ContentController.java` | UserRepository 주입, getTenantId() 헬퍼 메서드 추가 |

---

## 7. 원복 파일 요약

| 파일 | 원복 사유 |
|------|----------|
| `UserPrincipal.java` | tenantId 필드 제거 - 기존 코드 호환성 유지 |
| `JwtAuthenticationFilter.java` | tenantId 추출 로직 제거 - 기존 코드 호환성 유지 |
| `AuthService.java` | 3인자 createAccessToken 호출로 복원 - 기존 코드 호환성 유지 |

---

## 8. 커밋 정보

| 항목 | 내용 |
|------|------|
| 브랜치 | `feat/cms-lo-module` |
| 커밋 해시 | `98a0c75` |
| 커밋 메시지 | `[Feat] LO 모듈 테스트 코드 및 Response DTO 타입 수정` |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | CMS + LO 브랜치 통합 |
| 2025-12-12 | Claude Code | LO 모듈 통합 테스트 작성 (25개 케이스) |
| 2025-12-12 | Claude Code | DTO 타입 수정 (Instant → LocalDateTime 변환) |
| 2025-12-12 | Claude Code | 기존 UM/auth 코드 원복 및 Controller tenantId 조회 방식 변경 |

---

*최종 업데이트: 2025-12-12*

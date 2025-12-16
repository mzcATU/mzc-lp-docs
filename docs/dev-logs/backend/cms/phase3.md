# Backend CMS 모듈 - 콘텐츠 상태 관리 구현

> Content Status Management - ACTIVE/ARCHIVED 상태 및 DESIGNER 전용 API

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-16 |
| **담당 모듈** | CMS (Content Management) |
| **관련 이슈** | [#82](https://github.com/user/repo/issues/82) |
| **관련 브랜치** | `feat/content-status` |

---

## 1. 구현 개요

콘텐츠 상태 관리 기능 및 DESIGNER 전용 API 3개 추가:

| Method | Endpoint | 기능 | 권한 | HTTP Status |
|--------|----------|------|------|-------------|
| GET | `/api/contents/my` | 내 콘텐츠 목록 조회 | DESIGNER | 200 OK |
| POST | `/api/contents/{id}/archive` | 콘텐츠 보관 (Soft Delete) | DESIGNER | 200 OK |
| POST | `/api/contents/{id}/restore` | 콘텐츠 복원 | DESIGNER | 200 OK |

### 핵심 비즈니스 규칙

- **콘텐츠 소유권**: DESIGNER는 본인이 생성한 콘텐츠만 조회/관리 가능 (`createdBy` 필드)
- **상태 관리**: ACTIVE(사용 중) / ARCHIVED(보관됨) 상태 전이
- **Soft Delete**: Archive 시 실제 파일 삭제 없이 상태만 변경

---

## 2. 신규 생성 파일 (2개)

### Constant

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentStatus.java | `constant/` | ACTIVE, ARCHIVED enum |

```java
public enum ContentStatus {
    ACTIVE,    // 사용 중
    ARCHIVED   // 보관됨 (soft delete)
}
```

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| UnauthorizedContentAccessException.java | `exception/` | 콘텐츠 접근 권한 예외 |

---

## 3. 수정 파일 (7개)

### Content.java (Entity)

**추가 필드:**
```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private ContentStatus status;

@Column(name = "created_by")
private Long createdBy;
```

**추가 인덱스:**
```java
@Index(name = "idx_content_status", columnList = "tenant_id, status"),
@Index(name = "idx_content_created_by", columnList = "tenant_id, created_by")
```

**팩토리 메서드 오버로드 (하위 호환성 유지):**
```java
// 기존 시그니처 유지 (테스트 코드 호환)
public static Content createFile(String originalFileName, String storedFileName,
                                 ContentType contentType, Long fileSize, String filePath) {
    return createFile(originalFileName, storedFileName, contentType, fileSize, filePath, null);
}

// 신규 시그니처 (createdBy 포함)
public static Content createFile(String originalFileName, String storedFileName,
                                 ContentType contentType, Long fileSize, String filePath,
                                 Long createdBy) { ... }

// 외부 링크도 동일 패턴
public static Content createExternalLink(String name, String externalUrl) { ... }
public static Content createExternalLink(String name, String externalUrl, Long createdBy) { ... }
```

**상태 전이 메서드:**
```java
public void archive() { this.status = ContentStatus.ARCHIVED; }
public void restore() { this.status = ContentStatus.ACTIVE; }
public boolean isActive() { return this.status == ContentStatus.ACTIVE; }
public boolean isArchived() { return this.status == ContentStatus.ARCHIVED; }
```

### ContentRepository.java

**추가 메서드:**
```java
// createdBy 기반 조회 (DESIGNER용)
Page<Content> findByTenantIdAndCreatedBy(Long tenantId, Long createdBy, Pageable pageable);

Page<Content> findByTenantIdAndCreatedByAndStatus(Long tenantId, Long createdBy,
                                                   ContentStatus status, Pageable pageable);

@Query("SELECT c FROM Content c WHERE c.tenantId = :tenantId AND c.createdBy = :createdBy " +
       "AND LOWER(c.originalFileName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
Page<Content> findByTenantIdAndCreatedByAndKeyword(...);

@Query("SELECT c FROM Content c WHERE c.tenantId = :tenantId AND c.createdBy = :createdBy " +
       "AND c.status = :status AND LOWER(c.originalFileName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
Page<Content> findByTenantIdAndCreatedByAndStatusAndKeyword(...);
```

### ContentService.java (Interface)

**추가 메서드:**
```java
// DESIGNER용 API
Page<ContentListResponse> getMyContents(Long tenantId, Long userId,
                                        ContentStatus status, String keyword, Pageable pageable);
ContentResponse archiveContent(Long contentId, Long tenantId, Long userId);
ContentResponse restoreContent(Long contentId, Long tenantId, Long userId);
```

### ContentServiceImpl.java

**추가 메서드 구현:**
```java
@Override
public Page<ContentListResponse> getMyContents(Long tenantId, Long userId,
                                                ContentStatus status, String keyword,
                                                Pageable pageable) {
    // status, keyword 조합에 따른 분기 처리
    // createdBy = userId 조건으로 본인 콘텐츠만 조회
}

@Override
@Transactional
public ContentResponse archiveContent(Long contentId, Long tenantId, Long userId) {
    Content content = findContentOrThrow(contentId, tenantId);
    validateContentOwnership(content, userId);
    content.archive();
    return ContentResponse.from(content);
}

@Override
@Transactional
public ContentResponse restoreContent(Long contentId, Long tenantId, Long userId) {
    Content content = findContentOrThrow(contentId, tenantId);
    validateContentOwnership(content, userId);
    content.restore();
    return ContentResponse.from(content);
}

private void validateContentOwnership(Content content, Long userId) {
    if (content.getCreatedBy() == null || !content.getCreatedBy().equals(userId)) {
        throw new UnauthorizedContentAccessException(content.getId());
    }
}
```

### ContentController.java

**추가 엔드포인트:**
```java
// ========== DESIGNER용 API (본인 콘텐츠 관리) ==========

@GetMapping("/my")
@PreAuthorize("hasRole('DESIGNER')")
public ResponseEntity<ApiResponse<Page<ContentListResponse>>> getMyContents(
        @RequestParam(required = false) ContentStatus status,
        @RequestParam(required = false) String keyword,
        @PageableDefault(size = 20) Pageable pageable,
        @AuthenticationPrincipal UserPrincipal principal) { ... }

@PostMapping("/{contentId}/archive")
@PreAuthorize("hasRole('DESIGNER')")
public ResponseEntity<ApiResponse<ContentResponse>> archiveContent(
        @PathVariable Long contentId,
        @AuthenticationPrincipal UserPrincipal principal) { ... }

@PostMapping("/{contentId}/restore")
@PreAuthorize("hasRole('DESIGNER')")
public ResponseEntity<ApiResponse<ContentResponse>> restoreContent(
        @PathVariable Long contentId,
        @AuthenticationPrincipal UserPrincipal principal) { ... }
```

### ContentResponse.java (DTO)

**추가 필드:**
```java
public record ContentResponse(
    // ... 기존 필드
    ContentStatus status,    // 추가
    Long createdBy,          // 추가
    // ...
) { ... }
```

### ContentListResponse.java (DTO)

**추가 필드:**
```java
public record ContentListResponse(
    // ... 기존 필드
    ContentStatus status,    // 추가
    // ...
) { ... }
```

### ErrorCode.java

**추가 에러 코드:**
```java
UNAUTHORIZED_CONTENT_ACCESS(HttpStatus.FORBIDDEN, "CT008", "Not authorized to access this content"),
```

---

## 4. 파일 구조

```
domain/content/
├── constant/
│   ├── ContentType.java
│   └── ContentStatus.java           ✅ 신규
├── controller/
│   └── ContentController.java       📝 수정 (3개 API 추가)
├── dto/
│   ├── request/
│   │   ├── CreateExternalLinkRequest.java
│   │   └── UpdateContentRequest.java
│   └── response/
│       ├── ContentResponse.java     📝 수정 (status, createdBy 추가)
│       └── ContentListResponse.java 📝 수정 (status 추가)
├── entity/
│   └── Content.java                 📝 수정 (status, createdBy, 메서드 추가)
├── event/
│   └── ContentCreatedEvent.java
├── exception/
│   ├── ContentNotFoundException.java
│   ├── FileStorageException.java
│   ├── UnauthorizedContentAccessException.java  ✅ 신규
│   └── UnsupportedContentTypeException.java
├── repository/
│   └── ContentRepository.java       📝 수정 (createdBy 조회 메서드 추가)
└── service/
    ├── ContentService.java          📝 수정 (3개 메서드 추가)
    ├── ContentServiceImpl.java      📝 수정 (3개 메서드 구현)
    ├── FileStorageService.java
    └── FileStorageServiceImpl.java
```

---

## 5. API 상세

### GET /api/contents/my

DESIGNER가 본인이 생성한 콘텐츠만 조회

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | ContentStatus | N | ACTIVE, ARCHIVED 필터 |
| keyword | String | N | 파일명 검색 |
| page | int | N | 페이지 번호 (default: 0) |
| size | int | N | 페이지 크기 (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "originalFileName": "lecture.mp4",
        "contentType": "VIDEO",
        "status": "ACTIVE",
        "fileSize": 1048576,
        "duration": 3600,
        "resolution": "1920x1080",
        "thumbnailPath": "/uploads/thumbnails/...",
        "createdAt": "2025-12-16T10:00:00"
      }
    ],
    "totalElements": 10,
    "totalPages": 1
  }
}
```

### POST /api/contents/{contentId}/archive

콘텐츠를 ARCHIVED 상태로 변경 (Soft Delete)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ARCHIVED",
    ...
  }
}
```

### POST /api/contents/{contentId}/restore

ARCHIVED 콘텐츠를 ACTIVE 상태로 복원

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ACTIVE",
    ...
  }
}
```

---

## 6. 하위 호환성 유지

기존 코드 변경 없이 새 기능을 추가하기 위해 팩토리 메서드를 오버로드:

```java
// 기존 호출 (테스트 코드, 기존 서비스)
Content.createFile("file.mp4", "stored.mp4", ContentType.VIDEO, 1000L, "/path");

// 새 호출 (createdBy 포함)
Content.createFile("file.mp4", "stored.mp4", ContentType.VIDEO, 1000L, "/path", userId);
```

이렇게 하면:
- ContentServiceImpl의 기존 uploadFile/createExternalLink 코드 수정 불필요
- ContentControllerTest 등 테스트 코드 수정 불필요
- LearningObjectControllerTest 등 다른 모듈 테스트 코드 수정 불필요

---

## 7. 컨벤션 준수 체크

### Entity (06-ENTITY-CONVENTIONS)

- [x] Enum 필드에 `@Enumerated(EnumType.STRING)` 사용
- [x] 상태 전이는 비즈니스 메서드로만 변경 (Setter 미사용)
- [x] 팩토리 메서드 패턴으로 객체 생성

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@PreAuthorize` 어노테이션으로 권한 검증
- [x] DESIGNER 역할 전용 API 분리
- [x] `ApiResponse` 래퍼 사용

### Service (04-SERVICE-CONVENTIONS)

- [x] 비즈니스 검증 로직은 private 메서드로 분리
- [x] 쓰기 작업에 `@Transactional` 명시

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] 복잡한 쿼리는 `@Query` 어노테이션 사용
- [x] 메서드명 네이밍 규칙 준수

---

## 8. 데이터베이스 스키마 변경

### content 테이블

```sql
-- 추가 컬럼
ALTER TABLE content
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN created_by BIGINT;

-- 추가 인덱스
CREATE INDEX idx_content_status ON content(tenant_id, status);
CREATE INDEX idx_content_created_by ON content(tenant_id, created_by);
```

---

## 9. 다음 작업 (Feature 2)

버전 관리 기능 구현 예정:

| 항목 | 설명 |
|------|------|
| ContentVersion Entity | 버전 히스토리 저장 |
| 파일 교체 시 버전 기록 | FILE_REPLACE |
| 메타데이터 수정 시 버전 기록 | METADATA_UPDATE |
| 버전 조회 API | GET /api/contents/{id}/versions |
| 버전 복원 API | POST /api/contents/{id}/versions/{versionNumber}/restore |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | 콘텐츠 상태 관리 구현 (Feature 1) |

---

*최종 업데이트: 2025-12-16*

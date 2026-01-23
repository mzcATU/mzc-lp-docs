# Backend CMS 모듈 - Content 버전 관리 구현

> Content Version Management - 버전 이력, 특정 버전 조회, 버전 복원

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-17 |
| **담당 모듈** | CMS (Content Management) |
| **관련 이슈** | [#93](https://github.com/mzcATU/mzc-lp-backend/issues/93) |
| **관련 브랜치** | `feat/content-version` |

---

## 1. 구현 개요

콘텐츠 버전 관리 기능 구현:

| Method | Endpoint | 기능 | 권한 | HTTP Status |
|--------|----------|------|------|-------------|
| GET | `/api/contents/{contentId}/versions` | 버전 이력 조회 | DESIGNER, OPERATOR, TENANT_ADMIN | 200 OK |
| GET | `/api/contents/{contentId}/versions/{versionNumber}` | 특정 버전 조회 | DESIGNER, OPERATOR, TENANT_ADMIN | 200 OK |
| POST | `/api/contents/{contentId}/versions/{versionNumber}/restore` | 버전 복원 | DESIGNER, OPERATOR, TENANT_ADMIN | 200 OK |

### 핵심 비즈니스 규칙

- **소유권 검증**: 본인이 생성한 콘텐츠만 버전 조회/복원 가능
- **버전 자동 기록**: 파일 업로드, 메타데이터 수정, 파일 교체 시 자동 기록
- **복원 전 백업**: 버전 복원 시 현재 상태를 새 버전으로 자동 저장
- **수정 제한**: 강의(LearningObject)에 포함된 콘텐츠는 수정/교체/복원 불가

---

## 2. 신규 생성 파일 (10개)

### Constant (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| VersionChangeType.java | `constant/` | FILE_UPLOAD, FILE_REPLACE, METADATA_UPDATE |

```java
public enum VersionChangeType {
    FILE_UPLOAD,      // 파일 업로드 (최초 생성)
    FILE_REPLACE,     // 파일 교체
    METADATA_UPDATE   // 메타데이터 수정
}
```

### Entity (1개)

| 파일 | 테이블 | 설명 |
|------|--------|------|
| ContentVersion.java | `content_version` | 콘텐츠 버전 히스토리 |

### Repository (1개)

| 파일 | 주요 메서드 |
|------|------------|
| ContentVersionRepository.java | findByContentIdOrderByVersionNumberDesc, findByContentIdAndVersionNumber, findMaxVersionNumber |

### DTO (2개)

| 파일 | 용도 |
|------|------|
| ContentVersionResponse.java | 버전 정보 응답 |
| RestoreVersionRequest.java | 버전 복원 요청 (changeSummary) |

### Service (2개)

| 파일 | 설명 |
|------|------|
| ContentVersionService.java | 버전 관리 서비스 인터페이스 |
| ContentVersionServiceImpl.java | 버전 관리 서비스 구현체 |

### Controller (1개)

| 파일 | 설명 |
|------|------|
| ContentVersionController.java | 버전 관리 API 컨트롤러 |

### Exception (2개)

| 파일 | ErrorCode | HTTP | 설명 |
|------|-----------|------|------|
| ContentVersionNotFoundException.java | CT009 | 404 | 버전 없음 |
| ContentInUseException.java | CT010 | 409 | 강의에서 사용 중인 콘텐츠 |

---

## 3. 수정 파일 (5개)

### Content.java (Entity)

**추가 필드:**
```java
@Column(name = "current_version", nullable = false)
private Integer currentVersion = 1;
```

**추가 메서드:**
```java
public void incrementVersion() {
    this.currentVersion++;
}
```

### ContentServiceImpl.java

**버전 기록 추가:**
```java
// 파일 업로드 시
contentVersionService.createVersion(savedContent, VersionChangeType.FILE_UPLOAD, userId, "Initial upload");

// 메타데이터 수정 시
contentVersionService.createVersion(content, VersionChangeType.METADATA_UPDATE, content.getCreatedBy(), "Metadata updated");
content.incrementVersion();

// 파일 교체 시
contentVersionService.createVersion(content, VersionChangeType.FILE_REPLACE, content.getCreatedBy(), "File replaced");
content.incrementVersion();
```

**수정 제한 검증 추가:**
```java
private void validateContentNotInUse(Long contentId) {
    if (learningObjectRepository.existsByContentId(contentId)) {
        throw new ContentInUseException(contentId);
    }
}
```

### LearningObjectRepository.java

**추가 메서드:**
```java
/**
 * 콘텐츠가 강의(LearningObject)에서 참조되고 있는지 확인
 */
boolean existsByContentId(Long contentId);
```

### ErrorCode.java

**추가 에러 코드:**
```java
CONTENT_VERSION_NOT_FOUND(HttpStatus.NOT_FOUND, "CT009", "Content version not found"),
CONTENT_IN_USE(HttpStatus.CONFLICT, "CT010", "Content is in use by learning objects and cannot be modified"),
```

### ContentControllerTest.java

**FK 제약조건 수정:**
```java
@BeforeEach
void setUp() {
    // content_version 테이블 먼저 삭제 (FK 제약조건)
    contentVersionRepository.deleteAll();
    contentRepository.deleteAll();
    // ...
}
```

---

## 4. 파일 구조

```
domain/content/
├── constant/
│   ├── ContentType.java
│   ├── ContentStatus.java
│   └── VersionChangeType.java          ✅ 신규
├── controller/
│   ├── ContentController.java
│   └── ContentVersionController.java   ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateExternalLinkRequest.java
│   │   ├── UpdateContentRequest.java
│   │   └── RestoreVersionRequest.java  ✅ 신규
│   └── response/
│       ├── ContentResponse.java
│       ├── ContentListResponse.java
│       └── ContentVersionResponse.java ✅ 신규
├── entity/
│   ├── Content.java                    📝 수정 (currentVersion 추가)
│   └── ContentVersion.java             ✅ 신규
├── exception/
│   ├── ContentNotFoundException.java
│   ├── FileStorageException.java
│   ├── UnauthorizedContentAccessException.java
│   ├── UnsupportedContentTypeException.java
│   ├── ContentVersionNotFoundException.java  ✅ 신규
│   └── ContentInUseException.java            ✅ 신규
├── repository/
│   ├── ContentRepository.java
│   └── ContentVersionRepository.java   ✅ 신규
└── service/
    ├── ContentService.java
    ├── ContentServiceImpl.java         📝 수정 (버전 기록, 수정 제한)
    ├── ContentVersionService.java      ✅ 신규
    ├── ContentVersionServiceImpl.java  ✅ 신규
    ├── FileStorageService.java
    └── FileStorageServiceImpl.java
```

---

## 5. ContentVersion Entity 상세

```java
@Entity
@Table(name = "content_version", indexes = {
    @Index(name = "idx_content_version", columnList = "content_id, version_number"),
    @Index(name = "idx_tenant_content", columnList = "tenant_id, content_id")
})
public class ContentVersion extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_id", nullable = false)
    private Content content;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 50)
    private VersionChangeType changeType;

    // 해당 버전의 스냅샷 데이터
    private String originalFileName;
    private String storedFileName;
    @Enumerated(EnumType.STRING)
    private ContentType contentType;
    private Long fileSize;
    private Integer duration;
    private String resolution;
    private Integer pageCount;
    private String externalUrl;
    private String filePath;
    private String thumbnailPath;

    private String changeSummary;
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 팩토리 메서드
    public static ContentVersion createFrom(Content content, int versionNumber,
                                            VersionChangeType changeType, Long userId,
                                            String changeSummary) { ... }
}
```

---

## 6. API 상세

### GET /api/contents/{contentId}/versions

버전 이력 조회 (내림차순)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 17,
      "contentId": 23,
      "versionNumber": 2,
      "changeType": "METADATA_UPDATE",
      "originalFileName": "react-tutorial.mp4",
      "contentType": "VIDEO",
      "fileSize": 104857600,
      "duration": 1800,
      "resolution": "1920x1080",
      "changeSummary": "Metadata updated",
      "createdBy": 28,
      "createdAt": "2025-12-17T15:56:54"
    },
    {
      "id": 16,
      "contentId": 23,
      "versionNumber": 1,
      "changeType": "FILE_UPLOAD",
      "originalFileName": "react-tutorial.mp4",
      "contentType": "VIDEO",
      "changeSummary": "Initial upload",
      "createdBy": 28,
      "createdAt": "2025-12-17T15:50:00"
    }
  ]
}
```

### GET /api/contents/{contentId}/versions/{versionNumber}

특정 버전 상세 조회

### POST /api/contents/{contentId}/versions/{versionNumber}/restore

특정 버전으로 복원

**Request Body (optional):**
```json
{
  "changeSummary": "Restoring to version 1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 23,
    "originalFileName": "react-tutorial.mp4",
    "contentType": "VIDEO",
    "currentVersion": 3,
    ...
  }
}
```

---

## 7. 버전 기록 시점

| 작업 | 기록 타입 | 설명 |
|------|-----------|------|
| 파일 업로드 | FILE_UPLOAD | 콘텐츠 최초 생성 시 |
| 파일 교체 | FILE_REPLACE | `PUT /api/contents/{id}/file` 호출 시 |
| 메타데이터 수정 | METADATA_UPDATE | `PATCH /api/contents/{id}` 호출 시 |
| 버전 복원 | FILE_REPLACE | 복원 전 현재 상태 백업 |

---

## 8. 수정 제한

강의(LearningObject)에 포함된 콘텐츠는 다음 작업이 제한됩니다:

| 작업 | 제한 |
|------|------|
| 메타데이터 수정 (`PATCH /api/contents/{id}`) | X (CT010 에러) |
| 파일 교체 (`PUT /api/contents/{id}/file`) | X (CT010 에러) |
| 버전 복원 (`POST .../restore`) | X (CT010 에러) |

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CT010",
    "message": "Content 23 is in use by learning objects and cannot be modified"
  }
}
```

---

## 9. 테스트

### ContentVersionControllerTest (11개 테스트)

| 테스트 클래스 | 테스트 케이스 |
|--------------|-------------|
| GetVersionHistory | 성공 - 버전 이력 조회 |
| | 성공 - 버전이 없는 경우 빈 배열 반환 |
| | 실패 - 존재하지 않는 콘텐츠 (CT001) |
| | 실패 - 다른 사용자의 콘텐츠 (CT008) |
| GetVersion | 성공 - 특정 버전 조회 |
| | 실패 - 존재하지 않는 버전 (CT009) |
| | 실패 - 다른 사용자의 콘텐츠 (CT008) |
| RestoreVersion | 성공 - 버전 복원 |
| | 성공 - changeSummary 없이 복원 |
| | 실패 - 존재하지 않는 버전 (CT009) |
| | 실패 - 다른 사용자의 콘텐츠 (CT008) |

**테스트 결과:**
```
Tests run: 418, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESSFUL
```

---

## 10. 컨벤션 준수 체크

### Entity (06-ENTITY-CONVENTIONS)

- [x] TenantEntity 상속
- [x] Setter 미사용 → 팩토리 메서드
- [x] `@Enumerated(EnumType.STRING)`
- [x] 정적 팩토리 메서드 `createFrom()`
- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@PreAuthorize` 어노테이션으로 권한 검증
- [x] `ApiResponse` 래퍼 사용
- [x] REST 규칙 준수 (중첩 리소스 `/contents/{id}/versions`)

### Service (04-SERVICE-CONVENTIONS)

- [x] 인터페이스/구현체 분리
- [x] 비즈니스 검증 로직은 private 메서드로 분리
- [x] 쓰기 작업에 `@Transactional` 명시

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] `@Query` JPQL 사용
- [x] Optional 반환

---

## 11. 데이터베이스 스키마 변경

### content 테이블 수정

```sql
ALTER TABLE content
ADD COLUMN current_version INT NOT NULL DEFAULT 1;
```

### content_version 테이블 신규

```sql
CREATE TABLE content_version (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL DEFAULT 1,
    content_id          BIGINT NOT NULL,
    version_number      INT NOT NULL,
    change_type         VARCHAR(50) NOT NULL,
    original_file_name  VARCHAR(500),
    stored_file_name    VARCHAR(255),
    content_type        VARCHAR(50),
    file_size           BIGINT,
    duration            INT,
    resolution          VARCHAR(20),
    page_count          INT,
    external_url        VARCHAR(2000),
    file_path           VARCHAR(1000),
    thumbnail_path      VARCHAR(1000),
    change_summary      VARCHAR(500),
    created_by          BIGINT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_content_version (content_id, version_number),
    INDEX idx_tenant_content (tenant_id, content_id),
    CONSTRAINT fk_version_content FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
);
```

---

## 12. 관련 문서

- [Phase 1](phase1.md) - CMS 기반 구조
- [Phase 2](phase2.md) - Content API
- [Phase 3](phase3.md) - 콘텐츠 상태 관리 (Feature 1)
- [Content API 명세](../../../structure/backend/content/api.md)
- [Content DB 스키마](../../../structure/backend/content/db.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-17 | Claude Code | Content 버전 관리 구현 (Feature 2) |
| 2025-12-17 | Claude Code | 강의에 포함된 콘텐츠 수정 제한 추가 |
| 2025-12-17 | Claude Code | ContentVersionControllerTest 11개 테스트 추가 |

---

*최종 업데이트: 2025-12-17*

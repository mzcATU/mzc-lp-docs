# Backend CMS 모듈 - uploadedFileName 필드 추가 (Feature 4)

> 콘텐츠 이름과 파일명 분리 - originalFileName과 uploadedFileName 역할 명확화

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-24 |
| **담당 모듈** | CMS (Content Management) |
| **관련 브랜치** | `fix/content-update-http-method` |

---

## 1. 구현 개요

### 배경

콘텐츠의 "이름"과 "파일명"이 혼재되어 있어 사용자 혼란 발생:
- `originalFileName`: 콘텐츠 이름 (사용자가 수정 가능)
- 원래 업로드한 파일명을 보존할 필드 부재

### 해결 방안

`uploadedFileName` 필드 추가로 역할 분리:

| 필드 | 역할 | 수정 가능 | 예시 |
|------|------|----------|------|
| `originalFileName` | 콘텐츠 이름 (표시용) | ✅ | "React 강의" |
| `uploadedFileName` | 업로드한 파일명 (원본) | ❌ (교체 시만) | "react-tutorial.mp4" |
| `storedFileName` | 저장된 파일명 (UUID) | ❌ | "550e8400-....mp4" |

---

## 2. 수정 파일

### 2.1 Content.java (Entity)

**추가 필드:**
```java
@Column(name = "uploaded_file_name", length = 500)
private String uploadedFileName;
```

**createFile() 수정:**
```java
public static Content createFile(String originalFileName, String storedFileName,
                                 ContentType contentType, Long fileSize, String filePath,
                                 Long createdBy) {
    Content content = new Content();
    // ...
    content.originalFileName = originalFileName;
    content.uploadedFileName = originalFileName;  // 최초 업로드 시 동일하게 설정
    // ...
}
```

**replaceFile() 수정 - 핵심 변경:**
```java
// 변경 전: originalFileName도 함께 수정됨 (콘텐츠 이름 덮어씀)
public void replaceFile(String uploadedFileName, String storedFileName,
                       Long fileSize, String filePath) {
    this.originalFileName = uploadedFileName;  // ❌ 문제
    this.uploadedFileName = uploadedFileName;
    // ...
}

// 변경 후: uploadedFileName만 수정 (콘텐츠 이름 유지)
public void replaceFile(String uploadedFileName, String storedFileName,
                       Long fileSize, String filePath) {
    this.uploadedFileName = uploadedFileName;  // ✅ 파일명만 업데이트
    this.storedFileName = storedFileName;
    this.fileSize = fileSize;
    this.filePath = filePath;
}
```

### 2.2 ContentVersion.java (Entity)

**추가 필드:**
```java
@Column(name = "uploaded_file_name", length = 500)
private String uploadedFileName;
```

**createFrom() 수정:**
```java
public static ContentVersion createFrom(Content content, int versionNumber,
                                        VersionChangeType changeType, Long userId,
                                        String changeSummary) {
    ContentVersion version = new ContentVersion();
    // ...
    version.originalFileName = content.getOriginalFileName();
    version.uploadedFileName = content.getUploadedFileName();  // 추가
    // ...
}
```

### 2.3 ContentResponse.java (DTO)

**추가 필드:**
```java
public record ContentResponse(
    Long id,
    String originalFileName,
    String uploadedFileName,      // 추가
    String storedFileName,
    // ...
) {
    public static ContentResponse from(Content content, Boolean inCourse) {
        return new ContentResponse(
            content.getId(),
            content.getOriginalFileName(),
            content.getUploadedFileName(),  // 추가
            content.getStoredFileName(),
            // ...
        );
    }
}
```

### 2.4 ContentVersionResponse.java (DTO)

**추가 필드:**
```java
public record ContentVersionResponse(
    Long id,
    Long contentId,
    Integer versionNumber,
    VersionChangeType changeType,
    String originalFileName,
    String uploadedFileName,      // 추가
    // ...
) {
    public static ContentVersionResponse from(ContentVersion version) {
        return new ContentVersionResponse(
            // ...
            version.getOriginalFileName(),
            version.getUploadedFileName(),  // 추가
            // ...
        );
    }
}
```

### 2.5 ContentVersionServiceImpl.java

**restoreVersion() 수정:**
```java
// 변경 전
content.replaceFile(
    version.getOriginalFileName(),  // ❌ 콘텐츠 이름으로 파일명 덮어씀
    version.getStoredFileName(),
    version.getFileSize(),
    version.getFilePath()
);

// 변경 후
content.replaceFile(
    version.getUploadedFileName(),  // ✅ 원래 업로드한 파일명 사용
    version.getStoredFileName(),
    version.getFileSize(),
    version.getFilePath()
);
```

---

## 3. 파일 구조

```
domain/content/
├── entity/
│   ├── Content.java              📝 수정 (uploadedFileName 필드, replaceFile 수정)
│   └── ContentVersion.java       📝 수정 (uploadedFileName 필드)
├── dto/
│   └── response/
│       ├── ContentResponse.java        📝 수정 (uploadedFileName 필드)
│       └── ContentVersionResponse.java 📝 수정 (uploadedFileName 필드)
└── service/
    └── ContentVersionServiceImpl.java  📝 수정 (restoreVersion에서 uploadedFileName 사용)
```

---

## 4. API 응답 변경

### GET /api/contents/{contentId}

```json
{
  "success": true,
  "data": {
    "id": 2,
    "originalFileName": "React 강의",         // 콘텐츠 이름 (수정 가능)
    "uploadedFileName": "react-tutorial.mp4", // 업로드한 파일명 (추가됨)
    "storedFileName": "550e8400-...-41d4.mp4", // 저장된 파일명 (UUID)
    "contentType": "VIDEO",
    "status": "ACTIVE",
    "inCourse": false,
    "currentVersion": 1,
    "createdAt": "2025-12-24T10:00:00"
  }
}
```

### GET /api/contents/{contentId}/versions

```json
{
  "success": true,
  "data": [
    {
      "id": 17,
      "contentId": 2,
      "versionNumber": 1,
      "changeType": "FILE_UPLOAD",
      "originalFileName": "React 강의",         // 해당 버전의 콘텐츠 이름
      "uploadedFileName": "react-tutorial.mp4", // 해당 버전의 파일명 (추가됨)
      "storedFileName": "550e8400-...-41d4.mp4",
      "contentType": "VIDEO",
      "fileSize": 104857600,
      "changeSummary": "Initial upload",
      "createdAt": "2025-12-24T10:00:00"
    }
  ]
}
```

---

## 5. 동작 시나리오

### 5.1 최초 업로드

```
사용자: "react-tutorial.mp4" 업로드
↓
originalFileName = "react-tutorial.mp4"  (콘텐츠 이름)
uploadedFileName = "react-tutorial.mp4"  (파일명)
storedFileName = "550e8400-...-41d4.mp4" (UUID)
```

### 5.2 콘텐츠 이름 수정

```
사용자: 이름을 "React 강의"로 변경 (PATCH /api/contents/{id})
↓
originalFileName = "React 강의"          ← 변경됨
uploadedFileName = "react-tutorial.mp4"  (유지)
storedFileName = "550e8400-...-41d4.mp4" (유지)
```

### 5.3 파일 교체

```
사용자: "react-advanced.mp4" 파일로 교체 (PUT /api/contents/{id}/file)
↓
originalFileName = "React 강의"          (유지) ← 핵심!
uploadedFileName = "react-advanced.mp4"  ← 변경됨
storedFileName = "660e8400-...-41d4.mp4" ← 변경됨 (새 UUID)
```

### 5.4 버전 복원

```
사용자: v1으로 복원 (POST /api/contents/{id}/versions/1/restore)
↓
originalFileName = "React 강의"          (유지) ← 콘텐츠 이름 보존
uploadedFileName = "react-tutorial.mp4"  ← v1의 파일명으로 복원
storedFileName = "550e8400-...-41d4.mp4" ← v1의 UUID로 복원
```

---

## 6. DB 마이그레이션

### content 테이블

```sql
ALTER TABLE content
ADD COLUMN uploaded_file_name VARCHAR(500) AFTER original_file_name;

-- 기존 데이터: uploaded_file_name = original_file_name으로 초기화
UPDATE content SET uploaded_file_name = original_file_name WHERE uploaded_file_name IS NULL;
```

### content_version 테이블

```sql
ALTER TABLE content_version
ADD COLUMN uploaded_file_name VARCHAR(500) AFTER original_file_name;

-- 기존 데이터: uploaded_file_name = original_file_name으로 초기화
UPDATE content_version SET uploaded_file_name = original_file_name WHERE uploaded_file_name IS NULL;
```

> **참고**: JPA `@Column` 추가로 Hibernate가 자동 생성하지만, 운영 환경에서는 명시적 마이그레이션 권장

---

## 7. 프론트엔드 연동

### 타입 정의 수정 (content.types.ts)

```typescript
export interface ContentResponse {
  id: number;
  originalFileName: string;
  uploadedFileName: string;  // 추가
  storedFileName: string;
  // ...
}

export interface ContentVersionResponse {
  id: number;
  contentId: number;
  versionNumber: number;
  originalFileName: string;
  uploadedFileName: string;  // 추가
  storedFileName: string;
  // ...
}
```

### UI 표시 로직

```tsx
// 기본 정보 - 콘텐츠 이름
<p>{content.originalFileName}</p>

// 기본 정보 - 파일명 (업로드한 파일명)
{content.uploadedFileName && (
  <p>{content.uploadedFileName}</p>
)}

// 버전 카드 - 파일명
<p>{version.uploadedFileName || version.originalFileName}</p>
```

---

## 8. 관련 문서

- [Phase 1](phase1.md) - CMS 기반 구조
- [Phase 2](phase2.md) - Content API
- [Phase 3](phase3.md) - 콘텐츠 상태 관리 (Feature 1)
- [Phase 4](phase4.md) - 콘텐츠 버전 관리 (Feature 2)
- [Phase 5](phase5.md) - 강의 포함 콘텐츠 수정 제한 (Feature 3)
- [Content API 명세](../../../structure/backend/content/api.md)
- [Content DB 스키마](../../../structure/backend/content/db.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-24 | Claude Code | uploadedFileName 필드 추가 |
| 2025-12-24 | Claude Code | replaceFile() 메서드 수정 - 콘텐츠 이름 보존 |
| 2025-12-24 | Claude Code | ContentVersionServiceImpl.restoreVersion() 수정 |

---

*최종 업데이트: 2025-12-24*

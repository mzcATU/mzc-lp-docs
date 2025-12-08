# Content API 명세

> CMS (Content Management System) 모듈 API

---

## 1. 파일 업로드 API

### 1.1 파일 업로드

```http
POST /api/contents/upload
Content-Type: multipart/form-data
```

**Request**:
```
file: (binary)
folderId: 1 (optional)
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | File | O | 업로드할 파일 |
| folderId | Long | X | 저장할 폴더 ID |

**지원 파일 형식**:
| 타입 | 확장자 |
|------|--------|
| VIDEO | mp4, avi, mov, mkv, webm |
| DOCUMENT | pdf, doc, docx, ppt, pptx, xls, xlsx |
| IMAGE | jpg, jpeg, png, gif, svg, webp |
| AUDIO | mp3, wav, m4a, flac |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "contentId": 1,
    "originalFileName": "react-tutorial.mp4",
    "storedFileName": "550e8400-e29b-41d4-a716-446655440000.mp4",
    "contentType": "VIDEO",
    "fileSize": 104857600,
    "duration": 1800,
    "resolution": "1920x1080",
    "filePath": "/uploads/2025/01/550e8400-e29b-41d4-a716-446655440000.mp4",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 1.2 외부 링크 등록

```http
POST /api/contents/external-link
Content-Type: application/json
```

**Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "name": "React 튜토리얼 영상",
  "folderId": 1
}
```

**지원 외부 서비스**:
- YouTube: `youtube.com/watch?v=`, `youtu.be/`
- Vimeo: `vimeo.com/`
- Google Form: `docs.google.com/forms/`

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "contentId": 2,
    "originalFileName": "React 튜토리얼 영상",
    "contentType": "EXTERNAL_LINK",
    "externalUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "duration": 212,
    "createdAt": "2025-01-15T10:30:00"
  }
}
```

---

## 2. 콘텐츠 조회 API

### 2.1 콘텐츠 목록 조회

```http
GET /api/contents
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| folderId | Long | X | 폴더 ID (미지정 시 전체) |
| type | String | X | 콘텐츠 타입 필터 |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "contentId": 1,
        "originalFileName": "react-tutorial.mp4",
        "contentType": "VIDEO",
        "fileSize": 104857600,
        "duration": 1800,
        "resolution": "1920x1080",
        "createdAt": "2025-01-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### 2.2 콘텐츠 상세 조회

```http
GET /api/contents/{contentId}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "contentId": 1,
    "originalFileName": "react-tutorial.mp4",
    "storedFileName": "550e8400-e29b-41d4-a716-446655440000.mp4",
    "contentType": "VIDEO",
    "fileSize": 104857600,
    "duration": 1800,
    "resolution": "1920x1080",
    "pageCount": null,
    "externalUrl": null,
    "filePath": "/uploads/2025/01/550e8400-e29b-41d4-a716-446655440000.mp4",
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 2.3 콘텐츠 삭제

```http
DELETE /api/contents/{contentId}
```

**Response** (`204 No Content`)

> 파일 시스템의 실제 파일도 함께 삭제됨

---

## 3. 스트리밍/다운로드 API

### 3.1 영상 스트리밍

```http
GET /api/contents/{contentId}/stream
Range: bytes=0-1048575
```

**Response** (`206 Partial Content`):
```
Content-Type: video/mp4
Content-Range: bytes 0-1048575/104857600
Content-Length: 1048576
Accept-Ranges: bytes

(binary data)
```

> Range Request 지원으로 구간 재생 가능

### 3.2 파일 다운로드

```http
GET /api/contents/{contentId}/download
```

**Response** (`200 OK`):
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="react-tutorial.mp4"
Content-Length: 104857600

(binary data)
```

### 3.3 썸네일 조회

```http
GET /api/contents/{contentId}/thumbnail
```

**Response** (`200 OK`):
```
Content-Type: image/jpeg

(binary data)
```

> VIDEO: 영상 첫 프레임 추출
> DOCUMENT (PDF): 첫 페이지 이미지 변환

---

## 4. 메타데이터 추출

### 자동 추출 정보

| 콘텐츠 타입 | 추출 항목 | 라이브러리 |
|-------------|-----------|------------|
| VIDEO | duration, resolution | FFprobe |
| AUDIO | duration | FFprobe |
| DOCUMENT (PDF) | pageCount | Apache PDFBox |
| IMAGE | resolution | ImageIO |
| EXTERNAL_LINK (YouTube) | duration | YouTube Data API |

### 추출 예시

**VIDEO**:
```json
{
  "duration": 1800,
  "resolution": "1920x1080"
}
```

**DOCUMENT (PDF)**:
```json
{
  "pageCount": 45
}
```

**EXTERNAL_LINK (YouTube)**:
```json
{
  "duration": 212,
  "externalUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

---

## 5. 에러 응답

### 공통 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "콘텐츠를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| CONTENT_NOT_FOUND | 404 | 콘텐츠 없음 |
| UNSUPPORTED_FILE_TYPE | 400 | 지원하지 않는 파일 형식 |
| FILE_SIZE_EXCEEDED | 400 | 파일 크기 초과 |
| INVALID_EXTERNAL_URL | 400 | 지원하지 않는 외부 URL |
| FILE_UPLOAD_FAILED | 500 | 파일 업로드 실패 |
| METADATA_EXTRACTION_FAILED | 500 | 메타데이터 추출 실패 |

### 파일 크기 제한

| 타입 | 최대 크기 |
|------|----------|
| VIDEO | 2GB |
| AUDIO | 500MB |
| DOCUMENT | 100MB |
| IMAGE | 50MB |

---

## 6. 이벤트 발행

### ContentCreatedEvent

콘텐츠 업로드 완료 시 이벤트 발행:

```java
@Transactional
public Content upload(MultipartFile file, Long folderId) {
    // 1. 파일 저장
    // 2. 메타데이터 추출
    // 3. Content 엔티티 저장
    Content content = contentRepository.save(newContent);

    // 4. 이벤트 발행 → LO 모듈에서 LearningObject 자동 생성
    eventPublisher.publishEvent(new ContentCreatedEvent(content));

    return content;
}
```

---

## 7. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/content/
├── controller/
│   └── ContentController.java
├── service/
│   ├── ContentService.java
│   ├── FileStorageService.java
│   └── MetadataExtractor.java
├── repository/
│   └── ContentRepository.java
├── entity/
│   ├── Content.java
│   └── ContentType.java
├── dto/
│   ├── request/
│   └── response/
└── event/
    └── ContentCreatedEvent.java
```

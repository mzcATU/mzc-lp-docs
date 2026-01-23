# Backend CMS 모듈 - 콘텐츠 메타데이터 및 다운로드 개선 (Feature 6)

> Content Metadata Enhancement - 설명, 태그, 커스텀 썸네일, 다운로드 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-26 |
| **담당 모듈** | CMS (Content Management) |
| **관련 이슈** | [#186](https://github.com/mzcATU/mzc-lp-backend/issues/186) |
| **관련 PR** | [#190](https://github.com/mzcATU/mzc-lp-backend/pull/190) |
| **관련 브랜치** | `fix/186-upload-original-filename` |

---

## 1. 구현 개요

콘텐츠 업로드 시 추가 메타데이터 저장 및 다운로드 기능 개선:

| 기능 | 설명 |
|------|------|
| 설명(description) 필드 추가 | 콘텐츠에 대한 설명 텍스트 저장 |
| 태그(tags) 필드 추가 | 콤마로 구분된 태그 문자열 저장 |
| 커스텀 썸네일 업로드 | 사용자 지정 미리보기 이미지 업로드 |
| 다운로드 확장자 처리 개선 | 확장자 없는 파일명 처리 |
| 정적 리소스 서빙 | /uploads/** 경로 설정 |

---

## 2. 수정 파일 (10개)

### Content.java (Entity)

**추가 필드:**
```java
@Column(name = "custom_thumbnail_path", length = 1000)
private String customThumbnailPath;

@Column(name = "description", length = 500)
private String description;

@Column(name = "tags", length = 500)
private String tags;
```

**추가 메서드:**
```java
public void updateDescriptionAndTags(String description, String tags) {
    this.description = description;
    this.tags = tags;
}

public void updateCustomThumbnailPath(String customThumbnailPath) {
    this.customThumbnailPath = customThumbnailPath;
}
```

### ContentController.java

**업로드 API 파라미터 추가:**
```java
@PostMapping("/upload")
public ResponseEntity<ApiResponse<ContentResponse>> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "folderId", required = false) Long folderId,
        @RequestParam(value = "originalFileName", required = false) String originalFileName,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam(value = "tags", required = false) String tags,
        @RequestParam(value = "thumbnail", required = false) MultipartFile thumbnail,
        @AuthenticationPrincipal UserPrincipal principal
)
```

### ContentService.java / ContentServiceImpl.java

**메서드 시그니처 변경:**
```java
ContentResponse uploadFile(MultipartFile file, Long folderId, String displayName,
                          String description, String tags, MultipartFile thumbnail,
                          Long tenantId, Long userId);
```

**메타데이터 저장 로직:**
```java
// 설명, 태그 설정
content.updateDescriptionAndTags(description, tags);

// 커스텀 썸네일이 있으면 저장
if (thumbnail != null && !thumbnail.isEmpty()) {
    String customThumbnailPath = thumbnailService.storeCustomThumbnail(thumbnail);
    content.updateCustomThumbnailPath(customThumbnailPath);
} else {
    // 썸네일 자동 생성
    generateAndSetThumbnail(content, filePath, contentType);
}
```

**다운로드 확장자 처리 개선:**
```java
@Override
public ContentDownloadInfo getFileForDownload(Long contentId, Long tenantId) {
    Content content = findContentOrThrow(contentId, tenantId);

    // originalFileName에 확장자가 없으면 storedFileName에서 추출
    String originalFileName = content.getOriginalFileName();
    String extension = fileStorageService.getFileExtension(originalFileName);
    if (extension.isEmpty()) {
        extension = fileStorageService.getFileExtension(content.getStoredFileName());
    }

    String mimeType = determineMimeType(content.getContentType(), extension);

    // 다운로드 파일명에 확장자가 없으면 추가
    String downloadFileName = originalFileName;
    if (!originalFileName.contains(".") && !extension.isEmpty()) {
        downloadFileName = originalFileName + "." + extension;
    }

    return new ContentDownloadInfo(resource, downloadFileName, mimeType);
}
```

**MIME 타입 추가:**
```java
case DOCUMENT -> switch (extension) {
    case "pdf" -> "application/pdf";
    // ... 기존 코드 ...
    case "txt" -> "text/plain";
    case "csv" -> "text/csv";
    case "html", "htm" -> "text/html";
    case "xml" -> "application/xml";
    case "json" -> "application/json";
    case "zip" -> "application/zip";
    case "rar" -> "application/vnd.rar";
    case "7z" -> "application/x-7z-compressed";
    default -> "application/octet-stream";
};
```

### ThumbnailService.java / ThumbnailServiceImpl.java

**커스텀 썸네일 저장 메서드 추가:**
```java
// ThumbnailService.java
String storeCustomThumbnail(MultipartFile thumbnail);

// ThumbnailServiceImpl.java
@Override
public String storeCustomThumbnail(MultipartFile thumbnail) {
    try {
        String originalFileName = thumbnail.getOriginalFilename();
        String extension = getFileExtension(originalFileName != null ? originalFileName : "image.jpg");

        // jpg, jpeg, png만 허용
        if (!extension.matches("(?i)jpg|jpeg|png")) {
            extension = "jpg";
        }

        String outputFileName = UUID.randomUUID().toString() + "." + extension;
        Path outputPath = getThumbnailOutputPath(outputFileName);

        BufferedImage originalImage = ImageIO.read(thumbnail.getInputStream());
        if (originalImage != null) {
            BufferedImage resizedImage = resizeImage(originalImage, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
            ImageIO.write(resizedImage, extension.equalsIgnoreCase("png") ? "png" : "jpg", outputPath.toFile());
        } else {
            Files.copy(thumbnail.getInputStream(), outputPath);
        }

        String relativePath = "/uploads/thumbnails/" + getDatePath() + "/" + outputFileName;
        return relativePath;
    } catch (IOException e) {
        throw new RuntimeException("Failed to store custom thumbnail", e);
    }
}
```

### ContentResponse.java / ContentListResponse.java

**추가 필드:**
```java
String customThumbnailPath,
String description,
String tags
```

### WebConfig.java

**정적 리소스 서빙 설정:**
```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + uploadDir + "/");
}

@Override
public void addCorsMappings(CorsRegistry registry) {
    // uploads 경로에 대한 CORS 설정
    registry.addMapping("/uploads/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
}
```

### SecurityConfig.java

**정적 리소스 인증 제외:**
```java
.requestMatchers("/uploads/**").permitAll()  // 정적 리소스 (썸네일 등) 인증 없이 접근 허용
```

---

## 3. 데이터베이스 스키마 변경

### content 테이블 수정

```sql
ALTER TABLE content
ADD COLUMN custom_thumbnail_path VARCHAR(1000),
ADD COLUMN description VARCHAR(500),
ADD COLUMN tags VARCHAR(500);
```

---

## 4. API 변경

### POST /api/contents/upload

**추가 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| description | String | N | 콘텐츠 설명 |
| tags | String | N | 콤마로 구분된 태그 |
| thumbnail | MultipartFile | N | 커스텀 썸네일 이미지 |

### GET /api/contents/{id} 응답

**추가 필드:**
```json
{
  "data": {
    "id": 1,
    "originalFileName": "example.mp4",
    "customThumbnailPath": "/uploads/thumbnails/2025/12/26/abc123.jpg",
    "description": "콘텐츠 설명",
    "tags": "태그1,태그2,태그3",
    ...
  }
}
```

---

## 5. 테스트 결과

| 항목 | 결과 |
|------|------|
| 콘텐츠 업로드 시 설명, 태그 저장 | ✅ 정상 |
| 콘텐츠 상세 조회 시 설명, 태그 반환 | ✅ 정상 |
| 확장자 없는 파일명 다운로드 시 확장자 추가 | ✅ 정상 |
| /uploads/** 정적 리소스 서빙 | ✅ 설정 완료 |
| 커스텀 썸네일 표시 | ⏳ 추후 확인 필요 |

---

## 6. 관련 문서

- [Phase 1](phase1.md) - CMS 기반 구조
- [Phase 2](phase2.md) - Content API
- [Phase 3](phase3.md) - 콘텐츠 상태 관리
- [Phase 4](phase4.md) - Content 버전 관리
- [Phase 5](phase5.md) - 강의 포함 콘텐츠 수정 제한
- [Phase 6](phase6.md) - uploadedFileName 필드 추가
- [Phase 7](phase7.md) - 버전 기록 로직 수정
- [Frontend CMS Phase](../../frontend/tu/cms-phase2.md) - 프론트엔드 연동

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-26 | Claude Code | Content 메타데이터 필드 추가 (description, tags, customThumbnailPath) |
| 2025-12-26 | Claude Code | 커스텀 썸네일 업로드 기능 구현 |
| 2025-12-26 | Claude Code | 다운로드 시 확장자 없는 파일명 처리 개선 |
| 2025-12-26 | Claude Code | /uploads/** 정적 리소스 서빙 설정 |
| 2025-12-26 | Claude Code | DOCUMENT MIME 타입 추가 (txt, csv, html, xml, json, zip 등) |

---

*최종 업데이트: 2025-12-26*

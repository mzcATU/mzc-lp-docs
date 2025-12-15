# Backend CMS 썸네일 자동 생성 개발 로그

> Content 업로드 시 썸네일 자동 생성 기능

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **담당 모듈** | CMS (Content Management) |
| **GitHub Issue** | #54 |
| **브랜치** | `feat/content-thumbnail` |

---

## 1. 구현 개요

콘텐츠 업로드 시 타입에 따라 썸네일을 자동 생성하는 기능 구현:

| 콘텐츠 타입 | 썸네일 생성 방법 | 라이브러리 |
|-------------|------------------|------------|
| VIDEO | 1초 지점 프레임 추출 | FFmpeg |
| IMAGE | 원본 이미지 리사이즈 | Java ImageIO |
| DOCUMENT (PDF) | 첫 페이지 렌더링 | Apache PDFBox |
| AUDIO | 미지원 | - |
| EXTERNAL_LINK | 미지원 | - |

**썸네일 크기**: 320x180 (16:9 비율)

---

## 2. 신규 생성 파일 (3개)

### Service

| 파일 | 경로 | 설명 |
|------|------|------|
| ThumbnailService.java | `service/` | 썸네일 생성 인터페이스 |
| ThumbnailServiceImpl.java | `service/` | 썸네일 생성 구현체 |

### Test

| 파일 | 경로 | 설명 |
|------|------|------|
| ThumbnailServiceTest.java | `test/.../service/` | 썸네일 서비스 단위 테스트 |

---

## 3. 수정된 파일 (5개)

| 파일 | 변경 내용 |
|------|-----------|
| Content.java | `thumbnailPath` 필드 추가 |
| ContentResponse.java | `thumbnailPath` 필드 추가 |
| ContentListResponse.java | `thumbnailPath` 필드 추가 |
| ContentServiceImpl.java | 썸네일 자동 생성/삭제 로직 추가 |
| build.gradle | PDFBox 의존성 추가 |

---

## 4. 주요 구현 내용

### 4.1 ThumbnailService 인터페이스

```java
public interface ThumbnailService {
    Optional<String> generateThumbnail(Path sourcePath, ContentType contentType);
    Optional<String> generateVideoThumbnail(Path videoPath);
    Optional<String> generateImageThumbnail(Path imagePath);
    Optional<String> generatePdfThumbnail(Path pdfPath);
    void deleteThumbnail(String thumbnailPath);
}
```

### 4.2 동영상 썸네일 (FFmpeg)

```java
ProcessBuilder pb = new ProcessBuilder(
    ffmpegPath,
    "-i", videoPath.toString(),
    "-ss", "00:00:01",          // 1초 지점
    "-vframes", "1",            // 1프레임만
    "-vf", "scale=320:180:...", // 리사이즈
    "-y",
    outputPath.toString()
);
```

### 4.3 이미지/PDF 썸네일

- **이미지**: `ImageIO.read()` → `resizeImage()` → `ImageIO.write()`
- **PDF**: `PDFBox Loader.loadPDF()` → `PDFRenderer.renderImageWithDPI()` → `resizeImage()`

### 4.4 ContentServiceImpl 연동

```java
// 업로드 시 썸네일 생성
generateAndSetThumbnail(content, filePath, contentType);

// 파일 교체 시 기존 썸네일 삭제 후 재생성
generateAndSetThumbnail(content, newFilePath, content.getContentType());
thumbnailService.deleteThumbnail(oldThumbnailPath);

// 콘텐츠 삭제 시 썸네일 함께 삭제
thumbnailService.deleteThumbnail(content.getThumbnailPath());
```

---

## 5. 저장 경로

```
uploads/
├── 2025/12/           # 원본 파일
│   └── {uuid}.mp4
└── thumbnails/
    └── 2025/12/       # 썸네일 파일
        └── {uuid}.jpg
```

**API 응답 경로 형식**: `/uploads/thumbnails/YYYY/MM/{uuid}.jpg`

---

## 6. 의존성 추가

```gradle
// build.gradle
implementation 'org.apache.pdfbox:pdfbox:3.0.3'
```

---

## 7. 설정 값

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `file.upload-dir` | `./uploads` | 파일 저장 디렉토리 |
| `thumbnail.ffmpeg-path` | `ffmpeg` | FFmpeg 실행 경로 |

---

## 8. 테스트

### 8.1 테스트 케이스

| 테스트 | 설명 |
|--------|------|
| `generateImageThumbnail_success_jpg` | JPG 이미지 썸네일 생성 |
| `generateImageThumbnail_success_png` | PNG 이미지 썸네일 생성 |
| `generateImageThumbnail_fail_fileNotFound` | 존재하지 않는 파일 처리 |
| `generateThumbnail_image` | IMAGE 타입 썸네일 생성 |
| `generateThumbnail_externalLink` | EXTERNAL_LINK 타입 미생성 |
| `generateThumbnail_audio` | AUDIO 타입 미생성 |
| `generateThumbnail_document_nonPdf` | non-PDF DOCUMENT 미생성 |
| `deleteThumbnail_success` | 썸네일 삭제 |
| `deleteThumbnail_nullPath` | null 경로 처리 |
| `deleteThumbnail_emptyPath` | 빈 경로 처리 |

### 8.2 실행 결과

```
BUILD SUCCESSFUL in 9s
5 actionable tasks: 2 executed, 3 up-to-date
```

---

## 9. 관련 문서

| 문서 | 설명 |
|------|------|
| [api.md](../structure/backend/content/api.md) | Content API 명세 |
| [backend-cms-phase1.md](./backend-cms-phase1.md) | CMS 1차 개발 로그 |

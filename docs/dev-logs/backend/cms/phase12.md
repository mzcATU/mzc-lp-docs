# Backend CMS (Content Management System) 개발 로그 - Phase 12

> 미디어 메타데이터 자동 추출, 일괄 업로드, 파일 교체 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hseegr-mz |
| **작업 기간** | 2026-01-08 ~ 2026-01-15 |
| **담당 모듈** | CMS (Content Management System) |

---

## 1. 미디어 메타데이터 자동 추출 (#359, #360)

### 1.1 구현 배경

| 항목 | 설명 |
|------|------|
| 문제 | 콘텐츠 업로드 시 duration, pageCount, resolution 등 메타데이터를 수동 입력해야 함 |
| 원인 | 파일 업로드 시 미디어 파일 분석 로직 부재 |
| 해결 | ffprobe/PDFBox를 활용한 메타데이터 자동 추출 기능 구현 |

### 1.2 신규 서비스

#### MediaMetadataService (Interface)

```java
public interface MediaMetadataService {
    MediaMetadata extractMetadata(Path filePath, ContentType contentType);
}
```

#### MediaMetadataServiceImpl (구현체)

| 콘텐츠 타입 | 추출 도구 | 추출 정보 |
|-------------|-----------|-----------|
| VIDEO | ffprobe | duration, resolution |
| AUDIO | ffprobe | duration |
| DOCUMENT (PDF) | PDFBox | pageCount |

### 1.3 Git 커밋

```
efd2527 feat: 콘텐츠 업로드 시 미디어 메타데이터 자동 추출 (#359) (#360)
```

---

## 2. 진도율 100% 달성 시 자동 수료 처리 (#353, #356)

### 2.1 구현 배경

| 항목 | 설명 |
|------|------|
| 문제 | 학습자가 모든 학습 아이템을 완료해도 수강 완료 처리가 안 됨 |
| 원인 | 진도율 100% 달성 시 enrollment 완료 처리 로직 부재 |
| 해결 | 진도율 100% 달성 시 자동으로 enrollment 상태를 COMPLETED로 변경 |

### 2.2 수정 로직

```java
// ItemProgressServiceImpl.java
public void updateProgress(Long itemId, UpdateProgressRequest request) {
    // ... 진도 업데이트 로직 ...

    // 진도율 100% 달성 시 자동 수료 처리
    if (progressPercentage >= 100) {
        enrollment.complete();
    }
}
```

### 2.3 Git 커밋

```
8ad0932 feat: 진도율 100% 달성 시 자동 수료 처리 (#353) (#356)
```

---

## 3. 콘텐츠 다운로드 권한 체크 제거 (#374)

### 3.1 변경 내용

| 항목 | 설명 |
|------|------|
| 변경 전 | downloadable=false 콘텐츠는 다운로드 API에서 403 반환 |
| 변경 후 | 모든 콘텐츠 다운로드 허용 (downloadable 필드 체크 제거) |
| 사유 | 비즈니스 요구사항 변경 |

### 3.2 Git 커밋

```
93f315f feat: 콘텐츠 다운로드 권한 체크 제거 (#374)
```

---

## 4. 콘텐츠 일괄 업로드 기능 (#380)

### 4.1 신규 API

```
POST /api/contents/bulk-upload
```

### 4.2 요청 형식

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| files | MultipartFile[] | O | 업로드할 파일 배열 (최대 10개) |

### 4.3 응답 형식

```java
public class BulkUploadResponse {
    private int totalCount;       // 전체 업로드 시도 수
    private int successCount;     // 성공 건수
    private int failedCount;      // 실패 건수
    private List<UploadResult> results;  // 개별 결과 상세
}
```

### 4.4 제한 사항

| 항목 | 제한 |
|------|------|
| 최대 파일 수 | 10개 |
| 개별 파일 크기 | 기존 업로드 제한과 동일 |

### 4.5 Git 커밋

```
5470456 feat: 콘텐츠 일괄 업로드 기능 수정 (#380)
```

---

## 5. 파일 교체 시 contentType 자동 업데이트 (#386, #387)

### 5.1 문제 상황

```
동영상 콘텐츠(contentType=VIDEO)에서 PDF 파일로 교체
- 기존: contentType이 VIDEO로 유지됨 (버그)
- 수정: contentType이 DOCUMENT로 자동 변경됨
```

### 5.2 수정 내용

- `Content.replaceFile()` 메서드에 contentType 파라미터 추가
- 새 파일의 확장자로 contentType 자동 감지

### 5.3 Git 커밋

```
7e602c4 fix: 파일 교체 시 contentType 자동 업데이트 (#387)
```

---

## 6. 스냅샷 LO 필드 추가 (#341, #352)

### 6.1 추가된 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| downloadable | Boolean | 다운로드 허용 여부 |
| description | String | 설명 (CourseItem에서 복사) |
| pageCount | Integer | PDF 페이지 수 |

### 6.2 Git 커밋

```
2d4bb1f feat: 스냅샷 LO에 downloadable, description, pageCount 필드 추가 (#341) (#352)
```

---

## 7. 변경 이력

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-01-15 | 7e602c4 | 파일 교체 시 contentType 자동 업데이트 |
| 2026-01-13 | 5470456 | 콘텐츠 일괄 업로드 기능 |
| 2026-01-13 | 93f315f | 콘텐츠 다운로드 권한 체크 제거 |
| 2026-01-08 | efd2527 | 미디어 메타데이터 자동 추출 |
| 2026-01-08 | 8ad0932 | 진도율 100% 달성 시 자동 수료 처리 |
| 2026-01-08 | 2d4bb1f | 스냅샷 LO 필드 추가 |

---

**작성자**: hseegr-mz
**최종 수정**: 2026-01-15

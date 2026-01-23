# Backend CMS 모듈 - Preview API 분리 및 다운로드 비허용 콘텐츠 미리보기 제한 (Feature 8)

> Preview API Separation & Downloadable Content Preview Restriction

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-02 |
| **담당 모듈** | CMS (Content Management) |
| **관련 이슈 (Backend)** | [#238](https://github.com/mzcATU/mzc-lp-backend/issues/238) |
| **관련 이슈 (Frontend)** | [#164](https://github.com/mzcATU/mzc-lp-frontend/issues/164) |
| **관련 PR (Backend)** | [#247](https://github.com/mzcATU/mzc-lp-backend/pull/247) |
| **관련 PR (Frontend)** | [#183](https://github.com/mzcATU/mzc-lp-frontend/pull/183) |

---

## 1. 구현 개요

Preview API와 Download API의 downloadable 체크 로직 분리 및 프론트엔드 미리보기 UI 개선:

| 기능 | 설명 |
|------|------|
| Preview API 분리 | 미리보기 API에서 downloadable 체크 제거 (항상 허용) |
| Download API 유지 | 다운로드 API는 기존대로 downloadable=false 시 403 반환 |
| Frontend 미리보기 제한 UI | downloadable=false 콘텐츠는 모달에 제한 문구 표시 |

---

## 2. 문제 상황

### 기존 동작

```
downloadable=false 콘텐츠 미리보기 요청
  → Preview API → getFileForDownload() 호출
  → downloadable 체크 → 403 FORBIDDEN 반환
  → 프론트엔드: "미리보기를 불러올 수 없습니다" 에러 표시
```

### 문제점

1. Preview API가 Download API와 동일한 메서드(`getFileForDownload`)를 사용
2. downloadable=false 콘텐츠는 미리보기도 불가능해짐
3. 그러나 백엔드에서 미리보기를 허용하면 브라우저에서 다운로드 가능

### 해결 방향

- **백엔드**: Preview API와 Download API 분리 (미리보기는 downloadable 체크 안 함)
- **프론트엔드**: downloadable=false 콘텐츠는 미리보기 모달에서 제한 문구 표시

---

## 3. 수정 파일

### Backend (3개)

#### ContentService.java (Interface)

**메서드 추가:**
```java
/**
 * 파일 미리보기용 리소스 조회
 * (downloadable 체크 없음 - 미리보기는 다운로드 허용 여부와 무관)
 */
ContentDownloadInfo getFileForPreview(Long contentId, Long tenantId);
```

#### ContentServiceImpl.java

**getFileForPreview 메서드 구현:**
```java
@Override
public ContentDownloadInfo getFileForPreview(Long contentId, Long tenantId) {
    Content content = findContentOrThrow(contentId, tenantId);

    // 미리보기는 downloadable 체크 안 함 (다운로드 허용 여부와 무관하게 미리보기 가능)

    if (content.getFilePath() == null) {
        throw new FileStorageException(ErrorCode.FILE_NOT_FOUND,
                "No file associated with content: " + contentId);
    }

    Resource resource = fileStorageService.loadFileAsResource(content.getFilePath());

    // originalFileName에 확장자가 없으면 storedFileName에서 확장자 추출
    String originalFileName = content.getOriginalFileName();
    String extension = fileStorageService.getFileExtension(originalFileName);
    if (extension.isEmpty()) {
        extension = fileStorageService.getFileExtension(content.getStoredFileName());
    }

    String mimeType = determineMimeType(content.getContentType(), extension);

    return new ContentDownloadInfo(resource, originalFileName, mimeType);
}
```

#### ContentController.java

**Preview 엔드포인트 수정:**
```java
@GetMapping("/{contentId}/preview")
@PreAuthorize("hasAnyRole('DESIGNER', 'OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<Resource> previewContent(
        @PathVariable Long contentId,
        @AuthenticationPrincipal UserPrincipal principal
) {
    Long tenantId = TenantContext.getCurrentTenantId();
    // 미리보기는 downloadable 체크 없이 파일 반환
    ContentService.ContentDownloadInfo downloadInfo =
            contentService.getFileForPreview(contentId, tenantId);

    return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(downloadInfo.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
            .body(downloadInfo.resource());
}
```

### Frontend (3개)

#### ContentPreviewModal.tsx

**Props 추가:**
```typescript
interface ContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number | null;
  contentType: ContentType | null;
  fileName?: string;
  downloadable?: boolean;  // 신규 추가
}
```

**다운로드 비허용 콘텐츠 제한 UI:**
```tsx
// 다운로드 비허용 콘텐츠는 미리보기 제한
if (!downloadable && contentType !== 'EXTERNAL_LINK') {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Lock className="w-16 h-16 text-text-secondary" />
      <p className="text-text-primary text-lg font-medium">{fileName}</p>
      <p className="text-text-secondary text-sm text-center">
        이 콘텐츠는 미리보기가 제한되어 있습니다.
      </p>
      <p className="text-text-tertiary text-xs text-center">
        학습 페이지에서 콘텐츠를 확인하세요.
      </p>
    </div>
  );
}
```

#### MyContentPage.tsx

**previewModal 상태 업데이트:**
```typescript
const [previewModal, setPreviewModal] = useState<{
  isOpen: boolean;
  contentId: number | null;
  contentType: ContentType | null;
  fileName: string | null;
  downloadable: boolean;  // 신규 추가
}>({ isOpen: false, contentId: null, contentType: null, fileName: null, downloadable: true });

const handlePreview = (content: ContentListResponse) => {
  setPreviewModal({
    isOpen: true,
    contentId: content.id,
    contentType: content.contentType,
    fileName: content.originalFileName,
    downloadable: content.downloadable ?? true,  // downloadable 전달
  });
};
```

#### ContentDetailPage.tsx

**downloadable prop 전달:**
```tsx
<ContentPreviewModal
  isOpen={previewModal}
  onClose={() => setPreviewModal(false)}
  contentId={contentId}
  contentType={content.contentType}
  fileName={content.originalFileName}
  downloadable={content.downloadable ?? true}  // 신규 추가
/>
```

---

## 4. API 동작 비교

### Download API vs Preview API

| API | 엔드포인트 | downloadable 체크 | 용도 |
|-----|-----------|-------------------|------|
| Download | `GET /api/contents/{id}/download` | O (false면 403) | 파일 저장 |
| Preview | `GET /api/contents/{id}/preview` | X (항상 허용) | 브라우저 인라인 표시 |

### Download API (downloadable=false)

```
요청: GET /api/contents/123/download

응답: 403 Forbidden
{
  "success": false,
  "error": {
    "code": "CT011",
    "message": "Content 123 is not downloadable"
  }
}
```

### Preview API (downloadable=false)

```
요청: GET /api/contents/123/preview

응답: 200 OK
Content-Type: application/pdf
Content-Disposition: inline
(binary data)
```

---

## 5. 프론트엔드 미리보기 동작

### downloadable=true 콘텐츠

```
미리보기 버튼 클릭
  → ContentPreviewModal 열림
  → Preview API 호출
  → 콘텐츠 표시 (PDF iframe, 이미지, 비디오 등)
  → 다운로드 버튼 표시
```

### downloadable=false 콘텐츠

```
미리보기 버튼 클릭
  → ContentPreviewModal 열림
  → downloadable=false 확인
  → 제한 UI 표시 (Lock 아이콘 + 안내 문구)
  → Preview API 호출하지 않음
```

---

## 6. 테스트 결과

| 항목 | 결과 |
|------|------|
| downloadable=true 미리보기 | ✅ 정상 표시 |
| downloadable=false 미리보기 | ✅ 제한 UI 표시 |
| downloadable=true 다운로드 | ✅ 정상 다운로드 |
| downloadable=false 다운로드 | ✅ 403 반환 |
| EXTERNAL_LINK 콘텐츠 | ✅ 정상 (downloadable 무관) |
| PDF 인라인 미리보기 | ✅ 정상 |

---

## 7. 관련 문서

- [Phase 9](phase9.md) - 다운로드 허용 옵션 추가
- [Content API 명세](../../../structure/backend/content/api.md)
- [Content DB 스키마](../../../structure/backend/content/db.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-02 | Claude Code | ContentService.getFileForPreview() 메서드 추가 |
| 2026-01-02 | Claude Code | ContentController preview 엔드포인트 수정 |
| 2026-01-02 | Claude Code | ContentPreviewModal downloadable prop 추가 |
| 2026-01-02 | Claude Code | MyContentPage/ContentDetailPage downloadable 전달 |

---

*최종 업데이트: 2026-01-02*

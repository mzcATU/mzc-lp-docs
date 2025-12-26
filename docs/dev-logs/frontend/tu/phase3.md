# Frontend TU (Tenant User) 개발 로그 - Phase 3

> 콘텐츠 메타데이터 업로드 및 다운로드 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-26 |
| **관련 이슈** | [#53](https://github.com/mzcATU/mzc-lp-frontend/issues/53) |
| **관련 PR** | [#66](https://github.com/mzcATU/mzc-lp-frontend/pull/66) |
| **관련 브랜치** | `fix/53-download-preview-error` |
| **담당 모듈** | TU (Tenant User) - Content Management |

---

## 1. 구현 개요

| 기능 | 설명 |
|------|------|
| 메타데이터 업로드 지원 | description, tags, thumbnail 파라미터 전송 |
| 다운로드 Content-Type 처리 | Blob 생성 시 응답 Content-Type 사용 |
| 타입 정의 확장 | ContentResponse, ContentListResponse에 새 필드 추가 |
| 썸네일 URL 처리 | customThumbnailPath 우선 표시 로직 |

---

## 2. 수정 파일 (4개)

### 2.1 content.types.ts

**경로:** `src/types/tu/content.types.ts`

**추가 필드:**
```typescript
// ContentResponse
export interface ContentResponse {
  // ... 기존 필드 ...
  customThumbnailPath: string | null;
  description: string | null;
  tags: string | null;
}

// ContentListResponse
export interface ContentListResponse {
  // ... 기존 필드 ...
  customThumbnailPath: string | null;
  description: string | null;
  tags: string | null;
}
```

---

### 2.2 contentService.ts

**경로:** `src/services/tu/contentService.ts`

#### 변경 1: UploadFileOptions 인터페이스 확장

```typescript
interface UploadFileOptions {
  folderId?: number;
  originalFileName?: string;
  description?: string;      // 추가
  tags?: string;             // 추가
  thumbnail?: File;          // 추가
}
```

#### 변경 2: uploadFile 함수 수정

```typescript
async uploadFile(file: File, options?: UploadFileOptions): Promise<ContentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (options?.folderId) {
    formData.append('folderId', String(options.folderId));
  }
  if (options?.originalFileName) {
    formData.append('originalFileName', options.originalFileName);
  }
  if (options?.description) {
    formData.append('description', options.description);
  }
  if (options?.tags) {
    formData.append('tags', options.tags);
  }
  if (options?.thumbnail) {
    formData.append('thumbnail', options.thumbnail);
  }

  const { data } = await axiosInstance.post<{ data: ContentResponse }>(
    API_ENDPOINTS.CONTENTS.UPLOAD,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data.data;
}
```

#### 변경 3: downloadFile 함수 - Content-Type 처리

```typescript
async downloadFile(id: number, fileName: string): Promise<void> {
  const response = await axiosInstance.get(
    API_ENDPOINTS.CONTENTS.DOWNLOAD(id),
    { responseType: 'blob' }
  );

  // 응답의 Content-Type을 사용하여 Blob 생성
  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
```

---

### 2.3 ContentCard.tsx

**경로:** `src/components/domain/tu/content/ContentCard.tsx`

**썸네일 URL 결정 로직:**
```typescript
// 썸네일 URL 결정: prop > customThumbnailPath > thumbnailPath
const resolvedThumbnailUrl = thumbnailUrl
  || (content.customThumbnailPath
      ? `${import.meta.env.VITE_API_BASE_URL || ''}${content.customThumbnailPath}`
      : null)
  || (content.thumbnailPath
      ? `${import.meta.env.VITE_API_BASE_URL || ''}${content.thumbnailPath}`
      : null);
```

**우선순위:**
1. `thumbnailUrl` prop (외부에서 전달)
2. `customThumbnailPath` (사용자 지정 썸네일)
3. `thumbnailPath` (자동 생성 썸네일)

---

### 2.4 ContentDetailPage.tsx

**경로:** `src/pages/tu/teaching/content/ContentDetailPage.tsx`

**설명/태그 표시:**
```tsx
{/* Description */}
{content.description && (
  <div>
    <dt className="text-sm font-medium text-text-secondary">
      {getText('description')}
    </dt>
    <dd className="text-sm text-text-primary mt-1">
      {content.description}
    </dd>
  </div>
)}

{/* Tags */}
{content.tags && (
  <div>
    <dt className="text-sm font-medium text-text-secondary">
      {getText('tags')}
    </dt>
    <dd className="text-sm text-text-primary mt-1">
      {content.tags}
    </dd>
  </div>
)}
```

---

## 3. 다운로드 문제 해결

### 문제
- PDF 파일이 `.txt` 확장자로 다운로드됨
- 파일 형식이 올바르게 인식되지 않음

### 원인
- `originalFileName`이 확장자 없이 저장됨 (예: "영상 테스트")
- Blob 생성 시 Content-Type을 지정하지 않아 브라우저가 임의로 처리

### 해결
1. **백엔드**: `storedFileName`에서 확장자 추출하여 다운로드 파일명에 추가
2. **프론트엔드**: 응답 헤더의 `Content-Type`을 사용하여 Blob 생성

```typescript
// 변경 전
const blob = new Blob([response.data]);

// 변경 후
const contentType = response.headers['content-type'] || 'application/octet-stream';
const blob = new Blob([response.data], { type: contentType });
```

---

## 4. 테스트 결과

| 항목 | 결과 |
|------|------|
| 콘텐츠 업로드 시 description, tags 전송 | ✅ 정상 |
| 콘텐츠 상세 페이지에서 description, tags 표시 | ✅ 정상 |
| PDF 파일 다운로드 | ✅ 정상 (올바른 확장자) |
| MP4 파일 다운로드 | ✅ 정상 (올바른 확장자) |
| 커스텀 썸네일 표시 | ⏳ 추후 확인 필요 |

---

## 5. 관련 문서

- [Backend Phase 8](../../backend/cms/phase8.md) - 콘텐츠 메타데이터 및 다운로드 개선
- [Frontend Phase 1](phase1.md) - TU 콘텐츠 관리 기본 구조
- [Frontend Phase 2](phase2.md) - 버전 히스토리 개선

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-26 | Claude Code | 메타데이터 업로드 파라미터 추가 (description, tags, thumbnail) |
| 2025-12-26 | Claude Code | 다운로드 Blob Content-Type 처리 개선 |
| 2025-12-26 | Claude Code | ContentResponse/ListResponse 타입 확장 |
| 2025-12-26 | Claude Code | ContentCard 썸네일 URL 결정 로직 추가 |

---

*최종 업데이트: 2025-12-26*

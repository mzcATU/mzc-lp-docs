# Frontend TU (Tenant User) 개발 로그 - Phase 17

> 학습 플레이어 콘텐츠 스트리밍 및 외부링크 연동

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-06 ~ 2026-01-07 |
| **관련 이슈** | [#260](https://github.com/mzcATU/mzc-lp-frontend/issues/260) |
| **관련 PR** | [#332](https://github.com/mzcATU/mzc-lp-frontend/pull/332) |
| **관련 브랜치** | feat/260-learning-player-api |
| **담당 모듈** | TU (Tenant User) - Learning Player |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 학습 플레이어에서 콘텐츠(비디오, 문서, 이미지)가 실제로 표시되지 않음 |
| 원인 | 백엔드 스트리밍 API가 학습자용으로 구현되지 않았고, 외부링크 URL이 스냅샷에 저장되지 않음 |
| 해결 | 백엔드 학습자용 스트리밍 API 연동, 외부링크 스냅샷 저장, 이미지 뷰어 배경색 수정 |

### 1.2 구현 범위

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| 비디오 플레이어 | VideoPlayer.tsx | Blob URL 기반 인증 스트리밍 구현 |
| 문서 뷰어 | DocumentViewer.tsx | Blob URL 기반 문서/이미지 표시, 이미지 배경 흰색 |
| 외부링크 뷰어 | ExternalLinkViewer.tsx | 스냅샷 externalUrl 기반 표시 |
| 메인 페이지 | LearningPlayerPage.tsx | externalUrl 상태 관리 추가 |
| 사이드바 | CurriculumSidebar.tsx | onItemSelect에 externalUrl 파라미터 추가 |
| 타입 | snapshot.types.ts | externalUrl 필드 추가 |

---

## 2. 상세 변경 사항

### 2.1 VideoPlayer.tsx - Blob URL 스트리밍

#### 구현 방식
```typescript
// 인증 토큰을 포함한 Blob URL 생성
useEffect(() => {
  if (externalUrl || !contentId) return;

  const fetchVideoBlob = async () => {
    const url = isLearnerMode
      ? contentService.getLearnerStreamUrl(contentId)
      : contentService.getStreamUrl(contentId);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const blob = await response.blob();
    const blobObjectUrl = URL.createObjectURL(blob);
    setBlobUrl(blobObjectUrl);
  };

  fetchVideoBlob();

  return () => {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
    }
  };
}, [contentId, externalUrl, isLearnerMode, accessToken]);
```

#### 렌더링 분기
- **외부 URL (MP4)**: HTML5 `<video>` 태그 사용
- **외부 URL (YouTube 등)**: ReactPlayer 사용
- **내부 콘텐츠**: Blob URL + HTML5 `<video>` 태그

### 2.2 DocumentViewer.tsx - 이미지 뷰어 개선

#### 배경색 변경
```typescript
// 이미지 뷰어 - 흰색 배경
{isImage && documentUrl && (
  <div className="w-full h-full flex items-center justify-center p-4 bg-white">
    <img src={documentUrl} ... />
  </div>
)}
```

### 2.3 외부링크 스냅샷 연동

#### snapshot.types.ts
```typescript
export interface SnapshotLearningObjectResponse {
  // 기존 필드...
  externalUrl: string | null; // 추가
}
```

#### LearningPlayerPage.tsx
```typescript
// 외부링크 URL 상태 추가
const [currentExternalUrl, setCurrentExternalUrl] = useState<string | null>(null);

// 아이템 선택 핸들러
const handleItemSelect = useCallback((
  itemId: number,
  contentId: number,
  contentType: PlayerContentType,
  externalUrl?: string | null  // 추가
) => {
  setCurrentExternalUrl(externalUrl || null);
  // ...
}, [...]);
```

---

## 3. 백엔드 연동 (별도 PR)

### 3.1 학습자용 스트리밍 API

| API | 엔드포인트 | 설명 |
|-----|-----------|------|
| 스트리밍 | GET `/api/learner/contents/{id}/stream` | 학습자 콘텐츠 스트리밍 |
| 미리보기 | GET `/api/learner/contents/{id}/preview` | 학습자 콘텐츠 미리보기 |

### 3.2 외부링크 스냅샷 저장

| 엔티티 | 필드 | 설명 |
|--------|------|------|
| SnapshotLearningObject | externalUrl | VARCHAR(2000), 외부링크 URL 저장 |

#### SQL 마이그레이션 (기존 데이터)
```sql
UPDATE cm_snapshot_los slo
JOIN content c ON c.id = slo.content_id
SET slo.external_url = c.external_url
WHERE slo.external_url IS NULL;
```

---

## 4. 알려진 이슈

### 4.1 PDF 표시 불가 (TODO)

| 항목 | 상태 |
|------|------|
| 문제 | PDF 문서가 학습 플레이어에서 표시되지 않음 |
| 시도 | iframe, embed, object 태그, PDF.js 등 시도 |
| 결과 | 모두 실패 (브라우저 보안 정책 관련 추정) |
| 임시 조치 | PDF는 다운로드 후 별도 뷰어로 확인 필요 |
| 향후 | PDF.js 라이브러리 본격 적용 예정 |

---

## 5. 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/tu/learning/LearningPlayerPage.tsx` | externalUrl 상태 관리, 미사용 변수 정리 |
| `src/pages/tu/learning/LearningDetailPage.tsx` | 미사용 타입 제거 |
| `src/pages/tu/learning/components/VideoPlayer.tsx` | Blob URL 스트리밍, 미사용 코드 정리 |
| `src/pages/tu/learning/components/DocumentViewer.tsx` | 이미지 배경 흰색, 미사용 파라미터 제거 |
| `src/pages/tu/learning/components/ExternalLinkViewer.tsx` | 미사용 파라미터 제거 |
| `src/pages/tu/learning/components/CurriculumSidebar.tsx` | onItemSelect에 externalUrl 추가 |
| `src/types/common/snapshot.types.ts` | externalUrl 필드 추가 |
| `src/services/tu/contentService.ts` | getLearnerStreamUrl, getLearnerPreviewUrl 추가 |

---

## 6. 테스트 결과

### 6.1 TypeScript 컴파일

```bash
$ npx tsc --noEmit
# No errors
```

### 6.2 기능 테스트

| 콘텐츠 타입 | 상태 | 비고 |
|------------|------|------|
| VIDEO | ✅ 동작 | Blob URL 스트리밍 |
| IMAGE | ✅ 동작 | 흰색 배경 적용 |
| DOCUMENT (TXT) | ✅ 동작 | iframe 표시 |
| DOCUMENT (PDF) | ❌ 미동작 | TODO |
| EXTERNAL_LINK | ✅ 동작 | YouTube 등 재생 |

---

## 7. PR 정보

### 7.1 Frontend PR #332

- **제목**: feat(tu): 학습 플레이어 콘텐츠 스트리밍 연동
- **TODO**:
  - PDF 문서 표시 오류 수정 예정
  - 콘텐츠 다운로드 허용 데이터에 따른 버튼 숨김 처리 예정

### 7.2 Backend PR #338

- **제목**: feat(learner): 학습자용 콘텐츠 스트리밍 API
- **이슈 연결**: Closes #303

---

**작성자**: Claude Code
**최종 수정**: 2026-01-07

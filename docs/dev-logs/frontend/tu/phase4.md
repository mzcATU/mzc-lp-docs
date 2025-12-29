# Frontend TU (Tenant User) 개발 로그 - Phase 4

> LO 폴더 이동 기능 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-29 |
| **관련 이슈** | - |
| **관련 브랜치** | `feature/lo-folder-management` |
| **담당 모듈** | TU (Tenant User) - Content Management |

---

## 1. 구현 개요

| 기능 | 설명 |
|------|------|
| 콘텐츠 다중 선택 | 체크박스로 여러 콘텐츠 선택 |
| 폴더 선택 모달 | 이동할 폴더를 선택하는 모달 UI |
| LO 폴더 이동 API 연동 | PUT `/api/learning-objects/{id}/folder` |
| 폴더 트리 조회 연동 | GET `/api/content-folders/tree` |

---

## 2. 신규 파일 (1개)

### 2.1 FolderSelectModal.tsx

**경로:** `src/components/domain/tu/content/FolderSelectModal.tsx`

**주요 기능:**
- 폴더 트리 조회 및 표시
- 폴더 선택 UI (라디오 버튼 스타일)
- "최상위로 이동" 옵션 지원
- 다국어 지원 (한국어/영어)

```tsx
interface FolderSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: number | null) => void;
  selectedCount: number;
  isMoving: boolean;
  language: 'ko' | 'en';
}
```

**폴더 트리 렌더링:**
```tsx
const renderFolderTree = (folders: ContentFolderTreeResponse[], depth = 0) => {
  return folders.map((folder) => (
    <div key={folder.id}>
      <button
        onClick={() => setSelectedFolderId(folder.id)}
        className={`w-full text-left px-3 py-2 rounded-lg ${
          selectedFolderId === folder.id
            ? 'bg-primary-100 text-primary-700'
            : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <FolderIcon className="w-4 h-4 inline mr-2" />
        {folder.name}
        <span className="text-gray-400 text-sm ml-2">
          ({folder.itemCount}개)
        </span>
      </button>
      {folder.children && renderFolderTree(folder.children, depth + 1)}
    </div>
  ));
};
```

---

## 3. 수정 파일 (2개)

### 3.1 learningObjectService.ts

**경로:** `src/services/tu/learningObjectService.ts`

#### 변경 1: PATCH → PUT 메서드 변경

```typescript
// Before
async moveToFolder(id: number, request: MoveFolderRequest): Promise<LearningObjectResponse> {
  const { data } = await axiosInstance.patch<LearningObjectResponse>(
    API_ENDPOINTS.LEARNING_OBJECTS.FOLDER(id),
    request
  );
  return data;
}

// After
async moveToFolder(id: number, request: MoveFolderRequest): Promise<LearningObjectResponse> {
  const { data } = await axiosInstance.put<{ data: LearningObjectResponse }>(
    API_ENDPOINTS.LEARNING_OBJECTS.FOLDER(id),
    request
  );
  return data.data;
}
```

#### 변경 2: ApiResponse wrapper 처리

모든 LO API 응답에서 `data.data` 패턴 적용:

```typescript
// 다른 메서드들도 동일하게 수정
async update(id: number, request: UpdateLearningObjectRequest): Promise<LearningObjectResponse> {
  const { data } = await axiosInstance.put<{ data: LearningObjectResponse }>(
    API_ENDPOINTS.LEARNING_OBJECTS.DETAIL(id),
    request
  );
  return data.data;
}
```

---

### 3.2 MyContentPage.tsx

**경로:** `src/pages/tu/teaching/content/MyContentPage.tsx`

#### 변경 1: 선택 상태 관리

```typescript
const [selectedContentIds, setSelectedContentIds] = useState<Set<number>>(new Set());
const [isFolderSelectModalOpen, setIsFolderSelectModalOpen] = useState(false);
const [isMoving, setIsMoving] = useState(false);
```

#### 변경 2: 체크박스 UI 추가

```tsx
{/* 전체 선택 체크박스 */}
<input
  type="checkbox"
  checked={selectedContentIds.size === contents.length && contents.length > 0}
  onChange={handleSelectAll}
/>

{/* 개별 콘텐츠 체크박스 */}
<input
  type="checkbox"
  checked={selectedContentIds.has(content.id)}
  onChange={() => handleSelectContent(content.id)}
/>
```

#### 변경 3: 폴더 이동 핸들러

```typescript
const handleMoveToFolder = async (targetFolderId: number | null) => {
  setIsMoving(true);
  try {
    // 선택된 콘텐츠들의 LO ID 조회 후 이동
    for (const contentId of selectedContentIds) {
      const lo = await learningObjectService.getByContentId(contentId);
      await learningObjectService.moveToFolder(lo.id, { folderId: targetFolderId });
    }

    // 캐시 무효화 및 새로고침
    queryClient.invalidateQueries({ queryKey: ['myContents'] });
    queryClient.invalidateQueries({ queryKey: ['contentFolders'] });

    setSelectedContentIds(new Set());
    setIsFolderSelectModalOpen(false);
  } catch (error) {
    console.error('폴더 이동 실패:', error);
  } finally {
    setIsMoving(false);
  }
};
```

#### 변경 4: 폴더 이동 버튼

```tsx
{selectedContentIds.size > 0 && (
  <button
    onClick={() => setIsFolderSelectModalOpen(true)}
    className="px-4 py-2 bg-primary-600 text-white rounded-lg"
  >
    {getText('moveToFolder')} ({selectedContentIds.size})
  </button>
)}
```

---

## 4. API 변경 사항

### 4.1 HTTP 메서드 변경 (PATCH → PUT)

| Before | After | 사유 |
|--------|-------|------|
| PATCH `/api/learning-objects/{id}` | PUT | CORS 이슈, 팀 컨벤션 |
| PATCH `/api/learning-objects/{id}/folder` | PUT | CORS 이슈, 팀 컨벤션 |

### 4.2 응답 구조 수정

백엔드 ApiResponse wrapper 패턴에 맞게 프론트엔드 처리:

```typescript
// 응답 구조: { data: T }
const { data } = await axiosInstance.put<{ data: LearningObjectResponse }>(...);
return data.data;  // 실제 데이터 반환
```

---

## 5. 사용 흐름

```
1. MyContentPage에서 콘텐츠 선택 (체크박스)
     ↓
2. "폴더로 이동" 버튼 클릭
     ↓
3. FolderSelectModal 열림
     ↓
4. 폴더 트리에서 대상 폴더 선택
     ↓
5. "이동" 버튼 클릭
     ↓
6. Content ID → LO ID 조회 (getByContentId)
     ↓
7. LO 폴더 이동 API 호출 (moveToFolder)
     ↓
8. React Query 캐시 무효화
     ↓
9. 목록 새로고침
```

---

## 6. 테스트 결과

| 항목 | 결과 |
|------|------|
| 콘텐츠 다중 선택 | ✅ 정상 |
| 폴더 선택 모달 표시 | ✅ 정상 |
| 폴더 트리 조회 | ✅ 정상 |
| 폴더 이동 API 호출 | ✅ 정상 |
| 이동 후 목록 새로고침 | ✅ 정상 |
| "최상위로 이동" 기능 | ✅ 정상 |

---

## 7. 관련 문서

- [Backend LO Phase 1](../../backend/lo/phase1.md) - LO 모듈 API
- [Frontend Phase 3](phase3.md) - 메타데이터 업로드/다운로드 개선

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-29 | Claude Code | FolderSelectModal 컴포넌트 신규 작성 |
| 2025-12-29 | Claude Code | learningObjectService PATCH → PUT 변경 |
| 2025-12-29 | Claude Code | learningObjectService ApiResponse wrapper 처리 |
| 2025-12-29 | Claude Code | MyContentPage 다중 선택 및 폴더 이동 기능 추가 |

---

*최종 업데이트: 2025-12-29*

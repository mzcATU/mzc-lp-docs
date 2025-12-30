# Frontend TU (Tenant User) 개발 로그 - Phase 5

> 폴더 CRUD 에러 처리 개선 및 삭제 시 LO 미분류 이동

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-29 |
| **관련 이슈** | - |
| **관련 브랜치** | `feat/85-content-folder-management` (FE), `feat/203-content-folder-filter` (BE) |
| **담당 모듈** | TU (Tenant User) - Content Folder Management |

---

## 1. 구현 개요

| 기능 | 설명 |
|------|------|
| 폴더 CRUD 에러 메시지 표시 | 생성/수정/삭제 실패 시 사용자에게 에러 메시지 표시 |
| 폴더 삭제 시 LO 미분류 이동 | 삭제 전 폴더 내 LO를 자동으로 미분류(root)로 이동 |
| 삭제 확인 메시지 개선 | "빈 폴더만 삭제 가능" → "LO가 미분류로 이동됨" |

---

## 2. 백엔드 수정 (1개 파일)

### 2.1 ContentFolderServiceImpl.java

**경로:** `src/main/java/com/mzc/lp/domain/learning/service/ContentFolderServiceImpl.java`

#### 변경 1: 삭제 로직 수정

기존에는 폴더가 비어있지 않으면 `FOLDER_NOT_EMPTY` 에러를 던졌지만, 이제 LO를 미분류로 이동 후 삭제:

```java
// Before
@Override
@Transactional
public void delete(Long id, Long tenantId) {
    ContentFolder folder = findFolderOrThrow(id, tenantId);

    if (!folder.isEmpty()) {
        throw new BusinessException(ErrorCode.FOLDER_NOT_EMPTY,
                "Folder contains items. Please delete or move items first.");
    }

    contentFolderRepository.delete(folder);
}

// After
@Override
@Transactional
public void delete(Long id, Long tenantId) {
    ContentFolder folder = findFolderOrThrow(id, tenantId);

    // 폴더 내 LO들을 미분류(root)로 이동
    moveAllLearningObjectsToRoot(folder);

    contentFolderRepository.delete(folder);
    log.info("ContentFolder deleted: id={}, LOs moved to root", id);
}
```

#### 변경 2: 재귀적 LO 이동 메서드 추가

```java
/**
 * 폴더와 모든 하위 폴더의 LO를 미분류(root)로 이동
 */
private void moveAllLearningObjectsToRoot(ContentFolder folder) {
    // 현재 폴더의 LO들을 미분류로 이동
    for (var lo : folder.getLearningObjects()) {
        lo.moveToRoot();
    }

    // 하위 폴더의 LO들도 재귀적으로 이동
    for (ContentFolder child : folder.getChildren()) {
        moveAllLearningObjectsToRoot(child);
    }
}
```

---

## 3. 프론트엔드 수정 (2개 파일)

### 3.1 FolderManagementPanel.tsx

**경로:** `src/components/domain/tu/folder/FolderManagementPanel.tsx`

#### 변경 1: 에러 상태 관리 추가

```typescript
const [errorMessage, setErrorMessage] = useState<string | null>(null);

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { code?: string } } }).response;
    const code = response?.data?.code;
    if (code === 'LO004') return getText('folderNotEmpty');
    if (code === 'LO003') return getText('duplicateName');
  }
  return getText('unknownError');
};
```

#### 변경 2: 에러 메시지 다국어 지원

```typescript
const t = {
  // ... 기존 번역
  deleteConfirm: {
    ko: '이 폴더를 삭제하시겠습니까?',
    en: 'Delete this folder?',
  },
  deleteConfirmDetail: {
    ko: '하위 폴더도 함께 삭제되고, 폴더 내 콘텐츠는 미분류로 이동됩니다.',
    en: 'Subfolders will be deleted and contents will be moved to uncategorized.',
  },
  folderNotEmpty: {
    ko: '폴더에 콘텐츠가 있어 삭제할 수 없습니다. 먼저 콘텐츠를 이동하거나 삭제해주세요.',
    en: 'Cannot delete folder with contents. Please move or delete contents first.',
  },
  duplicateName: {
    ko: '같은 위치에 동일한 이름의 폴더가 있습니다.',
    en: 'A folder with this name already exists in this location.',
  },
  unknownError: {
    ko: '오류가 발생했습니다. 다시 시도해주세요.',
    en: 'An error occurred. Please try again.',
  },
};
```

#### 변경 3: 에러 처리 로직 추가

```typescript
const handleConfirmCreate = async () => {
  if (modalState.type !== 'create' || !folderName.trim()) return;

  try {
    setErrorMessage(null);
    await createFolder.mutateAsync({...});
    setModalState({ type: 'none' });
  } catch (error) {
    console.error('Failed to create folder:', error);
    setErrorMessage(getErrorMessage(error));
  }
};
```

#### 변경 4: 에러 메시지 UI 표시

```tsx
{/* 다이얼로그 내 에러 메시지 */}
{errorMessage && (
  <p className="text-sm text-status-error">{errorMessage}</p>
)}
```

### 3.2 MyAssignmentsPage.tsx

**경로:** `src/pages/tu/teaching/assignments/MyAssignmentsPage.tsx`

#### 변경: 삭제된 DevLoginButton import 제거

```typescript
// Before
import { DevLoginButton } from '@/components/dev/DevLoginButton';
// <DevLoginButton /> 사용

// After
// import 및 사용 제거 (파일이 삭제됨)
```

---

## 4. 동작 변경 사항

### 4.1 폴더 삭제 흐름

```
Before:
1. 폴더 삭제 요청
2. 폴더에 LO나 하위 폴더 있으면 → 400 FOLDER_NOT_EMPTY 에러
3. 사용자가 직접 LO 이동/삭제 필요

After:
1. 폴더 삭제 요청
2. 폴더 내 모든 LO를 미분류(folder=null)로 이동
3. 하위 폴더의 LO도 재귀적으로 미분류 이동
4. 폴더 삭제 (하위 폴더는 cascade로 함께 삭제)
5. 성공 반환
```

### 4.2 에러 코드 매핑

| 백엔드 코드 | 프론트엔드 메시지 |
|-------------|------------------|
| `LO003` | "같은 위치에 동일한 이름의 폴더가 있습니다." |
| `LO004` | "폴더에 콘텐츠가 있어 삭제할 수 없습니다..." (이제 발생 안 함) |
| 기타 | "오류가 발생했습니다. 다시 시도해주세요." |

---

## 5. 테스트 결과

| 항목 | 결과 |
|------|------|
| 빈 폴더 삭제 | ✅ 정상 |
| LO 있는 폴더 삭제 | ✅ LO 미분류 이동 후 삭제 |
| 하위 폴더 있는 폴더 삭제 | ✅ 하위 폴더 LO도 미분류 이동 |
| 폴더 생성 중복명 에러 | ✅ 에러 메시지 표시 |
| 폴더 수정 중복명 에러 | ✅ 에러 메시지 표시 |

---

## 6. 관련 문서

- [Frontend Phase 4](phase4.md) - LO 폴더 이동 기능
- [Backend LO Phase 1](../../backend/lo/phase1.md) - LO 모듈 API

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-29 | Claude Code | ContentFolderServiceImpl 삭제 로직 수정 (LO 미분류 이동) |
| 2025-12-29 | Claude Code | FolderManagementPanel 에러 처리 및 메시지 표시 추가 |
| 2025-12-29 | Claude Code | MyAssignmentsPage DevLoginButton 제거 |

---

*최종 업데이트: 2025-12-29*

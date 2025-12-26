# Frontend TU (Tenant User) 개발 로그 - Phase 2

> 콘텐츠 상세 페이지 버전 히스토리 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-26 |
| **관련 이슈** | #51 |
| **관련 브랜치** | `fix/51-external-link-version-history` |
| **담당 모듈** | TU (Tenant User) - Content Detail |

---

## 1. 구현 개요

### 해결한 문제

1. **외부 링크 콘텐츠 버전 히스토리 미표시**
   - 외부 링크(EXTERNAL_LINK) 타입 콘텐츠의 상세 페이지에서 버전 히스토리가 표시되지 않음
   - 원인: `!isExternalLink` 조건으로 버전 히스토리 섹션 숨김

2. **버전 카드 정보 부족**
   - 버전 카드에 콘텐츠 이름 또는 파일명 중 하나만 표시
   - 기본정보와 버전 기록 간 정보 불일치

---

## 2. 수정 파일

### 2.1 ContentDetailPage.tsx

**경로:** `src/pages/tu/teaching/content/ContentDetailPage.tsx`

#### 변경 1: 버전 히스토리 섹션 조건 제거

**변경 전:**
```tsx
{/* Version History Section */}
{!isExternalLink && (
  <div className="bg-bg-default border border-border rounded-lg p-6">
    ...
  </div>
)}
```

**변경 후:**
```tsx
{/* Version History Section */}
<div className="bg-bg-default border border-border rounded-lg p-6">
  ...
</div>
```

#### 변경 2: VersionCard에 isExternalLink prop 추가

```tsx
<VersionCard
  key={version.id}
  version={version}
  isCurrentVersion={version.versionNumber === content.currentVersion}
  isExternalLink={isExternalLink}  // 추가
  getText={getText}
  onRestore={() => handleVersionRestore(version.versionNumber)}
  isRestoring={restoreVersion.isPending}
/>
```

#### 변경 3: VersionCard 컴포넌트 수정

**Props 인터페이스:**
```tsx
interface VersionCardProps {
  version: ContentVersionResponse;
  isCurrentVersion: boolean;
  isExternalLink: boolean;  // 추가
  getText: (key: keyof typeof t) => string;
  onRestore: () => void;
  isRestoring: boolean;
}
```

**버전 정보 표시:**
```tsx
{/* 콘텐츠 이름 */}
<p className="text-sm text-text-primary mb-1">
  {version.originalFileName}
</p>

{/* 업로드 파일명 (외부 링크 제외) */}
{!isExternalLink && version.uploadedFileName && (
  <p className="text-xs text-text-secondary mb-1">
    {version.uploadedFileName}
  </p>
)}

{/* 파일 크기 (외부 링크 제외) */}
{!isExternalLink && version.fileSize && (
  <p className="text-xs text-text-secondary mb-1">
    {formatFileSize(version.fileSize)}
  </p>
)}
```

---

## 3. 변경 전후 비교

### 3.1 외부 링크 콘텐츠

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 버전 히스토리 표시 | ❌ 숨김 | ✅ 표시 |
| 파일 크기 표시 | - | ❌ 숨김 (해당 없음) |
| 업로드 파일명 표시 | - | ❌ 숨김 (해당 없음) |

### 3.2 일반 콘텐츠 (파일 업로드)

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 콘텐츠 이름 | `uploadedFileName \|\| originalFileName` | `originalFileName` |
| 업로드 파일명 | 표시 안 됨 | `uploadedFileName` (별도 라인) |
| 파일 크기 | ✅ 표시 | ✅ 표시 |

---

## 4. UI 결과

### 버전 카드 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ v12  [현재 버전]  [파일 교체]      [이 버전으로 복원] │
│                                                     │
│ v2 수정 - 6                    ← 콘텐츠 이름        │
│ temp_project - Chrome 2025...  ← 업로드 파일명      │
│ 2.9 MB                         ← 파일 크기          │
│ Restored from v3               ← 변경 내용          │
│ 2025. 12. 26. 오후 01:22       ← 생성일시           │
└─────────────────────────────────────────────────────┘
```

---

## 5. 관련 백엔드 수정

### 이슈 #180 (mzc-lp-backend)

버전 기록 시 변경 후 상태 저장으로 수정하여 프론트엔드에서 표시되는 정보와 실제 콘텐츠 정보가 일치하도록 함.

자세한 내용은 `docs/dev-logs/backend/cms/phase7.md` 참조.

---

## 6. 테스트 결과

| 테스트 케이스 | 결과 |
|---------------|------|
| 외부 링크 콘텐츠 버전 히스토리 표시 | ✅ |
| 일반 콘텐츠 버전 카드에 이름/파일명 둘 다 표시 | ✅ |
| 외부 링크 버전 카드에 파일 크기 숨김 | ✅ |
| 버전 복원 후 기본정보와 현재 버전 일치 | ✅ |

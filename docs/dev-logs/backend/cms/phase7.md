# Backend CMS 모듈 - 버전 기록 로직 수정 (Feature 5)

> 버전 기록 시 변경 후 상태 저장으로 수정

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-26 |
| **담당 모듈** | CMS (Content Management) |
| **관련 브랜치** | `fix/180-version-snapshot-timing` |
| **관련 이슈** | #180 |

---

## 1. 구현 개요

### 배경

버전 기록 생성 시 **변경 전 상태**를 저장하고 있어 현재 버전의 정보가 실제 콘텐츠 정보와 불일치하는 문제 발생:

- 콘텐츠 이름을 수정해도 버전 기록에는 이전 이름이 표시됨
- 버전 복원 후 기본정보와 버전 기록의 파일명이 다름

### 해결 방안

모든 버전 기록을 **변경 후 상태**로 저장하도록 로직 순서 변경

---

## 2. 수정 파일

### 2.1 ContentServiceImpl.java

**updateContent() 메서드 - 변경 전:**
```java
// 버전 기록 (변경 전 상태 저장)
contentVersionService.createVersion(content, VersionChangeType.METADATA_UPDATE, ...);

content.updateMetadata(request.originalFileName(), ...);
content.incrementVersion();
```

**updateContent() 메서드 - 변경 후:**
```java
// 메타데이터 변경
content.updateMetadata(request.originalFileName(), ...);
content.incrementVersion();

// 버전 기록 (변경 후 상태 저장)
contentVersionService.createVersion(content, VersionChangeType.METADATA_UPDATE, ...);
```

**replaceFile() 메서드 - 동일한 패턴 적용:**
```java
// 파일 교체
content.replaceFile(originalFileName, storedFileName, file.getSize(), newFilePath);
content.incrementVersion();

// 썸네일 재생성
generateAndSetThumbnail(content, newFilePath, content.getContentType());

// 버전 기록 (변경 후 상태 저장)
contentVersionService.createVersion(content, VersionChangeType.FILE_REPLACE, ...);
```

### 2.2 ContentVersionServiceImpl.java

**restoreVersion() 메서드 - 변경 전:**
```java
// 현재 상태 백업 (복원 전)
createVersion(content, VersionChangeType.FILE_REPLACE, userId, "Before restore to v" + versionNumber);

// 버전 복원
content.replaceFile(...);
content.incrementVersion();
```

**restoreVersion() 메서드 - 변경 후:**
```java
// 버전 복원
content.replaceFile(...);
content.updateThumbnailPath(...);
content.incrementVersion();

// 복원 후 상태로 버전 기록
createVersion(content, VersionChangeType.FILE_REPLACE, userId, "Restored from v" + versionNumber);
```

---

## 3. 변경 전후 비교

### 3.1 메타데이터 수정 시

| 시점 | 변경 전 | 변경 후 |
|------|---------|---------|
| 이름: "A" → "B" 수정 | 버전에 "A" 저장 | 버전에 "B" 저장 |
| 현재 버전 표시 | 이전 이름 | 현재 이름 (일치) |

### 3.2 버전 복원 시

| 시점 | 변경 전 | 변경 후 |
|------|---------|---------|
| v2로 복원 | "Before restore to v2" 메시지 | "Restored from v2" 메시지 |
| 버전 상태 | 복원 전 상태 | 복원 후 상태 (일치) |

---

## 4. 테스트 결과

| 테스트 케이스 | 결과 |
|---------------|------|
| 메타데이터 수정 후 현재 버전 확인 | ✅ 이름 일치 |
| 파일 교체 후 현재 버전 확인 | ✅ 파일명 일치 |
| 버전 복원 후 기본정보와 버전 기록 비교 | ✅ 파일명 일치 |

---

## 5. 관련 프론트엔드 수정

### 이슈 #51 (mzc-lp-frontend)

**브랜치:** `fix/51-external-link-version-history`

**수정 내용:**
1. 외부 링크 콘텐츠에서도 버전 히스토리 표시
2. 버전 카드에 콘텐츠 이름과 업로드 파일명 둘 다 표시

**ContentDetailPage.tsx 변경:**
```tsx
// 버전 히스토리 섹션 - !isExternalLink 조건 제거
<div className="bg-bg-default border border-border rounded-lg p-6">
  ...
</div>

// VersionCard - 이름과 파일명 둘 다 표시
<p className="text-sm text-text-primary mb-1">
  {version.originalFileName}
</p>
{!isExternalLink && version.uploadedFileName && (
  <p className="text-xs text-text-secondary mb-1">
    {version.uploadedFileName}
  </p>
)}
```

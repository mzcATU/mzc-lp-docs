# Frontend TU (Tenant User) 개발 로그 - Phase 8

> 커리큘럼 폴더 토글 기능 및 모달 파일명 overflow 수정

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz |
| **작업 일자** | 2025-12-31 |
| **관련 이슈** | [#106](https://github.com/mzcATU/mzc-lp-frontend/issues/106), [#154](https://github.com/mzcATU/mzc-lp-frontend/issues/154) |
| **관련 PR** | [#142](https://github.com/mzcATU/mzc-lp-frontend/pull/142), [#160](https://github.com/mzcATU/mzc-lp-frontend/pull/160) |
| **관련 커밋** | `5a9a914`, `d8c8967` |
| **담당 모듈** | TU (Tenant User) - Course Curriculum |

---

## 1. 구현 개요

### 1.1 커리큘럼 폴더 토글 기능 (5a9a914)

| 기능 | 설명 |
|------|------|
| 폴더 접기/펼치기 | 폴더 클릭 시 하위 항목 토글 |
| 토글 아이콘 | ChevronRight/ChevronDown 아이콘 표시 |
| 초기 상태 | 모든 폴더 펼침 상태로 시작 |
| 라우트 수정 | teaching 상세 페이지에 TeachingCourseDetailPage 사용 |

### 1.2 모달 파일명 overflow 수정 (d8c8967)

| 기능 | 설명 |
|------|------|
| DialogContent 수정 | sm breakpoint max-width 오버라이드 추가 |
| 파일명 truncate | w-0 추가로 긴 파일명 말줄임 정상 작동 |

---

## 2. 주요 구현 내용

### 2.1 폴더 토글 상태 관리

```typescript
// CourseCurriculumSection.tsx
function CurriculumTreeItem({ item, depth = 0 }) {
  const [isOpen, setIsOpen] = useState(true);  // 초기 상태: 펼침

  const hasChildren = item.children && item.children.length > 0;
  const isToggleable = item.isFolder && hasChildren;

  const handleToggle = () => {
    if (isToggleable) {
      setIsOpen((prev) => !prev);
    }
  };
  // ...
}
```

### 2.2 토글 아이콘 렌더링

```typescript
// 토글 가능한 폴더에만 아이콘 표시
{isToggleable && (
  isOpen ? (
    <ChevronDown size={16} className="text-text-secondary mt-0.5 flex-shrink-0" />
  ) : (
    <ChevronRight size={16} className="text-text-secondary mt-0.5 flex-shrink-0" />
  )
)}
```

### 2.3 조건부 하위 항목 렌더링

```typescript
// 기존: 항상 렌더링
{item.children && item.children.length > 0 && (
  <div>...</div>
)}

// 변경: isOpen 상태에 따라 렌더링
{hasChildren && isOpen && (
  <div>
    {item.children.map((child) => (
      <CurriculumTreeItem key={child.itemId} item={child} depth={depth + 1} />
    ))}
  </div>
)}
```

### 2.4 클릭 가능 영역 스타일링

```typescript
<div
  className={`flex items-start gap-2 py-2 px-3 hover:bg-bg-secondary rounded-md transition-colors ${isToggleable ? 'cursor-pointer' : ''}`}
  style={{ paddingLeft: `${paddingLeft + 12}px` }}
  onClick={handleToggle}
>
```

### 2.5 모달 파일명 overflow 해결

```typescript
// DialogContent: sm breakpoint max-width 오버라이드
<DialogContent className="max-w-md sm:max-w-md bg-bg-default">

// 파일명 컨테이너: w-0 추가로 truncate 정상 작동
<div className="flex-1 min-w-0 w-0">
  <p className="text-sm font-medium text-text-primary truncate">
    {selectedFile.name}
  </p>
</div>
```

**문제 원인**: `flex-1 min-w-0`만으로는 flex 컨테이너에서 truncate가 제대로 작동하지 않음
**해결 방법**: `w-0`을 추가하여 초기 너비를 0으로 설정 후 flex-1로 확장되게 함

---

## 3. 라우팅 변경

```typescript
// tu.courses.routes.tsx
// 기존
<Route path="teaching/courses/:courseId" element={<CourseDetailPage />} />

// 변경
<Route path="teaching/courses/:courseId" element={<TeachingCourseDetailPage />} />
```

---

## 4. 파일 변경 요약

### 커리큘럼 폴더 토글 기능 (5a9a914)

| 파일 | 변경 |
|------|------|
| CourseCurriculumSection.tsx | +23/-3 lines |
| tu.courses.routes.tsx | +2/-2 lines |

### 모달 파일명 overflow 수정 (d8c8967)

| 파일 | 변경 |
|------|------|
| ExistingContentModal.tsx | +3/-3 lines |
| FileUploadModal.tsx | +2/-2 lines |

---

## 5. 관련 문서

- [Frontend Phase 6](phase6.md) - 강의 회차 콘텐츠 연결 및 상세 페이지 구현
- [Frontend Phase 7](phase7.md) - 강의 유형 필드 추가 및 강의 수정 페이지 구현

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-31 | hjj240228mz | 커리큘럼 폴더 토글 기능 추가 |
| 2025-12-31 | hjj240228mz | 모달 파일명 overflow 문제 수정 |

---

*최종 업데이트: 2025-12-31*

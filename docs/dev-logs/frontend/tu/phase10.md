# Frontend TU (Tenant User) 개발 로그 - Phase 10

> TU 영역 "내 프로그램" 관리 기능 구현 및 강의 생성 버그 수정

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz |
| **작업 일자** | 2026-01-02 |
| **관련 이슈** | [#193](https://github.com/mzcATU/mzc-lp-frontend/issues/193) |
| **관련 PR** | [#194](https://github.com/mzcATU/mzc-lp-frontend/pull/194) |
| **담당 모듈** | TU (Tenant User) - Programs Management |

---

## 1. 구현 개요

### 1.1 TU 내 프로그램 관리 기능

| 기능 | 설명 |
|------|------|
| 사이드바 메뉴 | "내 강좌" → "내 강의계획"으로 명칭 변경 |
| 새 메뉴 추가 | "내 프로그램" 메뉴 추가 (강의계획과 콘텐츠 사이) |
| 목록 페이지 | 프로그램 목록 조회, 상태 필터링, 신청/삭제 기능 |
| 상세 페이지 | 프로그램 정보 + 스냅샷 정보 표시 |
| 수정 페이지 | 기본정보 수정 + 스냅샷 아이템 트리 편집 |

### 1.2 강의 생성 Step3 커리큘럼 버그 수정

| 기능 | 설명 |
|------|------|
| 문제 | 2단계에서 작성한 커리큘럼이 3단계에 표시되지 않음 |
| 원인 | `formData.lessons` (deprecated) 대신 `formData.curriculumItems` 사용 필요 |
| 해결 | Step3Review에서 curriculumItems 사용하도록 수정 |

### 1.3 TypeScript 에러 수정

| 파일 | 문제 | 해결 |
|------|------|------|
| ProgramBasicInfoForm.tsx | NativeSelect options prop 누락 | options prop 추가 |
| ProgramSnapshotSection.tsx | hashtags가 string인데 .map() 호출 | .split(',').map() 으로 수정 |
| SnapshotItemTree.tsx | 미사용 Label import | import 제거 |

---

## 2. 신규 생성 파일 (12개)

### Hooks (1개)

| 파일 | 설명 |
|------|------|
| `src/hooks/tu/useMyProgramQueries.ts` | React Query hooks (조회/뮤테이션) |

### Pages (3개)

| 파일 | 설명 |
|------|------|
| `src/pages/tu/teaching/programs/MyProgramsPage.tsx` | 프로그램 목록 페이지 |
| `src/pages/tu/teaching/programs/ProgramDetailPage.tsx` | 프로그램 상세 페이지 |
| `src/pages/tu/teaching/programs/ProgramEditPage.tsx` | 프로그램 수정 페이지 |

### Components (6개)

| 파일 | 설명 |
|------|------|
| `ProgramInfoSection.tsx` | 프로그램 기본정보 섹션 (읽기 전용) |
| `ProgramSnapshotSection.tsx` | 스냅샷 정보 및 커리큘럼 트리 섹션 (읽기 전용) |
| `ProgramBasicInfoForm.tsx` | 프로그램 기본정보 입력 폼 |
| `SnapshotItemTree.tsx` | 스냅샷 아이템 트리 편집 컴포넌트 |
| `components/index.ts` | 컴포넌트 export |
| `programs/index.ts` | 페이지 export |

---

## 3. 수정 파일 (6개)

| 파일 | 변경 내용 |
|------|----------|
| `src/config/sidebar-menus.ts` | 메뉴명 변경 + "내 프로그램" 메뉴 추가 |
| `src/routes/tu.teaching.routes.tsx` | 프로그램 라우트 3개 추가 |
| `src/hooks/tu/index.ts` | 프로그램 hooks export 추가 |
| `src/pages/tu/teaching/index.ts` | programs export 추가 |
| `src/pages/tu/index.ts` | 페이지 export 추가 |
| `src/pages/tu/teaching/courses/components/Step3Review.tsx` | curriculumItems 사용으로 변경 |

---

## 4. 주요 구현 내용

### 4.1 React Query Hooks

```typescript
// Query Keys
export const myProgramKeys = {
  all: ['my-programs'] as const,
  lists: () => [...myProgramKeys.all, 'list'] as const,
  list: (params?) => [...myProgramKeys.lists(), params] as const,
  detail: (id: number) => [...myProgramKeys.all, 'detail', id] as const,
  snapshot: (id: number) => [...myProgramKeys.all, 'snapshot', id] as const,
  snapshotItems: (id: number) => [...myProgramKeys.all, 'snapshot-items', id] as const,
};

// Hooks
useMyPrograms(params?)        // 프로그램 목록 조회
useMyProgram(id)              // 프로그램 상세 조회
useMyProgramSnapshot(id)      // 스냅샷 상세 조회
useSnapshotItems(id)          // 스냅샷 아이템 조회
useUpdateMyProgram()          // 프로그램 수정
useDeleteMyProgram()          // 프로그램 삭제
useSubmitMyProgram()          // 프로그램 신청
useUpdateSnapshot()           // 스냅샷 수정
useAddSnapshotItem()          // 스냅샷 아이템 추가
useUpdateSnapshotItem()       // 스냅샷 아이템 수정
useDeleteSnapshotItem()       // 스냅샷 아이템 삭제
```

### 4.2 상태별 허용 액션

| 상태 | 상세보기 | 수정 | 신청 | 삭제 |
|------|:-------:|:----:|:----:|:----:|
| DRAFT | O | O | O | O |
| PENDING | O | X | X | X |
| APPROVED | O | X | X | X |
| REJECTED | O | O | O | O |
| CLOSED | O | X | X | X |

### 4.3 Step3Review 커리큘럼 표시 수정

```typescript
// 변경 전 (deprecated)
if (formData.lessons.length === 0) warnings.push(getText('warningLesson'));

// 변경 후
if (formData.curriculumItems.length === 0) warnings.push(getText('warningLesson'));

// 트리 구조 렌더링 추가
function CurriculumTreeItem({ item, depth, expandedIds, onToggle }) {
  const isFolder = isCurriculumFolder(item);
  const isExpanded = expandedIds.has(item.id);
  // ...
}
```

---

## 5. 라우팅 구조

```
/tu/teaching/programs              → MyProgramsPage (목록)
/tu/teaching/programs/:programId   → TuProgramDetailPage (상세)
/tu/teaching/programs/:programId/edit → TuProgramEditPage (수정)
```

---

## 6. 사이드바 메뉴 구조

```
내 강의계획 (teaching/courses)     ← 기존 "내 강좌"에서 명칭 변경
내 프로그램 (teaching/programs)    ← 신규 추가
내 콘텐츠 (teaching/content)
내 과제 (teaching/assignments)
```

---

## 7. 충돌 해결

dev 브랜치 병합 시 충돌 발생:

| 파일 | 원인 | 해결 |
|------|------|------|
| `tu.teaching.routes.tsx` | dev에서 파일명 변경 (`tu.courses.routes.tsx` → `tu.teaching.routes.tsx`) | 프로그램 라우트 유지하며 머지 |

---

## 8. 파일 변경 요약

**총 변경**: +2,300줄 이상

### 신규 파일

| 경로 | 파일 수 |
|------|---------|
| `src/hooks/tu/` | 1개 |
| `src/pages/tu/teaching/programs/` | 3개 |
| `src/pages/tu/teaching/programs/components/` | 6개 |

### 수정 파일

| 파일 | 주요 변경 |
|------|----------|
| sidebar-menus.ts | +3 lines (메뉴 추가) |
| tu.teaching.routes.tsx | +4 lines (라우트 추가) |
| hooks/tu/index.ts | +11 lines (export 추가) |
| Step3Review.tsx | +100 lines (curriculumItems 지원) |

---

## 9. 관련 문서

- [Frontend Phase 8](phase8.md) - 커리큘럼 폴더 토글 기능
- [Frontend Phase 9](phase9.md) - DESIGNER 역할 토큰 갱신 수정
- [tu-my-programs-implementation.md](../../../../tu-my-programs-implementation.md) - 구현 계획 문서

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-02 | hjj240228mz | TU 내 프로그램 관리 기능 구현 |
| 2026-01-02 | hjj240228mz | Step3Review curriculumItems 버그 수정 |
| 2026-01-02 | hjj240228mz | TypeScript 에러 수정 |
| 2026-01-02 | hjj240228mz | dev 브랜치 충돌 해결 |

---

*최종 업데이트: 2026-01-02*

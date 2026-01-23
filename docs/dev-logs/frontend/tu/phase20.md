# Frontend TU (Tenant User) 개발 로그 - Phase 20

> Program → Course 마이그레이션 및 API 정비

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz |
| **작업 기간** | 2026-01-14 ~ 2026-01-15 |
| **관련 PR** | #416, #420, #427, #430, #434, #441, #446, #449 |
| **담당 모듈** | TU (Tenant User), CO (Course Operator) |

---

## 1. 구현 개요

### 1.1 주요 작업 내역

| Phase | 설명 | 관련 PR |
|-------|------|---------|
| Phase 1 | API 연동 변경 (programId → courseId) | #416 |
| Phase 2 | UI 텍스트 "프로그램" → "과정" 통일 | #420 |
| Phase 3 | Program 엔티티 제거 및 Course로 리네이밍 | #427 |
| 버그 수정 | CourseTimeCreatePage 렌더링 에러 수정 | #430 |
| 타입 정리 | Program 타입 완전 제거 및 Course 기반 전환 | #434 |
| API 정비 | courseService API 메서드 정비 | #441 |
| UX 개선 | Step3 버튼 구조 개선 (임시저장/작성완료/등록 분리) | #446 |
| 기능 추가 | Step3 강의 미리보기 기능 추가 | #449 |

---

## 2. Phase 1: API 연동 변경 (#416)

### 2.1 변경 사항

백엔드 Phase 3 (Program 엔티티 제거) 대응을 위한 프론트엔드 점진적 전환.

| 파일 | 변경 내용 |
|------|----------|
| `time.types.ts` | `programId` → `courseId` |
| `endpoints.ts` | PROGRAMS deprecated, /courses 리다이렉트 |
| `programService.ts` | deprecation 주석 |
| `useProgramQueries.ts` | APPROVED → REGISTERED 매핑 |
| `CourseTimeCreatePage.tsx` | programId → courseId |

---

## 3. Phase 2: UI 텍스트 통일 (#420)

### 3.1 변경 범위 (24개 파일)

**CO 페이지 (6개 파일)**
- "검토 대기 프로그램" → "검토 대기 과정"
- "프로그램 담당자" → "과정 담당자"
- "프로그램 역할" → "과정 역할"

**TA 페이지 (3개 파일)**
- "전체 프로그램" → "전체 과정"
- "프로그램 승인" → "과정 승인"

**TU 페이지 (15개 파일)**
- 과정 신청, 생성, 수정, 상세 관련 문구 일괄 변경

---

## 4. Phase 3: Program 엔티티 제거 (#427)

### 4.1 TU 변경

| 변경 | 설명 |
|------|------|
| `/tu/teaching/programs` 삭제 | 8개 파일 제거 |
| 사이드바 `my-programs` 제거 | 메뉴 항목 삭제 |
| `TUDashboardPage` | program 통계 및 섹션 제거 |
| `RoadmapCreatePage` | `useMyPrograms` → `useMyCourses` |
| `CourseApplyPage` 삭제 | program 생성 기능 불필요 |

### 4.2 CO 변경

| Before | After |
|--------|-------|
| `/pages/co/program/` | `/pages/co/course/` |
| `ProgramListPage` | `CourseListPage` |
| `ProgramDetailPage` | `CourseDetailPage` |
| `ProgramPendingPage` | `CoursePendingPage` |
| `programService.ts` | `courseService.ts` |
| `useProgramQueries.ts` | `useCourseQueries.ts` |

---

## 5. 버그 수정: CourseTimeCreatePage (#430)

### 5.1 문제

`/megazone/co/times/create` 페이지 접근 시 에러 발생:
```
Cannot read properties of undefined (reading 'toString')
```

### 5.2 원인

백엔드 API가 `courseId`로 반환하지만, 프론트엔드에서 `id`를 기대.

### 5.3 해결

`useMemo`에서 `courseId`를 `id`로 매핑하여 하위 호환성 유지.

```typescript
const approvedPrograms = useMemo(() =>
  courses?.map(course => ({
    ...course,
    id: course.courseId  // 매핑 추가
  })), [courses]
);
```

---

## 6. 타입 정리: Program 타입 완전 제거 (#434)

### 6.1 삭제된 파일 (~450줄 감소)

- `program.types.ts`
- `co/courseService.ts` (레거시)
- `co/useCourseQueries.ts` (레거시)
- `useMyProgramQueries.ts`

### 6.2 CO 워크플로우 Course 기반 전환

- `register()`, `unready()` 메서드 추가
- 5개 CO 페이지 타입/훅 전환
- TU 과정 신청 플로우를 common `courseService`로 전환

---

## 7. API 메서드 정비 (#441)

### 7.1 변경 사항

```typescript
// Deprecated (warning 추가)
publish(): void
unpublish(): void

// 신규 메서드
ready(): Promise<void>     // DRAFT → READY
unready(): Promise<void>   // READY → DRAFT
register(): Promise<void>  // READY → REGISTERED
```

---

## 8. Step3 버튼 구조 개선 (#446)

### 8.1 버튼 분리

| 버튼 | API 호출 | 결과 상태 | 사용 케이스 |
|-----|---------|---------|-----------|
| 임시저장 | `create/update` | DRAFT | 미완성 또는 나중에 수정할 때 |
| 작성완료 | `create/update` → `ready()` | READY | 완성됐지만 CO 제출 전 |
| 등록 | `create/update` → `ready()` → `register()` | REGISTERED | 바로 CO가 차수 개설 가능 |

### 8.2 공통 저장 로직 추출

`saveCourse()` 함수로 저장 로직 통합.

---

## 9. Step3 강의 미리보기 기능 (#449)

### 9.1 구현 내용

Step3 검토 화면에 "미리보기" 버튼 추가 (헤더 우측).

### 9.2 Data Flow

```
Step3 [미리보기 버튼 클릭]
  ↓
sessionStorage.setItem('course-preview-data', formData)
  ↓
window.open('/tu/teaching/courses/preview', '_blank')
  ↓
CoursePreviewPage에서 sessionStorage 데이터 읽어서 렌더링
```

### 9.3 신규 파일

- `CoursePreviewPage.tsx` - 수강생 뷰 렌더링
- `tu.teaching.routes.tsx` - preview 라우트 추가

---

## 10. 변경 이력

| 날짜 | PR | 내용 |
|------|-----|------|
| 2026-01-15 | #449 | Step3 강의 미리보기 기능 추가 |
| 2026-01-15 | #446 | Step3 버튼 구조 개선 (임시저장/작성완료/등록 분리) |
| 2026-01-15 | #441 | courseService API 메서드 정비 |
| 2026-01-15 | #434 | Program 타입 완전 제거 및 Course 기반 전환 |
| 2026-01-15 | #430 | CourseTimeCreatePage 렌더링 에러 수정 |
| 2026-01-15 | #427 | Phase 3 - Program 엔티티 제거 및 Course로 리네이밍 |
| 2026-01-14 | #420 | UI 텍스트 "프로그램" → "과정" 통일 (Phase 2) |
| 2026-01-14 | #416 | Program → Course Phase 1 API 연동 변경 |

---

**작성자**: hjj240228mz
**최종 수정**: 2026-01-15

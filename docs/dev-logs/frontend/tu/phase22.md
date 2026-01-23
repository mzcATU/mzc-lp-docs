# Frontend TU (Tenant User) 개발 로그 - Phase 22

> 완성도 검증 및 과정 등록 UX 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz |
| **작업 기간** | 2026-01-19 ~ 2026-01-20 |
| **관련 PR** | #488, #496, #498, #505, #506, #508, #527, #531 |
| **담당 모듈** | TU (Tenant User) |

---

## 1. 구현 개요

### 1.1 주요 작업 내역

| 기능 | 설명 | 관련 PR |
|------|------|---------|
| 날짜 필드 제거 | Course 시작일/종료일 필드 제거 | #488 |
| 완성도 사전 검증 | 과정 발행 전 완성도 사전 검증 및 안내 추가 | #496 |
| 저장 모달 개선 | 완성도 미충족 시 작성완료 옵션 비활성화 | #498 |
| 학습 시간 필드 | 강의 생성 페이지에 예상 학습 시간 입력 필드 추가 | #505 |
| 미리보기 버튼 | 강의 상세 페이지에 미리보기 버튼 추가 | #506 |
| 등록 절차 개선 | 과정 등록 시 전체 정보 확인 및 재확인 절차 추가 | #508 |
| API 수정 | 과정 상세페이지 등록 API를 register로 변경 | #527 |
| 조건부 렌더링 | 과정 디테일 페이지 버튼 조건부 렌더링 | #531 |

---

## 2. Course 시작일/종료일 필드 제거 (#488)

### 2.1 변경 사항

Course 관련 타입에서 `startDate`, `endDate` 필드 제거.

| 파일 | 변경 내용 |
|------|----------|
| `course.types.ts` | 날짜 필드 제거 |
| `CourseCreatePage.tsx` | 날짜 입력 UI 제거 |
| `CourseEditPage.tsx` | 날짜 입력/표시 제거 |
| `CoursePreviewPage.tsx` | 날짜 표시 제거 |

### 2.2 배경

날짜는 차수(CourseTime)에서 관리하므로 Course에서는 불필요.

---

## 3. 완성도 사전 검증 (#496)

### 3.1 구현 내용

프론트엔드에서 `ready()` API 호출 전 완성도 사전 검증.

### 3.2 검증 함수

```typescript
function validateCourseCompleteness(formData: CourseFormData): string[] {
  const missingFields: string[] = [];

  if (!formData.title) missingFields.push('제목');
  if (!formData.description) missingFields.push('설명');
  if (!formData.categoryId) missingFields.push('카테고리');
  if (!formData.curriculumItems?.length) missingFields.push('차시');

  return missingFields;
}
```

### 3.3 에러 핸들링

CM017 에러 응답 시 누락 필드 추출하여 상세 메시지 표시.

**이전**:
```
저장에 실패했습니다. 다시 시도해주세요.
```

**이후**:
```
다음 항목을 입력해주세요: 설명, 차시
```

---

## 4. 저장 모달 완성도 옵션 비활성화 (#498)

### 4.1 변경 사항

완성도 기준 미충족 시 "작성완료" 옵션 비활성화.

### 4.2 완성도 기준

- 제목 입력
- 설명 입력
- 카테고리 선택
- 차시 1개 이상

### 4.3 UI 처리

| 상태 | 동작 |
|------|------|
| 완성도 충족 | 작성완료 옵션 선택 가능 |
| 완성도 미충족 | 작성완료 옵션 회색 처리 + 안내 메시지 + 자동으로 임시저장 선택 |

---

## 5. 예상 학습 시간 필드 추가 (#505)

### 5.1 변경 사항

강의 생성 페이지(Step1BasicInfo)에 `estimatedHours` 입력 필드 추가.

### 5.2 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `course.types.ts` | `CourseFormData`에 `estimatedHours` 필드 추가 |
| `Step1BasicInfo.tsx` | 예상 학습시간 입력 필드 UI 추가 |
| `CourseCreatePage.tsx` | API 전달 로직 추가 |
| `CourseEditPage.tsx` | 기존 값 로드 및 저장 로직 추가 |

---

## 6. 강의 상세 페이지 미리보기 버튼 (#506)

### 6.1 변경 사항

CourseDetailPage에서 수정 버튼을 미리보기 버튼으로 교체.

**버튼 배치**:
- Before: `[과정 등록] [수정] [삭제]`
- After: `[과정 등록] [미리보기] [삭제]`

### 6.2 handlePreview 함수

```typescript
const handlePreview = () => {
  // course 데이터를 CourseFormData로 변환
  const previewData = convertToFormData(course);
  sessionStorage.setItem('course-preview-data', JSON.stringify(previewData));
  window.open('/tu/teaching/courses/preview', '_blank');
};
```

---

## 7. 과정 등록 확인 절차 개선 (#508)

### 7.1 신규 컴포넌트

`CourseApplyModal.tsx` - 과정 등록 전 전체 정보 확인 모달.

### 7.2 등록 플로우

```
1. "과정 등록" 버튼 클릭
   ↓
2. CourseApplyModal 표시 (Step3Review 스타일)
   - 기본 정보 요약
   - 커리큘럼 트리 표시
   - 필수 항목 누락 시 경고 + 버튼 비활성화
   ↓
3. "등록하기" 버튼 클릭
   ↓
4. AlertDialog로 재확인 (DRAFT → READY 상태 변경 안내)
   ↓
5. 최종 확인 후 상태 변경 및 목록 페이지 이동
```

### 7.3 관련 hook

`useReadyCourse` hook 추가 (`useCourseQueries.ts`).

---

## 8. 상세페이지 등록 API 수정 (#527)

### 8.1 문제 상황

상세페이지에서 "과정 등록" 버튼 클릭 시 `ready()` API만 호출되어 READY 상태로만 변경됨.

| 페이지 | 기존 API | 상태 변화 |
|--------|---------|----------|
| 목록 | `register()` | READY → REGISTERED ✅ |
| 생성 | `ready()` + `register()` | DRAFT → READY → REGISTERED ✅ |
| **상세** | `ready()` 만 | DRAFT → READY ❌ |

### 8.2 수정 내용

- 상세페이지에서 `register()` API 호출하도록 변경
- `useRegisterCourse` 훅 export 추가
- 모달 확인 메시지에서 백엔드 용어 제거

---

## 9. 디테일 페이지 버튼 조건부 렌더링 (#531)

### 9.1 상태별 버튼 표시

| 상태 | 헤더 버튼 | 섹션 수정 버튼 |
|------|---------|--------------|
| **DRAFT** | 미리보기, 삭제 | ✅ 표시 |
| **READY** | 과정 등록, 미리보기, 삭제 | ✅ 표시 |
| **REGISTERED** | 미리보기만 | ❌ 숨김 |

### 9.2 DESIGNER 리다이렉션 수정

로그인 후 `/tu/teaching` → `/tu/dashboard`로 변경 (기존 경로는 빈 페이지).

---

## 10. 변경 이력

| 날짜 | PR | 내용 |
|------|-----|------|
| 2026-01-20 | #531 | 과정 디테일 페이지 버튼 조건부 렌더링 및 DESIGNER 리다이렉션 수정 |
| 2026-01-20 | #527 | 과정 상세페이지 등록 API를 register로 변경 |
| 2026-01-19 | #508 | 과정 등록 시 전체 정보 확인 및 재확인 절차 추가 |
| 2026-01-19 | #506 | 강의 상세 페이지에 미리보기 버튼 추가 |
| 2026-01-19 | #505 | 강의 생성 페이지에 예상 학습 시간 입력 필드 추가 |
| 2026-01-19 | #498 | 저장 모달에서 완성도 미충족 시 작성완료 옵션 비활성화 |
| 2026-01-19 | #496 | 과정 발행 전 완성도 사전 검증 및 안내 추가 |
| 2026-01-19 | #488 | Course 시작일/종료일 필드 제거 |

---

**작성자**: hjj240228mz
**최종 수정**: 2026-01-20

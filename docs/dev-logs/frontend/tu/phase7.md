# Frontend TU (Tenant User) 개발 로그 - Phase 7

> 강의 유형 필드 추가 및 강의 수정 페이지 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz, hs |
| **작업 일자** | 2025-12-30 |
| **관련 이슈** | [#104](https://github.com/mzcATU/mzc-lp-frontend/issues/104), [#88](https://github.com/mzcATU/mzc-lp-frontend/issues/88) |
| **관련 PR** | [#118](https://github.com/mzcATU/mzc-lp-frontend/pull/118), [#129](https://github.com/mzcATU/mzc-lp-frontend/pull/129) |
| **관련 커밋** | `d050b3e`, `0ba4bc9` |
| **담당 모듈** | TU (Tenant User) - Course Management |

---

## 1. 구현 개요

### 1.1 강의 유형(type) 필드 추가 (d050b3e)

| 기능 | 설명 |
|------|------|
| 유형 선택 UI | NativeSelect로 ONLINE/OFFLINE/BLENDED 선택 |
| 타입 확장 | CourseFormData에 type 필드 추가 |
| API 연동 | 강의 생성 시 type 값 전송 |

### 1.2 강의 수정 페이지 구현 (0ba4bc9)

| 기능 | 설명 |
|------|------|
| CourseEditPage | CourseCreatePage 구조 기반의 강의 수정 페이지 |
| 라우트 추가 | `/tu/teaching/courses/:courseId/edit` |
| UI 개선 | CourseCard에 수정 버튼 추가, 상세 페이지 수정 버튼 연동 |
| 모달 제거 | CourseEditModal 대신 별도 페이지로 전환 |

---

## 2. 신규 파일

### 2.1 강의 수정 페이지 (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseEditPage.tsx | `src/pages/tu/teaching/courses/` | 강의 수정 메인 페이지 (281줄) |

---

## 3. 주요 구현 내용

### 3.1 강의 유형 선택 UI (Step1BasicInfo)

```typescript
// 유형 옵션 정의
export const typeOptions = [
  { value: '', label: '유형 선택' },
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'BLENDED', label: '블렌디드' },
];

// 그리드 레이아웃 변경 (2칼럼 → 3칼럼)
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <NativeSelect id="categoryId" ... />
  <NativeSelect id="level" ... />
  <NativeSelect id="type" ... />  // 추가
</div>
```

### 3.2 CourseFormData 타입 확장

```typescript
// course.types.ts
export interface CourseFormData {
  title: string;
  description: string;
  // ... 기존 필드
  level: CourseLevel | '';
  type: CourseType | '';  // 추가
  lessons: LessonData[];
  // ...
}
```

### 3.3 CourseEditPage 구현

```typescript
// 기존 강의 데이터 로드
const { data: courseData, isLoading, isError } = useCourse(courseIdNum);
const updateCourseMutation = useUpdateCourse();

// 폼 데이터 초기화
useEffect(() => {
  if (courseData && !isInitialized) {
    setFormData({
      title: courseData.title,
      description: courseData.description || '',
      startDate: courseData.startDate || '',
      endDate: courseData.endDate || '',
      categoryId: courseData.categoryId,
      tags: courseData.tags || [],
      level: courseData.level || '',
      type: courseData.type || '',
      lessons: [],
      // ...
    });
    setIsInitialized(true);
  }
}, [courseData, isInitialized]);

// 수정 API 호출
const handleSubmit = async () => {
  const request: UpdateCourseRequest = {
    title: formData.title,
    description: formData.description || undefined,
    level: formData.level || undefined,
    type: formData.type || undefined,
    categoryId: formData.categoryId ?? undefined,
    // ...
  };
  await updateCourseMutation.mutateAsync({ id: courseIdNum, request });
  navigate(`/tu/teaching/courses/${courseIdNum}`);
};
```

### 3.4 CourseCard 수정 버튼 추가

```typescript
// CourseCard.tsx
interface CourseCardProps {
  course: Course;
  labels: CourseCardLabels;
  onManage?: () => void;
  onEdit?: () => void;  // 추가
}

// 버튼 영역
<div className="flex gap-2 mt-4">
  <Button className="flex-1" onClick={handleManage}>
    {labels.manageCourse}
  </Button>
  {labels.editCourse && (
    <Button variant="ghost" className="border border-border" onClick={handleEdit}>
      <Pencil size={16} />
    </Button>
  )}
</div>
```

### 3.5 CourseDetailPage 수정 버튼 변경

```typescript
// 기존: 모달 열기
onClick={() => setIsEditModalOpen(true)}

// 변경: 수정 페이지로 이동
onClick={() => navigate(`/tu/teaching/courses/${id}/edit`)}

// CourseEditModal 관련 코드 제거
```

---

## 4. 라우팅 추가

```typescript
// tu.courses.routes.tsx
<Route path="teaching/courses" element={<MyCoursesPage />} />
<Route path="teaching/courses/create" element={<CourseCreatePage />} />
<Route path="teaching/courses/:courseId" element={<CourseDetailPage />} />
<Route path="teaching/courses/:courseId/edit" element={<CourseEditPage />} />  // 추가
```

---

## 5. 번역 상수 추가

### 5.1 유형 관련 (d050b3e)

```typescript
// courseCreate.constants.ts
export const translations = {
  // ...
  courseType: { ko: '유형', en: 'Type' },
  selectType: { ko: '유형 선택', en: 'Select type' },
  online: { ko: '온라인', en: 'Online' },
  offline: { ko: '오프라인', en: 'Offline' },
  blended: { ko: '블렌디드', en: 'Blended' },
};
```

### 5.2 수정 페이지 관련 (0ba4bc9)

```typescript
// courseCreate.constants.ts
export const translations = {
  // ...
  editTitle: { ko: '강의 수정', en: 'Edit Course' },
  editSubmit: { ko: '수정 완료', en: 'Save Changes' },
};

// MyCoursesPage 번역
const t = {
  // ...
  editCourse: { ko: '수정', en: 'Edit' },
};
```

---

## 6. 파일 변경 요약

### 강의 유형 필드 추가 (d050b3e)

| 파일 | 변경 |
|------|------|
| CourseCreatePage.tsx | +2 lines |
| Step1BasicInfo.tsx | +14/-3 lines |
| courseCreate.constants.ts | +12 lines |
| course.types.ts | +3/-1 lines |

### 강의 수정 페이지 구현 (0ba4bc9)

| 파일 | 변경 |
|------|------|
| CourseEditPage.tsx | +281 lines (신규) |
| CourseCard.tsx | +31/-1 lines |
| CourseDetailPage.tsx | +12/-1 lines |
| MyCoursesPage.tsx | +2 lines |
| courseCreate.constants.ts | +2 lines |
| courses/index.ts | +1 line |
| teaching/index.ts | +2/-2 lines |
| tu/index.ts | +2/-1 lines |
| tu.courses.routes.tsx | +4/-1 lines |

---

## 7. 관련 문서

- [Frontend Phase 1](phase1.md) - TU 콘텐츠 관리 기본 구조
- [Frontend Phase 2](phase2.md) - 버전 히스토리 개선
- [Frontend Phase 3](phase3.md) - 메타데이터 업로드 및 다운로드 개선
- [Frontend Phase 4](phase4.md) - LO 폴더 이동 기능
- [Frontend Phase 5](phase5.md) - 폴더 CRUD 에러 처리 및 삭제 시 LO 미분류 이동
- [Frontend Phase 6](phase6.md) - 강의 회차 콘텐츠 연결 및 상세 페이지 구현

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-30 | hjj240228mz | 강의 생성 페이지에 유형(type) 필드 추가 |
| 2025-12-30 | hjj240228mz, hs | CourseEditPage 구현 |
| 2025-12-30 | hjj240228mz, hs | CourseCard 수정 버튼 추가 |
| 2025-12-30 | hjj240228mz, hs | CourseDetailPage 수정 버튼 페이지 이동으로 변경 |

---

*최종 업데이트: 2025-12-30*

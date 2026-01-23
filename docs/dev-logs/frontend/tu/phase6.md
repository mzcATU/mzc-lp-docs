# Frontend TU (Tenant User) 개발 로그 - Phase 6

> 강의 회차 콘텐츠 연결 기능 및 강의 상세 페이지 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-29 |
| **관련 이슈** | [#92](https://github.com/mzcATU/mzc-lp-frontend/issues/92) |
| **관련 PR** | [#98](https://github.com/mzcATU/mzc-lp-frontend/pull/98), [#107](https://github.com/mzcATU/mzc-lp-frontend/pull/107) |
| **관련 브랜치** | `feat/92-lesson-content-connection` |
| **관련 커밋** | `c7f3fab`, `40318d4` |
| **담당 모듈** | TU (Tenant User) - Course Management |

---

## 1. 구현 개요

### 1.1 강의 회차 콘텐츠 연결 (c7f3fab)

| 기능 | 설명 |
|------|------|
| 파일 업로드 모달 | 드래그앤드롭 UI, 진행률 표시, contentService API 연동 |
| 외부 링크 모달 | URL 입력 폼, URL 유효성 검증, API 연동 |
| 기존 콘텐츠 모달 | 콘텐츠 목록 조회, 검색/타입 필터, 콘텐츠 선택 |
| 타입 확장 | ContentAttachment에 contentId, contentType, status 필드 추가 |

### 1.2 강의 상세 페이지 (40318d4)

| 기능 | 설명 |
|------|------|
| CourseDetailPage | 강의 상세 조회, 수정, 삭제 기능 |
| CourseInfoSection | 기본 정보 섹션 (카테고리 이름 표시) |
| CourseCurriculumSection | 커리큘럼 트리 뷰 (읽기 전용) |
| CourseEditModal | Dialog 기반 강의 정보 수정 모달 |
| useCourseQueries | React Query hooks (useCourse, useUpdateCourse, useDeleteCourse) |
| API 응답 수정 | courseService에서 data.data wrapper 처리 |

---

## 2. 신규 파일

### 2.1 콘텐츠 연결 모달 (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| FileUploadModal.tsx | `src/pages/tu/teaching/courses/components/` | 파일 드래그앤드롭 업로드 |
| ExternalLinkModal.tsx | `src/pages/tu/teaching/courses/components/` | 외부 URL 링크 추가 |
| ExistingContentModal.tsx | `src/pages/tu/teaching/courses/components/` | 기존 콘텐츠 선택 |

### 2.2 강의 상세 페이지 (5개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseDetailPage.tsx | `src/pages/tu/teaching/courses/` | 메인 상세 페이지 |
| CourseInfoSection.tsx | `src/pages/tu/teaching/courses/components/` | 기본 정보 카드 |
| CourseCurriculumSection.tsx | `src/pages/tu/teaching/courses/components/` | 커리큘럼 트리 |
| CourseEditModal.tsx | `src/pages/tu/teaching/courses/components/` | 수정 모달 |
| useCourseQueries.ts | `src/hooks/tu/` | React Query hooks |

---

## 3. 주요 구현 내용

### 3.1 FileUploadModal

```typescript
// 드래그앤드롭 + 클릭 업로드
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  const droppedFile = e.dataTransfer.files[0];
  if (droppedFile) setFile(droppedFile);
};

// 업로드 진행률 표시
const handleUpload = async () => {
  setIsUploading(true);
  setProgress(0);
  // contentService.uploadFile 호출
  // onSuccess 콜백으로 콘텐츠 ID 전달
};
```

### 3.2 ExistingContentModal

```typescript
// 콘텐츠 목록 조회 + 필터링
const { data: contentsData } = useMyContents({
  keyword: searchKeyword || undefined,
  contentType: filterType || undefined,
});

// 콘텐츠 타입별 아이콘
const contentTypeIcon: Record<ContentType, React.ElementType> = {
  VIDEO: Video,
  AUDIO: Music,
  DOCUMENT: FileText,
  IMAGE: ImageIcon,
  EXTERNAL_LINK: Link,
};
```

### 3.3 CourseDetailPage

```typescript
// React Query hooks
const { data: course, isLoading, error } = useCourse(id);
const { data: curriculum } = useCourseItemsHierarchy(id);
const deleteCourseMutation = useDeleteCourse();

// 카테고리 목록 조회 (이름 표시용)
useEffect(() => {
  const fetchCategories = async () => {
    const data = await categoryService.getCategories();
    setCategories(data);
  };
  fetchCategories();
}, []);
```

### 3.4 useCourseQueries

```typescript
// Query Keys
export const courseKeys = {
  all: ['courses'] as const,
  detail: (id: number) => [...courseKeys.all, 'detail', id] as const,
  itemsHierarchy: (id: number) => [...courseKeys.detail(id), 'itemsHierarchy'] as const,
};

// Queries
export const useCourse = (id: number) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseService.getCourse(id),
    enabled: !!id,
  });
};

// Mutations
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) => courseService.update(id, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
    },
  });
};
```

### 3.5 courseService API 응답 수정

```typescript
// 변경 전 (잘못된 처리)
async getCourse(id: number): Promise<CourseDetailResponse> {
  const { data } = await axiosInstance.get<CourseDetailResponse>(...);
  return data;  // wrapper 객체 반환
}

// 변경 후 (올바른 처리)
async getCourse(id: number): Promise<CourseDetailResponse> {
  const { data } = await axiosInstance.get<{ data: CourseDetailResponse }>(...);
  return data.data;  // 실제 데이터 반환
}
```

---

## 4. 라우팅 추가

```typescript
// tu.courses.routes.tsx
<Route path="teaching/courses" element={<MyCoursesPage />} />
<Route path="teaching/courses/create" element={<CourseCreatePage />} />
<Route path="teaching/courses/:courseId" element={<CourseDetailPage />} />  // 추가
```

---

## 5. 발견된 이슈 및 후속 작업

### 발행된 이슈

| # | 이슈 | 링크 |
|---|------|------|
| 1 | 강의 생성 페이지에 '유형(type)' 필드 추가 | [#104](https://github.com/mzcATU/mzc-lp-frontend/issues/104) |
| 2 | Course Relation(선수학습 관계) 설정 기능 | [#105](https://github.com/mzcATU/mzc-lp-frontend/issues/105) |
| 3 | 커리큘럼 폴더 열림/닫힘 토글 기능 | [#106](https://github.com/mzcATU/mzc-lp-frontend/issues/106) |

---

## 6. 파일 변경 요약

### 콘텐츠 연결 기능 (c7f3fab)

| 파일 | 변경 |
|------|------|
| ExistingContentModal.tsx | +229 lines (신규) |
| ExternalLinkModal.tsx | +163 lines (신규) |
| FileUploadModal.tsx | +237 lines (신규) |
| LessonCard.tsx | +8/-1 lines |
| Step2Curriculum.tsx | +89/-59 lines |
| courseCreate.constants.ts | +32 lines |
| components/index.ts | +3 lines |
| course.types.ts | +6/-1 lines |

### 상세 페이지 기능 (40318d4)

| 파일 | 변경 |
|------|------|
| CourseDetailPage.tsx | +207 lines (신규) |
| CourseInfoSection.tsx | +139 lines (신규) |
| CourseCurriculumSection.tsx | +71 lines (신규) |
| CourseEditModal.tsx | +281 lines (신규) |
| useCourseQueries.ts | +83 lines (신규) |
| courseService.ts | +6/-6 lines |
| tu.courses.routes.tsx | +2 lines |
| hooks/tu/index.ts | +11 lines |

---

## 7. 관련 문서

- [Frontend Phase 1](phase1.md) - TU 콘텐츠 관리 기본 구조
- [Frontend Phase 2](phase2.md) - 버전 히스토리 개선
- [Frontend Phase 3](phase3.md) - 메타데이터 업로드 및 다운로드 개선
- [Frontend Phase 4](phase4.md) - LO 폴더 이동 기능
- [Frontend Phase 5](phase5.md) - 폴더 CRUD 에러 처리 및 삭제 시 LO 미분류 이동

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-29 | Claude Code | 파일 업로드/외부 링크/기존 콘텐츠 모달 구현 |
| 2025-12-29 | Claude Code | CourseDetailPage 및 하위 컴포넌트 구현 |
| 2025-12-29 | Claude Code | useCourseQueries React Query hooks 추가 |
| 2025-12-29 | Claude Code | courseService API 응답 wrapper 처리 수정 |
| 2025-12-29 | Claude Code | 후속 작업 이슈 발행 (#104, #105, #106) |

---

*최종 업데이트: 2025-12-29*

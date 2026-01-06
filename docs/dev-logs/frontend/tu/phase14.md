# Frontend TU (Tenant User) 개발 로그 - Phase 14

> 강의 계획 임시저장 기능 및 목록 필터 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228 |
| **작업 일자** | 2026-01-05 |
| **관련 이슈** | [#200](https://github.com/mzcATU/mzc-lp-frontend/issues/200), [#253](https://github.com/mzcATU/mzc-lp-frontend/issues/253), [#279](https://github.com/mzcATU/mzc-lp-backend/issues/279) |
| **관련 PR** | [#249](https://github.com/mzcATU/mzc-lp-frontend/pull/249), [#254](https://github.com/mzcATU/mzc-lp-frontend/pull/254), [#280](https://github.com/mzcATU/mzc-lp-backend/pull/280) |
| **담당 모듈** | TU (Tenant User) - Course Management |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 강의 생성 중 페이지 이탈 시 작성 내용 유실, 작성 중인 강의 구분 어려움 |
| 원인 | 임시저장 기능 부재, 강의 완성도 판단 기준 없음 |
| 해결 | 임시저장 API 연동, isComplete 필드 기반 필터링 구현 |

### 1.2 구현 범위

| 구분 | 내용 |
|------|------|
| 임시저장 | CourseCreatePage에서 서버 API 호출하여 저장 |
| 이어서 작성 | URL 파라미터로 기존 강의 불러오기 |
| 목록 필터 | 전체/작성완료/작성중 필터 |
| 상태 표시 | 작성중 배지, 버튼 상태 분기 |
| 백엔드 | CourseResponse에 isComplete, itemCount 필드 추가 |

---

## 2. 신규/수정 파일

### 2.1 Frontend 수정 파일 (4개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| CourseCreatePage.tsx | `src/pages/tu/teaching/courses/` | 임시저장 기능, URL param 로드 |
| CourseEditPage.tsx | `src/pages/tu/teaching/courses/` | 커리큘럼 로드 버그 수정 |
| MyCoursesPage.tsx | `src/pages/tu/teaching/courses/` | isComplete 필터, 상태 배지 |
| curriculum.types.ts | `src/types/tu/` | 계층 구조 변환 함수 추가 |

### 2.2 Frontend 타입 수정 (1개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| course.types.ts | `src/types/common/` | isComplete, itemCount 필드 추가 |

### 2.3 Backend 수정 파일 (4개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| CourseResponse.java | `domain/course/dto/response/` | isComplete, itemCount 필드 |
| CourseDetailResponse.java | `domain/course/dto/response/` | isComplete 필드 |
| CourseServiceImpl.java | `domain/course/service/` | itemCount 일괄 조회 (N+1 방지) |
| CourseRepository.java | `domain/course/repository/` | countItemsByCourseIds 쿼리 |

---

## 3. 주요 구현 내용

### 3.1 임시저장 기능 (CourseCreatePage)

```typescript
// src/pages/tu/teaching/courses/CourseCreatePage.tsx
const CourseCreatePage = () => {
  const [courseId] = useSearchParams();  // ?courseId=xxx
  const [isSaving, setIsSaving] = useState(false);

  // URL param이 있으면 기존 강의 불러오기
  useEffect(() => {
    if (courseId) {
      loadExistingCourse(courseId);
    }
  }, [courseId]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (courseId) {
        // 기존 강의 업데이트
        await courseService.update(courseId, formData);
      } else {
        // 신규 생성
        const created = await courseService.create(formData);
        // URL 업데이트 (새로고침해도 유지)
        navigate(`?courseId=${created.id}`, { replace: true });
      }
      toast.success('임시저장 완료');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button onClick={handleSaveDraft} disabled={isSaving}>
      {isSaving ? '저장 중...' : '임시저장'}
    </Button>
  );
};
```

### 3.2 목록 필터 (MyCoursesPage)

```typescript
// src/pages/tu/teaching/courses/MyCoursesPage.tsx
const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'complete', label: '작성완료' },
  { value: 'incomplete', label: '작성중' },
];

const MyCoursesPage = () => {
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all');

  // 필터링 로직
  const filteredCourses = courses?.filter((course) => {
    if (filter === 'all') return true;
    if (filter === 'complete') return course.isComplete;
    if (filter === 'incomplete') return !course.isComplete;
    return true;
  });

  return (
    <CourseCard
      course={course}
      badge={!course.isComplete && <Badge variant="warning">작성중</Badge>}
      actions={
        course.isComplete ? (
          <Button onClick={() => navigate(`${course.id}/apply`)}>
            프로그램 신청
          </Button>
        ) : (
          <Button onClick={() => navigate(`/create?courseId=${course.id}`)}>
            이어서 작성
          </Button>
        )
      }
    />
  );
};
```

### 3.3 커리큘럼 로드 버그 수정

```typescript
// src/types/tu/curriculum.types.ts
/**
 * 백엔드 CourseItemHierarchyResponse를 프론트엔드 CurriculumItem으로 변환
 */
export const convertHierarchyToCurriculumItems = (
  hierarchy: CourseItemHierarchyResponse[]
): CurriculumItem[] => {
  return hierarchy.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    orderIndex: item.orderIndex,
    children: item.children
      ? convertHierarchyToCurriculumItems(item.children)
      : [],
  }));
};

// CourseEditPage에서 사용
const { data: hierarchyData } = useCourseItemsHierarchy(courseId);
const curriculumItems = useMemo(
  () => convertHierarchyToCurriculumItems(hierarchyData ?? []),
  [hierarchyData]
);
```

### 3.4 Backend - isComplete 필드 로직

```java
// CourseResponse.java
public class CourseResponse {
    // ... 기존 필드

    private boolean isComplete;  // 완성 여부
    private int itemCount;       // 커리큘럼 아이템 수

    /**
     * 완성도 판단 기준:
     * - title 필수
     * - description 필수
     * - categoryId 필수
     * - items 1개 이상
     */
    public static CourseResponse of(Course course, int itemCount) {
        boolean isComplete = StringUtils.hasText(course.getTitle())
            && StringUtils.hasText(course.getDescription())
            && course.getCategoryId() != null
            && itemCount > 0;

        return CourseResponse.builder()
            .isComplete(isComplete)
            .itemCount(itemCount)
            // ... 기타 필드
            .build();
    }
}
```

### 3.5 N+1 방지 - itemCount 일괄 조회

```java
// CourseServiceImpl.java
@Override
public Page<CourseResponse> getMyCourses(Long userId, Pageable pageable) {
    Page<Course> courses = courseRepository.findByCreatedBy(userId, pageable);

    // 모든 courseId에 대해 itemCount 일괄 조회 (N+1 방지)
    List<Long> courseIds = courses.getContent().stream()
        .map(Course::getId)
        .collect(Collectors.toList());

    Map<Long, Integer> itemCountMap = courseRepository
        .countItemsByCourseIds(courseIds)
        .stream()
        .collect(Collectors.toMap(
            row -> (Long) row[0],
            row -> ((Number) row[1]).intValue()
        ));

    return courses.map(course ->
        CourseResponse.of(course, itemCountMap.getOrDefault(course.getId(), 0))
    );
}

// CourseRepository.java
@Query("SELECT c.id, COUNT(ci) FROM Course c LEFT JOIN CourseItem ci ON ci.courseId = c.id " +
       "WHERE c.id IN :courseIds GROUP BY c.id")
List<Object[]> countItemsByCourseIds(@Param("courseIds") List<Long> courseIds);
```

---

## 4. UI 변경 사항

### 4.1 MyCoursesPage 필터 UI

```
┌─────────────────────────────────────────────────────────────┐
│ 내 강의 계획                                    [+ 새 강의]   │
├─────────────────────────────────────────────────────────────┤
│ [전체] [작성완료] [작성중]                                    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│ │ 강의 A      │  │ 강의 B      │  │ 강의 C      │           │
│ │ [작성중]    │  │             │  │ [작성중]    │           │
│ │             │  │             │  │             │           │
│ │ [이어서작성]│  │[프로그램신청]│  │ [이어서작성]│           │
│ └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 상태별 버튼 분기

| isComplete | 배지 | 버튼 | 동작 |
|------------|------|------|------|
| true | - | 프로그램 신청 | `/courses/:id/apply` |
| false | 작성중 (warning) | 이어서 작성 | `/courses/create?courseId=:id` |

### 4.3 CourseCreatePage 임시저장 UI

| 상태 | 버튼 텍스트 | 비활성화 |
|------|------------|----------|
| 기본 | 임시저장 | - |
| 저장 중 | 저장 중... | ✅ |

---

## 5. 데이터 흐름

### 5.1 임시저장 흐름

```
CourseCreatePage
    │
    ├── [최초 진입] 빈 폼
    │
    ├── [?courseId=xxx 진입] 기존 강의 로드
    │       │
    │       └── GET /api/courses/{id}
    │
    └── [임시저장 클릭]
            │
            ├── courseId 없음 → POST /api/courses (생성)
            │                         │
            │                         └── URL에 courseId 추가
            │
            └── courseId 있음 → PUT /api/courses/{id} (수정)
```

### 5.2 isComplete 판단 흐름

```
Backend (CourseServiceImpl)
    │
    ├── getMyCourses 호출
    │       │
    │       ├── 1. 내 강의 목록 조회
    │       │
    │       ├── 2. courseIds 추출
    │       │
    │       ├── 3. countItemsByCourseIds (일괄 조회)
    │       │
    │       └── 4. CourseResponse.of(course, itemCount)
    │               │
    │               └── isComplete 계산
    │
    └── Response 반환
            │
            ▼
Frontend (MyCoursesPage)
    │
    └── isComplete 기반 UI 분기
```

---

## 6. Git 커밋 히스토리

| 커밋 | 날짜 | 내용 |
|------|------|------|
| 56dad0b | 2026-01-05 | fix: 강의 수정 페이지 커리큘럼 로드 버그 수정 및 텍스트 통일 (#249) |
| 969629c | 2026-01-05 | feat(course): CourseResponse에 isComplete 필드 추가 (#280) |
| 37b8b6c | 2026-01-05 | feat(course): 강의 계획 임시저장 기능 및 목록 필터 개선 (#254) |

---

## 7. 파일 변경 요약

| 구분 | 파일 수 | 변경 라인 |
|------|---------|----------|
| Frontend 페이지 | 3 | +195, -44 |
| Frontend 타입 | 2 | +45 |
| Backend DTO | 2 | +51 |
| Backend Service | 1 | +27 |
| Backend Repository | 1 | +4 |
| Backend Test | 1 | +143 |
| **합계** | **10** | **~465 lines** |

---

## 8. 테스트

### 8.1 Backend 테스트 추가

```java
// CourseControllerTest.java
@Test
void getMyCourses_shouldReturnIsCompleteTrue_whenAllFieldsFilled() {
    // given: title, description, categoryId, items 모두 존재
    // when: GET /api/courses/my
    // then: isComplete = true
}

@Test
void getMyCourses_shouldReturnIsCompleteFalse_whenNoItems() {
    // given: title, description, categoryId 존재, items 없음
    // when: GET /api/courses/my
    // then: isComplete = false
}
```

### 8.2 수동 테스트 항목

| 항목 | 확인 사항 |
|------|----------|
| 임시저장 | 신규 강의 생성 후 URL에 courseId 추가되는지 |
| 이어서 작성 | 기존 강의 데이터가 폼에 로드되는지 |
| 필터 동작 | 전체/작성완료/작성중 필터 정상 동작 |
| 상태 배지 | 작성중 강의에 배지 표시 |
| 버튼 분기 | isComplete에 따른 버튼 텍스트 변경 |

---

## 9. 관련 문서

- [Frontend TU Phase 13](phase13.md) - 프로그램 DRAFT 상태 및 제출 흐름
- [Backend CM Phase 7](../../backend/cm/phase7.md) - Course 낙관적 락

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-05 | hjj240228 | 커리큘럼 로드 버그 수정 |
| 2026-01-05 | hjj240228 | Backend isComplete 필드 추가 |
| 2026-01-05 | hjj240228 | 임시저장 기능 및 목록 필터 구현 |

---

*최종 업데이트: 2026-01-06*

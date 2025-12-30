# Frontend TO (Tenant Operator) 개발 로그 - Phase 4

> TO 강사 배정(InstructorAssignment) React Query 훅 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#74](https://github.com/mzcATU/mzc-lp-frontend/issues/74) |
| **관련 브랜치** | `feat/to-instructor-assignment-service` |
| **담당 모듈** | TO (Tenant Operator) - 강사 배정 React Query |
| **의존성** | Phase 3 (#73) 완료 필요 |

---

## 1. 구현 개요

Phase 3에서 구현한 `instructorAssignmentService`를 기반으로 React Query 훅을 구현했습니다.

### 배경

강사 배정은 **차수(CourseTime) 데이터와 연관**되어 있어 캐시 무효화가 복잡합니다:
- `CourseTimeDetailResponse`에 `instructors` 필드가 포함됨
- 강사 변경 시 차수 상세 정보도 함께 갱신해야 함

### 구현 범위

| 구분 | 내용 | 개수 |
|------|------|------|
| Query Keys | instructorAssignmentKeys 객체 | 3개 키 |
| Query Hooks | useTimeInstructors | 1개 |
| Mutation Hooks | useAssignInstructor, useUpdateInstructorRole, useReplaceInstructor, useCancelAssignment | 4개 |

---

## 2. 파일 구조

### 신규 생성

```
src/hooks/to/
└── useInstructorAssignmentQueries.ts    # 강사 배정 React Query 훅 (신규)
```

### 수정

```
src/hooks/to/
└── index.ts    # useInstructorAssignmentQueries export 추가
```

---

## 3. 상세 구현

### 3.1 Query Keys

```typescript
export const instructorAssignmentKeys = {
  all: ['instructorAssignments'] as const,
  byTime: (timeId: number) => [...instructorAssignmentKeys.all, 'time', timeId] as const,
  list: (timeId: number, params?: InstructorAssignmentFilterParams) =>
    [...instructorAssignmentKeys.byTime(timeId), params] as const,
};
```

**키 구조:**
```
['instructorAssignments']
  └── ['instructorAssignments', 'time', 1]
        └── ['instructorAssignments', 'time', 1, { status?: 'ACTIVE' }]
```

---

### 3.2 Query Hooks

| 훅 | 용도 | enabled 조건 |
|----|------|-------------|
| `useTimeInstructors(timeId, params?)` | 차수별 강사 목록 조회 | `!!timeId` |

**사용 예시:**
```typescript
// 차수별 강사 목록 (ACTIVE만)
const { data, isLoading } = useTimeInstructors(timeId, { status: 'ACTIVE' });
```

---

### 3.3 Mutation Hooks

| 훅 | 용도 | 캐시 무효화 |
|----|------|------------|
| `useAssignInstructor` | 강사 배정 | `byTime(timeId)` + `timeKeys.detail(timeId)` |
| `useUpdateInstructorRole` | 역할 변경 | `byTime(timeId)` |
| `useReplaceInstructor` | 강사 교체 | `byTime(timeId)` + `timeKeys.detail(timeId)` |
| `useCancelAssignment` | 배정 취소 | `byTime(timeId)` + `timeKeys.detail(timeId)` |

**사용 예시:**
```typescript
const assignInstructor = useAssignInstructor();

const handleAssign = async () => {
  await assignInstructor.mutateAsync({
    timeId: 1,
    request: {
      userId: 123,
      role: 'MAIN',
    },
  });
  // 자동으로 강사 목록 + 차수 상세 캐시가 갱신됨
};
```

---

## 4. 교차 캐시 무효화

강사 배정 변경 시 **두 가지 캐시**를 동시에 무효화합니다:

| 캐시 | 이유 |
|------|------|
| `instructorAssignmentKeys.byTime(timeId)` | 강사 목록 갱신 |
| `timeKeys.detail(timeId)` | `CourseTimeDetailResponse.instructors` 필드 갱신 |

```typescript
onSuccess: (_, variables) => {
  // 1. 강사 목록 캐시 무효화
  queryClient.invalidateQueries({
    queryKey: instructorAssignmentKeys.byTime(variables.timeId),
  });
  // 2. 차수 상세 캐시 무효화 (instructors 필드)
  queryClient.invalidateQueries({
    queryKey: timeKeys.detail(variables.timeId),
  });
};
```

---

## 5. 체크리스트

- [x] 컨벤션 및 기존 패턴 확인
- [x] Query Keys 정의 (`instructorAssignmentKeys`)
- [x] Query Hooks 구현 (`useTimeInstructors`)
- [x] Mutation Hooks 구현 (4개)
- [x] Index 파일 업데이트
- [x] TypeScript 빌드 검증 (`npx tsc --noEmit` 통과)
- [x] 코드 리뷰 (기존 패턴 일관성 확인)

---

## 6. 후속 작업

| 이슈 | 제목 | 설명 |
|------|------|------|
| #41 | TO 페이지 구현 | 차수/강사 배정 관리 페이지 |
| #45 | TO 페이지 구현 | - |
| #46 | TO 페이지 구현 | - |

---

## 7. 관련 문서

- [Phase 1](phase1.md) - 차수 타입 및 API 서비스
- [Phase 2](phase2.md) - 차수 React Query 훅
- [Phase 3](phase3.md) - 강사 배정 타입 및 API 서비스

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | Query Keys 정의 (instructorAssignmentKeys) |
| 2025-12-28 | Claude Code | Query Hooks 구현 (useTimeInstructors) |
| 2025-12-28 | Claude Code | Mutation Hooks 구현 (4개) |
| 2025-12-28 | Claude Code | 교차 캐시 무효화 구현 (timeKeys.detail 연동) |

---

*최종 업데이트: 2025-12-28*

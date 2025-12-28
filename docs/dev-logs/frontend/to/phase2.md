# Frontend TO (Tenant Operator) 개발 로그 - Phase 2

> TO 차수(CourseTime) React Query 훅 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#72](https://github.com/mzcATU/mzc-lp-frontend/issues/72) |
| **관련 브랜치** | `feat/to-time-hooks` |
| **담당 모듈** | TO (Tenant Operator) - 차수(CourseTime) React Query |
| **의존성** | Phase 1 (#71) 완료 필요 |

---

## 1. 구현 개요

Phase 1에서 구현한 `timeService`를 기반으로 React Query 훅을 구현했습니다.

### 배경

API 서비스를 직접 컴포넌트에서 사용하면 다음 문제가 발생합니다:
- 로딩/에러 상태를 수동으로 관리해야 함
- 동일한 데이터를 여러 컴포넌트에서 요청하면 중복 API 호출 발생
- 데이터 갱신 시 관련 컴포넌트들을 수동으로 리렌더링해야 함

### 해결 방안

React Query를 사용하여:
- 자동 캐싱: 동일 queryKey에 대해 캐시된 데이터 반환
- 자동 리페칭: 포커스 복귀, 네트워크 재연결 시 자동 갱신
- 캐시 무효화: mutation 성공 시 관련 쿼리 자동 무효화

### 구현 범위

| 구분 | 내용 | 개수 |
|------|------|------|
| Query Keys | timeKeys 객체 | 7개 키 |
| Query Hooks | useTimes, useTime, useTimeCapacity, useTimePrice | 4개 |
| Mutation Hooks (CRUD) | useCreateTime, useUpdateTime, useDeleteTime, useCloneTime | 4개 |
| Mutation Hooks (상태전이) | useOpenTime, useStartTime, useCloseTime, useArchiveTime | 4개 |

---

## 2. 파일 구조

### 신규 생성

```
src/hooks/to/
├── useTimeQueries.ts    # 차수 React Query 훅 (신규)
└── index.ts             # export 파일 (신규)
```

### 수정

```
src/hooks/
└── index.ts             # to export 추가
```

---

## 3. 상세 구현

### 3.1 Query Keys

```typescript
export const timeKeys = {
  all: ['times'] as const,
  lists: () => [...timeKeys.all, 'list'] as const,
  list: (params?: CourseTimeFilterParams) => [...timeKeys.lists(), params] as const,
  details: () => [...timeKeys.all, 'detail'] as const,
  detail: (id: number) => [...timeKeys.details(), id] as const,
  capacity: (id: number) => [...timeKeys.detail(id), 'capacity'] as const,
  price: (id: number) => [...timeKeys.detail(id), 'price'] as const,
};
```

**키 구조:**
```
['times']
  └── ['times', 'list']
        └── ['times', 'list', { programId?, status?, page?, size? }]
  └── ['times', 'detail']
        └── ['times', 'detail', 1]
              └── ['times', 'detail', 1, 'capacity']
              └── ['times', 'detail', 1, 'price']
```

---

### 3.2 Query Hooks

| 훅 | 용도 | enabled 조건 |
|----|------|-------------|
| `useTimes(params?)` | 차수 목록 조회 | `isAuthenticated` |
| `useTime(id)` | 차수 상세 조회 | `!!id` |
| `useTimeCapacity(id)` | 정원 정보 조회 | `!!id` |
| `useTimePrice(id)` | 가격 정보 조회 | `!!id` |

**사용 예시:**
```typescript
// 차수 목록 (필터링)
const { data, isLoading } = useTimes({ programId: 1, status: 'RECRUITING' });

// 차수 상세
const { data: timeDetail } = useTime(timeId);
```

---

### 3.3 Mutation Hooks - CRUD

| 훅 | 용도 | 캐시 무효화 |
|----|------|------------|
| `useCreateTime()` | 차수 생성 | `lists()` |
| `useUpdateTime()` | 차수 수정 | `detail(id)` + `lists()` |
| `useDeleteTime()` | 차수 삭제 | `lists()` |
| `useCloneTime()` | 차수 복제 | `lists()` |

**사용 예시:**
```typescript
const createTime = useCreateTime();

const handleCreate = async () => {
  await createTime.mutateAsync({
    programId: 1,
    cmCourseId: 1,
    title: '2024년 1차',
    deliveryType: 'ONLINE',
    enrollmentMethod: 'FIRST_COME',
    enrollmentStartDate: '2024-01-01',
    enrollmentEndDate: '2024-01-15',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
  });
};
```

---

### 3.4 Mutation Hooks - 상태 전이

| 훅 | 상태 변경 | 캐시 무효화 |
|----|----------|------------|
| `useOpenTime()` | DRAFT → RECRUITING | `detail(id)` + `lists()` + `capacity(id)` |
| `useStartTime()` | RECRUITING → ONGOING | `detail(id)` + `lists()` + `capacity(id)` |
| `useCloseTime()` | ONGOING → CLOSED | `detail(id)` + `lists()` + `capacity(id)` |
| `useArchiveTime()` | CLOSED → ARCHIVED | `detail(id)` + `lists()` |

**상태 전이 시 capacity 캐시도 무효화하는 이유:**
- 모집 개시 시 `currentEnrollment`가 0으로 초기화될 수 있음
- 상태 변경에 따라 `availableSeats` 계산이 달라질 수 있음

**사용 예시:**
```typescript
const openTime = useOpenTime();

const handleOpen = async () => {
  await openTime.mutateAsync(timeId);
  // 자동으로 상세/목록/정원 캐시가 갱신됨
};
```

---

## 4. 캐시 무효화 전략

| 액션 | 무효화 대상 | 이유 |
|------|------------|------|
| 생성 | `lists()` | 목록에 새 항목 추가 |
| 수정 | `detail(id)` + `lists()` | 상세 정보 + 목록의 요약 정보 갱신 |
| 삭제 | `lists()` | 목록에서 항목 제거 |
| 복제 | `lists()` | 목록에 복제된 항목 추가 |
| 상태전이 | `detail(id)` + `lists()` + `capacity(id)` | 상태/정원 정보 모두 갱신 |

---

## 5. 기존 패턴과의 일관성

| 항목 | 참고 파일 | 적용 결과 |
|------|----------|----------|
| 파일 구조 | `hooks/tu/useContentQueries.ts` | 동일한 구조 |
| Query Keys 패턴 | `contentKeys` | `timeKeys` 동일 패턴 |
| enabled 조건 | `isAuthenticated`, `!!id` | 동일 |
| onSuccess 캐시 무효화 | `invalidateQueries` | 동일 |

---

## 6. 체크리스트

- [x] Query Keys 정의 (`timeKeys`)
- [x] Query Hooks 구현 (4개)
- [x] Mutation Hooks - CRUD 구현 (4개)
- [x] Mutation Hooks - 상태전이 구현 (4개)
- [x] Index 파일 업데이트
- [x] TypeScript 빌드 검증 (`npx tsc --noEmit` 통과)

---

## 7. 후속 작업

| 이슈 | 제목 | 의존성 |
|------|------|--------|
| #73 | TO 강사 배정 타입 및 서비스 구현 | 없음 |
| #74 | TO 강사 배정 React Query 훅 구현 | #73 완료 필요 |

---

## 8. 관련 문서

- [Phase 1](phase1.md) - 차수 타입 및 API 서비스
- [14-REACT-API-INTEGRATION](../../../../conventions/14-REACT-API-INTEGRATION.md) - React Query 컨벤션

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | Query Keys 정의 (timeKeys) |
| 2025-12-28 | Claude Code | Query Hooks 구현 (useTimes, useTime, useTimeCapacity, useTimePrice) |
| 2025-12-28 | Claude Code | Mutation Hooks - CRUD 구현 |
| 2025-12-28 | Claude Code | Mutation Hooks - 상태전이 구현 |
| 2025-12-28 | Claude Code | hooks/to 폴더 및 index.ts 생성 |

---

*최종 업데이트: 2025-12-28*

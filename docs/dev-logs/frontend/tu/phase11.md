# Frontend TU (Tenant User) 개발 로그 - Phase 10

> TU 강의 목록 페이지 Times(차수) 기반으로 변경

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-02 |
| **관련 이슈** | [#184](https://github.com/mzcATU/mzc-lp-frontend/issues/184) |
| **관련 PR** | TBD |
| **관련 커밋** | TBD |
| **담당 모듈** | TU (Tenant User) - Times Exploration |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | TU 강의 목록 페이지가 Course API를 호출하여 강의 콘텐츠를 표시 |
| 원인 | Course = 강의 콘텐츠, Times = 실제 운영되는 차수. TU는 Times를 봐야 함 |
| 해결 | `/api/times` 엔드포인트 연동으로 운영 중인 차수 목록 표시 |

### 1.2 데이터 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Course (강의 콘텐츠)                                          │
│ - TU가 만든 강의 콘텐츠                                        │
│ - 승인 전 콘텐츠                                              │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Program (과정)                                               │
│ - Course 기반으로 생성된 과정                                  │
│ - 승인 대기/승인 완료 상태 관리                                │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Times (차수) ★ TU가 조회해야 하는 대상                         │
│ - TO가 승인/운영하는 실제 교육 과정                            │
│ - 상태: DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED     │
│ - TU는 RECRUITING, ONGOING 상태의 차수 조회                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 구현 범위

| 구분 | 내용 |
|------|------|
| Types | TimesExploreItem, TimesExploreResponse, TimesExploreFilter |
| Service | timesExploreService (getTimes, getRecruitingTimes, getOngoingTimes, getPopularTimes, getTimeDetail) |
| Hook | useTimesExplore, useTimesDetail, useRecruitingTimes, useOngoingTimes, usePopularTimes |
| Component | TimesExplorePage, TimesDetailPage |
| Route | /tu/main/times, /tu/main/times/:id |

---

## 2. 신규/수정 파일

### 2.1 신규 파일 (6개)

| 파일 | 경로 | 설명 |
|------|------|------|
| timesExplore.types.ts | `src/types/tu/` | TU용 차수 탐색 타입 정의 |
| timesExploreService.ts | `src/services/tu/` | Times API 서비스 |
| useTimesExploreQueries.ts | `src/hooks/tu/` | React Query 훅 |
| TimesExplorePage.tsx | `src/pages/tu/main/` | 차수 목록 페이지 |
| TimesDetailPage.tsx | `src/pages/tu/main/` | 차수 상세 페이지 |

### 2.2 수정 파일 (5개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| index.ts | `src/types/tu/` | timesExplore.types 내보내기 추가 |
| index.ts | `src/hooks/tu/` | Times 훅 내보내기 추가 |
| index.ts | `src/pages/tu/main/` | Times 페이지 내보내기 추가 |
| index.ts | `src/pages/tu/` | Times 페이지 내보내기 추가 |
| tu.routes.tsx | `src/routes/` | Times 라우트 추가 |

---

## 3. 주요 구현 내용

### 3.1 TimesExploreItem 타입

```typescript
export interface TimesExploreItem {
  id: number;
  title: string;
  programTitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  instructorName: string | null;
  deliveryType: DeliveryType;        // ONLINE | OFFLINE | BLENDED | LIVE
  status: CourseTimeStatus;          // RECRUITING | ONGOING | ...
  enrollStartDate: string;
  enrollEndDate: string;
  classStartDate: string;
  classEndDate: string;
  capacity: number | null;
  currentEnrollment: number;
  availableSeats: number | null;
  enrollmentMethod: EnrollmentMethod; // FIRST_COME | APPROVAL | INVITE_ONLY
  price: string | null;
  isFree: boolean;
  // UI용 계산 필드
  isEnrollable: boolean;             // 수강 신청 가능 여부
  daysUntilStart: number | null;     // 개강까지 남은 일수
  enrollmentRate: number | null;     // 등록률 (%)
}
```

### 3.2 timesExploreService - API 응답 변환

```typescript
const transformToExploreItem = (time: CourseTimeResponse): TimesExploreItem => {
  const now = new Date();
  const enrollEndDate = new Date(time.enrollEndDate);
  const classStartDate = new Date(time.classStartDate);

  // 수강 신청 가능 여부 계산
  const isEnrollable =
    (time.status === 'RECRUITING' || (time.status === 'ONGOING' && time.allowLateEnrollment)) &&
    now <= enrollEndDate &&
    (time.availableSeats === null || time.availableSeats > 0);

  // 개강까지 남은 일수 계산
  const daysUntilStart =
    classStartDate > now
      ? Math.ceil((classStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  // 등록률 계산
  const enrollmentRate =
    time.capacity !== null && time.capacity > 0
      ? Math.round((time.currentEnrollment / time.capacity) * 100)
      : null;

  return {
    id: time.id,
    title: time.title,
    // ... 변환 로직
    isEnrollable,
    daysUntilStart,
    enrollmentRate,
  };
};
```

### 3.3 필터 및 정렬 옵션

```typescript
// 상태 필터
const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'RECRUITING', label: '모집 중' },
  { value: 'ONGOING', label: '진행 중' },
];

// 진행 방식 필터
const DELIVERY_TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'BLENDED', label: '블렌디드' },
  { value: 'LIVE', label: '실시간' },
];

// 정렬 옵션
export const TIMES_SORT_OPTIONS = [
  { value: 'newest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'enrollEndDate', label: '모집 마감순' },
  { value: 'classStartDate', label: '개강일순' },
];
```

### 3.4 라우트 구성

```tsx
// tu.routes.tsx
{/* 교육과정(차수) 탐색 - Times 기반 */}
<Route path="/tu/main/times" element={<TimesExplorePage />} />
<Route path="/tu/main/times/:id" element={<TimesDetailPage />} />
<Route path="/tu/main/courses" element={<TimesExplorePage />} /> {/* 레거시 경로 호환 */}
```

---

## 4. React Query 훅

```typescript
// Query Keys
export const timesExploreKeys = {
  all: ['timesExplore'] as const,
  list: (filter?: TimesExploreFilter) => [...timesExploreKeys.all, 'list', filter] as const,
  detail: (id: number) => [...timesExploreKeys.all, 'detail', id] as const,
  recruiting: (limit?: number) => [...timesExploreKeys.all, 'recruiting', limit] as const,
  ongoing: (limit?: number) => [...timesExploreKeys.all, 'ongoing', limit] as const,
  popular: (limit?: number) => [...timesExploreKeys.all, 'popular', limit] as const,
};

// 훅 목록
export function useTimesExplore(filter?: TimesExploreFilter, enabled = true)
export function useTimesDetail(id: number, enabled = true)
export function useRecruitingTimes(limit?: number, enabled = true)
export function useOngoingTimes(limit?: number, enabled = true)
export function usePopularTimes(limit?: number, enabled = true)
```

---

## 5. UI 컴포넌트

### 5.1 TimesCard 주요 표시 정보

| 영역 | 표시 내용 |
|------|----------|
| 상단 배지 | 상태 (모집 중/진행 중), 무료 여부 |
| 진행 방식 | 온라인/오프라인/블렌디드/실시간 |
| 제목 | 차수명 |
| 프로그램명 | 상위 프로그램명 (있는 경우) |
| 강사명 | 메인 강사명 |
| 수강 기간 | classStartDate ~ classEndDate |
| 모집 현황 | currentEnrollment / capacity 명 |
| 등록률 | Progress bar + 퍼센트 |
| 가격 | price 또는 "무료" |
| D-Day | 모집 마감까지 남은 일수 |

### 5.2 TimesExplorePage 필터 UI

```
┌─────────────────────────────────────────────────────────────┐
│ [검색 입력창] [상태 ▼] [진행방식 ▼] [정렬 ▼]                  │
├─────────────────────────────────────────────────────────────┤
│ [전체] [모집 중] [진행 중]  ← 상태 탭                          │
├─────────────────────────────────────────────────────────────┤
│ 총 N개의 교육과정                                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                     │
│ │Card1│ │Card2│ │Card3│ │Card4│ │Card5│  ← 5열 그리드         │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. API 연동

### 6.1 엔드포인트 매핑

| 메서드 | 엔드포인트 | 용도 |
|--------|-----------|------|
| GET | `/api/times` | 차수 목록 조회 |
| GET | `/api/times/{id}` | 차수 상세 조회 |

### 6.2 쿼리 파라미터

| 파라미터 | 설명 |
|----------|------|
| status | RECRUITING, ONGOING |
| keyword | 검색어 |
| deliveryType | ONLINE, OFFLINE, BLENDED, LIVE |
| isFree | true/false |
| page | 페이지 번호 |
| size | 페이지 크기 |
| sort | 정렬 (createdAt,desc / currentEnrollment,desc / enrollEndDate,asc / classStartDate,asc) |

---

## 7. 변경 전/후 비교

### 7.1 변경 전 (Course 기반)

```typescript
// CoursesExplorePage.tsx
const { data } = useCourseExplore(filter);
// API: GET /api/courses
// 결과: 강의 콘텐츠 목록 (승인 전 콘텐츠 포함)
```

### 7.2 변경 후 (Times 기반)

```typescript
// TimesExplorePage.tsx
const { data } = useTimesExplore(filter);
// API: GET /api/times
// 결과: 운영 중인 차수 목록 (RECRUITING, ONGOING)
```

---

## 8. 레거시 경로 호환

기존 URL을 사용하는 곳에서 끊김 없이 동작하도록 처리:

```tsx
<Route path="/tu/main/courses" element={<TimesExplorePage />} />
```

- `/tu/main/courses` 접근 시 `TimesExplorePage` 렌더링
- 새로운 표준 경로는 `/tu/main/times`

---

## 9. 파일 변경 요약

| 구분 | 파일 수 | 라인 수 |
|------|---------|---------|
| 신규 타입 | 1 | ~99 |
| 신규 서비스 | 1 | ~218 |
| 신규 훅 | 1 | ~63 |
| 신규 페이지 | 2 | ~480 |
| 수정 (index) | 4 | ~10 |
| 수정 (routes) | 1 | ~8 |
| **합계** | **10** | **~880** |

---

## 10. 관련 문서

- [Frontend Phase 9](phase9.md) - DESIGNER 역할 토큰 갱신 버그 수정
- [TO Time Types](/types/to/time.types.ts) - CourseTimeStatus, DeliveryType 정의

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-02 | Claude Code | TimesExplore 타입 정의 |
| 2026-01-02 | Claude Code | timesExploreService 구현 |
| 2026-01-02 | Claude Code | useTimesExploreQueries 훅 구현 |
| 2026-01-02 | Claude Code | TimesExplorePage, TimesDetailPage 구현 |
| 2026-01-02 | Claude Code | tu.routes.tsx 라우트 추가 |

---

*최종 업데이트: 2026-01-02*

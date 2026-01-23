# Frontend TU (Tenant User) 개발 로그 - Phase 12

> TU CourseTime Public API 연동 - 카탈로그 페이지 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-02 |
| **관련 이슈** | [#205](https://github.com/mzcATU/mzc-lp-frontend/issues/205) |
| **관련 PR** | TBD |
| **관련 브랜치** | feat/tu-coursetime-catalog |
| **담당 모듈** | TU (Tenant User) - CourseTime Catalog |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 기존 CoursesExplorePage가 Course API를 사용하여 강의 콘텐츠를 표시 |
| 원인 | Course = 강의 설계 템플릿, CourseTime = 실제 수강 가능한 차수. 학습자는 CourseTime을 봐야 함 |
| 해결 | 백엔드에서 구현된 Public API (`/api/public/course-times`) 연동 |

### 1.2 데이터 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Course (강의 콘텐츠 템플릿)                                    │
│ - TU가 만든 강의 콘텐츠 설계                                   │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ Program (과정)                                               │
│ - Course 기반으로 생성된 과정                                  │
│ - 승인 후 운영 가능                                           │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ CourseTime (차수) ★ 학습자가 조회해야 하는 대상                  │
│ - TO가 생성/운영하는 실제 교육 과정                            │
│ - 상태: DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED     │
│ - 학습자는 RECRUITING, ONGOING 상태의 차수 조회                │
│ - Public API로 비인증 사용자도 조회 가능                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 구현 범위

| 구분 | 내용 |
|------|------|
| Types | CourseTimeCatalogResponse, CourseTimePublicDetailResponse, CourseTimeCatalogParams |
| Service | courseTimeCatalogService (getCatalog, getDetail) |
| Hook | useCourseTimeCatalog, useCourseTimeDetail |
| Component | CoursesExplorePage (수정), CourseDetailPage (수정) |
| Route | `/tu/b2c/courses`, `/tu/b2c/courses/:id` (기존 경로 유지) |

---

## 2. 신규/수정 파일

### 2.1 신규 파일 (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| courseTimeCatalog.types.ts | `src/types/tu/` | CourseTime Public API 타입 정의 |
| courseTimeCatalogService.ts | `src/services/tu/` | Public API 서비스 (인증 불필요) |
| useCourseTimeCatalogQueries.ts | `src/hooks/tu/` | React Query 훅 |

### 2.2 수정 파일 (5개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| index.ts | `src/types/tu/` | courseTimeCatalog 타입 export 추가 |
| index.ts | `src/services/tu/` | courseTimeCatalogService export 추가 |
| index.ts | `src/hooks/tu/` | useCourseTimeCatalog 훅 export 추가 |
| CoursesExplorePage.tsx | `src/pages/tu/main/` | CourseTime API 연동 |
| CourseDetailPage.tsx | `src/pages/tu/main/` | CourseTime 상세 API 연동 |

---

## 3. 주요 구현 내용

### 3.1 타입 정의 (백엔드 스펙 기반)

```typescript
/** 차수 목록 응답 (카탈로그) */
export interface CourseTimeCatalogResponse {
  id: number;
  title: string;
  status: CourseTimeStatus;
  deliveryType: DeliveryType;
  isOnDemand: boolean;              // 상시모집 여부
  enrollStartDate: string;
  enrollEndDate: string;
  classStartDate: string;
  classEndDate: string;
  capacity: number | null;
  currentEnrollment: number;
  availableSeats: number;           // 잔여석 (계산된 값)
  price: string;
  isFree: boolean;
  program: ProgramSummaryResponse | null;
  instructors: InstructorSummaryResponse[];
}

/** 차수 상세 응답 */
export interface CourseTimePublicDetailResponse {
  // ... 목록 응답 + 추가 필드
  enrollmentMethod: EnrollmentMethod;
  allowLateEnrollment: boolean;
  minProgressForCompletion: number | null;
  locationInfo: string | null;
  curriculum: CurriculumItemResponse[];
}
```

### 3.2 API Service - Public API 전용 인스턴스

```typescript
// Public API용 axios 인스턴스 (인증 토큰 불필요)
const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
});

export const courseTimeCatalogService = {
  getCatalog: async (params?: CourseTimeCatalogParams) => {
    // 다중 status 파라미터 지원
    if (params?.status && params.status.length > 0) {
      params.status.forEach((s) => searchParams.append('status', s));
    }
    // ...
  },
  getDetail: async (id: number) => { /* ... */ },
};
```

### 3.3 필터 및 정렬 옵션

```typescript
// 운영 방식 필터
const DELIVERY_TYPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
  { value: 'BLENDED', label: '블렌디드' },
  { value: 'LIVE', label: '실시간' },
];

// 정렬 옵션
const SORT_OPTIONS = [
  { value: 'enrollEndDate,asc', label: '마감임박순' },
  { value: 'classStartDate,asc', label: '개강일순' },
  { value: 'createdAt,desc', label: '최신순' },
  { value: 'price,asc', label: '가격 낮은순' },
  { value: 'price,desc', label: '가격 높은순' },
];

// 무료/유료 필터
// isFree: undefined | true | false
```

---

## 4. React Query 훅

```typescript
// Query Keys
export const courseTimeCatalogKeys = {
  all: ['courseTimeCatalog'] as const,
  catalog: (params?: CourseTimeCatalogParams) =>
    [...courseTimeCatalogKeys.all, 'catalog', params] as const,
  detail: (id: number) => [...courseTimeCatalogKeys.all, 'detail', id] as const,
};

// 훅 목록
export function useCourseTimeCatalog(params?: CourseTimeCatalogParams, enabled = true)
export function useCourseTimeDetail(id: number, enabled = true)
```

---

## 5. UI 변경 사항

### 5.1 CourseTimeCard 표시 정보

| 영역 | 기존 (Course) | 변경 (CourseTime) |
|------|---------------|-------------------|
| 태그 | NEW, 베스트, 할인중 | 상시모집, 모집중, 무료 |
| 강사 | instructor 필드 | instructors[0] (주강사) |
| 레벨 | course.level | program.level |
| 가격 | price | price (무료 시 "무료" 표시) |
| 추가 정보 | 수강생 수 | 개강일, 잔여석, 운영방식 |

### 5.2 CourseDetailPage 추가 정보

| 섹션 | 내용 |
|------|------|
| 모집/수강 기간 | enrollStartDate ~ enrollEndDate, classStartDate ~ classEndDate |
| 잔여석 | currentEnrollment / capacity (5석 이하 시 강조) |
| 수강신청 방식 | 선착순/승인제/초대 전용 |
| 장소 (오프라인) | locationInfo |
| 수료 조건 | minProgressForCompletion% |

### 5.3 디자인 유지 원칙

- **B2C 스타일 100% 유지**
- 그라데이션 태그 색상 유지
  - 상시모집: `from-[#70f2a0] to-[#6bc2f0]`
  - 모집중: `from-[#6778ff] to-[#a855f7]`
  - 무료: `from-[#ff7867] to-[#ff9a5a]`
- 다크/라이트 모드 분기 처리
- 카드 호버 효과 유지

---

## 6. API 연동

### 6.1 엔드포인트 매핑

| 메서드 | 엔드포인트 | 용도 | 인증 |
|--------|-----------|------|------|
| GET | `/api/public/course-times` | 카탈로그 목록 조회 | 불필요 |
| GET | `/api/public/course-times/{id}` | 상세 조회 | 불필요 |

### 6.2 쿼리 파라미터

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| status | List | RECRUITING, ONGOING (다중 선택) |
| deliveryType | String | ONLINE, OFFLINE, BLENDED, LIVE |
| programId | Long | 프로그램 ID 필터 |
| isFree | Boolean | 무료/유료 필터 |
| keyword | String | 제목 검색 |
| page | Integer | 페이지 번호 |
| size | Integer | 페이지 크기 |
| sort | String | 정렬 (예: enrollEndDate,asc) |

---

## 7. 변경 전/후 비교

### 7.1 변경 전 (Course 기반)

```typescript
// CoursesExplorePage.tsx
const { data } = useCourseExplore(filter);
// API: GET /api/courses (인증 필요)
// 결과: 강의 콘텐츠 목록 (설계 템플릿)
```

### 7.2 변경 후 (CourseTime 기반)

```typescript
// CoursesExplorePage.tsx
const { data } = useCourseTimeCatalog(params);
// API: GET /api/public/course-times (인증 불필요)
// 결과: 수강 가능한 차수 목록 (RECRUITING, ONGOING)
```

---

## 8. 파일 변경 요약

| 구분 | 파일 수 | 설명 |
|------|---------|------|
| 신규 타입 | 1 | ~180 lines |
| 신규 서비스 | 1 | ~85 lines |
| 신규 훅 | 1 | ~45 lines |
| 수정 (index) | 3 | export 추가 |
| 수정 (페이지) | 2 | API 연동 변경 |
| **합계** | **8** | |

---

## 9. 테스트

### 9.1 빌드 확인

```bash
npm run build
# ✓ built in 4.45s (성공)
```

### 9.2 수동 테스트 항목

| 항목 | 확인 사항 |
|------|----------|
| 목록 조회 | 모집중/진행중 차수만 표시 |
| 필터 | 운영방식, 무료/유료 필터 동작 |
| 정렬 | 마감임박순, 개강일순, 최신순 등 |
| 검색 | 키워드 검색 동작 |
| 상세 조회 | 커리큘럼, 강사 정보 표시 |
| 상시모집 | isOnDemand 태그 및 UI 분기 |

---

## 10. 관련 문서

- [Frontend TU Phase 11](phase11.md) - Times(차수) 기반 목록 페이지 (이전 작업)
- [Backend Issue](https://github.com/mzcATU/mzc-lp-backend/issues/XXX) - CourseTime Public API 구현

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-02 | Claude Code | courseTimeCatalog.types.ts 타입 정의 |
| 2026-01-02 | Claude Code | courseTimeCatalogService.ts 구현 |
| 2026-01-02 | Claude Code | useCourseTimeCatalogQueries.ts 훅 구현 |
| 2026-01-02 | Claude Code | CoursesExplorePage CourseTime API 연동 |
| 2026-01-02 | Claude Code | CourseDetailPage CourseTime API 연동 |

---

*최종 업데이트: 2026-01-02*

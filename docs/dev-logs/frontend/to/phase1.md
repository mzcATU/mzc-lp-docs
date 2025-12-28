# Frontend TO (Tenant Operator) 개발 로그 - Phase 1

> TO 차수(CourseTime) 타입 및 API 서비스 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#71](https://github.com/mzcATU/mzc-lp-frontend/issues/71) |
| **관련 브랜치** | `feat/to-time-service` |
| **담당 모듈** | TO (Tenant Operator) - 차수(CourseTime) 관리 |

---

## 1. 구현 개요

TO(Tenant Operator) 역할에서 차수(CourseTime)를 관리하기 위한 타입 정의와 API 서비스를 구현했습니다.

### 배경

기존 프론트엔드에서 차수(CourseTime) 관련 코드는 **TU(일반 사용자) 조회용**으로만 구현되어 있었습니다:
- `catalogService.ts`: 승인된 프로그램의 차수 목록 조회 (status=OPEN만)
- `enrollmentService.ts`: 차수에 수강 신청

하지만 **TO(운영자)가 차수를 생성/수정/삭제/상태 관리**하는 기능이 없어 다음 문제가 있었습니다:
1. 차수 관리 불가: 운영자가 새로운 차수를 개설하거나 기존 차수 정보를 수정할 수 없음
2. 상태 전이 불가: DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED 워크플로우 실행 불가
3. 타입 불일치: TU용 `CatalogCourseTime` 타입은 조회 전용이며, TO 관리용 타입과 다름
4. 엔드포인트 미정의: 백엔드에 구현된 12개 차수 API 중 3개만 프론트엔드에 정의됨

### 구현 범위

| 구분 | 내용 |
|------|------|
| 타입 정의 | CourseTimeStatus, DeliveryType, EnrollmentMethod 등 |
| 응답/요청 타입 | CourseTimeResponse, CreateCourseTimeRequest 등 |
| API 엔드포인트 | CRUD, 상태 전이, 조회 (12개) |
| 서비스 메서드 | timeService (12개 메서드) |

---

## 2. 파일 구조

### 신규 생성

```
src/
├── types/to/
│   └── time.types.ts          # 차수 관련 타입 정의 (신규)
└── services/to/
    └── timeService.ts         # 차수 API 서비스 (신규)
```

### 수정

```
src/
├── types/to/
│   └── index.ts               # time.types export 추가
├── services/to/
│   └── index.ts               # timeService export 추가
└── services/common/api/
    └── endpoints.ts           # TIMES 엔드포인트 확장
```

---

## 3. 상세 구현

### 3.1 타입 정의 (`time.types.ts`)

#### Enum 타입 (Union Types)

```typescript
/** 차수 상태 */
export type CourseTimeStatus =
  | 'DRAFT'       // 작성 중
  | 'RECRUITING'  // 모집 중
  | 'ONGOING'     // 진행 중
  | 'CLOSED'      // 종료됨
  | 'ARCHIVED';   // 보관됨

/** 진행 방식 */
export type DeliveryType =
  | 'ONLINE'   // 온라인
  | 'OFFLINE'  // 오프라인
  | 'BLENDED'  // 블렌디드
  | 'LIVE';    // 실시간

/** 수강 신청 방식 */
export type EnrollmentMethod =
  | 'FIRST_COME'   // 선착순
  | 'APPROVAL'     // 승인제
  | 'INVITE_ONLY'; // 초대 전용
```

#### Response 타입

```typescript
/** 차수 목록 조회 응답 */
export interface CourseTimeResponse {
  id: number;
  programId: number;
  cmCourseId: number;
  title: string;
  status: CourseTimeStatus;
  deliveryType: DeliveryType;
  enrollmentMethod: EnrollmentMethod;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  startDate: string;
  endDate: string;
  capacity: number | null;        // null = 무제한
  currentEnrollment: number;
  availableSeats: number | null;  // null = 무제한
  price: number | null;           // null = 무료
  createdAt: string;
  updatedAt: string;
}

/** 차수 상세 조회 응답 */
export interface CourseTimeDetailResponse extends CourseTimeResponse {
  description: string | null;
  location: string | null;
  programTitle: string | null;
  cmCourseTitle: string | null;
  instructors: CourseTimeInstructor[];
}
```

#### Request 타입

```typescript
/** 차수 생성 요청 */
export interface CreateCourseTimeRequest {
  programId: number;
  cmCourseId: number;
  title: string;
  deliveryType: DeliveryType;
  enrollmentMethod: EnrollmentMethod;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  price?: number | null;
  description?: string;
  location?: string;
}

/** 차수 수정 요청 */
export interface UpdateCourseTimeRequest {
  // CreateCourseTimeRequest의 Partial (programId 제외)
}

/** 차수 복제 요청 */
export interface CloneCourseTimeRequest {
  title: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  startDate: string;
  endDate: string;
}
```

#### UI 매핑 상수

```typescript
/** 상태 라벨 */
export const COURSE_TIME_STATUS_LABELS: Record<CourseTimeStatus, string> = {
  DRAFT: '작성 중',
  RECRUITING: '모집 중',
  ONGOING: '진행 중',
  CLOSED: '종료됨',
  ARCHIVED: '보관됨',
};

/** 상태 색상 (Tailwind) */
export const COURSE_TIME_STATUS_COLORS: Record<CourseTimeStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  RECRUITING: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ONGOING: { bg: 'bg-green-100', text: 'text-green-700' },
  CLOSED: { bg: 'bg-slate-100', text: 'text-slate-700' },
  ARCHIVED: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

/** 상태 전이 맵 */
export const COURSE_TIME_STATUS_TRANSITIONS: Record<CourseTimeStatus, CourseTimeStatus | null> = {
  DRAFT: 'RECRUITING',      // open
  RECRUITING: 'ONGOING',    // start
  ONGOING: 'CLOSED',        // close
  CLOSED: 'ARCHIVED',       // archive
  ARCHIVED: null,           // 최종 상태
};
```

---

### 3.2 엔드포인트 정의 (`endpoints.ts`)

```typescript
TIMES: {
  BASE: '/times',
  BY_ID: (id: number) => `/times/${id}`,
  // CRUD
  CLONE: (id: number) => `/times/${id}/clone`,
  // 상태 전이
  OPEN: (id: number) => `/times/${id}/open`,
  START: (id: number) => `/times/${id}/start`,
  CLOSE: (id: number) => `/times/${id}/close`,
  ARCHIVE: (id: number) => `/times/${id}/archive`,
  // 조회
  CAPACITY: (id: number) => `/times/${id}/capacity`,
  PRICE: (id: number) => `/times/${id}/price`,
  // 수강신청 (TU)
  ENROLLMENTS: (id: number) => `/times/${id}/enrollments`,
  // 강사 배정 (TO)
  INSTRUCTORS: (timeId: number) => `/times/${timeId}/instructors`,
  INSTRUCTOR_BY_ID: (timeId: number, assignmentId: number) =>
    `/times/${timeId}/instructors/${assignmentId}`,
  INSTRUCTOR_REPLACE: (timeId: number, assignmentId: number) =>
    `/times/${timeId}/instructors/${assignmentId}/replace`,
}
```

---

### 3.3 서비스 구현 (`timeService.ts`)

#### CRUD 메서드

| 메서드 | HTTP | 엔드포인트 | 설명 |
|--------|------|------------|------|
| `createTime` | POST | `/times` | 차수 생성 |
| `getTimes` | GET | `/times` | 차수 목록 조회 |
| `getTime` | GET | `/times/{id}` | 차수 상세 조회 |
| `updateTime` | PATCH | `/times/{id}` | 차수 수정 |
| `deleteTime` | DELETE | `/times/{id}` | 차수 삭제 |
| `cloneTime` | POST | `/times/{id}/clone` | 차수 복제 |

#### 상태 전이 메서드

| 메서드 | HTTP | 엔드포인트 | 상태 변경 |
|--------|------|------------|----------|
| `openTime` | POST | `/times/{id}/open` | DRAFT → RECRUITING |
| `startTime` | POST | `/times/{id}/start` | RECRUITING → ONGOING |
| `closeTime` | POST | `/times/{id}/close` | ONGOING → CLOSED |
| `archiveTime` | POST | `/times/{id}/archive` | CLOSED → ARCHIVED |

#### 조회 메서드

| 메서드 | HTTP | 엔드포인트 | 설명 |
|--------|------|------------|------|
| `getCapacity` | GET | `/times/{id}/capacity` | 정원 정보 조회 |
| `getPrice` | GET | `/times/{id}/price` | 가격 정보 조회 |

---

## 4. 코드 패턴

### API 응답 처리

백엔드 `ApiResponse<T>` 래퍼 구조에 맞춰 `data.data` 패턴 사용:

```typescript
async createTime(request: CreateCourseTimeRequest): Promise<CourseTimeResponse> {
  const { data } = await axiosInstance.post<{ data: CourseTimeResponse }>(
    API_ENDPOINTS.TIMES.BASE,
    request
  );
  return data.data;  // ApiResponse의 data 필드
}
```

### 기존 패턴과의 일관성

| 항목 | 참고 파일 | 적용 결과 |
|------|----------|----------|
| 타입 구조 | `program.types.ts` | 섹션 구분, 명명 규칙 일치 |
| 서비스 구조 | `programService.ts` | CRUD + 워크플로우 패턴 동일 |
| 색상 상수 | `PROGRAM_STATUS_COLORS` | Tailwind 클래스 형태 동일 |

---

## 5. 체크리스트

- [x] 타입 정의 파일 생성 (`time.types.ts`)
- [x] API 엔드포인트 추가 (`endpoints.ts`)
- [x] 서비스 구현 (`timeService.ts`)
- [x] Index 파일 업데이트
- [x] TypeScript 빌드 검증 (`npx tsc --noEmit` 통과)

---

## 6. 후속 작업

| 이슈 | 제목 | 의존성 |
|------|------|--------|
| #72 | TO 차수 React Query 훅 구현 | #71 완료 필요 |
| #73 | TO 강사 배정 타입 및 서비스 구현 | 없음 |
| #74 | TO 강사 배정 React Query 훅 구현 | #73 완료 필요 |

---

## 7. 관련 문서

- [Plan File](../../../../.claude/plans/vectorized-wibbling-petal.md) - 전체 구현 계획
- [Backend TS Module](../../backend/ts/) - 백엔드 차수 API 문서

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | 차수 타입 정의 (CourseTimeStatus, DeliveryType, EnrollmentMethod) |
| 2025-12-28 | Claude Code | 차수 응답/요청 타입 정의 |
| 2025-12-28 | Claude Code | TIMES 엔드포인트 확장 (12개) |
| 2025-12-28 | Claude Code | timeService 구현 (CRUD, 상태 전이, 조회) |
| 2025-12-28 | Claude Code | UI 매핑 상수 추가 (라벨, 색상, 상태 전이) |

---

*최종 업데이트: 2025-12-28*

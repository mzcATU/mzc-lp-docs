# Frontend TO Phase 7: 사용자 관리 및 수강 관리 페이지

## 개요

- **이슈**:
  - [#41 - TO 사용자 관리 페이지](https://github.com/mzcATU/mzc-lp-frontend/issues/41)
  - [#45 - TO 수강 관리 페이지](https://github.com/mzcATU/mzc-lp-frontend/issues/45)
- **브랜치**: `feat/41-45-to-user-enrollment-management`
- **작업일**: 2026-01-03

## 작업 내용

TO(Tenant Operator)가 테넌트 사용자와 차수별 수강생을 관리할 수 있는 두 페이지를 구현했습니다.

### 1. 사용자 관리 페이지 (`/to/users`)

**구현 기능**
- 테넌트 사용자 목록 조회 (페이지네이션)
- 검색: 이름, 이메일 키워드 검색
- 필터: 역할별, 상태별 필터링
- 상태 변경: 활성화/비활성화/정지 처리 (모달)

**테이블 컬럼**
- 사용자명, 이메일
- 역할 (시스템관리자/테넌트관리자/운영자/설계자/사용자)
- 상태 (활성/비활성/정지/탈퇴) - Badge 표시
- 가입일
- 액션 버튼 (상태 변경)

**제외 기능**
- 역할 변경: TENANT_ADMIN 권한 필요로 제외

### 2. 수강 관리 페이지 (`/to/times/:id/enrollments`)

**구현 기능**
- 차수별 수강생 목록 조회 (페이지네이션)
- 통계 카드: 총 수강생, 진행 중, 수료, 미수료
- 검색: 사용자명, 이메일 검색
- 필터: 상태별, 유형별 필터링
- 강제 배정: 필수 교육 수강자 일괄 배정 (모달)
- 수료 처리: 점수 입력 옵션 포함 (모달)
- 상태 변경: 수강 상태 변경 (모달)
- 수강 취소: 수강 철회 처리

**테이블 컬럼**
- 수강생명, 이메일
- 수강 유형 (자발적/필수) - Badge 표시
- 상태 (수강중/수료/중도취소/미수료) - Badge 표시
- 진도율 (프로그레스 바)
- 점수
- 등록일
- 액션 버튼 (수료/상태변경/취소)

## 변경 파일

### Types
- `src/types/to/user.types.ts` (신규)
  - `UserListResponse`, `TOUserDetailResponse`
  - `ChangeStatusRequest`, `UserFilterParams`
  - `TENANT_ROLE_LABELS`, `USER_STATUS_LABELS`
  - `TenantRole`, `UserStatus` - common에서 re-export

- `src/types/to/enrollment.types.ts` (신규)
  - `EnrollmentResponse`, `EnrollmentDetailResponse`
  - `ForceEnrollRequest`, `ForceEnrollResultResponse`
  - `CompleteEnrollmentRequest`, `UpdateEnrollmentStatusRequest`
  - `CourseTimeEnrollmentStatsResponse`, `EnrollmentFilterParams`

- `src/types/to/index.ts` (수정)
  - user, enrollment 타입 export 추가

### Services
- `src/services/to/userService.ts` (신규)
  - `getUsers()`: 사용자 목록 조회
  - `getUser()`: 사용자 상세 조회
  - `changeStatus()`: 상태 변경

- `src/services/to/enrollmentService.ts` (신규)
  - `adminEnrollmentService` (TU와 구분)
  - `getEnrollmentsByCourseTime()`: 차수별 수강생 목록
  - `getEnrollment()`: 수강 상세 조회
  - `getCourseTimeStats()`: 차수별 통계
  - `forceEnroll()`: 강제 배정
  - `completeEnrollment()`: 수료 처리
  - `updateStatus()`: 상태 변경
  - `cancelEnrollment()`: 수강 취소

- `src/services/to/index.ts` (수정)
  - userService, adminEnrollmentService export 추가

### Hooks
- `src/hooks/to/useUserQueries.ts` (신규)
  - `adminUserKeys` (TU와 구분)
  - `useUsers()`, `useUser()`, `useChangeUserStatus()`

- `src/hooks/to/useEnrollmentQueries.ts` (신규)
  - `adminEnrollmentKeys` (TU와 구분)
  - `useEnrollmentsByCourseTime()`, `useAdminEnrollment()`
  - `useCourseTimeEnrollmentStats()`
  - `useForceEnroll()`, `useCompleteEnrollment()`
  - `useUpdateEnrollmentStatus()`, `useAdminCancelEnrollment()`

- `src/hooks/to/index.ts` (수정)
  - useUserQueries, useEnrollmentQueries export 추가

### Pages
- `src/pages/to/user/UserManagementPage.tsx` (신규)
- `src/pages/to/user/index.ts` (신규)
- `src/pages/to/enrollment/EnrollmentManagementPage.tsx` (신규)
- `src/pages/to/enrollment/index.ts` (신규)

### Routes
- `src/routes/to.routes.tsx` (수정)
  - `/to/users` → `UserManagementPage`
  - `/to/times/:id/enrollments` → `EnrollmentManagementPage`

## 네이밍 충돌 해결

TU(Tenant User) 모듈과의 네이밍 충돌을 해결하기 위해 다음과 같이 prefix를 적용했습니다:

| 충돌 대상 | TO 모듈 이름 | 비고 |
|----------|-------------|------|
| `enrollmentService` | `adminEnrollmentService` | TU에 동일 이름 존재 |
| `userKeys` | `adminUserKeys` | Query key 구분 |
| `enrollmentKeys` | `adminEnrollmentKeys` | Query key 구분 |
| `useEnrollment` | `useAdminEnrollment` | Hook 구분 |
| `useCancelEnrollment` | `useAdminCancelEnrollment` | Hook 구분 |
| `UserDetailResponse` | `TOUserDetailResponse` | common 타입과 구분 |

## 백엔드 API

### 사용자 관리 API

```
GET /api/to/users
  ?keyword={string}
  &role={SYSTEM_ADMIN|TENANT_ADMIN|OPERATOR|DESIGNER|USER}
  &status={ACTIVE|INACTIVE|SUSPENDED|WITHDRAWN}
  &page={number}
  &size={number}
  &sort={string}

GET /api/to/users/{id}

PATCH /api/to/users/{id}/status
  Body: { status: UserStatus, reason?: string }
```

### 수강 관리 API

```
GET /api/course-times/{id}/enrollments
  ?keyword={string}
  &status={ENROLLED|COMPLETED|DROPPED|FAILED}
  &type={VOLUNTARY|MANDATORY}
  &page={number}
  &size={number}

GET /api/course-times/{id}/enrollments/stats

POST /api/course-times/{id}/enrollments/force
  Body: { userIds: number[], reason?: string }

GET /api/enrollments/{id}

PATCH /api/enrollments/{id}/complete
  Body: { score?: number }

PATCH /api/enrollments/{id}/status
  Body: { status: EnrollmentStatus, reason?: string }

DELETE /api/enrollments/{id}
```

## 디자인 패턴

- 기존 TO 페이지(`CourseTimesPage`, `InstructorAssignmentsPage`)와 동일한 구조 채택
  - 상단: 제목 + 검색바 + 필터 버튼 + 액션 버튼
  - 통계 카드 그리드 (수강 관리 페이지)
  - DataTable로 목록 표시
  - 페이지네이션

- Dialog 컴포넌트로 액션 모달 구현
  - 상태 변경 모달
  - 수료 처리 모달 (점수 입력 optional)
  - 강제 배정 모달

- 디자인 토큰 사용
  - `designTokens.colors.bg.*`
  - `designTokens.colors.text.*`
  - 하드코딩 색상 사용 금지

- Badge variants로 상태 표시
  - `success`: 활성/수료
  - `warning`: 진행중/수강중
  - `error`: 정지/미수료/중도취소
  - `secondary`: 비활성

## 테스트 결과

- TypeScript 빌드 성공 (`npm run build`)
- 라우트 등록 확인
- 네이밍 충돌 해결 확인

## 참고 사항

- 역할 변경 기능은 TENANT_ADMIN 권한이 필요하여 TO 페이지에서 제외
- 수료 처리 시 점수 입력은 선택 사항 (0-100)
- 강제 배정은 필수 교육에 대한 일괄 수강 등록 기능

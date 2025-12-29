# Frontend TO (Tenant Operator) 개발 로그 - Phase 3

> TO 차수(CourseTime) 관리 페이지 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-29 |
| **관련 이슈** | [#91](https://github.com/mzcATU/mzc-lp-frontend/issues/91) |
| **관련 브랜치** | `feat/91-to-course-time-management-page` |
| **담당 모듈** | TO (Tenant Operator) - 차수(CourseTime) 관리 페이지 |
| **의존성** | Phase 1 (#71), Phase 2 (#72) 완료 필요 |

---

## 1. 구현 개요

Phase 1(Types/Service), Phase 2(React Query Hooks)를 기반으로 차수 관리 UI 페이지를 구현했습니다.

### 배경

백엔드 TS(CourseTime) 모듈이 완성되어 있고, 프론트엔드에서 Types, Service, Hooks가 구현되어 있으나 실제 UI 페이지가 없었습니다.

### 해결 방안

기존 TU 페이지 패턴을 참고하여:
- `MyContentPage.tsx` → `CourseTimesPage.tsx` (목록 페이지)
- `ContentCreatePage.tsx` → `CourseTimeCreatePage.tsx` (생성 페이지)
- `ContentDetailPage.tsx` → `CourseTimeDetailPage.tsx` (상세/수정 페이지)

### 구현 범위

| 구분 | 내용 | 파일 |
|------|------|------|
| 목록 페이지 | 차수 목록 조회, 검색, 필터링, 페이지네이션 | `CourseTimesPage.tsx` |
| 생성 페이지 | 차수 생성 폼 (기본정보, 진행정보, 기간, 정원/가격) | `CourseTimeCreatePage.tsx` |
| 상세 페이지 | 차수 상세 조회, 수정, 삭제, 상태 전이 | `CourseTimeDetailPage.tsx` |
| 라우팅 | `/to/times`, `/to/times/create`, `/to/times/:id` | `to.routes.tsx` |
| 사이드바 | 차수 관리 메뉴 경로 수정 | `sidebar-menus.ts` |

---

## 2. 파일 구조

### 신규 생성

```
src/pages/to/time/
├── CourseTimesPage.tsx      # 차수 목록 페이지
├── CourseTimeCreatePage.tsx # 차수 생성 페이지
├── CourseTimeDetailPage.tsx # 차수 상세/수정 페이지
└── index.ts                 # export 파일
```

### 수정

```
src/routes/to.routes.tsx     # 라우팅 추가
src/config/sidebar-menus.ts  # 메뉴 경로 수정 (/to/sessions → /to/times)
```

---

## 3. 상세 구현

### 3.1 CourseTimesPage.tsx (목록 페이지)

**주요 기능:**

| 기능 | 구현 내용 |
|------|----------|
| 목록 조회 | `useTimes` 훅으로 페이지네이션된 목록 조회 |
| 검색 | 클라이언트 사이드 제목 검색 |
| 필터링 | 상태별 필터 (DRAFT, RECRUITING, ONGOING, CLOSED, ARCHIVED) |
| 통계 카드 | 전체/모집중/진행중/종료됨 카운트 |
| 테이블 | DataTable 컴포넌트 (TanStack Table) |
| 액션 | 상세 보기, 복제, 삭제 (DRAFT만) |

**컴포넌트 구조:**

```tsx
<CourseTimesPage>
  ├── Header (제목, 차수 생성 버튼)
  ├── Search & Filter Bar
  │   ├── 검색 인풋
  │   └── 필터 토글 버튼
  ├── Filter Options (상태별 버튼)
  ├── Statistics Cards (IconStatCard x 4)
  └── DataTable (목록)
      └── Pagination
</CourseTimesPage>
```

**컬럼 정의:**

| 컬럼 | 내용 |
|------|------|
| 차수명 | 제목 + ID |
| 상태 | Badge (variant별 색상) |
| 진행 방식 | DELIVERY_TYPE_LABELS |
| 학습 기간 | 시작일 ~ 종료일 |
| 정원 | 현재/최대 (또는 무제한) |
| 액션 | 상세, 복제, 삭제 버튼 |

---

### 3.2 CourseTimeCreatePage.tsx (생성 페이지)

**폼 섹션:**

| 섹션 | 필드 |
|------|------|
| 기본 정보 | 프로그램 ID*, 강의 ID*, 차수명*, 설명 |
| 진행 정보 | 진행 방식, 수강 신청 방식, 장소 |
| 기간 정보 | 모집 시작일*, 모집 종료일*, 학습 시작일*, 학습 종료일* |
| 정원 및 가격 | 정원 (0=무제한), 가격 (0=무료) |

**유효성 검사:**

```typescript
const validateForm = (): boolean => {
  // 필수 필드 검증
  if (!formData.programId) newErrors.programId = getText('required');
  if (!formData.cmCourseId) newErrors.cmCourseId = getText('required');
  if (!formData.title.trim()) newErrors.title = getText('required');
  if (!formData.enrollmentStartDate) newErrors.enrollmentStartDate = getText('required');
  if (!formData.enrollmentEndDate) newErrors.enrollmentEndDate = getText('required');
  if (!formData.startDate) newErrors.startDate = getText('required');
  if (!formData.endDate) newErrors.endDate = getText('required');
  // ...
};
```

---

### 3.3 CourseTimeDetailPage.tsx (상세/수정 페이지)

**주요 기능:**

| 기능 | 구현 내용 |
|------|----------|
| 상세 조회 | `useTime` 훅으로 상세 정보 조회 |
| 수정 모드 | isEditing 상태로 토글 (DRAFT 상태만) |
| 상태 전이 | 워크플로우 버튼 (DRAFT→RECRUITING→ONGOING→CLOSED→ARCHIVED) |
| 삭제 | DRAFT 상태만 삭제 가능 |
| 복제 | `/to/times/:id/clone` 으로 이동 |

**카드 레이아웃:**

```
┌─────────────────┬─────────────────┐
│   기본 정보      │   프로그램 정보   │
├─────────────────┼─────────────────┤
│   진행 정보      │   기간 정보      │
├─────────────────┼─────────────────┤
│  정원 및 수강    │   강사 정보      │
└─────────────────┴─────────────────┘
```

**상태 전이 버튼:**

| 현재 상태 | 버튼 | 다음 상태 |
|----------|------|----------|
| DRAFT | 모집 시작 | RECRUITING |
| RECRUITING | 학습 시작 | ONGOING |
| ONGOING | 종료 | CLOSED |
| CLOSED | 보관 | ARCHIVED |
| ARCHIVED | (없음) | - |

---

### 3.4 라우팅 설정

**to.routes.tsx 변경:**

```tsx
// Before
<Route path="sessions" element={<PlaceholderPage title="차수 관리" />} />

// After
<Route path="times" element={<CourseTimesPage />} />
<Route path="times/create" element={<CourseTimeCreatePage />} />
<Route path="times/:id" element={<CourseTimeDetailPage />} />
```

**sidebar-menus.ts 변경:**

```typescript
// Before
{ id: 'session-management', label: { ko: '차수 관리', en: 'Session Management' }, icon: Calendar, path: '/to/sessions' }

// After
{ id: 'time-management', label: { ko: '차수 관리', en: 'Course Time Management' }, icon: Calendar, path: '/to/times' }
```

---

## 4. 디자인 패턴

### 4.1 다국어 지원

```typescript
const t = {
  title: { ko: '차수 관리', en: 'Course Time Management' },
  // ...
};

const getText = (key: keyof typeof t) => (language === 'ko' ? t[key].ko : t[key].en);
```

### 4.2 상태 Badge Variant

```typescript
const statusBadgeVariant: Record<CourseTimeStatus, BadgeVariant> = {
  DRAFT: 'secondary',
  RECRUITING: 'default',
  ONGOING: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'destructive',
};
```

### 4.3 폼 상태 관리

```typescript
const [formData, setFormData] = useState<CreateCourseTimeRequest>({...});
const [errors, setErrors] = useState<Partial<Record<keyof CreateCourseTimeRequest, string>>>({});

const handleInputChange = (field: keyof CreateCourseTimeRequest, value: string | number | null) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
  if (errors[field]) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }
};
```

---

## 5. 사용된 공통 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| `Button` | 액션 버튼 (variant: brand, ghost, neutral) |
| `Badge` | 상태 표시 |
| `DataTable` | 목록 테이블 |
| `DataTableColumnHeader` | 정렬 가능한 컬럼 헤더 |
| `IconStatCard` | 통계 카드 |
| `Input` | 텍스트/숫자/날짜 입력 |
| `Label` | 폼 라벨 |
| `NativeSelect` | 셀렉트 박스 |
| `Card` | 카드 컨테이너 |

---

## 6. 사용된 React Query Hooks

| 훅 | 용도 |
|----|------|
| `useTimes` | 차수 목록 조회 |
| `useTime` | 차수 상세 조회 |
| `useCreateTime` | 차수 생성 |
| `useUpdateTime` | 차수 수정 |
| `useDeleteTime` | 차수 삭제 |
| `useOpenTime` | 모집 시작 (DRAFT → RECRUITING) |
| `useStartTime` | 학습 시작 (RECRUITING → ONGOING) |
| `useCloseTime` | 종료 (ONGOING → CLOSED) |
| `useArchiveTime` | 보관 (CLOSED → ARCHIVED) |

---

## 7. 체크리스트

- [x] 차수 목록 페이지 구현 (`CourseTimesPage.tsx`)
- [x] 차수 생성 페이지 구현 (`CourseTimeCreatePage.tsx`)
- [x] 차수 상세/수정 페이지 구현 (`CourseTimeDetailPage.tsx`)
- [x] 페이지 index.ts 생성
- [x] 라우팅 설정 (`to.routes.tsx`)
- [x] 사이드바 메뉴 경로 수정 (`sidebar-menus.ts`)
- [x] 기존 TU 페이지 패턴 준수
- [x] 디자인 토큰 사용 (하드코딩 없음)
- [x] 다국어 지원 (ko/en)

---

## 8. 후속 작업

| 이슈 | 제목 | 내용 |
|------|------|------|
| TBD | 차수 복제 페이지 | `/to/times/:id/clone` 페이지 구현 |
| TBD | 강사 배정 기능 | 강사 검색/추가/제거 UI |
| #90 | TO 프로그램 관리 페이지 | 프로그램 승인/반려 기능 |
| #45 | TO 수강 관리 페이지 | 수강생 관리 기능 |

---

## 9. 관련 문서

- [Phase 1](phase1.md) - 차수 타입 및 API 서비스
- [Phase 2](phase2.md) - 차수 React Query 훅
- [12-REACT-COMPONENT-CONVENTIONS](../../../../conventions/12-REACT-COMPONENT-CONVENTIONS.md)
- [Design Tokens](../../../../conventions/design/01-DESIGN-TOKENS-COMMON.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-29 | Claude Code | CourseTimesPage.tsx 구현 (목록/검색/필터/통계) |
| 2025-12-29 | Claude Code | CourseTimeCreatePage.tsx 구현 (생성 폼) |
| 2025-12-29 | Claude Code | CourseTimeDetailPage.tsx 구현 (상세/수정/상태전이) |
| 2025-12-29 | Claude Code | 라우팅 및 사이드바 메뉴 설정 |

---

*최종 업데이트: 2025-12-29*

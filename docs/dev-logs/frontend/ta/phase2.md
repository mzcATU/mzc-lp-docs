# Frontend TA Phase 2: 대시보드 API 연동 + 월별 추이 차트

## 개요

- **이슈**: [#219 - TA Dashboard API 연동](https://github.com/mzcATU/mzc-lp-frontend/issues/219)
- **브랜치**: `feat/218-221-admin-dashboard-api`
- **작업일**: 2026-01-03

## 작업 내용

TA(Tenant Admin) 대시보드 페이지의 Mock 데이터를 실제 백엔드 API로 연동하고, 월별 수강 추이 차트를 추가했습니다.

### API 연동

**엔드포인트**
- `GET /api/admin/dashboard/kpi` - TA KPI 대시보드 통계 조회

**응답 구조**
```typescript
interface TaKpiDashboardResponse {
  userStats: {
    active: number;
    inactive: number;
    suspended: number;
    withdrawn: number;
    total: number;
    newThisMonth: number;
  };
  programStats: {
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    closed: number;
    total: number;
  };
  enrollmentStats: {
    totalEnrollments: number;
    byStatus: {
      enrolled: number;
      completed: number;
      dropped: number;
      failed: number;
    };
    completionRate: number;
  };
  monthlyTrend: Array<{
    month: string;    // "YYYY-MM" 형식
    enrollments: number;
    completions: number;
  }>;
}
```

### 구현 파일

| 파일 | 설명 |
|------|------|
| `src/types/admin/dashboard.types.ts` | TA KPI 대시보드 타입 정의 |
| `src/services/common/api/endpoints.ts` | TA_DASHBOARD.KPI 엔드포인트 추가 |
| `src/services/ta/dashboardService.ts` | API 호출 서비스 |
| `src/hooks/ta/useDashboardQueries.ts` | React Query 훅 |
| `src/pages/ta/dashboard/DashboardPage.tsx` | 대시보드 페이지 |

### UI 변경사항

**기존 (Mock 데이터)**
- 하드코딩된 사용자, 강좌, 학습 통계
- 최근 사용자 테이블
- 인기 강좌 목록

**변경 후 (API 연동)**
- 사용자 통계 카드: 전체/이번 달 신규/활성 사용자
- 프로그램 통계 카드: 전체/승인 프로그램
- 수강 완료율 카드
- 사용자 현황 섹션: 활성/비활성/정지/탈퇴 비율
- 프로그램 현황 섹션: 작성중/검토대기/승인/반려
- 수강 현황 섹션: 수강중/수료/중도포기/미수료
- **월별 수강 추이 차트** (새로 추가)
- Skeleton 로딩 상태 추가
- 에러 상태 UI 추가

### 월별 추이 차트

`recharts` 라이브러리를 사용하여 LineChart 구현:
- **수강 신청 라인**: 브랜드 컬러 (파란색)
- **수료 라인**: 성공 컬러 (초록색)
- X축: 월 ("1월", "2월", ...)
- Y축: 건수
- 툴팁: "2026년 01월" 형식

```tsx
<LineChart data={monthlyTrend}>
  <Line dataKey="enrollments" name="수강 신청" stroke="hsl(var(--brand-primary))" />
  <Line dataKey="completions" name="수료" stroke="hsl(var(--success))" />
</LineChart>
```

### 제외 항목

- 최근 가입 사용자 목록: 별도 API 필요
- 인기 강좌 목록: 별도 API 필요

## 아키텍처 패턴

```
Types → Service → Hook → Page
```

1. **Types**: 백엔드 응답 타입 정의 (`dashboard.types.ts`)
2. **Service**: axios 기반 API 호출 (`dashboardService.ts`)
3. **Hook**: React Query를 통한 상태 관리 (`useDashboardQueries.ts`)
4. **Page**: 훅을 사용하여 데이터 표시 + 차트 (`DashboardPage.tsx`)

## 사용 라이브러리

- `recharts@^3.6.0` - React 차트 라이브러리

## 테스트

- [x] TypeScript 타입 체크 통과
- [x] 빌드 성공
- [ ] 백엔드 연동 테스트 (백엔드 서버 필요)

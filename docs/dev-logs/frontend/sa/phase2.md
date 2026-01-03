# Frontend SA Phase 2: 대시보드 API 연동

## 개요

- **이슈**: [#218 - SA Dashboard API 연동](https://github.com/mzcATU/mzc-lp-frontend/issues/218)
- **브랜치**: `feat/218-221-admin-dashboard-api`
- **작업일**: 2026-01-03

## 작업 내용

SA(System Admin) 대시보드 페이지의 Mock 데이터를 실제 백엔드 API로 연동했습니다.

### API 연동

**엔드포인트**
- `GET /api/sa/dashboard` - SA 대시보드 통계 조회

**응답 구조**
```typescript
interface SaDashboardResponse {
  tenantStats: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    terminated: number;
    byPlan: Record<string, number>;
  };
  userStats: {
    total: number;
    active: number;
    suspended: number;
    withdrawn: number;
  };
  recentTenants: Array<{
    id: number;
    code: string;
    name: string;
    status: string;
    plan: string;
    createdAt: string;
  }>;
}
```

### 구현 파일

| 파일 | 설명 |
|------|------|
| `src/types/admin/dashboard.types.ts` | SA/TA 대시보드 타입 정의 |
| `src/services/common/api/endpoints.ts` | SA_DASHBOARD 엔드포인트 추가 |
| `src/services/sa/dashboardService.ts` | API 호출 서비스 |
| `src/hooks/sa/useDashboardQueries.ts` | React Query 훅 |
| `src/pages/sa/dashboard/DashboardPage.tsx` | 대시보드 페이지 |

### UI 변경사항

**기존 (Mock 데이터)**
- 시스템 리소스 카드 (CPU, 메모리, 디스크)
- 하드코딩된 통계 데이터

**변경 후 (API 연동)**
- 테넌트 통계: 전체/활성/대기/정지/종료
- 사용자 통계: 전체/활성/정지/탈퇴
- 최근 생성된 테넌트 목록 (실제 데이터)
- Skeleton 로딩 상태 추가
- 에러 상태 UI 추가

### 제외 항목

- 시스템 리소스 (CPU, 메모리, 디스크): 백엔드 API에서 제공하지 않음
- 월별 추이 차트: 향후 API 추가 시 구현 예정

## 아키텍처 패턴

```
Types → Service → Hook → Page
```

1. **Types**: 백엔드 응답 타입 정의 (`dashboard.types.ts`)
2. **Service**: axios 기반 API 호출 (`dashboardService.ts`)
3. **Hook**: React Query를 통한 상태 관리 (`useDashboardQueries.ts`)
4. **Page**: 훅을 사용하여 데이터 표시 (`DashboardPage.tsx`)

## 테스트

- [x] TypeScript 타입 체크 통과
- [x] 빌드 성공
- [ ] 백엔드 연동 테스트 (백엔드 서버 필요)

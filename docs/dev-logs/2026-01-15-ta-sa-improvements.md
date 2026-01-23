# TA/SA 관리 기능 개선

> **작업 기간**: 2026-01-15 ~ 2026-01-22
> **관련 이슈**: #414, #424, #516, #518, #521, #522, #525, #526

## 개요

테넌트 관리자(TA)와 시스템 관리자(SA) 페이지의 기능을 대폭 개선했습니다.

## TA 사용자 관리 개선

### 1. 서버사이드 페이지네이션 (#518)
```typescript
// API 요청
GET /api/users?page=0&size=20&keyword=홍길동&role=USER

// 응답
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0
}
```

### 2. 사용자 수정 다이얼로그 (#522)
- 인라인 수정 → 다이얼로그 방식으로 변경
- 역할 다중 선택
- 부서/직급 수정

### 3. 시스템 공지 탭 추가 (#525)
- SA가 발송한 시스템 공지 목록 조회
- 테넌트 내 공지와 구분

## SA 테넌트 관리 개선

### 1. 테넌트 브랜딩 격리 (#424)
```java
// SYSTEM_ADMIN은 tenantId = NULL
// 모든 테넌트 데이터 접근 가능
// 브랜딩 설정은 각 테넌트별로 격리
```

### 2. 테넌트 삭제 개선 (#423)
- 연관 데이터 cascade 삭제
  - `tenant_categories`
  - `navigation_items`
  - `users` (해당 테넌트)
  - `enrollments` (해당 테넌트)

### 3. 테넌트별 분석 기능 (#414, #516)
- 테넌트 선택 드롭다운
- 선택된 테넌트의 통계 표시
- 수강률, 완료율, 활성 사용자 수

## 브랜딩 설정 개선

### TA 브랜딩 템플릿 (#521)
```typescript
interface TenantBranding {
  // 기본 설정
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;

  // 확장 설정
  heroImage: string;
  heroTitle: string;
  sidebarItems: NavigationItem[];
  bannerEnabled: boolean;
  bannerText: string;
}
```

### 파일 업로드 개선
- 로고 이미지 업로드
- 히어로 배너 이미지 업로드
- 파비콘 자동 생성 (테넌트명 첫글자)

## 관리자 로그인 페이지 UI 개선 (#526)

### 변경 사항
- 어드민 디자인 토큰 적용
- 다크 테마 기본 적용
- Shield 아이콘 로고

## 활동 로그 기능 (#495)

### 기록 항목
- 로그인/로그아웃
- 역할 변경
- 사용자 생성/수정/삭제
- 과정 생성/승인/발행

### API
```
GET /api/activity-logs?page=0&size=20&type=USER_CREATE
GET /api/activity-logs/export?format=csv
```

## 관련 파일

### Backend
- `TenantServiceImpl.java` - 삭제 로직 개선
- `ActivityLogService.java` - 활동 로그
- `SaAnalyticsController.java` - SA 분석 API

### Frontend
- `TAUserManagementPage.tsx`
- `SADashboardPage.tsx`
- `BrandingSettingsPage.tsx`
- `ActivityLogPage.tsx`
- `AdminLoginPage.tsx`

# 페이지 URL 라우팅 가이드 (Page Routing Guide)

> 작성일: 2026-01-23
> 최종 수정: 2026-01-23
> 프론트엔드 페이지 URL 구조 및 라우팅 규칙

**통계**: 총 164개 페이지 (SA 10, TA 12, CO 15, TU 95+, B2B 17, 공통 10+)

---

## 📋 개요

MZC Learning Platform의 프론트엔드 라우팅은 **역할(Role) 기반**으로 구성됩니다.

### URL 구조

```
https://{domain}/{role-prefix}/{feature}/{action}

예시:
https://app.mzc-learning.com/ta/users/123/edit
        │                      │   │     │   │
        도메인                 역할 기능  ID  액션
```

### 역할별 URL Prefix

| 역할 | Prefix | 설명 |
|------|--------|------|
| SYSTEM_ADMIN | `/sa` | 시스템 관리자 (전체 플랫폼) |
| TENANT_ADMIN | `/ta` | 테넌트 관리자 |
| OPERATOR | `/co` | 운영자 (Course Operator) |
| DESIGNER | `/tu/teaching` | 강의 설계자 |
| INSTRUCTOR | `/tu/teaching` | 강사 |
| USER | `/tu` | 학습자 (Tenant User) |

---

## 🔐 시스템 관리자 페이지 (SYSTEM_ADMIN)

> Prefix: `/sa`

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/sa` | 대시보드 | 전체 플랫폼 현황 |
| `/sa/dashboard` | 대시보드 | 전체 플랫폼 현황 |
| `/sa/tenants` | 테넌트 목록 | 테넌트 관리 |
| `/sa/tenants/new` | 테넌트 생성 | 새 테넌트 추가 |
| `/sa/tenants/:id` | 테넌트 상세 | 테넌트 정보 조회 |
| `/sa/tenants/:id/edit` | 테넌트 수정 | 테넌트 정보 수정 |
| `/sa/analytics` | 전체 분석 | 플랫폼 통계 |
| `/sa/billing` | 결제 관리 | 테넌트별 결제 현황 |
| `/sa/system` | 시스템 설정 | 전역 설정 |
| `/sa/system/logs` | 시스템 로그 | 감사 로그 |

---

## 👔 테넌트 관리자 페이지 (TENANT_ADMIN)

> Prefix: `/ta`

### 대시보드

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/ta` | 대시보드 | 테넌트 현황 요약 |
| `/ta/dashboard` | 대시보드 | 테넌트 현황 요약 |

### 사용자 관리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/ta/users` | 사용자 목록 | 전체 사용자 관리 |
| `/ta/users/new` | 사용자 생성 | 단일 사용자 추가 |
| `/ta/users/bulk-upload` | 대량 업로드 | Excel/CSV 업로드 |
| `/ta/users/:id` | 사용자 상세 | 사용자 정보 조회 |
| `/ta/users/:id/edit` | 사용자 수정 | 사용자 정보 수정 |
| `/ta/users/:id/roles` | 역할 관리 | 사용자 역할 설정 |

### 조직 관리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/ta/departments` | 부서 목록 | 부서 트리 관리 |
| `/ta/departments/new` | 부서 생성 | 새 부서 추가 |
| `/ta/departments/:id` | 부서 상세 | 부서 정보, 소속 직원 |
| `/ta/departments/:id/edit` | 부서 수정 | 부서 정보 수정 |

### 강의 승인

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/ta/approvals` | 승인 대기 목록 | 강의 개설 승인 |
| `/ta/approvals/:id` | 승인 상세 | 강의 검토 및 승인/반려 |

### 설정

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/ta/branding` | 브랜딩 설정 | 로고, 색상, 테마 |
| `/ta/features` | 기능 설정 | 기능 ON/OFF |
| `/ta/automation` | 자동화 규칙 | 자동 수강 신청 등 |
| `/ta/analytics` | 분석 | 테넌트 통계 |
| `/ta/settings` | 일반 설정 | 테넌트 설정 |

---

## 🎯 운영자 페이지 (OPERATOR)

> Prefix: `/co` (Course Operator)

### 대시보드

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/co` | 운영 대시보드 | 운영 현황 요약 |
| `/co/dashboard` | 운영 대시보드 | 운영 현황 요약 |

### 강의/차수 관리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/co/courses` | 강의 목록 | 승인된 강의 목록 |
| `/co/courses/:id` | 강의 상세 | 강의 정보, 차수 목록 |
| `/co/times` | 차수 목록 | 전체 차수 관리 |
| `/co/times/new` | 차수 생성 | 새 차수 개설 |
| `/co/times/:id` | 차수 상세 | 차수 정보, 수강생 |
| `/co/times/:id/edit` | 차수 수정 | 차수 정보 수정 |

### 수강 관리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/co/enrollments` | 수강 목록 | 전체 수강 현황 |
| `/co/enrollments/:id` | 수강 상세 | 수강생 정보, 진도 |
| `/co/times/:id/enrollments` | 차수별 수강생 | 특정 차수 수강생 관리 |
| `/co/times/:id/enrollments/new` | 수강 등록 | 수강생 추가 |
| `/co/times/:id/waitlist` | 대기자 명단 | 대기자 관리, 승격 |

### 강사 관리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/co/instructors` | 강사 목록 | 강사 관리 |
| `/co/instructors/:id` | 강사 상세 | 강사 정보, 배정 이력 |
| `/co/times/:id/instructors` | 차수 강사 | 차수별 강사 배정 |

### 공지사항

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/co/notices` | 공지사항 관리 | 운영 공지 목록 |
| `/co/notices/inbox` | 공지 수신함 | 시스템 공지 수신 |

### 기타

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/co/users` | 사용자 조회 | 학습자 정보 조회 |
| `/co/member-pool` | 멤버풀 | 수강 대상자 풀 관리 |
| `/co/auto-enrollment` | 자동 수강 | 자동 수강 규칙 설정 |
| `/co/analytics` | 운영 분석 | 수강 통계 |
| `/co/courses/pending` | 승인 대기 | 승인 대기 강의 |

---

## 📚 학습자 페이지 (USER)

> Prefix: `/tu` (Tenant User)

### 메인

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu` | 대시보드 | 학습 현황 요약 |
| `/tu/dashboard` | 대시보드 | 학습 현황 요약 |

### 강의 탐색

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/catalog` | 강의 카탈로그 | 전체 강의 목록 |
| `/tu/catalog?category=:id` | 카테고리별 | 카테고리 필터링 |
| `/tu/catalog?keyword=:keyword` | 검색 결과 | 키워드 검색 |
| `/tu/courses/:id` | 강의 상세 | 강의 정보, 차수 목록 |
| `/tu/courses/:id/reviews` | 수강평 | 강의 리뷰 목록 |

### 수강 신청

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/cart` | 장바구니 | 담은 강의 목록 |
| `/tu/wishlist` | 찜 목록 | 관심 강의 |
| `/tu/checkout` | 결제 | 결제 진행 |
| `/tu/checkout/complete` | 결제 완료 | 결제 완료 안내 |

### 내 학습

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/my` | 내 강의실 | 수강 중인 강의 |
| `/tu/my/courses` | 내 강의 목록 | 전체 수강 이력 |
| `/tu/my/courses?status=in_progress` | 학습 중 | 진행 중인 강의 |
| `/tu/my/courses?status=completed` | 완료 | 완료된 강의 |
| `/tu/my/certificates` | 수료증 | 발급된 수료증 |

### 학습 플레이어

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/learning/:enrollmentId` | 학습 화면 | 강의 콘텐츠 재생 |
| `/tu/learning/:enrollmentId/curriculum` | 커리큘럼 | 학습 목차 |
| `/tu/learning/:enrollmentId/items/:itemId` | 학습 항목 | 특정 콘텐츠 |
| `/tu/learning/:enrollmentId/quiz/:quizId` | 퀴즈 | 퀴즈 응시 |
| `/tu/learning/:enrollmentId/assignment/:assignmentId` | 과제 | 과제 제출 |

### 커뮤니티

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/community` | 커뮤니티 | 게시판 목록 |
| `/tu/community/:boardId` | 게시판 | 게시글 목록 |
| `/tu/community/:boardId/posts/:postId` | 게시글 상세 | 게시글, 댓글 |
| `/tu/community/:boardId/posts/new` | 게시글 작성 | 새 게시글 |
| `/tu/qna` | Q&A | 질문 게시판 |
| `/tu/qna/:questionId` | Q&A 상세 | 질문, 답변 |

### 마이페이지

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/mypage` | 마이페이지 | 내 정보 |
| `/tu/mypage/profile` | 프로필 | 프로필 수정 |
| `/tu/mypage/password` | 비밀번호 | 비밀번호 변경 |
| `/tu/mypage/notifications` | 알림 설정 | 알림 ON/OFF |

---

## 🏢 B2B 학습 페이지 (B2B Learning)

> Prefix: `/tu/b2b`

B2B 전용 학습 플랫폼 페이지입니다. 기업 고객을 위한 맞춤형 UI를 제공합니다.

### 메인/탐색

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/b2b` | B2B 랜딩 | B2B 홈 (카테고리별 강좌 목록) |
| `/tu/b2b/search` | 강좌 검색 | 검색 및 고급 필터링 |
| `/tu/b2b/courses/:id` | 강좌 상세 | 강좌 정보, 강사, 등록 |

### 학습

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/b2b/learning/:id` | 학습 상세 | 강좌별 커리큘럼 |
| `/tu/b2b/learning/:id/player` | 학습 플레이어 | 콘텐츠 재생 (16:9 고정) |

### 마이페이지

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/b2b/mypage` | 마이페이지 홈 | 프로필, 학습 통계 |
| `/tu/b2b/mypage/learning` | 내 학습 | 등록한 강좌 목록 |
| `/tu/b2b/mypage/completed` | 완료한 강좌 | 수료 강좌 목록 |
| `/tu/b2b/mypage/activity` | 내 활동 | 댓글 단 게시글 |
| `/tu/b2b/mypage/certifications` | 수료증 | 발급된 수료증 다운로드 |
| `/tu/b2b/mypage/wishlist` | 위시리스트 | 찜한 강좌 관리 |
| `/tu/b2b/mypage/notices` | 알림 | 공지사항 및 알림 |

### 강사 기능

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/b2b/teaching` | 강의 관리 | 강사 강의 목록 |
| `/tu/b2b/teaching/stats` | 강의 통계 | 수강생 수, 매출 통계 |

### 설정

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/b2b/profile` | 프로필 | 프로필 정보 수정 |
| `/tu/b2b/settings` | 설정 | 테마, 언어 설정 |
| `/tu/b2b/preferences` | 선호도 | 테마, 언어, 알림 설정 |

---

## ✏️ 강의 설계자/강사 페이지 (DESIGNER/INSTRUCTOR)

> Prefix: `/tu/teaching`

### 강의 관리 (DESIGNER)

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/teaching` | 티칭 대시보드 | 제작/강의 현황 |
| `/tu/teaching/courses` | 내 강의 | 생성한 강의 목록 |
| `/tu/teaching/courses/new` | 강의 생성 | 새 강의 만들기 |
| `/tu/teaching/courses/:id` | 강의 상세 | 강의 정보 |
| `/tu/teaching/courses/:id/edit` | 강의 수정 | 기본 정보 수정 |
| `/tu/teaching/courses/:id/curriculum` | 커리큘럼 편집 | 학습 구조 설계 |
| `/tu/teaching/courses/:id/content` | 콘텐츠 관리 | 콘텐츠 업로드 |
| `/tu/teaching/courses/:id/preview` | 미리보기 | 학습자 화면 미리보기 |
| `/tu/teaching/courses/:id/submit` | 승인 요청 | 개설 승인 요청 |

### 콘텐츠 라이브러리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/teaching/content` | 콘텐츠 라이브러리 | 재사용 가능 콘텐츠 |
| `/tu/teaching/content/new` | 콘텐츠 업로드 | 새 콘텐츠 |
| `/tu/teaching/content/:id` | 콘텐츠 상세 | 콘텐츠 정보 |

### 과제/퀴즈 관리

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/teaching/assignments` | 과제 목록 | 전체 과제 |
| `/tu/teaching/assignments/:id` | 과제 상세 | 제출 현황 |
| `/tu/teaching/quizzes` | 퀴즈 목록 | 전체 퀴즈 |
| `/tu/teaching/quizzes/:id` | 퀴즈 상세 | 응시 현황 |

### 강사 기능 (INSTRUCTOR)

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/teaching/classes` | 담당 차수 | 배정된 차수 목록 |
| `/tu/teaching/classes/:timeId` | 차수 상세 | 수강생 관리 |
| `/tu/teaching/classes/:timeId/attendance` | 출석 관리 | 출석 체크 |
| `/tu/teaching/classes/:timeId/grades` | 성적 관리 | 성적 입력/조회 |
| `/tu/teaching/classes/:timeId/assignments` | 과제 채점 | 과제 제출물 채점 |
| `/tu/teaching/classes/:timeId/qna` | Q&A | 학습자 질문 답변 |

### 통계

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/tu/teaching/analytics` | 강의 분석 | 수강 통계 |
| `/tu/teaching/analytics/:courseId` | 강의별 분석 | 특정 강의 통계 |

---

## 🔑 공통 페이지

### 인증

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/login` | 로그인 | 로그인 페이지 |
| `/logout` | 로그아웃 | 로그아웃 처리 |
| `/register` | 회원가입 | 회원가입 (허용 시) |
| `/forgot-password` | 비밀번호 찾기 | 비밀번호 재설정 요청 |
| `/reset-password` | 비밀번호 재설정 | 새 비밀번호 설정 |
| `/switch-role` | 역할 전환 | 다중 역할 전환 |

### 에러

| URL | 페이지명 | 설명 |
|-----|---------|------|
| `/403` | 접근 거부 | 권한 없음 |
| `/404` | 페이지 없음 | 존재하지 않는 페이지 |
| `/500` | 서버 오류 | 서버 에러 |

---

## 🚦 라우팅 규칙

### 1. 권한 기반 리다이렉트

```typescript
// 로그인 후 역할별 기본 페이지
const defaultRoutes: Record<Role, string> = {
  SYSTEM_ADMIN: '/sa/dashboard',
  TENANT_ADMIN: '/ta/dashboard',
  OPERATOR: '/co/dashboard',
  DESIGNER: '/tu/teaching',
  INSTRUCTOR: '/tu/teaching/classes',
  USER: '/tu/dashboard',
};
```

### 2. 접근 권한 검증

```typescript
// 라우트 가드 예시
const routePermissions = {
  '/sa/*': ['SYSTEM_ADMIN'],
  '/ta/*': ['TENANT_ADMIN'],
  '/co/*': ['OPERATOR'],
  '/tu/teaching/*': ['DESIGNER', 'INSTRUCTOR'],
  '/tu/*': ['USER', 'DESIGNER', 'INSTRUCTOR'],
};
```

### 3. 미인증 사용자 처리

```
┌─────────────────┐
│   페이지 접근    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  로그인 여부?    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   Yes        No
    │         │
    ▼         ▼
┌───────┐  ┌───────────┐
│ 권한   │  │ /login    │
│ 검증   │  │ (redirect)│
└───┬───┘  └───────────┘
    │
┌───┴───┐
│       │
Yes     No
│       │
▼       ▼
정상    /403
접근    (접근 거부)
```

### 4. 쿼리 파라미터 규칙

| 파라미터 | 용도 | 예시 |
|---------|------|------|
| `page` | 페이지 번호 | `?page=2` |
| `size` | 페이지 크기 | `?size=20` |
| `sort` | 정렬 | `?sort=createdAt,desc` |
| `keyword` | 검색어 | `?keyword=react` |
| `status` | 상태 필터 | `?status=in_progress` |
| `category` | 카테고리 필터 | `?category=123` |
| `from`, `to` | 기간 필터 | `?from=2026-01-01&to=2026-01-31` |

### 5. URL 파라미터 규칙

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `:id` | number | 리소스 ID |
| `:courseId` | number | 강의 ID |
| `:timeId` | number | 차수 ID |
| `:enrollmentId` | number | 수강 ID |
| `:userId` | number | 사용자 ID |
| `:itemId` | number | 학습 항목 ID |

---

## 📱 반응형 라우팅

### 모바일 전용 페이지

일부 페이지는 모바일에서 별도 레이아웃 제공:

| 데스크톱 URL | 모바일 동작 |
|-------------|------------|
| `/tu/learning/:id` | 전체 화면 플레이어 |
| `/tu/my` | 간소화된 카드 뷰 |
| `/co/times/:id/attendance` | QR 스캔 모드 |

---

## 🔗 외부 연동 URL

| URL | 용도 | 설명 |
|-----|------|------|
| `/api/auth/oauth/google` | Google 로그인 | OAuth 리다이렉트 |
| `/api/auth/oauth/callback` | OAuth 콜백 | 인증 완료 처리 |
| `/shared/:token` | 공유 링크 | 외부 공유 콘텐츠 |

---

## 📋 라우트 정의 파일

### Frontend 라우트 설정 위치

```
mzc-lp-frontend/
└── src/
    └── routes/
        ├── index.tsx           # 메인 라우터
        ├── PrivateRoute.tsx    # 인증 가드
        ├── RoleRoute.tsx       # 권한 가드
        ├── saRoutes.tsx        # 시스템 관리자 라우트
        ├── taRoutes.tsx        # 테넌트 관리자 라우트
        ├── coRoutes.tsx        # 운영자 라우트
        └── tuRoutes.tsx        # 학습자/강사 라우트
```

---

**최종 업데이트**: 2026-01-23
**버전**: 1.1.0

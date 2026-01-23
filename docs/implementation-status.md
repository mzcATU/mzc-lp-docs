# 구현 현황 체크리스트 (Implementation Status)

> 작성일: 2026-01-23
> 실제 코드 기반 구현 상태

---

## 📊 전체 진행률

| 영역 | 완료율 | 상태 |
|------|--------|------|
| **Backend Core** | 100% | ✅ 완료 |
| **Frontend Core** | 100% | ✅ 완료 |
| **인증/권한** | 100% | ✅ 완료 |
| **사용자 관리** | 100% | ✅ 완료 |
| **강의 관리** | 100% | ✅ 완료 |
| **차수 관리** | 100% | ✅ 완료 |
| **수강 신청** | 100% | ✅ 완료 |
| **학습 진도** | 100% | ✅ 완료 |
| **과제** | 100% | ✅ 완료 |
| **알림 시스템** | 100% | ✅ 완료 |
| **공지사항** | 100% | ✅ 완료 |
| **자동수강규칙** | 100% | ✅ 완료 |
| **분석/리포팅** | 100% | ✅ 완료 |
| **커뮤니티** | 100% | ✅ 완료 |
| **퀴즈** | 0% | ❌ 미구현 |
| **출석** | 0% | ❌ 미구현 |
| **설문조사** | 0% | ❌ 미구현 |

**범례:**
- ✅ 완료: 백엔드 API + 프론트엔드 UI 모두 구현
- ⚠️ 부분: 일부 기능만 구현
- ❌ 미구현: 구현되지 않음

---

## ✅ 구현 완료된 기능

### 1. 인증 및 권한 관리

**Backend:** `com.mzc.lp.domain.user`
**Frontend:** `src/pages/auth/*`, `src/services/common/authService.ts`

#### 구현된 API
```
POST /api/auth/register          # 회원가입
POST /api/auth/login             # 로그인
POST /api/auth/refresh           # 토큰 갱신
POST /api/auth/logout            # 로그아웃
POST /api/auth/switch-role       # 역할 전환
GET  /api/users/me               # 내 정보 조회
PUT  /api/users/me               # 프로필 수정
POST /api/users/bulk             # 단체 계정 생성
POST /api/users/bulk/file        # 파일 기반 단체 계정 생성
```

#### 구현된 UI
- `LoginPage.tsx` - 로그인
- `RegisterPage.tsx` - 회원가입
- `RoleSelectionPage.tsx` - 역할 선택
- `AdminLoginPage.tsx` - 관리자 로그인

---

### 2. 사용자 관리

**Backend:** `com.mzc.lp.domain.user`
**Frontend:** `src/pages/ta/users/*`

#### 구현된 API
```
GET    /api/users                # 사용자 목록
GET    /api/users/{userId}       # 사용자 상세
POST   /api/users                # 사용자 생성
PUT    /api/users/{userId}       # 사용자 수정
PUT    /api/users/{userId}/role  # 역할 변경
PUT    /api/users/{userId}/roles # 다중 역할 관리
DELETE /api/users/{userId}       # 사용자 삭제
```

#### 구현된 UI
- `UsersPage.tsx` - 사용자 목록
- `UserDetailPage.tsx` - 사용자 상세
- `BulkAccountCreationPage.tsx` - 대량 계정 생성
- `GroupsPage.tsx` - 그룹 관리
- `DepartmentManagementPage.tsx` - 부서 관리

---

### 3. 강의 관리

**Backend:** `com.mzc.lp.domain.course`, `com.mzc.lp.domain.snapshot`
**Frontend:** `src/pages/tu/teaching/courses/*`, `src/pages/co/course/*`

#### 구현된 API
```
# Course
POST   /api/courses              # 강의 생성
GET    /api/courses              # 강의 목록
GET    /api/courses/my           # 내 강의 목록
GET    /api/courses/{courseId}   # 강의 상세
PUT    /api/courses/{courseId}   # 강의 수정
DELETE /api/courses/{courseId}   # 강의 삭제
POST   /api/courses/{courseId}/ready     # 작성 완료
POST   /api/courses/{courseId}/register  # 등록

# Snapshot
POST   /api/courses/{courseId}/snapshots  # 스냅샷 생성
GET    /api/courses/{courseId}/snapshots  # 스냅샷 목록
GET    /api/snapshots/{snapshotId}        # 스냅샷 상세
POST   /api/snapshots/{snapshotId}/publish   # 발행
POST   /api/snapshots/{snapshotId}/complete  # 완료
POST   /api/snapshots/{snapshotId}/archive   # 보관
```

#### 구현된 UI
- `MyCoursesPage.tsx` - 내 강의 목록
- `CourseCreatePage.tsx` - 강의 생성
- `CourseDetailPage.tsx` - 강의 상세/편집
- `CoursePreviewPage.tsx` - 강의 미리보기
- `CourseListPage.tsx` (CO) - 운영자 강의 목록
- `CoursePendingPage.tsx` (CO) - 승인 대기 강의

---

### 4. 차수 관리 (CourseTime)

**Backend:** `com.mzc.lp.domain.ts`
**Frontend:** `src/pages/co/time/*`

#### 구현된 API
```
POST   /api/times              # 차수 생성
GET    /api/times              # 차수 목록
GET    /api/times/{id}         # 차수 상세
PATCH  /api/times/{id}         # 차수 수정
DELETE /api/times/{id}         # 차수 삭제
POST   /api/times/{id}/clone   # 차수 복제
POST   /api/times/{id}/open    # 모집 시작
POST   /api/times/{id}/start   # 강의 시작
POST   /api/times/{id}/close   # 마감
POST   /api/times/{id}/archive # 보관
GET    /api/times/{id}/capacity # 수강 인원
GET    /api/times/{id}/price   # 가격 조회
```

#### 구현된 UI
- `CourseTimesPage.tsx` - 차수 목록
- `CourseTimeDetailPage.tsx` - 차수 상세
- `CourseTimeCreatePage.tsx` - 차수 생성

---

### 5. 수강 관리

**Backend:** `com.mzc.lp.domain.student`, `com.mzc.lp.domain.enrollment`
**Frontend:** `src/pages/co/enrollment/*`, `src/pages/tu/learning/*`

#### 구현된 API
```
POST   /api/times/{courseTimeId}/enrollments       # 수강 신청
POST   /api/times/{courseTimeId}/enrollments/force # 강제 배정
GET    /api/times/{courseTimeId}/enrollments       # 수강생 목록
GET    /api/times/{courseTimeId}/enrollments/stats # 수강 통계
PATCH  /api/enrollments/{enrollmentId}/progress    # 진도 업데이트
PATCH  /api/enrollments/{enrollmentId}/complete    # 수료 처리
PATCH  /api/enrollments/{enrollmentId}/status      # 상태 변경
DELETE /api/enrollments/{enrollmentId}             # 수강 취소
GET    /api/users/me/enrollments                   # 내 수강 목록
```

#### 구현된 UI
- `EnrollmentManagementPage.tsx` - 수강 관리
- `MyLearningPage.tsx` - 내 학습 목록
- `CatalogPage.tsx` - 수강 신청 카탈로그

---

### 6. 학습 진도

**Backend:** `com.mzc.lp.domain.student` (ItemProgress)
**Frontend:** `src/pages/tu/learning/*`

#### 구현된 API
```
GET    /api/enrollments/{enrollmentId}/items/progress           # 전체 진도
GET    /api/enrollments/{enrollmentId}/items/{itemId}/progress  # 아이템 진도
PATCH  /api/enrollments/{enrollmentId}/items/{itemId}/progress  # 진도 업데이트
POST   /api/enrollments/{enrollmentId}/items/{itemId}/complete  # 완료 처리
```

#### 구현된 UI
- `LearningPlayerPage.tsx` - 학습 플레이어
- `LearningDetailPage.tsx` - 학습 상세
- 컴포넌트: `VideoPlayer.tsx`, `CurriculumSidebar.tsx`, `DocumentViewer.tsx`

---

### 7. 과제 관리

**Backend:** `com.mzc.lp.domain.assignment`
**Frontend:** `src/pages/tu/teaching/assignments/*`

#### 구현된 API
```
POST   /api/ta/course-times/{courseTimeId}/assignments  # 과제 생성
GET    /api/ta/course-times/{courseTimeId}/assignments  # 과제 목록
GET    /api/ta/assignments/{assignmentId}               # 과제 상세
PUT    /api/ta/assignments/{assignmentId}               # 과제 수정
DELETE /api/ta/assignments/{assignmentId}               # 과제 삭제
POST   /api/ta/assignments/{assignmentId}/publish       # 과제 발행
POST   /api/ta/assignments/{assignmentId}/close         # 과제 마감
GET    /api/ta/assignments/{assignmentId}/submissions   # 제출물 목록
POST   /api/ta/submissions/{submissionId}/grade         # 채점
```

#### 구현된 UI
- `MyAssignmentsPage.tsx` - 과제 목록
- `AssignmentDetailPage.tsx` - 과제 상세/채점

---

### 8. 알림 시스템

**Backend:** `com.mzc.lp.domain.notification`
**Frontend:** `src/pages/tu/main/Notifications*`, `src/pages/ta/system/*`

#### 구현된 API
```
GET    /api/tu/notifications                 # 알림 목록
GET    /api/tu/notifications/{id}            # 알림 상세
GET    /api/tu/notifications/unread-count    # 읽지 않은 개수
PATCH  /api/tu/notifications/{id}/read       # 읽음 처리
DELETE /api/tu/notifications/{id}            # 알림 삭제

# 템플릿 관리
GET    /api/ta/notification-templates              # 템플릿 목록
POST   /api/ta/notification-templates              # 템플릿 생성
POST   /api/ta/notification-templates/initialize   # 기본 템플릿 초기화
PUT    /api/ta/notification-templates/{id}         # 템플릿 수정
POST   /api/ta/notification-templates/{id}/activate # 활성화
DELETE /api/ta/notification-templates/{id}         # 삭제
GET    /api/ta/notification-templates/triggers     # 트리거 타입
GET    /api/ta/notification-templates/categories   # 카테고리
```

#### 구현된 UI
- `NotificationsPage.tsx` - 알림 목록
- `NotificationDetailPage.tsx` - 알림 상세
- `NotificationTemplatesPage.tsx` - 템플릿 관리

---

### 9. 공지사항 시스템

**Backend:** `com.mzc.lp.domain.notice`, `com.mzc.lp.domain.tenantnotice`
**Frontend:** `src/pages/sa/notices/*`, `src/pages/ta/notices/*`, `src/pages/co/notices/*`

#### 구현된 API (시스템 공지)
```
POST   /api/sa/notices                       # 공지 생성
GET    /api/sa/notices                       # 공지 목록
GET    /api/sa/notices/{noticeId}            # 공지 상세
PUT    /api/sa/notices/{noticeId}            # 공지 수정
DELETE /api/sa/notices/{noticeId}            # 공지 삭제
POST   /api/sa/notices/{noticeId}/publish    # 발행
POST   /api/sa/notices/{noticeId}/distribute      # 특정 테넌트 배포
POST   /api/sa/notices/{noticeId}/distribute-all  # 전체 배포
GET    /api/sa/notices/{noticeId}/tenants    # 배포 테넌트
GET    /api/sa/notices/distributions         # 배포 통계
```

#### 구현된 API (테넌트 공지)
```
POST   /api/tenant/notices                   # 공지 생성
GET    /api/tenant/notices                   # 공지 목록
GET    /api/tenant/notices/search            # 공지 검색
PUT    /api/tenant/notices/{noticeId}        # 공지 수정
DELETE /api/tenant/notices/{noticeId}        # 공지 삭제
POST   /api/tenant/notices/{noticeId}/publish # 발행
GET    /api/tenant/notices/distribution/stats # 배포 통계
```

#### 구현된 UI
- `NoticesPage.tsx` (SA) - 시스템 공지
- `NoticeDistributionPage.tsx` (SA) - 공지 배포
- `TenantNoticesPage.tsx` (TA) - 테넌트 공지
- `SystemNoticesPage.tsx` (TA) - 시스템 공지 조회
- `OperatorNoticesPage.tsx` (CO) - 운영자 공지
- `UserNoticesPage.tsx` (TU) - 사용자 공지
- 팝업: `SystemNoticePopup.tsx`, `TenantNoticePopup.tsx`

---

### 10. 자동수강규칙

**Backend:** `com.mzc.lp.domain.enrollment` (AutoEnrollmentRule)
**Frontend:** `src/pages/ta/automation/*`, `src/pages/co/auto-enrollment/*`

#### 구현된 API
```
GET    /api/auto-enrollment-rules                    # 규칙 목록
GET    /api/auto-enrollment-rules/active             # 활성 규칙
GET    /api/auto-enrollment-rules/trigger/{trigger}  # 트리거별 규칙
POST   /api/auto-enrollment-rules                    # 규칙 생성
PUT    /api/auto-enrollment-rules/{ruleId}           # 규칙 수정
DELETE /api/auto-enrollment-rules/{ruleId}           # 규칙 삭제
POST   /api/auto-enrollment-rules/{ruleId}/activate   # 활성화
POST   /api/auto-enrollment-rules/{ruleId}/deactivate # 비활성화
```

#### 구현된 UI
- `AutoEnrollmentRulesPage.tsx` (TA) - 규칙 관리
- `AutoEnrollmentRulesPage.tsx` (CO) - 운영자 규칙 관리

---

### 11. 분석 및 대시보드

**Backend:** `com.mzc.lp.domain.analytics`, `com.mzc.lp.domain.dashboard`
**Frontend:** `src/pages/*/analytics/*`, `src/pages/*/Dashboard*`

#### 구현된 API
```
GET    /api/admin/analytics/logs         # 활동 로그
GET    /api/admin/analytics/stats        # 활동 통계
GET    /api/admin/analytics/recent       # 최근 활동
GET    /api/admin/analytics/logs/search  # 로그 검색
GET    /api/admin/analytics/logs/export  # CSV 내보내기
GET    /api/admin/analytics/reports/types   # 리포트 유형
GET    /api/admin/analytics/reports/export  # 리포트 내보내기
GET    /api/admin/analytics/reports/history # 내보내기 이력
GET    /api/admin/analytics/reports/stats   # 내보내기 통계
```

#### 구현된 UI
- `DashboardPage.tsx` - 모든 역할별 대시보드
- `AnalyticsPage.tsx` (SA) - 시스템 분석
- `DataAnalyticsPage.tsx` (TA) - 테넌트 분석
- `ExportPage.tsx` (TA) - 리포트 내보내기
- `LogsPage.tsx` (TA) - 로그 조회
- `RealtimePage.tsx` (TA) - 실시간 통계

---

### 12. 커뮤니티

**Backend:** `com.mzc.lp.domain.community`
**Frontend:** `src/pages/tu/main/community/*`

#### 구현된 UI
- `CommunityPage.tsx` - 커뮤니티 목록
- `CommunityDetailPage.tsx` - 게시글 상세
- `PlayerCommunitySection.tsx` - 학습 플레이어 내 커뮤니티

---

### 13. 기타 구현된 기능

| 기능 | Backend | Frontend |
|------|---------|----------|
| 콘텐츠 관리 | `content`, `learning` | `src/pages/tu/teaching/content/*` |
| 로드맵 | `roadmap` | `src/pages/tu/teaching/roadmaps/*` |
| 인증서 | `certificate` | `CertificationsPage.tsx` |
| 장바구니 | `cart` | `CartPage.tsx` |
| 위시리스트 | `wishlist` | `WishlistPage.tsx` |
| 배너 | `banner` | - |
| 카테고리 | `category` | - |
| 테넌트 | `tenant` | `src/pages/sa/tenants/*` |
| 부서 | `department` | `DepartmentManagementPage.tsx` |
| 직원 | `employee` | - |
| 강사배정 | `iis` | `InstructorAssignmentsPage.tsx` |
| 멤버풀 | `memberpool` | `MemberPoolPage.tsx` |

---

## ❌ 미구현 기능

### 1. 퀴즈/시험 (0%)

**상태:** 백엔드/프론트엔드 모두 미구현

**필요 구현:**
- [ ] 퀴즈 생성 (문제 은행)
- [ ] 객관식/주관식 문제
- [ ] 퀴즈 응시
- [ ] 자동 채점 (객관식)
- [ ] 수동 채점 (주관식)
- [ ] 시간 제한
- [ ] 재응시 제한

---

### 2. 출석 관리 (0%)

**상태:** 백엔드/프론트엔드 모두 미구현
**참고:** 차수 상세 페이지에 "출결 관리" UI 플레이스홀더 존재 (Coming Soon 표시)

**필요 구현:**
- [ ] 출석 체크 API
- [ ] 출석 기록 저장
- [ ] 출석률 계산
- [ ] QR 코드 출석
- [ ] 위치 기반 출석
- [ ] 출석 통계

---

### 3. 설문조사 (0%)

**상태:** 백엔드/프론트엔드 모두 미구현

**필요 구현:**
- [ ] 설문 생성
- [ ] 설문 응답
- [ ] 설문 결과 집계
- [ ] 통계 차트

---

## 📁 도메인 디렉토리 구조

### Backend (29개 도메인)
```
src/main/java/com/mzc/lp/domain/
├── analytics/       ✅ 분석
├── assignment/      ✅ 과제
├── banner/         ✅ 배너
├── cart/           ✅ 장바구니
├── category/       ✅ 카테고리
├── certificate/    ✅ 인증서
├── community/      ✅ 커뮤니티
├── content/        ✅ 콘텐츠
├── course/         ✅ 강의
├── dashboard/      ✅ 대시보드
├── department/     ✅ 부서
├── employee/       ✅ 직원
├── enrollment/     ✅ 자동수강규칙
├── iis/           ✅ 강사배정
├── learning/       ✅ 학습객체
├── memberpool/     ✅ 멤버풀
├── notice/         ✅ 시스템 공지
├── notification/   ✅ 알림
├── roadmap/        ✅ 로드맵
├── sa/            ✅ 시스템어드민
├── snapshot/       ✅ 스냅샷
├── student/        ✅ 수강생/진도
├── system/         ✅ 시스템 설정
├── tenant/         ✅ 테넌트
├── tenantnotice/   ✅ 테넌트 공지
├── ts/            ✅ 차수
├── tu/            ✅ 테넌트 사용자
├── user/           ✅ 사용자/인증
└── wishlist/       ✅ 위시리스트
```

### Frontend 페이지 구조
```
src/pages/
├── auth/           # 인증 (4개)
├── sa/            # System Admin (11개 영역)
├── ta/            # Tenant Admin (11개 영역)
├── co/            # Course Operator (10개 영역)
├── tu/            # Tenant User (19개 영역)
├── admin/          # 관리자 인증
└── common/         # 공통 페이지
```

### Frontend 서비스/훅
- **Page 컴포넌트:** 164개
- **Service 파일:** 69개
- **React Query 훅:** 78개
- **Common 컴포넌트:** 59개

---

## 📞 문의

구현 현황 관련 문의:
- Backend: [담당자 이메일]
- Frontend: [담당자 이메일]
- DevOps: [담당자 이메일]

---

**최종 업데이트**: 2026-01-23
**버전**: 2.0.0

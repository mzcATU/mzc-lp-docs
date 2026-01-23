# MZC Learning Platform 모듈 구조

> 작성일: 2026-01-22
> 백엔드/프론트엔드 모듈 구조 및 주요 기능 흐름

---

## 목차
1. [백엔드 도메인 모듈](#백엔드-도메인-모듈)
2. [백엔드 공통 모듈](#백엔드-공통-모듈)
3. [프론트엔드 구조](#프론트엔드-구조)
4. [주요 기능 흐름](#주요-기능-흐름)

---

## 백엔드 도메인 모듈

### 모듈 분류

| 분류 | 모듈 | 설명 |
|------|------|------|
| **사용자/인증** | user | 사용자, 인증, 역할 관리 |
| **테넌트** | tenant | 테넌트, 테넌트 설정 |
| **강의 관리** | course | 강의 템플릿 |
| | content | 콘텐츠 (파일, 동영상 등) |
| | learning | 학습 객체 (LO) |
| | snapshot | 강의 불변 사본 |
| | ts | 차수 관리 |
| **수강 관리** | enrollment | 수강 신청, 수강 관리 |
| | iis | 강사 배정 |
| | student | 학생 그룹 |
| **콘텐츠** | assignment | 과제 |
| | certificate | 수료증 |
| **커뮤니티** | community | 커뮤니티, 게시판 |
| **시스템** | sa | 시스템 어드민 |
| | system | 시스템 설정 |
| | dashboard | 대시보드 |
| | analytics | 분석 |
| **알림/공지** | notification | 알림 |
| | notice | 공지사항 |
| | tenantnotice | 테넌트 공지 |
| **기타** | cart | 장바구니 |
| | wishlist | 위시리스트 |
| | category | 카테고리 |
| | roadmap | 로드맵 |
| | banner | 배너 |
| | department | 부서 |
| | employee | 직원 |
| | memberpool | 멤버풀 |

---

### 핵심 도메인 상세

#### 1. User (사용자)
**위치**: `domain/user/`

**주요 엔티티:**
- `User`: 사용자 기본 정보
- `UserRole`: 다중 역할 (1:N)
- `RefreshToken`: 리프레시 토큰

**주요 기능:**
- 회원가입 / 로그인 / 로그아웃
- JWT 토큰 발급 / 갱신
- 역할 전환 (다중 역할 지원)
- 프로필 관리

**주요 API:**
```
POST   /api/auth/register          # 회원가입
POST   /api/auth/login             # 로그인
POST   /api/auth/logout            # 로그아웃
POST   /api/auth/refresh           # 토큰 갱신
POST   /api/auth/switch-role       # 역할 전환
GET    /api/users/me               # 내 정보 조회
PUT    /api/users/me               # 프로필 수정
```

---

#### 2. Tenant (테넌트)
**위치**: `domain/tenant/`

**주요 엔티티:**
- `Tenant`: 테넌트 기본 정보
- `TenantSettings`: 테넌트 설정 (브랜딩, 기능)

**주요 기능:**
- 테넌트 생성 / 수정 / 삭제 (SA)
- 테넌트 설정 관리 (브랜딩, 기능 토글)
- 테넌트별 도메인 관리 (subdomain, customDomain)

**TenantSettings 구조:**
```json
{
  "branding": {
    "logo": "...",
    "primaryColor": "#...",
    "secondaryColor": "#..."
  },
  "features": {
    "enableCommunity": true,
    "enableRoadmap": false
  },
  "layout": { ... },
  "navigation": { ... }
}
```

---

#### 3. Course (강의)
**위치**: `domain/course/`

**주요 엔티티:**
- `Course`: 강의 템플릿
- `CourseItem`: 강의 구성 요소 (폴더, 학습 객체)
- `CourseRelation`: 학습 순서 관계

**Course 상태:**
```
DRAFT → READY → REGISTERED
```

**주요 기능:**
- 강의 템플릿 생성 / 수정
- 강의 구성 (폴더, 학습 객체 추가)
- 학습 순서 설정

---

#### 4. Snapshot (스냅샷)
**위치**: `domain/snapshot/`

**주요 엔티티:**
- `Snapshot`: 강의의 불변 사본
- `SnapshotItem`: 스냅샷 구성 요소
- `SnapshotRelation`: 스냅샷 학습 순서

**특징:**
- Program 승인 시 자동 생성
- Course의 깊은 복사 (CourseItem → SnapshotItem)
- 수정 불가 (불변성 보장)

**상태:**
```
DRAFT → ACTIVE → INACTIVE
```

---

#### 5. CourseTime (차수)
**위치**: `domain/ts/`

**주요 엔티티:**
- `CourseTime`: 강의 차수

**주요 필드:**
```java
- snapshotId: 참조할 스냅샷
- season: 차수명 (1기, 2기 등)
- capacity: 정원
- currentEnrollment: 현재 수강 인원
- startDate, endDate: 강의 기간
- enrollStartDate, enrollEndDate: 수강신청 기간
- status: DRAFT, RECRUITING, ONGOING, CLOSED
```

**상태 전환:**
```
DRAFT → RECRUITING → ONGOING → CLOSED
```

---

#### 6. Enrollment (수강)
**위치**: `domain/student/`

**주요 엔티티:**
- `Enrollment`: 수강 신청
- `ItemProgress`: 아이템별 학습 진도

**동시성 제어:**
- CourseTime 비관적 락 (정원 관리)
- Enrollment 낙관적 락 (@Version)

**상태:**
```
ENROLLED → COMPLETED → WITHDRAWN
```

---

#### 7. Notification (알림)
**위치**: `domain/notification/`

**주요 엔티티:**
- `Notification`: 사용자별 알림
- `NotificationTemplate`: 알림 템플릿 (자동 초기화)

**템플릿 타입:**
```
COURSE_ENROLLMENT_APPROVED  # 수강 승인
COURSE_STARTED              # 강의 시작
COURSE_COMPLETED            # 강의 완료
ASSIGNMENT_SUBMITTED        # 과제 제출
...
```

---

## 백엔드 공통 모듈

### Common 구조

```
common/
├── config/
│   ├── SecurityConfig.java            # Spring Security 설정
│   ├── JpaConfig.java                 # JPA 설정 (Auditing)
│   ├── SwaggerConfig.java             # Swagger 설정
│   └── CorsConfig.java                # CORS 설정
│
├── context/
│   └── TenantContext.java             # 멀티테넌트 컨텍스트
│
├── entity/
│   ├── BaseEntity.java                # ID + 생성/수정 시각
│   ├── BaseTimeEntity.java            # 생성/수정 시각만
│   └── TenantEntity.java              # tenantId + 테넌트 격리
│
├── filter/
│   ├── TenantFilter.java              # 테넌트 컨텍스트 설정
│   └── JwtAuthenticationFilter.java   # JWT 검증
│
├── security/
│   ├── JwtProvider.java               # JWT 토큰 생성/검증
│   ├── UserPrincipal.java             # 인증 사용자 정보
│   └── SecurityUtils.java             # 보안 유틸
│
├── exception/
│   ├── GlobalExceptionHandler.java    # 전역 예외 처리
│   ├── BusinessException.java         # 비즈니스 예외 기본 클래스
│   └── ErrorCode.java                 # 에러 코드 Enum
│
├── dto/
│   ├── ApiResponse.java               # 공통 응답 형식
│   ├── PageResponse.java              # 페이징 응답
│   └── ErrorResponse.java             # 에러 응답
│
└── service/
    ├── FileStorageService.java        # 파일 저장
    └── ThumbnailService.java          # 썸네일 생성
```

---

## 프론트엔드 구조

### Pages (역할별)

```
pages/
├── sa/                 # System Admin
│   ├── dashboard/         - 전체 플랫폼 대시보드
│   ├── tenants/           - 테넌트 관리
│   ├── analytics/         - 전체 분석
│   ├── billing/           - 결제 관리
│   └── system/            - 시스템 설정
│
├── ta/                 # Tenant Admin
│   ├── dashboard/         - 테넌트 대시보드
│   ├── users/             - 사용자 관리
│   ├── branding/          - 브랜딩 설정
│   ├── features/          - 기능 설정
│   ├── automation/        - 자동화 규칙
│   └── analytics/         - 테넌트 분석
│
├── co/                 # Course Operator
│   ├── dashboard/         - 운영 대시보드
│   ├── course/            - 강의 관리
│   ├── time/              - 차수 관리
│   ├── enrollment/        - 수강 관리
│   ├── instructor/        - 강사 관리
│   ├── member-pool/       - 멤버풀 관리
│   └── auto-enrollment/   - 자동 수강 규칙
│
└── tu/                 # Tenant User (학습자/강사/설계자)
    ├── dashboard/         - 학습 대시보드
    ├── catalog/           - 강의 카탈로그 (CatalogPage, CatalogDetailPage)
    ├── main/              - 메인 페이지
    │   ├── LandingPage        - 랜딩 페이지
    │   ├── CourseDetailPage   - 강의 상세
    │   ├── SearchPage         - 검색
    │   ├── CartPage           - 장바구니
    │   ├── WishlistPage       - 위시리스트
    │   ├── CommunityPage      - 커뮤니티
    │   ├── RoadmapExplorePage - 로드맵 탐색
    │   └── Notifications      - 알림
    ├── learning/          - 학습 플레이어
    │   ├── MyLearningPage     - 내 학습 목록
    │   ├── LearningDetailPage - 학습 상세
    │   ├── LearningPlayerPage - 동영상 플레이어
    │   └── components/        - VideoPlayer, CurriculumSidebar 등
    ├── mypage/            - 마이페이지
    │   ├── MyPageHome         - 마이페이지 홈
    │   ├── ProfilePage        - 프로필
    │   ├── CertificationsPage - 수료증
    │   ├── CompletedCoursesPage - 완료 강좌
    │   ├── PreferencesPage    - 설정
    │   └── TeachingStatsPage  - 강의 통계 (강사)
    ├── settings/          - 설정
    │   └── SettingsLanguagePage - 언어 설정
    ├── teaching/          - 강의 제작 (DESIGNER/INSTRUCTOR)
    │   ├── courses/           - 내 강의
    │   │   ├── MyCoursesPage      - 강의 목록
    │   │   ├── CourseCreatePage   - 강의 생성
    │   │   ├── CourseDetailPage   - 강의 상세
    │   │   └── CoursePreviewPage  - 미리보기
    │   ├── content/           - 콘텐츠 관리
    │   │   ├── MyContentPage      - 콘텐츠 목록
    │   │   ├── ContentCreatePage  - 업로드
    │   │   └── ContentBulkUploadPage - 대량 업로드
    │   ├── assignments/       - 과제 관리
    │   │   ├── MyAssignmentsPage  - 과제 목록
    │   │   └── AssignmentDetailPage - 과제 상세/채점
    │   └── roadmaps/          - 로드맵
    │       ├── RoadmapListPage    - 로드맵 목록
    │       ├── RoadmapCreatePage  - 생성
    │       └── RoadmapDetailPage  - 상세
    └── b2b/               - B2B 전용 (기업 학습 플랫폼)
        ├── B2BLandingPage     - B2B 홈
        ├── B2BSearchPage      - 강좌 검색
        ├── B2BCourseDetailPage - 강좌 상세
        ├── B2BLearningPlayerPage - 학습 플레이어
        ├── B2BMyPageHome      - 마이페이지
        ├── B2BMyLearningPage  - 내 학습
        ├── B2BCertificationsPage - 수료증
        ├── B2BTeachingStatsPage - 강사 통계
        └── components/        - B2B 전용 컴포넌트
```

### Services (API 호출)

```
services/
├── common/
│   ├── authService.ts              # 인증
│   ├── userService.ts              # 사용자
│   ├── courseService.ts            # 강의
│   └── api/
│       ├── axiosInstance.ts        # Axios 설정
│       └── endpoints.ts            # API 엔드포인트
│
├── co/
│   ├── timeService.ts              # 차수
│   ├── enrollmentService.ts        # 수강
│   ├── instructorAssignmentService.ts  # 강사 배정
│   └── ...
│
├── ta/
│   ├── tenantService.ts            # 테넌트
│   ├── brandingService.ts          # 브랜딩
│   └── ...
│
└── tu/
    ├── catalogService.ts           # 카탈로그
    ├── learningPlayerService.ts    # 학습 플레이어
    └── ...
```

### Hooks (React Query)

```
hooks/
├── common/
│   ├── auth/
│   │   ├── useAuth.ts              # 현재 사용자, 로그인/로그아웃
│   │   └── useTokenExpirationCheck.ts  # 토큰 만료 체크
│   ├── useDebounce.ts
│   └── useSubdomainPath.ts
│
├── co/
│   ├── useTimeQueries.ts           # 차수 CRUD
│   ├── useEnrollmentQueries.ts     # 수강 관리
│   └── ...
│
├── ta/
│   ├── useUserQueries.ts           # 사용자 관리
│   ├── useBrandingQueries.ts       # 브랜딩
│   └── ...
│
└── tu/
    ├── useCourseQueries.ts         # 강의 조회
    ├── useEnrollmentQueries.ts     # 내 수강
    └── ...
```

---

## 주요 기능 흐름

### 강의 개설 → 수강 흐름

```
1. [DESIGNER] 강의 템플릿 생성
   POST /api/courses
   → Course 생성 (status: DRAFT)

2. [DESIGNER] 강의 개설 신청
   POST /api/programs
   → Program 생성 (status: DRAFT)

3. [DESIGNER] 신청 제출
   PUT /api/programs/{id}/submit
   → Program.status = PENDING

4. [OPERATOR] 신청 승인
   PUT /api/programs/{id}/approve
   → Program.status = APPROVED
   → Snapshot 자동 생성 (Course 깊은 복사)
   → Snapshot.status = ACTIVE

5. [OPERATOR] 차수 생성
   POST /api/course-times
   → CourseTime 생성 (snapshotId 참조)
   → CourseTime.status = DRAFT

6. [OPERATOR] 강사 배정
   PUT /api/instructor-assignments
   → InstructorAssignment 생성 (MAIN 강사)

7. [OPERATOR] 차수 모집 시작
   PUT /api/course-times/{id}/open
   → CourseTime.status = RECRUITING

8. [USER] 수강신청
   POST /api/enrollments
   → CourseTime 비관적 락 획득
   → 정원 체크
   → Enrollment 생성
   → currentEnrollment++

9. [OPERATOR] 강의 시작
   PUT /api/course-times/{id}/start
   → CourseTime.status = ONGOING

10. [USER] 학습 진행
    PUT /api/enrollments/{id}/progress
    → progress % 업데이트

11. [OPERATOR] 수료 처리
    PUT /api/enrollments/{id}/complete
    → Enrollment.status = COMPLETED
    → 수료증 발급 (선택)

12. [OPERATOR] 차수 종료
    PUT /api/course-times/{id}/close
    → CourseTime.status = CLOSED
```

---

## 파일 위치 참조

### 백엔드
```
src/main/java/com/mzc/lp/
├── common/                          # 공통 모듈
└── domain/
    ├── user/                        # 사용자/인증
    ├── tenant/                      # 테넌트
    ├── course/                      # 강의
    ├── content/                     # 콘텐츠
    ├── snapshot/                    # 스냅샷
    ├── ts/                          # 차수
    ├── enrollment/                  # 수강 (student 디렉토리)
    ├── iis/                         # 강사 배정
    ├── notification/                # 알림
    └── ...                          # 기타 26개 도메인
```

### 프론트엔드
```
src/
├── pages/                           # 페이지
│   ├── sa/                          # System Admin
│   ├── ta/                          # Tenant Admin
│   ├── co/                          # Course Operator
│   └── tu/                          # Tenant User
├── components/                      # 컴포넌트
│   ├── common/                      # 59개 UI 컴포넌트
│   ├── domain/                      # 도메인별 컴포넌트
│   └── layout/                      # 레이아웃
├── services/                        # API 서비스
├── hooks/                           # React Query 훅
├── store/                           # Zustand 스토어
└── types/                           # TypeScript 타입
```

---

## 다음 단계

- [아키텍처 문서](./architecture.md)
- [API 명세서](./api-specification.md)
- [개발 환경 설정](./setup-guide.md)

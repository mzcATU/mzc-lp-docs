# Phase Roadmap

> 전체 개발 로드맵 - B2C MVP부터 B2B, KPOP까지

---

## 개요

```
Phase 1: B2C MVP 1 ────► Phase 2: B2C MVP 2 ────► Phase 3: B2C 완성
                                                         │
                                                         ▼
Phase 4: B2B MVP ──────► Phase 5: B2B 완성 ────► Phase 6: KPOP
```

---

## Phase 1: B2C MVP 1 (Core)

> **목표**: 강사가 강의를 만들고, 학습자가 수강할 수 있는 최소 기능

### 포함 기능

| 모듈 | 기능 | API Endpoint | 우선순위 |
|------|------|--------------|----------|
| **UM** | 회원가입 | `POST /api/auth/register` | Must |
| | 로그인/로그아웃 | `POST /api/auth/login`, `logout` | Must |
| | 토큰 갱신 | `POST /api/auth/refresh` | Must |
| | 내 정보 조회/수정 | `GET/PUT /api/users/me` | Must |
| | 비밀번호 변경 | `PUT /api/users/me/password` | Must |
| | DESIGNER 권한 요청 | `POST /api/users/me/course-roles/designer` | Must |
| **TS** | 강의 개설 신청 | `POST /api/programs` | Must |
| | 강의 목록/상세 조회 | `GET /api/programs`, `/{id}` | Must |
| | 강의 수정/삭제 | `PUT/DELETE /api/programs/{id}` | Must |
| | 개설 신청 (DESIGNER) | `POST /api/programs/{id}/submit` | Must |
| | 강의 승인 (OPERATOR) | `PUT /api/programs/{id}/approve` | Must |
| | 강의 반려 (OPERATOR) | `PUT /api/programs/{id}/reject` | Must |
| | 검토 대기 목록 | `GET /api/programs/pending` | Must |
| | 차수 생성 (OPERATOR) | `POST /api/programs/{id}/times` | Must |
| | 차수 목록/상세 | `GET /api/programs/{id}/times`, `/api/times/{id}` | Must |
| **CM** | 강의(커리큘럼) 생성 | `POST /api/courses` | Must |
| | 폴더 생성 | `POST /api/courses/{id}/folders` | Must |
| | 차시 추가 | `POST /api/courses/{id}/items` | Must |
| | 계층 구조 조회 | `GET /api/courses/{id}/items/hierarchy` | Must |
| **CR** | 학습 순서 설정 | `POST /api/courses/{id}/relations` | Must |
| | 학습 순서 조회 | `GET /api/courses/{id}/relations` | Must |
| **SIS** | 수강 신청 | `POST /api/times/{id}/enrollments` | Must |
| | 내 수강 목록 | `GET /api/users/me/enrollments` | Must |
| | 수강 상세 | `GET /api/enrollments/{id}` | Must |
| | 진도율 업데이트 | `PUT /api/enrollments/{id}/progress` | Must |
| **LO** | 학습 객체 생성 (VIDEO) | `POST /api/learning-objects` | Must |
| | 학습 객체 조회 | `GET /api/learning-objects/{id}` | Must |
| **CMS** | 콘텐츠 업로드 | `POST /api/contents/upload` | Must |
| | 콘텐츠 조회 | `GET /api/contents/{id}` | Must |

### 역할 범위

```
B2C 테넌트 (tenant_id = 1)
├── TENANT_ADMIN - 초기 설정용
├── OPERATOR - 강의 승인, 차수 생성
└── USER - 수강 + 강의 개설
       │
       └── "강의 개설하기" 클릭 → DESIGNER → 승인 후 → OWNER
```

### 화면 (Frontend)

**TU (수강생)**
- [ ] 로그인/회원가입
- [ ] 메인 페이지 (강의 목록)
- [ ] 강의 상세 페이지
- [ ] 수강 신청
- [ ] 내 학습실 (수강 중 강의)
- [ ] 학습 플레이어 (영상 시청)
- [ ] 마이페이지

**TO (운영자)**
- [ ] 로그인
- [ ] 대시보드 (기본)
- [ ] 강의 검토 목록
- [ ] 강의 승인/반려
- [ ] 차수 생성/관리

**강의 개설 (DESIGNER/OWNER)**
- [ ] 강의 기본 정보 입력
- [ ] 커리큘럼 구성 (폴더/차시)
- [ ] 영상 업로드
- [ ] 학습 순서 설정
- [ ] 개설 신청

### 제외 기능 (Phase 2+)

- 리뷰/평점
- 수료증 발급
- 결제/정산
- 회원 탈퇴
- 대시보드 통계
- 수강 취소

---

## Phase 2: B2C MVP 2 (Enhanced)

> **목표**: 수익화 및 사용자 경험 개선

### 추가 기능

| 모듈 | 기능 | API Endpoint | 우선순위 |
|------|------|--------------|----------|
| **UM** | 회원 탈퇴 | `DELETE /api/users/me` | Should |
| | 프로필 이미지 업로드 | `POST /api/users/me/profile-image` | Should |
| **TS** | 차수 상태 변경 | `PUT /api/times/{id}/status` | Should |
| | 차수 수정/삭제 | `PUT/DELETE /api/times/{id}` | Should |
| **SIS** | 수강 취소 | `DELETE /api/enrollments/{id}` | Should |
| | 수료 처리 | `PUT /api/enrollments/{id}/complete` | Should |
| | 차수별 수강 통계 | `GET /api/times/{id}/enrollments/stats` | Should |
| **Review** | 리뷰 작성 | `POST /api/courses/{id}/reviews` | Should |
| | 리뷰 목록 조회 | `GET /api/courses/{id}/reviews` | Should |
| | 리뷰 수정/삭제 | `PUT/DELETE /api/reviews/{id}` | Should |
| **Certificate** | 수료증 발급 | `POST /api/enrollments/{id}/certificate` | Should |
| | 수료증 조회 | `GET /api/certificates/{id}` | Should |
| | 수료증 검증 | `GET /api/certificates/verify/{number}` | Should |
| **Payment** | 결제 요청 | `POST /api/payments` | Should |
| | 결제 확인 | `POST /api/payments/{id}/confirm` | Should |
| | 결제 내역 | `GET /api/users/me/payments` | Should |
| **Settlement** | 정산 내역 (OWNER) | `GET /api/users/me/settlements` | Could |
| | 정산 요청 | `POST /api/settlements/request` | Could |

### 추가 화면

**TU**
- [ ] 리뷰 작성/조회
- [ ] 수료증 발급/조회
- [ ] 결제 페이지
- [ ] 결제 내역

**TO**
- [ ] 대시보드 통계 (상세)
- [ ] 정산 관리

**강의 개설**
- [ ] 가격 설정
- [ ] 정산 현황

---

## Phase 3: B2C 완성

> **목표**: B2C 플랫폼 완성도 향상

### 추가 기능

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 검색/필터 고도화 | 카테고리, 난이도, 가격 필터 | Should |
| 추천 시스템 | 사용자 기반 강의 추천 | Could |
| 위시리스트 | 관심 강의 저장 | Could |
| 알림 시스템 | 수강 알림, 마케팅 알림 | Could |
| Q&A 게시판 | 강의별 질문/답변 | Should |
| 쿠폰/할인 | 프로모션 코드 | Could |
| 소셜 로그인 | Google, Kakao, Naver | Should |
| 이메일 인증 | 회원가입 인증 | Should |
| 비밀번호 찾기 | 이메일 기반 재설정 | Should |

---

## Phase 4: B2B MVP

> **목표**: 기업용 LMS 핵심 기능

### 추가 기능

| 모듈 | 기능 | API Endpoint | 우선순위 |
|------|------|--------------|----------|
| **Tenant** | 테넌트 생성 | `POST /api/tenants` | Must |
| | 테넌트 설정 | `PUT /api/tenants/{id}/settings` | Must |
| | 브랜딩 설정 | `PUT /api/tenants/{id}/branding` | Must |
| **UM (B2B)** | 사용자 대량 등록 | `POST /api/users/bulk` | Must |
| | 사용자 역할 변경 | `PUT /api/users/{id}/role` | Must |
| | 강의 역할 부여 | `POST /api/users/{id}/course-roles` | Must |
| | 강의 역할 회수 | `DELETE /api/users/{id}/course-roles/{roleId}` | Must |
| **Organization** | 조직 생성 | `POST /api/organizations` | Must |
| | 조직 트리 조회 | `GET /api/organizations` | Must |
| | 사용자 조직 배정 | `PUT /api/users/{id}/organization` | Must |
| **IIS** | 강사 배정 | `POST /api/times/{id}/instructors` | Must |
| | 강사 목록 조회 | `GET /api/times/{id}/instructors` | Must |
| | 강사 교체 | `POST /api/instructor-assignments/{id}/replace` | Should |
| | 강사 배정 취소 | `DELETE /api/instructor-assignments/{id}` | Should |
| **SIS (B2B)** | 필수 수강 강제 신청 | `POST /api/times/{id}/enrollments/force` | Must |
| | 차수별 수강생 목록 | `GET /api/times/{id}/enrollments` | Must |
| | 수강 상태 변경 | `PUT /api/enrollments/{id}/status` | Must |

### 역할 범위 (B2B)

```
B2B 테넌트 (tenant_id = 2, 3, ...)
├── TENANT_ADMIN - 전사 통계, 브랜딩
├── OPERATOR - 운영 + 역할 부여/회수
│      │
│      ├── "강사 부여" → INSTRUCTOR
│      └── "강의설계자 부여" → DESIGNER → (승인) → OWNER
│
└── USER - 학습 (역할 부여 전까지 강의 개설 불가)
```

### 추가 화면

**TO (B2B)**
- [ ] 테넌트 설정
- [ ] 브랜딩 설정
- [ ] 조직 관리
- [ ] 사용자 관리 (역할 부여/회수)
- [ ] 강사 배정
- [ ] 필수 수강 지정
- [ ] 조직별 학습 현황
- [ ] 전사 대시보드

**TU (B2B)**
- [ ] 회사 브랜딩 적용된 UI
- [ ] 필수 수강 목록
- [ ] 조직 내 랭킹

---

## Phase 5: B2B 완성

> **목표**: 기업 LMS 완성도 향상

### 추가 기능

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| SSO 연동 | OKTA, Azure AD, Google Workspace | Must |
| 대량 수강 신청 | CSV 업로드 기반 | Should |
| 학습 리포트 | 조직별/개인별 상세 리포트 | Should |
| 알림 (B2B) | 미이수 알림, 마감 임박 알림 | Should |
| 기업 결제 | 계약 기반 결제, 인보이스 | Should |
| B2C 강의 라이선스 | B2C 강의 B2B 공유 | Could |
| API 연동 | HR 시스템 연동 API | Could |

---

## Phase 6: KPOP

> **목표**: K-POP 단기 연수 특화 플랫폼

### 추가 기능

| 모듈 | 기능 | API Endpoint | 우선순위 |
|------|------|--------------|----------|
| **Schedule** | 일정 관리 | `POST /api/schedules` | Must |
| | 일정 목록 조회 | `GET /api/schedules` | Must |
| | 일정 상세 | `GET /api/schedules/{id}` | Must |
| **Facility** | 시설 등록 | `POST /api/facilities` | Must |
| | 시설 예약 | `POST /api/facilities/{id}/reservations` | Must |
| | 예약 현황 | `GET /api/facilities/{id}/reservations` | Must |
| **Team** | 팀 구성 | `POST /api/teams` | Must |
| | 팀원 추가 | `POST /api/teams/{id}/members` | Must |
| | 팀 채팅 | WebSocket `/ws/teams/{id}/chat` | Should |
| **Feedback** | 영상 피드백 | `POST /api/contents/{id}/feedback` | Must |
| | 피드백 타임라인 | `GET /api/contents/{id}/feedback/timeline` | Must |
| | 피드백 답글 | `POST /api/feedback/{id}/replies` | Should |
| **Program** | 프로그램 생성 | `POST /api/kpop/programs` | Must |
| | 프로그램 신청 | `POST /api/kpop/programs/{id}/apply` | Must |
| | 신청 현황 | `GET /api/kpop/programs/{id}/applications` | Must |

### 역할 범위 (KPOP)

```
KPOP 테넌트 (tenant_id = 100)
├── TENANT_ADMIN - 전체 관리
├── OPERATOR - 프로그램/스케줄/시설/강의 관리
│      │
│      ├── 프로그램 생성
│      ├── 강사 배정 (INSTRUCTOR)
│      └── 시설 관리
│
└── USER (학생) - 프로그램 신청, 수강, 피드백 확인
```

### 추가 화면

**TO (KPOP)**
- [ ] 프로그램 관리
- [ ] 일정 캘린더
- [ ] 시설 예약 현황
- [ ] 팀 관리
- [ ] 피드백 관리

**TU (KPOP)**
- [ ] 프로그램 목록/신청
- [ ] 내 일정 (캘린더)
- [ ] 팀 채팅
- [ ] 내 피드백 확인
- [ ] 연습 영상 업로드

---

## Phase 요약

| Phase | 목표 | 주요 기능 | 예상 기간 |
|-------|------|----------|----------|
| **1** | B2C MVP 1 | 회원, 강의 개설, 수강 | - |
| **2** | B2C MVP 2 | 리뷰, 수료증, 결제 | - |
| **3** | B2C 완성 | 검색, 추천, 소셜로그인 | - |
| **4** | B2B MVP | 테넌트, 조직, 역할 부여 | - |
| **5** | B2B 완성 | SSO, 리포트, 기업결제 | - |
| **6** | KPOP | 스케줄, 시설, 팀, 피드백 | - |

---

## API 엔드포인트 정리

### Phase 1 (B2C MVP 1) - 35개

```
# Auth (4)
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh

# User (4)
GET    /api/users/me
PUT    /api/users/me
PUT    /api/users/me/password
POST   /api/users/me/course-roles/designer

# Program (TS) (9)
POST   /api/programs
GET    /api/programs
GET    /api/programs/{id}
PUT    /api/programs/{id}
DELETE /api/programs/{id}
POST   /api/programs/{id}/submit
GET    /api/programs/pending
PUT    /api/programs/{id}/approve
PUT    /api/programs/{id}/reject

# Time (3)
POST   /api/programs/{id}/times
GET    /api/programs/{id}/times
GET    /api/times/{id}

# Course (CM) (5)
POST   /api/courses
GET    /api/courses/{id}
POST   /api/courses/{id}/folders
POST   /api/courses/{id}/items
GET    /api/courses/{id}/items/hierarchy

# Relation (CR) (2)
POST   /api/courses/{id}/relations
GET    /api/courses/{id}/relations

# Enrollment (SIS) (4)
POST   /api/times/{id}/enrollments
GET    /api/users/me/enrollments
GET    /api/enrollments/{id}
PUT    /api/enrollments/{id}/progress

# Learning Object (LO) (2)
POST   /api/learning-objects
GET    /api/learning-objects/{id}

# Content (CMS) (2)
POST   /api/contents/upload
GET    /api/contents/{id}
```

### Phase 4 (B2B MVP) 추가 - 15개

```
# Tenant (3)
POST   /api/tenants
PUT    /api/tenants/{id}/settings
PUT    /api/tenants/{id}/branding

# User B2B (4)
POST   /api/users/bulk
PUT    /api/users/{id}/role
POST   /api/users/{id}/course-roles
DELETE /api/users/{id}/course-roles/{roleId}

# Organization (3)
POST   /api/organizations
GET    /api/organizations
PUT    /api/users/{id}/organization

# Instructor (IIS) (2)
POST   /api/times/{id}/instructors
GET    /api/times/{id}/instructors

# Enrollment B2B (3)
POST   /api/times/{id}/enrollments/force
GET    /api/times/{id}/enrollments
PUT    /api/enrollments/{id}/status
```

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [user-roles.md](./context/user-roles.md) | 역할 및 권한 상세 |
| [multi-tenancy.md](./context/multi-tenancy.md) | 테넌트 분리 전략 |
| [module-structure.md](./context/module-structure.md) | 모듈 설계 |
| [structure/backend/](./structure/backend/) | API 상세 명세 |

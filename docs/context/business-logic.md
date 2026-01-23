# 비즈니스 로직 정리

> 작성일: 2026-01-22
> 도메인별 핵심 비즈니스 로직, 상태 전이, 동시성 처리

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 섹션 |
|----------|----------|
| 도메인별 핵심 로직? | 섹션 1 |
| 상태 전이 흐름? | 섹션 2 |
| 동시성 처리 방식? | 섹션 3 |
| 비즈니스 규칙? | 섹션 4 |
| 전체 워크플로우? | 섹션 5 |

---

## 1. 도메인별 핵심 비즈니스 로직

### 1.1 User (UM) - 사용자/인증

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 회원가입 | `register()` | 이메일 중복 검사 |
| 로그인 | `login()` | JWT 토큰 발급, RefreshToken 저장 |
| 토큰 갱신 | `refresh()` | RefreshToken으로 AccessToken 재발급 |
| 역할 부여 | `assignCourseRole()` | OWNER/INSTRUCTOR/DESIGNER |

### 1.2 Course (CM) - 강의 템플릿

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 강의 생성 | `createCourse()` | 템플릿 생성 (수정 가능) |
| 아이템 구성 | `addItem()` | 계층구조 (폴더/과목) |
| 학습순서 | `addRelation()` | Linked List 패턴 |

**구조:**
```
Course
├── CourseItem (계층구조)
│   ├── Folder
│   └── Content → LearningObject
└── CourseRelation (학습 순서)
    └── fromItem → toItem → ...
```

### 1.3 Content (CMS) - 콘텐츠 관리

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 파일 업로드 | `uploadFile()` | VIDEO, AUDIO, IMAGE, DOCUMENT |
| 외부 링크 | `createExternalLink()` | YouTube, Vimeo, Google Forms |
| 수정 제한 | `updateContent()` | **강의에 포함된 콘텐츠는 수정 불가** |

**제약사항:**
- Content → LearningObject → CourseItem 관계 체크
- `isContentInCourse()` 검증 후 수정/삭제

### 1.4 Program - 강의 개설 신청

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 개설 신청 | `createProgram()` | DRAFT 상태로 생성 |
| 심사 요청 | `submitProgram()` | DRAFT → PENDING |
| 승인 | `approveProgram()` | PENDING → APPROVED (Snapshot 필수) |
| 반려 | `rejectProgram()` | PENDING → REJECTED (사유 필수) |

### 1.5 Snapshot - 개설된 강의 (불변 사본)

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 생성 | `createSnapshotFromCourse()` | Course → Snapshot 깊은 복사 |
| 발행 | `publishSnapshot()` | DRAFT → ACTIVE |

**복사 과정:**
```
Course 조회
├── CourseItem 복사 → SnapshotItem
│   └── itemMapping 생성 (원본ID → 복사본)
└── CourseRelation 복사 → SnapshotRelation
    └── itemMapping으로 재매핑
```

### 1.6 CourseTime (TS) - 차수 관리

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 차수 생성 | `createCourseTime()` | Program APPROVED 필수 |
| 개설 | `openCourseTime()` | MAIN 강사 + 장소정보 검증 |
| 정원 관리 | `occupySeat()` | **비관적 락** |

**검증 규칙:**
- `enroll_end_date <= class_end_date`
- OFFLINE/BLENDED → `location_info` 필수
- `capacity = null` → 무제한

### 1.7 InstructorAssignment (IIS) - 강사 배정

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 배정 | `assignInstructor()` | 중복/MAIN 유니크 검증 |
| 역할 변경 | `updateRole()` | MAIN 변경 시 기존 체크 |
| 교체 | `replaceInstructor()` | 기존 REPLACED 처리 |

**강사 역할:**
- `MAIN`: 주강사 (차수당 1명)
- `ASSISTANT`: 조교
- `SUPERVISOR`: 감시자

### 1.8 Enrollment (SIS) - 수강 관리

| 기능 | 메서드 | 설명 |
|------|--------|------|
| 수강신청 | `enroll()` | 정원/기간/중복 검증 + **비관적 락** |
| 강제배정 | `forceEnroll()` | 여러 사용자, 부분 실패 지원 |
| 진도 업데이트 | `updateProgress()` | 본인 또는 관리자만 |
| 수료 | `completeEnrollment()` | 점수 입력, 상태 변경 |
| 취소 | `cancelEnrollment()` | **COMPLETED는 취소 불가** |

---

## 2. 상태 전이 다이어그램

### 2.1 Program 상태

```
DRAFT ──submit()──► PENDING ──approve()──► APPROVED ──close()──► CLOSED
                        │
                        └──reject()──► REJECTED
                                           │
                                           └──(재수정)──► DRAFT
```

### 2.2 CourseTime 상태

```
DRAFT ──open()──► RECRUITING ──start()──► ONGOING ──close()──► CLOSED ──archive()──► ARCHIVED
```

**open() 필수 조건:**
- MAIN 강사 배정됨
- OFFLINE/BLENDED → 장소정보 존재

### 2.3 Snapshot 상태

```
DRAFT ──publish()──► ACTIVE ──complete()──► COMPLETED ──archive()──► ARCHIVED
```

### 2.4 Enrollment 상태

```
ENROLLED ──updateProgress()──► ENROLLED (진도 업데이트)
    │
    ├──complete()──► COMPLETED
    │
    └──cancel()──► DROPPED
```

---

## 3. 동시성 처리

### 3.1 낙관적 락 (@Version)

**적용 엔티티:**
- Program, CourseTime, Enrollment

**메커니즘:**
```java
@Version
private Long version;

// 수정 시 버전 체크
UPDATE entity SET version = version + 1
WHERE id = ? AND version = currentVersion
// 영향받은 행 0 → OptimisticLockingFailureException
```

### 3.2 비관적 락 (PESSIMISTIC_WRITE)

**적용 위치:**
```java
// 수강신청
CourseTime courseTime = courseTimeRepository.findByIdWithLock(timeId);
// SELECT ... FOR UPDATE

// 정원 증가 (원자적)
courseTime.incrementEnrollment();
```

**사용 케이스:**
| 기능 | 락 대상 | 이유 |
|------|---------|------|
| 수강신청 | CourseTime | 정원 동시성 |
| 강사 배정 | CourseTime | 중복 배정 방지 |
| 정원 증감 | CourseTime | 원자성 보장 |

### 3.3 동시성 시나리오

```
수강신청 동시성 (정원 5명):

Thread1: Lock CourseTime → currentEnrollment: 4 → 5 → Commit
Thread2: Waiting...
Thread2: Lock CourseTime → currentEnrollment: 5 → Full! → CapacityExceededException
```

### 3.4 DB 유니크 제약

```sql
-- 중복 수강신청 방지
UNIQUE (tenant_id, user_id, course_time_id)

-- 사용자 이메일 중복 방지
UNIQUE (tenant_id, email)
```

---

## 4. 비즈니스 규칙

### 4.1 강의/프로그램

| 규칙 | 설명 |
|------|------|
| R01 | Course는 템플릿, Snapshot으로 변환 후 운영 |
| R02 | Program APPROVED 후에만 CourseTime 생성 가능 |
| R03 | Snapshot은 불변 (원본 Course 수정해도 유지) |

### 4.2 날짜/기간

| 규칙 | 설명 |
|------|------|
| R09 | `enroll_end_date <= class_end_date` |
| R10 | OFFLINE/BLENDED → `location_info` 필수 |
| R11 | 수강신청 기간: `enrollStartDate ~ enrollEndDate` |

### 4.3 정원/모집

| 규칙 | 설명 |
|------|------|
| R02 | `capacity = null` → 무제한 수강 |
| R53 | APPROVAL 모집 + 대기자 기능 불가 조합 |
| R04 | 정원 관리는 비관적 락 필수 |

### 4.4 강사 배정

| 규칙 | 설명 |
|------|------|
| IIS-01 | 강사 중복 배정 불가 |
| IIS-02 | MAIN 강사 차수당 1명만 |
| TS-OPEN | CourseTime 개설 시 MAIN 강사 필수 |

### 4.5 콘텐츠

| 규칙 | 설명 |
|------|------|
| CMS-01 | 강의에 포함된 콘텐츠 수정/삭제 불가 |
| CMS-02 | 외부 링크: YouTube, Vimeo, Google Forms만 |

### 4.6 수강

| 규칙 | 설명 |
|------|------|
| SIS-01 | 중복 수강신청 불가 (DB 유니크) |
| SIS-02 | COMPLETED 상태 취소 불가 |
| SIS-03 | 취소 시 정원 반환 필수 |

---

## 5. 전체 워크플로우

### 5.1 강의 개설 → 수강 완료

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. 강의 템플릿 생성                                              │
│    CourseServiceImpl.createCourse()                             │
│    └── Course + CourseItem + CourseRelation                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Snapshot 생성 (불변 사본)                                     │
│    SnapshotServiceImpl.createSnapshotFromCourse()               │
│    └── Item/Relation 깊은 복사                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. 강의 개설 신청                                                │
│    ProgramServiceImpl.createProgram() → submit() → approve()    │
│    └── DRAFT → PENDING → APPROVED                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. 차수 생성 + 강사 배정                                         │
│    CourseTimeServiceImpl.createCourseTime()                     │
│    InstructorAssignmentServiceImpl.assignInstructor()           │
│    CourseTimeServiceImpl.openCourseTime()                       │
│    └── DRAFT → RECRUITING                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. 수강신청                                                      │
│    EnrollmentServiceImpl.enroll() (비관적 락)                    │
│    └── 정원 체크 → 정원 증가 → Enrollment 생성                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. 학습 진행                                                     │
│    CourseTimeServiceImpl.startCourseTime() (ONGOING)            │
│    EnrollmentServiceImpl.updateProgress()                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. 수료                                                          │
│    EnrollmentServiceImpl.completeEnrollment()                   │
│    └── 점수 입력, status = COMPLETED                            │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 강사 배정 흐름

```
InstructorAssignmentServiceImpl.assignInstructor()
├── CourseTime 비관적 락
├── 중복 배정 체크
├── MAIN 유니크 체크
├── InstructorAssignment 생성 (ACTIVE)
└── AssignmentHistory 기록 (ASSIGN)
```

---

## 6. 모듈 의존 관계

```
User (UM) ←─── 모든 모듈에서 의존
    │
    ├── Course (CM) ──► Snapshot
    │       │               │
    │       └── Content (CMS) ──► LearningObject (LO)
    │
    ├── Program ──► CourseTime (TS) ──► InstructorAssignment (IIS)
    │                    │
    │                    └──────────► Enrollment (SIS)
    │
    └── 권한 검사: DESIGNER, OWNER, INSTRUCTOR, ADMIN
```

---

## 7. 리소스 접근 통제 (Data Access Control)

### 7.1 권한 체계도 (Permission Architecture)

#### 전체 권한 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM_ADMIN                                   │
│                         (시스템 전체 관리자)                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • 테넌트 생성/삭제/수정                                                │   │
│  │ • 시스템 설정 관리                                                     │   │
│  │ • 모든 테넌트 데이터 접근                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tenant A      │     │   Tenant B      │     │   Tenant C      │
│   (격리됨)       │     │   (격리됨)       │     │   (격리됨)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TENANT_ADMIN                                      │
│                        (테넌트 최고 관리자)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • 테넌트 내 모든 사용자 관리                                           │   │
│  │ • 모든 리소스 CRUD (Course, Content, Program, CourseTime 등)          │   │
│  │ • 역할 부여/해제                                                      │   │
│  │ • 프로그램 승인/반려                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
     ┌──────────────┴──────────────┐
     │                             │
     ▼                             ▼
┌─────────────────────┐   ┌─────────────────────┐
│     OPERATOR        │   │      USER           │
│     (운영자)         │   │   (일반 사용자)      │
│ ┌─────────────────┐ │   │ ┌─────────────────┐ │
│ │ • 사용자 관리    │ │   │ │ • 수강신청/취소  │ │
│ │ • CourseTime    │ │   │ │ • 내 정보 조회   │ │
│ │   생성/관리     │ │   │ │ • 학습 진행      │ │
│ │ • 강제 배정     │ │   │ │ • 진도 업데이트  │ │
│ │ • 프로그램 승인 │ │   │ └─────────────────┘ │
│ │ • 강사 배정     │ │   └─────────────────────┘
│ └─────────────────┘ │
│         │           │
│         ▼           │
│ ┌─────────────────┐ │
│ │    DESIGNER     │ │
│ │    (설계자)      │ │
│ │ ┌─────────────┐ │ │
│ │ │ • Course    │ │ │
│ │ │   설계/수정  │ │ │
│ │ │ • Content   │ │ │
│ │ │   생성/관리  │ │ │
│ │ │ • Program   │ │ │
│ │ │   신청      │ │ │
│ │ └─────────────┘ │ │
│ └─────────────────┘ │
└─────────────────────┘
```

#### 역할별 권한 상세

| 역할 | 권한 범위 | 주요 기능 |
|------|----------|----------|
| **SYSTEM_ADMIN** | 시스템 전체 | 테넌트 CRUD, 시스템 설정, 모든 데이터 접근 |
| **TENANT_ADMIN** | 소속 테넌트 전체 | 사용자 관리, 역할 부여, 모든 리소스 CRUD, 프로그램 승인 |
| **OPERATOR** | 소속 테넌트 운영 | CourseTime 관리, 수강 관리, 강사 배정, 프로그램 승인 |
| **DESIGNER** | 강의 설계 | Course/Content 설계, Program 신청 |
| **USER** | 본인 데이터 | 수강신청/취소, 학습 진행, 내 정보 관리 |

#### Course 전용 역할 (UserCourseRole)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Course 역할 체계                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OWNER (소유자)                                                  │
│  ├── Course 삭제 권한                                            │
│  ├── 다른 사용자에게 역할 부여                                    │
│  └── 생성자에게 자동 부여                                         │
│                                                                 │
│  INSTRUCTOR (강사)                                               │
│  ├── 수강생 진도 조회                                            │
│  ├── 성적 입력                                                   │
│  └── CourseTime에 배정 시 부여                                   │
│                                                                 │
│  DESIGNER (설계자)                                               │
│  ├── Course 수정 권한                                            │
│  └── 명시적 부여 필요                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 권한 상속 관계

```
SYSTEM_ADMIN
    │
    │ (시스템 레벨 - 테넌트 관리)
    │
    └──► TENANT_ADMIN ──────────────────────────────────┐
              │                                         │
              │ (테넌트 레벨 - 모든 권한 상속)            │
              │                                         │
              ├──► OPERATOR ─────────────────────┐      │
              │         │                        │      │
              │         │ (운영 권한 상속)         │      │
              │         │                        │      │
              │         └──► DESIGNER ───────┐   │      │
              │                              │   │      │
              │                              ▼   ▼      ▼
              │                         ┌────────────────────┐
              │                         │ Course CRUD        │
              │                         │ Content CRUD       │
              │                         │ Program 신청       │
              │                         └────────────────────┘
              │                              ▲   ▲      ▲
              │                              │   │      │
              │                         ┌────────────────────┐
              │                         │ CourseTime 관리    │
              │                         │ Enrollment 관리    │
              │                         │ Instructor 배정    │
              │                         │ Program 승인       │
              │                         └────────────────────┘
              │                                   ▲      ▲
              │                                   │      │
              │                         ┌────────────────────┐
              │                         │ User 관리          │
              │                         │ 역할 부여          │
              │                         │ 모든 리소스 CRUD   │
              │                         └────────────────────┘
              │
              └──► USER
                    │
                    │ (최소 권한)
                    ▼
              ┌────────────────────┐
              │ 수강신청/취소       │
              │ 내 정보 조회/수정   │
              │ 진도 업데이트       │
              └────────────────────┘
```

### 7.2 Role → Authority → Privilege → Resource 4계층 구조

#### 계층 개요

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           4계층 권한 모델                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐                                                                │
│  │    ROLE     │  사용자에게 부여되는 역할 (1:N)                                  │
│  │   (역할)     │  예: SYSTEM_ADMIN, TENANT_ADMIN, OPERATOR, DESIGNER, USER      │
│  └──────┬──────┘                                                                │
│         │ has                                                                   │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │  AUTHORITY  │  역할에 포함된 권한 그룹 (N:M)                                   │
│  │  (권한그룹)  │  예: TENANT_MANAGE, USER_MANAGE, COURSE_DESIGN, ENROLLMENT     │
│  └──────┬──────┘                                                                │
│         │ contains                                                              │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │  PRIVILEGE  │  세부 작업 권한 (N:M)                                           │
│  │  (작업권한)  │  예: CREATE, READ, UPDATE, DELETE, APPROVE, ASSIGN             │
│  └──────┬──────┘                                                                │
│         │ on                                                                    │
│         ▼                                                                       │
│  ┌─────────────┐                                                                │
│  │  RESOURCE   │  권한이 적용되는 대상                                           │
│  │   (자원)     │  예: Tenant, User, Course, Content, Program, CourseTime       │
│  └─────────────┘                                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 계층별 상세 정의

```
ROLE (역할)
├── SYSTEM_ADMIN ─────────────────────────────────────────────────────────────────┐
│   │                                                                             │
│   └── AUTHORITY: SYSTEM_MANAGE                                                  │
│       ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE, CONFIGURE                    │
│       └── RESOURCE: Tenant, SystemConfig                                        │
│                                                                                 │
├── TENANT_ADMIN ─────────────────────────────────────────────────────────────────┤
│   │                                                                             │
│   ├── AUTHORITY: USER_MANAGE                                                    │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE, ASSIGN_ROLE                  │
│   │   └── RESOURCE: User, UserCourseRole                                        │
│   │                                                                             │
│   ├── AUTHORITY: COURSE_FULL_ACCESS                                             │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE                               │
│   │   └── RESOURCE: Course, Content, CourseItem, CourseRelation                 │
│   │                                                                             │
│   ├── AUTHORITY: PROGRAM_MANAGE                                                 │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE, APPROVE, REJECT              │
│   │   └── RESOURCE: Program, CourseSnapshot                                     │
│   │                                                                             │
│   ├── AUTHORITY: OPERATION_MANAGE                                               │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE, OPEN, CLOSE                  │
│   │   └── RESOURCE: CourseTime, InstructorAssignment                            │
│   │                                                                             │
│   └── AUTHORITY: ENROLLMENT_MANAGE                                              │
│       ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE, FORCE_ENROLL, COMPLETE       │
│       └── RESOURCE: Enrollment                                                  │
│                                                                                 │
├── OPERATOR ─────────────────────────────────────────────────────────────────────┤
│   │                                                                             │
│   ├── AUTHORITY: USER_VIEW                                                      │
│   │   ├── PRIVILEGE: READ                                                       │
│   │   └── RESOURCE: User                                                        │
│   │                                                                             │
│   ├── AUTHORITY: PROGRAM_APPROVE                                                │
│   │   ├── PRIVILEGE: READ, APPROVE, REJECT                                      │
│   │   └── RESOURCE: Program                                                     │
│   │                                                                             │
│   ├── AUTHORITY: OPERATION_MANAGE                                               │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE, OPEN, CLOSE                  │
│   │   └── RESOURCE: CourseTime, InstructorAssignment                            │
│   │                                                                             │
│   └── AUTHORITY: ENROLLMENT_MANAGE                                              │
│       ├── PRIVILEGE: READ, UPDATE, FORCE_ENROLL, COMPLETE                       │
│       └── RESOURCE: Enrollment                                                  │
│                                                                                 │
├── DESIGNER ─────────────────────────────────────────────────────────────────────┤
│   │                                                                             │
│   ├── AUTHORITY: COURSE_DESIGN                                                  │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE (own)                         │
│   │   └── RESOURCE: Course, CourseItem, CourseRelation                          │
│   │                                                                             │
│   ├── AUTHORITY: CONTENT_MANAGE                                                 │
│   │   ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE (own)                         │
│   │   └── RESOURCE: Content, ContentVersion                                     │
│   │                                                                             │
│   └── AUTHORITY: PROGRAM_SUBMIT                                                 │
│       ├── PRIVILEGE: CREATE, READ, UPDATE, SUBMIT                               │
│       └── RESOURCE: Program, CourseSnapshot                                     │
│                                                                                 │
└── USER ─────────────────────────────────────────────────────────────────────────┤
    │                                                                             │
    ├── AUTHORITY: SELF_MANAGE                                                    │
    │   ├── PRIVILEGE: READ, UPDATE                                               │
    │   └── RESOURCE: User (self)                                                 │
    │                                                                             │
    └── AUTHORITY: ENROLLMENT_SELF                                                │
        ├── PRIVILEGE: CREATE, READ, UPDATE, DELETE (own)                         │
        └── RESOURCE: Enrollment (self)                                           │
                                                                                  │
──────────────────────────────────────────────────────────────────────────────────┘
```

#### Privilege 범위 매트릭스

| Privilege | 설명 | 적용 범위 |
|-----------|------|----------|
| **CREATE** | 새 리소스 생성 | 모든 리소스 |
| **READ** | 리소스 조회 | 모든 리소스 |
| **UPDATE** | 리소스 수정 | 모든 리소스 |
| **DELETE** | 리소스 삭제 | 모든 리소스 |
| **APPROVE** | 승인 처리 | Program |
| **REJECT** | 반려 처리 | Program |
| **SUBMIT** | 심사 요청 | Program |
| **OPEN** | 차수 개설 | CourseTime |
| **CLOSE** | 차수 종료 | CourseTime |
| **ASSIGN** | 강사 배정 | InstructorAssignment |
| **ASSIGN_ROLE** | 역할 부여 | UserCourseRole |
| **FORCE_ENROLL** | 강제 수강 배정 | Enrollment |
| **COMPLETE** | 수료 처리 | Enrollment |
| **CONFIGURE** | 시스템 설정 | SystemConfig |

#### Resource별 Privilege 매핑

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        Resource별 허용 Privilege                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Tenant ─────────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ CONFIGURE │                                 │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ SYSTEM_ADMIN 전용                                                             │
│                                                                                  │
│  User ───────────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ ASSIGN_ROLE │                               │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ CREATE: 회원가입 (permitAll), ASSIGN_ROLE: TENANT_ADMIN만                      │
│                                                                                  │
│  Course ─────────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │                                             │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ DELETE: OWNER 또는 TENANT_ADMIN만                                             │
│                                                                                  │
│  Content ────────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │                                             │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ CREATE/UPDATE/DELETE: 생성자(own) 또는 TENANT_ADMIN                           │
│                                                                                  │
│  Program ────────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ SUBMIT │ APPROVE │ REJECT │                 │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ APPROVE/REJECT: OPERATOR, TENANT_ADMIN만                                     │
│                                                                                  │
│  CourseSnapshot ─────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ PUBLISH │ COMPLETE │ ARCHIVE │              │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ 상태 전이 Privilege: DRAFT→ACTIVE→COMPLETED→ARCHIVED                          │
│                                                                                  │
│  CourseTime ─────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ OPEN │ CLOSE │ ARCHIVE │                    │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ OPERATOR, TENANT_ADMIN만                                                     │
│                                                                                  │
│  InstructorAssignment ───────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ ASSIGN │ REPLACE │                          │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ OPERATOR, TENANT_ADMIN만                                                     │
│                                                                                  │
│  Enrollment ─────────────────────────────────────────────────────────────────    │
│  │ CREATE │ READ │ UPDATE │ DELETE │ FORCE_ENROLL │ COMPLETE │ DROP │            │
│  └────────────────────────────────────────────────────────────────────────────   │
│  ※ CREATE/DELETE(own): USER, FORCE_ENROLL/COMPLETE: OPERATOR, TENANT_ADMIN      │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### Role-Authority-Privilege 전체 매핑표

| Role | Authority | Privilege | Resource | 범위 |
|------|-----------|-----------|----------|------|
| **SYSTEM_ADMIN** | SYSTEM_MANAGE | CREATE, READ, UPDATE, DELETE, CONFIGURE | Tenant | 전체 |
| | | | SystemConfig | 전체 |
| **TENANT_ADMIN** | USER_MANAGE | CREATE, READ, UPDATE, DELETE, ASSIGN_ROLE | User | 소속 테넌트 |
| | COURSE_FULL | CREATE, READ, UPDATE, DELETE | Course, Content | 소속 테넌트 |
| | PROGRAM_MANAGE | CREATE, READ, UPDATE, DELETE, APPROVE, REJECT | Program | 소속 테넌트 |
| | OPERATION_MANAGE | CREATE, READ, UPDATE, DELETE, OPEN, CLOSE | CourseTime | 소속 테넌트 |
| | ENROLLMENT_MANAGE | READ, UPDATE, FORCE_ENROLL, COMPLETE | Enrollment | 소속 테넌트 |
| **OPERATOR** | USER_VIEW | READ | User | 소속 테넌트 |
| | PROGRAM_APPROVE | READ, APPROVE, REJECT | Program | 소속 테넌트 |
| | OPERATION_MANAGE | CREATE, READ, UPDATE, DELETE, OPEN, CLOSE | CourseTime | 소속 테넌트 |
| | ENROLLMENT_MANAGE | READ, UPDATE, FORCE_ENROLL, COMPLETE | Enrollment | 소속 테넌트 |
| **DESIGNER** | COURSE_DESIGN | CREATE, READ, UPDATE, DELETE | Course | 본인 생성 |
| | CONTENT_MANAGE | CREATE, READ, UPDATE, DELETE | Content | 본인 생성 |
| | PROGRAM_SUBMIT | CREATE, READ, UPDATE, SUBMIT | Program | 본인 생성 |
| **USER** | SELF_MANAGE | READ, UPDATE | User | 본인만 |
| | ENROLLMENT_SELF | CREATE, READ, UPDATE, DELETE | Enrollment | 본인만 |

### 7.3 API 권한 매핑

| 도메인 | API | 허용 역할 | 비고 |
|--------|-----|----------|------|
| **Tenant** | 모든 API | `SYSTEM_ADMIN` | 테넌트 생성/관리 |
| **User** | 회원가입/로그인 | `permitAll` | 인증 불필요 |
| **User** | /me | `isAuthenticated` | 본인 정보 |
| **User** | 관리 API | `OPERATOR`, `TENANT_ADMIN` | 사용자 관리 |
| **Course** | CRUD | `DESIGNER`, `OPERATOR`, `TENANT_ADMIN` | 강의 템플릿 |
| **Content** | 생성 | `DESIGNER` | 본인만 |
| **Content** | 조회/수정 | `DESIGNER`, `OPERATOR`, `TENANT_ADMIN` | - |
| **Program** | 생성/수정 | `DESIGNER`, `OPERATOR`, `TENANT_ADMIN` | 개설 신청 |
| **Program** | 승인/반려 | `OPERATOR`, `TENANT_ADMIN` | 심사 권한 |
| **CourseTime** | 모든 API | `OPERATOR`, `TENANT_ADMIN` | 차수 관리 |
| **Enrollment** | 수강신청/취소 | `isAuthenticated` | 본인 |
| **Enrollment** | 강제배정/관리 | `OPERATOR`, `TENANT_ADMIN` | 관리자 |

### 7.3 소유자 규칙 (Ownership Rules)

| 리소스 | 소유자 필드 | 삭제 권한 | 현재 구현 |
|--------|------------|----------|----------|
| **Course** | `created_by` (OWNER) | OWNER만 삭제 가능 | ⚠️ 미구현 |
| **Content** | `created_by` | 생성자만 삭제 가능 | ✅ 구현됨 |
| **Program** | `created_by` | 생성자 또는 ADMIN | ⚠️ 미구현 |
| **CourseTime** | `created_by` | ADMIN만 삭제 가능 | ✅ 구현됨 |

**Content 소유자 검증 구현 (ContentVersionServiceImpl):**
```java
private void validateOwnership(Content content, Long userId) {
    if (content.getCreatedBy() == null || !content.getCreatedBy().equals(userId)) {
        throw new UnauthorizedContentAccessException(content.getId());
    }
}
```

**미구현 항목 (TODO):**
- [ ] Course 삭제 시 OWNER 검증
- [ ] Program 삭제 시 생성자 검증
- [ ] Snapshot 삭제 시 생성자 검증

### 7.4 테넌트 격리 (Tenant Isolation)

**원칙:**
- 모든 조회/수정에 `tenant_id` 필터 자동 적용
- 크로스 테넌트 접근 완전 차단

**구현 패턴:**
```java
// Repository 레벨 격리
Optional<Entity> findByIdAndTenantId(Long id, Long tenantId);
Page<Entity> findByTenantId(Long tenantId, Pageable pageable);

// Service 레벨 검증
Long tenantId = TenantContext.getCurrentTenantId();
Entity entity = repository.findByIdAndTenantId(id, tenantId)
    .orElseThrow(() -> new EntityNotFoundException(id));
```

**테넌트 격리 적용 현황:**

| Repository | `findByIdAndTenantId` | `findByTenantId` | 비고 |
|------------|----------------------|------------------|------|
| UserRepository | ✅ | ✅ | - |
| CourseRepository | ✅ | ✅ | - |
| ContentRepository | ✅ | ✅ | - |
| ProgramRepository | ✅ | ✅ | - |
| SnapshotRepository | ✅ | ✅ | - |
| CourseTimeRepository | ✅ | ✅ | - |
| EnrollmentRepository | ✅ | ✅ | - |
| InstructorAssignmentRepository | ✅ | ✅ | - |

### 7.5 상태 기반 제한 (State-based Restrictions)

#### Course 상태 제한

| 현재 상태 | 허용 작업 | 차단 작업 |
|----------|----------|----------|
| 일반 | 수정, 삭제 | - |
| Snapshot 존재 | 수정 | 삭제 (참조 무결성) |

#### Snapshot 상태 제한

| 현재 상태 | 허용 작업 | 차단 작업 |
|----------|----------|----------|
| `DRAFT` | 수정, 아이템 추가/삭제, 발행 | - |
| `ACTIVE` | 메타데이터 수정, 완료 | 아이템 수정/삭제 |
| `COMPLETED` | 보관 | 모든 수정 |
| `ARCHIVED` | 조회만 | 모든 수정 |

```java
// CourseSnapshot.java
public boolean isModifiable() {
    return this.status == SnapshotStatus.DRAFT || this.status == SnapshotStatus.ACTIVE;
}

public boolean isItemModifiable() {
    return this.status == SnapshotStatus.DRAFT;
}
```

#### Program 상태 제한

| 현재 상태 | 허용 작업 | 차단 작업 |
|----------|----------|----------|
| `DRAFT` | 수정, 제출 | 승인, 반려 |
| `PENDING` | 승인, 반려 | 수정 |
| `APPROVED` | 차수 생성, 종료 | 수정, 재제출 |
| `REJECTED` | 재수정 | 승인 |
| `CLOSED` | 조회만 | 모든 수정 |

#### CourseTime 상태 제한

| 현재 상태 | 허용 작업 | 차단 작업 |
|----------|----------|----------|
| `DRAFT` | 수정, 삭제, 개설 | 수강신청 |
| `RECRUITING` | 수강신청, 학습 시작 | 삭제 |
| `ONGOING` | 진도 업데이트, 중간 합류(옵션), 종료 | 삭제, 새 수강신청(기본) |
| `CLOSED` | 보관 | 수정, 수강신청 |
| `ARCHIVED` | 조회만 | 모든 수정 |

```java
// CourseTime.java
public boolean canEnroll() {
    if (isRecruiting()) {
        return true;
    }
    if (isOngoing()) {
        return this.allowLateEnrollment;  // 중간 합류 허용 시에만
    }
    return false;
}
```

#### Enrollment 상태 제한

| 현재 상태 | 허용 작업 | 차단 작업 |
|----------|----------|----------|
| `ENROLLED` | 진도 업데이트, 수료, 취소 | - |
| `COMPLETED` | 조회만 | **취소 불가** |
| `DROPPED` | 재수강(새로 신청) | 수정 |

```java
// Enrollment.java
public boolean canCancel() {
    return this.status != EnrollmentStatus.COMPLETED;
}

// EnrollmentServiceImpl.java
if (!enrollment.canCancel()) {
    throw new CannotCancelCompletedException(enrollmentId);
}
```

### 7.6 접근 통제 체크리스트

**구현 완료:**
- [x] Content 생성자 검증 (`validateOwnership`)
- [x] 테넌트 격리 (`findByIdAndTenantId` 패턴)
- [x] Enrollment 본인 확인 (취소/진도 업데이트)
- [x] Snapshot 상태별 수정 제한
- [x] Enrollment COMPLETED 취소 차단
- [x] CourseTime 상태별 수강신청 제한

**미구현 (TODO):**
- [ ] Course OWNER 삭제 검증
- [ ] Program 생성자 삭제 검증
- [ ] Content 삭제 시 생성자 검증 (현재 수정만)
- [ ] CourseTime 삭제 시 상태 검증 (IN_PROGRESS 차수)

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [module-structure.md](./module-structure.md) | 모듈 분리 및 역할 |
| [lms-architecture.md](./lms-architecture.md) | 진도/성적/수료 관리 |
| [user-roles.md](./user-roles.md) | 역할 및 권한 |
| [architecture.md](./architecture.md) | 전체 시스템 구조 |

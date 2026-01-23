# Schedule DB 스키마

> TS (Time Schedule) 모듈 데이터베이스 - 차수(CourseTime) 관리
>
> **Note**: Program 엔티티는 제거되었습니다. 차수는 Course/Snapshot을 직접 참조합니다.

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **Course → CourseTime 관계** | 승인된 Course의 차수 운영, 1:N 관계로 재사용성 확보 |
| **DurationType 도입** | FIXED(고정 기간) / FLEXIBLE(유연 기간) 지원 |
| **CourseTime capacity** | 차수별 정원 관리, NULL이면 무제한 |
| **enrollment_period** | 수강신청 기간 별도 관리, 차수 운영 기간과 분리 |
| **EnrollmentPolicy** | OPEN(자유신청) / APPROVAL(승인필요) / INVITATION_ONLY(초대만) |

---

## 1. 테이블 구조

> **Note**: Program 엔티티는 제거되었습니다. 차수(CourseTime)는 승인된 Course를 직접 참조합니다.
> Course 상태 관리는 [course/db.md](../course/db.md) 참조

### 1.1 ts_course_times (차수)

```sql
CREATE TABLE ts_course_times (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id               BIGINT NOT NULL,
    course_id               BIGINT NOT NULL,                    -- cm_courses 연결
    snapshot_id             BIGINT,                             -- cm_snapshots 연결 (깊은 복사)
    name                    VARCHAR(255) NOT NULL,              -- 차수명 (예: "2026년 1기")
    duration_type           VARCHAR(20) NOT NULL DEFAULT 'FIXED', -- FIXED/FLEXIBLE
    start_date              DATE,                               -- FIXED 타입: 시작일
    end_date                DATE,                               -- FIXED 타입: 종료일
    duration_days           INT,                                -- FLEXIBLE 타입: 수강 기간(일)
    enrollment_start_date   DATE,
    enrollment_end_date     DATE,
    capacity                INT,                                -- 정원 (NULL이면 무제한)
    enrollment_policy       VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 수강신청 정책
    auto_approve            BOOLEAN NOT NULL DEFAULT TRUE,      -- 자동 승인 여부
    status                  VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_by              BIGINT NOT NULL,
    created_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_time_course FOREIGN KEY (course_id)
        REFERENCES cm_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_time_snapshot FOREIGN KEY (snapshot_id)
        REFERENCES cm_snapshots(id) ON DELETE SET NULL,

    INDEX idx_tenant (tenant_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| course_id | BIGINT | NO | FK → cm_courses (승인된 강의) |
| snapshot_id | BIGINT | YES | FK → cm_snapshots (깊은 복사본) |
| name | VARCHAR(255) | NO | 차수명 |
| duration_type | VARCHAR(20) | NO | 기간 유형 (FIXED/FLEXIBLE) |
| start_date | DATE | YES | 수강 시작일 (FIXED 타입) |
| end_date | DATE | YES | 수강 종료일 (FIXED 타입) |
| duration_days | INT | YES | 수강 기간 일수 (FLEXIBLE 타입) |
| enrollment_start_date | DATE | YES | 수강신청 시작일 |
| enrollment_end_date | DATE | YES | 수강신청 종료일 |
| capacity | INT | YES | 정원 (NULL이면 무제한) |
| enrollment_policy | VARCHAR(20) | NO | 수강신청 정책 |
| auto_approve | BOOLEAN | NO | 자동 승인 여부 |
| status | VARCHAR(20) | NO | 상태 |
| created_by | BIGINT | NO | 생성자 ID (OPERATOR) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**DurationType Enum:**
- `FIXED`: 고정 기간 (startDate ~ endDate)
- `FLEXIBLE`: 유연 기간 (수강신청일로부터 N일)

**EnrollmentPolicy Enum:**
- `OPEN`: 자유 신청 (누구나 신청 가능)
- `APPROVAL`: 승인 필요 (OPERATOR 승인 후 수강)
- `INVITATION_ONLY`: 초대만 (OPERATOR가 직접 배정)

**TimeStatus Enum:**
- `SCHEDULED`: 예정 (수강신청 불가)
- `OPEN`: 수강신청 가능
- `IN_PROGRESS`: 진행 중
- `COMPLETED`: 완료
- `CANCELLED`: 취소됨

### 1.3 ts_categories (카테고리)

```sql
CREATE TABLE ts_categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id   BIGINT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    parent_id   BIGINT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id)
        REFERENCES ts_categories(id) ON DELETE CASCADE,

    INDEX idx_tenant (tenant_id),
    INDEX idx_parent (parent_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| name | VARCHAR(100) | NO | 카테고리명 |
| parent_id | BIGINT | YES | FK → ts_categories (self-reference) |
| sort_order | INT | NO | 정렬 순서 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

---

## 2. ER 다이어그램

```
┌─────────────────────┐
│      um_users       │
│     (외부 참조)     │
└──────────┬──────────┘
           │
           │ creator_id / approved_by / created_by
           │
┌──────────┼────────────────────────────────────────────────────────────────┐
│          │                                                                │
│          ▼                                                                │
│ ┌─────────────────────┐                                                   │
│ │    ts_categories    │                                                   │
│ ├─────────────────────┤                                                   │
│ │ id (PK)             │                                                   │
│ │ tenant_id           │                                                   │
│ │ name                │                                                   │
│ │ parent_id (FK)──────┘                                                   │
│ │ sort_order          │                                                   │
│ └─────────────────────┘                                                   │
│   self-reference                                                          │
│                                                                           │
│                       ┌─────────────────────────┐                         │
│                       │    cm_snapshots         │                         │
│                       │    (개설 강의)          │                         │
│                       └───────────┬─────────────┘                         │
│                                   │ snapshot_id                           │
│                                   ▼                                       │
│                       ┌─────────────────────────┐                         │
│                       │      cm_programs        │ ✅ 구현 완료            │
│                       ├─────────────────────────┤                         │
│                       │ id (PK)                 │                         │
│                       │ tenant_id               │                         │
│                       │ snapshot_id (FK) ───────┼──► cm_snapshots.id      │
│                       │ title                   │                         │
│                       │ description             │                         │
│                       │ level                   │                         │
│                       │ type                    │                         │
│                       │ status                  │                         │
│                       │ creator_id ─────────────┼─────► um_users.id       │
│                       │ approved_by ────────────┼─────► um_users.id       │
│                       │ approval_comment        │                         │
│                       │ rejection_reason        │                         │
│                       │ submitted_at            │                         │
│                       └───────────┬─────────────┘                         │
│                                   │ 1:N                                   │
│                                   ▼                                       │
│                       ┌─────────────────────────┐                         │
│                       │    ts_course_times      │ ⏳ 구현 예정            │
│                       ├─────────────────────────┤                         │
│                       │ id (PK)                 │                         │
│                       │ tenant_id               │                         │
│                       │ program_id (FK) ────────┼──► cm_programs.id       │
│                       │ time_number             │                         │
│                       │ start_date              │                         │
│                       │ end_date                │                         │
│                       │ enrollment_start_date   │                         │
│                       │ enrollment_end_date     │                         │
│                       │ capacity                │                         │
│                       │ status                  │                         │
│                       │ created_by ─────────────┼─────► um_users.id       │
│                       └─────────────────────────┘                         │
└───────────────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
           ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │ SIS (수강)   │    │ IIS (강사)   │    │  LO (학습)   │
           │ time_id (FK) │    │ time_id (FK) │    │  via snapshot│
           └──────────────┘    └──────────────┘    └──────────────┘
```

### 연결 관계 요약

| 관계 | 설명 |
|------|------|
| Program → Snapshot | 승인된 프로그램은 개설 강의(Snapshot)를 참조 |
| CourseTime → Program | 차수는 승인된 프로그램에만 생성 가능 |
| Snapshot → LO | 학습 콘텐츠는 Snapshot을 통해 접근 |

---

## 3. 데이터 예시

### 3.1 ts_categories 데이터

```sql
INSERT INTO ts_categories (id, tenant_id, name, parent_id, sort_order) VALUES
-- B2C 카테고리
(1, 1, '개발', NULL, 1),
(2, 1, '프론트엔드', 1, 1),
(3, 1, '백엔드', 1, 2),
(4, 1, '데이터/AI', NULL, 2),
(5, 1, '비즈니스', NULL, 3),

-- B2B 카테고리 (삼성)
(10, 2, '직무교육', NULL, 1),
(11, 2, '리더십', NULL, 2),
(12, 2, '컴플라이언스', NULL, 3);
```

### 3.2 ts_programs 데이터

```sql
INSERT INTO ts_programs (id, tenant_id, title, description, level, type, estimated_hours, category_id, status, creator_id, approved_at, approved_by) VALUES
-- B2C: 승인된 강의
(1, 1, 'React 기초 과정', 'React의 기초부터 실전까지', 'BEGINNER', 'ONLINE', 20, 2, 'APPROVED', 3, '2025-01-16 14:00:00', 2),
(2, 1, 'Spring Boot 입문', 'Java Spring Boot 웹 개발', 'BEGINNER', 'ONLINE', 30, 3, 'APPROVED', 3, '2025-01-17 10:00:00', 2),

-- B2C: 검토 대기
(3, 1, 'Vue.js 심화', 'Vue.js 고급 패턴', 'ADVANCED', 'ONLINE', 25, 2, 'PENDING', 5, NULL, NULL),

-- B2B: 삼성 사내 교육
(10, 2, '신입사원 필수교육', '입사 후 필수 이수 과정', 'BEGINNER', 'BLENDED', 8, 10, 'APPROVED', 11, '2025-01-10 09:00:00', 11);
```

### 3.3 ts_course_times 데이터

```sql
INSERT INTO ts_course_times (id, tenant_id, program_id, time_number, start_date, end_date, enrollment_start_date, enrollment_end_date, capacity, status, created_by) VALUES
-- React 기초 과정 차수들
(1, 1, 1, 1, '2025-02-01 00:00:00', '2025-03-01 23:59:59', '2025-01-20 00:00:00', '2025-01-31 23:59:59', 50, 'IN_PROGRESS', 2),
(2, 1, 1, 2, '2025-03-01 00:00:00', '2025-04-01 23:59:59', '2025-02-15 00:00:00', '2025-02-28 23:59:59', 50, 'OPEN', 2),
(3, 1, 1, 3, '2025-04-01 00:00:00', '2025-05-01 23:59:59', NULL, NULL, 50, 'SCHEDULED', 2),

-- Spring Boot 입문
(5, 1, 2, 1, '2025-02-15 00:00:00', '2025-03-30 23:59:59', '2025-02-01 00:00:00', '2025-02-14 23:59:59', 30, 'OPEN', 2),

-- 삼성 신입사원 교육
(10, 2, 10, 1, '2025-02-01 00:00:00', '2025-02-05 23:59:59', NULL, NULL, 100, 'IN_PROGRESS', 11),
(11, 2, 10, 2, '2025-03-01 00:00:00', '2025-03-05 23:59:59', NULL, NULL, 100, 'SCHEDULED', 11);
```

---

## 4. 주요 쿼리

### 4.1 강의 목록 조회 (페이징)

```sql
SELECT
    p.id, p.title, p.thumbnail_url, p.level, p.type, p.status,
    c.name as category_name,
    u.name as creator_name,
    (SELECT COUNT(*) FROM ts_course_times ct WHERE ct.program_id = p.id) as time_count,
    (SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM sis_enrollments e WHERE e.time_key = ct2.id)
    ), 0) FROM ts_course_times ct2 WHERE ct2.program_id = p.id) as total_enrollment
FROM ts_programs p
LEFT JOIN ts_categories c ON p.category_id = c.id
JOIN um_users u ON p.creator_id = u.id
WHERE p.tenant_id = :tenantId
  AND p.status = :status
ORDER BY p.created_at DESC
LIMIT :size OFFSET :offset;
```

### 4.2 검토 대기 강의 목록 (OPERATOR용)

```sql
SELECT
    p.id, p.title, p.level,
    u.name as creator_name,
    p.created_at as submitted_at,
    (SELECT COUNT(*) FROM course_item ci WHERE ci.course_id = p.id) as item_count
FROM ts_programs p
JOIN um_users u ON p.creator_id = u.id
WHERE p.tenant_id = :tenantId
  AND p.status = 'PENDING'
ORDER BY p.created_at ASC;
```

### 4.3 강의 상세 조회 (차수 포함)

```sql
SELECT
    p.id, p.title, p.description, p.thumbnail_url, p.level, p.type,
    p.estimated_hours, p.status, p.created_at, p.updated_at,
    c.id as category_id, c.name as category_name,
    creator.id as creator_id, creator.name as creator_name, creator.email as creator_email,
    approver.id as approver_id, approver.name as approver_name, p.approved_at
FROM ts_programs p
LEFT JOIN ts_categories c ON p.category_id = c.id
JOIN um_users creator ON p.creator_id = creator.id
LEFT JOIN um_users approver ON p.approved_by = approver.id
WHERE p.id = :programId;

-- 차수 목록
SELECT
    ct.id, ct.time_number, ct.start_date, ct.end_date,
    ct.enrollment_start_date, ct.enrollment_end_date,
    ct.capacity, ct.status,
    (SELECT COUNT(*) FROM sis_enrollments e WHERE e.time_key = ct.id) as current_enrollment
FROM ts_course_times ct
WHERE ct.program_id = :programId
ORDER BY ct.time_number;
```

### 4.4 수강 가능한 차수 조회

```sql
SELECT
    ct.id, ct.time_number, ct.start_date, ct.end_date, ct.capacity, ct.status,
    p.id as program_id, p.title as program_title,
    (SELECT COUNT(*) FROM sis_enrollments e WHERE e.time_key = ct.id) as current_enrollment
FROM ts_course_times ct
JOIN ts_programs p ON ct.program_id = p.id
WHERE ct.tenant_id = :tenantId
  AND ct.status = 'OPEN'
  AND (ct.enrollment_start_date IS NULL OR ct.enrollment_start_date <= NOW())
  AND (ct.enrollment_end_date IS NULL OR ct.enrollment_end_date >= NOW())
  AND (ct.capacity IS NULL OR ct.capacity > (
      SELECT COUNT(*) FROM sis_enrollments e WHERE e.time_key = ct.id
  ))
ORDER BY ct.start_date;
```

### 4.5 차수 상태 자동 업데이트 (배치)

```sql
-- SCHEDULED → OPEN (수강신청 시작일 도래)
UPDATE ts_course_times
SET status = 'OPEN', updated_at = NOW()
WHERE status = 'SCHEDULED'
  AND enrollment_start_date IS NOT NULL
  AND enrollment_start_date <= NOW();

-- OPEN → IN_PROGRESS (수강 시작일 도래)
UPDATE ts_course_times
SET status = 'IN_PROGRESS', updated_at = NOW()
WHERE status = 'OPEN'
  AND start_date <= NOW();

-- IN_PROGRESS → COMPLETED (수강 종료일 경과)
UPDATE ts_course_times
SET status = 'COMPLETED', updated_at = NOW()
WHERE status = 'IN_PROGRESS'
  AND end_date < NOW();
```

### 4.6 카테고리별 강의 수 집계

```sql
SELECT
    c.id, c.name, c.parent_id,
    COUNT(p.id) as program_count
FROM ts_categories c
LEFT JOIN ts_programs p ON p.category_id = c.id AND p.status = 'APPROVED'
WHERE c.tenant_id = :tenantId
GROUP BY c.id, c.name, c.parent_id
ORDER BY c.sort_order;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| ts_programs | idx_tenant | 테넌트별 조회 |
| ts_programs | idx_status | 상태별 필터링 |
| ts_programs | idx_creator | 생성자별 조회 |
| ts_programs | idx_category | 카테고리별 조회 |
| ts_course_times | uk_program_time_number | 프로그램 내 차수 번호 유니크 |
| ts_course_times | idx_tenant | 테넌트별 조회 |
| ts_course_times | idx_program | 프로그램별 차수 목록 |
| ts_course_times | idx_status | 상태별 필터링 |
| ts_course_times | idx_start_date | 시작일 기준 조회 |
| ts_categories | idx_tenant | 테넌트별 조회 |
| ts_categories | idx_parent | 상위 카테고리 조회 |

---

## 6. 제약 조건

### 6.1 강의 상태 전이 규칙 (애플리케이션)

```java
public void changeStatus(Program program, ProgramStatus newStatus) {
    ProgramStatus current = program.getStatus();

    // 허용된 전이만 가능
    boolean valid = switch (current) {
        case DRAFT -> newStatus == ProgramStatus.PENDING || newStatus == ProgramStatus.CLOSED;
        case PENDING -> newStatus == ProgramStatus.APPROVED || newStatus == ProgramStatus.REJECTED;
        case APPROVED -> newStatus == ProgramStatus.CLOSED;
        case REJECTED -> newStatus == ProgramStatus.DRAFT || newStatus == ProgramStatus.CLOSED;
        case CLOSED -> false;  // CLOSED에서는 변경 불가
    };

    if (!valid) {
        throw new BusinessException("INVALID_STATUS_TRANSITION",
            String.format("%s에서 %s로 변경할 수 없습니다", current, newStatus));
    }

    program.changeStatus(newStatus);
}
```

### 6.2 차수 생성 조건 (애플리케이션)

```java
@Transactional
public CourseTime createTime(Long programId, CreateTimeRequest request) {
    Program program = programRepository.findById(programId).orElseThrow();

    // 승인된 강의만 차수 생성 가능
    if (program.getStatus() != ProgramStatus.APPROVED) {
        throw new BusinessException("PROGRAM_NOT_APPROVED", "승인된 강의만 차수를 생성할 수 있습니다");
    }

    // 차수 번호 중복 체크
    boolean exists = courseTimeRepository.existsByProgramIdAndTimeNumber(
        programId, request.getTimeNumber()
    );
    if (exists) {
        throw new BusinessException("DUPLICATE_TIME_NUMBER", "이미 존재하는 차수 번호입니다");
    }

    // 날짜 유효성 검증
    if (request.getEndDate().isBefore(request.getStartDate())) {
        throw new BusinessException("INVALID_DATE_RANGE", "종료일은 시작일 이후여야 합니다");
    }

    return courseTimeRepository.save(CourseTime.create(program, request));
}
```

### 6.3 차수 삭제 조건 (애플리케이션)

```java
@Transactional
public void deleteTime(Long timeId) {
    CourseTime time = courseTimeRepository.findById(timeId).orElseThrow();

    // SCHEDULED 상태에서만 삭제 가능
    if (time.getStatus() != TimeStatus.SCHEDULED) {
        // 수강생이 있으면 CANCELLED로 변경
        long enrollmentCount = enrollmentRepository.countByTimeKey(timeId);
        if (enrollmentCount > 0) {
            time.cancel();
            return;
        }
    }

    courseTimeRepository.delete(time);
}
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | TS API 명세 |
| [user/db.md](../user/db.md) | User DB (creator_id 참조) |
| [student/db.md](../student/db.md) | SIS DB (time_key 참조) |
| [instructor/db.md](../instructor/db.md) | IIS DB (time_key 참조) |
| [course/db.md](../course/db.md) | CM/CR DB (커리큘럼, program_id 참조) |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |

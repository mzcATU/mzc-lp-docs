# Schedule DB 스키마

> TS (Time Schedule) 모듈 데이터베이스 - 강의(Program) 및 차수(Time) 관리

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **Program ↔ CourseTime 분리** | 강의 정보와 운영(차수) 정보 분리, 1:N 관계로 재사용성 확보 |
| **Program status 관리** | DRAFT → PENDING → APPROVED 워크플로우, OPERATOR 검토 프로세스 |
| **CourseTime capacity** | 차수별 정원 관리, NULL이면 무제한 |
| **enrollment_period** | 수강신청 기간 별도 관리, 차수 운영 기간과 분리 |

---

## 1. 테이블 구조

### 1.1 ts_programs (강의/프로그램)

```sql
CREATE TABLE ts_programs (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    thumbnail_url       VARCHAR(500),
    level               VARCHAR(20) DEFAULT 'BEGINNER',
    type                VARCHAR(20) DEFAULT 'ONLINE',
    estimated_hours     INT,
    category_id         BIGINT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    creator_id          BIGINT NOT NULL,
    approved_at         DATETIME(6),
    approved_by         BIGINT,
    rejected_at         DATETIME(6),
    rejected_reason     VARCHAR(500),
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_creator (creator_id),
    INDEX idx_category (category_id),
    INDEX idx_level (level),
    INDEX idx_type (type)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| title | VARCHAR(255) | NO | 강의 제목 |
| description | TEXT | YES | 강의 설명 |
| thumbnail_url | VARCHAR(500) | YES | 썸네일 이미지 URL |
| level | VARCHAR(20) | YES | 난이도 (BEGINNER, INTERMEDIATE, ADVANCED) |
| type | VARCHAR(20) | YES | 유형 (ONLINE, OFFLINE, BLENDED) |
| estimated_hours | INT | YES | 예상 학습 시간 |
| category_id | BIGINT | YES | 카테고리 ID (FK → ts_categories) |
| status | VARCHAR(20) | NO | 상태 (DRAFT, PENDING, APPROVED, REJECTED, CLOSED) |
| creator_id | BIGINT | NO | 생성자 ID (um_users.id 참조) |
| approved_at | DATETIME(6) | YES | 승인 시점 |
| approved_by | BIGINT | YES | 승인자 ID (OPERATOR) |
| rejected_at | DATETIME(6) | YES | 반려 시점 |
| rejected_reason | VARCHAR(500) | YES | 반려 사유 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**ProgramLevel Enum:**
- `BEGINNER`: 입문
- `INTERMEDIATE`: 중급
- `ADVANCED`: 고급

**ProgramType Enum:**
- `ONLINE`: 온라인 (비대면)
- `OFFLINE`: 오프라인 (대면)
- `BLENDED`: 블렌디드 (혼합)

**ProgramStatus Enum:**
- `DRAFT`: 작성 중
- `PENDING`: 검토 대기
- `APPROVED`: 승인됨 (운영 가능)
- `REJECTED`: 반려됨
- `CLOSED`: 종료됨

### 1.2 ts_course_times (차수)

```sql
CREATE TABLE ts_course_times (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id               BIGINT NOT NULL,
    program_id              BIGINT NOT NULL,
    time_number             INT NOT NULL,
    start_date              DATETIME(6) NOT NULL,
    end_date                DATETIME(6) NOT NULL,
    enrollment_start_date   DATETIME(6),
    enrollment_end_date     DATETIME(6),
    capacity                INT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_by              BIGINT NOT NULL,
    created_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_time_program FOREIGN KEY (program_id)
        REFERENCES ts_programs(id) ON DELETE CASCADE,

    UNIQUE KEY uk_program_time_number (program_id, time_number),
    INDEX idx_tenant (tenant_id),
    INDEX idx_program (program_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| program_id | BIGINT | NO | FK → ts_programs |
| time_number | INT | NO | 차수 번호 (1, 2, 3...) |
| start_date | DATETIME(6) | NO | 수강 시작일 |
| end_date | DATETIME(6) | NO | 수강 종료일 |
| enrollment_start_date | DATETIME(6) | YES | 수강신청 시작일 |
| enrollment_end_date | DATETIME(6) | YES | 수강신청 종료일 |
| capacity | INT | YES | 정원 (NULL이면 무제한) |
| status | VARCHAR(20) | NO | 상태 |
| created_by | BIGINT | NO | 생성자 ID (OPERATOR) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

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
┌──────────┼──────────────────────────────────────────────┐
│          │                                              │
│          ▼                                              │
│ ┌─────────────────────┐     ┌─────────────────────────┐ │
│ │    ts_categories    │     │      ts_programs        │ │
│ ├─────────────────────┤     ├─────────────────────────┤ │
│ │ id (PK)             │     │ id (PK)                 │ │
│ │ tenant_id           │     │ tenant_id               │ │
│ │ name                │◄────│ category_id (FK)        │ │
│ │ parent_id (FK)──────┘     │ title                   │ │
│ │ sort_order          │     │ description             │ │
│ └─────────────────────┘     │ level                   │ │
│   self-reference            │ type                    │ │
│                             │ status                  │ │
│                             │ creator_id ─────────────┼─┼──► um_users.id
│                             │ approved_by ────────────┼─┼──► um_users.id
│                             └───────────┬─────────────┘ │
│                                         │ 1:N           │
│                                         ▼               │
│                             ┌─────────────────────────┐ │
│                             │    ts_course_times      │ │
│                             ├─────────────────────────┤ │
│                             │ id (PK)                 │ │
│                             │ tenant_id               │ │
│                             │ program_id (FK)         │ │
│                             │ time_number             │ │
│                             │ start_date              │ │
│                             │ end_date                │ │
│                             │ enrollment_start_date   │ │
│                             │ enrollment_end_date     │ │
│                             │ capacity                │ │
│                             │ status                  │ │
│                             │ created_by ─────────────┼─┼──► um_users.id
│                             └─────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
           ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │ SIS (수강)   │    │ IIS (강사)   │    │  CM (커리큘럼)│
           │ time_key     │    │ time_key     │    │  course_id   │
           └──────────────┘    └──────────────┘    └──────────────┘
```

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

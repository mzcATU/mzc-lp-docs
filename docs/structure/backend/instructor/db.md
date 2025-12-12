# Instructor DB 스키마

> IIS (Instructor Information System) 모듈 데이터베이스 - 강사 배정 관리

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **user_key/time_key 사용** | 다른 모듈(UM, TS)의 ID 참조, 외래키 없이 느슨한 결합 |
| **assigned_at timestamp** | 배정 시점 기록, 이력 관리에 활용 |
| **role (MAIN/SUB)** | 주강사/보조강사 구분, 차수당 여러 강사 배정 가능 |
| **status 관리** | 교체/취소 시 기존 기록 보존, 감사 추적 가능 |

---

## 1. 테이블 구조

### 1.1 iis_instructor_assignments (강사 배정)

```sql
CREATE TABLE iis_instructor_assignments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    user_key        BIGINT NOT NULL,
    time_key        BIGINT NOT NULL,
    assigned_at     DATETIME(6) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'MAIN',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    replaced_at     DATETIME(6),
    assigned_by     BIGINT,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_key),
    INDEX idx_time (time_key),
    INDEX idx_status (status),
    INDEX idx_role (role),
    INDEX idx_assigned_at (assigned_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| user_key | BIGINT | NO | 강사 ID (um_users.id 참조) |
| time_key | BIGINT | NO | 차수 ID (ts_course_times.id 참조) |
| assigned_at | DATETIME(6) | NO | 배정 시점 |
| role | VARCHAR(20) | NO | 역할 (MAIN, SUB) |
| status | VARCHAR(20) | NO | 상태 (ACTIVE, REPLACED, CANCELLED) |
| replaced_at | DATETIME(6) | YES | 교체된 시점 |
| assigned_by | BIGINT | YES | 배정한 OPERATOR ID (um_users.id 참조) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**InstructorRole Enum:**
- `MAIN`: 주강사 (차수당 1명)
- `SUB`: 보조강사 (차수당 N명 가능)

**AssignmentStatus Enum:**
- `ACTIVE`: 활성 (현재 배정됨)
- `REPLACED`: 교체됨 (다른 강사로 변경)
- `CANCELLED`: 취소됨 (배정 해제)

### 1.2 iis_assignment_history (배정 이력)

```sql
CREATE TABLE iis_assignment_history (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id   BIGINT NOT NULL,
    action          VARCHAR(20) NOT NULL,
    old_status      VARCHAR(20),
    new_status      VARCHAR(20),
    reason          VARCHAR(500),
    changed_by      BIGINT NOT NULL,
    changed_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_history_assignment FOREIGN KEY (assignment_id)
        REFERENCES iis_instructor_assignments(id) ON DELETE CASCADE,

    INDEX idx_assignment (assignment_id),
    INDEX idx_changed_at (changed_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| assignment_id | BIGINT | NO | FK → iis_instructor_assignments |
| action | VARCHAR(20) | NO | 액션 (ASSIGN, REPLACE, CANCEL, ROLE_CHANGE) |
| old_status | VARCHAR(20) | YES | 이전 상태 |
| new_status | VARCHAR(20) | YES | 새 상태 |
| reason | VARCHAR(500) | YES | 변경 사유 |
| changed_by | BIGINT | NO | 변경한 OPERATOR ID |
| changed_at | DATETIME(6) | NO | 변경 시점 |

**HistoryAction Enum:**
- `ASSIGN`: 신규 배정
- `REPLACE`: 교체
- `CANCEL`: 취소
- `ROLE_CHANGE`: 역할 변경 (MAIN ↔ SUB)

---

## 2. ER 다이어그램

```
┌─────────────────────┐          ┌─────────────────────┐
│      um_users       │          │   ts_course_times   │
│     (외부 참조)     │          │     (외부 참조)     │
└──────────┬──────────┘          └──────────┬──────────┘
           │                                │
           │ user_key                       │ time_key
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
          ┌─────────────────────────────┐
          │  iis_instructor_assignments │
          ├─────────────────────────────┤
          │ id (PK)                     │
          │ tenant_id                   │
          │ user_key ───────────────────┼──► um_users.id (강사)
          │ time_key ───────────────────┼──► ts_course_times.id
          │ assigned_at                 │
          │ role                        │
          │ status                      │
          │ replaced_at                 │
          │ assigned_by ────────────────┼──► um_users.id (OPERATOR)
          └─────────────┬───────────────┘
                        │ 1:N
                        ▼
          ┌─────────────────────────────┐
          │   iis_assignment_history    │
          ├─────────────────────────────┤
          │ id (PK)                     │
          │ assignment_id (FK)          │
          │ action                      │
          │ old_status                  │
          │ new_status                  │
          │ reason                      │
          │ changed_by ─────────────────┼──► um_users.id (OPERATOR)
          │ changed_at                  │
          └─────────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 iis_instructor_assignments 데이터

```sql
INSERT INTO iis_instructor_assignments (id, tenant_id, user_key, time_key, assigned_at, role, status, replaced_at, assigned_by) VALUES
-- B2C: React 기초 과정 1차 - 홍길동(주강사)
(1, 1, 3, 1, '2025-01-18 10:00:00', 'MAIN', 'ACTIVE', NULL, 2),

-- B2B: 삼성 사내교육 - 개발자A(주강사), 개발자B(보조강사)
(10, 2, 12, 10, '2025-01-15 14:00:00', 'MAIN', 'ACTIVE', NULL, 11),
(11, 2, 13, 10, '2025-01-15 14:30:00', 'SUB', 'ACTIVE', NULL, 11),

-- 교체된 강사 기록
(20, 1, 5, 3, '2025-01-10 09:00:00', 'MAIN', 'REPLACED', '2025-02-01 10:00:00', 2),
(21, 1, 6, 3, '2025-02-01 10:00:00', 'MAIN', 'ACTIVE', NULL, 2);
```

### 3.2 iis_assignment_history 데이터

```sql
INSERT INTO iis_assignment_history (id, assignment_id, action, old_status, new_status, reason, changed_by, changed_at) VALUES
-- 신규 배정
(1, 1, 'ASSIGN', NULL, 'ACTIVE', NULL, 2, '2025-01-18 10:00:00'),
(2, 10, 'ASSIGN', NULL, 'ACTIVE', NULL, 11, '2025-01-15 14:00:00'),
(3, 11, 'ASSIGN', NULL, 'ACTIVE', NULL, 11, '2025-01-15 14:30:00'),

-- 강사 교체
(4, 20, 'ASSIGN', NULL, 'ACTIVE', NULL, 2, '2025-01-10 09:00:00'),
(5, 20, 'REPLACE', 'ACTIVE', 'REPLACED', '기존 강사 휴직으로 인한 교체', 2, '2025-02-01 10:00:00'),
(6, 21, 'ASSIGN', NULL, 'ACTIVE', '강사 교체 배정', 2, '2025-02-01 10:00:00');
```

---

## 4. 주요 쿼리

### 4.1 차수별 강사 목록 조회

```sql
SELECT
    ia.id, ia.user_key, ia.assigned_at, ia.role, ia.status,
    u.name as instructor_name, u.email as instructor_email,
    u.profile_image_url,
    ab.name as assigned_by_name
FROM iis_instructor_assignments ia
JOIN um_users u ON ia.user_key = u.id
LEFT JOIN um_users ab ON ia.assigned_by = ab.id
WHERE ia.tenant_id = :tenantId
  AND ia.time_key = :timeKey
  AND ia.status = 'ACTIVE'
ORDER BY ia.role, ia.assigned_at;
```

### 4.2 강사별 배정 이력 조회

```sql
SELECT
    ia.id, ia.assigned_at, ia.role, ia.status, ia.replaced_at,
    ct.time_number, ct.start_date, ct.end_date, ct.status as time_status,
    p.id as program_id, p.title as program_title,
    (SELECT COUNT(*) FROM sis_enrollments e WHERE e.time_key = ia.time_key) as enrollment_count
FROM iis_instructor_assignments ia
JOIN ts_course_times ct ON ia.time_key = ct.id
JOIN ts_programs p ON ct.program_id = p.id
WHERE ia.tenant_id = :tenantId
  AND ia.user_key = :userId
ORDER BY ia.assigned_at DESC;
```

### 4.3 활성 배정 중인 강사 수 (차수별)

```sql
SELECT
    ia.time_key,
    SUM(CASE WHEN ia.role = 'MAIN' THEN 1 ELSE 0 END) as main_count,
    SUM(CASE WHEN ia.role = 'SUB' THEN 1 ELSE 0 END) as sub_count,
    COUNT(*) as total_count
FROM iis_instructor_assignments ia
WHERE ia.tenant_id = :tenantId
  AND ia.status = 'ACTIVE'
GROUP BY ia.time_key;
```

### 4.4 강사 통계 조회

```sql
SELECT
    ia.user_key,
    COUNT(DISTINCT ia.time_key) as total_assignments,
    SUM(CASE WHEN ia.status = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
    SUM(CASE WHEN ct.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
    (
        SELECT COUNT(DISTINCT e.user_key)
        FROM sis_enrollments e
        WHERE e.time_key IN (
            SELECT ia2.time_key FROM iis_instructor_assignments ia2
            WHERE ia2.user_key = ia.user_key AND ia2.status = 'ACTIVE'
        )
    ) as total_students
FROM iis_instructor_assignments ia
JOIN ts_course_times ct ON ia.time_key = ct.id
WHERE ia.tenant_id = :tenantId
  AND ia.user_key = :userId
GROUP BY ia.user_key;
```

### 4.5 배정 이력 상세 조회

```sql
SELECT
    h.id, h.action, h.old_status, h.new_status, h.reason, h.changed_at,
    u.name as changed_by_name
FROM iis_assignment_history h
JOIN um_users u ON h.changed_by = u.id
WHERE h.assignment_id = :assignmentId
ORDER BY h.changed_at DESC;
```

### 4.6 주강사 미배정 차수 조회

```sql
SELECT
    ct.id as time_id, ct.time_number, ct.start_date, ct.end_date,
    p.id as program_id, p.title as program_title
FROM ts_course_times ct
JOIN ts_programs p ON ct.program_id = p.id
WHERE ct.tenant_id = :tenantId
  AND ct.status IN ('SCHEDULED', 'OPEN')
  AND NOT EXISTS (
      SELECT 1 FROM iis_instructor_assignments ia
      WHERE ia.time_key = ct.id
        AND ia.role = 'MAIN'
        AND ia.status = 'ACTIVE'
  )
ORDER BY ct.start_date;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| iis_instructor_assignments | idx_tenant | 테넌트별 조회 |
| iis_instructor_assignments | idx_user | 강사별 배정 이력 |
| iis_instructor_assignments | idx_time | 차수별 강사 목록 |
| iis_instructor_assignments | idx_status | 상태별 필터링 |
| iis_instructor_assignments | idx_role | 역할별 필터링 |
| iis_instructor_assignments | idx_assigned_at | 배정순 정렬 |
| iis_assignment_history | idx_assignment | 배정별 이력 조회 |
| iis_assignment_history | idx_changed_at | 시간순 정렬 |

---

## 6. 제약 조건

### 6.1 주강사 1명 제한 (애플리케이션)

```java
@Transactional
public InstructorAssignment assignInstructor(Long timeKey, Long userId, InstructorRole role) {
    // 주강사 중복 체크
    if (role == InstructorRole.MAIN) {
        boolean hasMain = assignmentRepository.existsByTimeKeyAndRoleAndStatus(
            timeKey, InstructorRole.MAIN, AssignmentStatus.ACTIVE
        );
        if (hasMain) {
            throw new BusinessException("MAIN_INSTRUCTOR_EXISTS", "이미 주강사가 배정되어 있습니다");
        }
    }

    // 동일 강사 중복 배정 체크
    boolean alreadyAssigned = assignmentRepository.existsByTimeKeyAndUserKeyAndStatus(
        timeKey, userId, AssignmentStatus.ACTIVE
    );
    if (alreadyAssigned) {
        throw new BusinessException("ALREADY_ASSIGNED", "이미 배정된 강사입니다");
    }

    return assignmentRepository.save(InstructorAssignment.create(timeKey, userId, role));
}
```

### 6.2 강사 교체 로직 (애플리케이션)

```java
@Transactional
public ReplaceResult replaceInstructor(Long assignmentId, Long newUserId, String reason) {
    InstructorAssignment oldAssignment = assignmentRepository.findById(assignmentId)
        .orElseThrow(() -> new BusinessException("ASSIGNMENT_NOT_FOUND"));

    if (oldAssignment.getStatus() != AssignmentStatus.ACTIVE) {
        throw new BusinessException("CANNOT_REPLACE_INACTIVE", "활성 배정만 교체 가능합니다");
    }

    // 기존 배정 상태 변경
    oldAssignment.replace();

    // 이력 저장
    historyRepository.save(AssignmentHistory.createReplace(oldAssignment, reason, currentUserId));

    // 새 배정 생성
    InstructorAssignment newAssignment = InstructorAssignment.create(
        oldAssignment.getTimeKey(),
        newUserId,
        oldAssignment.getRole()
    );
    assignmentRepository.save(newAssignment);

    // 신규 배정 이력
    historyRepository.save(AssignmentHistory.createAssign(newAssignment, "강사 교체 배정", currentUserId));

    return new ReplaceResult(oldAssignment, newAssignment);
}
```

### 6.3 배정 취소 조건 (애플리케이션)

```java
@Transactional
public void cancelAssignment(Long assignmentId, String reason) {
    InstructorAssignment assignment = assignmentRepository.findById(assignmentId)
        .orElseThrow(() -> new BusinessException("ASSIGNMENT_NOT_FOUND"));

    if (assignment.getStatus() != AssignmentStatus.ACTIVE) {
        throw new BusinessException("ALREADY_INACTIVE", "이미 비활성 상태입니다");
    }

    // 주강사 취소 시 차수 상태 체크
    if (assignment.getRole() == InstructorRole.MAIN) {
        CourseTime time = courseTimeRepository.findById(assignment.getTimeKey()).orElseThrow();
        if (time.getStatus() == TimeStatus.IN_PROGRESS) {
            throw new BusinessException("CANNOT_CANCEL_MAIN_IN_PROGRESS",
                "진행 중인 차수의 주강사는 취소할 수 없습니다. 교체를 사용하세요.");
        }
    }

    assignment.cancel();
    historyRepository.save(AssignmentHistory.createCancel(assignment, reason, currentUserId));
}
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | IIS API 명세 |
| [user/db.md](../user/db.md) | User DB (user_key 참조) |
| [schedule/db.md](../schedule/db.md) | Time DB (time_key 참조) |
| [student/db.md](../student/db.md) | SIS DB (수강생 관리) |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |

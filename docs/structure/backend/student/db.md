# Student DB 스키마

> SIS (Student Information System) 모듈 데이터베이스 - 수강 관리

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **user_key/time_key 사용** | 다른 모듈(UM, TS)의 ID 참조, 외래키 없이 느슨한 결합 |
| **enrolled_at timestamp** | 수강신청 시점 기록, 선착순 정원 관리에 활용 |
| **type (VOLUNTARY/MANDATORY)** | B2B 필수교육 vs 자발적 수강 구분 |
| **progress_percent 별도 저장** | 매번 계산하지 않고 캐시, 조회 성능 향상 |
| **@Version (낙관적 락)** | 동시 수정 감지, 데이터 무결성 보장 |
| **CourseTime 비관적 락** | Race Condition 방지, 정원 초과/중복 신청 방지 |

---

## 1. 테이블 구조

### 1.1 sis_enrollments (수강 정보)

```sql
CREATE TABLE sis_enrollments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    user_key            BIGINT NOT NULL,
    time_key            BIGINT NOT NULL,
    enrolled_at         DATETIME(6) NOT NULL,
    type                VARCHAR(20) NOT NULL DEFAULT 'VOLUNTARY',
    status              VARCHAR(20) NOT NULL DEFAULT 'ENROLLED',
    progress_percent    INT NOT NULL DEFAULT 0,
    score               INT,
    completed_at        DATETIME(6),
    enrolled_by         BIGINT,
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_user_time (tenant_id, user_key, time_key),
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_key),
    INDEX idx_time (time_key),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_enrolled_at (enrolled_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| user_key | BIGINT | NO | 수강생 ID (um_users.id 참조) |
| time_key | BIGINT | NO | 차수 ID (ts_course_times.id 참조) |
| enrolled_at | DATETIME(6) | NO | 수강신청 시점 |
| type | VARCHAR(20) | NO | 유형 (VOLUNTARY, MANDATORY) |
| status | VARCHAR(20) | NO | 상태 (ENROLLED, COMPLETED, DROPPED, FAILED) |
| progress_percent | INT | NO | 진도율 (0-100) |
| score | INT | YES | 최종 점수 (0-100) |
| completed_at | DATETIME(6) | YES | 수료 시점 |
| enrolled_by | BIGINT | YES | 신청자 ID (본인 또는 OPERATOR) |
| version | BIGINT | NO | @Version 낙관적 락 (동시 수정 감지) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**EnrollmentType Enum:**
- `VOLUNTARY`: 자발적 수강신청
- `MANDATORY`: 필수 교육 (OPERATOR 강제 배정)

**EnrollmentStatus Enum:**
- `ENROLLED`: 수강 중
- `COMPLETED`: 수료
- `DROPPED`: 중도 포기/취소
- `FAILED`: 미이수 (기간 내 미완료)

### 1.2 sis_progress_records (학습 진도 기록)

```sql
CREATE TABLE sis_progress_records (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id   BIGINT NOT NULL,
    item_key        BIGINT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    started_at      DATETIME(6),
    completed_at    DATETIME(6),
    duration_seconds INT DEFAULT 0,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_progress_enrollment FOREIGN KEY (enrollment_id)
        REFERENCES sis_enrollments(id) ON DELETE CASCADE,

    UNIQUE KEY uk_enrollment_item (enrollment_id, item_key),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_item (item_key),
    INDEX idx_status (status)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| enrollment_id | BIGINT | NO | FK → sis_enrollments |
| item_key | BIGINT | NO | 학습 항목 ID (course_item.id 참조) |
| status | VARCHAR(20) | NO | 상태 (NOT_STARTED, IN_PROGRESS, COMPLETED) |
| started_at | DATETIME(6) | YES | 학습 시작 시점 |
| completed_at | DATETIME(6) | YES | 완료 시점 |
| duration_seconds | INT | NO | 학습 시간 (초) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**ProgressStatus Enum:**
- `NOT_STARTED`: 미시작
- `IN_PROGRESS`: 학습 중
- `COMPLETED`: 완료

### 1.3 sis_certificates (수료증)

```sql
CREATE TABLE sis_certificates (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id       BIGINT NOT NULL,
    certificate_number  VARCHAR(50) NOT NULL,
    issued_at           DATETIME(6) NOT NULL,
    expires_at          DATETIME(6),
    pdf_url             VARCHAR(500),
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_cert_enrollment FOREIGN KEY (enrollment_id)
        REFERENCES sis_enrollments(id) ON DELETE CASCADE,

    UNIQUE KEY uk_certificate_number (certificate_number),
    UNIQUE KEY uk_enrollment (enrollment_id),
    INDEX idx_issued_at (issued_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| enrollment_id | BIGINT | NO | FK → sis_enrollments (1:1) |
| certificate_number | VARCHAR(50) | NO | 수료증 번호 (unique) |
| issued_at | DATETIME(6) | NO | 발급일시 |
| expires_at | DATETIME(6) | YES | 만료일시 (자격증 형태일 경우) |
| pdf_url | VARCHAR(500) | YES | PDF 파일 URL |
| created_at | DATETIME(6) | NO | 생성일시 |

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
              ┌─────────────────────────┐
              │     sis_enrollments     │
              ├─────────────────────────┤
              │ id (PK)                 │
              │ tenant_id               │
              │ user_key ───────────────┼──► um_users.id
              │ time_key ───────────────┼──► ts_course_times.id
              │ enrolled_at             │
              │ type                    │
              │ status                  │
              │ progress_percent        │
              │ score                   │
              │ completed_at            │
              │ enrolled_by             │
              └───────────┬─────────────┘
                          │ 1:N
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  sis_progress_records   │    │    sis_certificates     │
├─────────────────────────┤    ├─────────────────────────┤
│ id (PK)                 │    │ id (PK)                 │
│ enrollment_id (FK)      │    │ enrollment_id (FK, UK)  │
│ item_key ───────────────┼─►  │ certificate_number (UK) │
│ status                  │    │ issued_at               │
│ started_at              │    │ expires_at              │
│ completed_at            │    │ pdf_url                 │
│ duration_seconds        │    └─────────────────────────┘
└─────────────────────────┘
          │
          │ item_key
          ▼
┌─────────────────────┐
│    course_item      │
│    (외부 참조)      │
└─────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 sis_enrollments 데이터

```sql
INSERT INTO sis_enrollments (id, tenant_id, user_key, time_key, enrolled_at, type, status, progress_percent, score, completed_at, enrolled_by) VALUES
-- B2C: 홍길동의 자발적 수강신청
(1, 1, 3, 1, '2025-01-20 10:00:00', 'VOLUNTARY', 'ENROLLED', 45, NULL, NULL, 3),
(2, 1, 3, 2, '2025-01-15 09:00:00', 'VOLUNTARY', 'COMPLETED', 100, 92, '2025-02-15 16:00:00', 3),

-- B2B: OPERATOR가 강제 배정한 필수 교육
(10, 2, 12, 10, '2025-01-18 14:00:00', 'MANDATORY', 'ENROLLED', 30, NULL, NULL, 11),
(11, 2, 13, 10, '2025-01-18 14:00:00', 'MANDATORY', 'ENROLLED', 60, NULL, NULL, 11),

-- 중도 포기
(20, 1, 4, 1, '2025-01-22 11:00:00', 'VOLUNTARY', 'DROPPED', 10, NULL, NULL, 4);
```

### 3.2 sis_progress_records 데이터

```sql
INSERT INTO sis_progress_records (id, enrollment_id, item_key, status, started_at, completed_at, duration_seconds) VALUES
-- 홍길동의 React 기초 과정 진도
(1, 1, 3, 'COMPLETED', '2025-01-21 10:00:00', '2025-01-21 10:45:00', 2700),
(2, 1, 4, 'COMPLETED', '2025-01-22 14:00:00', '2025-01-22 15:30:00', 5400),
(3, 1, 6, 'IN_PROGRESS', '2025-01-25 09:00:00', NULL, 1800),
(4, 1, 7, 'NOT_STARTED', NULL, NULL, 0);
```

### 3.3 sis_certificates 데이터

```sql
INSERT INTO sis_certificates (id, enrollment_id, certificate_number, issued_at, expires_at, pdf_url) VALUES
(1, 2, 'CERT-2025-000001', '2025-02-15 16:00:00', NULL, 'https://cdn.example.com/certs/CERT-2025-000001.pdf');
```

---

## 4. 주요 쿼리

### 4.1 차수별 수강생 목록 조회

```sql
SELECT
    e.id, e.user_key, e.enrolled_at, e.type, e.status, e.progress_percent,
    u.name as user_name, u.email as user_email,
    o.name as organization_name
FROM sis_enrollments e
JOIN um_users u ON e.user_key = u.id
LEFT JOIN um_organizations o ON u.organization_id = o.id
WHERE e.tenant_id = :tenantId
  AND e.time_key = :timeKey
  AND e.status = :status
ORDER BY e.enrolled_at DESC;
```

### 4.2 사용자별 수강 이력 조회

```sql
SELECT
    e.id, e.enrolled_at, e.type, e.status, e.progress_percent, e.score, e.completed_at,
    ct.time_number, ct.start_date, ct.end_date,
    p.id as program_id, p.title as program_title
FROM sis_enrollments e
JOIN ts_course_times ct ON e.time_key = ct.id
JOIN ts_programs p ON ct.program_id = p.id
WHERE e.tenant_id = :tenantId
  AND e.user_key = :userId
ORDER BY e.enrolled_at DESC;
```

### 4.3 차수별 수강 통계

```sql
SELECT
    e.time_key,
    COUNT(*) as total_enrollments,
    SUM(CASE WHEN e.status = 'ENROLLED' THEN 1 ELSE 0 END) as enrolled_count,
    SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN e.status = 'DROPPED' THEN 1 ELSE 0 END) as dropped_count,
    SUM(CASE WHEN e.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
    SUM(CASE WHEN e.type = 'VOLUNTARY' THEN 1 ELSE 0 END) as voluntary_count,
    SUM(CASE WHEN e.type = 'MANDATORY' THEN 1 ELSE 0 END) as mandatory_count,
    AVG(e.progress_percent) as avg_progress,
    AVG(CASE WHEN e.status = 'COMPLETED' THEN e.score END) as avg_score
FROM sis_enrollments e
WHERE e.tenant_id = :tenantId
  AND e.time_key = :timeKey
GROUP BY e.time_key;
```

### 4.4 진도율 계산 및 업데이트

```sql
-- 진도율 계산 (완료된 항목 / 전체 항목)
SELECT
    e.id as enrollment_id,
    COUNT(pr.id) as total_items,
    SUM(CASE WHEN pr.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_items,
    ROUND(
        SUM(CASE WHEN pr.status = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(pr.id)
    ) as progress_percent
FROM sis_enrollments e
JOIN sis_progress_records pr ON e.id = pr.enrollment_id
WHERE e.id = :enrollmentId
GROUP BY e.id;

-- 진도율 업데이트
UPDATE sis_enrollments
SET progress_percent = :progressPercent,
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = :enrollmentId;
```

### 4.5 수료 대상자 조회 (진도율 100% + 점수 기준)

```sql
SELECT
    e.id, e.user_key, e.progress_percent, e.score
FROM sis_enrollments e
WHERE e.tenant_id = :tenantId
  AND e.time_key = :timeKey
  AND e.status = 'ENROLLED'
  AND e.progress_percent >= 100
  AND (e.score IS NULL OR e.score >= :passingScore);
```

### 4.6 학습 시간 집계

```sql
SELECT
    e.user_key,
    SUM(pr.duration_seconds) as total_seconds,
    ROUND(SUM(pr.duration_seconds) / 3600.0, 1) as total_hours
FROM sis_enrollments e
JOIN sis_progress_records pr ON e.id = pr.enrollment_id
WHERE e.tenant_id = :tenantId
  AND e.user_key = :userId
GROUP BY e.user_key;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| sis_enrollments | uk_user_time | 중복 수강 방지 |
| sis_enrollments | idx_tenant | 테넌트별 조회 |
| sis_enrollments | idx_user | 사용자별 수강 이력 |
| sis_enrollments | idx_time | 차수별 수강생 목록 |
| sis_enrollments | idx_status | 상태별 필터링 |
| sis_enrollments | idx_type | 유형별 필터링 |
| sis_enrollments | idx_enrolled_at | 신청순 정렬 (선착순) |
| sis_progress_records | uk_enrollment_item | 중복 진도 방지 |
| sis_progress_records | idx_enrollment | 수강별 진도 조회 |
| sis_certificates | uk_certificate_number | 수료증 번호 유니크 |
| sis_certificates | uk_enrollment | 1:1 관계 보장 |

---

## 6. 제약 조건

### 6.1 Race Condition 방지 패턴

수강 신청 시 "조회 → 판단 → INSERT" 패턴의 Race Condition을 방지:

```java
/**
 * 수강 신청 - Race Condition 방지
 *
 * 문제 시나리오 (비관적 락 없을 때):
 * 1. 사용자 A: 정원 확인 (49/50) → OK
 * 2. 사용자 B: 정원 확인 (49/50) → OK (동시)
 * 3. 사용자 A: INSERT → 50/50
 * 4. 사용자 B: INSERT → 51/50 (정원 초과!)
 *
 * 해결: CourseTime에 비관적 락을 걸어 직렬화
 */
@Transactional
public EnrollmentResponse enroll(Long courseTimeId, EnrollRequest request, Long userId) {
    Long tenantId = TenantContext.getCurrentTenantId();

    // [핵심] 비관적 락으로 차수 조회 - 모든 검증을 락 상태에서 수행
    CourseTime courseTime = courseTimeRepository.findByIdWithLock(courseTimeId)
            .orElseThrow(() -> new CourseTimeNotFoundException(courseTimeId));

    // 정원 체크 (락 상태에서)
    long currentCount = enrollmentRepository.countByTimeKeyAndTenantIdAndStatusNot(
            courseTimeId, tenantId, EnrollmentStatus.DROPPED);
    if (courseTime.getCapacity() != null && currentCount >= courseTime.getCapacity()) {
        throw new CapacityExceededException(courseTimeId, courseTime.getCapacity());
    }

    // 중복 수강 체크 (락 상태에서)
    if (enrollmentRepository.existsByTimeKeyAndUserKeyAndTenantIdAndStatusNot(
            courseTimeId, userId, tenantId, EnrollmentStatus.DROPPED)) {
        throw new AlreadyEnrolledException(userId, courseTimeId);
    }

    Enrollment enrollment = Enrollment.create(
            tenantId, userId, courseTimeId, EnrollmentType.VOLUNTARY, userId);
    return EnrollmentResponse.from(enrollmentRepository.save(enrollment));
}
```

**Repository 메서드:**

```java
public interface CourseTimeRepository extends JpaRepository<CourseTime, Long> {
    /**
     * 비관적 락으로 CourseTime 조회
     * 수강 신청 시 정원/중복 체크 직렬화에 사용
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ct FROM CourseTime ct WHERE ct.id = :id")
    Optional<CourseTime> findByIdWithLock(@Param("id") Long id);
}
```

**주의사항:**
- 비관적 락은 성능 영향이 있으므로 동시성이 높은 경우에만 사용
- 락 타임아웃 설정 권장: `@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))`
- 데드락 방지를 위해 락 순서 일관성 유지

### 6.2 진도율 범위 검증

```sql
-- 트리거로 진도율 0-100 범위 보장
DELIMITER //
CREATE TRIGGER check_progress_before_update
BEFORE UPDATE ON sis_enrollments
FOR EACH ROW
BEGIN
    IF NEW.progress_percent < 0 OR NEW.progress_percent > 100 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Progress percent must be between 0 and 100';
    END IF;
END//
DELIMITER ;
```

### 6.3 수료증 발급 조건 (애플리케이션)

```java
public Certificate issueCertificate(Long enrollmentId) {
    Enrollment enrollment = enrollmentRepository.findById(enrollmentId).orElseThrow();

    // 수료 상태 체크
    if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
        throw new BusinessException("NOT_COMPLETED", "수료 상태가 아닙니다");
    }

    // 이미 발급된 수료증 체크
    if (certificateRepository.existsByEnrollmentId(enrollmentId)) {
        throw new BusinessException("ALREADY_ISSUED", "이미 수료증이 발급되었습니다");
    }

    String certNumber = generateCertificateNumber();
    return certificateRepository.save(Certificate.create(enrollment, certNumber));
}
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | SIS API 명세 |
| [user/db.md](../user/db.md) | User DB (user_key 참조) |
| [schedule/db.md](../schedule/db.md) | Time DB (time_key 참조) |
| [course/db.md](../course/db.md) | 커리큘럼 DB (item_key 참조) |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |

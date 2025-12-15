# Backend SIS 모듈 개발 로그 - Phase 1

> SIS 모듈 기반 구조 구현 (Entity, Repository, Exception, ErrorCode)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#49](https://github.com/mzcATU/mzc-lp-backend/issues/49) |
| **담당 모듈** | SIS (Student Information System - 수강 관리) |
| **브랜치** | `feat/sis-entity` |

---

## 1. 구현 개요

수강(Enrollment) 관리를 위한 기반 구조 구현:

| 구성요소 | 내용 |
|----------|------|
| Entity | Enrollment (수강 핵심 엔티티) |
| Enum | EnrollmentType, EnrollmentStatus |
| Repository | EnrollmentRepository (비관적 락 포함) |
| Exception | 5개 커스텀 예외 클래스 |
| ErrorCode | SIS001 ~ SIS005 |

---

## 2. 신규 생성 파일 (8개)

### Enum (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentType.java | `constant/` | 수강 유형 (VOLUNTARY, MANDATORY) |
| EnrollmentStatus.java | `constant/` | 수강 상태 (ENROLLED, COMPLETED, DROPPED, FAILED) |

### Entity

| 파일 | 경로 | 설명 |
|------|------|------|
| Enrollment.java | `entity/` | 수강 엔티티 (TenantEntity 상속, 비즈니스 로직 포함) |

### Repository

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentRepository.java | `repository/` | JPA Repository (비관적 락 쿼리 메서드 포함) |

### Exception (5개)

| 파일 | 경로 | ErrorCode |
|------|------|-----------|
| EnrollmentNotFoundException.java | `exception/` | SIS001 |
| AlreadyEnrolledException.java | `exception/` | SIS002 |
| CannotCancelCompletedException.java | `exception/` | SIS003 |
| EnrollmentPeriodClosedException.java | `exception/` | SIS004 |
| InvalidProgressValueException.java | `exception/` | SIS005 |

---

## 3. 수정 파일 (1개)

### ErrorCode.java

```java
// 추가된 코드 (SIS 모듈)
// Enrollment (SIS)
ENROLLMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "SIS001", "Enrollment not found"),
ALREADY_ENROLLED(HttpStatus.CONFLICT, "SIS002", "Already enrolled in this course"),
CANNOT_CANCEL_COMPLETED(HttpStatus.BAD_REQUEST, "SIS003", "Cannot cancel completed enrollment"),
ENROLLMENT_PERIOD_CLOSED(HttpStatus.BAD_REQUEST, "SIS004", "Enrollment period is closed"),
INVALID_PROGRESS_VALUE(HttpStatus.BAD_REQUEST, "SIS005", "Progress value must be between 0 and 100"),
```

---

## 4. 파일 구조

```
domain/student/
├── constant/
│   ├── EnrollmentType.java      ✅ 신규
│   └── EnrollmentStatus.java    ✅ 신규
├── entity/
│   └── Enrollment.java          ✅ 신규
├── repository/
│   └── EnrollmentRepository.java ✅ 신규
└── exception/
    ├── EnrollmentNotFoundException.java      ✅ 신규
    ├── AlreadyEnrolledException.java         ✅ 신규
    ├── CannotCancelCompletedException.java   ✅ 신규
    ├── EnrollmentPeriodClosedException.java  ✅ 신규
    └── InvalidProgressValueException.java    ✅ 신규
```

---

## 5. Enrollment 엔티티 주요 기능

### 테이블 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK, Auto Increment |
| tenant_id | BIGINT | 테넌트 ID (멀티테넌시) |
| user_id | BIGINT | 사용자 ID |
| course_time_id | BIGINT | 차수 ID (TS 모듈 연동) |
| enrolled_at | DATETIME | 수강 신청 일시 |
| enrolled_by | BIGINT | 신청 처리자 ID (필수배정 시) |
| type | ENUM | 수강 유형 (VOLUNTARY, MANDATORY) |
| status | ENUM | 수강 상태 |
| progress_percent | INT | 진도율 (0-100) |
| score | INT | 점수 (nullable) |
| completed_at | DATETIME | 수료 일시 (nullable) |

### Unique Constraint

```sql
UNIQUE KEY uk_sis_enrollment (tenant_id, user_id, course_time_id)
```
> 동일 사용자가 동일 차수에 중복 수강신청 방지

### 인덱스

| 인덱스명 | 컬럼 | 용도 |
|----------|------|------|
| idx_sis_enrollment_user | (tenant_id, user_id) | 사용자별 수강 목록 조회 |
| idx_sis_enrollment_course_time | (tenant_id, course_time_id) | 차수별 수강생 목록 조회 |
| idx_sis_enrollment_status | (tenant_id, status) | 상태별 수강 목록 조회 |

### 정적 팩토리 메서드

| 메서드 | 설명 |
|--------|------|
| `createVoluntary(userId, courseTimeId)` | 자발적 수강신청 생성 |
| `createMandatory(userId, courseTimeId, enrolledBy)` | 필수교육 배정 생성 |

### 비즈니스 메서드

| 메서드 | 설명 |
|--------|------|
| `updateProgress(percent)` | 진도율 업데이트 (0-100 검증) |
| `complete(score)` | 수료 처리 (상태 변경, 수료일시 기록) |
| `drop()` | 중도 포기/취소 처리 |
| `fail()` | 미이수 처리 |
| `updateStatus(status)` | 상태 변경 |

### 검증 메서드

| 메서드 | 설명 |
|--------|------|
| `isEnrolled()` | 수강 중 여부 |
| `isCompleted()` | 수료 여부 |
| `isDropped()` | 중도 포기 여부 |
| `isFailed()` | 미이수 여부 |
| `canCancel()` | 취소 가능 여부 (수강 중일 때만) |
| `isVoluntary()` | 자발적 수강 여부 |
| `isMandatory()` | 필수교육 여부 |

---

## 6. Repository 주요 메서드

### 비관적 락 조회

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT e FROM Enrollment e WHERE e.id = :id")
Optional<Enrollment> findByIdWithLock(@Param("id") Long id);
```
> 동시 수강신청 처리 시 정합성 보장

### 중복 체크

```java
boolean existsByUserIdAndCourseTimeIdAndTenantId(
    Long userId, Long courseTimeId, Long tenantId
);
```

### 차수별 수강생 조회

```java
Page<Enrollment> findByCourseTimeIdAndTenantId(
    Long courseTimeId, Long tenantId, Pageable pageable
);
```

### 활성 수강생 수 카운트

```java
@Query("SELECT COUNT(e) FROM Enrollment e WHERE e.courseTimeId = :courseTimeId AND e.tenantId = :tenantId AND e.status = 'ENROLLED'")
long countActiveByCourseTimeId(@Param("courseTimeId") Long courseTimeId, @Param("tenantId") Long tenantId);
```

---

## 7. TS 모듈 연동

### 연동 방식

| 항목 | 내용 |
|------|------|
| 연결 필드 | `courseTimeId` (FK 없이 키 참조) |
| 연동 테이블 | `course_times` |
| 정원 확인 | CourseTime.`hasAvailableSeats()` |
| 신청 가능 여부 | CourseTime.`canEnroll()` |
| 인원 카운트 | CourseTime.`incrementEnrollment()` / `decrementEnrollment()` |

### 느슨한 결합

- FK 제약조건 없이 키 참조만 사용
- 모듈 간 직접 의존성 최소화
- 서비스 레이어에서 검증 로직 처리

---

## 8. DB 테스트 결과

### 테이블 생성 확인

```sql
SHOW TABLES LIKE 'sis%';
-- sis_enrollments 테이블 생성 확인
```

### 컬럼 확인

```sql
DESC sis_enrollments;
-- 모든 컬럼 정상 생성 확인
```

### 테스트 데이터 검증

| 항목 | 결과 |
|------|------|
| INSERT (VOLUNTARY) | 성공 |
| INSERT (MANDATORY) | 성공 |
| 중복 INSERT | 실패 (uk_sis_enrollment 제약조건) |
| Enum 저장 | 문자열로 정상 저장 |
| 인덱스 생성 | 3개 인덱스 정상 생성 |

---

## 9. 컨벤션 준수 체크

### Entity (02-ENTITY-CONVENTIONS)

- [x] Setter 미사용 → 비즈니스 메서드 사용
- [x] `@Enumerated(EnumType.STRING)` 적용
- [x] 정적 팩토리 메서드 사용
- [x] TenantEntity 상속 (멀티테넌시 지원)
- [x] BaseTimeEntity 상속 (createdAt, updatedAt 자동 관리)

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] 비관적 락 메서드 `@Lock(LockModeType.PESSIMISTIC_WRITE)`
- [x] 페이징 지원 메서드 포함

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] `BusinessException` 상속
- [x] `ErrorCode` 사용
- [x] 상세 메시지 지원 생성자

---

## 10. 다음 작업 (Phase 2)

### 이슈 #50: SIS 수강 CRUD API 구현

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/ts/course-times/{id}/enrollments` | 수강 신청 |
| GET | `/api/ts/course-times/{id}/enrollments` | 차수별 수강생 목록 |
| GET | `/api/enrollments/me` | 내 수강 목록 |
| GET | `/api/enrollments/{id}` | 수강 상세 |
| PATCH | `/api/enrollments/{id}/progress` | 진도율 업데이트 |
| DELETE | `/api/enrollments/{id}` | 수강 취소 |
| POST | `/api/enrollments/{id}/complete` | 수료 처리 |

**필요 작업:**
- EnrollmentService 인터페이스/구현체 작성
- EnrollmentController 작성
- DTO 작성 (Request/Response)
- 권한 검증 적용 (`@PreAuthorize`)
- Controller 테스트 작성

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 1 구현 완료 (Entity, Repository, Exception 5개, ErrorCode 5개) |

---

*최종 업데이트: 2025-12-15*

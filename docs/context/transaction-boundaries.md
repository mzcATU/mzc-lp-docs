# 트랜잭션 바운더리 (Transaction Boundaries)

> Race Condition 방지, 동시성 제어, 데이터 무결성 보장

---

## 0. 핵심 개념 (가장 중요)

### 0.1 트랜잭션 바운더리 정의

```
"한 정보가 바뀌었을 때, 작업 단위 내에서 어디까지 연관되어야 하는지 결정하는 것"
```

**핵심:** 트랜잭션 경계는 **업무적 결정**이다. 코드가 아니라 비즈니스 요구사항에서 출발한다.

### 0.2 업무적 결정의 중요성

```
예시: 게시물 삭제 시 댓글 처리

┌────────────────────────────────────────────────────────────────────┐
│ 옵션 A: 게시물 삭제 → 댓글도 함께 삭제                              │
│ 옵션 B: 게시물 삭제 → 댓글은 "삭제된 게시물" 표시 후 유지           │
│ 옵션 C: 게시물 삭제 불가 (댓글이 있으면)                            │
└────────────────────────────────────────────────────────────────────┘

→ 이 결정은 개발자가 아니라 기획자/PO에게 질문하고 결정받아야 한다
→ 트랜잭션 단위를 묶는 것은 코드지만, 이유는 업무적 결정
```

### 0.3 비즈니스 설계 시 포함할 내용

| 항목 | 질문 예시 |
|------|----------|
| **삭제 정책** | 부모 삭제 시 자식 처리 방법은? |
| **수정 범위** | A 변경 시 B도 자동 변경되어야 하는가? |
| **정합성 범위** | 실패 시 어디까지 롤백해야 하는가? |
| **동시성 정책** | 동시 작업 시 누구의 작업이 우선인가? |

---

## 1. Race Condition 유형

### 1.1 "조회 → 판단 → INSERT" 패턴

가장 흔한 Race Condition 유형. 두 트랜잭션이 동시에 조회하면 둘 다 "없음"으로 판단하여 중복 INSERT 발생.

```
┌─────────────────────────────────────────────────────────────┐
│ Transaction A                  Transaction B                │
├─────────────────────────────────────────────────────────────┤
│ 1. SELECT (결과: 없음)                                       │
│                               2. SELECT (결과: 없음)         │
│ 3. 판단: 생성 가능                                           │
│                               4. 판단: 생성 가능             │
│ 5. INSERT                                                    │
│                               6. INSERT (중복!)              │
└─────────────────────────────────────────────────────────────┘
```

**발생 사례:**
- 수강 신청 중복
- 강사 배정 중복
- 주강사 이중 배정
- 동일 콘텐츠 중복 업로드

### 1.2 "조회 → 수정 → UPDATE" 패턴 (Lost Update)

두 트랜잭션이 동시에 같은 데이터를 수정하면 나중 트랜잭션이 이전 수정을 덮어씀.

```
┌─────────────────────────────────────────────────────────────┐
│ Transaction A                  Transaction B                │
├─────────────────────────────────────────────────────────────┤
│ 1. SELECT (정원: 30)                                        │
│                               2. SELECT (정원: 30)          │
│ 3. 정원 +1 = 31                                             │
│                               4. 정원 +1 = 31               │
│ 5. UPDATE (31)                                              │
│                               6. UPDATE (31) - 32가 아닌 31! │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Edge Case: "조회 → 판단 → INSERT 간극" (개발자가 놓치기 쉬움)

```
예시: 댓글 100개 제한

[시나리오]
- 게시물당 댓글 최대 100개 제한
- 현재 99개 댓글 존재

┌────────────────────────────────────────────────────────────────────┐
│ 사용자 A                        사용자 B                            │
├────────────────────────────────────────────────────────────────────┤
│ 1. 댓글 수 조회: 99개                                               │
│                                 2. 댓글 수 조회: 99개               │
│ 3. 99 < 100 → 등록 가능                                            │
│                                 4. 99 < 100 → 등록 가능 (동시)      │
│ 5. INSERT (100개)                                                  │
│                                 6. INSERT (101개!) ← 제한 초과     │
└────────────────────────────────────────────────────────────────────┘

[원인]
- "조회"와 "INSERT" 사이에 시간 간극 존재
- 시스템 지연, 네트워크 지연으로 동시 요청 발생
- 조회 시점의 데이터와 INSERT 시점의 데이터가 다름

[해결]
- 비관적 락: 게시물에 락 → 댓글 수 체크 → INSERT
- CHECK 제약: DB 레벨에서 100개 초과 시 실패 처리
```

**왜 놓치는가:**
1. 개발/테스트 환경에서 동시 요청 재현이 어려움
2. "조회 → 판단" 로직이 너무 자연스러워 보임
3. 운영 환경에서만 부하가 발생

---

## 2. 해결 전략

### 2.1 전략 선택 기준

| 전략 | 적용 상황 | 장점 | 단점 |
|------|----------|------|------|
| **비관적 락** | 충돌 빈번, 짧은 트랜잭션 | 확실한 보장 | 성능 저하 가능 |
| **낙관적 락** | 충돌 드묾, 긴 트랜잭션 | 성능 좋음 | 재시도 필요 |
| **Unique Index** | 중복 방지 (정적 조건) | DB 레벨 보장 | 조건부 불가 |
| **Partial Unique Index** | 중복 방지 (동적 조건) | 조건부 가능 | PostgreSQL 전용 |

### 2.2 결정 플로우

```
중복 INSERT 방지?
├─ Yes → 조건이 고정됨? (status 관계없이 항상 적용)
│        ├─ Yes → UNIQUE INDEX
│        └─ No → Partial Unique Index + 비관적 락
└─ No → 동시 수정 감지 필요?
         ├─ Yes → @Version (낙관적 락)
         └─ No → 정원 같은 카운터?
                  ├─ Yes → 비관적 락 (INCREMENT 로직)
                  └─ No → 기본 처리
```

---

## 3. 비관적 락 (Pessimistic Lock)

### 3.1 기본 패턴

```java
public interface CourseTimeRepository extends JpaRepository<CourseTime, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ct FROM CourseTime ct WHERE ct.id = :id")
    Optional<CourseTime> findByIdWithLock(@Param("id") Long id);
}
```

### 3.2 수강 신청 Race Condition 해결

**문제 상황:**
- 동시에 100명이 수강 신청 → 정원 30명인데 100명 등록됨
- 동일 사용자가 동시에 2번 클릭 → 중복 수강 생성

**해결 코드:**

```java
@Override
@Transactional
public EnrollmentDetailResponse enroll(Long courseTimeId, Long userId) {
    Long tenantId = TenantContext.getCurrentTenantId();

    // [핵심] 비관적 락으로 차수 조회 - 모든 검증을 락 상태에서 수행
    CourseTime courseTime = courseTimeRepository.findByIdWithLock(courseTimeId)
            .orElseThrow(() -> new CourseTimeNotFoundException(courseTimeId));

    // 테넌트 검증 (락 상태)
    if (!courseTime.getTenantId().equals(tenantId)) {
        throw new CourseTimeNotFoundException(courseTimeId);
    }

    // 수강 신청 가능 여부 체크 (락 상태)
    if (!courseTime.canEnroll()) {
        throw new EnrollmentPeriodClosedException(courseTimeId);
    }

    // 중복 수강 체크 (락 상태) - 락 덕분에 다른 트랜잭션은 대기
    if (enrollmentRepository.existsByUserIdAndCourseTimeIdAndTenantId(
            userId, courseTimeId, tenantId)) {
        throw new AlreadyEnrolledException(userId, courseTimeId);
    }

    // 정원 체크 및 증가 (락 상태)
    if (!courseTime.hasUnlimitedCapacity() && !courseTime.hasAvailableSeats()) {
        throw new EnrollmentPeriodClosedException(courseTimeId);
    }
    courseTime.incrementEnrollment();

    // 수강 생성
    Enrollment enrollment = Enrollment.createVoluntary(userId, courseTimeId);
    return EnrollmentDetailResponse.from(enrollmentRepository.save(enrollment));
}
```

**핵심 원칙:**
1. 락을 먼저 획득
2. 모든 검증을 락 상태에서 수행
3. INSERT/UPDATE 후 트랜잭션 커밋

### 3.3 강사 배정 Race Condition 해결

**문제 상황:**
- 동일 강사가 같은 차수에 2번 배정됨
- 주강사가 2명 배정됨

**해결 코드:**

```java
@Override
@Transactional
public InstructorAssignmentResponse assignInstructor(
        Long timeId, AssignInstructorRequest request, Long operatorId) {
    Long tenantId = TenantContext.getCurrentTenantId();

    // [핵심] CourseTime을 락 대상으로 사용하여 동시 배정 직렬화
    courseTimeRepository.findByIdWithLock(timeId)
            .orElseThrow(() -> new IllegalArgumentException("CourseTime not found: " + timeId));

    // 중복 배정 체크 (락 상태)
    if (assignmentRepository.existsByTimeKeyAndUserKeyAndTenantIdAndStatus(
            timeId, request.userId(), tenantId, AssignmentStatus.ACTIVE)) {
        throw new InstructorAlreadyAssignedException(request.userId(), timeId);
    }

    // MAIN 역할인 경우 기존 MAIN 강사 체크 (락 상태)
    if (request.role() == InstructorRole.MAIN) {
        assignmentRepository.findActiveByTimeKeyAndRole(timeId, tenantId, InstructorRole.MAIN)
                .ifPresent(existing -> {
                    throw new MainInstructorAlreadyExistsException(timeId);
                });
    }

    InstructorAssignment assignment = InstructorAssignment.create(
            request.userId(), timeId, request.role(), operatorId);
    return InstructorAssignmentResponse.from(assignmentRepository.save(assignment));
}
```

**락 대상 선택:**
- InstructorAssignment 자체는 없어서 락 불가 → 상위 엔티티 CourseTime을 락
- 같은 차수에 대한 모든 배정이 직렬화됨

---

## 4. 낙관적 락 (Optimistic Lock)

### 4.1 @Version 사용

```java
@Entity
public class CourseTime extends TenantEntity {

    @Version
    private Long version;

    // 필드들...
}
```

### 4.2 적용 대상 엔티티

동시 수정 감지가 필요한 엔티티:

| 엔티티 | 적용 이유 |
|--------|----------|
| `CourseTime` | 정원, 상태 동시 수정 |
| `Enrollment` | 상태 변경 동시 요청 |
| `InstructorAssignment` | 역할 변경, 상태 변경 |
| `Content` | 콘텐츠 수정 충돌 감지 |
| `Course` | 강의 정보 수정 충돌 |

### 4.3 충돌 처리

```java
@Service
public class CourseTimeService {

    @Transactional
    @Retryable(
        value = OptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 100)
    )
    public void updateCourseTime(Long id, CourseTimeUpdateRequest request) {
        CourseTime courseTime = courseTimeRepository.findById(id)
                .orElseThrow(() -> new CourseTimeNotFoundException(id));

        courseTime.update(request);
        // 저장 시 version 불일치면 OptimisticLockingFailureException 발생
    }
}
```

---

## 5. Unique Index 전략

### 5.1 일반 UNIQUE INDEX

```sql
-- 동일 사용자가 같은 차수에 2번 신청 방지
CREATE UNIQUE INDEX uk_sis_user_time_tenant
ON sis_enrollments (user_id, course_time_id, tenant_id);
```

**한계:** status가 CANCELLED인 경우에도 unique 적용됨 → 재신청 불가

### 5.2 Partial Unique Index (PostgreSQL)

상태가 ACTIVE인 경우에만 unique 적용:

```sql
-- 동일 강사 중복 배정 방지 (ACTIVE 상태만)
CREATE UNIQUE INDEX uk_iis_active_assignment
ON iis_instructor_assignments (time_key, user_key, tenant_id)
WHERE status = 'ACTIVE';

-- MAIN 강사 중복 방지 (ACTIVE 상태의 MAIN만)
CREATE UNIQUE INDEX uk_iis_active_main
ON iis_instructor_assignments (time_key, tenant_id)
WHERE role = 'MAIN' AND status = 'ACTIVE';
```

**장점:**
- DB 레벨 보장 (애플리케이션 버그 있어도 안전)
- 비관적 락과 함께 이중 보호

### 5.3 Flyway 마이그레이션

```sql
-- V20__add_partial_unique_indexes.sql

-- 강사 배정 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS uk_iis_active_assignment
ON iis_instructor_assignments (time_key, user_key, tenant_id)
WHERE status = 'ACTIVE';

-- 주강사 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS uk_iis_active_main
ON iis_instructor_assignments (time_key, tenant_id)
WHERE role = 'MAIN' AND status = 'ACTIVE';

-- 수강 신청 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS uk_sis_active_enrollment
ON sis_enrollments (user_id, course_time_id, tenant_id)
WHERE status IN ('ENROLLED', 'PENDING');
```

---

## 6. 트랜잭션 범위 설계

### 6.1 서비스 메서드 단위 원칙

```java
@Service
@Transactional(readOnly = true)  // 기본: 읽기 전용
public class EnrollmentService {

    @Transactional  // 쓰기 작업만 오버라이드
    public EnrollmentDetailResponse enroll(Long timeId, Long userId) {
        // 단일 트랜잭션에서 처리
    }

    public List<EnrollmentResponse> getMyEnrollments(Long userId) {
        // readOnly=true 적용
    }
}
```

### 6.2 트랜잭션 전파 주의

```java
// ❌ Bad: 내부 호출은 @Transactional 무시됨
@Service
public class BadService {

    @Transactional
    public void outer() {
        inner();  // 프록시 우회 → @Transactional 무효
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void inner() { }
}

// ✅ Good: 별도 서비스로 분리
@Service
@RequiredArgsConstructor
public class GoodService {
    private final InnerService innerService;

    @Transactional
    public void outer() {
        innerService.inner();  // 프록시 통과
    }
}
```

### 6.3 롱 트랜잭션 분리

```java
// ❌ Bad: 외부 API 호출이 트랜잭션 안에 있음
@Transactional
public void badProcess() {
    save();
    externalApiCall();  // 3초 소요 → DB 커넥션 점유
    updateStatus();
}

// ✅ Good: 외부 호출 분리
public void goodProcess() {
    saveInTransaction();
    externalApiCall();  // 트랜잭션 밖
    updateStatusInTransaction();
}

@Transactional
public void saveInTransaction() { save(); }

@Transactional
public void updateStatusInTransaction() { updateStatus(); }
```

---

## 7. 체크리스트

### 신규 기능 개발 시

- [ ] "조회 → 판단 → INSERT" 패턴 있는가?
  - Yes → 비관적 락 또는 Partial Unique Index 적용
- [ ] 동시 수정 가능한 엔티티인가?
  - Yes → @Version 추가
- [ ] 락 대상이 명확한가?
  - 없으면 → 상위 엔티티 락 고려
- [ ] 트랜잭션 범위가 적절한가?
  - 외부 호출, 파일 처리 등은 트랜잭션 밖으로

### 코드 리뷰 시

- [ ] 락 획득 후 검증하는가? (락 전 검증은 의미 없음)
- [ ] 낙관적 락 충돌 시 재시도 로직 있는가?
- [ ] 데드락 가능성 있는가? (락 순서 일관성)
- [ ] 불필요하게 긴 트랜잭션은 아닌가?

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [04-SERVICE-CONVENTIONS.md](../conventions/04-SERVICE-CONVENTIONS.md) | 서비스 레이어 컨벤션 |
| [05-REPOSITORY-CONVENTIONS.md](../conventions/05-REPOSITORY-CONVENTIONS.md) | 레포지토리 컨벤션 |
| [06-ENTITY-CONVENTIONS.md](../conventions/06-ENTITY-CONVENTIONS.md) | 엔티티 설계 컨벤션 |

# 동시성/격리성 문제 수정 계획

> OLTP ACID 원칙 준수를 위한 개선 계획

---

## 1. 현재 문제 요약

| 원칙 | 상태 | 문제점 |
|------|------|--------|
| **Atomicity** | ✅ OK | - |
| **Consistency** | ⚠️ 위반 | forceEnroll Lock 누락, Check-Then-Act Race Condition |
| **Isolation** | ⚠️ 위반 | @Version 미사용, Lost Update 가능 |
| **Durability** | ✅ OK | - |

---

## 2. 수정 대상

### 2.1 긴급 (Critical) - 데이터 불일치 발생

| 대상 | 파일 | 문제 | 영향도 |
|------|------|------|--------|
| forceEnroll | `EnrollmentServiceImpl.java` | Lock 없이 카운터 증가 | 정원 데이터 불일치 |
| InstructorAssignment | `InstructorAssignment.java` | 중복 체크 Race Condition | MAIN 강사 중복 배정 |

### 2.2 높음 (High) - Check-Then-Act Race Condition

> `exists()` 체크 후 `save()` 사이에 다른 트랜잭션이 끼어들 수 있음

| # | 대상 | 파일 | 문제 패턴 | 영향 |
|---|------|------|----------|------|
| 1 | **User 회원가입** | `AuthServiceImpl.java:43` | `existsByEmail()` → `save()` | 동일 이메일 중복 가입 |
| 2 | **UserCourseRole** | `UserServiceImpl.java:170,201,206` | `existsBy...Role()` → `save()` | 동일 역할 중복 부여 |
| 3 | **Tenant 생성** | `TenantServiceImpl.java:137,143,149` | `existsByCode/Subdomain()` → `save()` | 중복 테넌트 생성 |
| 4 | **SnapshotRelation** | `SnapshotRelationServiceImpl.java:87` | `existsByToItemId()` → `save()` | 학습순서 중복/꼬임 |
| 5 | **ContentFolder** | `ContentFolderServiceImpl.java:145,147` | `existsBy...FolderName()` → `save()` | 동일명 폴더 중복 |
| 6 | **Enrollment** | `EnrollmentServiceImpl.java:60,95` | `existsBy...CourseTimeId()` → `save()` | 동일 수강 중복 |

### 2.3 권장 (Recommended) - Lost Update 방지

| 대상 | 파일 | 문제 | 영향도 |
|------|------|------|--------|
| Course | `Course.java` | @Version 미적용 | Lost Update |
| CourseItem | `CourseItem.java` | @Version 미적용 | orphanRemoval 충돌 |
| CourseSnapshot | `CourseSnapshot.java` | @Version 미적용 | Lost Update |
| SnapshotItem | `SnapshotItem.java` | @Version 미적용 | orphanRemoval 충돌 |
| Program | `Program.java` | @Version 미적용 | Lost Update |

---

## 3. 수정 계획

### Phase 1: 긴급 수정 (Critical Fixes)

#### 3.1.1 forceEnroll Lock 적용

**파일**: `domain/student/service/EnrollmentServiceImpl.java`

**현재 코드**:
```java
@Transactional
public ForceEnrollResultResponse forceEnroll(Long courseTimeId, ForceEnrollRequest request, Long operatorId) {
    // 문제: Lock 없이 조회
    CourseTime courseTime = courseTimeRepository.findByIdAndTenantId(courseTimeId, tenantId)
            .orElseThrow(() -> new CourseTimeNotFoundException(courseTimeId));

    for (Long userId : request.userIds()) {
        courseTime.incrementEnrollment();  // Race Condition!
    }
}
```

**수정 코드**:
```java
@Transactional
public ForceEnrollResultResponse forceEnroll(Long courseTimeId, ForceEnrollRequest request, Long operatorId) {
    log.info("Force enrolling users: courseTimeId={}, userCount={}, operatorId={}",
            courseTimeId, request.userIds().size(), operatorId);

    Long tenantId = TenantContext.getCurrentTenantId();

    // 수정: Pessimistic Lock 적용
    CourseTime courseTime = courseTimeRepository.findByIdWithLock(courseTimeId)
            .orElseThrow(() -> new CourseTimeNotFoundException(courseTimeId));

    // tenantId 검증 추가
    if (!courseTime.getTenantId().equals(tenantId)) {
        throw new CourseTimeNotFoundException(courseTimeId);
    }

    List<EnrollmentResponse> enrollments = new ArrayList<>();
    List<ForceEnrollResultResponse.FailureDetail> failures = new ArrayList<>();

    for (Long userId : request.userIds()) {
        try {
            if (enrollmentRepository.existsByUserIdAndCourseTimeIdAndTenantId(userId, courseTimeId, tenantId)) {
                failures.add(new ForceEnrollResultResponse.FailureDetail(userId, "이미 수강 중입니다"));
                continue;
            }

            courseTime.incrementEnrollment();

            Enrollment enrollment = Enrollment.createMandatory(userId, courseTimeId, operatorId);
            Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

            enrollments.add(EnrollmentResponse.from(savedEnrollment));
        } catch (Exception e) {
            log.warn("Failed to force enroll user: userId={}, error={}", userId, e.getMessage());
            failures.add(new ForceEnrollResultResponse.FailureDetail(userId, e.getMessage()));
        }
    }

    log.info("Force enrollment completed: successCount={}, failCount={}",
            enrollments.size(), failures.size());

    return ForceEnrollResultResponse.of(enrollments, failures);
}
```

---

#### 3.1.2 InstructorAssignment Unique 제약 추가

**파일**: `domain/iis/entity/InstructorAssignment.java`

**현재 코드**:
```java
@Entity
@Table(name = "instructor_assignments", indexes = {
        @Index(name = "idx_ia_time", columnList = "time_key"),
        @Index(name = "idx_ia_user", columnList = "user_key")
})
public class InstructorAssignment extends TenantEntity {
    // ...
}
```

**수정 코드**:
```java
@Entity
@Table(name = "instructor_assignments",
    indexes = {
        @Index(name = "idx_ia_time", columnList = "time_key"),
        @Index(name = "idx_ia_user", columnList = "user_key")
    },
    uniqueConstraints = {
        // 동일 차수에 동일 강사 중복 배정 방지 (ACTIVE 상태에서만)
        @UniqueConstraint(
            name = "uk_ia_time_user_tenant",
            columnNames = {"time_key", "user_key", "tenant_id"}
        )
    }
)
public class InstructorAssignment extends TenantEntity {
    // ...
}
```

**추가 작업**: Repository에 Lock 메서드 추가

**파일**: `domain/iis/repository/InstructorAssignmentRepository.java`

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT ia FROM InstructorAssignment ia WHERE ia.timeKey = :timeKey AND ia.tenantId = :tenantId AND ia.status = :status")
List<InstructorAssignment> findByTimeKeyForUpdate(
    @Param("timeKey") Long timeKey,
    @Param("tenantId") Long tenantId,
    @Param("status") AssignmentStatus status
);
```

---

### Phase 1.5: Check-Then-Act Race Condition 해결

> DB Unique 제약으로 최종 방어선 구축

#### 3.1.3 User 이메일 Unique 제약

**파일**: `domain/user/entity/User.java`

```java
@Entity
@Table(name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_email", columnNames = {"email"})
    }
)
public class User extends BaseTimeEntity {
    // ...
}
```

**DB 마이그레이션**:
```sql
ALTER TABLE users ADD CONSTRAINT uk_user_email UNIQUE (email);
```

---

#### 3.1.4 UserCourseRole Unique 제약

**파일**: `domain/user/entity/UserCourseRole.java`

```java
@Entity
@Table(name = "user_course_roles",
    uniqueConstraints = {
        // 테넌트 레벨 역할: user_id + role (course_id IS NULL)
        @UniqueConstraint(name = "uk_ucr_user_role_tenant", columnNames = {"user_id", "role"}),
        // 강의 레벨 역할: user_id + course_id + role
        @UniqueConstraint(name = "uk_ucr_user_course_role", columnNames = {"user_id", "course_id", "role"})
    }
)
public class UserCourseRole extends BaseTimeEntity {
    // ...
}
```

**DB 마이그레이션**:
```sql
-- 주의: course_id가 NULL인 경우와 아닌 경우를 구분해야 함
-- MySQL에서는 NULL도 Unique에 포함되므로 별도 처리 필요
ALTER TABLE user_course_roles
ADD CONSTRAINT uk_ucr_user_course_role UNIQUE (user_id, course_id, role);
```

---

#### 3.1.5 Tenant code/subdomain Unique 제약

**파일**: `domain/tenant/entity/Tenant.java`

```java
@Entity
@Table(name = "tenants",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_code", columnNames = {"code"}),
        @UniqueConstraint(name = "uk_tenant_subdomain", columnNames = {"subdomain"}),
        @UniqueConstraint(name = "uk_tenant_custom_domain", columnNames = {"custom_domain"})
    }
)
public class Tenant extends BaseTimeEntity {
    // ...
}
```

**DB 마이그레이션**:
```sql
ALTER TABLE tenants ADD CONSTRAINT uk_tenant_code UNIQUE (code);
ALTER TABLE tenants ADD CONSTRAINT uk_tenant_subdomain UNIQUE (subdomain);
ALTER TABLE tenants ADD CONSTRAINT uk_tenant_custom_domain UNIQUE (custom_domain);
```

---

#### 3.1.6 SnapshotRelation toItemId Unique 제약

**파일**: `domain/snapshot/entity/SnapshotRelation.java`

```java
@Entity
@Table(name = "cm_snapshot_relations",
    uniqueConstraints = {
        // 하나의 Item은 하나의 선행 Item만 가질 수 있음
        @UniqueConstraint(name = "uk_sr_to_item", columnNames = {"to_item_id", "tenant_id"})
    }
)
public class SnapshotRelation extends TenantEntity {
    // ...
}
```

**DB 마이그레이션**:
```sql
ALTER TABLE cm_snapshot_relations
ADD CONSTRAINT uk_sr_to_item UNIQUE (to_item_id, tenant_id);
```

---

#### 3.1.7 ContentFolder 폴더명 Unique 제약

**파일**: `domain/learning/entity/ContentFolder.java`

```java
@Entity
@Table(name = "content_folders",
    uniqueConstraints = {
        // 같은 부모 아래 동일 이름 폴더 방지
        @UniqueConstraint(name = "uk_cf_parent_name", columnNames = {"parent_id", "folder_name", "tenant_id"})
    }
)
public class ContentFolder extends TenantEntity {
    // ...
}
```

**DB 마이그레이션**:
```sql
-- parent_id가 NULL인 경우 (루트 폴더)도 고려
ALTER TABLE content_folders
ADD CONSTRAINT uk_cf_parent_name UNIQUE (parent_id, folder_name, tenant_id);
```

---

#### 3.1.8 Enrollment 중복 수강 방지 Unique 제약

**파일**: `domain/student/entity/Enrollment.java`

```java
@Entity
@Table(name = "sis_enrollments",
    uniqueConstraints = {
        // 동일 사용자가 동일 차수에 중복 수강 방지
        @UniqueConstraint(name = "uk_enroll_user_time", columnNames = {"user_id", "course_time_id", "tenant_id"})
    }
)
public class Enrollment extends TenantEntity {
    // ...
}
```

**DB 마이그레이션**:
```sql
ALTER TABLE sis_enrollments
ADD CONSTRAINT uk_enroll_user_time UNIQUE (user_id, course_time_id, tenant_id);
```

---

### Phase 2: @Version 적용 (Optimistic Locking)

#### 3.2.1 Course Entity

**파일**: `domain/course/entity/Course.java`

```java
@Entity
@Table(name = "cm_courses", ...)
public class Course extends TenantEntity {

    @Version
    private Long version;  // 추가

    // 기존 필드들...
}
```

#### 3.2.2 CourseItem Entity

**파일**: `domain/course/entity/CourseItem.java`

```java
@Entity
@Table(name = "cm_course_items", ...)
public class CourseItem extends TenantEntity {

    @Version
    private Long version;  // 추가

    // 기존 필드들...
}
```

#### 3.2.3 CourseSnapshot Entity

**파일**: `domain/snapshot/entity/CourseSnapshot.java`

```java
@Entity
@Table(name = "cm_snapshots", ...)
public class CourseSnapshot extends TenantEntity {

    @Version
    private Long version;  // 추가 (기존 version 필드와 별개 - 비즈니스 버전)

    // 기존 version 필드는 snapshotVersion으로 리네임
    @Column(nullable = false)
    private Integer snapshotVersion;  // 비즈니스 버전 (1, 2, 3...)

    // 기존 필드들...
}
```

#### 3.2.4 SnapshotItem Entity

**파일**: `domain/snapshot/entity/SnapshotItem.java`

```java
@Entity
@Table(name = "cm_snapshot_items", ...)
public class SnapshotItem extends TenantEntity {

    @Version
    private Long version;  // 추가

    // 기존 필드들...
}
```

#### 3.2.5 Program Entity

**파일**: `domain/program/entity/Program.java`

```java
@Entity
@Table(name = "cm_programs", ...)
public class Program extends TenantEntity {

    @Version
    private Long version;  // 추가

    // 기존 필드들...
}
```

---

### Phase 3: 예외 처리 추가

#### 3.3.1 OptimisticLockException Handler

**파일**: `common/exception/GlobalExceptionHandler.java`

```java
@ExceptionHandler(OptimisticLockException.class)
public ResponseEntity<ApiResponse<Void>> handleOptimisticLockException(OptimisticLockException e) {
    log.warn("Optimistic lock exception: {}", e.getMessage());
    return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApiResponse.error("CONFLICT", "다른 사용자가 동시에 수정했습니다. 새로고침 후 다시 시도해주세요."));
}

@ExceptionHandler(PessimisticLockException.class)
public ResponseEntity<ApiResponse<Void>> handlePessimisticLockException(PessimisticLockException e) {
    log.warn("Pessimistic lock exception: {}", e.getMessage());
    return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApiResponse.error("LOCK_CONFLICT", "다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요."));
}
```

#### 3.3.2 DataIntegrityViolationException Handler (Unique 제약 위반)

```java
@ExceptionHandler(DataIntegrityViolationException.class)
public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
    log.warn("Data integrity violation: {}", e.getMessage());

    if (e.getMessage().contains("uk_ia_time_user_tenant")) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("IIS002", "이미 해당 차수에 배정된 강사입니다."));
    }

    return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ApiResponse.error("DATA_CONFLICT", "데이터 충돌이 발생했습니다."));
}
```

---

## 4. DB 마이그레이션

### 4.1 Unique 제약 추가

```sql
-- instructor_assignments 테이블에 Unique 제약 추가
ALTER TABLE instructor_assignments
ADD CONSTRAINT uk_ia_time_user_tenant
UNIQUE (time_key, user_key, tenant_id);
```

### 4.2 Version 컬럼 추가

```sql
-- Course
ALTER TABLE cm_courses ADD COLUMN version BIGINT DEFAULT 0;

-- CourseItem
ALTER TABLE cm_course_items ADD COLUMN version BIGINT DEFAULT 0;

-- CourseSnapshot (기존 version 컬럼 리네임)
ALTER TABLE cm_snapshots CHANGE COLUMN version snapshot_version INT NOT NULL;
ALTER TABLE cm_snapshots ADD COLUMN version BIGINT DEFAULT 0;

-- SnapshotItem
ALTER TABLE cm_snapshot_items ADD COLUMN version BIGINT DEFAULT 0;

-- Program
ALTER TABLE cm_programs ADD COLUMN version BIGINT DEFAULT 0;
```

---

## 5. 테스트 계획

### 5.1 동시성 테스트

```java
@Test
@DisplayName("forceEnroll 동시 실행 시 정원 정확성 테스트")
void forceEnroll_concurrent_shouldMaintainCorrectCount() throws InterruptedException {
    // Given
    Long courseTimeId = createCourseTime(0);  // 초기 정원 0
    int threadCount = 10;
    int usersPerThread = 5;

    ExecutorService executor = Executors.newFixedThreadPool(threadCount);
    CountDownLatch latch = new CountDownLatch(threadCount);

    // When
    for (int i = 0; i < threadCount; i++) {
        final int threadIndex = i;
        executor.submit(() -> {
            try {
                List<Long> userIds = generateUserIds(threadIndex, usersPerThread);
                enrollmentService.forceEnroll(courseTimeId, new ForceEnrollRequest(userIds), operatorId);
            } finally {
                latch.countDown();
            }
        });
    }

    latch.await();

    // Then
    CourseTime courseTime = courseTimeRepository.findById(courseTimeId).orElseThrow();
    long actualEnrollments = enrollmentRepository.countByCourseTimeId(courseTimeId);

    assertThat(courseTime.getCurrentEnrollment()).isEqualTo((int) actualEnrollments);
    assertThat(actualEnrollments).isEqualTo(threadCount * usersPerThread);
}
```

### 5.2 Optimistic Lock 테스트

```java
@Test
@DisplayName("Course 동시 수정 시 OptimisticLockException 발생")
void updateCourse_concurrent_shouldThrowOptimisticLockException() {
    // Given
    Course course = courseRepository.findById(courseId).orElseThrow();

    // When: 동시에 수정 시도
    entityManager.detach(course);
    Course staleVersion = courseRepository.findById(courseId).orElseThrow();

    course.updateTitle("Title A");
    courseRepository.save(course);  // 성공

    staleVersion.updateTitle("Title B");

    // Then
    assertThrows(OptimisticLockException.class, () -> {
        courseRepository.saveAndFlush(staleVersion);  // 실패
    });
}
```

---

## 6. 작업 체크리스트

### Phase 1: 긴급 수정 (Critical)

- [ ] `EnrollmentServiceImpl.forceEnroll()` Lock 적용
- [ ] `InstructorAssignment` Unique 제약 추가
- [ ] `InstructorAssignmentRepository` Lock 메서드 추가
- [ ] 단위 테스트 작성

### Phase 1.5: Check-Then-Act 해결 (High)

- [ ] `User` Entity에 email Unique 제약 추가
- [ ] `UserCourseRole` Entity에 Unique 제약 추가
- [ ] `Tenant` Entity에 code/subdomain/customDomain Unique 제약 추가
- [ ] `SnapshotRelation` Entity에 toItemId Unique 제약 추가
- [ ] `ContentFolder` Entity에 parent+name Unique 제약 추가
- [ ] `Enrollment` Entity에 user+courseTime Unique 제약 추가
- [ ] DB 마이그레이션 스크립트 작성 (전체 Unique)
- [ ] `GlobalExceptionHandler`에 각 Unique 위반 에러 메시지 추가

### Phase 2: @Version 적용

- [ ] `Course` Entity에 @Version 추가
- [ ] `CourseItem` Entity에 @Version 추가
- [ ] `CourseSnapshot` Entity에 @Version 추가 (기존 version 리네임)
- [ ] `SnapshotItem` Entity에 @Version 추가
- [ ] `Program` Entity에 @Version 추가
- [ ] DB 마이그레이션 스크립트 작성 (version 컬럼)

### Phase 3: 예외 처리

- [ ] `GlobalExceptionHandler`에 OptimisticLockException 핸들러 추가
- [ ] `GlobalExceptionHandler`에 PessimisticLockException 핸들러 추가
- [ ] `GlobalExceptionHandler`에 DataIntegrityViolationException 핸들러 추가

### Phase 4: 테스트

- [ ] forceEnroll 동시성 테스트
- [ ] InstructorAssignment 중복 배정 테스트
- [ ] Course Optimistic Lock 테스트
- [ ] 통합 테스트

---

## 7. 영향 범위

### 7.1 API 응답 변경

| HTTP Status | 코드 | 메시지 | 발생 조건 |
|-------------|------|--------|----------|
| 409 Conflict | `CONFLICT` | 다른 사용자가 동시에 수정했습니다 | Optimistic Lock 충돌 |
| 409 Conflict | `LOCK_CONFLICT` | 다른 작업이 진행 중입니다 | Pessimistic Lock 대기 시간 초과 |
| 409 Conflict | `IIS002` | 이미 해당 차수에 배정된 강사입니다 | Unique 제약 위반 |

### 7.2 Frontend 대응

```typescript
// API 호출 시 409 에러 처리
try {
  await api.updateCourse(courseId, data);
} catch (error) {
  if (error.status === 409) {
    // 충돌 알림 + 새로고침 유도
    toast.error('다른 사용자가 수정했습니다. 새로고침 후 다시 시도해주세요.');
    queryClient.invalidateQueries(['course', courseId]);
  }
}
```

---

## 8. 롤백 계획

문제 발생 시 롤백 순서:

1. **Phase 3** (예외 처리): 코드 롤백만으로 복구 가능
2. **Phase 2** (@Version): 컬럼 삭제 마이그레이션 필요
3. **Phase 1** (Lock/Unique): Unique 제약 삭제 마이그레이션 필요

```sql
-- 롤백 SQL
ALTER TABLE instructor_assignments DROP INDEX uk_ia_time_user_tenant;
ALTER TABLE cm_courses DROP COLUMN version;
-- ... 나머지 테이블도 동일
```

---

## 변경 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2025-12-19 | Claude | 초안 작성 |

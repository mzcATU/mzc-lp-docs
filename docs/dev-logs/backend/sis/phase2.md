# Backend SIS 모듈 개발 로그 - Phase 2

> SIS 모듈 수강신청 CRUD API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | 신동구 |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#50](https://github.com/mzcATU/mzc-lp-backend/issues/50) |
| **담당 모듈** | SIS (Student Information System - 수강 관리) |
| **브랜치** | `feat/sis-crud-api` |

---

## 1. 구현 개요

수강신청 CRUD API 10개 엔드포인트 구현 및 TS 모듈 연동:

| 구성요소 | 내용 |
|----------|------|
| Controller | EnrollmentController (10개 API) |
| Service | EnrollmentService 인터페이스, EnrollmentServiceImpl 구현체 |
| DTO | Request 4개, Response 3개 |
| 테스트 | EnrollmentServiceTest (13개 테스트 케이스) |
| 통합 | TS 모듈 연동 (정원 관리) |

---

## 2. API 엔드포인트 (10개)

### 수강신청 관련

| Method | Endpoint | 설명 | 권한 | 비고 |
|--------|----------|------|------|------|
| POST | `/api/times/{id}/enrollments` | 수강신청 | AUTH | 본인 수강 신청 |
| POST | `/api/times/{id}/enrollments/force` | 강제배정 | OPERATOR | 운영자 다수 배정 |
| GET | `/api/times/{id}/enrollments` | 수강생 목록 | OPERATOR | 차수별 수강생 |
| DELETE | `/api/enrollments/{id}` | 수강 취소 | AUTH | 취소 시 좌석 반환 |

### 수강 관리

| Method | Endpoint | 설명 | 권한 | 비고 |
|--------|----------|------|------|------|
| GET | `/api/enrollments/{id}` | 수강 상세 | AUTH | 본인/운영자만 조회 |
| PATCH | `/api/enrollments/{id}/progress` | 진도 업데이트 | AUTH | 0-100% |
| PATCH | `/api/enrollments/{id}/complete` | 수료 처리 | OPERATOR | 점수 입력 |
| PATCH | `/api/enrollments/{id}/status` | 상태 변경 | OPERATOR | 상태 강제 변경 |

### 조회

| Method | Endpoint | 설명 | 권한 | 비고 |
|--------|----------|------|------|------|
| GET | `/api/users/me/enrollments` | 내 수강 목록 | AUTH | 상태별 필터링 |
| GET | `/api/users/{userId}/enrollments` | 수강 이력 | OPERATOR | 사용자별 조회 |

---

## 3. 신규 생성 파일 (11개)

### Controller (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentController.java | `controller/` | 10개 REST API 엔드포인트 |

### Service (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentService.java | `service/` | 서비스 인터페이스 |
| EnrollmentServiceImpl.java | `service/` | 서비스 구현체 (TS 연동) |

### Request DTO (4개)

| 파일 | 경로 | 설명 |
|------|------|------|
| ForceEnrollRequest.java | `dto/request/` | 강제배정 (userIds, reason) |
| UpdateProgressRequest.java | `dto/request/` | 진도율 업데이트 (0-100) |
| CompleteEnrollmentRequest.java | `dto/request/` | 수료 처리 (점수) |
| UpdateEnrollmentStatusRequest.java | `dto/request/` | 상태 변경 (status, reason) |

### Response DTO (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentResponse.java | `dto/response/` | 수강 기본 정보 (9개 필드) |
| EnrollmentDetailResponse.java | `dto/response/` | 수강 상세 정보 (12개 필드) |
| ForceEnrollResultResponse.java | `dto/response/` | 강제배정 결과 (성공/실패 목록) |

### 테스트 (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentServiceTest.java | `test/.../service/` | 13개 테스트 케이스 |

---

## 4. 비즈니스 규칙

### 4.1 수강신청 검증

```java
// 1. 수강 신청 기간 체크
if (!courseTime.canEnroll()) {
    throw new EnrollmentPeriodClosedException(courseTimeId);
}

// 2. 중복 수강 체크
if (enrollmentRepository.existsByUserIdAndCourseTimeIdAndTenantId(...)) {
    throw new AlreadyEnrolledException(userId, courseTimeId);
}

// 3. 정원 체크 (TS 모듈)
courseTimeService.occupySeat(courseTimeId);  // 정원 초과 시 예외 발생
```

### 4.2 수강 취소 제약

```java
// COMPLETED 상태는 취소 불가
public void cancelEnrollment(Long enrollmentId, Long userId) {
    Enrollment enrollment = findEnrollment(enrollmentId);
    validateOwnership(enrollment, userId);

    if (enrollment.isCompleted()) {
        throw new CannotCancelCompletedException(enrollmentId);
    }

    enrollment.drop();
    courseTimeService.releaseSeat(enrollment.getCourseTimeId());
}
```

### 4.3 강제 배정 (부분 성공 처리)

```java
// 실패한 사용자는 failures에 포함, 나머지는 정상 배정
for (Long userId : userIds) {
    try {
        if (isDuplicate(userId, courseTimeId)) {
            failures.add(new FailureInfo(userId, "이미 수강 중"));
            continue;
        }
        Enrollment enrollment = Enrollment.createMandatory(userId, courseTimeId, operatorId);
        enrollments.add(enrollmentRepository.save(enrollment));
    } catch (Exception e) {
        failures.add(new FailureInfo(userId, e.getMessage()));
    }
}
```

---

## 5. TS 모듈 연동

### 5.1 정원 관리

```java
@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {
    private final CourseTimeService courseTimeService;  // TS 모듈

    @Transactional
    public EnrollmentDetailResponse enroll(Long courseTimeId, Long userId) {
        // ... 검증 로직 ...

        // TS 모듈에서 좌석 점유 (정원 체크 포함)
        courseTimeService.occupySeat(courseTimeId);

        // 수강 생성
        Enrollment enrollment = Enrollment.createVoluntary(userId, courseTimeId);
        return EnrollmentDetailResponse.from(enrollmentRepository.save(enrollment));
    }

    @Transactional
    public void cancelEnrollment(Long enrollmentId, Long userId) {
        Enrollment enrollment = findEnrollment(enrollmentId);
        enrollment.drop();

        // TS 모듈에서 좌석 반환
        courseTimeService.releaseSeat(enrollment.getCourseTimeId());
    }
}
```

### 5.2 CourseTimeService 메서드

| 메서드 | 설명 | 예외 |
|--------|------|------|
| `occupySeat(Long courseTimeId)` | 좌석 점유 (currentEnrollment++) | CapacityExceededException |
| `releaseSeat(Long courseTimeId)` | 좌석 반환 (currentEnrollment--) | - |

---

## 6. Entity 수정 사항

### 6.1 Instant 타입 통일

```java
@Entity
public class Enrollment extends TenantEntity {

    // 변경 전: LocalDateTime
    // 변경 후: Instant (BaseTimeEntity 패턴과 일관성)
    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    public static Enrollment createVoluntary(Long userId, Long courseTimeId) {
        Enrollment enrollment = new Enrollment();
        enrollment.enrolledAt = Instant.now();  // Instant 사용
        // ...
        return enrollment;
    }

    public void complete(Integer score) {
        this.completedAt = Instant.now();  // Instant 사용
        // ...
    }
}
```

**변경 이유**: 프로젝트 전체에서 `BaseTimeEntity`가 `Instant`를 사용하므로 일관성 유지

---

## 7. 테스트 코드

### 7.1 테스트 구조 (13개)

```java
@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @InjectMocks
    private EnrollmentServiceImpl enrollmentService;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private CourseTimeService courseTimeService;

    // 1. 수강 신청 (3개)
    @Nested
    class Enroll {
        @Test void enroll_success() { ... }
        @Test void enroll_fail_alreadyEnrolled() { ... }
        @Test void enroll_fail_periodClosed() { ... }
    }

    // 2. 강제 배정 (2개)
    @Nested
    class ForceEnroll {
        @Test void forceEnroll_success() { ... }
        @Test void forceEnroll_partialSuccess() { ... }
    }

    // 3. 진도율 업데이트 (2개)
    @Nested
    class UpdateProgress {
        @Test void updateProgress_success() { ... }
        @Test void updateProgress_fail_notFound() { ... }
    }

    // 4. 수료 처리 (1개)
    @Nested
    class CompleteEnrollment {
        @Test void completeEnrollment_success() { ... }
    }

    // 5. 수강 취소 (2개)
    @Nested
    class CancelEnrollment {
        @Test void cancelEnrollment_success() { ... }
        @Test void cancelEnrollment_fail_completed() { ... }
    }

    // 6. 상태 변경 (1개)
    @Nested
    class UpdateStatus {
        @Test void updateStatus_success() { ... }
    }

    // 7. 조회 (2개)
    @Nested
    class GetMyEnrollments {
        @Test void getMyEnrollments_success() { ... }
        @Test void getMyEnrollments_success_withStatusFilter() { ... }
    }
}
```

### 7.2 테스트 헬퍼 메서드

```java
// CourseTime 생성 (RECRUITING 상태로 open)
private CourseTime createTestCourseTime(boolean canEnroll) {
    CourseTime courseTime = CourseTime.create(...);
    if (canEnroll) {
        courseTime.open();  // DRAFT -> RECRUITING
    }
    return courseTime;
}

// Enrollment 생성 (상태별)
private Enrollment createTestEnrollment(Long userId, Long courseTimeId, EnrollmentStatus status) {
    Enrollment enrollment = Enrollment.createVoluntary(userId, courseTimeId);
    if (status == EnrollmentStatus.COMPLETED) {
        enrollment.complete(100);
    } else if (status == EnrollmentStatus.DROPPED) {
        enrollment.drop();
    }
    return enrollment;
}
```

---

## 8. 기타 수정 사항

### 8.1 CourseControllerTest 에러 코드 수정

```java
// 변경 전
.andExpect(jsonPath("$.error.code").value("CM_COURSE_NOT_FOUND"));

// 변경 후 (ErrorCode enum의 code 필드 사용)
.andExpect(jsonPath("$.error.code").value("CM001"));
```

**이유**: JSON 응답에서 `ErrorCode`의 `code` 필드(`CM001`)가 반환되는데, 테스트에서 enum 이름(`CM_COURSE_NOT_FOUND`)으로 비교하고 있었음

---

## 9. 빌드 및 테스트 결과

### 9.1 테스트 결과

```bash
# EnrollmentServiceTest
✅ 13개 테스트 모두 통과

# CourseControllerTest
✅ 26개 테스트 모두 통과 (에러 코드 수정 후)

# 전체 테스트
✅ 227개 테스트 통과
BUILD SUCCESSFUL
```

### 9.2 MySQL 저장 확인

```sql
-- 테스트 데이터 삽입 확인
SELECT * FROM sis_enrollments;

-- 결과
id  user_id  course_time_id  status     type       progress  score  enrolled_at             completed_at
5   1        1               ENROLLED   VOLUNTARY  0         NULL   2025-12-15 15:55:29     NULL
6   2        1               ENROLLED   VOLUNTARY  50        NULL   2025-12-15 15:55:29     NULL
7   3        1               COMPLETED  MANDATORY  100       NULL   2025-12-15 15:55:29     NULL
```

---

## 10. 커밋 메시지

```
feat(sis): 수강신청 CRUD API 구현

- EnrollmentController: 10개 API 엔드포인트 구현
  - POST /api/times/{id}/enrollments (수강신청)
  - POST /api/times/{id}/enrollments/force (강제배정)
  - GET /api/times/{id}/enrollments (수강생 목록)
  - GET /api/enrollments/{id} (수강 상세)
  - PATCH /api/enrollments/{id}/progress (진도 업데이트)
  - PATCH /api/enrollments/{id}/complete (수료 처리)
  - PATCH /api/enrollments/{id}/status (상태 변경)
  - DELETE /api/enrollments/{id} (수강 취소)
  - GET /api/users/me/enrollments (내 수강 목록)
  - GET /api/users/{userId}/enrollments (수강 이력)
- EnrollmentService: TS 모듈 연동 (정원 관리)
- Enrollment 엔티티: LocalDateTime -> Instant 통일
- Request/Response DTO 4개 + 3개 생성
- EnrollmentServiceTest: 13개 테스트 케이스 작성
- CourseControllerTest: 에러 코드 수정 (CM001)

Closes #50
```

---

## 11. 개선 제안 및 향후 작업

### 11.1 현재 제한 사항

- 대기자 명단 기능 미구현 (TS 모듈의 `maxWaitingCount` 필드 존재)
- 수강 신청 알림 기능 없음
- 벌크 작업 최적화 필요 (강제 배정 시 N+1 문제 가능성)

### 11.2 향후 추가 기능

- [ ] 대기자 명단 관리 API
- [ ] 수강 신청/취소 알림 (이벤트 발행)
- [ ] 수강 통계 API (차수별, 사용자별)
- [ ] 엑셀 다운로드 기능
- [ ] 수료증 발급 연동

---

## 12. 참고 자료

- [Issue #50: SIS - 수강신청 CRUD API](https://github.com/mzcATU/mzc-lp-backend/issues/50)
- [PR: feat(sis): 수강신청 CRUD API 구현](https://github.com/mzcATU/mzc-lp-backend/pull/new/feat/sis-crud-api)
- [Phase 1: SIS 기반 구조 구현](./phase1.md)
- [TS 모듈 Phase 1: 정원 관리](../ts/phase1.md)

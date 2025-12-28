# Backend Stats 모듈 개발 로그 - Phase 3

> OPERATOR 운영 대시보드 API

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#196](https://github.com/mzcATU/mzc-lp-backend/issues/196) |
| **담당 모듈** | Stats (Statistics - 통계) / Dashboard |

---

## 1. 구현 개요

운영자 대시보드 통계 API 구현:

| 구성요소 | 내용 |
|----------|------|
| API | `GET /api/operator/dashboard/tasks` |
| DTO | OperatorTasksResponse (중첩 record 5개) |
| Service | OperatorDashboardService.getOperatorTasks() |
| Repository Query | countCourseTimesNeedingInstructor 추가 |
| Test | Service 3개, Controller 4개 |

---

## 2. API 스펙

### 엔드포인트

```
GET /api/operator/dashboard/tasks
Authorization: Bearer {accessToken}
Role: OPERATOR, TENANT_ADMIN
```

### Response

```json
{
  "success": true,
  "data": {
    "pendingTasks": {
      "programsPendingApproval": 5,
      "courseTimesNeedingInstructor": 3
    },
    "courseTimeStats": {
      "byStatus": {
        "draft": 5,
        "recruiting": 10,
        "ongoing": 15,
        "closed": 20,
        "archived": 5
      },
      "byDeliveryType": {
        "online": 20,
        "offline": 15,
        "blended": 10,
        "live": 10
      },
      "freeVsPaid": {
        "free": 15,
        "paid": 40
      },
      "total": 55
    },
    "enrollmentStats": {
      "totalEnrollments": 1000,
      "byStatus": {
        "enrolled": 400,
        "completed": 500,
        "dropped": 50,
        "failed": 50
      },
      "byType": {
        "voluntary": 800,
        "mandatory": 200
      },
      "completionRate": 50.0,
      "averageCapacityUtilization": 75.5
    },
    "dailyTrend": [
      { "date": "2025-12-27", "enrollments": 12 },
      { "date": "2025-12-28", "enrollments": 15 }
    ]
  }
}
```

### 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| pendingTasks.programsPendingApproval | Long | 승인 대기 중인 프로그램 수 |
| pendingTasks.courseTimesNeedingInstructor | Long | 강사 미배정 차수 수 |
| courseTimeStats.byStatus.* | Long | 상태별 차수 수 (DRAFT, RECRUITING 등) |
| courseTimeStats.byDeliveryType.* | Long | 운영방식별 차수 수 (ONLINE, OFFLINE 등) |
| courseTimeStats.freeVsPaid.* | Long | 유료/무료별 차수 수 |
| courseTimeStats.total | Long | 전체 차수 수 |
| enrollmentStats.totalEnrollments | Long | 전체 수강 수 |
| enrollmentStats.byStatus.* | Long | 상태별 수강 수 (ENROLLED, COMPLETED 등) |
| enrollmentStats.byType.* | Long | 유형별 수강 수 (VOLUNTARY, MANDATORY) |
| enrollmentStats.completionRate | BigDecimal | 수료율 (%) |
| enrollmentStats.averageCapacityUtilization | BigDecimal | 평균 정원 활용률 (%) |
| dailyTrend[].date | LocalDate | 날짜 |
| dailyTrend[].enrollments | Long | 해당 일자 수강신청 수 |

---

## 3. 신규 생성 파일 (6개)

### Domain (4개)

| 파일 | 경로 | 설명 |
|------|------|------|
| OperatorTasksResponse.java | `domain/dashboard/dto/response/` | 운영 대시보드 Response (중첩 record 5개) |
| OperatorDashboardService.java | `domain/dashboard/service/` | 서비스 인터페이스 |
| OperatorDashboardServiceImpl.java | `domain/dashboard/service/` | 서비스 구현체 |
| OperatorDashboardController.java | `domain/dashboard/controller/` | 컨트롤러 |

### Test (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| OperatorDashboardServiceTest.java | `test/.../dashboard/service/` | 서비스 단위 테스트 (3개) |
| OperatorDashboardControllerTest.java | `test/.../dashboard/controller/` | 통합 테스트 (4개) |

---

## 4. 수정 파일 (2개)

### CourseTimeRepository.java

```java
// 추가된 쿼리: 강사 미배정 차수 카운트
@Query("SELECT COUNT(ct) FROM CourseTime ct " +
        "WHERE ct.tenantId = :tenantId " +
        "AND ct.status IN :statuses " +
        "AND NOT EXISTS (" +
        "    SELECT 1 FROM InstructorAssignment ia " +
        "    WHERE ia.timeKey = ct.id " +
        "    AND ia.tenantId = :tenantId " +
        "    AND ia.role = :role " +
        "    AND ia.status = :assignmentStatus" +
        ")")
long countCourseTimesNeedingInstructor(
        @Param("tenantId") Long tenantId,
        @Param("statuses") List<CourseTimeStatus> statuses,
        @Param("role") InstructorRole role,
        @Param("assignmentStatus") AssignmentStatus assignmentStatus);
```

### EnrollmentRepository.java

```java
// 수정 1: H2/MySQL 호환성을 위해 DATE 함수 변경
// Before: FUNCTION('DATE', e.enrolledAt)
// After: CAST(e.enrolledAt AS DATE)
@Query("SELECT CAST(e.enrolledAt AS DATE) AS date, COUNT(e) AS count " +
        "FROM Enrollment e " +
        "WHERE e.tenantId = :tenantId " +
        "AND e.enrolledAt >= :startDate " +
        "AND e.enrolledAt < :endDate " +
        "GROUP BY CAST(e.enrolledAt AS DATE) " +
        "ORDER BY CAST(e.enrolledAt AS DATE)")
List<DailyCountProjection> countDailyEnrollments(...);

// 수정 2: 0 나누기 방지를 위해 NULLIF 적용
// Before: COUNT(...) / COUNT(e)
// After: COUNT(...) / NULLIF(COUNT(e), 0)
@Query("SELECT COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(e), 0) " +
        "FROM Enrollment e " +
        "WHERE e.tenantId = :tenantId")
Double getCompletionRateByTenantId(@Param("tenantId") Long tenantId);
```

---

## 5. 파일 구조

```
domain/dashboard/                          ✅ 신규 도메인
├── dto/response/
│   └── OperatorTasksResponse.java         ✅ 신규
├── service/
│   ├── OperatorDashboardService.java      ✅ 신규
│   └── OperatorDashboardServiceImpl.java  ✅ 신규
└── controller/
    └── OperatorDashboardController.java   ✅ 신규

domain/ts/repository/
└── CourseTimeRepository.java              ✏️ 수정 (쿼리 1개 추가)

domain/student/repository/
└── EnrollmentRepository.java              ✏️ 수정 (쿼리 2개 수정)

test/.../dashboard/
├── service/
│   └── OperatorDashboardServiceTest.java  ✅ 신규 (3개 테스트)
└── controller/
    └── OperatorDashboardControllerTest.java ✅ 신규 (4개 테스트)
```

---

## 6. OperatorTasksResponse 구조

### 설계 의도

이슈 스펙의 중첩 JSON 구조를 그대로 반영하기 위해 5개의 중첩 record 사용:

```java
public record OperatorTasksResponse(
        PendingTasks pendingTasks,
        CourseTimeStats courseTimeStats,
        EnrollmentStats enrollmentStats,
        List<DailyEnrollment> dailyTrend
) {
    // 대기 중인 작업
    public record PendingTasks(
            Long programsPendingApproval,
            Long courseTimesNeedingInstructor
    ) { }

    // 차수 통계
    public record CourseTimeStats(
            ByStatus byStatus,
            ByDeliveryType byDeliveryType,
            FreeVsPaid freeVsPaid,
            Long total
    ) {
        public record ByStatus(Long draft, Long recruiting, Long ongoing, Long closed, Long archived) { }
        public record ByDeliveryType(Long online, Long offline, Long blended, Long live) { }
        public record FreeVsPaid(Long free, Long paid) { }
    }

    // 수강 통계
    public record EnrollmentStats(
            Long totalEnrollments,
            ByStatus byStatus,
            ByType byType,
            BigDecimal completionRate,
            BigDecimal averageCapacityUtilization
    ) {
        public record ByStatus(Long enrolled, Long completed, Long dropped, Long failed) { }
        public record ByType(Long voluntary, Long mandatory) { }
    }

    // 일별 추이
    public record DailyEnrollment(LocalDate date, Long enrollments) { }

    public static OperatorTasksResponse of(...) { }
}
```

### Projection → DTO 변환

각 중첩 record에 `from()` 또는 `of()` 정적 팩토리 메서드를 두어 Projection 리스트를 Map으로 변환 후 필드 추출:

```java
public static ByStatus from(List<StatusCountProjection> projections) {
    Map<String, Long> statusMap = projections.stream()
            .collect(Collectors.toMap(
                    StatusCountProjection::getStatus,
                    StatusCountProjection::getCount
            ));
    return new ByStatus(
            statusMap.getOrDefault(CourseTimeStatus.DRAFT.name(), 0L),
            // ...
    );
}
```

---

## 7. Service 로직 상세

### 조회 흐름

```
1. TenantContext에서 tenantId 조회
2. 대기 작업 조회
   - programRepository.countPendingPrograms()
   - courseTimeRepository.countCourseTimesNeedingInstructor()
3. 차수 통계 조회
   - countByTenantIdGroupByStatus()
   - countByTenantIdGroupByDeliveryType()
   - countByTenantIdGroupByFree()
   - countByTenantId()
4. 수강 통계 조회
   - enrollmentRepository.countByTenantId()
   - countByTenantIdGroupByStatus()
   - countByTenantIdGroupByType()
   - getCompletionRateByTenantId()
   - getAverageCapacityUtilization()
5. 일별 추이 조회 (최근 30일)
   - countDailyEnrollments()
6. OperatorTasksResponse.of()로 응답 생성
```

### 강사 미배정 차수 조회 쿼리 설계

```java
// RECRUITING 또는 ONGOING 상태의 차수 중
// 주강사(MAIN)가 ACTIVE 상태로 배정되지 않은 차수 카운트
courseTimeRepository.countCourseTimesNeedingInstructor(
    tenantId,
    List.of(CourseTimeStatus.RECRUITING, CourseTimeStatus.ONGOING),
    InstructorRole.MAIN,
    AssignmentStatus.ACTIVE
);
```

NOT EXISTS 서브쿼리로 InstructorAssignment 테이블과 조인하지 않고 배정 여부만 확인.

---

## 8. 버그 수정 내역

### 8.1 H2 Database DATE 함수 호환성

**문제**: `FUNCTION('DATE', e.enrolledAt)`가 H2에서 지원되지 않음

```
Function "DATE" not found; SQL statement
```

**해결**: CAST 함수로 변경

```java
// Before
FUNCTION('DATE', e.enrolledAt)

// After
CAST(e.enrolledAt AS DATE)
```

### 8.2 0 나누기 오류

**문제**: 데이터가 없을 때 `COUNT(e) = 0`으로 나누기 발생

**해결**: NULLIF로 0을 null로 변환

```java
// Before
COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(e)

// After
COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(e), 0)
```

### 8.3 JPQL Enum 리터럴 오류

**문제**: JPQL에서 `'RECRUITING'` 문자열이 CourseTimeStatus enum으로 변환되지 않음

```
500 Internal Server Error
```

**해결**: 파라미터 바인딩으로 변경

```java
// Before
AND ct.status IN ('RECRUITING', 'ONGOING')

// After
AND ct.status IN :statuses
// 호출 시: List.of(CourseTimeStatus.RECRUITING, CourseTimeStatus.ONGOING)
```

---

## 9. 테스트 케이스 (7개)

### OperatorDashboardServiceTest (3개)

| 테스트 | 검증 내용 |
|--------|----------|
| getOperatorTasks_success | 정상 통계 조회, 모든 필드 값 검증 |
| getOperatorTasks_success_noData | 데이터 없을 때 기본값 (0, BigDecimal.ZERO) |
| getOperatorTasks_success_partialData | 일부 상태만 있을 때 없는 상태는 0 |

### OperatorDashboardControllerTest (4개)

| 테스트 | 검증 내용 |
|--------|----------|
| getOperatorTasks_success | 정상 응답 (200), JSON 구조 검증 |
| getOperatorTasks_success_noData | 빈 데이터 응답, 모든 값 0 |
| getOperatorTasks_fail_unauthorized | 일반 사용자 접근 시 403 |
| getOperatorTasks_fail_noAuth | 인증 없이 접근 시 403 |

---

## 10. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] @RestController 사용
- [x] @RequiredArgsConstructor 사용
- [x] URL 케밥케이스 (`/api/operator/dashboard/tasks`)
- [x] @PreAuthorize 권한 검증
- [x] ApiResponse.success() 래핑
- [x] try-catch 금지

### Service (04-SERVICE-CONVENTIONS)

- [x] @Service 사용
- [x] @Transactional(readOnly=true) 클래스 레벨
- [x] @Slf4j 로깅 (log.debug)
- [x] TenantContext 멀티테넌시 필터링
- [x] 인터페이스 + 구현체 분리

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] @Query + @Param 사용
- [x] tenantId 필터링 필수
- [x] NOT EXISTS 서브쿼리로 복잡한 조건 처리

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] 정적 팩토리 메서드 (of, from)
- [x] 중첩 DTO는 내부 record
- [x] dto/response/ 폴더 구조

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Service: @ExtendWith(MockitoExtension.class)
- [x] Controller: @SpringBootTest + @AutoConfigureMockMvc
- [x] Given-When-Then 패턴
- [x] @DisplayName 한글 명시
- [x] @Nested로 테스트 그룹화

---

## 11. 테스트 결과

### 전체 테스트 실행

```
BUILD SUCCESSFUL
All tests passed
```

### 신규 테스트 결과

| 테스트 클래스 | 케이스 수 | 결과 |
|--------------|-----------|------|
| OperatorDashboardServiceTest | 3개 | ✅ 전체 통과 |
| OperatorDashboardControllerTest | 4개 | ✅ 전체 통과 |

---

## 12. 다음 작업 (Phase 4+)

### 추가 대시보드 API (별도 이슈 예정)

- 강사 대시보드 API (`/api/instructor/dashboard`)
- 학습자 대시보드 API (`/api/learner/dashboard`)

### 통계 고도화

- 기간별 필터 파라미터 추가 (startDate, endDate)
- 차트용 시계열 데이터 API
- 통계 캐싱 적용

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | Phase 3 구현 완료 (운영 대시보드 API) |

---

*최종 업데이트: 2025-12-28*

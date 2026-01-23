# Backend Stats 모듈 개발 로그 - Phase 4

> TENANT_ADMIN KPI 대시보드 API

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#195](https://github.com/mzcATU/mzc-lp-backend/issues/195) |
| **담당 모듈** | Stats (Statistics - 통계) / Dashboard |
| **선행 작업** | Phase 3 (이슈 #196 - OPERATOR 운영 대시보드 API) |

---

## 1. 구현 개요

테넌트 관리자(TENANT_ADMIN) KPI 대시보드 통계 API 구현:

| 구성요소 | 내용 |
|----------|------|
| API | `GET /api/admin/dashboard/kpi` |
| DTO | AdminKpiResponse (중첩 record 5개) |
| Service | AdminDashboardService.getKpiStats() |
| Projection | MonthlyEnrollmentStatsProjection (신규) |
| Repository Query | countMonthlyEnrollmentStats 추가 |
| Test | Service 3개, Controller 5개 |

---

## 2. API 스펙

### 엔드포인트

```
GET /api/admin/dashboard/kpi
Authorization: Bearer {accessToken}
Role: TENANT_ADMIN (only)
```

### Response

```json
{
  "success": true,
  "data": {
    "userStats": {
      "active": 100,
      "inactive": 20,
      "suspended": 5,
      "withdrawn": 10,
      "total": 135,
      "newThisMonth": 15
    },
    "programStats": {
      "draft": 3,
      "pending": 2,
      "approved": 10,
      "rejected": 1,
      "closed": 5,
      "total": 21
    },
    "enrollmentStats": {
      "totalEnrollments": 500,
      "byStatus": {
        "enrolled": 200,
        "completed": 250,
        "dropped": 30,
        "failed": 20
      },
      "completionRate": 50.0
    },
    "monthlyTrend": [
      { "month": "2024-12", "enrollments": 45, "completions": 30 },
      { "month": "2024-11", "enrollments": 40, "completions": 35 }
    ]
  }
}
```

### 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| userStats.active | Long | 활성 사용자 수 |
| userStats.inactive | Long | 비활성 사용자 수 |
| userStats.suspended | Long | 정지된 사용자 수 |
| userStats.withdrawn | Long | 탈퇴한 사용자 수 |
| userStats.total | Long | 전체 사용자 수 |
| userStats.newThisMonth | Long | 이번 달 신규 가입자 수 |
| programStats.draft | Long | 임시저장 프로그램 수 |
| programStats.pending | Long | 승인대기 프로그램 수 |
| programStats.approved | Long | 승인된 프로그램 수 |
| programStats.rejected | Long | 반려된 프로그램 수 |
| programStats.closed | Long | 종료된 프로그램 수 |
| programStats.total | Long | 전체 프로그램 수 |
| enrollmentStats.totalEnrollments | Long | 전체 수강 수 |
| enrollmentStats.byStatus.* | Long | 상태별 수강 수 |
| enrollmentStats.completionRate | BigDecimal | 수료율 (%) |
| monthlyTrend[].month | String | 월 (YYYY-MM 형식) |
| monthlyTrend[].enrollments | Long | 해당 월 수강신청 수 |
| monthlyTrend[].completions | Long | 해당 월 수료 수 |

---

## 3. 신규 생성 파일 (7개)

### Common DTO (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| MonthlyEnrollmentStatsProjection.java | `common/dto/stats/` | 월별 수강/수료 통계 Projection |

### Domain (4개)

| 파일 | 경로 | 설명 |
|------|------|------|
| AdminKpiResponse.java | `domain/dashboard/dto/response/` | KPI 대시보드 Response (중첩 record 5개) |
| AdminDashboardService.java | `domain/dashboard/service/` | 서비스 인터페이스 |
| AdminDashboardServiceImpl.java | `domain/dashboard/service/` | 서비스 구현체 |
| AdminDashboardController.java | `domain/dashboard/controller/` | 컨트롤러 |

### Test (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| AdminDashboardServiceTest.java | `test/.../dashboard/service/` | 서비스 단위 테스트 (3개) |
| AdminDashboardControllerTest.java | `test/.../dashboard/controller/` | 통합 테스트 (5개) |

---

## 4. 수정 파일 (2개)

### ProgramRepository.java

```java
// 추가: 테넌트별 상태별 프로그램 카운트
@Query("SELECT p.status AS status, COUNT(p) AS count " +
        "FROM Program p " +
        "WHERE p.tenantId = :tenantId " +
        "GROUP BY p.status")
List<StatusCountProjection> countByTenantIdGroupByStatus(@Param("tenantId") Long tenantId);

// 추가: 테넌트별 전체 프로그램 카운트
long countByTenantId(Long tenantId);
```

### EnrollmentRepository.java

```java
// 추가: 테넌트별 월별 수강신청/수료 통계
@Query("SELECT YEAR(e.enrolledAt) AS year, MONTH(e.enrolledAt) AS month, " +
        "COUNT(e) AS enrollments, " +
        "SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completions " +
        "FROM Enrollment e " +
        "WHERE e.tenantId = :tenantId " +
        "AND e.enrolledAt >= :startDate " +
        "AND e.enrolledAt < :endDate " +
        "GROUP BY YEAR(e.enrolledAt), MONTH(e.enrolledAt) " +
        "ORDER BY YEAR(e.enrolledAt) DESC, MONTH(e.enrolledAt) DESC")
List<MonthlyEnrollmentStatsProjection> countMonthlyEnrollmentStats(
        @Param("tenantId") Long tenantId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate);
```

---

## 5. 파일 구조

```
common/dto/stats/
└── MonthlyEnrollmentStatsProjection.java  ✅ 신규

domain/dashboard/                          (기존 도메인 확장)
├── dto/response/
│   ├── OperatorTasksResponse.java         (기존)
│   └── AdminKpiResponse.java              ✅ 신규
├── service/
│   ├── OperatorDashboardService.java      (기존)
│   ├── OperatorDashboardServiceImpl.java  (기존)
│   ├── AdminDashboardService.java         ✅ 신규
│   └── AdminDashboardServiceImpl.java     ✅ 신규
└── controller/
    ├── OperatorDashboardController.java   (기존)
    └── AdminDashboardController.java      ✅ 신규

domain/program/repository/
└── ProgramRepository.java                 ✏️ 수정 (쿼리 2개 추가)

domain/student/repository/
└── EnrollmentRepository.java              ✏️ 수정 (쿼리 1개 추가)

test/.../dashboard/
├── service/
│   ├── OperatorDashboardServiceTest.java  (기존)
│   └── AdminDashboardServiceTest.java     ✅ 신규 (3개 테스트)
└── controller/
    ├── OperatorDashboardControllerTest.java (기존)
    └── AdminDashboardControllerTest.java  ✅ 신규 (5개 테스트)
```

---

## 6. AdminKpiResponse 구조

### 설계 의도

이슈 스펙의 KPI 대시보드 구조를 반영하여 5개의 중첩 record 사용:

```java
public record AdminKpiResponse(
        UserStats userStats,
        ProgramStats programStats,
        EnrollmentStats enrollmentStats,
        List<MonthlyTrend> monthlyTrend
) {
    // 사용자 통계
    public record UserStats(
            Long active,
            Long inactive,
            Long suspended,
            Long withdrawn,
            Long total,
            Long newThisMonth
    ) {
        public static UserStats of(
                List<StatusCountProjection> statusProjections,
                Long total,
                Long newThisMonth
        ) { }
    }

    // 프로그램 통계
    public record ProgramStats(
            Long draft,
            Long pending,
            Long approved,
            Long rejected,
            Long closed,
            Long total
    ) {
        public static ProgramStats of(
                List<StatusCountProjection> statusProjections,
                Long total
        ) { }
    }

    // 수강 통계
    public record EnrollmentStats(
            Long totalEnrollments,
            ByStatus byStatus,
            BigDecimal completionRate
    ) {
        public record ByStatus(
                Long enrolled,
                Long completed,
                Long dropped,
                Long failed
        ) { }
    }

    // 월별 추이
    public record MonthlyTrend(
            String month,
            Long enrollments,
            Long completions
    ) {
        public static MonthlyTrend from(MonthlyEnrollmentStatsProjection projection) { }
    }
}
```

### Projection → DTO 변환

각 중첩 record에 `from()` 또는 `of()` 정적 팩토리 메서드를 두어 Projection 리스트를 Map으로 변환 후 필드 추출:

```java
public static UserStats of(
        List<StatusCountProjection> statusProjections,
        Long total,
        Long newThisMonth
) {
    Map<String, Long> statusMap = statusProjections.stream()
            .collect(Collectors.toMap(
                    StatusCountProjection::getStatus,
                    StatusCountProjection::getCount
            ));

    return new UserStats(
            statusMap.getOrDefault(UserStatus.ACTIVE.name(), 0L),
            statusMap.getOrDefault(UserStatus.INACTIVE.name(), 0L),
            statusMap.getOrDefault(UserStatus.SUSPENDED.name(), 0L),
            statusMap.getOrDefault(UserStatus.WITHDRAWN.name(), 0L),
            total != null ? total : 0L,
            newThisMonth != null ? newThisMonth : 0L
    );
}
```

---

## 7. Service 로직 상세

### 조회 흐름

```
1. TenantContext에서 tenantId 조회
2. 사용자 통계 조회
   - userRepository.countByTenantIdGroupByStatus()
   - userRepository.countByTenantId()
   - userRepository.countNewUsersSince() (이번 달 1일부터)
3. 프로그램 통계 조회
   - programRepository.countByTenantIdGroupByStatus()
   - programRepository.countByTenantId()
4. 수강 통계 조회
   - enrollmentRepository.countByTenantId()
   - enrollmentRepository.countByTenantIdGroupByStatus()
   - enrollmentRepository.getCompletionRateByTenantId()
5. 월별 추이 조회 (최근 12개월)
   - enrollmentRepository.countMonthlyEnrollmentStats()
6. AdminKpiResponse.of()로 응답 생성
```

### 월별 추이 조회 로직

```java
private List<MonthlyEnrollmentStatsProjection> getMonthlyStats(Long tenantId) {
    // 다음 달 1일 (종료일, exclusive)
    LocalDate endDate = LocalDate.now().plusMonths(1).withDayOfMonth(1);
    // 12개월 전 (시작일, inclusive)
    LocalDate startDate = endDate.minusMonths(MONTHLY_TREND_MONTHS);

    Instant startInstant = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant endInstant = endDate.atStartOfDay(ZoneId.systemDefault()).toInstant();

    return enrollmentRepository.countMonthlyEnrollmentStats(tenantId, startInstant, endInstant);
}
```

---

## 8. MonthlyEnrollmentStatsProjection 설계

### 새로운 Projection 인터페이스

기존 `MonthlyCountProjection`은 count만 반환하므로, enrollments와 completions를 동시에 반환하는 새 Projection 생성:

```java
public interface MonthlyEnrollmentStatsProjection {
    Integer getYear();
    Integer getMonth();
    Long getEnrollments();
    Long getCompletions();
}
```

### 쿼리 설계

하나의 쿼리로 월별 수강신청과 수료를 동시에 집계:

```sql
SELECT
    YEAR(e.enrolledAt) AS year,
    MONTH(e.enrolledAt) AS month,
    COUNT(e) AS enrollments,
    SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completions
FROM Enrollment e
WHERE e.tenantId = :tenantId
    AND e.enrolledAt >= :startDate
    AND e.enrolledAt < :endDate
GROUP BY YEAR(e.enrolledAt), MONTH(e.enrolledAt)
ORDER BY YEAR(e.enrolledAt) DESC, MONTH(e.enrolledAt) DESC
```

---

## 9. Phase 3 (이슈 #196)과의 차이점

### OPERATOR vs TENANT_ADMIN

| 항목 | OPERATOR (Phase 3) | TENANT_ADMIN (Phase 4) |
|------|--------------------|-----------------------|
| 엔드포인트 | `/api/operator/dashboard/tasks` | `/api/admin/dashboard/kpi` |
| 권한 | OPERATOR, TENANT_ADMIN | TENANT_ADMIN only |
| 주요 관심사 | 운영 작업 (대기 작업, 강사 배정) | 전체 현황 KPI |
| 사용자 통계 | 없음 | UserStats (상태별, 신규 가입) |
| 프로그램 통계 | 승인 대기 수만 | ProgramStats (상태별 전체) |
| 차수 통계 | CourseTimeStats (상세) | 없음 |
| 추이 데이터 | 일별 (30일) | 월별 (12개월) |

### 쿼리 재사용

Phase 1-3에서 구축한 통계 집계 쿼리 인프라를 재사용:

- `UserRepository.countByTenantIdGroupByStatus()` - Phase 1
- `EnrollmentRepository.countByTenantIdGroupByStatus()` - Phase 1
- `EnrollmentRepository.getCompletionRateByTenantId()` - Phase 1
- `ProgramRepository.countByTenantIdGroupByStatus()` - Phase 4 (신규)

---

## 10. 테스트 케이스 (8개)

### AdminDashboardServiceTest (3개)

| 테스트 | 검증 내용 |
|--------|----------|
| getKpiStats_success | 정상 통계 조회, 모든 필드 값 검증 |
| getKpiStats_success_noData | 데이터 없을 때 기본값 (0, BigDecimal.ZERO) |
| getKpiStats_success_partialData | 일부 상태만 있을 때 없는 상태는 0 |

### AdminDashboardControllerTest (5개)

| 테스트 | 검증 내용 |
|--------|----------|
| getKpiStats_success | 정상 응답 (200), JSON 구조 검증 |
| getKpiStats_success_noData | 빈 데이터 응답 |
| getKpiStats_fail_operatorUnauthorized | OPERATOR 접근 시 403 |
| getKpiStats_fail_unauthorized | 일반 사용자 접근 시 403 |
| getKpiStats_fail_noAuth | 인증 없이 접근 시 403 |

---

## 11. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] @RestController 사용
- [x] @RequiredArgsConstructor 사용
- [x] URL 케밥케이스 (`/api/admin/dashboard/kpi`)
- [x] @PreAuthorize 권한 검증 (TENANT_ADMIN only)
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
- [x] Projection 인터페이스로 집계 결과 반환

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

## 12. 테스트 결과

### 전체 테스트 실행

```
BUILD SUCCESSFUL
All tests passed
```

### 신규 테스트 결과

| 테스트 클래스 | 케이스 수 | 결과 |
|--------------|-----------|------|
| AdminDashboardServiceTest | 3개 | ✅ 전체 통과 |
| AdminDashboardControllerTest | 5개 | ✅ 전체 통과 |

---

## 13. 다음 작업 (Phase 5)

### 이슈 #197 - OWNER 통계 API

OWNER 역할의 경영 통계 대시보드:

- 본인 소유 프로그램/차수에 대한 통계
- 소유권(ownership) 기반 필터링 필요
- 매출 관련 통계 포함 가능

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | Phase 4 구현 완료 (TENANT_ADMIN KPI 대시보드 API) |

---

*최종 업데이트: 2025-12-28*

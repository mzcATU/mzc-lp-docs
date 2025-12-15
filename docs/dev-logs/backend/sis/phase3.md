# Backend SIS 모듈 개발 로그 - Phase 3

> SIS 모듈 학습 통계 API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | 신동구 |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#56](https://github.com/mzcATU/mzc-lp-backend/issues/56) |
| **담당 모듈** | SIS (Student Information System - 수강 관리) |
| **브랜치** | `feat/sis-stats` |

---

## 1. 구현 개요

수강 통계 조회 API 구현:

| 구성요소 | 내용 |
|----------|------|
| API | 차수별/사용자별 통계 조회 2개 엔드포인트 |
| Service | EnrollmentStatsService 인터페이스 및 구현체 |
| Repository | 통계 조회용 쿼리 메서드 5개 |
| DTO | Response 2개 (차수별/사용자별) |

---

## 2. API 엔드포인트 (2개)

### 2.1 차수별 수강 통계

```
GET /api/ts/course-times/{courseTimeId}/enrollments/stats
```

**권한**: OPERATOR, TENANT_ADMIN
**응답 예시**:
```json
{
  "success": true,
  "data": {
    "courseTimeId": 1,
    "totalEnrollments": 30,
    "enrolledCount": 15,
    "completedCount": 10,
    "droppedCount": 3,
    "failedCount": 2,
    "averageProgress": 65.50,
    "completionRate": 33.33
  }
}
```

### 2.2 사용자별 수강 통계

```
GET /api/users/{userId}/enrollments/stats
```

**권한**: OPERATOR, TENANT_ADMIN
**응답 예시**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "totalEnrollments": 10,
    "completedCount": 7,
    "inProgressCount": 2,
    "droppedCount": 0,
    "failedCount": 1,
    "completionRate": 70.00,
    "averageScore": 85.50,
    "averageProgress": 75.20
  }
}
```

---

## 3. 신규 생성 파일 (4개)

### Response DTO (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeEnrollmentStatsResponse.java | `dto/response/` | 차수별 통계 (8개 필드) |
| UserEnrollmentStatsResponse.java | `dto/response/` | 사용자별 통계 (9개 필드) |

### Service (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentStatsService.java | `service/` | 통계 서비스 인터페이스 |
| EnrollmentStatsServiceImpl.java | `service/` | 통계 서비스 구현체 |

---

## 4. 수정된 파일 (2개)

### EnrollmentRepository.java

통계 조회용 메서드 5개 추가:

```java
// 차수별 평균 진도율
@Query("SELECT AVG(e.progressPercent) FROM Enrollment e WHERE e.courseTimeId = :courseTimeId AND e.tenantId = :tenantId")
Double findAverageProgressByCourseTimeId(@Param("courseTimeId") Long courseTimeId, @Param("tenantId") Long tenantId);

// 차수별 전체 카운트
long countByCourseTimeIdAndTenantId(Long courseTimeId, Long tenantId);

// 사용자별 평균 진도율
@Query("SELECT AVG(e.progressPercent) FROM Enrollment e WHERE e.userId = :userId AND e.tenantId = :tenantId")
Double findAverageProgressByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);

// 사용자별 평균 점수 (수료한 과정만)
@Query("SELECT AVG(e.score) FROM Enrollment e WHERE e.userId = :userId AND e.tenantId = :tenantId AND e.status = 'COMPLETED' AND e.score IS NOT NULL")
Double findAverageScoreByUserId(@Param("userId") Long userId, @Param("tenantId") Long tenantId);
```

### EnrollmentController.java

통계 엔드포인트 2개 추가:
- `getCourseTimeStats(Long courseTimeId)`
- `getUserStats(Long userId)`

---

## 5. Response DTO 상세

### 5.1 CourseTimeEnrollmentStatsResponse

차수별 수강 통계 응답:

```java
public record CourseTimeEnrollmentStatsResponse(
        Long courseTimeId,
        Long totalEnrollments,          // 총 수강생 수
        Long enrolledCount,             // 수강 중
        Long completedCount,            // 수료
        Long droppedCount,              // 중도 탈락
        Long failedCount,               // 미수료
        BigDecimal averageProgress,     // 평균 진도율 (0-100)
        BigDecimal completionRate       // 수료율 (%)
) {
    public static CourseTimeEnrollmentStatsResponse of(
            Long courseTimeId,
            Long totalEnrollments,
            Long enrolledCount,
            Long completedCount,
            Long droppedCount,
            Long failedCount,
            Double averageProgress
    ) {
        // 평균 진도율 (소수점 2자리)
        BigDecimal avgProgress = averageProgress != null
                ? BigDecimal.valueOf(averageProgress).setScale(2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        // 수료율 계산
        BigDecimal completionRate = totalEnrollments > 0
                ? BigDecimal.valueOf(completedCount * 100.0 / totalEnrollments).setScale(2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        return new CourseTimeEnrollmentStatsResponse(...);
    }
}
```

### 5.2 UserEnrollmentStatsResponse

사용자별 수강 통계 응답:

```java
public record UserEnrollmentStatsResponse(
        Long userId,
        Long totalEnrollments,          // 총 수강 횟수
        Long completedCount,            // 수료 횟수
        Long inProgressCount,           // 진행 중
        Long droppedCount,              // 중도 탈락
        Long failedCount,               // 미수료
        BigDecimal completionRate,      // 수료율 (%)
        BigDecimal averageScore,        // 평균 점수 (수료한 과정만)
        BigDecimal averageProgress      // 평균 진도율
) {
    public static UserEnrollmentStatsResponse of(
            Long userId,
            Long totalEnrollments,
            Long completedCount,
            Long inProgressCount,
            Long droppedCount,
            Long failedCount,
            Double averageScore,
            Double averageProgress
    ) {
        // 수료율 계산
        BigDecimal completionRate = totalEnrollments > 0
                ? BigDecimal.valueOf(completedCount * 100.0 / totalEnrollments).setScale(2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        // 평균 점수 (소수점 2자리, null 가능)
        BigDecimal avgScore = averageScore != null
                ? BigDecimal.valueOf(averageScore).setScale(2, BigDecimal.ROUND_HALF_UP)
                : null;

        // 평균 진도율 (소수점 2자리)
        BigDecimal avgProgress = averageProgress != null
                ? BigDecimal.valueOf(averageProgress).setScale(2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        return new UserEnrollmentStatsResponse(...);
    }
}
```

---

## 6. Service 계층 구현

### 6.1 차수별 통계 조회

```java
@Override
public CourseTimeEnrollmentStatsResponse getCourseTimeStats(Long courseTimeId) {
    Long tenantId = getCurrentTenantId();

    // 차수 존재 확인
    courseTimeRepository.findByIdAndTenantId(courseTimeId, tenantId)
            .orElseThrow(() -> new CourseTimeNotFoundException(courseTimeId));

    // 전체 수강생 수
    long totalEnrollments = enrollmentRepository.countByCourseTimeIdAndTenantId(courseTimeId, tenantId);

    // 상태별 카운트
    long enrolledCount = enrollmentRepository.countByCourseTimeIdAndStatusAndTenantId(
            courseTimeId, EnrollmentStatus.ENROLLED, tenantId);
    long completedCount = enrollmentRepository.countByCourseTimeIdAndStatusAndTenantId(
            courseTimeId, EnrollmentStatus.COMPLETED, tenantId);
    long droppedCount = enrollmentRepository.countByCourseTimeIdAndStatusAndTenantId(
            courseTimeId, EnrollmentStatus.DROPPED, tenantId);
    long failedCount = enrollmentRepository.countByCourseTimeIdAndStatusAndTenantId(
            courseTimeId, EnrollmentStatus.FAILED, tenantId);

    // 평균 진도율
    Double averageProgress = enrollmentRepository.findAverageProgressByCourseTimeId(courseTimeId, tenantId);

    return CourseTimeEnrollmentStatsResponse.of(
            courseTimeId,
            totalEnrollments,
            enrolledCount,
            completedCount,
            droppedCount,
            failedCount,
            averageProgress
    );
}
```

### 6.2 사용자별 통계 조회

```java
@Override
public UserEnrollmentStatsResponse getUserStats(Long userId) {
    Long tenantId = getCurrentTenantId();

    // 사용자 존재 확인
    userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException(userId));

    // 전체 수강 횟수
    long totalEnrollments = enrollmentRepository.countByUserIdAndTenantId(userId, tenantId);

    // 상태별 카운트
    long completedCount = enrollmentRepository.countByUserIdAndStatusAndTenantId(
            userId, EnrollmentStatus.COMPLETED, tenantId);
    long inProgressCount = enrollmentRepository.countByUserIdAndStatusAndTenantId(
            userId, EnrollmentStatus.ENROLLED, tenantId);
    long droppedCount = enrollmentRepository.countByUserIdAndStatusAndTenantId(
            userId, EnrollmentStatus.DROPPED, tenantId);
    long failedCount = enrollmentRepository.countByUserIdAndStatusAndTenantId(
            userId, EnrollmentStatus.FAILED, tenantId);

    // 평균 점수 (수료한 과정만)
    Double averageScore = enrollmentRepository.findAverageScoreByUserId(userId, tenantId);

    // 평균 진도율
    Double averageProgress = enrollmentRepository.findAverageProgressByUserId(userId, tenantId);

    return UserEnrollmentStatsResponse.of(
            userId,
            totalEnrollments,
            completedCount,
            inProgressCount,
            droppedCount,
            failedCount,
            averageScore,
            averageProgress
    );
}
```

---

## 7. 통계 계산 로직

### 7.1 수료율 계산

```java
BigDecimal completionRate = totalEnrollments > 0
        ? BigDecimal.valueOf(completedCount * 100.0 / totalEnrollments)
                     .setScale(2, BigDecimal.ROUND_HALF_UP)
        : BigDecimal.ZERO;
```

- 전체 수강 횟수가 0이면 0% 반환
- 수료 횟수 / 전체 수강 횟수 * 100
- 소수점 2자리 반올림

### 7.2 평균 점수 계산

```sql
SELECT AVG(e.score)
FROM Enrollment e
WHERE e.userId = :userId
  AND e.tenantId = :tenantId
  AND e.status = 'COMPLETED'
  AND e.score IS NOT NULL
```

- **수료(COMPLETED)** 상태만 대상
- 점수가 입력된 경우만 평균 계산
- NULL 점수는 제외

### 7.3 평균 진도율 계산

```sql
SELECT AVG(e.progressPercent)
FROM Enrollment e
WHERE e.courseTimeId = :courseTimeId
  AND e.tenantId = :tenantId
```

- 모든 상태의 수강생 포함
- 진도율 0~100% 범위

---

## 8. 권한 제어

### OPERATOR, TENANT_ADMIN 전용

```java
@GetMapping("/api/ts/course-times/{courseTimeId}/enrollments/stats")
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<ApiResponse<CourseTimeEnrollmentStatsResponse>> getCourseTimeStats(
        @PathVariable Long courseTimeId
) {
    // ...
}
```

- 운영자만 통계 조회 가능
- 일반 사용자(USER)는 접근 불가

---

## 9. 빌드 및 테스트 결과

### 9.1 빌드 결과

```bash
./gradlew clean build -x test

BUILD SUCCESSFUL in 6s
6 actionable tasks: 6 executed
```

### 9.2 테스트 결과

```bash
./gradlew test

BUILD SUCCESSFUL in 40s
전체 테스트 통과
```

### 9.3 MySQL 데이터 확인

```sql
-- 기존 데이터 확인
SELECT COUNT(*) as total_count FROM sis_enrollments;
-- 결과: 3건

SELECT status, COUNT(*) as count
FROM sis_enrollments
GROUP BY status;
-- 결과:
-- ENROLLED: 2
-- COMPLETED: 1
```

---

## 10. 활용 시나리오

### 10.1 차수별 통계 (운영자 대시보드)

**사용 목적**: 차수별 수강 현황 모니터링

- 총 수강생 수 확인
- 수료율 파악 (목표 대비 달성률)
- 평균 진도율로 학습 참여도 측정
- 중도 탈락율 분석

**예시**:
```
차수: Spring Boot 기초 1기
- 총 수강생: 30명
- 수강 중: 15명 (50%)
- 수료: 10명 (33.33%)
- 중도 탈락: 3명 (10%)
- 평균 진도율: 65.5%
```

### 10.2 사용자별 통계 (학습자 관리)

**사용 목적**: 개별 학습자 성과 추적

- 총 수강 이력 확인
- 수료율로 학습 성실도 파악
- 평균 점수로 학습 역량 평가
- 반복 수강 패턴 분석

**예시**:
```
사용자: 홍길동
- 총 수강 횟수: 10회
- 수료: 7회 (70%)
- 평균 점수: 85.5점
- 평균 진도율: 75.2%
```

---

## 11. 제약사항 및 TODO

### 11.1 현재 제약사항

1. **TenantId 하드코딩**
   ```java
   private Long getCurrentTenantId() {
       // TODO: SecurityContext에서 tenantId 추출
       return 1L;
   }
   ```
   - 멀티 테넌트 지원 전까지 임시 구현

2. **통합 테스트 미실시**
   - 단위 테스트 통과
   - 서버 실행 후 실제 API 호출 테스트 필요

3. **캐싱 미적용**
   - 매번 DB 쿼리 실행
   - 대용량 데이터 시 성능 이슈 가능성

### 11.2 향후 개선 사항

- [ ] TenantContext 구현 후 tenantId 추출 로직 변경
- [ ] 통계 결과 캐싱 (Redis)
- [ ] 기간별 통계 API 추가 (월별, 분기별)
- [ ] 엑셀 다운로드 기능
- [ ] 차트 데이터 형식 지원 (시계열 통계)

---

## 12. 커밋 메시지

```
feat(sis): 학습 통계 API 구현

- 차수별 수강 통계 API 구현
  - GET /api/ts/course-times/{id}/enrollments/stats
  - 총 수강생, 상태별 카운트, 평균 진도율, 수료율
- 사용자별 수강 통계 API 구현
  - GET /api/users/{userId}/enrollments/stats
  - 총 수강 횟수, 수료율, 평균 점수, 평균 진도율
- EnrollmentStatsService 및 구현체 추가
- 통계 조회용 Repository 메서드 5개 추가
- Response DTO 2개 추가

Closes #56
```

---

## 13. 참고 자료

- [Issue #56: SIS - 학습 통계 API](https://github.com/mzcATU/mzc-lp-backend/issues/56)
- [PR: feat(sis): 학습 통계 API 구현](https://github.com/mzcATU/mzc-lp-backend/pull/new/feat/sis-stats)
- [Phase 1: SIS 기반 구조 구현](./phase1.md)
- [Phase 2: SIS 수강신청 CRUD API](./phase2.md)

# Backend Stats 모듈 개발 로그 - Phase 2

> 수강생 학습 통계 API (마이페이지용)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#132](https://github.com/mzcATU/mzc-lp-backend/issues/132) |
| **담당 모듈** | Stats (Statistics - 통계) / SIS (Student Information System) |

---

## 1. 구현 개요

수강생 본인의 학습 통계 조회 API 구현 (마이페이지용):

| 구성요소 | 내용 |
|----------|------|
| API | `GET /api/users/me/learning-stats` |
| DTO | MyLearningStatsResponse (중첩 record) |
| Service | EnrollmentStatsService.getMyLearningStats() |
| Repository Query | countByUserIdGroupByType 추가 |
| Test | Service 3개, Controller 3개 |

---

## 2. API 스펙

### 엔드포인트

```
GET /api/users/me/learning-stats
Authorization: Bearer {accessToken}
Role: 인증된 사용자 (본인)
```

### Response

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCourses": 10,
      "inProgress": 3,
      "completed": 6,
      "dropped": 1,
      "failed": 0,
      "completionRate": 60.0,
      "byType": {
        "voluntary": 8,
        "mandatory": 2
      }
    },
    "progress": {
      "averageProgress": 75.5,
      "averageScore": 85.2
    }
  }
}
```

### 응답 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| overview.totalCourses | Long | 총 수강 횟수 |
| overview.inProgress | Long | 진행 중인 강의 수 |
| overview.completed | Long | 수료한 강의 수 |
| overview.dropped | Long | 중도 탈락 강의 수 |
| overview.failed | Long | 미수료 강의 수 |
| overview.completionRate | BigDecimal | 수료율 (%) |
| overview.byType.voluntary | Long | 자발적 수강 횟수 |
| overview.byType.mandatory | Long | 필수 교육 횟수 |
| progress.averageProgress | BigDecimal | 평균 진도율 (%) |
| progress.averageScore | BigDecimal | 평균 점수 (수료한 강의만, null 가능) |

---

## 3. 신규 생성 파일 (2개)

### DTO

| 파일 | 경로 | 설명 |
|------|------|------|
| MyLearningStatsResponse.java | `domain/student/dto/response/` | 내 학습 통계 Response (중첩 record) |

### Test

| 파일 | 경로 | 설명 |
|------|------|------|
| EnrollmentStatsServiceTest.java | `test/.../student/service/` | 통계 Service 단위 테스트 |

---

## 4. 수정 파일 (5개)

### EnrollmentRepository.java

```java
// 추가된 쿼리
@Query("SELECT e.type AS type, COUNT(e) AS count " +
        "FROM Enrollment e " +
        "WHERE e.userId = :userId " +
        "AND e.tenantId = :tenantId " +
        "GROUP BY e.type")
List<TypeCountProjection> countByUserIdGroupByType(
        @Param("userId") Long userId,
        @Param("tenantId") Long tenantId);
```

### EnrollmentStatsService.java

```java
// 추가된 인터페이스 메서드
MyLearningStatsResponse getMyLearningStats(Long userId);
```

### EnrollmentStatsServiceImpl.java

```java
// 추가된 구현 메서드
@Override
public MyLearningStatsResponse getMyLearningStats(Long userId) {
    // 상태별 카운트, 유형별 카운트, 평균 진도율, 평균 점수 조회
    // ...
}
```

### EnrollmentController.java

```java
// 추가된 엔드포인트
@GetMapping("/api/users/me/learning-stats")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ApiResponse<MyLearningStatsResponse>> getMyLearningStats(
        @AuthenticationPrincipal UserPrincipal principal
) {
    MyLearningStatsResponse response = enrollmentStatsService.getMyLearningStats(principal.id());
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

### EnrollmentControllerTest.java

```java
// 추가된 테스트 클래스
@Nested
@DisplayName("GET /api/users/me/learning-stats - 내 학습 통계 조회")
class GetMyLearningStats {
    // 3개 테스트 케이스
}
```

---

## 5. 파일 구조

```
domain/student/
├── dto/response/
│   └── MyLearningStatsResponse.java    ✅ 신규
├── repository/
│   └── EnrollmentRepository.java       ✏️ 수정 (쿼리 1개 추가)
├── service/
│   ├── EnrollmentStatsService.java     ✏️ 수정 (메서드 1개 추가)
│   └── EnrollmentStatsServiceImpl.java ✏️ 수정 (구현 1개 추가)
└── controller/
    └── EnrollmentController.java       ✏️ 수정 (엔드포인트 1개 추가)

test/.../student/
├── service/
│   └── EnrollmentStatsServiceTest.java ✅ 신규 (3개 테스트)
└── controller/
    └── EnrollmentControllerTest.java   ✏️ 수정 (3개 테스트 추가)
```

---

## 6. MyLearningStatsResponse 구조

### 설계 의도

이슈 스펙의 중첩 JSON 구조를 그대로 반영하기 위해 중첩 record 사용:

```java
public record MyLearningStatsResponse(
        Overview overview,
        Progress progress
) {
    public record Overview(
            Long totalCourses,
            Long inProgress,
            Long completed,
            Long dropped,
            Long failed,
            BigDecimal completionRate,
            ByType byType
    ) {
        public record ByType(Long voluntary, Long mandatory) { }
    }

    public record Progress(
            BigDecimal averageProgress,
            BigDecimal averageScore
    ) { }

    public static MyLearningStatsResponse of(...) { }
}
```

### 기존 패턴과의 일관성

| 항목 | 기존 패턴 | 구현 |
|------|----------|------|
| 정적 팩토리 | `UserEnrollmentStatsResponse.of()` | `MyLearningStatsResponse.of()` |
| BigDecimal 처리 | `setScale(2, HALF_UP)` | `setScale(1, HALF_UP)` (소수점 1자리) |
| null 처리 | `averageScore != null ? ... : null` | 동일 |

---

## 7. Service 로직 상세

### 조회 흐름

```
1. TenantContext에서 tenantId 조회
2. 전체 수강 횟수 조회 (countByUserIdAndTenantId)
3. 상태별 카운트 조회 (COMPLETED, ENROLLED, DROPPED, FAILED)
4. 유형별 카운트 조회 (countByUserIdGroupByType)
   → Map 변환 → VOLUNTARY, MANDATORY 추출
5. 평균 진도율 조회 (findAverageProgressByUserId)
6. 평균 점수 조회 (findAverageScoreByUserId) - 수료한 강의만
7. MyLearningStatsResponse.of()로 응답 생성
```

### 기존 getUserStats()와의 차이

| 항목 | getUserStats() | getMyLearningStats() |
|------|----------------|----------------------|
| 대상 | 관리자가 타인 조회 | 본인 조회 |
| 권한 | OPERATOR, TENANT_ADMIN | isAuthenticated() |
| 사용자 검증 | userRepository.findById() | 생략 (인증된 사용자) |
| 유형별 통계 | 없음 | byType (voluntary/mandatory) |
| Response | UserEnrollmentStatsResponse | MyLearningStatsResponse |

---

## 8. 테스트 케이스 (6개)

### EnrollmentStatsServiceTest (3개)

| 테스트 | 검증 내용 |
|--------|----------|
| getMyLearningStats_success | 정상 통계 조회, 모든 필드 값 검증 |
| getMyLearningStats_success_noEnrollments | 수강 이력 없을 때 기본값 (0, null) |
| getMyLearningStats_success_onlyVoluntary | 자발적 수강만 있을 때 mandatory=0 |

### EnrollmentControllerTest (3개)

| 테스트 | 검증 내용 |
|--------|----------|
| getMyLearningStats_success | 정상 응답 (200), JSON 구조 검증 |
| getMyLearningStats_success_empty | 빈 데이터 응답, completionRate=0 |
| getMyLearningStats_fail_unauthorized | 인증 없이 접근 시 403 |

---

## 9. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] @RestController 사용
- [x] URL 케밥케이스 (`/api/users/me/learning-stats`)
- [x] @PreAuthorize 권한 검증
- [x] ApiResponse.success() 래핑
- [x] try-catch 금지

### Service (04-SERVICE-CONVENTIONS)

- [x] @Transactional(readOnly=true) 클래스 레벨
- [x] @Slf4j 로깅 (log.debug)
- [x] TenantContext 멀티테넌시 필터링

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] @Query + @Param 사용
- [x] tenantId 필터링 필수
- [x] TypeCountProjection 사용

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] 정적 팩토리 메서드 (of)
- [x] 중첩 DTO는 내부 record

---

## 10. 테스트 결과

### 전체 테스트 실행

```
BUILD SUCCESSFUL
573 tests completed
```

### 신규 테스트 결과

| 테스트 클래스 | 케이스 수 | 결과 |
|--------------|-----------|------|
| EnrollmentStatsServiceTest | 3개 | ✅ 전체 통과 |
| EnrollmentControllerTest (추가분) | 3개 | ✅ 전체 통과 |

---

## 11. 다음 작업 (Phase 2, 3)

### Phase 2 (별도 이슈 예정)

- Enrollment에 `lastAccessedAt` 필드 추가
- recentActivity 기능 (최근 학습 활동)
- 학습 시간 추적 기능

### Phase 3 (별도 이슈 예정)

- Certificate (수료증) 도메인 구현
- 월별 추이 통계

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | Phase 2 구현 완료 (내 학습 통계 API) |

---

*최종 업데이트: 2025-12-28*

# Backend Stats 모듈 개발 로그 - Phase 1

> 통계 집계 쿼리 인프라 구축 (Projection, Repository Query)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#194](https://github.com/mzcATU/mzc-lp-backend/issues/194) |
| **담당 모듈** | Stats (Statistics - 통계 집계) |

---

## 1. 구현 개요

통계 API를 위한 Repository 레이어 집계 쿼리 인프라 구축:

| 구성요소 | 내용 |
|----------|------|
| Projection | 5개 인터페이스 (GROUP BY 결과 매핑) |
| Repository Query | CourseTime 7개, Enrollment 11개, User 5개 |
| Test | CourseTimeRepositoryTest 10개 케이스 |

---

## 2. 신규 생성 파일 (5개)

### Projection 인터페이스 (common/dto/stats/)

| 파일 | 경로 | 설명 |
|------|------|------|
| StatusCountProjection.java | `common/dto/stats/` | 상태별 카운트 (status, count) |
| TypeCountProjection.java | `common/dto/stats/` | 타입별 카운트 (type, count) |
| DailyCountProjection.java | `common/dto/stats/` | 일별 카운트 (date, count) |
| MonthlyCountProjection.java | `common/dto/stats/` | 월별 카운트 (year, month, count) |
| BooleanCountProjection.java | `common/dto/stats/` | Boolean별 카운트 (value, count) |

---

## 3. 수정 파일 (3개)

### CourseTimeRepository.java

```java
// 추가된 통계 쿼리 (7개)
List<StatusCountProjection> countByTenantIdGroupByStatus(@Param("tenantId") Long tenantId);
List<TypeCountProjection> countByTenantIdGroupByType(@Param("tenantId") Long tenantId);
List<BooleanCountProjection> countByTenantIdGroupByFree(@Param("tenantId") Long tenantId);
Long countByTenantId(@Param("tenantId") Long tenantId);
Double getAverageCapacityUtilization(@Param("tenantId") Long tenantId);
List<StatusCountProjection> countByCourseIdAndTenantIdGroupByStatus(...);
Long countByCourseIdAndTenantId(...);
```

### EnrollmentRepository.java

```java
// 추가된 통계 쿼리 (11개)
List<StatusCountProjection> countByTenantIdGroupByStatus(@Param("tenantId") Long tenantId);
List<TypeCountProjection> countByTenantIdGroupByType(@Param("tenantId") Long tenantId);
List<DailyCountProjection> countByTenantIdGroupByEnrollmentDate(@Param("tenantId") Long tenantId);
List<MonthlyCountProjection> countByTenantIdGroupByMonth(@Param("tenantId") Long tenantId);
Long countByTenantId(@Param("tenantId") Long tenantId);
Long countCompletedByTenantId(@Param("tenantId") Long tenantId);
Double getAverageProgressByTenantId(@Param("tenantId") Long tenantId);
List<StatusCountProjection> countByCourseTimeIdAndTenantIdGroupByStatus(...);
Long countByCourseTimeIdAndTenantId(...);
Long countCompletedByCourseTimeIdAndTenantId(...);
Double getAverageProgressByCourseTimeIdAndTenantId(...);
```

### UserRepository.java

```java
// 추가된 통계 쿼리 (5개)
List<StatusCountProjection> countByTenantIdGroupByStatus(@Param("tenantId") Long tenantId);
List<TypeCountProjection> countByTenantIdGroupByRole(@Param("tenantId") Long tenantId);
Long countByTenantId(@Param("tenantId") Long tenantId);
Long countActiveByTenantId(@Param("tenantId") Long tenantId);
Long countNewUsersSince(@Param("tenantId") Long tenantId, @Param("since") LocalDateTime since);
```

---

## 4. 파일 구조

```
common/dto/stats/
├── StatusCountProjection.java      ✅ 신규
├── TypeCountProjection.java        ✅ 신규
├── DailyCountProjection.java       ✅ 신규
├── MonthlyCountProjection.java     ✅ 신규
└── BooleanCountProjection.java     ✅ 신규

domain/ts/repository/
└── CourseTimeRepository.java       ✏️ 수정 (7개 쿼리 추가)

domain/sis/repository/
└── EnrollmentRepository.java       ✏️ 수정 (11개 쿼리 추가)

domain/um/repository/
└── UserRepository.java             ✏️ 수정 (5개 쿼리 추가)

domain/ts/repository/
└── CourseTimeRepositoryTest.java   ✏️ 수정 (10개 테스트 추가)
```

---

## 5. Projection 인터페이스 설계

### 설계 배경

Spring Data JPA에서 GROUP BY 쿼리 결과를 매핑하는 방법:

| 방법 | 장점 | 단점 |
|------|------|------|
| `List<Object[]>` | 구현 간단 | 타입 안전성 없음, 인덱스 접근 |
| **Projection 인터페이스** | 타입 안전, 가독성 | 인터페이스 정의 필요 |
| DTO 클래스 | 타입 안전, 로직 추가 가능 | 생성자 매핑 복잡 |

**Projection 인터페이스 채택 이유:**
- 타입 안전성 보장
- 인터페이스 기반으로 Spring이 자동 프록시 생성
- getter 메서드명으로 쿼리 alias 매핑

### Projection 상세

| Projection | 메서드 | 용도 |
|------------|--------|------|
| StatusCountProjection | `getStatus()`, `getCount()` | 상태별 집계 |
| TypeCountProjection | `getType()`, `getCount()` | 타입/역할별 집계 |
| DailyCountProjection | `getDate()`, `getCount()` | 일별 추이 |
| MonthlyCountProjection | `getYear()`, `getMonth()`, `getCount()` | 월별 추이 |
| BooleanCountProjection | `getValue()`, `getCount()` | Boolean 그룹핑 |

---

## 6. Repository 쿼리 상세

### CourseTimeRepository (7개)

| 쿼리 메서드 | 반환 타입 | 설명 |
|-------------|-----------|------|
| countByTenantIdGroupByStatus | `List<StatusCountProjection>` | 상태별 차수 카운트 |
| countByTenantIdGroupByType | `List<TypeCountProjection>` | 운영방식별 차수 카운트 |
| countByTenantIdGroupByFree | `List<BooleanCountProjection>` | 무료/유료별 차수 카운트 |
| countByTenantId | `Long` | 전체 차수 카운트 |
| getAverageCapacityUtilization | `Double` | 평균 정원 활용률 |
| countByCourseIdAndTenantIdGroupByStatus | `List<StatusCountProjection>` | 과정별 상태별 차수 카운트 |
| countByCourseIdAndTenantId | `Long` | 과정별 전체 차수 카운트 |

### EnrollmentRepository (11개)

| 쿼리 메서드 | 반환 타입 | 설명 |
|-------------|-----------|------|
| countByTenantIdGroupByStatus | `List<StatusCountProjection>` | 상태별 수강 카운트 |
| countByTenantIdGroupByType | `List<TypeCountProjection>` | 타입별 수강 카운트 |
| countByTenantIdGroupByEnrollmentDate | `List<DailyCountProjection>` | 일별 등록 추이 |
| countByTenantIdGroupByMonth | `List<MonthlyCountProjection>` | 월별 등록 추이 |
| countByTenantId | `Long` | 전체 수강 카운트 |
| countCompletedByTenantId | `Long` | 완료 수강 카운트 |
| getAverageProgressByTenantId | `Double` | 평균 진도율 |
| countByCourseTimeIdAndTenantIdGroupByStatus | `List<StatusCountProjection>` | 차수별 상태별 수강 카운트 |
| countByCourseTimeIdAndTenantId | `Long` | 차수별 전체 수강 카운트 |
| countCompletedByCourseTimeIdAndTenantId | `Long` | 차수별 완료 수강 카운트 |
| getAverageProgressByCourseTimeIdAndTenantId | `Double` | 차수별 평균 진도율 |

### UserRepository (5개)

| 쿼리 메서드 | 반환 타입 | 설명 |
|-------------|-----------|------|
| countByTenantIdGroupByStatus | `List<StatusCountProjection>` | 상태별 사용자 카운트 |
| countByTenantIdGroupByRole | `List<TypeCountProjection>` | 역할별 사용자 카운트 |
| countByTenantId | `Long` | 전체 사용자 카운트 |
| countActiveByTenantId | `Long` | 활성 사용자 카운트 |
| countNewUsersSince | `Long` | 특정 일자 이후 신규 사용자 수 |

---

## 7. 테스트 케이스 (10개)

### CourseTimeRepositoryTest - StatsQueryTest

| 테스트 | 기대 결과 |
|--------|----------|
| countByTenantIdGroupByStatus_success | 상태별 카운트 반환 |
| countByTenantIdGroupByType_success | 운영방식별 카운트 반환 |
| countByTenantIdGroupByFree_success | 무료/유료별 카운트 반환 |
| countByTenantId_success | 전체 카운트 반환 |
| getAverageCapacityUtilization_success | 평균 활용률 반환 |
| countByCourseIdAndTenantIdGroupByStatus_success | 과정별 상태별 카운트 반환 |
| countByCourseIdAndTenantId_success | 과정별 전체 카운트 반환 |
| countByTenantIdGroupByStatus_empty | 빈 리스트 반환 |
| countByTenantId_empty | 0 반환 |
| getAverageCapacityUtilization_empty | null 반환 |

---

## 8. 컨벤션 준수 체크

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] 멀티테넌시 필터링 적용 (tenantId 파라미터)
- [x] `@Query` + `@Param` 어노테이션 사용
- [x] JPQL 대문자 키워드 (SELECT, FROM, WHERE, GROUP BY)

### DTO/Projection

- [x] Projection 인터페이스 사용 (타입 안전)
- [x] getter 메서드명과 쿼리 alias 일치
- [x] common 패키지에 공통 Projection 배치

### 코드 스타일 (00-CONVENTIONS-CORE)

- [x] 4-space 들여쓰기
- [x] K&R 브레이스 스타일
- [x] PascalCase 클래스명
- [x] camelCase 메서드명

---

## 9. 테스트 결과

### 전체 테스트 실행

```
BUILD SUCCESSFUL
567 tests completed, 3 skipped
```

### 신규 테스트 결과

| 테스트 클래스 | 케이스 수 | 결과 |
|--------------|-----------|------|
| CourseTimeRepositoryTest.StatsQueryTest | 10개 | ✅ 전체 통과 |

---

## 10. 트러블슈팅

### JPQL 필드명 오류

**문제:**
```
org.hibernate.query.SemanticException: Could not resolve attribute 'isFree'
```

**원인:**
- Entity 필드명은 `free`, getter는 `isFree()`
- JPQL에서는 getter가 아닌 Entity 필드명 사용

**해결:**
```java
// Before (오류)
GROUP BY ct.isFree

// After (정상)
GROUP BY ct.free
```

### 테스트 데이터 중복 저장 오류

**문제:**
- 동일 객체를 두 번 저장하면 1건만 저장됨

**원인:**
- JPA는 영속성 컨텍스트에서 같은 ID의 엔티티는 동일 객체로 취급

**해결:**
```java
// Before (오류)
CourseTime courseTime = createCourseTime();
courseTimeRepository.save(courseTime);
courseTimeRepository.save(courseTime); // 동일 객체

// After (정상)
courseTimeRepository.save(createCourseTime());
courseTimeRepository.save(createFreeCourseTime()); // 새 객체 생성
```

---

## 11. 다음 작업

### 통계 API 구현 (Service/Controller)

| Method | Endpoint | 기능 |
|--------|----------|------|
| GET | `/api/stats/dashboard` | 대시보드 통계 |
| GET | `/api/stats/courses` | 과정 통계 |
| GET | `/api/stats/enrollments` | 수강 통계 |
| GET | `/api/stats/users` | 사용자 통계 |

**필요 작업:**
- StatsService 인터페이스/구현체 작성
- StatsController 작성
- 통계 Response DTO 작성
- 권한 검증 적용 (`@PreAuthorize`)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | Phase 1 구현 완료 (Projection, Repository Query, Test) |

---

*최종 업데이트: 2025-12-28*

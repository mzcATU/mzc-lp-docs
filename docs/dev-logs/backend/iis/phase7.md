# Backend IIS 모듈 개발 로그 - Phase 7

> IIS 강사 배정 통계 API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-18 |
| **관련 이슈** | [#128](https://github.com/mzcATU/mzc-lp-backend/issues/128) |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. 구현 개요

강사 배정 통계 조회 API 구현:

| 구성요소 | 내용 |
|----------|------|
| DTO | InstructorStatisticsResponse, InstructorStatResponse 생성 |
| Repository | 통계 집계 쿼리 메서드 추가 |
| Service | 통계 조회 메서드 추가 |
| Controller | 통계 조회 엔드포인트 추가 |

---

## 2. 신규/수정 파일

### DTO

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorStatisticsResponse.java | 신규 | 전체 통계 응답 DTO |
| InstructorStatResponse.java | 신규 | 강사별 통계 응답 DTO |

### Repository

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentRepository.java | 수정 | 통계 집계 쿼리 메서드 추가 |

### Service

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentService.java | 수정 | getStatistics() 메서드 추가 |
| InstructorAssignmentServiceImpl.java | 수정 | 통계 조회 구현 |

### Controller

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentController.java | 수정 | 통계 조회 엔드포인트 추가 |

---

## 3. API 엔드포인트

### 통계 조회 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/instructor-assignments/statistics` | 전체 통계 조회 | OPERATOR, TENANT_ADMIN |
| GET | `/api/users/{userId}/instructor-statistics` | 강사 개인 통계 조회 | OPERATOR, TENANT_ADMIN |

### 요청/응답

```
GET /api/instructor-assignments/statistics

Response: {
  "success": true,
  "data": {
    "totalAssignments": 100,
    "activeAssignments": 80,
    "byRole": {
      "MAIN": 40,
      "SUB": 35,
      "ASSISTANT": 25
    },
    "byStatus": {
      "ACTIVE": 80,
      "REPLACED": 15,
      "CANCELLED": 5
    },
    "instructorStats": [
      {
        "userId": 1,
        "userName": "홍길동",
        "totalCount": 10,
        "mainCount": 5,
        "subCount": 5
      }
    ]
  }
}
```

---

## 4. DTO 구조

### InstructorStatisticsResponse

```java
public record InstructorStatisticsResponse(
    Long totalAssignments,
    Long activeAssignments,
    Map<InstructorRole, Long> byRole,
    Map<AssignmentStatus, Long> byStatus,
    List<InstructorStatResponse> instructorStats
) {
    public static InstructorStatisticsResponse of(...) { ... }
}
```

### InstructorStatResponse

```java
public record InstructorStatResponse(
    Long userId,
    String userName,
    Long totalCount,
    Long mainCount,
    Long subCount
) {
    public static InstructorStatResponse of(...) { ... }
}
```

---

## 5. Repository 쿼리 메서드

### 추가된 메서드

| 메서드 | 설명 |
|--------|------|
| `countByTenantId()` | 전체 배정 건수 |
| `countByTenantIdAndStatus()` | 상태별 배정 건수 |
| `countGroupByRole()` | 역할별 집계 |
| `countGroupByStatus()` | 상태별 집계 |
| `getInstructorStatistics()` | 강사별 통계 (ACTIVE만) |
| `getInstructorStatisticsByUserId()` | 특정 강사 통계 |

---

## 6. 비즈니스 로직

### 통계 집계 규칙

- 전체 배정 건수: 테넌트 내 모든 배정
- 활성 배정 건수: ACTIVE 상태만
- 역할별 집계: MAIN, SUB, ASSISTANT 각각
- 상태별 집계: ACTIVE, REPLACED, CANCELLED 각각
- 강사별 통계: ACTIVE 배정 기준, mainCount/subCount 분리

### EnumMap 활용

```java
// 역할별 집계
Map<InstructorRole, Long> byRole = new EnumMap<>(InstructorRole.class);
for (InstructorRole role : InstructorRole.values()) {
    byRole.put(role, 0L);
}
// Repository 조회 결과로 업데이트
```

---

## 7. 테스트 결과

### 통합 테스트 (BUILD SUCCESSFUL)

- ✅ 전체 테스트 통과

### 테스트 케이스

| 카테고리 | 테스트 | 검증 |
|----------|--------|------|
| 통계 조회 | 전체 통계 조회 성공 | 집계 데이터 반환 |
| 통계 조회 | 강사별 통계 조회 | 개인 통계 반환 |
| 통계 조회 | 빈 데이터 처리 | 0 값 반환 |

---

## 8. 컨벤션 준수 체크

### DTO (07-DTO-CONVENTIONS)

- [x] Record 타입 사용
- [x] 정적 팩토리 메서드 `of()` 제공

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JPQL 집계 쿼리 작성
- [x] 테넌트 필터링 적용

### Service (03-SERVICE-CONVENTIONS)

- [x] `@Transactional(readOnly = true)` 조회 메서드

---

## 9. 다음 작업

### 완료된 IIS 모듈

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | Entity, Repository, DTO, Exception | ✅ 완료 |
| Phase 2 | Service, Controller | ✅ 완료 |
| Phase 3 | Test Code | ✅ 완료 |
| Phase 4 | 배정 이력 조회 API | ✅ 완료 |
| Phase 5 | 강사 정보 조회 API (User 연동) | ✅ 완료 |
| Phase 6 | API DB 저장 테스트, TS-IIS 연동 | ✅ 완료 |
| Phase 7 | 강사 배정 통계 API | ✅ 완료 |

### 추가 개발 사항

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 높음 | 기간 필터링 통계 | startDate, endDate 파라미터 추가 |
| 높음 | 차수별 상세 통계 | courseTimeStats 포함 |
| 중간 | SIS 연동 | 수강생 수, 수료율 통계 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-18 | Claude Code | Phase 7 구현 완료 (강사 배정 통계 API) |

---

*최종 업데이트: 2025-12-18*

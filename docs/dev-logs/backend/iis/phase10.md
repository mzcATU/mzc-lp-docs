# Backend IIS 모듈 개발 로그 - Phase 10

> IIS 강사 배정 일정 충돌 검사 기능 추가

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-24 |
| **관련 이슈** | - |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. 구현 개요

강사 배정 시 동일 기간 다른 차수에 이미 배정되어 있는지 확인하는 일정 충돌 검사 기능:

| 구성요소 | 내용 |
|----------|------|
| Repository | 기간 겹침 검사 쿼리 메서드 추가 |
| Exception | InstructorScheduleConflictException 생성 |
| Service | 충돌 검사 로직 추가 |
| Test | 충돌 검사 테스트 코드 작성 |

---

## 2. 배경

### 기존 문제점

- 동일 차수 내 중복 배정만 검사
- 동일 기간 다른 차수 배정 여부 미검사
- 강사 일정 충돌 시 운영상 문제 발생 가능

### 개선 사항

- 강사 배정 시 기간 겹침 검사 추가
- 충돌 발생 시 상세 정보 포함한 에러 응답
- 충돌 차수 정보 제공

---

## 3. 신규/수정 파일

### Repository

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentRepository.java | 수정 | findConflictingAssignments() 메서드 추가 |

### Exception

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorScheduleConflictException.java | 신규 | 일정 충돌 예외 클래스 |

### Service

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentServiceImpl.java | 수정 | 충돌 검사 로직 추가 |

### Test

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentServiceTest.java | 수정 | 충돌 검사 테스트 추가 |

---

## 4. 비즈니스 규칙

### 충돌 판단 기준

| 규칙 | 설명 |
|------|------|
| 기간 겹침 | CourseTime의 시작일~종료일 기간이 겹치는 경우 |
| 상태 조건 | ACTIVE 상태의 배정만 충돌 검사 대상 |
| 검사 시점 | assignInstructor() 호출 시 |

### 기간 겹침 조건

```
기존 배정: [startDate1] -------- [endDate1]
신규 배정:       [startDate2] -------- [endDate2]

충돌 조건: startDate1 <= endDate2 AND endDate1 >= startDate2
```

---

## 5. Repository 쿼리

### findConflictingAssignments

```java
@Query("SELECT ia FROM InstructorAssignment ia " +
       "JOIN CourseTime ct ON ia.timeKey = ct.id " +
       "WHERE ia.userKey = :userId " +
       "AND ia.status = 'ACTIVE' " +
       "AND ct.startDate <= :endDate " +
       "AND ct.endDate >= :startDate")
List<InstructorAssignment> findConflictingAssignments(
    @Param("userId") Long userId,
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate
);
```

---

## 6. Exception 구조

### InstructorScheduleConflictException

```java
public class InstructorScheduleConflictException extends BusinessException {

    private final List<ConflictInfo> conflicts;

    public InstructorScheduleConflictException(List<ConflictInfo> conflicts) {
        super(ErrorCode.INSTRUCTOR_SCHEDULE_CONFLICT);
        this.conflicts = conflicts;
    }

    public record ConflictInfo(
        Long timeKey,
        String courseName,
        String timeName,
        LocalDate startDate,
        LocalDate endDate
    ) {}
}
```

### 에러 응답 예시

```json
{
  "success": false,
  "errorCode": "IIS005",
  "message": "강사 일정이 충돌합니다.",
  "data": {
    "conflicts": [
      {
        "timeKey": 100,
        "courseName": "AWS 기초",
        "timeName": "2024년 1차",
        "startDate": "2024-03-01",
        "endDate": "2024-03-31"
      }
    ]
  }
}
```

---

## 7. Service 로직

### assignInstructor 메서드 수정

```java
@Transactional
public InstructorAssignmentResponse assignInstructor(
        Long timeId,
        AssignInstructorRequest request) {

    // 1. CourseTime 조회
    CourseTime courseTime = findCourseTimeById(timeId);

    // 2. 동일 차수 중복 배정 검사 (기존)
    validateDuplicateAssignment(timeId, request.userId());

    // 3. 일정 충돌 검사 (신규)
    validateScheduleConflict(
        request.userId(),
        courseTime.getStartDate(),
        courseTime.getEndDate()
    );

    // 4. MAIN 강사 중복 검사 (기존)
    if (request.role() == InstructorRole.MAIN) {
        validateMainInstructor(timeId);
    }

    // 5. 배정 생성
    // ...
}

private void validateScheduleConflict(
        Long userId,
        LocalDate startDate,
        LocalDate endDate) {

    List<InstructorAssignment> conflicts =
        repository.findConflictingAssignments(userId, startDate, endDate);

    if (!conflicts.isEmpty()) {
        List<ConflictInfo> conflictInfos = conflicts.stream()
            .map(this::toConflictInfo)
            .toList();
        throw new InstructorScheduleConflictException(conflictInfos);
    }
}
```

---

## 8. 테스트 케이스

### 충돌 검사 테스트

| 테스트 | 시나리오 | 기대 결과 |
|--------|----------|-----------|
| 충돌 없음 | 기간이 겹치지 않는 배정 | 배정 성공 |
| 완전 겹침 | 동일 기간 배정 시도 | IIS005 예외 |
| 부분 겹침 (앞) | 기존 종료일 > 신규 시작일 | IIS005 예외 |
| 부분 겹침 (뒤) | 기존 시작일 < 신규 종료일 | IIS005 예외 |
| 포함 관계 | 신규 기간이 기존 기간 포함 | IIS005 예외 |
| CANCELLED 배정 | 취소된 배정과 기간 겹침 | 배정 성공 (무시) |

---

## 9. 컨벤션 준수 체크

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JPQL JOIN 쿼리 작성
- [x] 파라미터 바인딩 (@Param)

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] BusinessException 상속
- [x] ErrorCode 정의
- [x] 상세 정보 포함 (conflicts)

### Service (03-SERVICE-CONVENTIONS)

- [x] 검증 메서드 분리 (validateScheduleConflict)
- [x] 단일 책임 원칙 준수

---

## 10. 다음 작업

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
| Phase 8 | 기간 필터링 및 차수별 상세 통계 | ✅ 완료 |
| Phase 10 | 강사 배정 일정 충돌 검사 | ✅ 완료 |

### 추가 개발 고려 사항

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 낮음 | 강제 배정 옵션 | 충돌 시에도 강제 배정 가능하도록 파라미터 추가 |
| 낮음 | 충돌 미리보기 API | 배정 전 충돌 여부 사전 확인 API |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-24 | Claude Code | Phase 10 구현 완료 (강사 배정 일정 충돌 검사) |

---

*최종 업데이트: 2025-12-24*

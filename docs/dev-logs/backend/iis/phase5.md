# Backend IIS 모듈 개발 로그 - Phase 5

> IIS 강사 정보 조회 API - User 모듈 연동

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-17 |
| **관련 이슈** | [#119](https://github.com/mzcATU/mzc-lp-backend/issues/119) |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. 구현 개요

강사 배정 API 응답에 User 정보(이름, 이메일)를 포함하여 반환하도록 개선:

| 구성요소 | 내용 |
|----------|------|
| DTO | InstructorAssignmentResponse에 userName, userEmail 필드 추가 |
| Service | UserRepository 의존성 추가, 벌크 조회 헬퍼 메서드 구현 |
| Test | UserRepository Mock 및 테스트 케이스 수정 |

---

## 2. 기존 구현 활용

### 이미 구현된 파일 (Phase 1~4)

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignment.java | `entity/` | 강사 배정 엔티티 |
| InstructorAssignmentResponse.java | `dto/response/` | 배정 응답 DTO |
| InstructorAssignmentServiceImpl.java | `service/` | 배정 서비스 구현체 |

---

## 3. 신규/수정 파일

### DTO

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentResponse.java | 수정 | userName, userEmail 필드 추가 |

### Service

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentServiceImpl.java | 수정 | UserRepository 의존성 추가, getUserMapByAssignments() 헬퍼 메서드 추가 |

### Test

| 파일 | 작업 | 설명 |
|------|------|------|
| InstructorAssignmentServiceTest.java | 수정 | UserRepository Mock 추가, 테스트 케이스 수정 |

---

## 4. API 응답 변경

### 기존 응답

```json
{
  "success": true,
  "data": {
    "id": 1,
    "courseTimeId": 100,
    "userId": 10,
    "role": "MAIN",
    "status": "ACTIVE"
  }
}
```

### 변경 후 응답

```json
{
  "success": true,
  "data": {
    "id": 1,
    "courseTimeId": 100,
    "userId": 10,
    "userName": "홍길동",
    "userEmail": "hong@example.com",
    "role": "MAIN",
    "status": "ACTIVE"
  }
}
```

---

## 5. 비즈니스 로직

### User 정보 조회 규칙

- 모든 배정 조회/변경 API에서 User 정보 함께 반환
- User가 존재하지 않는 경우 userName, userEmail은 null 반환
- 하위 호환성 유지 (기존 필드 유지, 신규 필드 추가)

### N+1 방지 전략

- `getUserMapByAssignments()` 헬퍼 메서드로 벌크 조회
- userId 목록 추출 → 한 번의 쿼리로 User 조회 → Map으로 변환

```java
private Map<Long, User> getUserMapByAssignments(List<InstructorAssignment> assignments) {
    List<Long> userIds = assignments.stream()
        .map(InstructorAssignment::getUserId)
        .distinct()
        .toList();

    return userRepository.findAllById(userIds).stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));
}
```

---

## 6. 테스트 결과

### 통합 테스트 (BUILD SUCCESSFUL)

- ✅ 전체 테스트 통과

### 테스트 케이스 수정

| 카테고리 | 테스트 | 변경 내용 |
|----------|--------|----------|
| 배정 조회 | 단건 조회 | UserRepository Mock 추가, userName/userEmail 검증 |
| 배정 조회 | 목록 조회 | UserRepository Mock 추가, User 정보 포함 검증 |
| 배정 생성 | 강사 배정 | 응답에 User 정보 포함 검증 |

---

## 7. 컨벤션 준수 체크

### DTO (07-DTO-CONVENTIONS)

- [x] Response DTO에 필드 추가
- [x] 하위 호환성 유지 (기존 필드 유지)

### Service (03-SERVICE-CONVENTIONS)

- [x] 의존성 주입 (UserRepository)
- [x] 헬퍼 메서드 private 접근 제한자

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Mock 객체 추가
- [x] 신규 필드 검증 추가

---

## 8. 참고 사항

### InstructorAssignmentResponse 변경

```java
public record InstructorAssignmentResponse(
    Long id,
    Long courseTimeId,
    Long userId,
    String userName,      // 추가
    String userEmail,     // 추가
    InstructorRole role,
    AssignmentStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static InstructorAssignmentResponse from(
            InstructorAssignment assignment,
            User user) {  // User 파라미터 추가
        return new InstructorAssignmentResponse(
            assignment.getId(),
            assignment.getCourseTimeId(),
            assignment.getUserId(),
            user != null ? user.getName() : null,
            user != null ? user.getEmail() : null,
            assignment.getRole(),
            assignment.getStatus(),
            assignment.getCreatedAt(),
            assignment.getUpdatedAt()
        );
    }
}
```

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

### 추가 개발 사항

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 높음 | TS ↔ IIS 연동 | CourseTime.open() 시 MAIN 강사 배정 검증 |
| 낮음 | 강사 배정 통계 API | 강사별 배정 현황 통계 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-17 | Claude Code | Phase 5 구현 완료 (강사 정보 조회 API - User 연동) |

---

*최종 업데이트: 2025-12-17*

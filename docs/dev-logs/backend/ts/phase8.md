# Backend TS 모듈 개발 로그 - Phase 8

> TS 삭제 API 소유권 검증 추가

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-24 |
| **관련 이슈** | [#168](https://github.com/mzcATU/mzc-lp-backend/issues/168) |
| **담당 모듈** | TS (Time Schedule - 차수 관리), IIS (Instructor Information System - 강사 배정) |

---

## 1. 구현 개요

TS 삭제 API에 소유권 검증 로직 추가:

| 구성요소 | 내용 |
|----------|------|
| CourseTime 삭제 | 본인이 생성한 차수만 삭제 가능 (TENANT_ADMIN 제외) |
| InstructorAssignment 취소 | 본인이 배정한 건만 취소 가능 (TENANT_ADMIN 제외) |
| 예외 | UnauthorizedCourseTimeAccessException (TS009), UnauthorizedAssignmentAccessException (IIS005) |

---

## 2. 비즈니스 규칙

### 소유권 검증 정책

| 규칙 | 설명 | 구현 |
|------|------|------|
| R-OWN-01 | CourseTime 삭제 시 `createdBy == currentUserId` 검증 | ✅ |
| R-OWN-02 | InstructorAssignment 취소 시 `assignedBy == currentUserId` 검증 | ✅ |
| R-OWN-03 | TENANT_ADMIN은 테넌트 내 모든 리소스 삭제/취소 가능 | ✅ |
| R-OWN-04 | 검증 실패 시 403 Forbidden 응답 | ✅ |

### 역할별 권한

| 역할 | CourseTime 삭제 | Assignment 취소 |
|------|----------------|-----------------|
| OPERATOR | 본인 생성 건만 | 본인 배정 건만 |
| TENANT_ADMIN | 모든 건 | 모든 건 |

---

## 3. 신규 생성 파일 (2개)

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| UnauthorizedCourseTimeAccessException.java | `ts/exception/` | 차수 접근 권한 예외 (TS009) |
| UnauthorizedAssignmentAccessException.java | `iis/exception/` | 배정 접근 권한 예외 (IIS005) |

```java
// UnauthorizedCourseTimeAccessException.java
public class UnauthorizedCourseTimeAccessException extends BusinessException {

    public UnauthorizedCourseTimeAccessException() {
        super(ErrorCode.UNAUTHORIZED_COURSE_TIME_ACCESS);
    }

    public UnauthorizedCourseTimeAccessException(String message) {
        super(ErrorCode.UNAUTHORIZED_COURSE_TIME_ACCESS, message);
    }
}
```

```java
// UnauthorizedAssignmentAccessException.java
public class UnauthorizedAssignmentAccessException extends BusinessException {

    public UnauthorizedAssignmentAccessException() {
        super(ErrorCode.UNAUTHORIZED_ASSIGNMENT_ACCESS);
    }

    public UnauthorizedAssignmentAccessException(String message) {
        super(ErrorCode.UNAUTHORIZED_ASSIGNMENT_ACCESS, message);
    }
}
```

---

## 4. 수정된 파일 (11개)

### 메인 코드 (8개)

| 파일 | 변경 내용 |
|------|----------|
| ErrorCode.java | `UNAUTHORIZED_COURSE_TIME_ACCESS` (TS009), `UNAUTHORIZED_ASSIGNMENT_ACCESS` (IIS005) 추가 |
| CourseTimeService.java | `deleteCourseTime(Long id, Long currentUserId, boolean isTenantAdmin)` 시그니처 변경 |
| CourseTimeServiceImpl.java | 소유권 검증 로직 추가 |
| CourseTimeController.java | `@AuthenticationPrincipal` 파라미터 추가, `isTenantAdmin` 전달 |
| InstructorAssignmentService.java | `cancelAssignment(..., boolean isTenantAdmin)` 시그니처 변경 |
| InstructorAssignmentServiceImpl.java | 소유권 검증 로직 추가 |
| InstructorAssignmentController.java | `isTenantAdmin` 파라미터 전달 |
| CourseTimeInstructorController.java | `isTenantAdmin` 파라미터 전달 |

### 테스트 코드 (3개)

| 파일 | 변경 내용 |
|------|----------|
| CourseTimeControllerTest.java | `createTestCourseTime(Long createdBy)` 오버로드 추가, 테스트 fixture 수정 |
| InstructorAssignmentControllerTest.java | `createAssignment(..., Long assignedBy)` 오버로드 추가, 테스트 fixture 수정 |
| InstructorAssignmentServiceTest.java | `cancelAssignment()` 호출 시 `isTenantAdmin` 파라미터 추가 |

---

## 5. 파일 구조

```
common/constant/
└── ErrorCode.java                              ✅ 수정

domain/ts/
├── controller/
│   ├── CourseTimeController.java               ✅ 수정
│   └── CourseTimeInstructorController.java     ✅ 수정
├── exception/
│   └── UnauthorizedCourseTimeAccessException.java  ✅ 신규
└── service/
    ├── CourseTimeService.java                  ✅ 수정
    └── CourseTimeServiceImpl.java              ✅ 수정

domain/iis/
├── controller/
│   └── InstructorAssignmentController.java     ✅ 수정
├── exception/
│   └── UnauthorizedAssignmentAccessException.java  ✅ 신규
└── service/
    ├── InstructorAssignmentService.java        ✅ 수정
    └── InstructorAssignmentServiceImpl.java    ✅ 수정

test/.../ts/controller/
└── CourseTimeControllerTest.java               ✅ 수정

test/.../iis/controller/
└── InstructorAssignmentControllerTest.java     ✅ 수정

test/.../iis/service/
└── InstructorAssignmentServiceTest.java        ✅ 수정
```

---

## 6. 핵심 구현

### 6.1 ErrorCode 추가

```java
// CourseTime (TS)
UNAUTHORIZED_COURSE_TIME_ACCESS(HttpStatus.FORBIDDEN, "TS009", "Not authorized to access this course time"),

// Instructor (IIS)
UNAUTHORIZED_ASSIGNMENT_ACCESS(HttpStatus.FORBIDDEN, "IIS005", "Not authorized to access this assignment"),
```

### 6.2 Service - 소유권 검증 로직

**CourseTimeServiceImpl.java**
```java
@Override
@Transactional
public void deleteCourseTime(Long id, Long currentUserId, boolean isTenantAdmin) {
    log.info("Deleting course time: id={}, currentUserId={}, isTenantAdmin={}", id, currentUserId, isTenantAdmin);

    CourseTime courseTime = courseTimeRepository.findByIdAndTenantId(id, TenantContext.getCurrentTenantId())
            .orElseThrow(() -> new CourseTimeNotFoundException(id));

    // DRAFT 상태에서만 삭제 가능
    if (!courseTime.isDraft()) {
        throw new InvalidStatusTransitionException();
    }

    // 소유권 검증: 본인이 생성한 차수 또는 TENANT_ADMIN만 삭제 가능
    if (!isTenantAdmin && !currentUserId.equals(courseTime.getCreatedBy())) {
        throw new UnauthorizedCourseTimeAccessException("본인이 생성한 차수만 삭제할 수 있습니다");
    }

    courseTimeRepository.delete(courseTime);
    log.info("Course time deleted: id={}", id);
}
```

**InstructorAssignmentServiceImpl.java**
```java
@Override
@Transactional
public void cancelAssignment(Long id, CancelAssignmentRequest request, Long operatorId, boolean isTenantAdmin) {
    log.info("Cancelling assignment: id={}, operatorId={}, isTenantAdmin={}", id, operatorId, isTenantAdmin);

    InstructorAssignment assignment = findAssignmentById(id);

    // ACTIVE 상태 체크
    validateActiveStatus(assignment);

    // 소유권 검증: 본인이 배정한 건 또는 TENANT_ADMIN만 취소 가능
    if (!isTenantAdmin && !operatorId.equals(assignment.getAssignedBy())) {
        throw new UnauthorizedAssignmentAccessException("본인이 배정한 강사만 취소할 수 있습니다");
    }

    // 취소 처리
    assignment.cancel();

    // 이력 저장
    historyRepository.save(AssignmentHistory.ofCancel(id, request.reason(), operatorId));

    log.info("Assignment cancelled: id={}", id);
}
```

### 6.3 Controller - 현재 사용자 정보 획득

**CourseTimeController.java**
```java
@DeleteMapping("/{id}")
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<Void> deleteCourseTime(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal
) {
    boolean isTenantAdmin = "TENANT_ADMIN".equals(principal.role());
    courseTimeService.deleteCourseTime(id, principal.id(), isTenantAdmin);
    return ResponseEntity.noContent().build();
}
```

**InstructorAssignmentController.java**
```java
@DeleteMapping("/api/instructor-assignments/{id}")
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<Void> cancelAssignment(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody(required = false) CancelAssignmentRequest request
) {
    boolean isTenantAdmin = "TENANT_ADMIN".equals(principal.role());
    assignmentService.cancelAssignment(id,
            request != null ? request : new CancelAssignmentRequest(null),
            principal.id(),
            isTenantAdmin);
    return ResponseEntity.noContent().build();
}
```

---

## 7. 테스트 결과

### 테스트 케이스 수정

| 테스트 파일 | 변경 내용 | 결과 |
|-------------|----------|------|
| CourseTimeControllerTest | `createTestCourseTime(operator.getId())` 사용 | ✅ Pass |
| InstructorAssignmentControllerTest | `createAssignment(..., operator.getId())` 사용 | ✅ Pass |
| InstructorAssignmentServiceTest | `cancelAssignment(..., false)` 호출 | ✅ Pass |

### 전체 테스트

```
BUILD SUCCESSFUL
All tests passed (180 tests, 2 skipped)
```

---

## 8. API 응답

### 403 Forbidden - 소유권 검증 실패

**CourseTime 삭제 시**
```json
{
  "success": false,
  "error": {
    "code": "TS009",
    "message": "본인이 생성한 차수만 삭제할 수 있습니다"
  }
}
```

**InstructorAssignment 취소 시**
```json
{
  "success": false,
  "error": {
    "code": "IIS005",
    "message": "본인이 배정한 강사만 취소할 수 있습니다"
  }
}
```

---

## 9. 설계 결정사항

### 9.1 검증 위치 - Service Layer

| 위치 | 장점 | 단점 | 선택 |
|------|------|------|------|
| Controller | 빠른 실패 | 비즈니스 로직 분산 | ❌ |
| **Service** | **비즈니스 로직 집중** | - | **✅** |
| Entity | DDD 원칙 | 인프라 의존성 필요 | ❌ |

**이유**: 소유권 검증은 비즈니스 규칙이므로 Service Layer에서 처리

### 9.2 TENANT_ADMIN 검증 방식

| 방식 | 설명 | 선택 |
|------|------|------|
| SecurityContext | `hasRole('TENANT_ADMIN')` 직접 확인 | ❌ |
| **파라미터 전달** | **Controller → Service로 boolean 전달** | **✅** |

**이유**: Service Layer의 테스트 용이성, 명시적인 파라미터 전달

### 9.3 기존 예외 패턴 준수

프로젝트에 이미 존재하는 동일 패턴 예외:
- `UNAUTHORIZED_CONTENT_ACCESS` (CT008)
- `UNAUTHORIZED_ENROLLMENT_ACCESS` (SIS006)

동일한 패턴으로 구현하여 일관성 유지

---

## 10. 컨벤션 준수 체크

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] BusinessException 상속
- [x] ErrorCode enum 사용
- [x] HttpStatus.FORBIDDEN (403) 사용
- [x] 도메인별 코드 프리픽스 (TS009, IIS005)

### Service (04-SERVICE-CONVENTIONS)

- [x] `@Transactional` 쓰기 메서드
- [x] 비즈니스 로직 검증 (소유권)
- [x] 로그 기록

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@PreAuthorize` 권한 검증
- [x] `@AuthenticationPrincipal` 사용자 정보 획득

### Git (02-GIT-CONVENTIONS)

- [x] 브랜치: `refactor/ts-delete-ownership-validation`
- [x] 커밋 메시지: `[Refactor] TS 삭제 API 소유권 검증 추가 (#168)`

---

## 11. 다음 작업

| 이슈 | 내용 | 비고 |
|------|------|------|
| #164 | Course 삭제 소유권 검증 추가 | CM 모듈 |
| #165 | Program 삭제 소유권 검증 추가 | CM 모듈 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-24 | Claude Code | Phase 8 구현 완료 - TS 삭제 API 소유권 검증 |

---

*최종 업데이트: 2025-12-24*

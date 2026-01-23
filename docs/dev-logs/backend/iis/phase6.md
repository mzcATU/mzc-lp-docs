# Backend IIS 모듈 개발 로그 - Phase 6

> IIS API DB 저장 테스트 및 TS-IIS 모듈 연동 현황 정리

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-18 |
| **관련 이슈** | [#125](https://github.com/mzcATU/mzc-lp-backend/issues/125) |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. IIS API DB 저장 테스트 완료

### 테스트 환경

| 항목 | 내용 |
|------|------|
| Database | MySQL 8.0 |
| 테스트 방식 | REST API 호출 후 DB 저장 확인 |

### 테스트 완료 API

| API | Method | Endpoint | 결과 |
|-----|--------|----------|------|
| 강사 배정 | POST | `/api/times/{timeId}/instructors` | ✅ 통과 |
| 강사 목록 조회 | GET | `/api/times/{timeId}/instructors` | ✅ 통과 |
| 역할 변경 | PUT | `/api/instructor-assignments/{id}` | ✅ 통과 |
| 강사 교체 | POST | `/api/instructor-assignments/{id}/replace` | ✅ 통과 |
| 배정 취소 | DELETE | `/api/instructor-assignments/{id}` | ✅ 통과 |

### 검증 항목

- [x] 강사 배정 시 `instructor_assignment` 테이블에 데이터 저장
- [x] 배정 이력 `assignment_history` 테이블에 기록
- [x] 역할 변경 시 MAIN 강사 중복 검증
- [x] 강사 교체 시 기존 배정 REPLACED 상태 변경
- [x] 배정 취소 시 CANCELLED 상태 변경 및 이력 기록

---

## 2. TS-IIS 모듈 연동 현황

### 구현 완료

| 구성요소 | 파일 | 설명 |
|----------|------|------|
| Controller | `CourseTimeInstructorController.java` | 차수 기준 강사 배정 API 제공 |
| Service | `CourseTimeServiceImpl.java` | `existsMainInstructor()` 호출하여 차수 오픈 시 MAIN 강사 검증 |
| Exception | `MainInstructorRequiredException.java` | MAIN 강사 미배정 시 예외 |

### 차수 오픈 시 MAIN 강사 검증 로직

```java
// CourseTimeServiceImpl.java - openCourseTime()
// MAIN 강사 필수 검증 (R-IIS-01, R-TS-OPEN)
if (!instructorAssignmentService.existsMainInstructor(id)) {
    throw new MainInstructorRequiredException(id);
}
```

### 미구현 사항

| 항목 | 설명 | 우선순위 |
|------|------|----------|
| 차수 응답에 강사 정보 포함 | `CourseTimeDetailResponse`에 `instructors` 필드 없음 | 높음 |
| 차수 목록 조회 시 강사 정보 | 목록 API에서 배정된 강사 정보 조회 불가 | 중간 |

---

## 3. IIS 모듈 전체 구현 현황

### Entity

| 파일 | 설명 |
|------|------|
| `InstructorAssignment.java` | 강사 배정 엔티티 |
| `AssignmentHistory.java` | 배정 이력 엔티티 |

### Enum

| 파일 | 설명 |
|------|------|
| `InstructorRole.java` | MAIN, SUB |
| `AssignmentStatus.java` | ACTIVE, CANCELLED, REPLACED |
| `AssignmentAction.java` | ASSIGNED, ROLE_CHANGED, REPLACED, CANCELLED |

### Repository

| 파일 | 설명 |
|------|------|
| `InstructorAssignmentRepository.java` | 강사 배정 Repository |
| `AssignmentHistoryRepository.java` | 배정 이력 Repository |

### DTO

| 파일 | 타입 | 설명 |
|------|------|------|
| `AssignInstructorRequest.java` | Request | 강사 배정 요청 |
| `ReplaceInstructorRequest.java` | Request | 강사 교체 요청 |
| `UpdateRoleRequest.java` | Request | 역할 변경 요청 |
| `CancelAssignmentRequest.java` | Request | 배정 취소 요청 |
| `InstructorAssignmentResponse.java` | Response | 배정 응답 (User 정보 포함) |
| `AssignmentHistoryResponse.java` | Response | 이력 응답 |

### Service

| 파일 | 설명 |
|------|------|
| `InstructorAssignmentService.java` | 인터페이스 |
| `InstructorAssignmentServiceImpl.java` | 구현체 |

### Controller

| 파일 | 설명 |
|------|------|
| `InstructorAssignmentController.java` | IIS API 컨트롤러 |

### Exception

| 코드 | 클래스 | 설명 |
|------|--------|------|
| IIS001 | `InstructorAssignmentNotFoundException` | 배정 정보 없음 |
| IIS002 | `DuplicateAssignmentException` | 중복 배정 |
| IIS003 | `MainInstructorAlreadyExistsException` | MAIN 강사 중복 |
| IIS004 | `InvalidAssignmentStatusException` | 잘못된 상태 변경 |

---

## 4. API 엔드포인트 정리

### IIS 모듈 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/times/{timeId}/instructors` | 강사 배정 |
| GET | `/api/times/{timeId}/instructors` | 차수별 강사 목록 |
| GET | `/api/instructor-assignments/{id}` | 배정 단건 조회 |
| PUT | `/api/instructor-assignments/{id}` | 역할 변경 |
| POST | `/api/instructor-assignments/{id}/replace` | 강사 교체 |
| DELETE | `/api/instructor-assignments/{id}` | 배정 취소 |
| GET | `/api/users/{userId}/instructor-assignments` | 강사별 배정 목록 |
| GET | `/api/users/me/instructor-assignments` | 내 배정 목록 |
| GET | `/api/instructor-assignments/{id}/histories` | 배정 이력 조회 |

---

## 5. Phase 진행 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | Entity, Repository, DTO, Exception | ✅ 완료 |
| Phase 2 | Service, Controller | ✅ 완료 |
| Phase 3 | Test Code | ✅ 완료 |
| Phase 4 | 배정 이력 조회 API | ✅ 완료 |
| Phase 5 | 강사 정보 조회 API (User 연동) | ✅ 완료 |
| Phase 6 | API DB 저장 테스트, TS-IIS 연동 현황 정리 | ✅ 완료 |

---

## 6. 다음 작업

### 추가 개발 필요 사항

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 높음 | 차수 응답에 강사 정보 포함 | CourseTimeDetailResponse에 instructors 필드 추가 |
| 중간 | 차수 목록 조회 시 강사 정보 | N+1 방지를 위한 벌크 조회 필요 |
| 낮음 | 강사 배정 통계 API | 강사별 배정 현황 통계 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-18 | Claude Code | Phase 6 작성 (API DB 테스트 완료, TS-IIS 연동 현황 정리) |

---

*최종 업데이트: 2025-12-18*

# Backend IIS 모듈 개발 로그 - Phase 1

> IIS 모듈 기반 구조 구현 (Entity, Repository, DTO, Exception)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-16 |
| **관련 이슈** | [#47](https://github.com/mzcATU/mzc-lp-backend/issues/47) |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. 구현 개요

강사 배정(InstructorAssignment) 관리를 위한 기반 구조 구현:

| 구성요소 | 내용 |
|----------|------|
| Entity | InstructorAssignment, AssignmentHistory |
| Enum | InstructorRole, AssignmentStatus, AssignmentAction |
| Repository | InstructorAssignmentRepository, AssignmentHistoryRepository |
| Exception | 4개 커스텀 예외 클래스 |
| DTO | Request 4개, Response 2개 |

---

## 2. 신규 생성 파일 (15개)

### Enum (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorRole.java | `constant/` | 강사 역할 (MAIN, ASSISTANT) |
| AssignmentStatus.java | `constant/` | 배정 상태 (ACTIVE, CANCELLED, REPLACED) |
| AssignmentAction.java | `constant/` | 이력 액션 (ASSIGN, ROLE_CHANGE, REPLACE, CANCEL) |

### Entity (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignment.java | `entity/` | 강사 배정 엔티티 (BaseTimeEntity 상속) |
| AssignmentHistory.java | `entity/` | 배정 이력 엔티티 (BaseTimeEntity 상속) |

### Repository (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentRepository.java | `repository/` | 강사 배정 JPA Repository |
| AssignmentHistoryRepository.java | `repository/` | 배정 이력 JPA Repository |

### DTO - Request (4개)

| 파일 | 경로 | 설명 |
|------|------|------|
| AssignInstructorRequest.java | `dto/request/` | 강사 배정 요청 |
| UpdateRoleRequest.java | `dto/request/` | 역할 변경 요청 |
| ReplaceInstructorRequest.java | `dto/request/` | 강사 교체 요청 |
| CancelAssignmentRequest.java | `dto/request/` | 배정 취소 요청 |

### DTO - Response (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentResponse.java | `dto/response/` | 배정 정보 응답 |
| AssignmentHistoryResponse.java | `dto/response/` | 이력 정보 응답 |

### Exception (4개)

| 파일 | 경로 | ErrorCode |
|------|------|-----------|
| InstructorAssignmentNotFoundException.java | `exception/` | IIS001 |
| InstructorAlreadyAssignedException.java | `exception/` | IIS002 |
| MainInstructorAlreadyExistsException.java | `exception/` | IIS003 |
| CannotModifyInactiveAssignmentException.java | `exception/` | IIS004 |

---

## 3. 수정 파일 (1개)

### ErrorCode.java

```java
// 추가된 코드 (IIS 모듈)
// InstructorAssignment (IIS)
INSTRUCTOR_ASSIGNMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "IIS001", "Instructor assignment not found"),
INSTRUCTOR_ALREADY_ASSIGNED(HttpStatus.CONFLICT, "IIS002", "Instructor already assigned to this time"),
MAIN_INSTRUCTOR_ALREADY_EXISTS(HttpStatus.CONFLICT, "IIS003", "Main instructor already exists for this time"),
CANNOT_MODIFY_INACTIVE_ASSIGNMENT(HttpStatus.BAD_REQUEST, "IIS004", "Cannot modify inactive assignment"),
```

---

## 4. 파일 구조

```
domain/iis/
├── constant/
│   ├── InstructorRole.java      ✅ 신규
│   ├── AssignmentStatus.java    ✅ 신규
│   └── AssignmentAction.java    ✅ 신규
├── entity/
│   ├── InstructorAssignment.java    ✅ 신규
│   └── AssignmentHistory.java       ✅ 신규
├── repository/
│   ├── InstructorAssignmentRepository.java  ✅ 신규
│   └── AssignmentHistoryRepository.java     ✅ 신규
├── dto/
│   ├── request/
│   │   ├── AssignInstructorRequest.java   ✅ 신규
│   │   ├── UpdateRoleRequest.java         ✅ 신규
│   │   ├── ReplaceInstructorRequest.java  ✅ 신규
│   │   └── CancelAssignmentRequest.java   ✅ 신규
│   └── response/
│       ├── InstructorAssignmentResponse.java   ✅ 신규
│       └── AssignmentHistoryResponse.java      ✅ 신규
└── exception/
    ├── InstructorAssignmentNotFoundException.java      ✅ 신규
    ├── InstructorAlreadyAssignedException.java         ✅ 신규
    ├── MainInstructorAlreadyExistsException.java       ✅ 신규
    └── CannotModifyInactiveAssignmentException.java    ✅ 신규
```

---

## 5. InstructorAssignment 엔티티 주요 기능

### 상태 전이

```
ACTIVE → CANCELLED (취소)
ACTIVE → REPLACED (교체됨)
```

| 현재 상태 | 허용 전이 | 메서드 |
|-----------|-----------|--------|
| ACTIVE | CANCELLED | `cancel()` |
| ACTIVE | REPLACED | `replace()` |

### 비즈니스 메서드

| 메서드 | 설명 |
|--------|------|
| `create()` | 정적 팩토리 메서드 (배정 생성) |
| `updateRole()` | 역할 변경 (MAIN ↔ ASSISTANT) |
| `cancel()` | 배정 취소 (CANCELLED 상태로 변경) |
| `replace()` | 교체 처리 (REPLACED 상태로 변경) |
| `isActive()` | 활성 상태 여부 확인 |

### 인덱스

| 인덱스명 | 컬럼 | 용도 |
|----------|------|------|
| idx_time_tenant | (time_key, tenant_id) | 차수별 강사 조회 최적화 |
| idx_user_tenant | (user_key, tenant_id) | 강사별 배정 조회 최적화 |

---

## 6. 테스트 케이스 (15개 예정)

> Phase 1에서는 Entity/Repository 기반 구조만 구현하여 테스트 미포함.
> Phase 2에서 Service/Controller 테스트와 함께 구현 예정.

### 배정 테스트 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| 강사 배정 성공 | 성공, ID/createdAt 자동 생성 |
| 동일 차수 중복 배정 | 실패, IIS002 예외 발생 |
| MAIN 강사 중복 배정 | 실패, IIS003 예외 발생 |

### 조회 테스트 (4개)

| 테스트 | 기대 결과 |
|--------|----------|
| 배정 단건 조회 | 성공, 배정 정보 반환 |
| 존재하지 않는 배정 조회 | 실패, IIS001 예외 발생 |
| 차수별 강사 목록 조회 | 성공, 목록 반환 (상태 필터링) |
| 강사별 배정 목록 조회 | 성공, 페이징 목록 반환 |

### 역할 변경 테스트 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| ASSISTANT → MAIN 변경 | 성공, 역할 변경됨 |
| 비활성 배정 역할 변경 | 실패, IIS004 예외 발생 |
| MAIN 존재 시 MAIN으로 변경 | 실패, IIS003 예외 발생 |

### 교체 테스트 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| 강사 교체 성공 | 성공, 기존 REPLACED/신규 ACTIVE |
| 비활성 배정 교체 | 실패, IIS004 예외 발생 |
| 새 강사 중복 배정 시 교체 | 실패, IIS002 예외 발생 |

### 취소 테스트 (2개)

| 테스트 | 기대 결과 |
|--------|----------|
| 배정 취소 성공 | 성공, CANCELLED 상태 변경 |
| 비활성 배정 취소 | 실패, IIS004 예외 발생 |

---

## 7. 컨벤션 준수 체크

### Entity (02-ENTITY-CONVENTIONS)

- [x] Setter 미사용 → 비즈니스 메서드 사용
- [x] `@Enumerated(EnumType.STRING)` 적용
- [x] 정적 팩토리 메서드 `create()` 사용
- [x] BaseTimeEntity 상속 (createdAt, updatedAt 자동 관리)

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] 멀티테넌시 필터링 적용 (tenantId 파라미터)
- [x] 페이징 지원 메서드 포함

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotNull`)
- [x] Response: `from()` 정적 팩토리 메서드

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] `BusinessException` 상속
- [x] `ErrorCode` 사용

---

## 8. DB 테스트 결과

### 테이블 생성 확인

```sql
SHOW TABLES;
-- iis_instructor_assignments 테이블 생성 확인
-- iis_assignment_histories 테이블 생성 확인
```

### 테스트 데이터 검증

| 항목 | 결과 |
|------|------|
| INSERT (assignments) | 3건 성공 (MAIN 2건, SUB 1건) |
| INSERT (histories) | 3건 성공 (ASSIGN 액션) |
| SELECT by tenant_id | 멀티테넌시 필터링 정상 |
| SELECT by time_key | 차수별 강사 조회 정상 |
| INDEX 생성 | idx_iis_tenant, idx_iis_user, idx_iis_time, idx_iis_status, idx_iis_role 확인 |

---

## 9. 다음 작업 (Phase 2)

### 이슈 #48: IIS 강사 배정CRUD API 구현

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/times/{timeId}/instructors` | 강사 배정 |
| GET | `/api/times/{timeId}/instructors` | 차수별 강사 목록 |
| GET | `/api/instructor-assignments/{id}` | 배정 단건 조회 |
| PUT | `/api/instructor-assignments/{id}` | 역할 변경 |
| POST | `/api/instructor-assignments/{id}/replace` | 강사 교체 |
| DELETE | `/api/instructor-assignments/{id}` | 배정 취소 |
| GET | `/api/users/{userId}/instructor-assignments` | 강사별 배정 목록 |
| GET | `/api/users/me/instructor-assignments` | 내 배정 목록 |

**필요 작업:**
- InstructorAssignmentService 인터페이스/구현체 작성
- InstructorAssignmentController 작성
- 권한 검증 적용 (`@PreAuthorize`)
- Service/Controller 테스트 작성

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | Phase 1 구현 완료 (Entity, Repository, DTO, Exception) |

---

*최종 업데이트: 2025-12-16*

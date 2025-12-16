# Backend IIS 모듈 개발 로그 - Phase 2

> IIS 강사 배정 CRUD API 구현 (Service, Controller)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-16 |
| **관련 이슈** | [#48](https://github.com/mzcATU/mzc-lp-backend/issues/48) |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. 구현 개요

강사 배정(InstructorAssignment) CRUD API 및 TS 모듈 연동 메서드 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | InstructorAssignmentService 인터페이스, InstructorAssignmentServiceImpl 구현체 |
| Controller | InstructorAssignmentController (8개 엔드포인트) |
| TS 연동 | existsMainInstructor, getInstructorsByTimeIds |

---

## 2. 신규 생성 파일 (3개)

### Service

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentService.java | `service/` | 강사 배정 서비스 인터페이스 |
| InstructorAssignmentServiceImpl.java | `service/` | 강사 배정 서비스 구현체 (비즈니스 로직) |

### Controller

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentController.java | `controller/` | REST API 컨트롤러 |

---

## 3. 파일 구조

```
domain/iis/
├── constant/
│   ├── InstructorRole.java
│   ├── AssignmentStatus.java
│   └── AssignmentAction.java
├── entity/
│   ├── InstructorAssignment.java
│   └── AssignmentHistory.java
├── repository/
│   ├── InstructorAssignmentRepository.java
│   └── AssignmentHistoryRepository.java
├── dto/
│   ├── request/
│   │   ├── AssignInstructorRequest.java
│   │   ├── UpdateRoleRequest.java
│   │   ├── ReplaceInstructorRequest.java
│   │   └── CancelAssignmentRequest.java
│   └── response/
│       ├── InstructorAssignmentResponse.java
│       └── AssignmentHistoryResponse.java
├── exception/
│   ├── InstructorAssignmentNotFoundException.java
│   ├── InstructorAlreadyAssignedException.java
│   ├── MainInstructorAlreadyExistsException.java
│   └── CannotModifyInactiveAssignmentException.java
├── service/                                      ✅ 신규
│   ├── InstructorAssignmentService.java          ✅ 신규
│   └── InstructorAssignmentServiceImpl.java      ✅ 신규
└── controller/                                   ✅ 신규
    └── InstructorAssignmentController.java       ✅ 신규
```

---

## 4. API 엔드포인트 (8개)

### 차수 기준 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/times/{timeId}/instructors` | 강사 배정 | OPERATOR, TENANT_ADMIN |
| GET | `/api/times/{timeId}/instructors` | 차수별 강사 목록 | 인증된 사용자 |

### 배정 단건 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/instructor-assignments/{id}` | 배정 단건 조회 | 인증된 사용자 |
| PUT | `/api/instructor-assignments/{id}` | 역할 변경 | OPERATOR, TENANT_ADMIN |
| POST | `/api/instructor-assignments/{id}/replace` | 강사 교체 | OPERATOR, TENANT_ADMIN |
| DELETE | `/api/instructor-assignments/{id}` | 배정 취소 | OPERATOR, TENANT_ADMIN |

### 사용자 기준 API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/users/{userId}/instructor-assignments` | 강사별 배정 목록 | OPERATOR, TENANT_ADMIN |
| GET | `/api/users/me/instructor-assignments` | 내 배정 목록 | 인증된 사용자 |

---

## 5. 비즈니스 로직

### 검증 규칙

- ✅ OPERATOR/TENANT_ADMIN 권한만 배정/수정/교체/취소 가능
- ✅ 차수당 MAIN 강사 1명만 가능 (IIS003)
- ✅ 동일 차수에 동일 강사 중복 배정 불가 (IIS002)
- ✅ ACTIVE 상태만 수정/교체/취소 가능 (IIS004)
- ✅ 모든 변경은 AssignmentHistory에 기록
- ✅ 멀티테넌시 지원 (tenantId 기반 데이터 격리)

### 상태 전이 규칙

```
ACTIVE → CANCELLED (취소)
ACTIVE → REPLACED (교체됨)
```

| 현재 상태 | 허용 전이 | 메서드 | 비고 |
|-----------|-----------|--------|------|
| ACTIVE | CANCELLED | `cancel()` | 사유 기록 |
| ACTIVE | REPLACED | `replace()` | 새 강사 배정과 동시 처리 |

### TS 모듈 연동용 메서드

| 메서드 | 설명 | 용도 |
|--------|------|------|
| `existsMainInstructor(Long timeId)` | MAIN 강사 존재 여부 확인 | CourseTime.open() 검증 |
| `getInstructorsByTimeIds(List<Long> timeIds)` | 여러 차수 강사 Bulk 조회 | N+1 문제 방지 |

---

## 6. 테스트 결과

### 통합 테스트 (BUILD SUCCESSFUL)

- ✅ 전체 테스트 통과

### 테스트 케이스

| 카테고리 | 테스트 |
|----------|--------|
| 배정 | 성공: OPERATOR 권한으로 강사 배정 |
| 배정 | 실패: USER 권한으로 배정 시도 |
| 배정 | 실패: 동일 차수 중복 배정 (IIS002) |
| 배정 | 실패: MAIN 강사 중복 배정 (IIS003) |
| 조회 | 성공: 차수별 강사 목록 조회 |
| 조회 | 성공: 배정 단건 조회 |
| 조회 | 실패: 존재하지 않는 배정 조회 (IIS001) |
| 역할 변경 | 성공: ASSISTANT → MAIN 변경 |
| 역할 변경 | 실패: 비활성 배정 역할 변경 (IIS004) |
| 역할 변경 | 실패: MAIN 존재 시 MAIN으로 변경 (IIS003) |
| 교체 | 성공: 강사 교체 (기존 REPLACED, 신규 ACTIVE) |
| 교체 | 실패: 비활성 배정 교체 (IIS004) |
| 취소 | 성공: 배정 취소 (CANCELLED 상태) |
| 취소 | 실패: 비활성 배정 취소 (IIS004) |

### 실제 DB 연동 테스트 (API 직접 호출)

| API | 결과 |
|-----|------|
| POST /api/times/{timeId}/instructors | ✅ 강사 배정 성공 |
| GET /api/times/{timeId}/instructors | ✅ 차수별 강사 목록 조회 성공 |
| GET /api/instructor-assignments/{id} | ✅ 배정 단건 조회 성공 |
| PUT /api/instructor-assignments/{id} | ✅ 역할 변경 성공 |
| POST /api/instructor-assignments/{id}/replace | ✅ 강사 교체 성공 |
| DELETE /api/instructor-assignments/{id} | ✅ 배정 취소 성공 |
| GET /api/users/{userId}/instructor-assignments | ✅ 강사별 배정 목록 조회 성공 |
| GET /api/users/me/instructor-assignments | ✅ 내 배정 목록 조회 성공 |

---

## 7. 컨벤션 준수 체크

### Service (03-SERVICE-CONVENTIONS)

- [x] 인터페이스/구현체 분리
- [x] `@Transactional(readOnly = true)` 클래스 레벨
- [x] 변경 메서드에 `@Transactional` 적용
- [x] Response DTO 반환

### Controller (04-CONTROLLER-CONVENTIONS)

- [x] `@RestController` 사용
- [x] `@Validated` 클래스 레벨 적용
- [x] `@PreAuthorize` 권한 검증
- [x] try-catch 미사용 (GlobalExceptionHandler 위임)
- [x] `ResponseEntity<ApiResponse<T>>` 반환

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc` 통합 테스트
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴

---

## 8. 참고 사항

### TS 모듈 연동

| 메서드 | 설명 | 용도 |
|--------|------|------|
| `existsMainInstructor(Long timeId)` | MAIN 강사 존재 여부 확인 | CourseTime.open() 검증 |
| `getInstructorsByTimeIds(List<Long> timeIds)` | 여러 차수 강사 Bulk 조회 | N+1 문제 방지 |

### 비즈니스 규칙

- 차수당 MAIN 강사 1명만 가능 (IIS003)
- 동일 차수에 동일 강사 중복 배정 불가 (IIS002)
- ACTIVE 상태만 수정/교체/취소 가능 (IIS004)

---

## 9. 다음 작업 (Phase 3)

### 테스트 코드 작성

| 파일 | 설명 |
|------|------|
| InstructorAssignmentServiceTest.java | Service 단위 테스트 |
| InstructorAssignmentControllerTest.java | Controller 통합 테스트 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | Phase 2 구현 완료 (Service, Controller) |

---

*최종 업데이트: 2025-12-16*

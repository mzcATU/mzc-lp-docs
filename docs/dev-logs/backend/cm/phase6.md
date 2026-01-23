# Backend CM 모듈 개발 로그 - Phase 6

> Program Entity 및 승인 워크플로우 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-17 |
| **관련 이슈** | [#120](https://github.com/mzcATU/mzc-lp-backend/issues/120) |
| **브랜치** | `feat/cm-program-entity` |
| **담당 모듈** | Program (강의 개설 신청 및 승인) |
| **의존성** | Phase 5 완료 필요 (Snapshot) |

---

## 1. 구현 개요

Program 도메인 기반 구조 구현 (강의 개설 신청/승인 워크플로우):

| 구성요소 | 내용 |
|----------|------|
| Constant | ProgramStatus (5개 상태), ProgramLevel (3개), ProgramType (4개) |
| Entity | Program |
| Repository | ProgramRepository |
| DTO | Request 4개, Response 3개 |
| Exception | 3개 커스텀 예외 |
| Service | ProgramService (인터페이스/구현체) |
| Controller | ProgramController (9개 API) |
| Test | ProgramControllerTest (26개 테스트) |

---

## 2. 신규 생성 파일 (20개)

### Constant (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| ProgramStatus.java | `constant/` | DRAFT, PENDING, APPROVED, REJECTED, CLOSED |
| ProgramLevel.java | `constant/` | BEGINNER, INTERMEDIATE, ADVANCED |
| ProgramType.java | `constant/` | ONLINE, OFFLINE, BLENDED, SELF_PACED |

### Entity (1개)

| 파일 | 테이블 | 설명 |
|------|--------|------|
| Program.java | cm_programs | 강의 개설 신청 (Snapshot 참조, 승인 워크플로우) |

### Repository (1개)

| 파일 | 주요 메서드 |
|------|------------|
| ProgramRepository.java | findByIdAndTenantId, findByStatusAndTenantId, findByCreatorIdAndTenantId |

### DTO Request (4개)

| 파일 | 필수 필드 | 설명 |
|------|----------|------|
| CreateProgramRequest.java | title | 프로그램 신규 생성 |
| UpdateProgramRequest.java | - | 프로그램 수정 |
| ApproveProgramRequest.java | - | 승인 (코멘트 선택) |
| RejectProgramRequest.java | reason | 반려 (사유 필수) |

### DTO Response (3개)

| 파일 | 용도 |
|------|------|
| ProgramResponse.java | 기본 목록 응답 |
| ProgramDetailResponse.java | 상세 응답 (승인/반려 정보 포함) |
| ProgramListResponse.java | 페이징 목록 응답 |

### Exception (3개)

| 파일 | ErrorCode | HTTP | 설명 |
|------|-----------|------|------|
| ProgramNotFoundException.java | PG001 | 404 | 프로그램 없음 |
| ProgramStatusException.java | PG002 | 400 | 잘못된 상태 전이 |
| ProgramNotModifiableException.java | PG003 | 400 | 수정 불가 상태 |

### Service (2개)

| 파일 | 설명 |
|------|------|
| ProgramService.java | 인터페이스 |
| ProgramServiceImpl.java | 구현체 (CRUD + 승인 워크플로우) |

### Controller (1개)

| 파일 | API 수 | 설명 |
|------|--------|------|
| ProgramController.java | 9개 | REST API 엔드포인트 |

### Test (1개)

| 파일 | 테스트 수 | 설명 |
|------|----------|------|
| ProgramControllerTest.java | 26개 | 컨트롤러 통합 테스트 |

---

## 3. 수정 파일 (3개)

### ErrorCode.java

```java
// Program 관련 에러코드 (PG001-PG005)
PROGRAM_NOT_FOUND(HttpStatus.NOT_FOUND, "PG001", "Program not found"),
PROGRAM_STATUS_ERROR(HttpStatus.BAD_REQUEST, "PG002", "Invalid program status"),
PROGRAM_NOT_MODIFIABLE(HttpStatus.BAD_REQUEST, "PG003", "Program is not modifiable"),
PROGRAM_NOT_APPROVABLE(HttpStatus.BAD_REQUEST, "PG004", "Program cannot be approved"),
PROGRAM_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "PG005", "Program creation failed"),
```

### TenantRole.java

```java
public enum TenantRole {
    SYSTEM_ADMIN,   // 시스템 최고 관리자 (테넌트 관리)
    TENANT_ADMIN,   // 테넌트 최고 관리자
    OPERATOR,       // 운영자 (강의 검토, 차수 생성, 역할 부여)
    DESIGNER,       // 설계자 (강의 개설 신청) ← 신규 추가
    USER            // 일반 사용자 (수강)
}
```

### CourseTime.java

```java
// Program 연결 (승인된 프로그램과 연결)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "program_id")
private Program program;

// CM 연결 (deprecated - Program을 통해 Snapshot으로 연결됨)
@Deprecated
@Column(name = "cm_course_id")
private Long cmCourseId;

public void linkProgram(Program program) {
    this.program = program;
}
```

---

## 4. 파일 구조

```
domain/program/
├── constant/
│   ├── ProgramStatus.java       ✅ 신규
│   ├── ProgramLevel.java        ✅ 신규
│   └── ProgramType.java         ✅ 신규
├── entity/
│   └── Program.java             ✅ 신규
├── repository/
│   └── ProgramRepository.java   ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateProgramRequest.java   ✅ 신규
│   │   ├── UpdateProgramRequest.java   ✅ 신규
│   │   ├── ApproveProgramRequest.java  ✅ 신규
│   │   └── RejectProgramRequest.java   ✅ 신규
│   └── response/
│       ├── ProgramResponse.java        ✅ 신규
│       ├── ProgramDetailResponse.java  ✅ 신규
│       └── ProgramListResponse.java    ✅ 신규
├── exception/
│   ├── ProgramNotFoundException.java      ✅ 신규
│   ├── ProgramStatusException.java        ✅ 신규
│   └── ProgramNotModifiableException.java ✅ 신규
├── service/
│   ├── ProgramService.java        ✅ 신규
│   └── ProgramServiceImpl.java    ✅ 신규
└── controller/
    └── ProgramController.java     ✅ 신규
```

---

## 5. 핵심 설계

### 5.1 승인 워크플로우 상태 전이

```
                    ┌─────────────────────────────┐
                    │                             │
                    ▼                             │
DRAFT ──submit()──> PENDING ──approve()──> APPROVED ──close()──> CLOSED
   ▲                   │                      │
   │                   │                      │
   │           reject()│                      │close()
   │                   │                      │
   │                   ▼                      │
   └──────────── REJECTED ◄───────────────────┘
       (수정 후 재제출 가능)
```

### 5.2 상태별 권한

| 상태 | 수정 가능 | 제출 가능 | 승인/반려 가능 | 차수 생성 가능 |
|------|----------|----------|--------------|--------------|
| DRAFT | O | O | X | X |
| PENDING | X | X | O | X |
| APPROVED | X | X | X | O |
| REJECTED | O | O | X | X |
| CLOSED | X | X | X | X |

### 5.3 역할별 API 권한

| API | DESIGNER | OPERATOR | TENANT_ADMIN |
|-----|----------|----------|--------------|
| 프로그램 생성 | O | O | O |
| 프로그램 수정 | O (본인만) | O | O |
| 프로그램 삭제 | O (본인만) | O | O |
| 프로그램 제출 | O (본인만) | O | O |
| 프로그램 승인/반려 | X | O | O |
| 프로그램 종료 | X | O | O |
| 목록 조회 | O | O | O |

### 5.4 Entity 관계

```
Program (1) ──────> (0..1) CourseSnapshot
    │
    │ approvedBy (FK to User)
    │
    └── creatorId (FK to User)

CourseTime (N) ──────> (1) Program
    │
    └── program_id (신규 FK)
```

---

## 6. API 명세

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| POST | `/api/programs` | DESIGNER+ | 프로그램 생성 |
| GET | `/api/programs` | DESIGNER+ | 프로그램 목록 조회 |
| GET | `/api/programs/{id}` | DESIGNER+ | 프로그램 상세 조회 |
| PUT | `/api/programs/{id}` | DESIGNER+ | 프로그램 수정 |
| DELETE | `/api/programs/{id}` | DESIGNER+ | 프로그램 삭제 |
| POST | `/api/programs/{id}/submit` | DESIGNER+ | 승인 요청 제출 |
| POST | `/api/programs/{id}/approve` | OPERATOR+ | 승인 |
| POST | `/api/programs/{id}/reject` | OPERATOR+ | 반려 |
| POST | `/api/programs/{id}/close` | OPERATOR+ | 종료 |

---

## 7. 테스트 현황 (26개)

### 생성 테스트 (3개)
- `createProgram_Success` - 정상 생성
- `createProgram_WithAllFields` - 전체 필드 포함 생성
- `createProgram_Unauthorized` - 미인증 실패

### 조회 테스트 (4개)
- `getProgram_Success` - 상세 조회 성공
- `getProgram_NotFound` - 404 에러
- `getPrograms_Success` - 목록 조회
- `getPrograms_FilterByStatus` - 상태 필터링

### 수정 테스트 (3개)
- `updateProgram_Success` - 수정 성공
- `updateProgram_NotModifiable_Pending` - PENDING 상태 수정 실패
- `updateProgram_NotModifiable_Approved` - APPROVED 상태 수정 실패

### 삭제 테스트 (2개)
- `deleteProgram_Success` - 삭제 성공
- `deleteProgram_NotFound` - 404 에러

### 제출 테스트 (3개)
- `submitProgram_Success` - 제출 성공
- `submitProgram_FromRejected` - 반려 후 재제출
- `submitProgram_InvalidStatus` - 잘못된 상태에서 제출 실패

### 승인 테스트 (4개)
- `approveProgram_Success` - 승인 성공
- `approveProgram_WithComment` - 코멘트와 함께 승인
- `approveProgram_Forbidden_Designer` - DESIGNER 권한 없음
- `approveProgram_InvalidStatus` - 잘못된 상태에서 승인 실패

### 반려 테스트 (4개)
- `rejectProgram_Success` - 반려 성공
- `rejectProgram_WithoutReason` - 사유 없이 반려 실패
- `rejectProgram_Forbidden_Designer` - DESIGNER 권한 없음
- `rejectProgram_InvalidStatus` - 잘못된 상태에서 반려 실패

### 종료 테스트 (3개)
- `closeProgram_Success` - 종료 성공
- `closeProgram_FromDraft` - DRAFT에서 종료
- `closeProgram_InvalidStatus` - 잘못된 상태에서 종료 실패

---

## 8. 컨벤션 준수 체크

### Entity (06-ENTITY-CONVENTIONS)

- [x] TenantEntity 상속
- [x] Setter 미사용 → 비즈니스 메서드 (`submit()`, `approve()`, `reject()`, `close()`)
- [x] `@Enumerated(EnumType.STRING)`
- [x] 정적 팩토리 메서드 `create()`
- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`
- [x] 상태 확인 메서드 (`isDraft()`, `isPending()`, `isApproved()`, etc.)

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] `findByIdAndTenantId()` 패턴
- [x] 페이징 지원 (`Pageable`)

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@Size`)
- [x] Response: `from()` 정적 팩토리 메서드

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] BusinessException 상속
- [x] ErrorCode 사용
- [x] 상세 메시지 오버로드

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@RestController`, `@RequestMapping`
- [x] `@PreAuthorize` 권한 체크
- [x] 응답 형식 통일 (`ResponseEntity<ApiResponse<T>>`)

---

## 9. 검증

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava` | ✅ BUILD SUCCESSFUL |
| `./gradlew test --tests "*ProgramControllerTest*"` | ✅ 26 tests PASSED |
| 파일 수 | 22 files changed |
| 추가 라인 | 1727 insertions(+) |

---

## 10. 프론트엔드 테스트 흐름

### DESIGNER 사용자 흐름

```
1. POST /api/programs (생성)
   ↓
2. PUT /api/programs/{id} (수정 - 선택)
   ↓
3. POST /api/programs/{id}/submit (승인 요청)
   ↓
4. GET /api/programs/{id} (상태 확인 - PENDING)
```

### OPERATOR/ADMIN 승인 흐름

```
1. GET /api/programs?status=PENDING (대기 목록)
   ↓
2. GET /api/programs/{id} (상세 확인)
   ↓
3-A. POST /api/programs/{id}/approve (승인)
   또는
3-B. POST /api/programs/{id}/reject (반려)
```

### 반려 후 재제출 흐름

```
1. GET /api/programs/{id} (반려 사유 확인)
   ↓
2. PUT /api/programs/{id} (수정)
   ↓
3. POST /api/programs/{id}/submit (재제출)
```

---

## 11. 다음 작업

### 11.1 차수(CourseTime) 연동

- [ ] CourseTime 생성 시 Program 연결 API
- [ ] APPROVED 상태 Program만 차수 생성 가능

### 11.2 Snapshot 연동

- [ ] Program에 Snapshot 연결 API
- [ ] Snapshot 선택 UI 연동

---

## 관련 문서

- [Phase 1](phase1.md) - CM 기반 구조 (Entity, Repository, DTO, Exception)
- [Phase 2](phase2.md) - Course CRUD API
- [Phase 3](phase3.md) - CourseItem API (계층 구조)
- [Phase 4](phase4.md) - CourseRelation API (학습 순서)
- [Phase 5](phase5.md) - Snapshot 기반 구조
- [사용자 역할 정의](../../../context/user-roles.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-17 | Claude Code | Phase 6 구현 완료 (Program Entity 및 승인 워크플로우) |

---

*최종 업데이트: 2025-12-17*

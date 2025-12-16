# Backend TS 모듈 개발 로그 - Phase 5

> TS 강사 배정 관리 API 구현 (IIS 연동)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-16 |
| **관련 이슈** | [#51](https://github.com/mzcATU/mzc-lp-backend/issues/51) |
| **담당 모듈** | TS (Time Schedule - 차수 관리), IIS (Instructor Integration Service) |

---

## 1. 구현 개요

운영자가 차수(CourseTime)에 강사를 배정/수정/해제할 수 있는 관리자용 API:

| 구성요소 | 내용 |
|----------|------|
| Controller | CourseTimeInstructorController (신규) |
| Exception | CourseTimeNotModifiableException (신규) |
| Architecture | TS Controller → IIS Service 위임 패턴 |
| Test | 통합 테스트 19개 (Mock 제거, 실제 서비스 사용) |

---

## 2. 아키텍처 설계

### TS-IIS 모듈 분리

```
┌─────────────────────────────────────────────────────────┐
│                      Client Request                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│            CourseTimeInstructorController               │
│                  (TS 모듈)                              │
│  • 차수 존재 검증                                        │
│  • 차수 상태 검증 (CLOSED/ARCHIVED 불가)                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│             InstructorAssignmentService                 │
│                  (IIS 모듈)                             │
│  • 비즈니스 로직 처리                                    │
│  • 중복 배정 검증 (IIS002)                               │
│  • MAIN 강사 중복 검증 (IIS003)                          │
│  • 배정 이력 관리                                        │
└─────────────────────────────────────────────────────────┘
```

### 역할 분담

| 모듈 | 책임 |
|------|------|
| TS Controller | 차수 상태 검증 (CLOSED, ARCHIVED 불가) |
| IIS Service | 배정 비즈니스 로직, 중복 검증, 이력 관리 |
| IIS Controller | 배정 단건 조회/수정/삭제, 사용자 기준 조회 |

---

## 3. 신규 생성 파일 (3개)

### Controller

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeInstructorController.java | `ts/controller/` | 차수별 강사 배정 API |

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeNotModifiableException.java | `ts/exception/` | 수정 불가 상태 예외 |

### Test

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeInstructorControllerTest.java | `test/.../ts/controller/` | 통합 테스트 (19개) |

---

## 4. 수정된 파일 (2개)

| 파일 | 변경 내용 |
|------|----------|
| InstructorAssignmentController.java | 중복 API 제거 (`/api/times/{timeId}/instructors`) |
| InstructorAssignmentControllerTest.java | 중복 테스트 제거, 에러 응답 형식 수정 |

---

## 5. 파일 구조

```
domain/ts/
├── controller/
│   ├── CourseTimeController.java
│   └── CourseTimeInstructorController.java    ✅ 신규
└── exception/
    ├── CourseTimeNotFoundException.java
    └── CourseTimeNotModifiableException.java  ✅ 신규

domain/iis/
└── controller/
    └── InstructorAssignmentController.java    ✅ 수정

test/.../ts/
└── controller/
    └── CourseTimeInstructorControllerTest.java ✅ 신규

test/.../iis/
└── controller/
    └── InstructorAssignmentControllerTest.java ✅ 수정
```

---

## 6. API 엔드포인트

### 차수 기준 API (CourseTimeInstructorController)

| Method | Endpoint | 설명 | 상태 검증 |
|--------|----------|------|----------|
| POST | `/api/times/{timeId}/instructors` | 강사 배정 | O |
| GET | `/api/times/{timeId}/instructors` | 강사 목록 조회 | X |
| PUT | `/api/times/{timeId}/instructors/{id}` | 역할 수정 | O |
| POST | `/api/times/{timeId}/instructors/{id}/replace` | 강사 교체 | O |
| DELETE | `/api/times/{timeId}/instructors/{id}` | 배정 취소 | O |

### 배정 단건 API (InstructorAssignmentController)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/instructor-assignments/{id}` | 배정 단건 조회 |
| PUT | `/api/instructor-assignments/{id}` | 역할 수정 |
| POST | `/api/instructor-assignments/{id}/replace` | 강사 교체 |
| DELETE | `/api/instructor-assignments/{id}` | 배정 취소 |

### 사용자 기준 API (InstructorAssignmentController)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users/{userId}/instructor-assignments` | 특정 사용자 배정 목록 |
| GET | `/api/users/me/instructor-assignments` | 내 배정 목록 |

---

## 7. 비즈니스 규칙

| 규칙 | 설명 | 에러 코드 |
|------|------|----------|
| R01 | CLOSED, ARCHIVED 상태 차수 수정 불가 | TS006 |
| R02 | 동일 차수에 동일 사용자 중복 배정 불가 | IIS002 |
| R03 | 동일 차수에 MAIN 강사 중복 불가 | IIS003 |
| R04 | 존재하지 않는 배정 조회 시 404 | IIS001 |

---

## 8. 테스트 결과

### 통합 테스트 (19개)

| 카테고리 | 테스트 | 결과 |
|----------|--------|------|
| 강사 배정 | 성공 - 강사 배정 | ✅ |
| 강사 배정 | 실패 - CLOSED 상태 차수 | ✅ |
| 강사 배정 | 실패 - ARCHIVED 상태 차수 | ✅ |
| 강사 배정 | 실패 - 중복 배정 (IIS002) | ✅ |
| 강사 배정 | 실패 - MAIN 중복 (IIS003) | ✅ |
| 목록 조회 | 성공 - 강사 목록 조회 | ✅ |
| 목록 조회 | 성공 - 상태 필터링 | ✅ |
| 역할 수정 | 성공 - 역할 변경 | ✅ |
| 역할 수정 | 실패 - CLOSED 상태 차수 | ✅ |
| 강사 교체 | 성공 - 강사 교체 | ✅ |
| 강사 교체 | 실패 - ARCHIVED 상태 차수 | ✅ |
| 배정 취소 | 성공 - 배정 취소 | ✅ |
| 배정 취소 | 실패 - CLOSED 상태 차수 | ✅ |

### API 통합 테스트 (실제 DB)

| API | 테스트 케이스 | 결과 |
|-----|-------------|------|
| `POST /api/times/{timeId}/instructors` | 강사 배정 성공 | ✅ 201 |
| `GET /api/times/{timeId}/instructors` | 강사 목록 조회 | ✅ 200 |
| `PUT /api/times/{timeId}/instructors/{id}` | 역할 수정 | ✅ 200 |
| `DELETE /api/times/{timeId}/instructors/{id}` | 배정 취소 | ✅ 204 |
| `POST /api/times/{timeId}/instructors` | CLOSED 상태 거부 | ✅ 400 (TS006) |
| `POST /api/times/{timeId}/instructors` | 중복 배정 거부 | ✅ 409 (IIS002) |
| `POST /api/times/{timeId}/instructors` | MAIN 강사 중복 거부 | ✅ 409 (IIS003) |

### 전체 테스트

```
BUILD SUCCESSFUL
394 tests completed
```

---

## 9. 주요 해결 이슈

### API 엔드포인트 충돌 해결

**문제**: `InstructorAssignmentController`와 `CourseTimeInstructorController` 모두 `/api/times/{timeId}/instructors` 매핑

```
Caused by: java.lang.IllegalStateException: Ambiguous mapping.
Cannot map 'instructorAssignmentController' method
to 'courseTimeInstructorController': There is already ...
```

**해결**: `InstructorAssignmentController`에서 차수 기준 API 제거
- 차수 상태 검증이 필요하므로 `CourseTimeInstructorController`에서만 처리

### Mock → 실제 통합 테스트 전환

**Phase 1**: `@MockitoBean`으로 IIS Service 모킹
```java
@MockitoBean
private InstructorAssignmentService instructorAssignmentService;
```

**Phase 2**: Mock 제거, 실제 서비스 사용
```java
@Autowired
private InstructorAssignmentRepository instructorAssignmentRepository;

@Autowired
private AssignmentHistoryRepository assignmentHistoryRepository;
```

---

## 10. 컨벤션 준수 체크

### Controller (04-CONTROLLER-CONVENTIONS)

- [x] `@Slf4j` 로깅
- [x] `@RequiredArgsConstructor` 생성자 주입
- [x] `@PreAuthorize` 권한 검증
- [x] `ApiResponse<T>` 응답 래핑
- [x] try-catch 없음 (GlobalExceptionHandler 위임)

### Exception (06-EXCEPTION-CONVENTIONS)

- [x] `LpException` 상속
- [x] 에러 코드 enum 사용 (TS006)
- [x] 메시지 파라미터 지원

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Given-When-Then 패턴
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] `TenantTestSupport` 상속

---

## 11. 다음 작업

| 이슈 | 내용 | 비고 |
|------|------|------|
| #50 | SIS 수강신청 CRUD API | occupySeat/releaseSeat 연동 |
| - | IIS 배정 이력 관리 API | 필요시 추가 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | Phase 5 Phase 1 구현 (Mock 기반 테스트) |
| 2025-12-16 | Claude Code | Phase 5 Phase 2 완료 (실제 통합 테스트 전환) |

---

*최종 업데이트: 2025-12-16*

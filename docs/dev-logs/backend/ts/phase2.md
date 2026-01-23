# Backend TS 모듈 개발 로그 - Phase 2

> TS 차수 CRUD API 구현 (Service, Controller, Test)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **관련 이슈** | [#27](https://github.com/mzcATU/mzc-lp-backend/issues/27) |
| **담당 모듈** | TS (Time Schedule - 차수 관리) |

---

## 1. 구현 개요

차수(CourseTime) CRUD API 및 상태 전이 API 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | CourseTimeService 인터페이스, CourseTimeServiceImpl 구현체 |
| Controller | CourseTimeController (9개 엔드포인트) |
| Test | CourseTimeControllerTest (통합 테스트) |

---

## 2. 신규 생성 파일 (3개)

### Service

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeService.java | `service/` | 차수 서비스 인터페이스 |
| CourseTimeServiceImpl.java | `service/` | 차수 서비스 구현체 (비즈니스 로직) |

### Controller

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeController.java | `controller/` | REST API 컨트롤러 |

### Test

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeControllerTest.java | `test/.../controller/` | 통합 테스트 |

---

## 3. 파일 구조

```
domain/ts/
├── constant/
│   ├── CourseTimeStatus.java
│   ├── DeliveryType.java
│   └── EnrollmentMethod.java
├── entity/
│   └── CourseTime.java
├── repository/
│   └── CourseTimeRepository.java
├── dto/
│   ├── request/
│   │   ├── CreateCourseTimeRequest.java
│   │   └── UpdateCourseTimeRequest.java
│   └── response/
│       ├── CourseTimeResponse.java
│       └── CourseTimeDetailResponse.java
├── exception/
│   ├── CourseTimeNotFoundException.java
│   ├── InvalidStatusTransitionException.java
│   ├── CapacityExceededException.java
│   ├── InvalidDateRangeException.java
│   └── LocationRequiredException.java
├── service/                              ✅ 신규
│   ├── CourseTimeService.java            ✅ 신규
│   └── CourseTimeServiceImpl.java        ✅ 신규
└── controller/                           ✅ 신규
    └── CourseTimeController.java         ✅ 신규
```

---

## 4. API 엔드포인트

### CRUD API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/times` | 차수 생성 | OPERATOR, TENANT_ADMIN |
| GET | `/api/times` | 차수 목록 조회 | 인증된 사용자 |
| GET | `/api/times/{id}` | 차수 상세 조회 | 인증된 사용자 |
| PATCH | `/api/times/{id}` | 차수 수정 | OPERATOR, TENANT_ADMIN |
| DELETE | `/api/times/{id}` | 차수 삭제 | OPERATOR, TENANT_ADMIN |

### 상태 전이 API

| Method | Endpoint | 설명 | 전이 |
|--------|----------|------|------|
| POST | `/api/times/{id}/open` | 모집 시작 | DRAFT → RECRUITING |
| POST | `/api/times/{id}/start` | 수업 시작 | RECRUITING → ONGOING |
| POST | `/api/times/{id}/close` | 수업 종료 | ONGOING → CLOSED |
| POST | `/api/times/{id}/archive` | 보관 처리 | CLOSED → ARCHIVED |

---

## 5. 비즈니스 로직

### 검증 규칙

- ✅ OPERATOR/TENANT_ADMIN 권한만 생성/수정/삭제 가능
- ✅ 날짜 범위 검증 (수강신청 기간, 수업 기간)
- ✅ DRAFT 상태에서만 삭제 가능
- ✅ DRAFT/RECRUITING 상태에서만 수정 가능
- ✅ OFFLINE/BLENDED 타입 장소 정보 필수 검증
- ✅ 상태 전이 규칙 적용 (DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED)
- ✅ 멀티테넌시 지원 (tenantId 기반 데이터 격리)

### 상태 전이 규칙

```
DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED
```

| 현재 상태 | 허용 전이 | API | 검증 |
|-----------|-----------|-----|------|
| DRAFT | RECRUITING | `/open` | 장소 정보 검증 (OFFLINE/BLENDED) |
| RECRUITING | ONGOING | `/start` | - |
| ONGOING | CLOSED | `/close` | - |
| CLOSED | ARCHIVED | `/archive` | - |

---

## 6. 테스트 결과

### 통합 테스트 (BUILD SUCCESSFUL)

- ✅ 전체 테스트 통과

### 테스트 케이스

| 카테고리 | 테스트 |
|----------|--------|
| 생성 | 성공: OPERATOR 권한으로 생성 |
| 생성 | 실패: USER 권한으로 생성 시도 |
| 조회 | 성공: 목록 조회 |
| 조회 | 성공: 상세 조회 |
| 조회 | 실패: 존재하지 않는 차수 조회 |
| 수정 | 성공: DRAFT 상태 차수 수정 |
| 수정 | 실패: ONGOING 상태에서 수정 시도 |
| 수정 | 실패: USER 권한으로 수정 시도 |
| 삭제 | 성공: DRAFT 상태 차수 삭제 |
| 삭제 | 실패: RECRUITING 상태에서 삭제 시도 |
| 상태 전이 | 성공: open (DRAFT → RECRUITING) |
| 상태 전이 | 성공: start (RECRUITING → ONGOING) |
| 상태 전이 | 성공: close (ONGOING → CLOSED) |
| 상태 전이 | 성공: archive (CLOSED → ARCHIVED) |

### 실제 DB 연동 테스트 (API 직접 호출)

| API | 결과 |
|-----|------|
| POST /api/times | ✅ 생성 성공 |
| GET /api/times | ✅ 목록 조회 성공 |
| GET /api/times/{id} | ✅ 상세 조회 성공 |
| PATCH /api/times/{id} | ✅ 수정 성공 |
| DELETE /api/times/{id} | ✅ 삭제 성공 |
| POST /api/times/{id}/open | ✅ DRAFT → RECRUITING |
| POST /api/times/{id}/start | ✅ RECRUITING → ONGOING |
| POST /api/times/{id}/close | ✅ ONGOING → CLOSED |
| POST /api/times/{id}/archive | ✅ CLOSED → ARCHIVED |

---

## 7. 컨벤션 준수 체크

### Service (03-SERVICE-CONVENTIONS)

- [x] 인터페이스/구현체 분리
- [x] `@Transactional(readOnly = true)` 클래스 레벨
- [x] 변경 메서드에 `@Transactional` 적용
- [x] Response DTO 반환

### Controller (04-CONTROLLER-CONVENTIONS)

- [x] `@RestController` + `@RequestMapping` 사용
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

### TODO

- tenantId는 현재 임시로 1L 반환 (SecurityContext 연동 필요)

### 관련 규칙 참조

- R09: 수강신청 시작일 < 수강신청 종료일
- R10: 수업 시작일 < 수업 종료일
- R12: OFFLINE/BLENDED는 장소 정보 필수
- R53: 차수별 모집 방식/기간 설정

---

## 9. 다음 작업 (Phase 3)

### 이슈 #28: TS 차수 상태 전이 규칙 구현

- 스케줄러 기반 자동 상태 전이
- 모집 시작/종료 자동 처리
- 수업 시작/종료 자동 처리

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | Phase 2 구현 완료 (Service, Controller, Test) |

---

*최종 업데이트: 2025-12-12*

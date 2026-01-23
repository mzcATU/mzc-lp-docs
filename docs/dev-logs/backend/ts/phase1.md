# Backend TS 모듈 개발 로그 - Phase 1

> TS 모듈 기반 구조 구현 (Entity, Repository, DTO, Exception)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **관련 이슈** | [#26](https://github.com/mzcATU/mzc-lp-backend/issues/26) |
| **담당 모듈** | TS (Time Schedule - 차수 관리) |

---

## 1. 구현 개요

차수(CourseTime) 관리를 위한 기반 구조 구현:

| 구성요소 | 내용 |
|----------|------|
| Entity | CourseTime (차수 핵심 엔티티) |
| Enum | CourseTimeStatus, DeliveryType, EnrollmentMethod |
| Repository | CourseTimeRepository (비관적 락 포함) |
| Exception | 5개 커스텀 예외 클래스 |
| DTO | Request 2개, Response 2개 |
| Test | CourseTimeRepositoryTest (25개 테스트) |

---

## 2. 신규 생성 파일 (15개)

### Enum (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeStatus.java | `constant/` | 차수 상태 (DRAFT, RECRUITING, ONGOING, CLOSED, ARCHIVED) |
| DeliveryType.java | `constant/` | 진행 방식 (ONLINE, OFFLINE, BLENDED, LIVE) |
| EnrollmentMethod.java | `constant/` | 수강 신청 방식 (FIRST_COME, APPROVAL, INVITE_ONLY) |

### Entity

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTime.java | `entity/` | 차수 엔티티 (TenantEntity 상속, 비즈니스 로직 포함) |

### Repository

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeRepository.java | `repository/` | JPA Repository (비관적 락 쿼리 메서드 포함) |

### DTO - Request (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CreateCourseTimeRequest.java | `dto/request/` | 차수 생성 요청 |
| UpdateCourseTimeRequest.java | `dto/request/` | 차수 수정 요청 |

### DTO - Response (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeResponse.java | `dto/response/` | 차수 목록 응답 |
| CourseTimeDetailResponse.java | `dto/response/` | 차수 상세 응답 |

### Exception (5개)

| 파일 | 경로 | ErrorCode |
|------|------|-----------|
| CourseTimeNotFoundException.java | `exception/` | TS001 |
| InvalidStatusTransitionException.java | `exception/` | TS002 |
| CapacityExceededException.java | `exception/` | TS003 |
| InvalidDateRangeException.java | `exception/` | TS004 |
| LocationRequiredException.java | `exception/` | TS005 |

### Test

| 파일 | 경로 | 테스트 수 |
|------|------|----------|
| CourseTimeRepositoryTest.java | `test/.../repository/` | 25개 |

---

## 3. 수정 파일 (1개)

### ErrorCode.java

```java
// 추가된 코드 (TS 모듈)
// CourseTime (TS)
COURSE_TIME_NOT_FOUND(HttpStatus.NOT_FOUND, "TS001", "CourseTime not found"),
INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "TS002", "Invalid status transition"),
CAPACITY_EXCEEDED(HttpStatus.CONFLICT, "TS003", "Capacity exceeded"),
INVALID_DATE_RANGE(HttpStatus.BAD_REQUEST, "TS004", "Invalid date range"),
LOCATION_REQUIRED(HttpStatus.BAD_REQUEST, "TS005", "Location info required for OFFLINE/BLENDED"),
```

---

## 4. 파일 구조

```
domain/ts/
├── constant/
│   ├── CourseTimeStatus.java    ✅ 신규
│   ├── DeliveryType.java        ✅ 신규
│   └── EnrollmentMethod.java    ✅ 신규
├── entity/
│   └── CourseTime.java          ✅ 신규
├── repository/
│   └── CourseTimeRepository.java ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateCourseTimeRequest.java  ✅ 신규
│   │   └── UpdateCourseTimeRequest.java  ✅ 신규
│   └── response/
│       ├── CourseTimeResponse.java       ✅ 신규
│       └── CourseTimeDetailResponse.java ✅ 신규
└── exception/
    ├── CourseTimeNotFoundException.java      ✅ 신규
    ├── InvalidStatusTransitionException.java ✅ 신규
    ├── CapacityExceededException.java        ✅ 신규
    ├── InvalidDateRangeException.java        ✅ 신규
    └── LocationRequiredException.java        ✅ 신규
```

---

## 5. CourseTime 엔티티 주요 기능

### 상태 전이 (State Machine)

```
DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED
```

| 현재 상태 | 허용 전이 | 메서드 |
|-----------|-----------|--------|
| DRAFT | RECRUITING | `open()` |
| RECRUITING | ONGOING | `startClass()` |
| ONGOING | CLOSED | `close()` |
| CLOSED | ARCHIVED | `archive()` |

### 비즈니스 메서드

| 메서드 | 설명 |
|--------|------|
| `create()` | 정적 팩토리 메서드 (무료 시 가격 0 자동 설정) |
| `canEnroll()` | 수강 신청 가능 여부 (상태, 중간 합류 허용 체크) |
| `hasAvailableSeats()` | 정원 여유 확인 (무제한 정원 지원) |
| `incrementEnrollment()` | 등록 인원 증가 |
| `decrementEnrollment()` | 등록 인원 감소 (0 이하 방지) |
| `requiresLocationInfo()` | 장소 정보 필수 여부 (OFFLINE/BLENDED) |
| `linkCourse()` | CM 강의 연결 |

### 인덱스

| 인덱스명 | 컬럼 | 용도 |
|----------|------|------|
| idx_course_times_status | (tenant_id, status) | 상태별 조회 최적화 |
| idx_course_times_course | (tenant_id, cm_course_id) | 강의별 차수 조회 최적화 |

---

## 6. 테스트 케이스 (25개)

### 저장 테스트 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| CourseTime 저장 | 성공, ID/createdAt 자동 생성 |
| 무료 차수 저장 시 가격 0 자동 설정 | price = 0 |
| 무제한 정원 차수 저장 | capacity = null, hasUnlimitedCapacity = true |

### 조회 테스트 (6개)

| 테스트 | 기대 결과 |
|--------|----------|
| ID로 조회 | 성공 |
| ID와 TenantId로 조회 | 성공 |
| 다른 TenantId로 조회 | 빈 결과 |
| 상태별 조회 | 해당 상태만 반환 |
| 여러 상태로 조회 | 해당 상태들만 반환 |
| 강의별 차수 조회 | 해당 강의 차수만 반환 |

### 상태 전이 테스트 (4개)

| 테스트 | 기대 결과 |
|--------|----------|
| DRAFT → RECRUITING | 성공 |
| RECRUITING → ONGOING | 성공 |
| ONGOING → CLOSED | 성공 |
| CLOSED → ARCHIVED | 성공 |

### 정원 관리 테스트 (4개)

| 테스트 | 기대 결과 |
|--------|----------|
| 등록 인원 증가 | currentEnrollment 증가 |
| 등록 인원 감소 | currentEnrollment 감소 |
| 0 이하로 감소 시 0 유지 | currentEnrollment = 0 |
| 정원 여유 확인 | true/false 정확히 반환 |

### 수강 신청 가능 여부 테스트 (5개)

| 테스트 | 기대 결과 |
|--------|----------|
| DRAFT 상태 | canEnroll = false |
| RECRUITING 상태 | canEnroll = true |
| ONGOING + allowLateEnrollment=true | canEnroll = true |
| ONGOING + allowLateEnrollment=false | canEnroll = false |
| CLOSED 상태 | canEnroll = false |

### 장소 정보 필수 여부 테스트 (3개)

| 테스트 | 기대 결과 |
|--------|----------|
| ONLINE | requiresLocationInfo = false |
| OFFLINE | requiresLocationInfo = true |
| BLENDED | requiresLocationInfo = true |

---

## 7. 컨벤션 준수 체크

### Entity (02-ENTITY-CONVENTIONS)

- [x] Setter 미사용 → 비즈니스 메서드 사용
- [x] `@Enumerated(EnumType.STRING)` 적용
- [x] 정적 팩토리 메서드 `create()` 사용
- [x] TenantEntity 상속 (멀티테넌시 지원)
- [x] BaseTimeEntity 상속 (createdAt, updatedAt 자동 관리)

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] 비관적 락 메서드 `@Lock(LockModeType.PESSIMISTIC_WRITE)`
- [x] 페이징 지원 메서드 포함

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@NotNull`, `@Positive`)
- [x] Response: `from()` 정적 팩토리 메서드

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] `BusinessException` 상속
- [x] `ErrorCode` 사용

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@DataJpaTest` 슬라이스 테스트
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴
- [x] `@Import(JpaConfig.class)` JPA Auditing 활성화

---

## 8. DB 테스트 결과

### 테이블 생성 확인

```sql
SHOW TABLES;
-- course_times 테이블 생성 확인
```

### 테스트 데이터 검증

| 항목 | 결과 |
|------|------|
| INSERT | 3건 성공 (RECRUITING, DRAFT, ONGOING) |
| SELECT by status | 정상 조회 |
| SELECT by tenant_id | 멀티테넌시 필터링 정상 |
| UPDATE current_enrollment | 정원 관리 정상 |
| INDEX 생성 | idx_course_times_status, idx_course_times_course 확인 |

---

## 9. 다음 작업 (Phase 2)

### 이슈 #27: TS 차수 CRUD API 구현

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/course-times` | 차수 생성 |
| GET | `/api/course-times` | 차수 목록 조회 |
| GET | `/api/course-times/{id}` | 차수 상세 조회 |
| PUT | `/api/course-times/{id}` | 차수 수정 |
| DELETE | `/api/course-times/{id}` | 차수 삭제 |

**필요 작업:**
- CourseTimeService 인터페이스/구현체 작성
- CourseTimeController 작성
- 권한 검증 적용 (`@PreAuthorize`)
- Controller 테스트 작성

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | Phase 1 구현 완료 (Entity, Repository, DTO, Exception, Test 25개) |

---

*최종 업데이트: 2025-12-12*

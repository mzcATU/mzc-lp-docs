# Backend TS 모듈 개발 로그 - Phase 3

> TS 정원 관리 및 Public API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#28](https://github.com/mzcATU/mzc-lp-backend/issues/28) |
| **담당 모듈** | TS (Time Schedule - 차수 관리) |

---

## 1. 구현 개요

정원 관리 기능 및 Public API 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | 좌석 점유/해제 메서드 (비관적 락) |
| Controller | Public API 2개 엔드포인트 추가 |
| DTO | CapacityResponse, PriceResponse |
| Test | Service 단위 테스트, Controller 통합 테스트 |

---

## 2. 신규 생성 파일 (3개)

### DTO

| 파일 | 경로 | 설명 |
|------|------|------|
| CapacityResponse.java | `dto/response/` | 정원 조회 응답 DTO |
| PriceResponse.java | `dto/response/` | 가격 조회 응답 DTO |

### Test

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeServiceTest.java | `test/.../service/` | Service 단위 테스트 |

---

## 3. 수정된 파일 (4개)

| 파일 | 변경 내용 |
|------|----------|
| CourseTimeService.java | `occupySeat`, `releaseSeat`, `getCapacity`, `getPrice` 인터페이스 추가 |
| CourseTimeServiceImpl.java | 4개 메서드 구현 |
| CourseTimeController.java | Public API 2개 추가 |
| CourseTimeControllerTest.java | 정원/가격 API 테스트 5개 추가 |

---

## 4. 파일 구조

```
domain/ts/
├── dto/
│   └── response/
│       ├── CourseTimeResponse.java
│       ├── CourseTimeDetailResponse.java
│       ├── CapacityResponse.java          ✅ 신규
│       └── PriceResponse.java             ✅ 신규
├── service/
│   ├── CourseTimeService.java             ✅ 수정
│   └── CourseTimeServiceImpl.java         ✅ 수정
└── controller/
    └── CourseTimeController.java          ✅ 수정

test/.../ts/
├── controller/
│   └── CourseTimeControllerTest.java      ✅ 수정
└── service/
    └── CourseTimeServiceTest.java         ✅ 신규
```

---

## 5. API 엔드포인트

### Public API (신규)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/ts/course-times/{id}/capacity` | 정원 조회 | permitAll |
| GET | `/api/ts/course-times/{id}/price` | 가격 조회 | permitAll |

### 내부 메서드 (SIS 모듈에서 호출)

| 메서드 | 설명 | 비고 |
|--------|------|------|
| `occupySeat(Long courseTimeId)` | 좌석 점유 | 비관적 락 적용 |
| `releaseSeat(Long courseTimeId)` | 좌석 해제 | 비관적 락 적용 |

---

## 6. 비즈니스 로직

### 정원 관리 규칙

| 규칙 | 설명 | 구현 |
|------|------|------|
| R02 | capacity = null이면 무제한 | `hasUnlimitedCapacity()` |
| R03 | 정원은 현재 등록 인원 이하로 축소 불가 | (SIS에서 검증) |
| R04 | SELECT FOR UPDATE 비관적 락 | `findByIdWithLock()` |

### 좌석 점유 로직

```java
@Transactional
public void occupySeat(Long courseTimeId) {
    // 1. 비관적 락으로 조회
    CourseTime courseTime = courseTimeRepository.findByIdWithLock(courseTimeId)
            .orElseThrow(() -> new CourseTimeNotFoundException(courseTimeId));

    // 2. 정원 확인 (무제한이면 패스)
    if (!courseTime.hasUnlimitedCapacity() && !courseTime.hasAvailableSeats()) {
        throw new CapacityExceededException(...);
    }

    // 3. 등록 인원 증가
    courseTime.incrementEnrollment();
}
```

---

## 7. 테스트 결과

### Service 단위 테스트 (10개)

| 카테고리 | 테스트 | 결과 |
|----------|--------|------|
| occupySeat | 성공 - 좌석 점유 | ✅ |
| occupySeat | 성공 - 무제한 정원에서 좌석 점유 | ✅ |
| occupySeat | 실패 - 정원 초과 | ✅ |
| occupySeat | 실패 - 존재하지 않는 차수 | ✅ |
| releaseSeat | 성공 - 좌석 해제 | ✅ |
| releaseSeat | 성공 - 등록 인원 0일 때 해제 | ✅ |
| releaseSeat | 실패 - 존재하지 않는 차수 | ✅ |
| getCapacity | 성공 - 정원 조회 (제한 있음) | ✅ |
| getCapacity | 성공 - 정원 조회 (무제한) | ✅ |
| getPrice | 성공 - 가격 조회 (유료/무료) | ✅ |

### Controller 통합 테스트 (5개 추가)

| 카테고리 | 테스트 | 결과 |
|----------|--------|------|
| GetCapacity | 성공 - 정원 조회 (정원 제한 있음) | ✅ |
| GetCapacity | 성공 - 정원 조회 (무제한) | ✅ |
| GetCapacity | 실패 - 존재하지 않는 차수 | ✅ |
| GetPrice | 성공 - 유료 차수 가격 조회 | ✅ |
| GetPrice | 성공 - 무료 차수 가격 조회 | ✅ |

### 빌드 결과

```
BUILD SUCCESSFUL
TS 모듈 테스트: 전체 통과
```

---

## 8. 컨벤션 준수 체크

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] `from()` 정적 팩토리 메서드

### Service (04-SERVICE-CONVENTIONS)

- [x] `@Transactional(readOnly = true)` 클래스 레벨
- [x] 쓰기 작업에 `@Transactional` 적용
- [x] `@Slf4j` 로깅
- [x] 예외는 던지기만 (try-catch 미사용)

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] Service만 호출 (비즈니스 로직 없음)
- [x] `ResponseEntity<ApiResponse<T>>` 반환

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Given-When-Then 패턴
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] BDDMockito (`given()`) 사용
- [x] `verify()` 호출 검증

---

## 9. 참고 사항

### Repository 메서드

```java
// 비관적 락 적용 (이미 Phase 1에서 구현됨)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT ct FROM CourseTime ct WHERE ct.id = :id")
Optional<CourseTime> findByIdWithLock(@Param("id") Long id);
```

### Entity 메서드

```java
// 정원 관리 (이미 Phase 1에서 구현됨)
public void incrementEnrollment() { this.currentEnrollment++; }
public void decrementEnrollment() { if (this.currentEnrollment > 0) this.currentEnrollment--; }
public boolean hasUnlimitedCapacity() { return this.capacity == null; }
public boolean hasAvailableSeats() { return hasUnlimitedCapacity() || this.currentEnrollment < this.capacity; }
```

---

## 10. 다음 작업

### SIS 모듈 구현 시 연동

- `occupySeat()`: 수강신청 승인 시 호출
- `releaseSeat()`: 수강취소 시 호출

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 3 구현 완료 (정원 관리, Public API) |

---

*최종 업데이트: 2025-12-15*

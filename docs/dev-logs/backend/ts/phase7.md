# Backend TS 모듈 개발 로그 - Phase 7

> 차수 복제 API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-17 |
| **관련 이슈** | [#91](https://github.com/mzcATU/mzc-lp-backend/issues/91) |
| **담당 모듈** | TS (Time Schedule - 차수 관리) |

---

## 1. 구현 개요

기존 차수 설정을 복사하여 새 차수를 생성하는 복제 API 구현:

| 구성요소 | 내용 |
|----------|------|
| API | `POST /api/times/{id}/clone` |
| DTO | CloneCourseTimeRequest (신규) |
| Entity | CourseTime.cloneFrom() 정적 팩토리 메서드 |
| Service | cloneCourseTime() + validateDateRange() 리팩토링 |
| Test | 복제 API 테스트 케이스 6개 |

---

## 2. 비즈니스 규칙

### 복제 정책

| 규칙 | 설명 | 구현 |
|------|------|------|
| R-CLONE-01 | 원본 상태 무관 복제 가능 | ✅ |
| R-CLONE-02 | 복제된 차수는 DRAFT로 생성 | ✅ |
| R-CLONE-03 | 강사 배정은 복제하지 않음 | ✅ (별도 도메인) |
| R-CLONE-04 | 날짜 검증은 기존 로직과 동일 | ✅ |
| R-CLONE-05 | createdBy = API 호출자 | ✅ |

### 복제 대상 필드

| 필드 | 복제 | 비고 |
|------|------|------|
| deliveryType | ✅ | |
| capacity | ✅ | |
| maxWaitingCount | ✅ | |
| enrollmentMethod | ✅ | |
| minProgressForCompletion | ✅ | |
| price | ✅ | |
| isFree | ✅ | |
| locationInfo | ✅ | |
| allowLateEnrollment | ✅ | |
| cmCourseId | ✅ | |
| cmCourseVersionId | ✅ | |
| title | ❌ | Request에서 지정 |
| 날짜 필드 (4개) | ❌ | Request에서 지정 |
| status | ❌ | DRAFT 고정 |
| currentEnrollment | ❌ | 0 고정 |
| createdBy | ❌ | API 호출자 |

---

## 3. 신규 생성 파일 (1개)

### DTO

| 파일 | 경로 | 설명 |
|------|------|------|
| CloneCourseTimeRequest.java | `ts/dto/request/` | 복제 요청 DTO |

```java
public record CloneCourseTimeRequest(
        @NotBlank(message = "제목은 필수입니다")
        @Size(max = 200, message = "제목은 200자 이하여야 합니다")
        String title,

        @NotNull(message = "모집 시작일은 필수입니다")
        LocalDate enrollStartDate,

        @NotNull(message = "모집 종료일은 필수입니다")
        LocalDate enrollEndDate,

        @NotNull(message = "학습 시작일은 필수입니다")
        LocalDate classStartDate,

        @NotNull(message = "학습 종료일은 필수입니다")
        LocalDate classEndDate
) {}
```

---

## 4. 수정된 파일 (5개)

| 파일 | 변경 내용 |
|------|----------|
| CourseTime.java | `cloneFrom()` 정적 팩토리 메서드 추가 |
| CourseTimeService.java | `cloneCourseTime()` 인터페이스 추가 |
| CourseTimeServiceImpl.java | `cloneCourseTime()` 구현 + `validateDateRange()` 리팩토링 |
| CourseTimeController.java | `POST /api/times/{id}/clone` 엔드포인트 추가 |
| CourseTimeControllerTest.java | 복제 API 테스트 케이스 6개 추가 |

---

## 5. 파일 구조

```
domain/ts/
├── controller/
│   └── CourseTimeController.java         ✅ 수정
├── dto/request/
│   ├── CreateCourseTimeRequest.java
│   ├── UpdateCourseTimeRequest.java
│   └── CloneCourseTimeRequest.java       ✅ 신규
├── entity/
│   └── CourseTime.java                   ✅ 수정
└── service/
    ├── CourseTimeService.java            ✅ 수정
    └── CourseTimeServiceImpl.java        ✅ 수정

test/.../ts/controller/
└── CourseTimeControllerTest.java         ✅ 수정
```

---

## 6. 핵심 구현

### 6.1 Entity - cloneFrom() 정적 팩토리 메서드

```java
public static CourseTime cloneFrom(
        CourseTime source,
        String newTitle,
        LocalDate enrollStartDate,
        LocalDate enrollEndDate,
        LocalDate classStartDate,
        LocalDate classEndDate,
        Long createdBy
) {
    CourseTime courseTime = new CourseTime();

    // 복제 대상 필드
    courseTime.deliveryType = source.deliveryType;
    courseTime.capacity = source.capacity;
    courseTime.maxWaitingCount = source.maxWaitingCount;
    courseTime.enrollmentMethod = source.enrollmentMethod;
    courseTime.minProgressForCompletion = source.minProgressForCompletion;
    courseTime.price = source.price;
    courseTime.free = source.free;
    courseTime.locationInfo = source.locationInfo;
    courseTime.allowLateEnrollment = source.allowLateEnrollment;
    courseTime.cmCourseId = source.cmCourseId;
    courseTime.cmCourseVersionId = source.cmCourseVersionId;

    // 새로 지정하는 필드
    courseTime.title = newTitle;
    courseTime.enrollStartDate = enrollStartDate;
    courseTime.enrollEndDate = enrollEndDate;
    courseTime.classStartDate = classStartDate;
    courseTime.classEndDate = classEndDate;
    courseTime.createdBy = createdBy;

    // 고정 값
    courseTime.status = CourseTimeStatus.DRAFT;
    courseTime.currentEnrollment = 0;

    return courseTime;
}
```

### 6.2 Service - validateDateRange() 리팩토링 (Option B)

**변경 전**: DTO에 의존
```java
private void validateDateRange(CreateCourseTimeRequest request)
```

**변경 후**: 값에 의존 (재사용 가능)
```java
private void validateDateRange(
        LocalDate enrollStartDate,
        LocalDate enrollEndDate,
        LocalDate classStartDate,
        LocalDate classEndDate
) {
    if (enrollEndDate.isAfter(classEndDate)) {
        throw new InvalidDateRangeException("모집 종료일은 학습 종료일 이전이어야 합니다");
    }
    if (enrollStartDate.isAfter(enrollEndDate)) {
        throw new InvalidDateRangeException("모집 시작일은 모집 종료일 이전이어야 합니다");
    }
    if (classStartDate.isAfter(classEndDate)) {
        throw new InvalidDateRangeException("학습 시작일은 학습 종료일 이전이어야 합니다");
    }
}

// 기존 DTO용 오버로드 메서드 유지
private void validateDateRange(CreateCourseTimeRequest request) {
    validateDateRange(
            request.enrollStartDate(),
            request.enrollEndDate(),
            request.classStartDate(),
            request.classEndDate()
    );
}
```

### 6.3 Service - cloneCourseTime() 구현

```java
@Override
@Transactional
public CourseTimeDetailResponse cloneCourseTime(Long sourceId, CloneCourseTimeRequest request, Long createdBy) {
    log.info("Cloning course time: sourceId={}, newTitle={}", sourceId, request.title());

    // 1. 원본 차수 조회
    CourseTime source = courseTimeRepository.findByIdAndTenantId(sourceId, TenantContext.getCurrentTenantId())
            .orElseThrow(() -> new CourseTimeNotFoundException(sourceId));

    // 2. 날짜 유효성 검증
    validateDateRange(
            request.enrollStartDate(),
            request.enrollEndDate(),
            request.classStartDate(),
            request.classEndDate()
    );

    // 3. 복제 수행
    CourseTime cloned = CourseTime.cloneFrom(
            source,
            request.title(),
            request.enrollStartDate(),
            request.enrollEndDate(),
            request.classStartDate(),
            request.classEndDate(),
            createdBy
    );

    // 4. 저장 및 반환
    CourseTime savedCourseTime = courseTimeRepository.save(cloned);
    log.info("Course time cloned: sourceId={}, newId={}", sourceId, savedCourseTime.getId());

    return CourseTimeDetailResponse.from(savedCourseTime);
}
```

### 6.4 Controller - 엔드포인트

```java
@PostMapping("/{id}/clone")
@PreAuthorize("hasAnyRole('OPERATOR', 'TENANT_ADMIN')")
public ResponseEntity<ApiResponse<CourseTimeDetailResponse>> cloneCourseTime(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CloneCourseTimeRequest request
) {
    CourseTimeDetailResponse response = courseTimeService.cloneCourseTime(id, request, principal.id());
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
}
```

---

## 7. 테스트 결과

### 테스트 케이스

| 테스트 | 설명 | 결과 |
|--------|------|------|
| `cloneCourseTime_success` | DRAFT 상태 원본 복제 성공 | ✅ 201 Created |
| `cloneCourseTime_success_fromOngoing` | ONGOING 상태 원본 복제 성공 (R-CLONE-01) | ✅ 201 Created |
| `cloneCourseTime_fail_sourceNotFound` | 원본 미존재 시 404 | ✅ 404 (TS001) |
| `cloneCourseTime_fail_invalidDateRange` | 날짜 검증 실패 시 400 | ✅ 400 (TS004) |
| `cloneCourseTime_fail_titleRequired` | 필수 필드 누락 시 400 | ✅ 400 |
| `cloneCourseTime_fail_forbidden` | 권한 없는 사용자 접근 시 403 | ✅ 403 |

### 전체 테스트

```
BUILD SUCCESSFUL
All tests passed
```

---

## 8. API 명세

### POST /api/times/{id}/clone

차수를 복제하여 새 차수 생성

#### Request

```json
{
  "title": "Spring Boot 기초 2차",
  "enrollStartDate": "2025-02-01",
  "enrollEndDate": "2025-02-15",
  "classStartDate": "2025-02-20",
  "classEndDate": "2025-03-20"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "Spring Boot 기초 2차",
    "status": "DRAFT",
    "deliveryType": "ONLINE",
    "enrollStartDate": "2025-02-01",
    "enrollEndDate": "2025-02-15",
    "classStartDate": "2025-02-20",
    "classEndDate": "2025-03-20",
    "capacity": 30,
    "currentEnrollment": 0,
    ...
  }
}
```

#### 권한

- OPERATOR
- TENANT_ADMIN

---

## 9. 설계 결정사항

### 9.1 validateDateRange 리팩토링 - Option B 선택

| Option | 설명 | 선택 |
|--------|------|------|
| Option A | 별도 메서드 추출 (같은 시그니처) | ❌ |
| **Option B** | **파라미터 기반으로 변경 (재사용 가능)** | **✅** |

**이유**: 검증 로직은 "요청 객체"가 아닌 "데이터 값"에 의존해야 재사용성 향상

### 9.2 TenantId/Auditing 처리

- `id = null` 유지 → JPA persist 시 새 ID 자동 채번
- `tenantId`는 TenantEntityListener가 자동 설정
- 원본 복사 X → 현재 TenantContext 기준

### 9.3 locationInfo 검증

- 원본이 OFFLINE/BLENDED면 locationInfo가 이미 있음
- 복제 시 그대로 복사되므로 추가 검증 불필요

---

## 10. 컨벤션 준수 체크

### Entity (06-ENTITY-CONVENTIONS)

- [x] Setter 금지 → 정적 팩토리 메서드 사용
- [x] `cloneFrom()` 복제 전용 메서드 추가
- [x] 비즈니스 로직 캡슐화

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Bean Validation 어노테이션 적용
- [x] 한글 에러 메시지

### Service (04-SERVICE-CONVENTIONS)

- [x] `@Transactional(readOnly = true)` 클래스 레벨
- [x] `@Transactional` 쓰기 메서드
- [x] 비즈니스 로직 검증

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@PreAuthorize` 권한 검증
- [x] `@Valid` 요청 검증
- [x] 201 Created 응답

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Given-When-Then 패턴
- [x] `@DisplayName` 한글 설명
- [x] 성공/실패 케이스 모두 테스트

---

## 11. 다음 작업

| 이슈 | 내용 | 비고 |
|------|------|------|
| - | TS 모듈 완료 | 현재 ~95% 완성 |
| - | CM-TS 연동 강화 | CM 모듈 구현 후 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-17 | Claude Code | Phase 7 구현 완료 - 차수 복제 API |

---

*최종 업데이트: 2025-12-17*

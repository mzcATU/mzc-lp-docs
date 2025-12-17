# Backend TS 모듈 개발 로그 - Phase 6

> 차수 오픈 시 MAIN 강사 필수 검증 추가

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-17 |
| **관련 이슈** | [#89](https://github.com/mzcATU/mzc-lp-backend/issues/89) |
| **담당 모듈** | TS (Time Schedule - 차수 관리) |

---

## 1. 구현 개요

차수를 RECRUITING 상태로 오픈할 때 MAIN 강사가 최소 1명 배정되어 있는지 검증하는 로직 추가:

| 구성요소 | 내용 |
|----------|------|
| ErrorCode | MAIN_INSTRUCTOR_REQUIRED (TS008) |
| Exception | MainInstructorRequiredException (신규) |
| Service | CourseTimeServiceImpl.openCourseTime() 검증 로직 추가 |
| Test | CourseTimeControllerTest 테스트 케이스 추가 |

---

## 2. 비즈니스 규칙

### 검증 배경

MAIN 강사 없이 차수가 오픈되면 발생할 수 있는 문제:
- 수강생 등록은 가능하지만 강의 진행자가 없음
- 운영상의 혼란 발생
- 수강생 관리 불가

### 규칙 정의

| 규칙 | 설명 | 에러 코드 |
|------|------|----------|
| R-IIS-01 | 차수당 MAIN 강사는 반드시 1명 이상 | TS008 |
| R-TS-OPEN | DRAFT → RECRUITING 전이 시 MAIN 강사 필수 | TS008 |

---

## 3. 신규 생성 파일 (1개)

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| MainInstructorRequiredException.java | `ts/exception/` | MAIN 강사 미배정 예외 |

```java
public class MainInstructorRequiredException extends BusinessException {

    public MainInstructorRequiredException() {
        super(ErrorCode.MAIN_INSTRUCTOR_REQUIRED);
    }

    public MainInstructorRequiredException(Long courseTimeId) {
        super(ErrorCode.MAIN_INSTRUCTOR_REQUIRED,
                String.format("Main instructor required for course time: %d", courseTimeId));
    }
}
```

---

## 4. 수정된 파일 (3개)

| 파일 | 변경 내용 |
|------|----------|
| ErrorCode.java | `MAIN_INSTRUCTOR_REQUIRED(TS008)` 추가 |
| CourseTimeServiceImpl.java | `InstructorAssignmentService` 의존성 주입, 검증 로직 추가 |
| CourseTimeControllerTest.java | Mock 설정 및 MAIN 강사 검증 테스트 케이스 추가 |

---

## 5. 파일 구조

```
domain/ts/
├── exception/
│   ├── CourseTimeNotFoundException.java
│   ├── CourseTimeNotModifiableException.java
│   ├── LocationRequiredException.java
│   └── MainInstructorRequiredException.java  ✅ 신규
└── service/
    └── CourseTimeServiceImpl.java            ✅ 수정

common/constant/
└── ErrorCode.java                            ✅ 수정

test/.../ts/controller/
└── CourseTimeControllerTest.java             ✅ 수정
```

---

## 6. 검증 순서 (openCourseTime)

```java
@Override
@Transactional
public CourseTimeDetailResponse openCourseTime(Long id) {
    // 1. 차수 조회 및 존재 검증
    CourseTime courseTime = courseTimeRepository.findByIdAndTenantId(id, ...)
            .orElseThrow(() -> new CourseTimeNotFoundException(id));  // TS001

    // 2. 상태 전이 검증 (DRAFT만 허용)
    if (!courseTime.isDraft()) {
        throw new InvalidStatusTransitionException(...);  // TS002
    }

    // 3. 장소 정보 검증 (OFFLINE/BLENDED)
    if (courseTime.requiresLocationInfo() && ...) {
        throw new LocationRequiredException();  // TS005
    }

    // 4. MAIN 강사 검증 ✅ 신규
    if (!instructorAssignmentService.existsMainInstructor(id)) {
        throw new MainInstructorRequiredException(id);  // TS008
    }

    // 5. 상태 전환 실행
    courseTime.open();
    return CourseTimeDetailResponse.from(courseTime);
}
```

---

## 7. 모듈 간 의존성

### 아키텍처

```
┌──────────────────────────────────┐
│    CourseTimeServiceImpl (TS)    │
│                                  │
│  - courseTimeRepository          │
│  - instructorAssignmentService   │  ← IIS Service 의존성 추가
└──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│  InstructorAssignmentService     │
│            (IIS)                 │
│                                  │
│  + existsMainInstructor(timeId)  │
└──────────────────────────────────┘
```

### 의존성 주입

```java
@Service
@RequiredArgsConstructor
public class CourseTimeServiceImpl implements CourseTimeService {

    private final CourseTimeRepository courseTimeRepository;
    private final InstructorAssignmentService instructorAssignmentService;  // ✅ 추가
```

---

## 8. 테스트 결과

### 테스트 케이스

| 테스트 | 설명 | 결과 |
|--------|------|------|
| `openCourseTime_success` | MAIN 강사 배정 후 오픈 | ✅ 200 OK |
| `openCourseTime_fail_noMainInstructor` | MAIN 강사 미배정 상태에서 오픈 | ✅ 400 (TS008) |
| `openCourseTime_fail_alreadyRecruiting` | 이미 RECRUITING 상태에서 오픈 시도 | ✅ 400 (TS002) |

### Mock 설정

```java
@MockitoBean
private InstructorAssignmentService instructorAssignmentService;

// 성공 케이스
when(instructorAssignmentService.existsMainInstructor(courseTime.getId()))
    .thenReturn(true);

// 실패 케이스
when(instructorAssignmentService.existsMainInstructor(courseTime.getId()))
    .thenReturn(false);
```

### 전체 테스트

```
BUILD SUCCESSFUL
All tests passed
```

---

## 9. 에러 코드 목록 (TS)

| 코드 | 이름 | HTTP Status | 설명 |
|------|------|-------------|------|
| TS001 | COURSE_TIME_NOT_FOUND | 404 | 차수를 찾을 수 없음 |
| TS002 | INVALID_STATUS_TRANSITION | 400 | 잘못된 상태 전이 |
| TS003 | CAPACITY_EXCEEDED | 409 | 정원 초과 |
| TS004 | INVALID_DATE_RANGE | 400 | 잘못된 날짜 범위 |
| TS005 | LOCATION_REQUIRED | 400 | 장소 정보 필수 (OFFLINE/BLENDED) |
| TS006 | COURSE_TIME_NOT_MODIFIABLE | 400 | 수정 불가 상태 |
| TS007 | CANNOT_DELETE_MAIN_INSTRUCTOR | 400 | ONGOING 상태에서 MAIN 강사 삭제 불가 |
| **TS008** | **MAIN_INSTRUCTOR_REQUIRED** | **400** | **차수 오픈 시 MAIN 강사 필수** ✅ 신규 |

---

## 10. 컨벤션 준수 체크

### Exception (06-EXCEPTION-CONVENTIONS)

- [x] `BusinessException` 상속
- [x] 에러 코드 enum 사용 (TS008)
- [x] 기본 생성자 제공
- [x] 파라미터 생성자 제공 (courseTimeId)
- [x] 기존 Exception 패턴 준수 (LocationRequiredException 참고)

### Service (05-SERVICE-CONVENTIONS)

- [x] `@Transactional(readOnly = true)` 클래스 레벨
- [x] `@Transactional` 쓰기 메서드
- [x] 비즈니스 로직 캡슐화
- [x] 다른 모듈 접근 시 Service 사용 (Repository 직접 참조 X)

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Given-When-Then 패턴
- [x] `@DisplayName` 한글 설명
- [x] Mock 설정 명확한 주석
- [x] 에러 코드 검증

---

## 11. 다음 작업

| 이슈 | 내용 | 비고 |
|------|------|------|
| - | 차수 시작(startCourseTime) 시 추가 검증 | 필요시 검토 |
| - | MAIN 강사 변경/삭제 시 차수 상태 검증 강화 | IIS 모듈에서 처리 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-17 | Claude Code | Phase 6 구현 완료 - 차수 오픈 시 MAIN 강사 검증 |

---

*최종 업데이트: 2025-12-17*

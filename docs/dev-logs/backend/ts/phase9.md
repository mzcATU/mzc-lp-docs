# Backend TS 모듈 개발 로그 - Phase 9

> CourseTime 생성/오픈 시 Program 연결 로직 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-26 |
| **관련 이슈** | [#179](https://github.com/mzcATU/mzc-lp-backend/issues/179) |
| **담당 모듈** | TS (Time Schedule - 차수 관리), Program |

---

## 1. 구현 개요

CourseTime 생성 시 Program 연결 및 검증 로직 추가:

| 구성요소 | 내용 |
|----------|------|
| CourseTime 생성 | 승인된 Program만 차수 생성 가능 |
| CourseTime 오픈 | Program 연결 및 승인 상태 검증 |
| 예외 | ProgramNotApprovedException (PG004) |

---

## 2. 비즈니스 규칙

### Program-CourseTime 연결 정책

| 규칙 | 설명 | 구현 |
|------|------|------|
| R-PGM-01 | CourseTime 생성 시 `programId` 필수 | ✅ |
| R-PGM-02 | 승인된(APPROVED) Program만 차수 생성 가능 | ✅ |
| R-PGM-03 | CourseTime 오픈 시 Program 연결 검증 | ✅ |
| R-PGM-04 | CourseTime 오픈 시 Program 승인 상태 검증 | ✅ |

### 기존 필드 처리

| 필드 | 상태 | 비고 |
|------|------|------|
| `programId` | ✅ 신규 | Program 연결용 |
| `cmCourseId` | @Deprecated | 점진적 마이그레이션 |
| `cmCourseVersionId` | @Deprecated | 점진적 마이그레이션 |

---

## 3. 신규 생성 파일 (1개)

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| ProgramNotApprovedException.java | `program/exception/` | 미승인 프로그램 차수 생성 예외 (PG004) |

```java
// ProgramNotApprovedException.java
public class ProgramNotApprovedException extends BusinessException {

    public ProgramNotApprovedException() {
        super(ErrorCode.PROGRAM_NOT_APPROVED);
    }

    public ProgramNotApprovedException(Long programId) {
        super(ErrorCode.PROGRAM_NOT_APPROVED, "승인된 프로그램만 차수를 생성할 수 있습니다. ID: " + programId);
    }
}
```

---

## 4. 수정된 파일 (4개)

### 메인 코드 (2개)

| 파일 | 변경 내용 |
|------|----------|
| CreateCourseTimeRequest.java | `programId` 필드 추가 (첫 번째 위치, @NotNull) |
| CourseTimeServiceImpl.java | `ProgramRepository` 의존성 추가, Program 검증 로직 |

### 테스트 코드 (2개)

| 파일 | 변경 내용 |
|------|----------|
| CourseTimeControllerTest.java | `ProgramRepository` 주입, 승인된 Program fixture 생성 |
| CourseTimeServiceTest.java | `ProgramRepository` Mock 추가, 테스트 fixture 수정 |

---

## 5. 파일 구조

```
domain/program/
└── exception/
    └── ProgramNotApprovedException.java       ✅ 신규

domain/ts/
├── dto/request/
│   └── CreateCourseTimeRequest.java           ✅ 수정
└── service/
    └── CourseTimeServiceImpl.java             ✅ 수정

test/.../ts/controller/
└── CourseTimeControllerTest.java              ✅ 수정

test/.../ts/service/
└── CourseTimeServiceTest.java                 ✅ 수정
```

---

## 6. 핵심 구현

### 6.1 DTO - programId 필드 추가

```java
public record CreateCourseTimeRequest(
        @NotNull(message = "프로그램 ID는 필수입니다")
        Long programId,

        @Deprecated
        Long cmCourseId,

        @Deprecated
        Long cmCourseVersionId,

        // ... 기존 필드들
) {}
```

### 6.2 Service - Program 연결 로직

**CourseTimeServiceImpl.java - createCourseTime()**
```java
private final ProgramRepository programRepository;

@Override
@Transactional
public CourseTimeDetailResponse createCourseTime(CreateCourseTimeRequest request, Long createdBy) {
    // 1. Program 조회
    Program program = programRepository.findByIdAndTenantId(
            request.programId(), TenantContext.getCurrentTenantId())
            .orElseThrow(() -> new ProgramNotFoundException(request.programId()));

    // 2. 승인된 Program만 차수 생성 가능
    if (!program.canCreateTime()) {
        throw new ProgramNotApprovedException(request.programId());
    }

    // 3. 날짜 검증
    validateDates(request.enrollStartDate(), request.enrollEndDate(),
                  request.classStartDate(), request.classEndDate());

    // 4. CourseTime 생성 및 Program 연결
    CourseTime courseTime = CourseTime.create(...);
    courseTime.linkProgram(program);

    CourseTime saved = courseTimeRepository.save(courseTime);
    return CourseTimeDetailResponse.from(saved);
}
```

**CourseTimeServiceImpl.java - openCourseTime()**
```java
@Override
@Transactional
public CourseTimeDetailResponse openCourseTime(Long id) {
    CourseTime courseTime = getCourseTimeOrThrow(id);

    // 1. Program 연결 여부 검증
    if (courseTime.getProgram() == null) {
        throw new ProgramNotFoundException();
    }

    // 2. Program 승인 상태 검증
    if (!courseTime.getProgram().isApproved()) {
        throw new ProgramNotApprovedException(courseTime.getProgram().getId());
    }

    // 3. 기존 검증 (locationInfo, MAIN 강사)
    // ...

    courseTime.open();
    return CourseTimeDetailResponse.from(courseTime);
}
```

### 6.3 테스트 - Program fixture 추가

**CourseTimeControllerTest.java**
```java
@Autowired
private ProgramRepository programRepository;

private Program testProgram;

@BeforeEach
void setUp() {
    testProgram = createApprovedProgram();
}

private Program createApprovedProgram() {
    Program program = Program.create("테스트 프로그램", 1L);
    program.submit();
    program.approve(1L, "테스트 승인");
    return programRepository.save(program);
}

private CourseTime createTestCourseTime() {
    CourseTime courseTime = CourseTime.create(...);
    courseTime.linkProgram(testProgram);  // Program 연결
    return courseTimeRepository.save(courseTime);
}
```

---

## 7. 테스트 결과

### 수정된 테스트 케이스

| 테스트 파일 | 변경 내용 | 결과 |
|-------------|----------|------|
| CourseTimeControllerTest | 승인된 Program fixture, `programId` 파라미터 추가 | ✅ Pass |
| CourseTimeServiceTest | ProgramRepository Mock, 날짜 검증 테스트 | ✅ Pass |

### 전체 테스트

```
BUILD SUCCESSFUL
All tests passed (528 tests)
```

---

## 8. API 변경

### Request Body - CourseTime 생성

**변경 전**
```json
{
  "cmCourseId": 1,
  "cmCourseVersionId": 1,
  "title": "1차수",
  ...
}
```

**변경 후**
```json
{
  "programId": 1,
  "cmCourseId": null,
  "cmCourseVersionId": null,
  "title": "1차수",
  ...
}
```

### 에러 응답

**400 Bad Request - Program 미승인**
```json
{
  "success": false,
  "error": {
    "code": "PG004",
    "message": "승인된 프로그램만 차수를 생성할 수 있습니다. ID: 1"
  }
}
```

---

## 9. 설계 결정사항

### 9.1 검증 위치 - Service Layer

| 위치 | 장점 | 단점 | 선택 |
|------|------|------|------|
| Controller | 빠른 실패 | 비즈니스 로직 분산 | ❌ |
| **Service** | **비즈니스 로직 집중** | - | **✅** |
| Entity | DDD 원칙 | 외부 의존성 필요 | ❌ |

**이유**: Program 검증은 비즈니스 규칙이므로 Service Layer에서 처리

### 9.2 기존 필드 처리 - @Deprecated

| 방식 | 설명 | 선택 |
|------|------|------|
| 즉시 제거 | 호환성 문제 | ❌ |
| **@Deprecated** | **점진적 마이그레이션** | **✅** |

**이유**: 기존 API 호출 호환성 유지, 점진적 제거 예정

### 9.3 기존 메서드 활용

| 메서드 | 용도 | 위치 |
|------|------|------|
| `Program.canCreateTime()` | 차수 생성 가능 여부 (APPROVED 상태) | Program:200-202 |
| `Program.isApproved()` | 승인 상태 확인 | Program:184-186 |
| `CourseTime.linkProgram()` | Program 연결 | CourseTime:191-193 |

---

## 10. 컨벤션 준수 체크

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] @NotNull 검증 어노테이션
- [x] @Deprecated 마이그레이션 표시

### Service (04-SERVICE-CONVENTIONS)

- [x] @RequiredArgsConstructor 생성자 주입
- [x] @Transactional 쓰기 메서드
- [x] 비즈니스 로직 검증

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] BusinessException 상속
- [x] ErrorCode enum 사용
- [x] 도메인별 코드 프리픽스 (PG004)

### Git (02-GIT-CONVENTIONS)

- [x] 브랜치: `feat/ts-program-link`
- [x] 커밋 메시지: `[Feat] CourseTime 생성 시 Program 연결 및 검증 로직 추가 (#179)`

---

## 11. 다음 작업

| 이슈 | 내용 | 비고 |
|------|------|------|
| - | cmCourseId, cmCourseVersionId 제거 | @Deprecated 필드 정리 |
| - | CourseTimeDetailResponse에 programId 추가 | 응답 개선 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-26 | Claude Code | Phase 9 구현 완료 - CourseTime-Program 연결 로직 |

---

*최종 업데이트: 2025-12-26*

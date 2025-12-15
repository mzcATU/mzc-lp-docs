# Backend CM 모듈 개발 로그 - Phase 2

> Course CRUD API 구현 (Service, Controller, Test)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#53](https://github.com/mzcATU/mzc-lp-backend/issues/53) |
| **PR** | [#55](https://github.com/mzcATU/mzc-lp-backend/pull/55) |
| **담당 모듈** | CM (Course Matrix - 강의 템플릿 관리) |
| **의존성** | Phase 1 완료 필요 |

---

## 1. 구현 개요

강의 템플릿(Course) CRUD API 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | CourseService 인터페이스, CourseServiceImpl 구현체 |
| Controller | CourseController (6개 엔드포인트) |
| Test | CourseControllerTest (25개 테스트 케이스) |

---

## 2. 신규 생성 파일 (4개)

### Service (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseService.java | `service/` | 강의 CRUD 서비스 인터페이스 |
| CourseServiceImpl.java | `service/` | 강의 CRUD 서비스 구현체 |

### Controller (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseController.java | `controller/` | 강의 CRUD REST API 컨트롤러 |

### Test (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseControllerTest.java | `test/.../course/controller/` | 컨트롤러 통합 테스트 |

---

## 3. API 목록

| Method | Endpoint | 기능 | HTTP Status | 권한 |
|--------|----------|------|-------------|------|
| POST | `/api/courses` | 강의 생성 | 201 Created | DESIGNER, OPERATOR, TENANT_ADMIN |
| GET | `/api/courses` | 강의 목록 (페이징/필터) | 200 OK | 인증된 사용자 |
| GET | `/api/courses/{courseId}` | 강의 상세 | 200 OK | 인증된 사용자 |
| GET | `/api/courses/instructor/{instructorId}` | 강사별 강의 목록 | 200 OK | 인증된 사용자 |
| PUT | `/api/courses/{courseId}` | 강의 수정 | 200 OK | DESIGNER, OPERATOR, TENANT_ADMIN |
| DELETE | `/api/courses/{courseId}` | 강의 삭제 | 204 No Content | DESIGNER, OPERATOR, TENANT_ADMIN |

---

## 4. 파일 구조

```
domain/course/
├── controller/
│   └── CourseController.java       ✅ 신규
└── service/
    ├── CourseService.java          ✅ 신규
    └── CourseServiceImpl.java      ✅ 신규

test/.../domain/course/
└── controller/
    └── CourseControllerTest.java   ✅ 신규
```

---

## 5. Service 인터페이스

```java
public interface CourseService {
    CourseResponse createCourse(CreateCourseRequest request);
    Page<CourseResponse> getCourses(String keyword, Long categoryId, Pageable pageable);
    CourseDetailResponse getCourseDetail(Long courseId);
    Page<CourseResponse> getCoursesByInstructor(Long instructorId, Pageable pageable);
    CourseResponse updateCourse(Long courseId, UpdateCourseRequest request);
    void deleteCourse(Long courseId);
}
```

---

## 6. TenantId 처리 방안

현재 `UserPrincipal`에 `tenantId`가 없으므로, 단일 테넌트(B2C) 가정으로 기본값 사용:

```java
// CourseServiceImpl.java
private static final Long DEFAULT_TENANT_ID = 1L;

// 조회 시 tenantId 포함
courseRepository.findByIdAndTenantId(courseId, DEFAULT_TENANT_ID);
```

**추후 확인 필요:**
- `UserPrincipal`에 `tenantId` 필드 추가 시 수정 필요
- B2B 멀티테넌트 지원 시 동적 tenantId 처리 로직 필요

---

## 7. 권한 체계

### 적용된 권한

```java
@PreAuthorize("hasAnyRole('DESIGNER', 'OPERATOR', 'TENANT_ADMIN')")
```

| API | 권한 요구사항 |
|-----|---------------|
| 생성 (POST) | DESIGNER, OPERATOR, TENANT_ADMIN |
| 조회 (GET) | 인증된 사용자 (권한 무관) |
| 수정 (PUT) | DESIGNER, OPERATOR, TENANT_ADMIN |
| 삭제 (DELETE) | DESIGNER, OPERATOR, TENANT_ADMIN |

### 권한 구조 참고

| Enum | 용도 | 위치 |
|------|------|------|
| `TenantRole` | 테넌트 레벨 권한 | USER, OPERATOR, TENANT_ADMIN |
| `CourseRole` | 강의 레벨 권한 | DESIGNER, OWNER, INSTRUCTOR |

**추후 확인 필요:**
- `DESIGNER`는 `CourseRole`이므로 `UserCourseRole` 통해 부여됨
- 테스트에서는 `TenantRole.OPERATOR` 사용

---

## 8. 테스트 케이스 (25개)

### POST /api/courses - 강의 생성 (7개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| createCourse_success_operator | ✅ | OPERATOR가 강의 생성 |
| createCourse_success_admin | ✅ | TENANT_ADMIN이 강의 생성 |
| createCourse_success_minimalFields | ✅ | 최소 필드(title만)로 생성 |
| createCourse_fail_missingTitle | ✅ | 제목 누락 (400) |
| createCourse_fail_emptyTitle | ✅ | 빈 문자열 제목 (400) |
| createCourse_fail_titleTooLong | ✅ | 제목 255자 초과 (400) |
| createCourse_fail_userRole | ✅ | USER 권한 거부 (403) |
| createCourse_fail_unauthorized | ✅ | 인증 없이 접근 (403) |

### GET /api/courses - 강의 목록 조회 (5개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| getCourses_success | ✅ | 전체 목록 조회 |
| getCourses_success_withKeyword | ✅ | 키워드 검색 |
| getCourses_success_withCategoryFilter | ✅ | 카테고리 필터 |
| getCourses_success_pagination | ✅ | 페이징 처리 |
| getCourses_success_empty | ✅ | 빈 결과 |

### GET /api/courses/{courseId} - 강의 상세 조회 (2개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| getCourseDetail_success | ✅ | 상세 조회 성공 |
| getCourseDetail_fail_notFound | ✅ | 존재하지 않는 강의 (404) |

### GET /api/courses/instructor/{instructorId} - 강사별 목록 (2개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| getCoursesByInstructor_success | ✅ | 강사별 목록 조회 |
| getCoursesByInstructor_success_empty | ✅ | 강의 없는 강사 |

### PUT /api/courses/{courseId} - 강의 수정 (4개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| updateCourse_success_operator | ✅ | OPERATOR가 수정 |
| updateCourse_success_partial | ✅ | 부분 수정 |
| updateCourse_fail_notFound | ✅ | 존재하지 않는 강의 (404) |
| updateCourse_fail_userRole | ✅ | USER 권한 거부 (403) |

### DELETE /api/courses/{courseId} - 강의 삭제 (5개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| deleteCourse_success_operator | ✅ | OPERATOR가 삭제 |
| deleteCourse_success_admin | ✅ | TENANT_ADMIN이 삭제 |
| deleteCourse_fail_notFound | ✅ | 존재하지 않는 강의 (404) |
| deleteCourse_fail_userRole | ✅ | USER 권한 거부 (403) |
| deleteCourse_fail_unauthorized | ✅ | 인증 없이 접근 (403) |

---

## 9. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@RestController`, `@RequestMapping`, `@RequiredArgsConstructor`, `@Validated`
- [x] `@Valid @RequestBody` 사용
- [x] try-catch 미사용 (GlobalExceptionHandler 위임)
- [x] Service만 호출
- [x] `@PreAuthorize` 권한 설정
- [x] `@PathVariable @Positive` 검증

### Service (04-SERVICE-CONVENTIONS)

- [x] 인터페이스 + 구현체 분리
- [x] `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`
- [x] 로깅: INFO(주요 이벤트), DEBUG(조회)

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc`
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴
- [x] 헬퍼 메서드 활용 (createOperatorUser, loginAndGetAccessToken 등)

---

## 10. 주요 구현 사항

### CourseServiceImpl 특징

| 기능 | 구현 내용 |
|------|----------|
| 목록 조회 | 키워드/카테고리 조합별 분기 처리 |
| 상세 조회 | Fetch Join으로 Item 함께 조회 |
| 수정 | Entity 비즈니스 메서드 활용 (update) |
| 삭제 | JPA cascade 활용 |

### CourseController 특징

| 기능 | 구현 내용 |
|------|----------|
| 응답 | `ApiResponse<T>` 래핑 |
| 페이징 | `@PageableDefault(size = 20)` |
| 인증 | `@AuthenticationPrincipal UserPrincipal` |
| 검증 | `@Valid`, `@Positive` |

### 테스트 헬퍼 메서드

| 메서드 | 용도 |
|--------|------|
| `createOperatorUser()` | OPERATOR 권한 사용자 생성 |
| `createAdminUser()` | TENANT_ADMIN 권한 사용자 생성 |
| `createTestUser()` | USER 권한 사용자 생성 (회원가입 API) |
| `loginAndGetAccessToken()` | 로그인 후 AccessToken 반환 |
| `createTestCourse()` | 테스트용 강의 생성 |

---

## 11. 다음 작업 (Phase 3)

### CourseItem API 구현 (계층 구조)

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/courses/{courseId}/items` | 차시 추가 |
| POST | `/api/courses/{courseId}/folders` | 폴더 생성 |
| GET | `/api/courses/{courseId}/items/hierarchy` | 계층 구조 조회 |
| GET | `/api/courses/{courseId}/items/ordered` | 순서대로 조회 |
| PUT | `/api/courses/{courseId}/items/move` | 항목 이동 |
| PATCH | `/api/courses/{courseId}/items/{itemId}/name` | 이름 변경 |
| DELETE | `/api/courses/{courseId}/items/{itemId}` | 항목 삭제 |

**필요 작업:**
- CourseItemService 인터페이스/구현체 작성
- CourseItemController 작성
- 계층 구조 조회 로직 구현
- Controller 테스트 작성

---

## 관련 문서

- [Phase 2 Fix](phase2-fix.md) - 필드 정합성 수정 (thumbnailUrl 추가, instructorId/sortOrder 제거)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 2 구현 완료 (Service, Controller, Test) |

---

*최종 업데이트: 2025-12-15*

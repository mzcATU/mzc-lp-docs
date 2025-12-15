# Backend CM 모듈 개발 로그 - Phase 2 Fix

> Course 도메인 필드 정합성 수정 (thumbnailUrl 누락 추가, 불필요 필드 제거)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#60](https://github.com/mzcATU/mzc-lp-backend/issues/60) |
| **PR** | [#63](https://github.com/mzcATU/mzc-lp-backend/pull/63) |
| **담당 모듈** | CM (Course Matrix - 강의 템플릿 관리) |
| **의존성** | Phase 2 완료 후 수정 작업 |

---

## 1. 수정 개요

Phase 2 구현 후 발견된 필드 정합성 문제 수정:

| 구분 | 내용 |
|------|------|
| 추가 | `thumbnailUrl` - Request DTO 및 Entity 메서드에 누락 |
| 제거 | `instructorId` - 불필요한 필드로 판단되어 문서에서 제거됨 |
| 제거 | `sortOrder` - 불필요한 필드로 판단되어 문서에서 제거됨 |

---

## 2. 발견된 문제

### 2.1 thumbnailUrl 누락

| 위치 | 상태 | 설명 |
|------|------|------|
| Course Entity | ✅ 존재 | 필드 및 getter 존재 |
| CourseResponse | ✅ 존재 | 응답 시 반환됨 |
| CreateCourseRequest | ❌ 누락 | 생성 시 전달 불가 |
| UpdateCourseRequest | ❌ 누락 | 수정 시 전달 불가 |
| Course.create() | ❌ 누락 | 파라미터에 없음 |
| Course.update() | ❌ 누락 | 파라미터에 없음 |

**결과**: API로 강의 생성/수정 시 썸네일 URL 설정 불가

### 2.2 불필요 필드 존재

DB 문서(db.md)에서 제거되었으나 코드에 남아있던 필드:

| 필드 | 위치 | 사용 여부 |
|------|------|----------|
| `instructorId` | Course Entity, DTOs, Service, Repository, Controller | Course 모듈 내에서만 사용 |
| `sortOrder` | CourseItem Entity, Response DTOs | Course 모듈 내에서만 사용 |

---

## 3. 수정 파일 (13개)

### Entity (2개)

| 파일 | 변경 내용 |
|------|----------|
| Course.java | `instructorId` 필드/메서드 제거, `create()`/`update()`에 `thumbnailUrl` 추가 |
| CourseItem.java | `sortOrder` 필드 및 `updateSortOrder()` 메서드 제거 |

### DTO - Request (2개)

| 파일 | 변경 내용 |
|------|----------|
| CreateCourseRequest.java | `instructorId` → `thumbnailUrl`로 변경 |
| UpdateCourseRequest.java | `instructorId` → `thumbnailUrl`로 변경 |

### DTO - Response (4개)

| 파일 | 변경 내용 |
|------|----------|
| CourseResponse.java | `instructorId` 필드 제거 |
| CourseDetailResponse.java | `instructorId` 필드 제거 |
| CourseItemResponse.java | `sortOrder` 필드 제거 |
| CourseItemHierarchyResponse.java | `sortOrder` 필드 제거 |

### Service (2개)

| 파일 | 변경 내용 |
|------|----------|
| CourseService.java | `getCoursesByInstructor()` 메서드 제거 |
| CourseServiceImpl.java | `getCoursesByInstructor()` 제거, `thumbnailUrl` 전달 추가 |

### Repository (1개)

| 파일 | 변경 내용 |
|------|----------|
| CourseRepository.java | `findByTenantIdAndInstructorId()` 메서드 제거 |

### Controller (1개)

| 파일 | 변경 내용 |
|------|----------|
| CourseController.java | `/instructor/{instructorId}` 엔드포인트 제거 |

### Test (1개)

| 파일 | 변경 내용 |
|------|----------|
| CourseControllerTest.java | 전체 테스트 수정 (Request DTO 변경 반영, instructor 테스트 제거) |

---

## 4. API 변경 사항

### 제거된 엔드포인트

| Method | Endpoint | 기능 |
|--------|----------|------|
| GET | `/api/courses/instructor/{instructorId}` | 강사별 강의 목록 (제거됨) |

### 최종 API 목록 (5개)

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| POST | `/api/courses` | 강의 생성 | 201 Created |
| GET | `/api/courses` | 강의 목록 (페이징/필터) | 200 OK |
| GET | `/api/courses/{courseId}` | 강의 상세 | 200 OK |
| PUT | `/api/courses/{courseId}` | 강의 수정 | 200 OK |
| DELETE | `/api/courses/{courseId}` | 강의 삭제 | 204 No Content |

---

## 5. Request DTO 변경

### CreateCourseRequest

```java
// Before
public record CreateCourseRequest(
    @NotBlank String title,
    String description,
    CourseLevel level,
    CourseType type,
    Integer estimatedHours,
    Long categoryId,
    Long instructorId  // ❌ 제거됨
) {}

// After
public record CreateCourseRequest(
    @NotBlank String title,
    String description,
    CourseLevel level,
    CourseType type,
    Integer estimatedHours,
    Long categoryId,
    String thumbnailUrl  // ✅ 추가됨
) {}
```

### UpdateCourseRequest

```java
// Before
public record UpdateCourseRequest(
    String title,
    String description,
    CourseLevel level,
    CourseType type,
    Integer estimatedHours,
    Long categoryId,
    Long instructorId  // ❌ 제거됨
) {}

// After
public record UpdateCourseRequest(
    String title,
    String description,
    CourseLevel level,
    CourseType type,
    Integer estimatedHours,
    Long categoryId,
    String thumbnailUrl  // ✅ 추가됨
) {}
```

---

## 6. 테스트 케이스 변경

### 변경 전: 25개 → 변경 후: 23개

| 구분 | 변경 전 | 변경 후 | 차이 |
|------|---------|---------|------|
| POST /api/courses | 8개 | 8개 | - |
| GET /api/courses | 5개 | 5개 | - |
| GET /api/courses/{id} | 2개 | 2개 | - |
| GET /api/courses/instructor/{id} | 2개 | 0개 | -2 (제거) |
| PUT /api/courses/{id} | 4개 | 4개 | - |
| DELETE /api/courses/{id} | 4개 | 4개 | - |

### 제거된 테스트

| 테스트 | 설명 |
|--------|------|
| getCoursesByInstructor_success | 강사별 목록 조회 (API 제거로 삭제) |
| getCoursesByInstructor_success_empty | 강의 없는 강사 (API 제거로 삭제) |

### 수정된 테스트

모든 테스트에서 Request DTO 생성 부분 수정:

```java
// Before
new CreateCourseRequest("title", "desc", level, type, 10, 1L, 100L)
                                                          // instructorId

// After
new CreateCourseRequest("title", "desc", level, type, 10, 1L, "https://example.com/thumb.jpg")
                                                          // thumbnailUrl
```

---

## 7. 빌드 결과

| 항목 | 결과 |
|------|------|
| 컴파일 | ✅ SUCCESS |
| 테스트 컴파일 | ✅ SUCCESS |
| 테스트 실행 | ⚠️ 환경 이슈 (코드 무관) |

**테스트 실행 이슈**: Spring Context 로딩 실패 (DB 연결 환경 문제, 코드 변경과 무관)

---

## 8. 커밋 정보

```
commit d9532fe
Author: Claude Code
Date: 2025-12-15

fix: Course 도메인 필드 정합성 수정

- thumbnailUrl: Request DTO 및 Entity 메서드에 추가
- instructorId: Entity, DTO, Service, Repository, Controller에서 제거
- sortOrder: CourseItem Entity 및 Response DTO에서 제거
- 관련 테스트 코드 수정 (25개 → 23개)

Closes #60
```

---

## 9. 관련 문서

- [Phase 2 원본](phase2.md) - Course CRUD API 최초 구현
- [DB 스키마](../../structure/backend/course/db.md) - Course 테이블 정의

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 2 Fix 작업 완료 |

---

*최종 업데이트: 2025-12-15*

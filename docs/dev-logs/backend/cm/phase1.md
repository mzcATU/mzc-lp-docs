# Backend CM 모듈 개발 로그 - Phase 1

> CM 모듈 기반 구조 구현 (Entity, Repository, DTO, Exception)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **관련 이슈** | [#41](https://github.com/mzcATU/mzc-lp-backend/issues/41) |
| **PR** | [#44](https://github.com/mzcATU/mzc-lp-backend/pull/44) |
| **담당 모듈** | CM (Course Matrix - 강의 템플릿 관리) |

---

## 1. 구현 개요

강의 템플릿(Course) 관리를 위한 기반 구조 구현:

| 구성요소 | 내용 |
|----------|------|
| Entity | Course, CourseItem, CourseRelation |
| Enum | CourseLevel, CourseType |
| Repository | CourseRepository, CourseItemRepository, CourseRelationRepository |
| Exception | 5개 커스텀 예외 클래스 |
| DTO | Request 6개, Response 5개 |

---

## 2. 신규 생성 파일 (24개)

### Constant (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseLevel.java | `constant/` | 난이도 (BEGINNER, INTERMEDIATE, ADVANCED) |
| CourseType.java | `constant/` | 유형 (ONLINE, OFFLINE, BLENDED) |

### Entity (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| Course.java | `entity/` | 강의 메타데이터 (TenantEntity 상속) |
| CourseItem.java | `entity/` | 차시/폴더 (self-reference, depth 0~9) |
| CourseRelation.java | `entity/` | 학습 순서 (Linked List 패턴) |

### Repository (3개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseRepository.java | `repository/` | 강의 CRUD + 페이징/필터 쿼리 |
| CourseItemRepository.java | `repository/` | 차시/폴더 계층 구조 쿼리 |
| CourseRelationRepository.java | `repository/` | 학습 순서 조회/삭제 쿼리 |

### DTO - Request (6개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CreateCourseRequest.java | `dto/request/` | 강의 생성 요청 |
| UpdateCourseRequest.java | `dto/request/` | 강의 수정 요청 |
| CreateItemRequest.java | `dto/request/` | 차시 추가 요청 |
| CreateFolderRequest.java | `dto/request/` | 폴더 생성 요청 |
| MoveItemRequest.java | `dto/request/` | 항목 이동 요청 |
| CreateRelationRequest.java | `dto/request/` | 학습 순서 설정 요청 |

### DTO - Response (5개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseResponse.java | `dto/response/` | 강의 기본 응답 |
| CourseDetailResponse.java | `dto/response/` | 강의 상세 응답 |
| CourseItemResponse.java | `dto/response/` | 차시/폴더 응답 |
| CourseItemHierarchyResponse.java | `dto/response/` | 계층 구조 응답 |
| CourseRelationResponse.java | `dto/response/` | 학습 순서 응답 |

### Exception (5개)

| 파일 | 경로 | ErrorCode |
|------|------|-----------|
| CourseNotFoundException.java | `exception/` | CM001 |
| CourseItemNotFoundException.java | `exception/` | CM002 |
| MaxDepthExceededException.java | `exception/` | CM003 |
| CircularReferenceException.java | `exception/` | CM004 |
| InvalidParentException.java | `exception/` | CM005 |

---

## 3. 수정 파일 (1개)

### ErrorCode.java

```java
// 추가된 코드 (CM 모듈)
// Course (CM - Course Matrix)
CM_COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "CM001", "Course not found"),
CM_COURSE_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "CM002", "CourseItem not found"),
CM_MAX_DEPTH_EXCEEDED(HttpStatus.BAD_REQUEST, "CM003", "Max depth exceeded (10)"),
CM_CIRCULAR_REFERENCE(HttpStatus.BAD_REQUEST, "CM004", "Circular reference detected"),
CM_INVALID_PARENT(HttpStatus.BAD_REQUEST, "CM005", "Invalid parent"),
CM_LEARNING_OBJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "CM008", "LearningObject not found"),
```

---

## 4. 파일 구조

```
domain/course/
├── constant/
│   ├── CourseLevel.java        ✅ 신규
│   └── CourseType.java         ✅ 신규
├── entity/
│   ├── Course.java             ✅ 신규
│   ├── CourseItem.java         ✅ 신규
│   └── CourseRelation.java     ✅ 신규
├── repository/
│   ├── CourseRepository.java       ✅ 신규
│   ├── CourseItemRepository.java   ✅ 신규
│   └── CourseRelationRepository.java ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateCourseRequest.java    ✅ 신규
│   │   ├── UpdateCourseRequest.java    ✅ 신규
│   │   ├── CreateItemRequest.java      ✅ 신규
│   │   ├── CreateFolderRequest.java    ✅ 신규
│   │   ├── MoveItemRequest.java        ✅ 신규
│   │   └── CreateRelationRequest.java  ✅ 신규
│   └── response/
│       ├── CourseResponse.java             ✅ 신규
│       ├── CourseDetailResponse.java       ✅ 신규
│       ├── CourseItemResponse.java         ✅ 신규
│       ├── CourseItemHierarchyResponse.java ✅ 신규
│       └── CourseRelationResponse.java     ✅ 신규
└── exception/
    ├── CourseNotFoundException.java      ✅ 신규
    ├── CourseItemNotFoundException.java  ✅ 신규
    ├── MaxDepthExceededException.java    ✅ 신규
    ├── CircularReferenceException.java   ✅ 신규
    └── InvalidParentException.java       ✅ 신규
```

---

## 5. Entity 주요 기능

### Course 엔티티

| 메서드 | 설명 |
|--------|------|
| `create()` | 정적 팩토리 메서드 (기본/상세 버전) |
| `updateTitle()` | 제목 변경 (검증 포함) |
| `update()` | 전체 필드 업데이트 |
| `addItem()` | CourseItem 연관관계 편의 메서드 |

### CourseItem 엔티티

| 메서드 | 설명 |
|--------|------|
| `createFolder()` | 폴더 생성 (learningObjectId = null) |
| `createItem()` | 차시 생성 (learningObjectId 필수) |
| `isFolder()` | 폴더 여부 확인 |
| `moveTo()` | 항목 이동 (깊이 검증, 순환 참조 검증) |
| `updateItemName()` | 이름 변경 |
| `updateLearningObjectId()` | 학습 객체 변경 (차시만) |

**깊이 제한 검증:**
- 최대 depth: 9 (10단계)
- 이동 시 하위 항목 깊이까지 검증

**순환 참조 검증:**
- `isAncestorOf()` 메서드로 상위 항목 이동 방지

### CourseRelation 엔티티

| 메서드 | 설명 |
|--------|------|
| `create()` | 순서 연결 생성 (폴더 제외 검증) |
| `createStartPoint()` | 시작점 생성 (fromItem = null) |
| `isStartPoint()` | 시작점 여부 확인 |

**Linked List 패턴:**
- `from_item_id = NULL` → 시작점
- 차시만 포함 (폴더 제외)

---

## 6. Repository 주요 쿼리

### CourseRepository

| 메서드 | 설명 |
|--------|------|
| `findByIdAndTenantId()` | 테넌트 격리 조회 |
| `findByTenantIdAndTitleContaining()` | 제목 검색 |
| `findByIdWithItems()` | Fetch Join으로 Item 함께 조회 |

### CourseItemRepository

| 메서드 | 설명 |
|--------|------|
| `findByCourseIdOrderByDepthAndSortOrder()` | 깊이/순서 정렬 조회 |
| `findItemsOnlyByCourseId()` | 차시만 조회 (폴더 제외) |
| `findFoldersOnlyByCourseId()` | 폴더만 조회 |
| `findRootItemsWithChildren()` | 루트 항목 + 하위 항목 Fetch Join |

### CourseRelationRepository

| 메서드 | 설명 |
|--------|------|
| `findStartPointByCourseId()` | 시작점 조회 (fromItem IS NULL) |
| `findByCourseIdWithItems()` | 관계 + 항목 Fetch Join |
| `deleteByCourseId()` | 강의별 전체 순서 삭제 |
| `deleteByItemId()` | 항목 삭제 시 관련 순서 삭제 |

---

## 7. 컨벤션 준수 체크

### Entity (06-ENTITY-CONVENTIONS)

- [x] Setter 미사용 → 비즈니스 메서드 사용
- [x] `@Enumerated(EnumType.STRING)` 적용
- [x] 정적 팩토리 메서드 `create()` 사용
- [x] TenantEntity 상속 (멀티테넌시 지원)
- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] Fetch Join 쿼리 메서드 포함
- [x] 페이징 지원 메서드 포함
- [x] `@Modifying` + `@Query` 벌크 삭제

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@NotNull`, `@Size`, `@Positive`)
- [x] Response: `from()` 정적 팩토리 메서드
- [x] Compact Constructor로 trim 처리

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] `BusinessException` 상속
- [x] `ErrorCode` 사용
- [x] 상세 메시지 생성자 제공

---

## 8. 빌드 결과

```bash
./gradlew compileJava --no-daemon -q
# 성공 (에러 없음)
```

---

## 9. 다음 작업 (Phase 2)

### Course CRUD API 구현

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/courses` | 강의 생성 |
| GET | `/api/courses` | 강의 목록 (페이징/필터) |
| GET | `/api/courses/{courseId}` | 강의 상세 |
| PUT | `/api/courses/{courseId}` | 강의 수정 |
| DELETE | `/api/courses/{courseId}` | 강의 삭제 |

**필요 작업:**
- CourseService 인터페이스/구현체 작성
- CourseController 작성
- Controller 테스트 작성

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | Phase 1 구현 완료 (Entity, Repository, DTO, Exception) |

---

*최종 업데이트: 2025-12-12*

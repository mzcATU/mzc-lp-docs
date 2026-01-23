# Backend CM 모듈 개발 로그 - Phase 3

> CourseItem API 구현 (계층 구조)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#64](https://github.com/mzcATU/mzc-lp-backend/issues/64) |
| **PR** | [#66](https://github.com/mzcATU/mzc-lp-backend/pull/66) |
| **담당 모듈** | CM (Course Matrix - 강의 템플릿 관리) |
| **의존성** | Phase 2 완료 필요 |

---

## 1. 구현 개요

차시/폴더(CourseItem) CRUD API 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | CourseItemService 인터페이스, CourseItemServiceImpl 구현체 |
| Controller | CourseItemController (8개 엔드포인트) |
| DTO | UpdateItemNameRequest, UpdateLearningObjectRequest |
| Test | CourseItemControllerTest (24개 테스트 케이스) |

---

## 2. 신규 생성 파일 (6개)

### Service (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseItemService.java | `service/` | 차시/폴더 CRUD 서비스 인터페이스 |
| CourseItemServiceImpl.java | `service/` | 차시/폴더 CRUD 서비스 구현체 |

### Controller (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseItemController.java | `controller/` | 차시/폴더 CRUD REST API 컨트롤러 |

### DTO (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| UpdateItemNameRequest.java | `dto/request/` | 항목 이름 변경 요청 DTO |
| UpdateLearningObjectRequest.java | `dto/request/` | 학습 객체 변경 요청 DTO |

### Test (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseItemControllerTest.java | `test/.../course/controller/` | 컨트롤러 통합 테스트 |

---

## 3. 수정 파일 (1개)

| 파일 | 변경 내용 |
|------|----------|
| CourseItemRepository.java | `sortOrder` → `id` 정렬 (Entity에 sortOrder 필드 없음) |

**변경 상세:**
```java
// Before
ORDER BY ci.depth, ci.sortOrder

// After
ORDER BY ci.depth, ci.id
```

---

## 4. API 목록

| Method | Endpoint | 기능 | HTTP Status | 권한 |
|--------|----------|------|-------------|------|
| POST | `/api/courses/{courseId}/items` | 차시 추가 | 201 Created | DESIGNER, OPERATOR, TENANT_ADMIN |
| POST | `/api/courses/{courseId}/folders` | 폴더 생성 | 201 Created | DESIGNER, OPERATOR, TENANT_ADMIN |
| GET | `/api/courses/{courseId}/items/hierarchy` | 계층 구조 조회 | 200 OK | 인증된 사용자 |
| GET | `/api/courses/{courseId}/items/ordered` | 순서대로 조회 | 200 OK | 인증된 사용자 |
| PUT | `/api/courses/{courseId}/items/move` | 항목 이동 | 200 OK | DESIGNER, OPERATOR, TENANT_ADMIN |
| PATCH | `/api/courses/{courseId}/items/{itemId}/name` | 이름 변경 | 200 OK | DESIGNER, OPERATOR, TENANT_ADMIN |
| PATCH | `/api/courses/{courseId}/items/{itemId}/learning-object` | LO 변경 | 200 OK | DESIGNER, OPERATOR, TENANT_ADMIN |
| DELETE | `/api/courses/{courseId}/items/{itemId}` | 항목 삭제 | 204 No Content | DESIGNER, OPERATOR, TENANT_ADMIN |

---

## 5. 파일 구조

```
domain/course/
├── controller/
│   ├── CourseController.java
│   └── CourseItemController.java       ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateItemRequest.java
│   │   ├── CreateFolderRequest.java
│   │   ├── MoveItemRequest.java
│   │   ├── UpdateItemNameRequest.java        ✅ 신규
│   │   └── UpdateLearningObjectRequest.java  ✅ 신규
│   └── response/
│       ├── CourseItemResponse.java
│       └── CourseItemHierarchyResponse.java
├── repository/
│   └── CourseItemRepository.java       ✏️ 수정
└── service/
    ├── CourseItemService.java          ✅ 신규
    └── CourseItemServiceImpl.java      ✅ 신규

test/.../domain/course/
└── controller/
    └── CourseItemControllerTest.java   ✅ 신규
```

---

## 6. Service 인터페이스

```java
public interface CourseItemService {
    CourseItemResponse createItem(Long courseId, CreateItemRequest request);
    CourseItemResponse createFolder(Long courseId, CreateFolderRequest request);
    List<CourseItemHierarchyResponse> getHierarchy(Long courseId);
    List<CourseItemResponse> getOrderedItems(Long courseId);
    CourseItemResponse moveItem(Long courseId, MoveItemRequest request);
    CourseItemResponse updateItemName(Long courseId, Long itemId, UpdateItemNameRequest request);
    CourseItemResponse updateLearningObject(Long courseId, Long itemId, UpdateLearningObjectRequest request);
    void deleteItem(Long courseId, Long itemId);
}
```

---

## 7. 핵심 로직

### 7.1 계층 구조 (Self-reference)

```java
// CourseItem Entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "parent_id")
private CourseItem parent;

@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
private List<CourseItem> children = new ArrayList<>();
```

### 7.2 Depth 제한 (0~9, 최대 10단계)

```java
private static final int MAX_DEPTH = 9;

private void validateDepth() {
    if (this.depth > MAX_DEPTH) {
        throw new MaxDepthExceededException();
    }
}
```

### 7.3 폴더 vs 차시 구분

```java
public boolean isFolder() {
    return this.learningObjectId == null;  // LO 없으면 폴더
}
```

### 7.4 항목 이동 (moveTo)

- 순환 참조 검증 (자기 자신/하위로 이동 불가)
- 깊이 재계산 (하위 항목 포함)
- 부모 변경 시 양방향 관계 정리

---

## 8. 테스트 케이스 (24개)

### POST /api/courses/{courseId}/items - 차시 추가 (6개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| createItem_success_rootLevel | ✅ | 최상위에 차시 추가 |
| createItem_success_underFolder | ✅ | 폴더 하위에 차시 추가 |
| createItem_fail_courseNotFound | ✅ | 존재하지 않는 강의 (404) |
| createItem_fail_missingName | ✅ | 항목 이름 누락 (400) |
| createItem_fail_missingLearningObjectId | ✅ | LO ID 누락 (400) |
| createItem_fail_userRole | ✅ | USER 권한 거부 (403) |

### POST /api/courses/{courseId}/folders - 폴더 생성 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| createFolder_success_rootLevel | ✅ | 최상위에 폴더 생성 |
| createFolder_success_nested | ✅ | 중첩 폴더 생성 |
| createFolder_fail_missingName | ✅ | 폴더 이름 누락 (400) |

### GET /api/courses/{courseId}/items/hierarchy - 계층 구조 조회 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| getHierarchy_success | ✅ | 계층 구조 조회 (폴더 + 하위 차시) |
| getHierarchy_success_empty | ✅ | 빈 구조 조회 |
| getHierarchy_fail_notFound | ✅ | 존재하지 않는 강의 (404) |

### GET /api/courses/{courseId}/items/ordered - 순서대로 조회 (1개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| getOrderedItems_success | ✅ | 차시만 조회 (폴더 제외) |

### PUT /api/courses/{courseId}/items/move - 항목 이동 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| moveItem_success | ✅ | 다른 폴더로 이동 |
| moveItem_success_toRoot | ✅ | 최상위로 이동 |
| moveItem_fail_itemNotFound | ✅ | 존재하지 않는 항목 (404) |

### PATCH /api/courses/{courseId}/items/{itemId}/name - 이름 변경 (2개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| updateItemName_success | ✅ | 항목 이름 변경 성공 |
| updateItemName_fail_emptyName | ✅ | 빈 이름 (400) |

### PATCH /api/courses/{courseId}/items/{itemId}/learning-object - LO 변경 (2개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| updateLearningObject_success | ✅ | 학습 객체 변경 성공 |
| updateLearningObject_fail_folder | ✅ | 폴더에 LO 연결 시도 (400) |

### DELETE /api/courses/{courseId}/items/{itemId} - 항목 삭제 (4개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| deleteItem_success | ✅ | 차시 삭제 |
| deleteItem_success_folderWithChildren | ✅ | 폴더 삭제 (하위 항목 CASCADE) |
| deleteItem_fail_notFound | ✅ | 존재하지 않는 항목 (404) |
| deleteItem_fail_userRole | ✅ | USER 권한 거부 (403) |

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

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@Size`, `@NotNull`)
- [x] Compact constructor로 trim 처리

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc`
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴
- [x] 헬퍼 메서드 활용

---

## 10. 테스트 헬퍼 메서드

| 메서드 | 용도 |
|--------|------|
| `createOperatorUser()` | OPERATOR 권한 사용자 생성 |
| `createRegularUser()` | USER 권한 사용자 생성 |
| `loginAndGetAccessToken()` | 로그인 후 AccessToken 반환 |
| `createTestCourse()` | 테스트용 강의 생성 |
| `createTestFolder()` | 테스트용 폴더 생성 |
| `createTestItem()` | 테스트용 차시 생성 |

---

## 11. 발견된 이슈 및 수정

### 11.1 Repository sortOrder 필드 누락

**문제:**
- `CourseItemRepository`에서 `sortOrder` 필드로 정렬하는 쿼리 사용
- `CourseItem` Entity에 `sortOrder` 필드가 없음
- 테스트 시 `UnknownPathException` 발생

**해결:**
```java
// Before
ORDER BY ci.depth, ci.sortOrder

// After
ORDER BY ci.depth, ci.id
```

### 11.2 ErrorCode 반환 형식

**발견:**
- API 응답에서 ErrorCode의 `code` 필드 값이 반환됨 (예: "CM001")
- 기존 테스트는 Enum 이름을 기대 (예: "CM_COURSE_NOT_FOUND")

**대응:**
- 테스트에서 실제 반환값인 "CM001" 형식으로 수정

---

## 12. 다음 작업 (Phase 4)

### CourseRelation API 구현 (학습 순서)

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/courses/{courseId}/relations` | 순서 설정 |
| GET | `/api/courses/{courseId}/relations` | 순서 조회 |
| PUT | `/api/courses/{courseId}/relations` | 순서 수정 |
| PUT | `/api/courses/{courseId}/relations/start` | 시작점 설정 |
| POST | `/api/courses/{courseId}/relations/auto` | 자동 순서 생성 |
| DELETE | `/api/courses/{courseId}/relations/{relationId}` | 연결 삭제 |

**핵심 로직:**
- Linked List 패턴 (from_item_id → to_item_id)
- from_item_id = NULL 이면 시작점
- 순환 참조 검증

---

## 관련 문서

- [Phase 1](phase1.md) - CM 기반 구조 (Entity, Repository, DTO, Exception)
- [Phase 2](phase2.md) - Course CRUD API
- [Phase 2 Fix](phase2-fix.md) - 필드 정합성 수정

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 3 구현 완료 (CourseItem Service, Controller, Test) |

---

*최종 업데이트: 2025-12-15*

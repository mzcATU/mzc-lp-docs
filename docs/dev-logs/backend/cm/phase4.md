# Backend CM 모듈 개발 로그 - Phase 4

> CourseRelation API 구현 (학습 순서)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#69](https://github.com/mzcATU/mzc-lp-backend/issues/69) |
| **PR** | [#70](https://github.com/mzcATU/mzc-lp-backend/pull/70) |
| **담당 모듈** | CM (Course Matrix - 강의 템플릿 관리) |
| **의존성** | Phase 3 완료 필요 |

---

## 1. 구현 개요

학습 순서(CourseRelation) CRUD API 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | CourseRelationService 인터페이스, CourseRelationServiceImpl 구현체 |
| Controller | CourseRelationController (6개 엔드포인트) |
| DTO | SetStartItemRequest, RelationCreateResponse, SetStartItemResponse, AutoRelationResponse |
| Test | CourseRelationControllerTest (20개 테스트 케이스) |

---

## 2. 신규 생성 파일 (8개)

### Service (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseRelationService.java | `service/` | 학습 순서 CRUD 서비스 인터페이스 |
| CourseRelationServiceImpl.java | `service/` | 학습 순서 CRUD 서비스 구현체 |

### Controller (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseRelationController.java | `controller/` | 학습 순서 REST API 컨트롤러 |

### DTO (4개)

| 파일 | 경로 | 설명 |
|------|------|------|
| SetStartItemRequest.java | `dto/request/` | 시작점 설정 요청 DTO |
| RelationCreateResponse.java | `dto/response/` | 순서 생성 결과 응답 DTO |
| SetStartItemResponse.java | `dto/response/` | 시작점 설정 결과 응답 DTO |
| AutoRelationResponse.java | `dto/response/` | 자동 순서 생성 결과 응답 DTO |

### Test (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseRelationControllerTest.java | `test/.../course/controller/` | 컨트롤러 통합 테스트 |

---

## 3. API 목록

| Method | Endpoint | 기능 | HTTP Status | 권한 |
|--------|----------|------|-------------|------|
| POST | `/api/courses/{courseId}/relations` | 순서 설정 | 201 Created | DESIGNER, OPERATOR, TENANT_ADMIN |
| GET | `/api/courses/{courseId}/relations` | 순서 조회 | 200 OK | 인증된 사용자 |
| PUT | `/api/courses/{courseId}/relations` | 순서 수정 | 200 OK | DESIGNER, OPERATOR, TENANT_ADMIN |
| PUT | `/api/courses/{courseId}/relations/start` | 시작점 설정 | 200 OK | DESIGNER, OPERATOR, TENANT_ADMIN |
| POST | `/api/courses/{courseId}/relations/auto` | 자동 순서 생성 | 201 Created | DESIGNER, OPERATOR, TENANT_ADMIN |
| DELETE | `/api/courses/{courseId}/relations/{relationId}` | 연결 삭제 | 204 No Content | DESIGNER, OPERATOR, TENANT_ADMIN |

---

## 4. 파일 구조

```
domain/course/
├── controller/
│   ├── CourseController.java
│   ├── CourseItemController.java
│   └── CourseRelationController.java    ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateRelationRequest.java   (기존 - Phase 1)
│   │   └── SetStartItemRequest.java     ✅ 신규
│   └── response/
│       ├── CourseRelationResponse.java  (기존 - Phase 1)
│       ├── RelationCreateResponse.java  ✅ 신규
│       ├── SetStartItemResponse.java    ✅ 신규
│       └── AutoRelationResponse.java    ✅ 신규
└── service/
    ├── CourseRelationService.java       ✅ 신규
    └── CourseRelationServiceImpl.java   ✅ 신규

test/.../domain/course/
└── controller/
    └── CourseRelationControllerTest.java   ✅ 신규
```

---

## 5. Service 인터페이스

```java
public interface CourseRelationService {
    RelationCreateResponse createRelations(Long courseId, CreateRelationRequest request);
    CourseRelationResponse getRelations(Long courseId);
    RelationCreateResponse updateRelations(Long courseId, CreateRelationRequest request);
    SetStartItemResponse setStartItem(Long courseId, SetStartItemRequest request);
    AutoRelationResponse createAutoRelations(Long courseId);
    void deleteRelation(Long courseId, Long relationId);
}
```

---

## 6. 핵심 로직

### 6.1 Linked List 패턴

```java
// CourseRelation Entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "from_item_id")
private CourseItem fromItem;  // NULL이면 시작점

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "to_item_id", nullable = false)
private CourseItem toItem;
```

### 6.2 시작점 설정

```java
// from_item_id = NULL 이면 시작점
public static CourseRelation createStartPoint(CourseItem toItem) {
    return CourseRelation.builder()
            .fromItem(null)
            .toItem(toItem)
            .build();
}
```

### 6.3 순환 참조 검증

```java
private void validateCircularReference(List<RelationItem> relations) {
    // 그래프 순회로 사이클 탐지
    Map<Long, Long> graph = new HashMap<>();
    for (RelationItem rel : relations) {
        if (rel.fromItemId() != null) {
            graph.put(rel.fromItemId(), rel.toItemId());
        }
    }
    // DFS로 사이클 검증
    ...
}
```

### 6.4 자동 순서 생성

```java
public AutoRelationResponse createAutoRelations(Long courseId) {
    // 1. 기존 relation 삭제
    // 2. 차시만 조회 (폴더 제외, depth/id 정렬)
    // 3. 순차적 Linked List 생성
    List<CourseItem> items = courseItemRepository.findItemsOnly(courseId);
    for (int i = 0; i < items.size(); i++) {
        CourseItem from = (i == 0) ? null : items.get(i - 1);
        CourseItem to = items.get(i);
        // relation 생성
    }
}
```

---

## 7. 테스트 케이스 (20개)

### POST /api/courses/{courseId}/relations - 학습 순서 설정 (7개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| createRelations_success | ✅ | 학습 순서 설정 성공 |
| createRelations_fail_emptyList | ✅ | 빈 순서 목록 (400) |
| createRelations_fail_courseNotFound | ✅ | 존재하지 않는 강의 (404) |
| createRelations_fail_includeFolder | ✅ | 폴더 포함 시도 (400) |
| createRelations_fail_userRole | ✅ | USER 권한 거부 (403) |
| createRelations_fail_duplicateStartPoint | ✅ | 중복 시작점 (400) |
| createRelations_fail_circularReference | ✅ | 순환 참조 (400) |

### GET /api/courses/{courseId}/relations - 학습 순서 조회 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| getRelations_success | ✅ | 학습 순서 조회 성공 |
| getRelations_success_empty | ✅ | 빈 순서 조회 |
| getRelations_fail_notFound | ✅ | 존재하지 않는 강의 (404) |

### PUT /api/courses/{courseId}/relations - 학습 순서 수정 (1개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| updateRelations_success | ✅ | 학습 순서 수정 (전체 교체) |

### PUT /api/courses/{courseId}/relations/start - 시작점 설정 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| setStartItem_success | ✅ | 시작점 설정 성공 |
| setStartItem_fail_folder | ✅ | 폴더를 시작점으로 설정 (400) |
| setStartItem_fail_itemNotFound | ✅ | 존재하지 않는 항목 (404) |

### POST /api/courses/{courseId}/relations/auto - 자동 순서 생성 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| createAutoRelations_success | ✅ | 자동 순서 생성 성공 |
| createAutoRelations_success_noItems | ✅ | 차시 없음 (빈 결과) |
| createAutoRelations_fail_userRole | ✅ | USER 권한 거부 (403) |

### DELETE /api/courses/{courseId}/relations/{relationId} - 연결 삭제 (3개)

| 테스트 | 상태 | 설명 |
|--------|------|------|
| deleteRelation_success | ✅ | 연결 삭제 성공 (204) |
| deleteRelation_fail_notFound | ✅ | 존재하지 않는 연결 (400) |
| deleteRelation_fail_userRole | ✅ | USER 권한 거부 (403) |

---

## 8. 컨벤션 준수 체크

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
- [x] Request: Validation 어노테이션 (`@NotNull`, `@NotEmpty`)
- [x] Response: 정적 팩토리 메서드

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc`
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴
- [x] 헬퍼 메서드 활용

---

## 9. 테스트 헬퍼 메서드

| 메서드 | 용도 |
|--------|------|
| `createOperatorUser()` | OPERATOR 권한 사용자 생성 |
| `createRegularUser()` | USER 권한 사용자 생성 |
| `loginAndGetAccessToken()` | 로그인 후 AccessToken 반환 |
| `createTestCourse()` | 테스트용 강의 생성 |
| `createTestFolder()` | 테스트용 폴더 생성 |
| `createTestItem()` | 테스트용 차시 생성 |
| `createTestRelation()` | 테스트용 학습 순서 생성 |

---

## 10. 다음 작업 (Phase 5)

### Snapshot 기반 구조 구현

| 구성요소 | 내용 |
|----------|------|
| Entity | CourseSnapshot, SnapshotItem, SnapshotLearningObject, SnapshotRelation |
| Constant | SnapshotStatus (DRAFT, ACTIVE, COMPLETED, ARCHIVED) |
| Repository | CourseSnapshotRepository, SnapshotItemRepository, SnapshotLearningObjectRepository, SnapshotRelationRepository |
| DTO | CreateSnapshotRequest, SnapshotResponse, SnapshotDetailResponse 등 |
| Exception | SnapshotNotFoundException, SnapshotStateException |

**핵심 기능:**
- Course → Snapshot 깊은 복사 (Content만 공유 참조)
- 상태 기반 수정 제한 (DRAFT만 전면 수정 가능)
- 수강이력 불변성 보장

---

## 관련 문서

- [Phase 1](phase1.md) - CM 기반 구조 (Entity, Repository, DTO, Exception)
- [Phase 2](phase2.md) - Course CRUD API
- [Phase 2 Fix](phase2-fix.md) - 필드 정합성 수정
- [Phase 3](phase3.md) - CourseItem API (계층 구조)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 4 구현 완료 (CourseRelation Service, Controller, Test) |

---

*최종 업데이트: 2025-12-15*

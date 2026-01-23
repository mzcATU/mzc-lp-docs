# Backend CM 모듈 개발 로그 - Phase 7

> SnapshotItem/Relation API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-18 |
| **관련 이슈** | [#83](https://github.com/mzcATU/mzc-lp-backend/issues/83) |
| **PR** | [#124](https://github.com/mzcATU/mzc-lp-backend/pull/124) |
| **브랜치** | `feat/83-snapshot-item-api` |
| **담당 모듈** | Snapshot (아이템 관리 및 학습경로) |
| **의존성** | Phase 6 완료 필요 (Snapshot CRUD) |

---

## 1. 구현 개요

Snapshot의 아이템 관리 및 학습경로 설정 API 구현:

| 구성요소 | 내용 |
|----------|------|
| Service | SnapshotItemService, SnapshotRelationService (인터페이스/구현체) |
| Controller | SnapshotItemController (6개 API), SnapshotRelationController (5개 API) |
| DTO | Request 5개, Response 1개 |
| Exception | SnapshotItemNotFoundException (CM009) |
| Test | SnapshotItemControllerTest (23개), SnapshotRelationControllerTest (8개) |

---

## 2. 신규 생성 파일 (14개)

### Service (4개)

| 파일 | 설명 |
|------|------|
| SnapshotItemService.java | 아이템 관리 인터페이스 |
| SnapshotItemServiceImpl.java | 아이템 관리 구현체 |
| SnapshotRelationService.java | 학습경로 관리 인터페이스 |
| SnapshotRelationServiceImpl.java | 학습경로 관리 구현체 |

### Controller (2개)

| 파일 | API 수 | 설명 |
|------|--------|------|
| SnapshotItemController.java | 6개 | 아이템 API 엔드포인트 |
| SnapshotRelationController.java | 5개 | 학습경로 API 엔드포인트 |

### DTO Request (5개)

| 파일 | 필수 필드 | 설명 |
|------|----------|------|
| CreateSnapshotItemRequest.java | itemName | 아이템 추가 |
| UpdateSnapshotItemRequest.java | itemName | 아이템 수정 |
| MoveSnapshotItemRequest.java | - | 아이템 이동 (newParentId 선택) |
| CreateSnapshotRelationRequest.java | toItemId | 연결 생성 (fromItemId 선택) |
| SetStartSnapshotItemRequest.java | itemId | 시작점 설정 |

### DTO Response (1개)

| 파일 | 용도 |
|------|------|
| SnapshotRelationResponse.java | 학습경로 응답 (OrderedItem, SnapshotRelationsResponse 포함) |

### Exception (1개)

| 파일 | ErrorCode | HTTP | 설명 |
|------|-----------|------|------|
| SnapshotItemNotFoundException.java | CM009 | 404 | 스냅샷 아이템 없음 |

### Test (2개)

| 파일 | 테스트 수 | 설명 |
|------|----------|------|
| SnapshotItemControllerTest.java | 23개 | 아이템 API 통합 테스트 |
| SnapshotRelationControllerTest.java | 8개 | 학습경로 API 통합 테스트 |

---

## 3. 수정 파일 (1개)

### ErrorCode.java

```java
// SnapshotItem 관련 에러코드 (CM009)
CM_SNAPSHOT_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "CM009", "SnapshotItem not found"),
```

---

## 4. 파일 구조

```
domain/snapshot/
├── service/
│   ├── SnapshotItemService.java         ✅ 신규
│   ├── SnapshotItemServiceImpl.java     ✅ 신규
│   ├── SnapshotRelationService.java     ✅ 신규
│   └── SnapshotRelationServiceImpl.java ✅ 신규
├── controller/
│   ├── SnapshotItemController.java      ✅ 신규
│   └── SnapshotRelationController.java  ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateSnapshotItemRequest.java   ✅ 신규
│   │   ├── UpdateSnapshotItemRequest.java   ✅ 신규
│   │   ├── MoveSnapshotItemRequest.java     ✅ 신규
│   │   ├── CreateSnapshotRelationRequest.java ✅ 신규
│   │   └── SetStartSnapshotItemRequest.java   ✅ 신규
│   └── response/
│       └── SnapshotRelationResponse.java    ✅ 신규
└── exception/
    └── SnapshotItemNotFoundException.java  ✅ 신규
```

---

## 5. 핵심 설계

### 5.1 SnapshotItem 관리

#### 계층 구조
```
Root Level (depth=0)
├── 1장. 입문 (폴더, depth=0)
│   ├── 1-1. 소개 (아이템, depth=1)
│   └── 1-2. 설치 (아이템, depth=1)
└── 2장. 기초 (폴더, depth=0)
    ├── 2-1. 변수 (아이템, depth=1)
    └── 2-2. 함수 (아이템, depth=1)

최대 깊이: 10단계 (depth 0~9)
```

#### 상태별 수정 권한

| 상태 | 아이템 추가 | 아이템 이동 | 아이템 삭제 | 아이템 이름 수정 |
|------|----------|----------|----------|---------------|
| DRAFT | O | O | O | O |
| ACTIVE | X | X | X | O |
| COMPLETED | X | X | X | X |
| ARCHIVED | X | X | X | X |

### 5.2 SnapshotRelation 관리 (Linked List)

#### 학습 순서 구조
```
START (null) ──→ Item 1 ──→ Item 2 ──→ Item 3
                   │           │           │
                   └───────────┴───────────┘
                   (fromItem)  (toItem)
```

#### 주요 규칙
- fromItemId가 NULL이면 시작점
- 하나의 아이템은 한 번만 참조 가능 (toItemId는 유니크)
- 폴더는 학습 순서에 포함 불가
- 순환 참조 검증

### 5.3 순환 참조 검증

```java
// 예: A → B → C → A (순환 참조 발생)
private void validateNoCircularReference(Long snapshotId, Long fromItemId, Long toItemId) {
    // 기존 관계에서 from→to 매핑 생성
    Map<Long, Long> fromToMap = buildFromToMap(snapshotId);

    // 새로운 관계 추가
    fromToMap.put(fromItemId, toItemId);

    // toItemId에서 시작해서 순환 검사
    Set<Long> visited = new HashSet<>();
    Long current = toItemId;

    while (current != null) {
        if (visited.contains(current)) {
            throw new CircularReferenceException();
        }
        visited.add(current);
        current = fromToMap.get(current);
    }
}
```

---

## 6. API 명세

### 6.1 SnapshotItem API (6개)

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/snapshots/{snapshotId}/items` | ALL | 계층 구조 조회 |
| GET | `/api/snapshots/{snapshotId}/items/flat` | ALL | 평면 목록 조회 |
| POST | `/api/snapshots/{snapshotId}/items` | DESIGNER+ | 아이템 추가 (DRAFT만) |
| PUT | `/api/snapshots/{snapshotId}/items/{itemId}` | DESIGNER+ | 아이템 수정 |
| PUT | `/api/snapshots/{snapshotId}/items/{itemId}/move` | DESIGNER+ | 아이템 이동 (DRAFT만) |
| DELETE | `/api/snapshots/{snapshotId}/items/{itemId}` | DESIGNER+ | 아이템 삭제 (DRAFT만) |

### 6.2 SnapshotRelation API (5개)

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/snapshots/{snapshotId}/relations` | ALL | 연결 목록 조회 |
| GET | `/api/snapshots/{snapshotId}/relations/ordered` | ALL | 순서대로 조회 |
| POST | `/api/snapshots/{snapshotId}/relations` | DESIGNER+ | 연결 생성 |
| PUT | `/api/snapshots/{snapshotId}/relations/start` | DESIGNER+ | 시작점 설정 |
| DELETE | `/api/snapshots/{snapshotId}/relations/{relationId}` | DESIGNER+ | 연결 삭제 |

---

## 7. 테스트 현황 (31개)

### SnapshotItemControllerTest (23개)

#### 계층 구조 조회 (3개)
- `getHierarchy_success` - 계층 구조 조회 성공
- `getHierarchy_success_empty` - 빈 스냅샷 조회
- `getHierarchy_fail_notFound` - 404 에러

#### 평면 목록 조회 (1개)
- `getFlatItems_success` - 평면 목록 조회 성공

#### 아이템 추가 (5개)
- `createItem_success` - DRAFT 상태에서 차시 추가
- `createItem_success_folder` - 폴더 추가
- `createItem_fail_activeState` - ACTIVE 상태에서 추가 실패
- `createItem_fail_userRole` - USER 권한 없음
- `createItem_fail_missingName` - 이름 누락

#### 아이템 수정 (2개)
- `updateItem_success` - 아이템 이름 변경
- `updateItem_fail_notFound` - 404 에러

#### 아이템 이동 (3개)
- `moveItem_success` - 폴더로 아이템 이동
- `moveItem_success_toRoot` - 루트로 이동
- `moveItem_fail_activeState` - ACTIVE 상태에서 이동 실패

#### 아이템 삭제 (3개)
- `deleteItem_success` - 아이템 삭제
- `deleteItem_fail_activeState` - ACTIVE 상태에서 삭제 실패
- `deleteItem_fail_notFound` - 404 에러

### SnapshotRelationControllerTest (8개)

#### 연결 목록 조회 (3개)
- `getRelations_success` - 연결 목록 조회
- `getRelations_success_empty` - 빈 연결 목록
- `getRelations_fail_notFound` - 404 에러

#### 순서대로 조회 (1개)
- `getOrderedItems_success` - 순서대로 아이템 조회

#### 연결 생성 (4개)
- `createRelation_success_startPoint` - 시작점 생성
- `createRelation_success` - 연결 생성
- `createRelation_fail_userRole` - USER 권한 없음
- `createRelation_fail_itemNotFound` - 404 에러

#### 시작점 설정 (3개)
- `setStartItem_success` - 시작점 설정
- `setStartItem_success_change` - 기존 시작점 변경
- `setStartItem_fail_notFound` - 404 에러

#### 연결 삭제 (3개)
- `deleteRelation_success` - 연결 삭제
- `deleteRelation_fail_notFound` - 404 에러
- `deleteRelation_fail_userRole` - USER 권한 없음

---

## 8. 컨벤션 준수 체크

### Service (04-SERVICE-CONVENTIONS)

- [x] 인터페이스/구현체 분리
- [x] `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`
- [x] 로깅: INFO(주요 이벤트), DEBUG(조회)

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@RestController`, `@RequestMapping`
- [x] `@PreAuthorize` 권한 체크
- [x] `@Valid @RequestBody`
- [x] try-catch 미사용 (GlobalExceptionHandler 위임)
- [x] 응답 형식 통일 (`ResponseEntity<ApiResponse<T>>`)

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@Size`, `@Positive`)
- [x] Response: `from()` 정적 팩토리 메서드

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] BusinessException 상속
- [x] ErrorCode 사용 (CM009)
- [x] 상세 메시지 오버로드

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc`
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴

---

## 9. 검증

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava` | ✅ BUILD SUCCESSFUL |
| `./gradlew test --tests "*SnapshotItem*"` | ✅ 23 tests PASSED |
| `./gradlew test --tests "*SnapshotRelation*"` | ✅ 8 tests PASSED |
| 파일 수 | 15 files changed |
| 추가 라인 | 1935 insertions(+) |

---

## 10. 프론트엔드 테스트 흐름

### 아이템 관리 흐름

```
1. GET /api/snapshots/{snapshotId}/items (계층 구조 조회)
   ↓
2. POST /api/snapshots/{snapshotId}/items (아이템 추가)
   ↓
3. PUT /api/snapshots/{snapshotId}/items/{itemId} (이름 수정 - 선택)
   ↓
4. PUT /api/snapshots/{snapshotId}/items/{itemId}/move (이동 - 선택)
   ↓
5. DELETE /api/snapshots/{snapshotId}/items/{itemId} (삭제 - 선택)
```

### 학습경로 설정 흐름

```
1. GET /api/snapshots/{snapshotId}/items (아이템 목록 확인)
   ↓
2. POST /api/snapshots/{snapshotId}/relations (시작점 생성)
   - { "fromItemId": null, "toItemId": 1 }
   ↓
3. POST /api/snapshots/{snapshotId}/relations (다음 연결 생성)
   - { "fromItemId": 1, "toItemId": 2 }
   ↓
4. GET /api/snapshots/{snapshotId}/relations/ordered (순서 확인)
   - [ { "seq": 1, "itemId": 1 }, { "seq": 2, "itemId": 2 } ]
```

### 시작점 변경 흐름

```
1. PUT /api/snapshots/{snapshotId}/relations/start (시작점 변경)
   - { "itemId": 3 }
   ↓
2. GET /api/snapshots/{snapshotId}/relations/ordered (순서 재확인)
```

---

## 11. 주요 구현 특징

### 11.1 상태 기반 권한 제어

```java
// SnapshotItemServiceImpl
private void validateItemModifiable(CourseSnapshot snapshot) {
    if (!snapshot.isItemModifiable()) {  // DRAFT만 true
        throw new SnapshotStateException(snapshot.getStatus(), "아이템 수정");
    }
}

private void validateMetadataModifiable(CourseSnapshot snapshot) {
    if (!snapshot.isModifiable()) {  // DRAFT, ACTIVE는 true
        throw new SnapshotStateException(snapshot.getStatus(), "수정");
    }
}
```

### 11.2 계층 구조 응답

```json
// GET /api/snapshots/1/items
{
  "success": true,
  "data": [
    {
      "itemId": 1,
      "itemName": "1장. 입문",
      "isFolder": true,
      "depth": 0,
      "children": [
        {
          "itemId": 2,
          "itemName": "1-1. 소개",
          "isFolder": false,
          "depth": 1,
          "snapshotLearningObject": { ... }
        }
      ]
    }
  ]
}
```

### 11.3 순서 조회 응답

```json
// GET /api/snapshots/1/relations/ordered
{
  "success": true,
  "data": [
    { "seq": 1, "itemId": 2, "itemName": "1-1. 소개" },
    { "seq": 2, "itemId": 3, "itemName": "1-2. 설치" },
    { "seq": 3, "itemId": 4, "itemName": "2-1. 변수" }
  ]
}
```

---

## 12. 다음 작업 (Phase 8 이후)

### 12.1 Snapshot 공개/비공개 설정
- [ ] Snapshot 공개 범위 설정 (전체/특정 그룹/비공개)
- [ ] 권한 기반 조회 필터링

### 12.2 Snapshot 복사
- [ ] Snapshot 복제 API
- [ ] 아이템 및 학습경로 일괄 복사

### 12.3 Snapshot 버전 관리
- [ ] Snapshot 버전 히스토리
- [ ] 특정 버전으로 롤백

---

## 관련 문서

- [Phase 1](phase1.md) - CM 기반 구조 (Entity, Repository, DTO, Exception)
- [Phase 2](phase2.md) - Course CRUD API
- [Phase 3](phase3.md) - CourseItem API (계층 구조)
- [Phase 4](phase4.md) - CourseRelation API (학습 순서)
- [Phase 5](phase5.md) - Snapshot 기반 구조
- [Phase 6](phase6.md) - Snapshot CRUD API
- [Snapshot API 명세](../../../structure/backend/snapshot/api.md)
- [Snapshot DB 스키마](../../../structure/backend/snapshot/db.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-18 | Claude Code | Phase 7 구현 완료 (SnapshotItem/Relation API) |

---

*최종 업데이트: 2025-12-18*

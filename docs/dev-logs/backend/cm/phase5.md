# Backend CM 모듈 개발 로그 - Phase 5

> Snapshot 기반 구조 구현 (Entity, Repository, DTO, Exception)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-16 |
| **관련 이슈** | [#77](https://github.com/mzcATU/mzc-lp-backend/issues/77) |
| **PR** | [#78](https://github.com/mzcATU/mzc-lp-backend/pull/78) |
| **담당 모듈** | Snapshot (개설 강의 관리) |
| **의존성** | Phase 4 완료 필요 |

---

## 1. 구현 개요

Snapshot 도메인 기반 구조 구현:

| 구성요소 | 내용 |
|----------|------|
| Constant | SnapshotStatus (4개 상태) |
| Entity | CourseSnapshot, SnapshotItem, SnapshotLearningObject, SnapshotRelation |
| Repository | 4개 Repository |
| DTO | Request 3개, Response 4개 |
| Exception | 2개 커스텀 예외 |

---

## 2. 신규 생성 파일 (18개)

### Constant (1개)

| 파일 | 경로 | 설명 |
|------|------|------|
| SnapshotStatus.java | `constant/` | DRAFT, ACTIVE, COMPLETED, ARCHIVED |

### Entity (4개)

| 파일 | 테이블 | 설명 |
|------|--------|------|
| CourseSnapshot.java | cm_snapshots | 개설 강의 (source_course_id로 템플릿 참조) |
| SnapshotItem.java | cm_snapshot_items | 차시/폴더 복사본 (self-reference) |
| SnapshotLearningObject.java | cm_snapshot_los | LO 메타데이터 복사본 (content 공유참조) |
| SnapshotRelation.java | cm_snapshot_relations | 학습 경로 (Linked List) |

### Repository (4개)

| 파일 | 주요 메서드 |
|------|------------|
| CourseSnapshotRepository.java | findByIdWithItems, countItemsBySnapshotId, sumDurationBySnapshotId |
| SnapshotItemRepository.java | findBySnapshotIdWithLo, findRootItemsWithLo, findItemsOnlyBySnapshotId |
| SnapshotLearningObjectRepository.java | findByContentIdAndTenantId, findBySourceLoIdAndTenantId |
| SnapshotRelationRepository.java | findBySnapshotIdWithItems, findBySnapshotIdAndFromItemIsNull |

### DTO Request (3개)

| 파일 | 필수 필드 | 설명 |
|------|----------|------|
| CreateSnapshotRequest.java | snapshotName | 스냅샷 신규 생성 |
| UpdateSnapshotRequest.java | - | 메타데이터 수정 |
| CreateSnapshotItemRequest.java | itemName | 아이템 추가 |

### DTO Response (4개)

| 파일 | 용도 |
|------|------|
| SnapshotResponse.java | 기본 응답 |
| SnapshotDetailResponse.java | 상세 응답 (items, itemCount, totalDuration) |
| SnapshotItemResponse.java | 아이템 응답 (계층 구조 지원) |
| SnapshotLearningObjectResponse.java | LO 메타데이터 응답 |

### Exception (2개)

| 파일 | ErrorCode | HTTP | 설명 |
|------|-----------|------|------|
| SnapshotNotFoundException.java | CM006 | 404 | 스냅샷 없음 |
| SnapshotStateException.java | CM007 | 400 | 잘못된 상태 전이 |

---

## 3. 수정 파일 (1개)

| 파일 | 변경 내용 |
|------|----------|
| ErrorCode.java | CM006, CM007 추가 |

```java
CM_SNAPSHOT_NOT_FOUND(HttpStatus.NOT_FOUND, "CM006", "Snapshot not found"),
CM_SNAPSHOT_STATE_ERROR(HttpStatus.BAD_REQUEST, "CM007", "Invalid snapshot state"),
```

---

## 4. 파일 구조

```
domain/snapshot/
├── constant/
│   └── SnapshotStatus.java           ✅ 신규
├── entity/
│   ├── CourseSnapshot.java           ✅ 신규
│   ├── SnapshotItem.java             ✅ 신규
│   ├── SnapshotLearningObject.java   ✅ 신규
│   └── SnapshotRelation.java         ✅ 신규
├── repository/
│   ├── CourseSnapshotRepository.java          ✅ 신규
│   ├── SnapshotItemRepository.java            ✅ 신규
│   ├── SnapshotLearningObjectRepository.java  ✅ 신규
│   └── SnapshotRelationRepository.java        ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateSnapshotRequest.java      ✅ 신규
│   │   ├── UpdateSnapshotRequest.java      ✅ 신규
│   │   └── CreateSnapshotItemRequest.java  ✅ 신규
│   └── response/
│       ├── SnapshotResponse.java                ✅ 신규
│       ├── SnapshotDetailResponse.java          ✅ 신규
│       ├── SnapshotItemResponse.java            ✅ 신규
│       └── SnapshotLearningObjectResponse.java  ✅ 신규
└── exception/
    ├── SnapshotNotFoundException.java  ✅ 신규
    └── SnapshotStateException.java     ✅ 신규
```

---

## 5. 핵심 설계

### 5.1 상태 전이

```
DRAFT ──publish()──> ACTIVE ──complete()──> COMPLETED ──archive()──> ARCHIVED
```

| 상태 | 메타데이터 수정 | 아이템 추가/삭제 | 순서 변경 |
|------|--------------|---------------|---------|
| DRAFT | O | O | O |
| ACTIVE | O | X | X |
| COMPLETED | X | X | X |
| ARCHIVED | X | X | X |

### 5.2 Entity 관계

```
Course (템플릿)
   │
   │ SET NULL (템플릿 삭제 시에도 스냅샷 유지)
   ▼
CourseSnapshot (1) ──┬── (N) SnapshotItem
                     │           │
                     │           └── (1) SnapshotLearningObject
                     │                        │
                     │                        └── (N:1) cms_contents (공유 참조)
                     │
                     └── (N) SnapshotRelation
```

### 5.3 복사 전략 (Course → Snapshot)

| 원본 | 대상 | 복사 방식 |
|------|------|----------|
| cm_courses | cm_snapshots | 값 복사 |
| cm_course_items | cm_snapshot_items | 깊은 복사 |
| lo_learning_objects | cm_snapshot_los | 깊은 복사 |
| **cms_contents** | **cms_contents** | **참조 유지** |
| cr_course_relations | cm_snapshot_relations | 깊은 복사 |

### 5.4 상태별 비즈니스 메서드

```java
// CourseSnapshot.java
public void publish() {
    if (this.status != SnapshotStatus.DRAFT) {
        throw new IllegalStateException("DRAFT 상태에서만 발행할 수 있습니다");
    }
    this.status = SnapshotStatus.ACTIVE;
}

public void complete() {
    if (this.status != SnapshotStatus.ACTIVE) {
        throw new IllegalStateException("ACTIVE 상태에서만 완료할 수 있습니다");
    }
    this.status = SnapshotStatus.COMPLETED;
}

public void archive() {
    if (this.status != SnapshotStatus.COMPLETED) {
        throw new IllegalStateException("COMPLETED 상태에서만 보관할 수 있습니다");
    }
    this.status = SnapshotStatus.ARCHIVED;
}
```

---

## 6. 컨벤션 준수 체크

### Entity (06-ENTITY-CONVENTIONS)

- [x] TenantEntity 상속
- [x] Setter 미사용 → 비즈니스 메서드
- [x] `@Enumerated(EnumType.STRING)`
- [x] 정적 팩토리 메서드 `create()`, `createFromCourse()`
- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] `findByIdAndTenantId()` 패턴
- [x] `@Query` JPQL 사용

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@Size`)
- [x] Response: `from()` 정적 팩토리 메서드

### Exception (08-EXCEPTION-CONVENTIONS)

- [x] BusinessException 상속
- [x] ErrorCode 사용
- [x] 상세 메시지 오버로드

---

## 7. 검증

| 항목 | 결과 |
|------|------|
| `./gradlew compileJava` | ✅ BUILD SUCCESSFUL |
| 파일 수 | 19 files changed |
| 추가 라인 | 971 insertions(+) |

---

## 8. 다음 작업 (Phase 6)

### Snapshot CRUD API 구현

| 구성요소 | 내용 |
|----------|------|
| Service | SnapshotService 인터페이스/구현체 |
| Controller | SnapshotController |
| Test | SnapshotControllerTest |

**API 목록:**

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/courses/{courseId}/snapshots` | 템플릿에서 스냅샷 생성 |
| POST | `/api/snapshots` | 신규 스냅샷 직접 생성 |
| GET | `/api/snapshots` | 스냅샷 목록 |
| GET | `/api/snapshots/{snapshotId}` | 스냅샷 상세 |
| PUT | `/api/snapshots/{snapshotId}` | 스냅샷 수정 |
| DELETE | `/api/snapshots/{snapshotId}` | 스냅샷 삭제 |
| POST | `/api/snapshots/{snapshotId}/publish` | 발행 |
| POST | `/api/snapshots/{snapshotId}/complete` | 완료 |
| POST | `/api/snapshots/{snapshotId}/archive` | 보관 |

---

## 관련 문서

- [Phase 1](phase1.md) - CM 기반 구조 (Entity, Repository, DTO, Exception)
- [Phase 2](phase2.md) - Course CRUD API
- [Phase 3](phase3.md) - CourseItem API (계층 구조)
- [Phase 4](phase4.md) - CourseRelation API (학습 순서)
- [Snapshot API 명세](../../../structure/backend/snapshot/api.md)
- [Snapshot DB 스키마](../../../structure/backend/snapshot/db.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | Phase 5 구현 완료 (Snapshot 기반 구조) |

---

*최종 업데이트: 2025-12-16*

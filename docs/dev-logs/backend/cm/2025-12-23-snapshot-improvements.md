# Snapshot 도메인 개선 작업

## 작업 정보

- **작업 일자**: 2025-12-23
- **작업 담당**: hjj240228mz
- **관련 이슈**: #145, #148
- **관련 PR**: #146, #149

---

## 1. 커스텀 예외로 변경 (#145, #146)

### 배경
`CourseSnapshot` 엔티티에서 상태 전환 시 발생하는 예외가 `IllegalStateException`으로 처리되어 있어, 다른 도메인(Course, Program 등)의 예외 처리 패턴과 일관성이 맞지 않았음.

### 변경 내용

**Before:**
```java
public void publish() {
    if (this.status != SnapshotStatus.DRAFT) {
        throw new IllegalStateException("DRAFT 상태에서만 발행할 수 있습니다");
    }
    this.status = SnapshotStatus.ACTIVE;
}

private void validateModifiable() {
    if (!isModifiable()) {
        throw new IllegalStateException("수정할 수 없는 상태입니다: " + this.status);
    }
}
```

**After:**
```java
public void publish() {
    if (this.status != SnapshotStatus.DRAFT) {
        throw new SnapshotStateException(this.status, "발행");
    }
    this.status = SnapshotStatus.ACTIVE;
}

private void validateModifiable() {
    if (!isModifiable()) {
        throw new SnapshotStateException(this.status, "수정");
    }
}
```

### 변경된 메서드
| 메서드 | 변경 전 | 변경 후 |
|--------|---------|---------|
| `publish()` | `IllegalStateException` | `SnapshotStateException` |
| `complete()` | `IllegalStateException` | `SnapshotStateException` |
| `archive()` | `IllegalStateException` | `SnapshotStateException` |
| `validateModifiable()` | `IllegalStateException` | `SnapshotStateException` |

### 효과
- 다른 도메인의 예외 처리 패턴과 일관성 확보
- 예외 메시지 표준화 (현재 상태 + 시도한 작업)
- 전역 예외 핸들러에서 통일된 응답 처리 가능

---

## 2. 낙관적 락 추가 (#148, #149)

### 배경
팀 컨벤션상 `Course`, `Program`, `CourseTime`, `ContentFolder`, `LearningObject` 등 다른 엔티티에 이미 `@Version` 필드가 적용되어 있어, Snapshot 도메인도 일관성을 위해 추가.

### 참고한 기존 구현
- PR #135: Course, CourseTime, Program 낙관적 락 추가
- PR #137: 비관적 락 적용으로 Race Condition 방지
- PR #147: ContentFolder, LearningObject 낙관적 락 추가

### 변경 내용

#### CourseSnapshot.java
```java
// JPA 낙관적 락 (동시 수정 감지)
@Version
private Long jpaVersion;

// 기존 version 필드는 비즈니스 버전으로 유지
@Column(nullable = false)
private Integer version;
```

> **Note**: `CourseSnapshot`에는 이미 스냅샷 버전을 관리하는 `version` 필드가 있어, JPA 낙관적 락용 필드는 `jpaVersion`으로 명명

#### SnapshotItem.java
```java
// 낙관적 락 (동시 수정 감지)
@Version
private Long version;
```

#### SnapshotRelation.java
```java
// 낙관적 락 (동시 수정 감지)
@Version
private Long version;
```

#### SnapshotLearningObject.java
```java
// 낙관적 락 (동시 수정 감지)
@Version
private Long version;
```

### DB 스키마 변경

`ddl-auto: update` 설정으로 자동 적용됨. 운영 환경 참고용 SQL:

```sql
ALTER TABLE cm_snapshots ADD COLUMN jpa_version BIGINT DEFAULT 0;
ALTER TABLE cm_snapshot_items ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE cm_snapshot_relations ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE cm_snapshot_los ADD COLUMN version BIGINT DEFAULT 0;
```

### 낙관적 락 동작 방식
```
1. 조회 시: version = 1 로드
2. 수정 후 저장 시: UPDATE ... WHERE id = ? AND version = 1
3. 성공하면: version = 2 로 자동 증가
4. 다른 곳에서 먼저 수정했으면: OptimisticLockException 발생
```

### 적용 기준 (팀 컨벤션)
| 락 종류 | 사용 시점 | 예시 |
|---------|----------|------|
| **낙관적 락** (`@Version`) | 충돌 빈도 낮고, 충돌 시 재시도 가능 | 일반 CRUD, 메타데이터 수정 |
| **비관적 락** (`@Lock`) | 선착순 처리, 정원 관리 등 반드시 순서대로 처리 | 수강신청, 좌석 예약 |

---

## 테스트 결과

### 빌드
```
BUILD SUCCESSFUL in 12s
1 actionable task: 1 executed
```

### 테스트
```
BUILD SUCCESSFUL in 1m 31s
5 actionable tasks: 2 executed, 3 up-to-date
```

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `CourseSnapshot.java` | 커스텀 예외 적용 + `jpaVersion` 필드 추가 |
| `SnapshotItem.java` | `version` 필드 추가 |
| `SnapshotRelation.java` | `version` 필드 추가 |
| `SnapshotLearningObject.java` | `version` 필드 추가 |

---

**작성**: hjj240228mz
**검토 완료**: 2025-12-23

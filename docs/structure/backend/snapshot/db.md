# Snapshot DB 스키마

> 스냅샷(개설 강의) 모듈 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **Content 공유 참조** | 파일 불변, 스토리지 절약 (Content는 복사하지 않음) |
| **메타데이터 깊은 복사** | 수강이력 불변성 보장, 템플릿 수정이 기존 강의에 영향 없음 |
| **source_*_id 추적** | 원본 템플릿/아이템과의 관계 추적 |
| **ON DELETE SET NULL** | 템플릿(Course) 삭제해도 스냅샷 유지 |
| **상태 기반 수정 제한** | DRAFT만 전면 수정 가능, 진행 중 강의 보호 |
| **cm_ 접두어** | Course Matrix 도메인 일관성 유지 |

---

## 1. 도메인 관계도

```
cm_courses (템플릿)
   │
   │ 스냅샷 생성 (깊은 복사)
   ▼
┌─────────────────────────────────────────────────────────────┐
│                      cm_snapshots                           │
│                    (개설된 강의)                             │
├─────────────────────────────────────────────────────────────┤
│  id, source_course_id(FK), snapshot_name, status            │
└──────────────────────┬──────────────────────────────────────┘
                       │ 1:N
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   cm_snapshot_items                         │
│                 (차시/폴더 복사본)                           │
├─────────────────────────────────────────────────────────────┤
│  id, snapshot_id(FK), parent_id(FK), item_name, depth       │
│  snapshot_lo_id(FK, nullable) - NULL이면 폴더               │
└──────────────────────┬──────────────────────────────────────┘
                       │ N:1 (optional)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   cm_snapshot_los                           │
│              (학습객체 메타데이터 복사본)                    │
├─────────────────────────────────────────────────────────────┤
│  id, source_lo_id, content_id(FK), display_name...          │
└──────────────────────┬──────────────────────────────────────┘
                       │ N:1 (공유 참조)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     cms_contents                            │
│               (콘텐츠 파일 - 공유됨)                         │
└─────────────────────────────────────────────────────────────┘
```

**핵심**: Content는 공유 참조, 나머지는 깊은 복사

---

## 2. 테이블 구조

### 2.1 cm_snapshots (개설 강의)

```sql
CREATE TABLE cm_snapshots (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    source_course_id    BIGINT NULL,                -- 원본 템플릿 (삭제 시 NULL)
    snapshot_name       VARCHAR(255) NOT NULL,
    description         TEXT,
    hashtags            VARCHAR(255),
    created_by          BIGINT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version             INT NOT NULL DEFAULT 1,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_snapshot_course FOREIGN KEY (source_course_id)
        REFERENCES cm_courses(id) ON DELETE SET NULL,

    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_source (source_course_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| source_course_id | BIGINT | YES | FK → cm_courses (삭제 시 NULL) |
| snapshot_name | VARCHAR(255) | NO | 스냅샷 이름 |
| description | TEXT | YES | 설명 |
| hashtags | VARCHAR(255) | YES | 해시태그 |
| created_by | BIGINT | NO | 생성자 ID |
| status | VARCHAR(20) | NO | 상태 (DRAFT/ACTIVE/COMPLETED/ARCHIVED) |
| version | INT | NO | 버전 (기본값 1) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

### 2.2 cm_snapshot_items (차시/폴더)

```sql
CREATE TABLE cm_snapshot_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    snapshot_id         BIGINT NOT NULL,
    source_item_id      BIGINT NULL,                -- 원본 CourseItem ID (추적용)
    parent_id           BIGINT NULL,
    snapshot_lo_id      BIGINT NULL,                -- NULL이면 폴더
    item_name           VARCHAR(255) NOT NULL,
    depth               INT NOT NULL DEFAULT 0,
    item_type           VARCHAR(20),                -- VIDEO, DOCUMENT 등
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_si_snapshot FOREIGN KEY (snapshot_id)
        REFERENCES cm_snapshots(id) ON DELETE CASCADE,
    CONSTRAINT fk_si_parent FOREIGN KEY (parent_id)
        REFERENCES cm_snapshot_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_si_lo FOREIGN KEY (snapshot_lo_id)
        REFERENCES cm_snapshot_los(id) ON DELETE SET NULL,

    INDEX idx_tenant (tenant_id),
    INDEX idx_snapshot (snapshot_id),
    INDEX idx_parent (parent_id),
    INDEX idx_source_item (source_item_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| snapshot_id | BIGINT | NO | FK → cm_snapshots |
| source_item_id | BIGINT | YES | 원본 CourseItem ID (추적용) |
| parent_id | BIGINT | YES | FK → cm_snapshot_items (self-reference) |
| snapshot_lo_id | BIGINT | YES | FK → cm_snapshot_los (NULL이면 폴더) |
| item_name | VARCHAR(255) | NO | 항목명 |
| depth | INT | NO | 깊이 (0~9) |
| item_type | VARCHAR(20) | YES | 콘텐츠 타입 (VIDEO/DOCUMENT 등) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

**폴더 vs 차시 구분**:
- `snapshot_lo_id = NULL` → 폴더
- `snapshot_lo_id != NULL` → 차시

### 2.3 cm_snapshot_los (학습객체 메타데이터)

```sql
CREATE TABLE cm_snapshot_los (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    source_lo_id        BIGINT NULL,                -- 원본 LO ID (추적용)
    content_id          BIGINT NOT NULL,            -- Content 공유 참조
    display_name        VARCHAR(255) NOT NULL,
    duration            INT,                        -- 재생시간 (초)
    thumbnail_url       VARCHAR(500),
    resolution          VARCHAR(50),
    codec               VARCHAR(50),
    bitrate             BIGINT,
    page_count          INT,                        -- 문서 페이지 수
    is_customized       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_slo_content FOREIGN KEY (content_id)
        REFERENCES cms_contents(id),

    INDEX idx_tenant (tenant_id),
    INDEX idx_content (content_id),
    INDEX idx_source_lo (source_lo_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| source_lo_id | BIGINT | YES | 원본 LO ID (추적용) |
| content_id | BIGINT | NO | FK → cms_contents (공유 참조) |
| display_name | VARCHAR(255) | NO | 표시명 |
| duration | INT | YES | 재생시간 (초) |
| thumbnail_url | VARCHAR(500) | YES | 썸네일 URL |
| resolution | VARCHAR(50) | YES | 해상도 |
| codec | VARCHAR(50) | YES | 코덱 |
| bitrate | BIGINT | YES | 비트레이트 |
| page_count | INT | YES | 페이지 수 (문서) |
| is_customized | BOOLEAN | NO | 수정 여부 (기본값 false) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

### 2.4 cm_snapshot_relations (학습 순서)

```sql
CREATE TABLE cm_snapshot_relations (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    snapshot_id     BIGINT NOT NULL,
    from_item_id    BIGINT NULL,                    -- NULL이면 시작점
    to_item_id      BIGINT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_sr_snapshot FOREIGN KEY (snapshot_id)
        REFERENCES cm_snapshots(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_from FOREIGN KEY (from_item_id)
        REFERENCES cm_snapshot_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_to FOREIGN KEY (to_item_id)
        REFERENCES cm_snapshot_items(id) ON DELETE CASCADE,

    UNIQUE KEY uk_to_item (to_item_id),             -- 하나의 도착점당 하나의 연결
    INDEX idx_tenant (tenant_id),
    INDEX idx_snapshot (snapshot_id),
    INDEX idx_from (from_item_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| snapshot_id | BIGINT | NO | FK → cm_snapshots |
| from_item_id | BIGINT | YES | FK → cm_snapshot_items (NULL이면 시작점) |
| to_item_id | BIGINT | NO | FK → cm_snapshot_items |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

**학습 순서 (Linked List)**:
- `from_item_id = NULL` → 학습 시작점
- 차시 간 순서 연결 (폴더 제외)

---

## 3. ER 다이어그램

```
┌─────────────────────┐                    ┌─────────────────────┐
│    cm_courses       │◄──SET NULL─────────│    cm_snapshots     │
│     (템플릿)        │                    │    (개설 강의)       │
├─────────────────────┤                    ├─────────────────────┤
│ id (PK)             │                    │ id (PK)             │
│ tenant_id           │                    │ tenant_id           │
│ title               │                    │ source_course_id(FK)│
│ description         │                    │ snapshot_name       │
│ ...                 │                    │ status              │
└─────────────────────┘                    │ version             │
                                           └──────────┬──────────┘
                                                      │ 1:N
                                                      ▼
┌─────────────────────┐                    ┌─────────────────────────┐
│  cm_snapshot_los    │◄───────────────────│   cm_snapshot_items     │
│ (LO 메타데이터)     │     N:1            ├─────────────────────────┤
├─────────────────────┤                    │ id (PK)                 │
│ id (PK)             │                    │ tenant_id               │
│ tenant_id           │                    │ snapshot_id (FK)        │◄──────┐
│ source_lo_id        │                    │ parent_id (FK, self)    │───────┘
│ content_id (FK)     │────► cms_contents  │ snapshot_lo_id (FK)     │
│ display_name        │                    │ item_name               │
│ duration            │                    │ depth                   │
│ is_customized       │                    │ item_type               │
└─────────────────────┘                    └──────────┬──────────────┘
                                                      │
                                                      ▼
                                           ┌─────────────────────────┐
                                           │ cm_snapshot_relations   │
                                           ├─────────────────────────┤
                                           │ id (PK)                 │
                                           │ tenant_id               │
                                           │ snapshot_id (FK)        │
                                           │ from_item_id (FK)       │
                                           │ to_item_id (FK, UNIQUE) │
                                           └─────────────────────────┘
```

---

## 4. 상태별 수정 가능 범위

| 상태 | 설명 | 아이템 추가/삭제 | 순서 변경 | 메타데이터 수정 | 콘텐츠 참조 변경 |
|-----|------|---------------|---------|--------------|---------------|
| DRAFT | 준비중/모집중 | O | O | O | O |
| ACTIVE | 강의중 | X | X | O | - |
| COMPLETED | 강의종료 | X | X | X | X |
| ARCHIVED | 보관됨 | X | X | X | X |

---

## 5. 상태 전이

```
DRAFT ──publish()──> ACTIVE ──complete()──> COMPLETED ──archive()──> ARCHIVED
```

- 역방향 전이 불가
- COMPLETED/ARCHIVED에서 다른 상태로 변경 불가

---

## 6. 복사 전략 (Course → Snapshot)

| 원본 | 대상 | 복사 방식 |
|-----|------|----------|
| cm_courses | cm_snapshots | 값 복사 (기본 정보) |
| cm_course_items | cm_snapshot_items | 깊은 복사 (독립 구조) |
| lo_learning_objects | cm_snapshot_los | 깊은 복사 (메타데이터 독립) |
| **cms_contents** | **cms_contents** | **참조 유지** (파일 불변, 공간 절약) |
| cr_course_relations | cm_snapshot_relations | 깊은 복사 (학습경로 독립) |

---

## 7. 주요 쿼리

### 7.1 스냅샷 계층 구조 조회

```sql
WITH RECURSIVE item_hierarchy AS (
    SELECT
        id, snapshot_id, parent_id, snapshot_lo_id,
        item_name, depth, item_type,
        CAST(item_name AS CHAR(1000)) as path
    FROM cm_snapshot_items
    WHERE snapshot_id = ? AND parent_id IS NULL

    UNION ALL

    SELECT
        si.id, si.snapshot_id, si.parent_id, si.snapshot_lo_id,
        si.item_name, si.depth, si.item_type,
        CONCAT(ih.path, ' > ', si.item_name)
    FROM cm_snapshot_items si
    INNER JOIN item_hierarchy ih ON si.parent_id = ih.id
)
SELECT * FROM item_hierarchy ORDER BY path;
```

### 7.2 학습 순서대로 조회

```sql
WITH RECURSIVE learning_order AS (
    SELECT
        sr.to_item_id as item_id,
        si.item_name,
        1 as seq
    FROM cm_snapshot_relations sr
    JOIN cm_snapshot_items si ON sr.to_item_id = si.id
    WHERE sr.snapshot_id = ? AND sr.from_item_id IS NULL

    UNION ALL

    SELECT
        sr.to_item_id,
        si.item_name,
        lo.seq + 1
    FROM cm_snapshot_relations sr
    JOIN learning_order lo ON sr.from_item_id = lo.item_id
    JOIN cm_snapshot_items si ON sr.to_item_id = si.id
)
SELECT * FROM learning_order ORDER BY seq;
```

### 7.3 Content 삭제 보호 (참조 확인)

```sql
-- Content 삭제 전 참조 확인
SELECT COUNT(*) FROM lo_learning_objects WHERE content_id = ?
UNION ALL
SELECT COUNT(*) FROM cm_snapshot_los WHERE content_id = ?;
```

---

## 8. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| cm_snapshots | idx_tenant | 테넌트별 조회 |
| cm_snapshots | idx_status | 상태별 필터 |
| cm_snapshots | idx_created_by | 생성자별 조회 |
| cm_snapshots | idx_source | 원본 템플릿 추적 |
| cm_snapshot_items | idx_snapshot | 스냅샷별 아이템 조회 |
| cm_snapshot_items | idx_parent | 부모-자식 조회 |
| cm_snapshot_los | idx_content | Content 참조 조회 |
| cm_snapshot_relations | idx_snapshot | 스냅샷별 관계 조회 |
| cm_snapshot_relations | uk_to_item | 중복 도착점 방지 |

---

## 9. Entity 클래스

| Entity | 테이블 | 설명 |
|--------|--------|------|
| `CourseSnapshot` | cm_snapshots | 개설 강의 |
| `SnapshotItem` | cm_snapshot_items | 차시/폴더 |
| `SnapshotLearningObject` | cm_snapshot_los | 학습객체 메타데이터 |
| `SnapshotRelation` | cm_snapshot_relations | 학습 경로 연결 |
| `SnapshotStatus` | (enum) | 상태 Enum |

---

## 10. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Snapshot API 명세 |
| [course/db.md](../course/db.md) | Course(템플릿) DB 스키마 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [content/db.md](../content/db.md) | Content DB (FK 참조) |
| [learning/db.md](../learning/db.md) | LearningObject DB |

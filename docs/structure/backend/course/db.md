# Course DB 스키마

> CM (Course Matrix) + CR (Course Relation) 모듈 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **cm_course_items self-reference** | 무한 깊이 폴더 구조 지원 (실제는 depth로 10단계 제한) |
| **learning_object_id NULL 허용** | 폴더/차시 구분을 단일 테이블에서 처리, 조인 최소화 |
| **cr_course_relations Linked List** | 차시 간 학습 순서, 순서 변경 시 전체 재정렬 불필요, O(1) 삽입/삭제 |
| **ON DELETE CASCADE** | 강의 삭제 시 하위 항목 자동 정리, 고아 레코드 방지 |
| **tenant_id** | 멀티테넌시 지원, 테넌트별 데이터 격리 |
| **status 3단계** | DRAFT(작성중) → READY(작성완료) → REGISTERED(등록됨) 상태 관리 |
| **version (낙관적 락)** | 동시 수정 충돌 감지, JPA @Version 활용 |

---

## 1. 테이블 구조

### 1.1 cm_courses (강의 메타데이터)

```sql
CREATE TABLE cm_courses (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    version             BIGINT NOT NULL DEFAULT 0,  -- 낙관적 락
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    thumbnail_url       VARCHAR(500),
    level               VARCHAR(20),        -- BEGINNER, INTERMEDIATE, ADVANCED
    type                VARCHAR(20),        -- ONLINE, OFFLINE, BLENDED
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, READY, REGISTERED
    estimated_hours     INT,
    category_id         BIGINT,
    created_by          BIGINT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| version | BIGINT | NO | 낙관적 락 버전 (JPA @Version) |
| title | VARCHAR(255) | NO | 강의명 |
| description | TEXT | YES | 강의 설명 |
| thumbnail_url | VARCHAR(500) | YES | 썸네일 URL |
| level | VARCHAR(20) | YES | 난이도 (BEGINNER, INTERMEDIATE, ADVANCED) |
| type | VARCHAR(20) | YES | 유형 (ONLINE, OFFLINE, BLENDED) |
| status | VARCHAR(20) | NO | 상태 (DRAFT, READY, REGISTERED) |
| estimated_hours | INT | YES | 예상 학습 시간 |
| category_id | BIGINT | YES | FK → category |
| created_by | BIGINT | YES | 생성자 ID |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

### 1.2 cm_course_tags (강의 태그)

```sql
CREATE TABLE cm_course_tags (
    course_id           BIGINT NOT NULL,
    tag                 VARCHAR(100) NOT NULL,

    CONSTRAINT fk_tag_course FOREIGN KEY (course_id)
        REFERENCES cm_courses(id) ON DELETE CASCADE,

    INDEX idx_course (course_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| course_id | BIGINT | NO | FK → cm_courses |
| tag | VARCHAR(100) | NO | 태그 값 |

> JPA `@ElementCollection`으로 관리됨

### 1.3 cm_course_items (차시/폴더)

```sql
CREATE TABLE cm_course_items (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    course_id           BIGINT NOT NULL,
    parent_id           BIGINT NULL,
    learning_object_id  BIGINT NULL,
    item_name           VARCHAR(255) NOT NULL,
    display_name        VARCHAR(255),           -- 차시 표시명 (커스텀)
    description         VARCHAR(1000),          -- 차시 설명
    depth               INT NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_course FOREIGN KEY (course_id)
        REFERENCES cm_courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_parent FOREIGN KEY (parent_id)
        REFERENCES cm_course_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_lo FOREIGN KEY (learning_object_id)
        REFERENCES learning_object(id) ON DELETE SET NULL,

    INDEX idx_tenant (tenant_id),
    INDEX idx_course (course_id),
    INDEX idx_parent (parent_id),
    INDEX idx_lo (learning_object_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| course_id | BIGINT | NO | FK → cm_courses |
| parent_id | BIGINT | YES | FK → cm_course_items (self-reference) |
| learning_object_id | BIGINT | YES | FK → learning_object (NULL이면 폴더) |
| item_name | VARCHAR(255) | NO | 항목명 |
| display_name | VARCHAR(255) | YES | 차시 표시명 (커스텀, 폴더에는 설정 불가) |
| description | VARCHAR(1000) | YES | 차시 설명 (폴더에는 설정 불가) |
| depth | INT | NO | 깊이 (0~9) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

**폴더 vs 차시 구분**:
- `learning_object_id = NULL` → 폴더
- `learning_object_id != NULL` → 차시

### 1.4 cr_course_relations (차시 간 학습 순서)

```sql
CREATE TABLE cr_course_relations (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    from_item_id    BIGINT NULL,
    to_item_id      BIGINT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_relation_from FOREIGN KEY (from_item_id)
        REFERENCES cm_course_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_relation_to FOREIGN KEY (to_item_id)
        REFERENCES cm_course_items(id) ON DELETE CASCADE,

    UNIQUE KEY uk_from_to (from_item_id, to_item_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_from (from_item_id),
    INDEX idx_to (to_item_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| from_item_id | BIGINT | YES | FK → cm_course_items (NULL이면 시작점) |
| to_item_id | BIGINT | NO | FK → cm_course_items |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

**학습 순서 (Linked List)**:
- `from_item_id = NULL` → 학습 시작점
- 차시 간 순서 연결 (폴더 제외)

---

## 2. CourseStatus (상태)

```java
public enum CourseStatus {
    DRAFT("작성중"),      // 수정 가능, 차수 생성 불가
    READY("작성완료"),    // 수정 가능, 차수 생성 불가
    REGISTERED("등록됨"); // 수정 불가, 차수 생성 가능
}
```

### 상태 전이

```
DRAFT ──ready()──► READY ──register()──► REGISTERED
  ▲                  │
  └──unready()───────┘
```

| 상태 | 수정 가능 | 차수(CourseTime) 생성 |
|------|:--------:|:--------------------:|
| DRAFT | O | X |
| READY | O | X |
| REGISTERED | X | O |

---

## 3. ER 다이어그램

```
┌──────────────────────────┐
│      cm_courses          │
├──────────────────────────┤
│ id (PK)                  │
│ tenant_id                │
│ version                  │◄── 낙관적 락
│ title                    │
│ description              │
│ thumbnail_url            │
│ level                    │
│ type                     │
│ status                   │◄── DRAFT/READY/REGISTERED
│ estimated_hours          │
│ category_id (FK)         │
│ created_by               │
└───────────┬──────────────┘
            │ 1:N
            ▼
┌──────────────────────────┐      ┌─────────────────────┐
│    cm_course_tags        │      │  cm_course_items    │
├──────────────────────────┤      ├─────────────────────┤
│ course_id (FK)           │      │ id (PK)             │
│ tag                      │      │ tenant_id           │
└──────────────────────────┘      │ course_id (FK)      │◄──────┐
                                  │ parent_id (FK,self) │───────┘
                                  │ learning_object_id  │───► learning_object
                                  │ item_name           │
                                  │ display_name        │◄── 차시 전용
                                  │ description         │◄── 차시 전용
                                  │ depth               │
                                  └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────────┐
                                  │  cr_course_relations    │
                                  ├─────────────────────────┤
                                  │ id (PK)                 │
                                  │ tenant_id               │
                                  │ from_item_id (FK)       │───► NULL = 시작점
                                  │ to_item_id (FK)         │
                                  └─────────────────────────┘
```

---

## 4. 데이터 예시

### 4.1 cm_courses 데이터

```sql
INSERT INTO cm_courses (id, tenant_id, version, title, description, level, type, status, created_by) VALUES
(1, 1, 0, 'React 기초 과정', 'React의 기본 개념을 학습합니다.', 'BEGINNER', 'ONLINE', 'DRAFT', 100),
(2, 1, 0, 'Spring Boot 입문', 'Spring Boot로 백엔드를 개발합니다.', 'INTERMEDIATE', 'BLENDED', 'READY', 100);
```

### 4.2 cm_course_tags 데이터

```sql
INSERT INTO cm_course_tags (course_id, tag) VALUES
(1, 'React'),
(1, 'Frontend'),
(1, '입문'),
(2, 'Spring'),
(2, 'Backend');
```

### 4.3 cm_course_items 데이터 (계층 구조)

```sql
-- 강의 1: React 기초 과정
INSERT INTO cm_course_items (id, tenant_id, course_id, parent_id, learning_object_id, item_name, display_name, description, depth) VALUES
-- 최상위 폴더
(1, 1, 1, NULL, NULL, '1주차', NULL, NULL, 0),
(2, 1, 1, NULL, NULL, '2주차', NULL, NULL, 0),
-- 1주차 하위 (차시)
(3, 1, 1, 1, 10, '1-1. 환경설정', '개발 환경 구축하기', 'VS Code, Node.js 설치', 1),
(4, 1, 1, 1, 11, '1-2. JSX 문법', NULL, NULL, 1),
-- 2주차 하위
(5, 1, 1, 2, NULL, '실습자료', NULL, NULL, 1),
(6, 1, 1, 2, 12, '2-1. 컴포넌트', '컴포넌트 기초', '함수형/클래스형 컴포넌트', 1),
-- 실습자료 하위
(7, 1, 1, 5, 13, '예제 코드', NULL, NULL, 2);
```

결과 구조:
```
React 기초 과정 (id=1, status=DRAFT)
├── 1주차 (id=1, 폴더, depth=0)
│   ├── 1-1. 환경설정 (id=3, 차시, depth=1, displayName="개발 환경 구축하기")
│   └── 1-2. JSX 문법 (id=4, 차시, depth=1)
├── 2주차 (id=2, 폴더, depth=0)
│   ├── 실습자료 (id=5, 폴더, depth=1)
│   │   └── 예제 코드 (id=7, 차시, depth=2)
│   └── 2-1. 컴포넌트 (id=6, 차시, depth=1, displayName="컴포넌트 기초")
```

### 4.4 cr_course_relations 데이터 (Linked List)

```sql
-- 학습 순서: 환경설정 → JSX 문법 → 컴포넌트 → 예제 코드
INSERT INTO cr_course_relations (id, tenant_id, from_item_id, to_item_id) VALUES
(1, 1, NULL, 3),  -- 시작점 → 환경설정
(2, 1, 3, 4),     -- 환경설정 → JSX 문법
(3, 1, 4, 6),     -- JSX 문법 → 컴포넌트
(4, 1, 6, 7);     -- 컴포넌트 → 예제 코드
```

학습 순서 시각화:
```
NULL ──► 환경설정(3) ──► JSX 문법(4) ──► 컴포넌트(6) ──► 예제 코드(7)
```

---

## 5. 주요 쿼리

### 5.1 계층 구조 조회 (Recursive CTE)

```sql
WITH RECURSIVE item_hierarchy AS (
    -- Base case: 최상위 항목
    SELECT
        id, course_id, parent_id, learning_object_id,
        item_name, display_name, description, depth,
        CAST(item_name AS CHAR(1000)) as path
    FROM cm_course_items
    WHERE course_id = 1 AND parent_id IS NULL

    UNION ALL

    -- Recursive case: 하위 항목
    SELECT
        ci.id, ci.course_id, ci.parent_id, ci.learning_object_id,
        ci.item_name, ci.display_name, ci.description, ci.depth,
        CONCAT(ih.path, ' > ', ci.item_name)
    FROM cm_course_items ci
    INNER JOIN item_hierarchy ih ON ci.parent_id = ih.id
)
SELECT * FROM item_hierarchy
ORDER BY path;
```

### 5.2 학습 순서대로 조회

```sql
WITH RECURSIVE learning_order AS (
    -- Base case: 시작점 (from_item_id = NULL)
    SELECT
        cr.to_item_id as item_id,
        ci.item_name,
        1 as seq
    FROM cr_course_relations cr
    JOIN cm_course_items ci ON cr.to_item_id = ci.id
    WHERE cr.from_item_id IS NULL

    UNION ALL

    -- Recursive case: 다음 항목
    SELECT
        cr.to_item_id,
        ci.item_name,
        lo.seq + 1
    FROM cr_course_relations cr
    JOIN learning_order lo ON cr.from_item_id = lo.item_id
    JOIN cm_course_items ci ON cr.to_item_id = ci.id
)
SELECT * FROM learning_order
ORDER BY seq;
```

### 5.3 상태별 강의 조회

```sql
-- READY 상태 강의 목록 (차수 생성 대기)
SELECT c.*, COUNT(ci.id) as item_count
FROM cm_courses c
LEFT JOIN cm_course_items ci ON ci.course_id = c.id AND ci.learning_object_id IS NOT NULL
WHERE c.tenant_id = 1 AND c.status = 'READY'
GROUP BY c.id;
```

---

## 6. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| cm_courses | idx_tenant | 테넌트별 강의 조회 |
| cm_courses | idx_category | 카테고리별 강의 조회 |
| cm_courses | idx_status | 상태별 강의 조회 |
| cm_courses | idx_created_by | 생성자별 강의 조회 |
| cm_course_tags | idx_course | 강의별 태그 조회 |
| cm_course_items | idx_tenant | 테넌트별 항목 조회 |
| cm_course_items | idx_course | 강의별 항목 조회 |
| cm_course_items | idx_parent | 부모별 자식 조회 |
| cm_course_items | idx_lo | 학습객체 연결 조회 |
| cr_course_relations | idx_tenant | 테넌트별 관계 조회 |
| cr_course_relations | idx_from | 다음 학습 항목 조회 |
| cr_course_relations | idx_to | 이전 학습 항목 조회 |
| cr_course_relations | uk_from_to | 중복 순서 방지 |

---

## 7. 제약 조건

### 7.1 depth 제한

```sql
-- 트리거 또는 애플리케이션에서 검증
-- depth는 0~9 범위만 허용 (최대 10단계)

DELIMITER //
CREATE TRIGGER check_depth_before_insert
BEFORE INSERT ON cm_course_items
FOR EACH ROW
BEGIN
    IF NEW.depth > 9 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum depth exceeded (max: 9)';
    END IF;
END//
DELIMITER ;
```

### 7.2 상태 전이 규칙

```java
// 애플리케이션 레벨에서 검증
// DRAFT ↔ READY 양방향 가능
// READY → REGISTERED 단방향 (되돌릴 수 없음)
// REGISTERED 상태에서는 수정 불가
```

### 7.3 순환 참조 방지

```sql
-- 애플리케이션 레벨에서 검증
-- parent_id가 자기 자신의 하위 항목을 참조하지 않도록
```

### 7.4 테넌트 격리

```sql
-- 모든 쿼리에 tenant_id 조건 필수
-- 애플리케이션 레벨에서 TenantContext 활용
```

---

## 8. Entity 클래스

| Entity | 테이블 | 설명 |
|--------|--------|------|
| `Course` | cm_courses | 강의 템플릿 |
| `CourseItem` | cm_course_items | 차시/폴더 |
| `CourseRelation` | cr_course_relations | 학습 순서 |
| `CourseStatus` | (enum) | 상태 Enum (DRAFT, READY, REGISTERED) |
| `CourseLevel` | (enum) | 난이도 Enum |
| `CourseType` | (enum) | 유형 Enum |

---

## 9. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Course API 명세 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [learning/db.md](../learning/db.md) | LearningObject DB (FK 참조) |
| [snapshot/db.md](../snapshot/db.md) | Snapshot DB (Course 깊은 복사) |

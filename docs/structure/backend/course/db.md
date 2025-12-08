# Course DB 스키마

> CM (Course Metric) + CR (Course Relation) 모듈 데이터베이스

---

## 1. 테이블 구조

### 1.1 course (강의)

```sql
CREATE TABLE course (
    course_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_name     VARCHAR(255) NOT NULL,
    instructor_id   BIGINT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_instructor (instructor_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| course_id | BIGINT | NO | PK, Auto Increment |
| course_name | VARCHAR(255) | NO | 강의명 |
| instructor_id | BIGINT | NO | 강사 ID (FK → user) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

### 1.2 course_item (차시/폴더)

```sql
CREATE TABLE course_item (
    item_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id           BIGINT NOT NULL,
    parent_id           BIGINT NULL,
    learning_object_id  BIGINT NULL,
    item_name           VARCHAR(255) NOT NULL,
    depth               INT NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_item_course FOREIGN KEY (course_id)
        REFERENCES course(course_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_parent FOREIGN KEY (parent_id)
        REFERENCES course_item(item_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_lo FOREIGN KEY (learning_object_id)
        REFERENCES learning_object(learning_object_id) ON DELETE SET NULL,

    INDEX idx_course (course_id),
    INDEX idx_parent (parent_id),
    INDEX idx_lo (learning_object_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| item_id | BIGINT | NO | PK, Auto Increment |
| course_id | BIGINT | NO | FK → course |
| parent_id | BIGINT | YES | FK → course_item (self-reference) |
| learning_object_id | BIGINT | YES | FK → learning_object (NULL이면 폴더) |
| item_name | VARCHAR(255) | NO | 항목명 |
| depth | INT | NO | 깊이 (0~9) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

**폴더 vs 차시 구분**:
- `learning_object_id = NULL` → 폴더
- `learning_object_id != NULL` → 차시

### 1.3 course_relation (학습 순서)

```sql
CREATE TABLE course_relation (
    relation_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_item_id    BIGINT NULL,
    to_item_id      BIGINT NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_relation_from FOREIGN KEY (from_item_id)
        REFERENCES course_item(item_id) ON DELETE CASCADE,
    CONSTRAINT fk_relation_to FOREIGN KEY (to_item_id)
        REFERENCES course_item(item_id) ON DELETE CASCADE,

    UNIQUE KEY uk_from_to (from_item_id, to_item_id),
    INDEX idx_from (from_item_id),
    INDEX idx_to (to_item_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| relation_id | BIGINT | NO | PK, Auto Increment |
| from_item_id | BIGINT | YES | FK → course_item (NULL이면 시작점) |
| to_item_id | BIGINT | NO | FK → course_item |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

---

## 2. ER 다이어그램

```
┌─────────────────┐
│     course      │
├─────────────────┤
│ course_id (PK)  │
│ course_name     │
│ instructor_id   │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────────────┐
│     course_item         │
├─────────────────────────┤
│ item_id (PK)            │
│ course_id (FK)          │◄──────┐
│ parent_id (FK, self)    │───────┘ self-reference
│ learning_object_id (FK) │───────► learning_object
│ item_name               │
│ depth                   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   course_relation       │
├─────────────────────────┤
│ relation_id (PK)        │
│ from_item_id (FK)       │───► course_item (NULL = 시작점)
│ to_item_id (FK)         │───► course_item
└─────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 course 데이터

```sql
INSERT INTO course (course_id, course_name, instructor_id) VALUES
(1, 'React 기초 과정', 100),
(2, 'Spring Boot 입문', 101);
```

### 3.2 course_item 데이터 (계층 구조)

```sql
-- 강의 1: React 기초 과정
INSERT INTO course_item (item_id, course_id, parent_id, learning_object_id, item_name, depth) VALUES
-- 최상위 폴더
(1, 1, NULL, NULL, '1주차', 0),
(2, 1, NULL, NULL, '2주차', 0),
-- 1주차 하위
(3, 1, 1, 10, '1-1. 환경설정', 1),
(4, 1, 1, 11, '1-2. JSX 문법', 1),
-- 2주차 하위
(5, 1, 2, NULL, '실습자료', 1),
(6, 1, 2, 12, '2-1. 컴포넌트', 1),
-- 실습자료 하위
(7, 1, 5, 13, '예제 코드', 2);
```

결과 구조:
```
React 기초 과정 (course_id=1)
├── 1주차 (item_id=1, 폴더, depth=0)
│   ├── 1-1. 환경설정 (item_id=3, 차시, depth=1)
│   └── 1-2. JSX 문법 (item_id=4, 차시, depth=1)
├── 2주차 (item_id=2, 폴더, depth=0)
│   ├── 실습자료 (item_id=5, 폴더, depth=1)
│   │   └── 예제 코드 (item_id=7, 차시, depth=2)
│   └── 2-1. 컴포넌트 (item_id=6, 차시, depth=1)
```

### 3.3 course_relation 데이터 (Linked List)

```sql
-- 학습 순서: 환경설정 → JSX 문법 → 컴포넌트 → 예제 코드
INSERT INTO course_relation (relation_id, from_item_id, to_item_id) VALUES
(1, NULL, 3),  -- 시작점 → 환경설정
(2, 3, 4),     -- 환경설정 → JSX 문법
(3, 4, 6),     -- JSX 문법 → 컴포넌트
(4, 6, 7);     -- 컴포넌트 → 예제 코드
```

학습 순서 시각화:
```
NULL ──► 환경설정(3) ──► JSX 문법(4) ──► 컴포넌트(6) ──► 예제 코드(7)
```

---

## 4. 주요 쿼리

### 4.1 계층 구조 조회 (Recursive CTE)

```sql
WITH RECURSIVE item_hierarchy AS (
    -- Base case: 최상위 항목
    SELECT
        item_id, course_id, parent_id, learning_object_id,
        item_name, depth,
        CAST(item_name AS CHAR(1000)) as path
    FROM course_item
    WHERE course_id = 1 AND parent_id IS NULL

    UNION ALL

    -- Recursive case: 하위 항목
    SELECT
        ci.item_id, ci.course_id, ci.parent_id, ci.learning_object_id,
        ci.item_name, ci.depth,
        CONCAT(ih.path, ' > ', ci.item_name)
    FROM course_item ci
    INNER JOIN item_hierarchy ih ON ci.parent_id = ih.item_id
)
SELECT * FROM item_hierarchy
ORDER BY path;
```

### 4.2 학습 순서대로 조회

```sql
WITH RECURSIVE learning_order AS (
    -- Base case: 시작점 (from_item_id = NULL)
    SELECT
        cr.to_item_id as item_id,
        ci.item_name,
        1 as seq
    FROM course_relation cr
    JOIN course_item ci ON cr.to_item_id = ci.item_id
    WHERE cr.from_item_id IS NULL

    UNION ALL

    -- Recursive case: 다음 항목
    SELECT
        cr.to_item_id,
        ci.item_name,
        lo.seq + 1
    FROM course_relation cr
    JOIN learning_order lo ON cr.from_item_id = lo.item_id
    JOIN course_item ci ON cr.to_item_id = ci.item_id
)
SELECT * FROM learning_order
ORDER BY seq;
```

### 4.3 폴더 하위 항목 수 조회

```sql
SELECT
    parent.item_id,
    parent.item_name,
    COUNT(child.item_id) as child_count
FROM course_item parent
LEFT JOIN course_item child ON child.parent_id = parent.item_id
WHERE parent.course_id = 1 AND parent.learning_object_id IS NULL
GROUP BY parent.item_id, parent.item_name;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| course | idx_instructor | 강사별 강의 조회 |
| course_item | idx_course | 강의별 항목 조회 |
| course_item | idx_parent | 부모별 자식 조회 |
| course_item | idx_lo | 학습객체 연결 조회 |
| course_relation | idx_from | 다음 학습 항목 조회 |
| course_relation | idx_to | 이전 학습 항목 조회 |
| course_relation | uk_from_to | 중복 순서 방지 |

---

## 6. 제약 조건

### 6.1 depth 제한

```sql
-- 트리거 또는 애플리케이션에서 검증
-- depth는 0~9 범위만 허용 (최대 10단계)

DELIMITER //
CREATE TRIGGER check_depth_before_insert
BEFORE INSERT ON course_item
FOR EACH ROW
BEGIN
    IF NEW.depth > 9 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum depth exceeded (max: 9)';
    END IF;
END//
DELIMITER ;
```

### 6.2 순환 참조 방지

```sql
-- 애플리케이션 레벨에서 검증
-- parent_id가 자기 자신의 하위 항목을 참조하지 않도록
```

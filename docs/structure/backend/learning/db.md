# Learning Object DB 스키마

> LO (Learning Object) 모듈 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **tenant_id 멀티테넌시** | B2C/B2B/KPOP 테넌트별 데이터 격리 |
| **Content와 1:1 관계** | 하나의 콘텐츠 파일 = 하나의 학습 단위 |
| **content_id ON DELETE SET NULL** | 원본 삭제되어도 LO 메타 유지 가능 |
| **content_folder 3단계 제한** | 과도한 중첩 방지, UX 최적화 |
| **folder_id NULL 허용** | 최상위 폴더 없이 바로 배치 가능 |

---

## 1. 테이블 구조

### 1.1 learning_object (학습객체)

```sql
CREATE TABLE learning_object (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL DEFAULT 1,
    name                VARCHAR(500) NOT NULL,
    content_id          BIGINT,
    folder_id           BIGINT,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_lo_content FOREIGN KEY (content_id)
        REFERENCES content(id) ON DELETE SET NULL,
    CONSTRAINT fk_lo_folder FOREIGN KEY (folder_id)
        REFERENCES content_folder(id) ON DELETE SET NULL,

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_content (content_id),
    INDEX idx_folder (folder_id),
    INDEX idx_name (name)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID (기본값: 1 = B2C) |
| name | VARCHAR(500) | NO | 학습객체 이름 |
| content_id | BIGINT | YES | FK → content |
| folder_id | BIGINT | YES | FK → content_folder |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

### 1.2 content_folder (콘텐츠 폴더)

```sql
CREATE TABLE content_folder (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL DEFAULT 1,
    folder_name     VARCHAR(255) NOT NULL,
    parent_id       BIGINT,
    depth           INT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id)
        REFERENCES content_folder(id) ON DELETE CASCADE,

    INDEX idx_tenant_id (tenant_id),
    INDEX idx_parent (parent_id),
    INDEX idx_depth (depth)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID (기본값: 1 = B2C) |
| folder_name | VARCHAR(255) | NO | 폴더 이름 |
| parent_id | BIGINT | YES | FK → content_folder (self-reference) |
| depth | INT | NO | 깊이 (0, 1, 2 - 최대 3단계) |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

---

## 2. ER 다이어그램

```
┌─────────────────────────┐
│    content_folder       │
├─────────────────────────┤
│ id (PK)                 │◄──────┐
│ tenant_id (FK)          │       │ self-reference
│ folder_name             │       │
│ parent_id (FK)          │───────┘
│ depth                   │
└────────────┬────────────┘
             │ 1:N
             ▼
┌─────────────────────────┐
│   learning_object       │
├─────────────────────────┤
│ id (PK)                 │
│ tenant_id (FK)          │
│ name                    │
│ content_id (FK)         │───────► content (CMS)
│ folder_id (FK)          │
└─────────────────────────┘
             │
             │ N:1 (참조됨)
             ▼
┌─────────────────────────┐
│     course_item         │
│  (CM 모듈에서 참조)       │
└─────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 content_folder 데이터

```sql
-- 3단계 계층 구조
INSERT INTO content_folder (id, tenant_id, folder_name, parent_id, depth) VALUES
-- 최상위 폴더 (depth=0)
(1, 1, '교육자료', NULL, 0),
(2, 1, '실습자료', NULL, 0),

-- 2단계 폴더 (depth=1)
(3, 1, '2024년', 1, 1),
(4, 1, '2025년', 1, 1),

-- 3단계 폴더 (depth=2) - 최대 깊이
(5, 1, '1분기', 3, 2),
(6, 1, '2분기', 3, 2);
```

결과 구조:
```
콘텐츠 풀
├── 교육자료 (id=1, depth=0)
│   ├── 2024년 (id=3, depth=1)
│   │   ├── 1분기 (id=5, depth=2)
│   │   └── 2분기 (id=6, depth=2)
│   └── 2025년 (id=4, depth=1)
└── 실습자료 (id=2, depth=0)
```

### 3.2 learning_object 데이터

```sql
INSERT INTO learning_object (id, tenant_id, name, content_id, folder_id) VALUES
-- 폴더에 배치된 학습객체
(1, 1, 'react-tutorial.mp4', 10, 5),
(2, 1, 'spring-guide.pdf', 11, 5),
(3, 1, 'database-design.pptx', 12, 6),

-- 최상위에 배치된 학습객체 (folder_id = NULL)
(4, 1, '공지사항.pdf', 13, NULL),

-- 실습자료 폴더
(5, 1, '예제 코드.zip', 14, 2);
```

결과 구조:
```
콘텐츠 풀
├── 교육자료
│   ├── 2024년
│   │   ├── 1분기
│   │   │   ├── [LO] react-tutorial.mp4
│   │   │   └── [LO] spring-guide.pdf
│   │   └── 2분기
│   │       └── [LO] database-design.pptx
│   └── 2025년
├── 실습자료
│   └── [LO] 예제 코드.zip
└── [LO] 공지사항.pdf (최상위)
```

---

## 4. 주요 쿼리

### 4.1 폴더 트리 조회 (Recursive CTE)

```sql
WITH RECURSIVE folder_tree AS (
    -- Base case: 최상위 폴더
    SELECT
        id, folder_name, parent_id, depth,
        CAST(folder_name AS CHAR(1000)) as path
    FROM content_folder
    WHERE parent_id IS NULL

    UNION ALL

    -- Recursive case: 하위 폴더
    SELECT
        cf.id, cf.folder_name, cf.parent_id, cf.depth,
        CONCAT(ft.path, ' > ', cf.folder_name)
    FROM content_folder cf
    INNER JOIN folder_tree ft ON cf.parent_id = ft.id
)
SELECT * FROM folder_tree
ORDER BY path;
```

### 4.2 폴더별 학습객체 수 조회

```sql
SELECT
    cf.id,
    cf.folder_name,
    cf.depth,
    COUNT(lo.id) as item_count
FROM content_folder cf
LEFT JOIN learning_object lo ON lo.folder_id = cf.id
GROUP BY cf.id, cf.folder_name, cf.depth
ORDER BY cf.depth, cf.folder_name;
```

### 4.3 특정 폴더 하위 전체 학습객체 조회

```sql
WITH RECURSIVE folder_descendants AS (
    -- Base case: 시작 폴더
    SELECT id FROM content_folder WHERE id = 1

    UNION ALL

    -- Recursive case: 하위 폴더
    SELECT cf.id
    FROM content_folder cf
    INNER JOIN folder_descendants fd ON cf.parent_id = fd.id
)
SELECT lo.*
FROM learning_object lo
WHERE lo.folder_id IN (SELECT id FROM folder_descendants)
   OR lo.folder_id = 1;
```

### 4.4 학습객체 검색 (이름 + 콘텐츠 정보)

```sql
SELECT
    lo.id,
    lo.name,
    c.content_type,
    c.duration,
    c.file_size,
    cf.folder_name
FROM learning_object lo
LEFT JOIN content c ON lo.content_id = c.id
LEFT JOIN content_folder cf ON lo.folder_id = cf.id
WHERE lo.name LIKE '%react%'
ORDER BY lo.created_at DESC;
```

### 4.5 CourseItem에서 참조 중인 학습객체 조회

```sql
SELECT
    lo.*,
    COUNT(ci.id) as usage_count
FROM learning_object lo
LEFT JOIN course_item ci ON ci.learning_object_id = lo.id
GROUP BY lo.id
HAVING usage_count > 0
ORDER BY usage_count DESC;
```

---

## 5. 인덱스 전략

### learning_object

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| idx_tenant_id | tenant_id | 테넌트별 데이터 격리 |
| idx_content | content_id | Content 연결 조회 |
| idx_folder | folder_id | 폴더별 학습객체 조회 |
| idx_name | name | 이름 검색 |

### content_folder

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| idx_tenant_id | tenant_id | 테넌트별 데이터 격리 |
| idx_parent | parent_id | 하위 폴더 조회 |
| idx_depth | depth | 깊이별 필터링 |

### 추가 권장 인덱스

```sql
-- 복합 인덱스 (폴더 + 생성일)
CREATE INDEX idx_folder_created ON learning_object(folder_id, created_at DESC);

-- 이름 전문 검색 (선택사항)
CREATE FULLTEXT INDEX ft_name ON learning_object(name);
```

---

## 6. 제약 조건

### 6.1 폴더 깊이 제한 (최대 3단계)

```sql
DELIMITER //
CREATE TRIGGER check_folder_depth_before_insert
BEFORE INSERT ON content_folder
FOR EACH ROW
BEGIN
    IF NEW.depth > 2 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum folder depth exceeded (max: 2, meaning 3 levels)';
    END IF;
END//
DELIMITER ;
```

### 6.2 depth 자동 계산

```sql
DELIMITER //
CREATE TRIGGER calculate_folder_depth_before_insert
BEFORE INSERT ON content_folder
FOR EACH ROW
BEGIN
    IF NEW.parent_id IS NULL THEN
        SET NEW.depth = 0;
    ELSE
        SELECT depth + 1 INTO NEW.depth
        FROM content_folder
        WHERE folder_id = NEW.parent_id;
    END IF;
END//
DELIMITER ;
```

---

## 7. 데이터 무결성

### ON DELETE 동작

| 참조 테이블 | 동작 | 설명 |
|-------------|------|------|
| content_folder → content_folder (parent) | CASCADE | 부모 삭제 시 하위 폴더도 삭제 |
| learning_object → content | SET NULL | Content 삭제 시 LO는 유지 |
| learning_object → content_folder | SET NULL | 폴더 삭제 시 LO는 최상위로 이동 |
| course_item → learning_object | SET NULL | LO 삭제 시 CourseItem은 폴더로 변경 |

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | LearningObject API 명세 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [content/db.md](../content/db.md) | Content DB (FK 참조) |
| [course/db.md](../course/db.md) | Course DB (CourseItem에서 참조) |

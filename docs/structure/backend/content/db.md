# Content DB 스키마

> CMS (Content Management System) 모듈 데이터베이스

---

## 1. 테이블 구조

### 1.1 content (콘텐츠)

```sql
CREATE TABLE content (
    content_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_file_name  VARCHAR(500),
    stored_file_name    VARCHAR(255),
    content_type        VARCHAR(50) NOT NULL,
    file_size           BIGINT,
    duration            INT,
    resolution          VARCHAR(20),
    page_count          INT,
    external_url        VARCHAR(2000),
    file_path           VARCHAR(1000),
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_content_type (content_type),
    INDEX idx_created_at (created_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| content_id | BIGINT | NO | PK, Auto Increment |
| original_file_name | VARCHAR(500) | YES | 원본 파일명 |
| stored_file_name | VARCHAR(255) | YES | 저장된 파일명 (UUID) |
| content_type | VARCHAR(50) | NO | 콘텐츠 타입 (ENUM) |
| file_size | BIGINT | YES | 파일 크기 (bytes) |
| duration | INT | YES | 재생 시간 (초, VIDEO/AUDIO) |
| resolution | VARCHAR(20) | YES | 해상도 (VIDEO/IMAGE) |
| page_count | INT | YES | 페이지 수 (DOCUMENT) |
| external_url | VARCHAR(2000) | YES | 외부 링크 URL |
| file_path | VARCHAR(1000) | YES | 파일 저장 경로 |
| created_at | DATETIME | NO | 생성일시 |
| updated_at | DATETIME | NO | 수정일시 |

### 1.2 ContentType ENUM

```sql
-- content_type 컬럼 값
'VIDEO'         -- 동영상 (mp4, avi, mov, mkv)
'DOCUMENT'      -- 문서 (pdf, doc, docx, ppt, pptx)
'IMAGE'         -- 이미지 (jpg, png, gif, svg)
'AUDIO'         -- 오디오 (mp3, wav, m4a)
'EXTERNAL_LINK' -- 외부 링크 (YouTube, Vimeo, Google Form)
```

---

## 2. ER 다이어그램

```
┌─────────────────────────────────┐
│           content               │
├─────────────────────────────────┤
│ content_id (PK)                 │
│ original_file_name              │
│ stored_file_name                │
│ content_type                    │ ──► ENUM (VIDEO, DOCUMENT, ...)
│ file_size                       │
│ duration                        │ ──► VIDEO, AUDIO, EXTERNAL_LINK
│ resolution                      │ ──► VIDEO, IMAGE
│ page_count                      │ ──► DOCUMENT (PDF)
│ external_url                    │ ──► EXTERNAL_LINK
│ file_path                       │
│ created_at                      │
│ updated_at                      │
└─────────────────────────────────┘
         │
         │ 1:1 (연결됨)
         ▼
┌─────────────────────────────────┐
│      learning_object            │
│  (LO 모듈에서 자동 생성)          │
└─────────────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 VIDEO 콘텐츠

```sql
INSERT INTO content (
    content_id, original_file_name, stored_file_name, content_type,
    file_size, duration, resolution, file_path
) VALUES (
    1,
    'react-tutorial.mp4',
    '550e8400-e29b-41d4-a716-446655440000.mp4',
    'VIDEO',
    104857600,  -- 100MB
    1800,       -- 30분
    '1920x1080',
    '/uploads/2025/01/550e8400-e29b-41d4-a716-446655440000.mp4'
);
```

### 3.2 DOCUMENT (PDF) 콘텐츠

```sql
INSERT INTO content (
    content_id, original_file_name, stored_file_name, content_type,
    file_size, page_count, file_path
) VALUES (
    2,
    'spring-guide.pdf',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8.pdf',
    'DOCUMENT',
    5242880,    -- 5MB
    45,         -- 45페이지
    '/uploads/2025/01/6ba7b810-9dad-11d1-80b4-00c04fd430c8.pdf'
);
```

### 3.3 EXTERNAL_LINK (YouTube) 콘텐츠

```sql
INSERT INTO content (
    content_id, original_file_name, content_type,
    duration, external_url
) VALUES (
    3,
    'React 공식 튜토리얼',
    'EXTERNAL_LINK',
    1523,       -- 25분 23초
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
);
```

### 3.4 IMAGE 콘텐츠

```sql
INSERT INTO content (
    content_id, original_file_name, stored_file_name, content_type,
    file_size, resolution, file_path
) VALUES (
    4,
    'architecture-diagram.png',
    '6ba7b814-9dad-11d1-80b4-00c04fd430c8.png',
    'IMAGE',
    1048576,    -- 1MB
    '2560x1440',
    '/uploads/2025/01/6ba7b814-9dad-11d1-80b4-00c04fd430c8.png'
);
```

### 3.5 AUDIO 콘텐츠

```sql
INSERT INTO content (
    content_id, original_file_name, stored_file_name, content_type,
    file_size, duration, file_path
) VALUES (
    5,
    'podcast-episode1.mp3',
    '6ba7b818-9dad-11d1-80b4-00c04fd430c8.mp3',
    'AUDIO',
    52428800,   -- 50MB
    3600,       -- 1시간
    '/uploads/2025/01/6ba7b818-9dad-11d1-80b4-00c04fd430c8.mp3'
);
```

---

## 4. 주요 쿼리

### 4.1 타입별 콘텐츠 조회

```sql
SELECT *
FROM content
WHERE content_type = 'VIDEO'
ORDER BY created_at DESC;
```

### 4.2 최근 업로드 콘텐츠

```sql
SELECT *
FROM content
ORDER BY created_at DESC
LIMIT 10;
```

### 4.3 용량 통계

```sql
SELECT
    content_type,
    COUNT(*) as count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size
FROM content
WHERE file_size IS NOT NULL
GROUP BY content_type;
```

### 4.4 영상 총 재생시간

```sql
SELECT
    COUNT(*) as video_count,
    SUM(duration) as total_seconds,
    SEC_TO_TIME(SUM(duration)) as total_time
FROM content
WHERE content_type IN ('VIDEO', 'AUDIO')
  AND duration IS NOT NULL;
```

### 4.5 외부 링크 플랫폼별 통계

```sql
SELECT
    CASE
        WHEN external_url LIKE '%youtube.com%' OR external_url LIKE '%youtu.be%' THEN 'YouTube'
        WHEN external_url LIKE '%vimeo.com%' THEN 'Vimeo'
        WHEN external_url LIKE '%docs.google.com/forms%' THEN 'Google Form'
        ELSE 'Other'
    END as platform,
    COUNT(*) as count
FROM content
WHERE content_type = 'EXTERNAL_LINK'
GROUP BY platform;
```

---

## 5. 인덱스 전략

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| idx_content_type | content_type | 타입별 필터링 |
| idx_created_at | created_at | 최신순 정렬 |

### 추가 권장 인덱스

```sql
-- 파일 경로 조회 (스트리밍/다운로드)
CREATE INDEX idx_file_path ON content(file_path);

-- 복합 인덱스 (타입 + 생성일)
CREATE INDEX idx_type_created ON content(content_type, created_at DESC);
```

---

## 6. 데이터 무결성

### 6.1 타입별 필수 필드 검증

| content_type | 필수 필드 | NULL 허용 필드 |
|--------------|-----------|----------------|
| VIDEO | file_path, file_size, duration, resolution | page_count, external_url |
| DOCUMENT | file_path, file_size | duration, resolution, external_url |
| IMAGE | file_path, file_size, resolution | duration, page_count, external_url |
| AUDIO | file_path, file_size, duration | resolution, page_count, external_url |
| EXTERNAL_LINK | external_url | file_path, file_size, resolution, page_count |

### 6.2 검증 트리거 (선택사항)

```sql
DELIMITER //
CREATE TRIGGER validate_content_before_insert
BEFORE INSERT ON content
FOR EACH ROW
BEGIN
    -- EXTERNAL_LINK는 external_url 필수
    IF NEW.content_type = 'EXTERNAL_LINK' AND NEW.external_url IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'external_url is required for EXTERNAL_LINK type';
    END IF;

    -- 파일 타입은 file_path 필수
    IF NEW.content_type IN ('VIDEO', 'DOCUMENT', 'IMAGE', 'AUDIO')
       AND NEW.file_path IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'file_path is required for file types';
    END IF;
END//
DELIMITER ;
```

---

## 7. 파일 저장 경로 규칙

### 경로 패턴

```
/uploads/{year}/{month}/{uuid}.{extension}
```

### 예시

```
/uploads/2025/01/550e8400-e29b-41d4-a716-446655440000.mp4
/uploads/2025/01/6ba7b810-9dad-11d1-80b4-00c04fd430c8.pdf
```

### 장점

- UUID로 파일명 충돌 방지
- 날짜별 디렉토리로 관리 용이
- 원본 파일명은 DB에 별도 저장

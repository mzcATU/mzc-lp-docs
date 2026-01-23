# Certificate DB 스키마

> 수료증 관련 테이블 설계

---

## 1. 테이블 목록

| 테이블명 | 설명 |
|----------|------|
| ct_certificates | 수료증 마스터 |
| ct_certificate_templates | 수료증 템플릿 (테넌트별) |

---

## 2. 테이블 상세

### 2.1 ct_certificates (수료증)

```sql
CREATE TABLE ct_certificates (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    certificate_number  VARCHAR(50) NOT NULL,

    -- 수강 정보
    enrollment_id       BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,
    course_id           BIGINT NOT NULL,
    course_time_id      BIGINT NOT NULL,

    -- 수료 정보
    completion_rate     INT NOT NULL DEFAULT 100,
    completed_at        DATETIME(6) NOT NULL,

    -- 발급 정보
    issued_at           DATETIME(6) NOT NULL,
    expires_at          DATETIME(6),
    issued_by           BIGINT,

    -- 상태
    status              VARCHAR(20) NOT NULL DEFAULT 'VALID',
    revoked_at          DATETIME(6),
    revoke_reason       VARCHAR(500),
    revoked_by          BIGINT,

    -- 재발급 관련
    original_id         BIGINT,
    reissue_count       INT NOT NULL DEFAULT 0,

    -- 파일 정보
    pdf_url             VARCHAR(500),

    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_cert_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),
    CONSTRAINT fk_cert_enrollment FOREIGN KEY (enrollment_id)
        REFERENCES sis_enrollments(id),
    CONSTRAINT fk_cert_user FOREIGN KEY (user_id)
        REFERENCES um_users(id),
    CONSTRAINT fk_cert_course FOREIGN KEY (course_id)
        REFERENCES cm_courses(id),
    CONSTRAINT fk_cert_time FOREIGN KEY (course_time_id)
        REFERENCES ts_course_times(id),
    CONSTRAINT fk_cert_original FOREIGN KEY (original_id)
        REFERENCES ct_certificates(id),

    UNIQUE KEY uk_certificate_number (certificate_number),
    UNIQUE KEY uk_enrollment_valid (enrollment_id, status),
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_course_time (course_time_id),
    INDEX idx_status (status),
    INDEX idx_issued_at (issued_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | FK → tenants |
| certificate_number | VARCHAR(50) | NO | 수료증 고유번호 (CERT-2025-00001) |
| enrollment_id | BIGINT | NO | FK → sis_enrollments |
| user_id | BIGINT | NO | FK → um_users |
| course_id | BIGINT | NO | FK → cm_courses |
| course_time_id | BIGINT | NO | FK → ts_course_times |
| completion_rate | INT | NO | 완료율 (%) |
| completed_at | DATETIME(6) | NO | 수강 완료 일시 |
| issued_at | DATETIME(6) | NO | 발급 일시 |
| expires_at | DATETIME(6) | YES | 만료 일시 (NULL이면 무기한) |
| issued_by | BIGINT | YES | 발급자 ID (자동 발급 시 NULL) |
| status | VARCHAR(20) | NO | 상태 (VALID, EXPIRED, REVOKED) |
| revoked_at | DATETIME(6) | YES | 취소 일시 |
| revoke_reason | VARCHAR(500) | YES | 취소 사유 |
| revoked_by | BIGINT | YES | 취소자 ID |
| original_id | BIGINT | YES | 원본 수료증 ID (재발급 시) |
| reissue_count | INT | NO | 재발급 횟수 |
| pdf_url | VARCHAR(500) | YES | PDF 파일 URL |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**CertificateStatus Enum:**
```java
public enum CertificateStatus {
    VALID,      // 유효
    EXPIRED,    // 만료됨
    REVOKED     // 취소됨
}
```

---

### 2.2 ct_certificate_templates (수료증 템플릿)

> 테넌트별 수료증 디자인 템플릿

```sql
CREATE TABLE ct_certificate_templates (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),

    -- 템플릿 설정
    template_type   VARCHAR(20) NOT NULL DEFAULT 'DEFAULT',
    background_url  VARCHAR(500),
    logo_url        VARCHAR(500),
    signature_url   VARCHAR(500),

    -- 텍스트 설정
    title_text      VARCHAR(200) DEFAULT '수료증',
    body_template   TEXT,
    footer_text     VARCHAR(500),

    -- 유효기간 설정
    validity_months INT,

    -- 상태
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by      BIGINT,

    CONSTRAINT fk_template_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),

    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | FK → tenants |
| name | VARCHAR(100) | NO | 템플릿 이름 |
| description | VARCHAR(500) | YES | 설명 |
| template_type | VARCHAR(20) | NO | 템플릿 유형 (DEFAULT, CUSTOM) |
| background_url | VARCHAR(500) | YES | 배경 이미지 URL |
| logo_url | VARCHAR(500) | YES | 로고 이미지 URL |
| signature_url | VARCHAR(500) | YES | 서명 이미지 URL |
| title_text | VARCHAR(200) | YES | 수료증 제목 |
| body_template | TEXT | YES | 본문 템플릿 (변수 치환용) |
| footer_text | VARCHAR(500) | YES | 하단 문구 |
| validity_months | INT | YES | 유효기간 (개월, NULL이면 무기한) |
| is_default | BOOLEAN | NO | 기본 템플릿 여부 |
| is_active | BOOLEAN | NO | 활성화 여부 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |
| created_by | BIGINT | YES | 생성자 ID |

---

## 3. ER 다이어그램

```
┌─────────────────┐       ┌─────────────────┐
│  sis_enrollments │       │    um_users     │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ name            │
│ course_time_id  │       │ email           │
│ status          │       └────────┬────────┘
│ completed_at    │                │
└────────┬────────┘                │
         │                         │
         │ 1:1                     │ 1:N
         ▼                         ▼
┌─────────────────────────────────────────────┐
│              ct_certificates                 │
│─────────────────────────────────────────────│
│ id (PK)                                     │
│ tenant_id (FK)                              │
│ certificate_number (UK)                     │
│ enrollment_id (FK) ─────────────────────────┤
│ user_id (FK) ───────────────────────────────┤
│ course_id (FK)                              │
│ course_time_id (FK)                         │
│ completion_rate                             │
│ completed_at                                │
│ issued_at                                   │
│ expires_at                                  │
│ status                                      │
│ original_id (FK, self) ──┐                  │
│ pdf_url                  │ 재발급 시        │
└──────────────────────────┴──────────────────┘
```

---

## 4. 인덱스 전략

| 인덱스 | 컬럼 | 용도 |
|--------|------|------|
| uk_certificate_number | certificate_number | 수료증 번호 검증 |
| uk_enrollment_valid | enrollment_id, status | 중복 발급 방지 |
| idx_user | user_id | 내 수료증 목록 |
| idx_course_time | course_time_id | 차수별 발급 현황 |
| idx_status | status | 상태별 필터링 |

---

## 5. 수료증 번호 생성 규칙

```
형식: CERT-{YEAR}-{SEQUENCE}
예시: CERT-2025-00001

- YEAR: 발급 연도 (4자리)
- SEQUENCE: 연간 순번 (5자리, 0-패딩)
- 연간 최대 99,999개 발급 가능
```

**생성 로직:**
```java
public String generateCertificateNumber() {
    int year = LocalDate.now().getYear();
    Long sequence = certificateRepository.countByYear(year) + 1;
    return String.format("CERT-%d-%05d", year, sequence);
}
```

---

## 6. 샘플 데이터

```sql
-- 수료증 템플릿
INSERT INTO ct_certificate_templates
(tenant_id, name, template_type, title_text, is_default, is_active)
VALUES
(1, '기본 수료증', 'DEFAULT', '수 료 증', TRUE, TRUE);

-- 수료증 발급
INSERT INTO ct_certificates
(tenant_id, certificate_number, enrollment_id, user_id, course_id, course_time_id,
 completion_rate, completed_at, issued_at, status)
VALUES
(1, 'CERT-2025-00001', 100, 1, 10, 5, 100,
 '2025-01-19 15:30:00', '2025-01-20 10:00:00', 'VALID');
```

---

## 7. 주요 쿼리

### 수료증 검증
```sql
SELECT c.*, u.name as user_name, co.title as course_title
FROM ct_certificates c
JOIN um_users u ON c.user_id = u.id
JOIN cm_courses co ON c.course_id = co.id
WHERE c.certificate_number = 'CERT-2025-00001';
```

### 내 수료증 목록
```sql
SELECT c.*, co.title as course_title, ct.name as course_time_name
FROM ct_certificates c
JOIN cm_courses co ON c.course_id = co.id
JOIN ts_course_times ct ON c.course_time_id = ct.id
WHERE c.user_id = ? AND c.tenant_id = ?
ORDER BY c.issued_at DESC;
```

### 차수별 발급 현황
```sql
SELECT
    COUNT(*) as total_issued,
    SUM(CASE WHEN status = 'VALID' THEN 1 ELSE 0 END) as valid_count,
    SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) as revoked_count
FROM ct_certificates
WHERE course_time_id = ? AND tenant_id = ?;
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Certificate API 명세 |
| [student/db.md](../student/db.md) | 수강 DB 스키마 |
| [course/db.md](../course/db.md) | 강의 DB 스키마 |

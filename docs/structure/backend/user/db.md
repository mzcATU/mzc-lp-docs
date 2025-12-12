# User DB 스키마

> UM (User Master) 모듈 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **user_course_roles 분리** | User와 Course 간 N:M 관계, 역할별 추가 속성(수익분배율) 필요 |
| **organization self-reference** | 무한 깊이 조직 구조 지원 (실제는 level로 5단계 제한) |
| **TenantEntity 상속** | tenant_id 기반 데이터 격리, 테넌트별 자동 필터링 |
| **Soft Delete (status)** | 회원탈퇴 시 데이터 보존, 일정 기간 후 완전 삭제 |

---

## 1. 테이블 구조

### 1.1 um_users (사용자)

```sql
CREATE TABLE um_users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    name            VARCHAR(50) NOT NULL,
    phone           VARCHAR(20),
    profile_image_url VARCHAR(500),
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    organization_id BIGINT,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_user_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),
    CONSTRAINT fk_user_organization FOREIGN KEY (organization_id)
        REFERENCES um_organizations(id) ON DELETE SET NULL,

    UNIQUE KEY uk_tenant_email (tenant_id, email),
    INDEX idx_tenant (tenant_id),
    INDEX idx_organization (organization_id),
    INDEX idx_status (status),
    INDEX idx_role (role)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | FK → tenants |
| email | VARCHAR(255) | NO | 이메일 (테넌트 내 unique) |
| password | VARCHAR(255) | NO | BCrypt 해시 |
| name | VARCHAR(50) | NO | 이름 |
| phone | VARCHAR(20) | YES | 전화번호 |
| profile_image_url | VARCHAR(500) | YES | 프로필 이미지 URL |
| role | VARCHAR(20) | NO | 테넌트 역할 (USER, OPERATOR, TENANT_ADMIN) |
| status | VARCHAR(20) | NO | 상태 (ACTIVE, INACTIVE, SUSPENDED, WITHDRAWN) |
| organization_id | BIGINT | YES | FK → um_organizations (B2B 전용) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**TenantRole Enum:**
- `USER`: 일반 사용자 (수강)
- `OPERATOR`: 운영자 (강의 검토, 차수 생성, 역할 부여)
- `TENANT_ADMIN`: 테넌트 관리자

**UserStatus Enum:**
- `ACTIVE`: 활성
- `INACTIVE`: 비활성
- `SUSPENDED`: 정지
- `WITHDRAWN`: 탈퇴

### 1.2 um_user_course_roles (강의별 역할)

```sql
CREATE TABLE um_user_course_roles (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT NOT NULL,
    course_id               BIGINT,
    role                    VARCHAR(20) NOT NULL,
    revenue_share_percent   INT,
    created_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_course_role_user FOREIGN KEY (user_id)
        REFERENCES um_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_course_role_course FOREIGN KEY (course_id)
        REFERENCES ts_programs(id) ON DELETE CASCADE,

    UNIQUE KEY uk_user_course_role (user_id, course_id, role),
    INDEX idx_user (user_id),
    INDEX idx_course (course_id),
    INDEX idx_role (role)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| user_id | BIGINT | NO | FK → um_users |
| course_id | BIGINT | YES | FK → ts_programs (NULL이면 테넌트 레벨 역할) |
| role | VARCHAR(20) | NO | 강의 역할 (DESIGNER, OWNER, INSTRUCTOR) |
| revenue_share_percent | INT | YES | 수익 분배 비율 (B2C OWNER: 70%) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**CourseRole Enum:**
- `DESIGNER`: 강의 설계자 (커리큘럼 구성, 콘텐츠 제작)
- `OWNER`: 강의 소유자 (B2C: 소유+강사, B2B: 소유만)
- `INSTRUCTOR`: 강사 (B2B/KPOP 전용)

**역할 부여 방식:**
- `course_id = NULL` + `DESIGNER` → B2C에서 "강의 개설하기" 클릭 시
- `course_id != NULL` + `OWNER` → 강의 승인 후
- `course_id != NULL` + `INSTRUCTOR` → B2B에서 OPERATOR가 부여

### 1.3 um_organizations (조직 - B2B 전용)

```sql
CREATE TABLE um_organizations (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id   BIGINT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    parent_id   BIGINT,
    level       INT NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_org_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id),
    CONSTRAINT fk_org_parent FOREIGN KEY (parent_id)
        REFERENCES um_organizations(id) ON DELETE CASCADE,

    INDEX idx_tenant (tenant_id),
    INDEX idx_parent (parent_id),
    INDEX idx_level (level)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | FK → tenants |
| name | VARCHAR(100) | NO | 조직명 ("개발1팀", "인사부") |
| parent_id | BIGINT | YES | FK → um_organizations (self-reference) |
| level | INT | NO | 깊이 (0: 최상위, 1: 본부, 2: 팀) |
| sort_order | INT | NO | 정렬 순서 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

### 1.4 um_refresh_tokens (리프레시 토큰)

```sql
CREATE TABLE um_refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(500) NOT NULL,
    expires_at  DATETIME(6) NOT NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id)
        REFERENCES um_users(id) ON DELETE CASCADE,

    UNIQUE KEY uk_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| user_id | BIGINT | NO | FK → um_users |
| token | VARCHAR(500) | NO | 리프레시 토큰 (unique) |
| expires_at | DATETIME(6) | NO | 만료일시 |
| created_at | DATETIME(6) | NO | 생성일시 |

---

## 2. ER 다이어그램

```
                                    ┌─────────────────┐
                                    │     tenants     │
                                    ├─────────────────┤
                                    │ id (PK)         │
                                    └────────┬────────┘
                                             │ 1:N
        ┌────────────────────────────────────┼────────────────────────────────────┐
        │                                    │                                    │
        ▼                                    ▼                                    ▼
┌───────────────────┐              ┌─────────────────────┐              ┌─────────────────┐
│  um_organizations │              │      um_users       │              │   ts_programs   │
├───────────────────┤              ├─────────────────────┤              │   (외부 참조)   │
│ id (PK)           │              │ id (PK)             │              └────────┬────────┘
│ tenant_id (FK)    │              │ tenant_id (FK)      │                       │
│ name              │◄─────────────│ organization_id(FK) │                       │
│ parent_id (FK)────┘ self-ref     │ email               │                       │
│ level             │              │ password            │                       │
│ sort_order        │              │ name                │                       │
└───────────────────┘              │ role                │                       │
                                   │ status              │                       │
                                   └──────────┬──────────┘                       │
                                              │ 1:N                              │
                                              ▼                                  │
                                   ┌─────────────────────────┐                   │
                                   │  um_user_course_roles   │                   │
                                   ├─────────────────────────┤                   │
                                   │ id (PK)                 │                   │
                                   │ user_id (FK)            │                   │
                                   │ course_id (FK) ─────────┼───────────────────┘
                                   │ role                    │
                                   │ revenue_share_percent   │
                                   └─────────────────────────┘

                                   ┌─────────────────────────┐
                                   │    um_refresh_tokens    │
                                   ├─────────────────────────┤
                                   │ id (PK)                 │
                                   │ user_id (FK) ───────────┼──► um_users
                                   │ token                   │
                                   │ expires_at              │
                                   └─────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 um_users 데이터

```sql
INSERT INTO um_users (id, tenant_id, email, password, name, phone, role, status, organization_id) VALUES
-- B2C 테넌트 (tenant_id = 1)
(1, 1, 'admin@mzc.com', '$2a$10$...', '플랫폼관리자', NULL, 'TENANT_ADMIN', 'ACTIVE', NULL),
(2, 1, 'operator@mzc.com', '$2a$10$...', '운영자', NULL, 'OPERATOR', 'ACTIVE', NULL),
(3, 1, 'instructor@example.com', '$2a$10$...', '홍길동', '010-1234-5678', 'USER', 'ACTIVE', NULL),
(4, 1, 'student@example.com', '$2a$10$...', '김학생', '010-9876-5432', 'USER', 'ACTIVE', NULL),

-- B2B 테넌트 (tenant_id = 2, 삼성)
(10, 2, 'admin@samsung.com', '$2a$10$...', '삼성관리자', NULL, 'TENANT_ADMIN', 'ACTIVE', NULL),
(11, 2, 'hr@samsung.com', '$2a$10$...', '인사담당', NULL, 'OPERATOR', 'ACTIVE', 1),
(12, 2, 'dev@samsung.com', '$2a$10$...', '개발자A', '010-1111-2222', 'USER', 'ACTIVE', 2),
(13, 2, 'dev2@samsung.com', '$2a$10$...', '개발자B', '010-3333-4444', 'USER', 'ACTIVE', 2);
```

### 3.2 um_organizations 데이터 (B2B)

```sql
INSERT INTO um_organizations (id, tenant_id, name, parent_id, level, sort_order) VALUES
-- 삼성 테넌트 (tenant_id = 2)
(1, 2, '기술본부', NULL, 0, 1),
(2, 2, '개발팀', 1, 1, 1),
(3, 2, 'QA팀', 1, 1, 2),
(4, 2, '경영지원본부', NULL, 0, 2),
(5, 2, '인사팀', 4, 1, 1);
```

결과 구조:
```
삼성전자 (tenant_id=2)
├── 기술본부 (id=1, level=0)
│   ├── 개발팀 (id=2, level=1)
│   └── QA팀 (id=3, level=1)
└── 경영지원본부 (id=4, level=0)
    └── 인사팀 (id=5, level=1)
```

### 3.3 um_user_course_roles 데이터

```sql
INSERT INTO um_user_course_roles (id, user_id, course_id, role, revenue_share_percent) VALUES
-- B2C: 홍길동이 강의 개설 버튼 클릭 → DESIGNER
(1, 3, NULL, 'DESIGNER', NULL),

-- B2C: 홍길동의 "React 기초" 강의 승인 후 → OWNER (강사겸)
(2, 3, 1, 'OWNER', 70),

-- B2B: 개발자A가 "사내교육" 강의의 INSTRUCTOR로 배정
(3, 12, 10, 'INSTRUCTOR', NULL);
```

---

## 4. 주요 쿼리

### 4.1 테넌트별 사용자 목록 조회

```sql
SELECT
    u.id, u.email, u.name, u.role, u.status,
    o.name as organization_name
FROM um_users u
LEFT JOIN um_organizations o ON u.organization_id = o.id
WHERE u.tenant_id = :tenantId
  AND u.status = 'ACTIVE'
ORDER BY u.created_at DESC;
```

### 4.2 사용자의 강의 역할 조회

```sql
SELECT
    ucr.id, ucr.role, ucr.revenue_share_percent,
    p.id as program_id, p.title as program_title
FROM um_user_course_roles ucr
LEFT JOIN ts_programs p ON ucr.course_id = p.id
WHERE ucr.user_id = :userId
ORDER BY ucr.created_at DESC;
```

### 4.3 조직 계층 구조 조회 (Recursive CTE)

```sql
WITH RECURSIVE org_hierarchy AS (
    -- Base case: 최상위 조직
    SELECT
        id, tenant_id, name, parent_id, level, sort_order,
        CAST(name AS CHAR(500)) as path
    FROM um_organizations
    WHERE tenant_id = :tenantId AND parent_id IS NULL

    UNION ALL

    -- Recursive case: 하위 조직
    SELECT
        o.id, o.tenant_id, o.name, o.parent_id, o.level, o.sort_order,
        CONCAT(oh.path, ' > ', o.name)
    FROM um_organizations o
    INNER JOIN org_hierarchy oh ON o.parent_id = oh.id
)
SELECT * FROM org_hierarchy
ORDER BY path;
```

### 4.4 조직별 사용자 수 집계

```sql
SELECT
    o.id, o.name, o.level,
    COUNT(u.id) as member_count
FROM um_organizations o
LEFT JOIN um_users u ON u.organization_id = o.id AND u.status = 'ACTIVE'
WHERE o.tenant_id = :tenantId
GROUP BY o.id, o.name, o.level
ORDER BY o.level, o.sort_order;
```

### 4.5 DESIGNER 역할 보유자 조회 (강의 미생성)

```sql
SELECT u.id, u.email, u.name, ucr.created_at as designer_since
FROM um_users u
JOIN um_user_course_roles ucr ON u.id = ucr.user_id
WHERE ucr.role = 'DESIGNER'
  AND ucr.course_id IS NULL
  AND u.tenant_id = :tenantId;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| um_users | uk_tenant_email | 테넌트 내 이메일 유니크 |
| um_users | idx_tenant | 테넌트별 사용자 조회 |
| um_users | idx_organization | 조직별 사용자 조회 |
| um_users | idx_status | 상태별 필터링 |
| um_users | idx_role | 역할별 필터링 |
| um_user_course_roles | uk_user_course_role | 중복 역할 방지 |
| um_user_course_roles | idx_user | 사용자별 역할 조회 |
| um_user_course_roles | idx_course | 강의별 역할자 조회 |
| um_organizations | idx_tenant | 테넌트별 조직 조회 |
| um_organizations | idx_parent | 부모별 자식 조회 |
| um_refresh_tokens | uk_token | 토큰 유니크 |
| um_refresh_tokens | idx_expires | 만료 토큰 정리 |

---

## 6. 제약 조건

### 6.1 조직 level 제한

```sql
-- 트리거 또는 애플리케이션에서 검증
-- level은 0~4 범위만 허용 (최대 5단계)

DELIMITER //
CREATE TRIGGER check_org_level_before_insert
BEFORE INSERT ON um_organizations
FOR EACH ROW
BEGIN
    IF NEW.level > 4 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Maximum organization level exceeded (max: 4)';
    END IF;
END//
DELIMITER ;
```

### 6.2 순환 참조 방지 (조직)

```sql
-- 애플리케이션 레벨에서 검증
-- parent_id가 자기 자신의 하위 조직을 참조하지 않도록
```

### 6.3 역할 부여 규칙 (애플리케이션)

```java
// B2C: USER가 셀프로 DESIGNER 획득 가능
// B2B: OPERATOR만 역할 부여/회수 가능
public void grantCourseRole(User targetUser, CourseRole role, Long courseId) {
    Tenant tenant = TenantContext.getCurrentTenant();

    if (tenant.getType() == TenantType.B2C) {
        // B2C: DESIGNER만 셀프 부여 가능
        if (role != CourseRole.DESIGNER) {
            throw new BusinessException("B2C에서는 DESIGNER만 직접 획득 가능합니다");
        }
    } else {
        // B2B: OPERATOR 권한 체크
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.getRole() != TenantRole.OPERATOR) {
            throw new AccessDeniedException("역할 부여는 OPERATOR만 가능합니다");
        }
    }
}
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | User API 명세 |
| [user-roles.md](../../context/user-roles.md) | 사용자 역할 및 권한 |
| [multi-tenancy.md](../../context/multi-tenancy.md) | 테넌트 분리 전략 |
| [tenant/db.md](../tenant/db.md) | Tenant DB 스키마 |
| [schedule/db.md](../schedule/db.md) | Program(강의) DB (FK 참조) |

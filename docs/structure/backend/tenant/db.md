# Tenant DB 스키마

> 테넌트 관리 모듈 데이터베이스 - 멀티테넌시 핵심 테이블

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **Tenant ↔ Branding ↔ Settings 분리** | 1:1 관계, 관심사 분리로 유지보수성 향상 |
| **subdomain + custom_domain** | 서브도메인 기본, 커스텀 도메인 선택적 지원 |
| **TenantType (B2C/B2B/KPOP)** | 테넌트 타입별 기능 분기, 동일한 코어 위에 커스터마이징 |
| **PlanType** | 요금제별 기능 제한 (사용자 수, 강의 수, 저장 용량) |

---

## 1. 테이블 구조

### 1.1 tenants (테넌트 기본)

```sql
CREATE TABLE tenants (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    plan            VARCHAR(20) NOT NULL DEFAULT 'FREE',
    subdomain       VARCHAR(50) NOT NULL,
    custom_domain   VARCHAR(255),
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_code (code),
    UNIQUE KEY uk_subdomain (subdomain),
    UNIQUE KEY uk_custom_domain (custom_domain),
    INDEX idx_type (type),
    INDEX idx_status (status)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| code | VARCHAR(50) | NO | 테넌트 코드 (unique) - "B2C_MAIN", "SAMSUNG" |
| name | VARCHAR(100) | NO | 테넌트 이름 - "MZC Learn", "삼성전자" |
| type | VARCHAR(20) | NO | 타입 (B2C, B2B, KPOP) |
| status | VARCHAR(20) | NO | 상태 (PENDING, ACTIVE, SUSPENDED, TERMINATED) |
| plan | VARCHAR(20) | NO | 요금제 (FREE, BASIC, PRO, ENTERPRISE) |
| subdomain | VARCHAR(50) | NO | 서브도메인 (unique) - "www", "samsung" |
| custom_domain | VARCHAR(255) | YES | 커스텀 도메인 (unique) - "learn.samsung.com" |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**TenantType Enum:**
- `B2C`: 메인 플랫폼 (인프런형) - 코어
- `B2B`: 기업 전용 (B2C 테넌트화)
- `KPOP`: K-Pop 특화 (B2C 테넌트화)

**TenantStatus Enum:**
- `PENDING`: 대기 (승인 전)
- `ACTIVE`: 활성
- `SUSPENDED`: 정지
- `TERMINATED`: 종료

**PlanType Enum:**
- `FREE`: 무료 (제한적)
- `BASIC`: 기본
- `PRO`: 프로
- `ENTERPRISE`: 엔터프라이즈

### 1.2 tenant_brandings (테넌트 브랜딩)

```sql
CREATE TABLE tenant_brandings (
    tenant_id           BIGINT PRIMARY KEY,
    logo_url            VARCHAR(500),
    favicon_url         VARCHAR(500),
    primary_color       VARCHAR(20) DEFAULT '#3B82F6',
    secondary_color     VARCHAR(20) DEFAULT '#000000',
    background_color    VARCHAR(20) DEFAULT '#FFFFFF',
    font_family         VARCHAR(100) DEFAULT 'Pretendard',
    platform_name       VARCHAR(100),
    course_label        VARCHAR(50) DEFAULT '강의',
    instructor_label    VARCHAR(50) DEFAULT '강사',
    student_label       VARCHAR(50) DEFAULT '수강생',
    show_footer         BOOLEAN NOT NULL DEFAULT TRUE,
    show_sidebar        BOOLEAN NOT NULL DEFAULT TRUE,
    header_style        VARCHAR(20) DEFAULT 'FULL',
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_branding_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| tenant_id | BIGINT | NO | PK, FK → tenants |
| logo_url | VARCHAR(500) | YES | 로고 이미지 URL |
| favicon_url | VARCHAR(500) | YES | 파비콘 URL |
| primary_color | VARCHAR(20) | YES | 메인 색상 (#HEX) |
| secondary_color | VARCHAR(20) | YES | 보조 색상 (#HEX) |
| background_color | VARCHAR(20) | YES | 배경 색상 (#HEX) |
| font_family | VARCHAR(100) | YES | 폰트 패밀리 |
| platform_name | VARCHAR(100) | YES | 플랫폼 표시명 ("삼성 러닝센터") |
| course_label | VARCHAR(50) | YES | 강의 라벨 ("교육과정") |
| instructor_label | VARCHAR(50) | YES | 강사 라벨 |
| student_label | VARCHAR(50) | YES | 수강생 라벨 ("학습자") |
| show_footer | BOOLEAN | NO | 푸터 표시 여부 |
| show_sidebar | BOOLEAN | NO | 사이드바 표시 여부 |
| header_style | VARCHAR(20) | YES | 헤더 스타일 (FULL, MINIMAL) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

### 1.3 tenant_settings (테넌트 설정)

```sql
CREATE TABLE tenant_settings (
    tenant_id               BIGINT PRIMARY KEY,
    enable_payment          BOOLEAN NOT NULL DEFAULT TRUE,
    enable_instructor_mode  BOOLEAN NOT NULL DEFAULT TRUE,
    enable_reviews          BOOLEAN NOT NULL DEFAULT TRUE,
    enable_certificates     BOOLEAN NOT NULL DEFAULT TRUE,
    enable_sso              BOOLEAN NOT NULL DEFAULT FALSE,
    max_users               INT,
    max_courses             INT,
    max_storage_bytes       BIGINT,
    sso_provider            VARCHAR(20),
    sso_client_id           VARCHAR(255),
    sso_tenant_id           VARCHAR(255),
    sso_client_secret       VARCHAR(500),
    created_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_settings_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| tenant_id | BIGINT | NO | PK, FK → tenants |
| enable_payment | BOOLEAN | NO | 결제 기능 활성화 |
| enable_instructor_mode | BOOLEAN | NO | 강사 등록 허용 |
| enable_reviews | BOOLEAN | NO | 리뷰 기능 활성화 |
| enable_certificates | BOOLEAN | NO | 수료증 발급 활성화 |
| enable_sso | BOOLEAN | NO | SSO 연동 활성화 |
| max_users | INT | YES | 최대 사용자 수 (NULL이면 무제한) |
| max_courses | INT | YES | 최대 강의 수 (NULL이면 무제한) |
| max_storage_bytes | BIGINT | YES | 최대 저장 용량 (bytes) |
| sso_provider | VARCHAR(20) | YES | SSO 제공자 (OKTA, AZURE_AD, GOOGLE) |
| sso_client_id | VARCHAR(255) | YES | SSO 클라이언트 ID |
| sso_tenant_id | VARCHAR(255) | YES | SSO 테넌트 ID (Azure AD) |
| sso_client_secret | VARCHAR(500) | YES | SSO 클라이언트 시크릿 (암호화) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**SsoProvider Enum:**
- `OKTA`: Okta
- `AZURE_AD`: Azure Active Directory
- `GOOGLE`: Google Workspace

---

## 2. ER 다이어그램

```
                    ┌─────────────────────────┐
                    │        tenants          │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ code (UK)               │
                    │ name                    │
                    │ type                    │
                    │ status                  │
                    │ plan                    │
                    │ subdomain (UK)          │
                    │ custom_domain (UK)      │
                    └───────────┬─────────────┘
                                │
                                │ 1:1
               ┌────────────────┴────────────────┐
               │                                 │
               ▼                                 ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│   tenant_brandings      │        │    tenant_settings      │
├─────────────────────────┤        ├─────────────────────────┤
│ tenant_id (PK, FK)      │        │ tenant_id (PK, FK)      │
│ logo_url                │        │ enable_payment          │
│ favicon_url             │        │ enable_instructor_mode  │
│ primary_color           │        │ enable_reviews          │
│ secondary_color         │        │ enable_certificates     │
│ background_color        │        │ enable_sso              │
│ font_family             │        │ max_users               │
│ platform_name           │        │ max_courses             │
│ course_label            │        │ max_storage_bytes       │
│ instructor_label        │        │ sso_provider            │
│ student_label           │        │ sso_client_id           │
│ show_footer             │        │ sso_tenant_id           │
│ show_sidebar            │        │ sso_client_secret       │
│ header_style            │        └─────────────────────────┘
└─────────────────────────┘

        ┌──────────────────────────────────────────────────────┐
        │                                                      │
        │  tenant_id를 참조하는 다른 테이블들                   │
        │                                                      │
        │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
        │  │  um_users   │  │ ts_programs │  │ ...기타     │  │
        │  │ tenant_id   │  │ tenant_id   │  │ tenant_id   │  │
        │  └─────────────┘  └─────────────┘  └─────────────┘  │
        │                                                      │
        └──────────────────────────────────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 tenants 데이터

```sql
INSERT INTO tenants (id, code, name, type, status, plan, subdomain, custom_domain) VALUES
-- B2C 메인 플랫폼 (고정)
(1, 'B2C_MAIN', 'MZC Learn', 'B2C', 'ACTIVE', 'ENTERPRISE', 'www', NULL),

-- B2B 기업 테넌트들
(2, 'SAMSUNG', '삼성전자', 'B2B', 'ACTIVE', 'ENTERPRISE', 'samsung', 'learn.samsung.com'),
(3, 'LG', 'LG전자', 'B2B', 'ACTIVE', 'PRO', 'lg', NULL),
(4, 'HYUNDAI', '현대자동차', 'B2B', 'PENDING', 'BASIC', 'hyundai', NULL),

-- KPOP 특화 플랫폼 (고정)
(100, 'KPOP_MAIN', 'K-Pop Academy', 'KPOP', 'ACTIVE', 'ENTERPRISE', 'kpop', 'kpopacademy.com');
```

### 3.2 tenant_brandings 데이터

```sql
INSERT INTO tenant_brandings (tenant_id, logo_url, primary_color, platform_name, course_label, instructor_label, student_label) VALUES
-- B2C 기본 브랜딩
(1, 'https://cdn.mzc.com/logos/mzc-learn.png', '#3B82F6', 'MZC Learn', '강의', '강사', '수강생'),

-- 삼성 브랜딩
(2, 'https://cdn.example.com/logos/samsung.png', '#1428A0', '삼성 러닝센터', '교육과정', '강사', '학습자'),

-- LG 브랜딩
(3, 'https://cdn.example.com/logos/lg.png', '#A50034', 'LG 아카데미', '교육', '강사', '임직원'),

-- KPOP 브랜딩
(100, 'https://cdn.example.com/logos/kpop.png', '#FF1493', 'K-Pop Academy', 'Program', 'Instructor', 'Student');
```

### 3.3 tenant_settings 데이터

```sql
INSERT INTO tenant_settings (tenant_id, enable_payment, enable_instructor_mode, enable_reviews, enable_certificates, enable_sso, max_users, max_courses, max_storage_bytes, sso_provider, sso_client_id, sso_tenant_id) VALUES
-- B2C: 모든 기능 활성화, 무제한
(1, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL),

-- 삼성: 결제 비활성화, SSO 활성화
(2, FALSE, TRUE, TRUE, TRUE, TRUE, 10000, 500, 107374182400, 'AZURE_AD', 'xxx-xxx-xxx', 'yyy-yyy-yyy'),

-- LG: 기본 설정
(3, FALSE, TRUE, TRUE, TRUE, FALSE, 5000, 200, 53687091200, NULL, NULL, NULL),

-- KPOP: 결제 활성화 (구독)
(100, TRUE, TRUE, TRUE, TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL);
```

---

## 4. 주요 쿼리

### 4.1 서브도메인으로 테넌트 조회

```sql
SELECT
    t.id, t.code, t.name, t.type, t.status, t.plan, t.subdomain
FROM tenants t
WHERE t.subdomain = :subdomain
  AND t.status = 'ACTIVE';
```

### 4.2 커스텀 도메인으로 테넌트 조회

```sql
SELECT
    t.id, t.code, t.name, t.type, t.status, t.plan, t.custom_domain
FROM tenants t
WHERE t.custom_domain = :customDomain
  AND t.status = 'ACTIVE';
```

### 4.3 테넌트 상세 조회 (브랜딩 + 설정 포함)

```sql
SELECT
    t.id, t.code, t.name, t.type, t.status, t.plan, t.subdomain, t.custom_domain,
    -- branding
    b.logo_url, b.favicon_url, b.primary_color, b.secondary_color,
    b.background_color, b.font_family, b.platform_name,
    b.course_label, b.instructor_label, b.student_label,
    b.show_footer, b.show_sidebar, b.header_style,
    -- settings
    s.enable_payment, s.enable_instructor_mode, s.enable_reviews,
    s.enable_certificates, s.enable_sso, s.max_users, s.max_courses,
    s.max_storage_bytes, s.sso_provider
FROM tenants t
LEFT JOIN tenant_brandings b ON t.id = b.tenant_id
LEFT JOIN tenant_settings s ON t.id = s.tenant_id
WHERE t.id = :tenantId;
```

### 4.4 테넌트 목록 조회 (통계 포함)

```sql
SELECT
    t.id, t.code, t.name, t.type, t.status, t.plan, t.subdomain,
    (SELECT COUNT(*) FROM um_users u WHERE u.tenant_id = t.id AND u.status = 'ACTIVE') as user_count,
    (SELECT COUNT(*) FROM ts_programs p WHERE p.tenant_id = t.id AND p.status = 'APPROVED') as course_count,
    t.created_at
FROM tenants t
WHERE t.status IN ('ACTIVE', 'PENDING')
ORDER BY t.created_at DESC;
```

### 4.5 요금제별 한도 체크

```sql
-- 사용자 수 한도 체크
SELECT
    t.id, t.name, s.max_users,
    (SELECT COUNT(*) FROM um_users u WHERE u.tenant_id = t.id AND u.status = 'ACTIVE') as current_users,
    CASE
        WHEN s.max_users IS NULL THEN TRUE
        WHEN (SELECT COUNT(*) FROM um_users u WHERE u.tenant_id = t.id AND u.status = 'ACTIVE') < s.max_users THEN TRUE
        ELSE FALSE
    END as can_add_user
FROM tenants t
JOIN tenant_settings s ON t.id = s.tenant_id
WHERE t.id = :tenantId;

-- 강의 수 한도 체크
SELECT
    t.id, t.name, s.max_courses,
    (SELECT COUNT(*) FROM ts_programs p WHERE p.tenant_id = t.id) as current_courses,
    CASE
        WHEN s.max_courses IS NULL THEN TRUE
        WHEN (SELECT COUNT(*) FROM ts_programs p WHERE p.tenant_id = t.id) < s.max_courses THEN TRUE
        ELSE FALSE
    END as can_add_course
FROM tenants t
JOIN tenant_settings s ON t.id = s.tenant_id
WHERE t.id = :tenantId;
```

### 4.6 테넌트별 저장 용량 사용량 조회

```sql
-- 콘텐츠 테이블에서 용량 집계 (예시)
SELECT
    t.id, t.name, s.max_storage_bytes,
    COALESCE(SUM(c.file_size_bytes), 0) as used_storage_bytes,
    CASE
        WHEN s.max_storage_bytes IS NULL THEN 100.0
        ELSE ROUND(COALESCE(SUM(c.file_size_bytes), 0) * 100.0 / s.max_storage_bytes, 2)
    END as usage_percent
FROM tenants t
JOIN tenant_settings s ON t.id = s.tenant_id
LEFT JOIN lo_contents c ON c.tenant_id = t.id
WHERE t.id = :tenantId
GROUP BY t.id, t.name, s.max_storage_bytes;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| tenants | uk_code | 코드 유니크 조회 |
| tenants | uk_subdomain | 서브도메인 유니크 조회 (가장 빈번) |
| tenants | uk_custom_domain | 커스텀 도메인 유니크 조회 |
| tenants | idx_type | 타입별 필터링 |
| tenants | idx_status | 상태별 필터링 |

---

## 6. 제약 조건

### 6.1 테넌트 생성 시 초기화 (애플리케이션)

```java
@Transactional
public Tenant createTenant(CreateTenantRequest request) {
    // 중복 체크
    if (tenantRepository.existsByCode(request.getCode())) {
        throw new BusinessException("DUPLICATE_TENANT_CODE", "이미 존재하는 테넌트 코드입니다");
    }
    if (tenantRepository.existsBySubdomain(request.getSubdomain())) {
        throw new BusinessException("DUPLICATE_SUBDOMAIN", "이미 사용 중인 서브도메인입니다");
    }

    // 테넌트 생성
    Tenant tenant = Tenant.create(request);
    tenantRepository.save(tenant);

    // 브랜딩 초기화 (기본값)
    TenantBranding branding = TenantBranding.createDefault(tenant);
    brandingRepository.save(branding);

    // 설정 초기화 (요금제별 기본값)
    TenantSettings settings = TenantSettings.createByPlan(tenant, request.getPlan());
    settingsRepository.save(settings);

    return tenant;
}
```

### 6.2 한도 체크 서비스

```java
@Service
@RequiredArgsConstructor
public class TenantLimitService {

    public void checkUserLimit(Long tenantId) {
        TenantSettings settings = settingsRepository.findByTenantId(tenantId).orElseThrow();

        if (settings.getMaxUsers() != null) {
            long currentUsers = userRepository.countByTenantIdAndStatus(tenantId, UserStatus.ACTIVE);
            if (currentUsers >= settings.getMaxUsers()) {
                throw new BusinessException("PLAN_LIMIT_EXCEEDED",
                    String.format("사용자 수 한도를 초과했습니다 (현재: %d, 한도: %d)", currentUsers, settings.getMaxUsers()));
            }
        }
    }

    public void checkCourseLimit(Long tenantId) {
        TenantSettings settings = settingsRepository.findByTenantId(tenantId).orElseThrow();

        if (settings.getMaxCourses() != null) {
            long currentCourses = programRepository.countByTenantId(tenantId);
            if (currentCourses >= settings.getMaxCourses()) {
                throw new BusinessException("PLAN_LIMIT_EXCEEDED",
                    String.format("강의 수 한도를 초과했습니다 (현재: %d, 한도: %d)", currentCourses, settings.getMaxCourses()));
            }
        }
    }

    public void checkStorageLimit(Long tenantId, long additionalBytes) {
        TenantSettings settings = settingsRepository.findByTenantId(tenantId).orElseThrow();

        if (settings.getMaxStorageBytes() != null) {
            long currentUsage = contentRepository.sumFileSizeByTenantId(tenantId);
            if (currentUsage + additionalBytes > settings.getMaxStorageBytes()) {
                throw new BusinessException("STORAGE_LIMIT_EXCEEDED",
                    "저장 용량 한도를 초과했습니다");
            }
        }
    }
}
```

### 6.3 테넌트 상태 전이 규칙

```java
public void changeStatus(Tenant tenant, TenantStatus newStatus) {
    TenantStatus current = tenant.getStatus();

    boolean valid = switch (current) {
        case PENDING -> newStatus == TenantStatus.ACTIVE || newStatus == TenantStatus.TERMINATED;
        case ACTIVE -> newStatus == TenantStatus.SUSPENDED || newStatus == TenantStatus.TERMINATED;
        case SUSPENDED -> newStatus == TenantStatus.ACTIVE || newStatus == TenantStatus.TERMINATED;
        case TERMINATED -> false;  // 종료 상태에서는 변경 불가
    };

    if (!valid) {
        throw new BusinessException("INVALID_STATUS_TRANSITION",
            String.format("%s에서 %s로 변경할 수 없습니다", current, newStatus));
    }

    tenant.changeStatus(newStatus);
}
```

---

## 7. 캐싱 전략

```java
@Service
@RequiredArgsConstructor
public class TenantCacheService {
    private final TenantRepository tenantRepository;

    private static final String CACHE_NAME = "tenants";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    @Cacheable(value = CACHE_NAME, key = "'subdomain:' + #subdomain")
    public Tenant findBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomainAndStatus(subdomain, TenantStatus.ACTIVE)
            .orElseThrow(() -> new TenantNotFoundException("subdomain: " + subdomain));
    }

    @Cacheable(value = CACHE_NAME, key = "'domain:' + #customDomain")
    public Tenant findByCustomDomain(String customDomain) {
        return tenantRepository.findByCustomDomainAndStatus(customDomain, TenantStatus.ACTIVE)
            .orElse(null);
    }

    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void evictAll() {
        // 테넌트 정보 변경 시 전체 캐시 삭제
    }
}
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Tenant API 명세 |
| [multi-tenancy.md](../../context/multi-tenancy.md) | 멀티테넌시 설계 |
| [user-roles.md](../../context/user-roles.md) | 역할 및 권한 (테넌트별 차이) |
| [user/db.md](../user/db.md) | User DB (tenant_id 참조) |
| [24-MULTI-TENANCY.md](../../conventions/24-MULTI-TENANCY.md) | 멀티테넌시 컨벤션 |

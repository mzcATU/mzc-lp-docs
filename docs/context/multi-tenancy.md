# 멀티테넌시 설계

> 테넌트 분리 전략 및 상세 설계

---

## 1. 플랫폼 관계

```
┌─────────────────────────────────────────────────────────────┐
│                    B2C (메인 러닝 플랫폼)                     │
│                      핵심 코어 시스템                         │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ 테넌트화 (브랜딩 + 커스터마이징) │
            └───────────────┬───────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────┐           ┌───────────────────────┐
│    B2B (기업용 LMS)    │           │  KPOP (K-POP 교육)   │
│  삼성, LG, 현대 등     │           │  외국인 단기 연수     │
│  기업 브랜딩 적용      │           │  스케줄/시설/피드백   │
└───────────────────────┘           └───────────────────────┘
```

> **B2C가 코어**: B2B와 KPOP은 B2C를 기반으로 테넌트화하여 각 도메인에 맞게 커스터마이징한 버전

---

## 2. 테넌트 타입

```java
public enum TenantType {
    B2C,    // 메인 플랫폼 (인프런형) - 코어
    B2B,    // 기업 전용 (B2C 테넌트화)
    KPOP    // K-Pop 특화 (B2C 테넌트화)
}
```

| 타입 | 테넌트 수 | 설명 |
|------|----------|------|
| B2C | 1개 (고정) | 메인 플랫폼, tenant_id = 1 |
| B2B | N개 (동적) | 기업별 생성, tenant_id = 2, 3, 4... |
| KPOP | 1개 (고정) | K-Pop 전용, tenant_id = 별도 |

---

## 3. 테넌트 Entity 구조

### 3.1 Tenant (테넌트 기본)

```java
@Entity
@Table(name = "tenants")
public class Tenant extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;              // "B2C_MAIN", "SAMSUNG", "KPOP_MAIN"

    @Column(nullable = false, length = 100)
    private String name;              // "MZC Learn", "삼성전자", "K-Pop Academy"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantType type;          // B2C, B2B, KPOP

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status;      // ACTIVE, SUSPENDED, TERMINATED

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanType plan;            // FREE, BASIC, PRO, ENTERPRISE

    @Column(unique = true, length = 50)
    private String subdomain;         // "samsung" → samsung.learn.mzc.com

    @Column(length = 255)
    private String customDomain;      // "learn.samsung.com" (선택)

    // 정적 팩토리 메서드
    public static Tenant createB2C() {
        Tenant tenant = new Tenant();
        tenant.code = "B2C_MAIN";
        tenant.name = "MZC Learn";
        tenant.type = TenantType.B2C;
        tenant.status = TenantStatus.ACTIVE;
        tenant.plan = PlanType.ENTERPRISE;
        tenant.subdomain = "www";
        return tenant;
    }

    public static Tenant createB2B(String code, String name, String subdomain) {
        Tenant tenant = new Tenant();
        tenant.code = code;
        tenant.name = name;
        tenant.type = TenantType.B2B;
        tenant.status = TenantStatus.PENDING;
        tenant.plan = PlanType.BASIC;
        tenant.subdomain = subdomain;
        return tenant;
    }
}
```

### 3.2 TenantBranding (B2B 브랜딩)

```java
@Entity
@Table(name = "tenant_brandings")
public class TenantBranding {

    @Id
    private Long tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    // 비주얼 브랜딩
    private String logoUrl;
    private String faviconUrl;
    private String primaryColor;       // "#3B82F6"
    private String secondaryColor;
    private String backgroundColor;
    private String fontFamily;

    // 텍스트 커스터마이징
    private String platformName;       // "삼성 러닝센터"
    private String courseLabel;        // "교육과정"
    private String instructorLabel;    // "강사"
    private String studentLabel;       // "학습자"

    // 레이아웃
    private boolean showFooter;
    private boolean showSidebar;
    private String headerStyle;        // "FULL", "MINIMAL"
}
```

### 3.3 TenantSettings (테넌트 설정)

```java
@Entity
@Table(name = "tenant_settings")
public class TenantSettings {

    @Id
    private Long tenantId;

    // 기능 활성화
    private boolean enablePayment;         // 결제 기능
    private boolean enableInstructorMode;  // 강사 등록 허용
    private boolean enableReviews;         // 리뷰 기능
    private boolean enableCertificates;    // 수료증 발급
    private boolean enableSso;             // SSO 연동

    // 제한
    private Integer maxUsers;              // 최대 사용자 수
    private Integer maxCourses;            // 최대 강의 수
    private Long maxStorageBytes;          // 저장 용량

    // SSO 설정 (B2B)
    private String ssoProvider;            // "OKTA", "AZURE_AD", "GOOGLE"
    private String ssoClientId;
    private String ssoTenantId;
}
```

---

## 4. 테넌트 식별 흐름

### 4.1 요청 → 테넌트 매핑

```
1. samsung.learn.mzc.com/api/courses
   └─ subdomain: "samsung"
   └─ tenant_id: 2 (SAMSUNG)

2. www.learn.mzc.com/api/courses
   └─ subdomain: "www"
   └─ tenant_id: 1 (B2C_MAIN)

3. learn.samsung.com/api/courses (커스텀 도메인)
   └─ custom_domain: "learn.samsung.com"
   └─ tenant_id: 2 (SAMSUNG)

4. kpop.mzc.com/api/courses
   └─ subdomain: "kpop" 또는 별도 도메인
   └─ tenant_id: 100 (KPOP_MAIN)
```

### 4.2 TenantResolver 구현

```java
@Component
@RequiredArgsConstructor
public class TenantResolver {
    private final TenantRepository tenantRepository;
    private final TenantCacheService cacheService;

    public Tenant resolve(HttpServletRequest request) {
        String host = request.getServerName();

        // 1. 커스텀 도메인 체크
        Tenant tenant = cacheService.findByCustomDomain(host);
        if (tenant != null) return tenant;

        // 2. 서브도메인 추출
        String subdomain = extractSubdomain(host);

        // 3. 서브도메인으로 테넌트 조회
        return cacheService.findBySubdomain(subdomain);
    }

    private String extractSubdomain(String host) {
        // samsung.learn.mzc.com → samsung
        // www.learn.mzc.com → www
        // learn.mzc.com → www (기본값)
        String[] parts = host.split("\\.");
        if (parts.length >= 3) {
            return parts[0];
        }
        return "www";
    }
}
```

---

## 5. 데이터 격리

### 5.1 TenantEntity 기본 클래스

```java
@MappedSuperclass
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = Long.class)
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class TenantEntity extends BaseTimeEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @PrePersist
    protected void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getTenantId();
        }
    }

    // Setter 없음 - 테넌트 변경 불가
}
```

### 5.2 테넌트별 Entity 분류

```
TenantEntity 상속 (tenant_id 필수)
├── User
├── Course
├── Curriculum
├── Enrollment
├── Progress
├── Review
├── Certificate
└── Organization (B2B 전용)

BaseTimeEntity 상속 (tenant_id 없음)
├── Tenant
├── TenantBranding
├── TenantSettings
└── SystemConfig
```

---

## 6. 사이트별 기능 분기

### 6.1 기능 매트릭스

| 기능 | B2C | B2B | KPOP |
|------|-----|-----|------|
| **강의 개설 진입** | USER 셀프 (버튼 클릭) | OPERATOR 부여 | OPERATOR만 |
| **DESIGNER 부여** | 셀프 (버튼 클릭) | OPERATOR | OPERATOR |
| **INSTRUCTOR** | ❌ (OWNER=강사) | ✅ OPERATOR 부여 | ✅ OPERATOR 부여 |
| **역할 회수** | ❌ | ✅ OPERATOR | ✅ OPERATOR |
| 개인 결제 | O | X | O |
| 기업 결제 | X | O | X |
| 조직 관리 | X | O | X |
| 스케줄/시설 관리 | X | X | O |
| 팀 구성/채팅 | X | X | O |
| 영상 피드백 | X | X | O |
| 대시보드 | 개인 | 조직+전사 | 개인 |
| 브랜딩 | X | O | O (고정) |
| 리뷰 | O | 선택 | O |
| 수료증 | O | O | O |
| SSO | X | O | X |

### 6.2 역할 부여 방식 비교

| | B2C | B2B |
|---|---|---|
| **모델** | 셀프 서비스 | 관리자 통제 |
| **DESIGNER 부여** | "강의 개설하기" 버튼 클릭 | OPERATOR가 유저 목록에서 부여 |
| **OWNER 부여** | 개설 신청 승인 후 | 개설 신청 승인 후 |
| **INSTRUCTOR** | ❌ 없음 (OWNER = 강사) | ✅ OPERATOR가 부여 |
| **역할 회수** | ❌ (본인 판단) | ✅ OPERATOR가 회수 가능 |
| **일반 유저 UI** | "강의 개설하기" 버튼 보임 | 역할 부여 전 버튼 안 보임 |

### 6.3 기능 체크 서비스

```java
@Service
@RequiredArgsConstructor
public class FeatureService {

    public boolean isEnabled(Feature feature) {
        Tenant tenant = TenantContext.getCurrentTenant();
        TenantSettings settings = tenant.getSettings();

        return switch (feature) {
            case PAYMENT -> settings.isEnablePayment();
            case INSTRUCTOR_MODE -> settings.isEnableInstructorMode();
            case REVIEWS -> settings.isEnableReviews();
            case SSO -> settings.isEnableSso();
            case ORGANIZATION -> tenant.getType() == TenantType.B2B;
            case SUBSCRIPTION -> tenant.getType() == TenantType.KPOP;
        };
    }

    public void requireFeature(Feature feature) {
        if (!isEnabled(feature)) {
            throw new FeatureDisabledException(feature);
        }
    }
}

// Controller에서 사용
@PostMapping("/instructors/apply")
public void applyInstructor() {
    featureService.requireFeature(Feature.INSTRUCTOR_MODE);
    // ...
}
```

---

## 7. B2C 강의 → B2B 공유

### 7.1 강의 라이선스 모델

```java
@Entity
public class CourseLicense extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Course course;            // B2C 원본 강의

    @ManyToOne(fetch = FetchType.LAZY)
    private Tenant licensedTenant;    // 라이선스 받은 B2B 테넌트

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxEnrollments;   // 최대 수강 인원
    private Integer currentEnrollments;

    @Enumerated(EnumType.STRING)
    private LicenseStatus status;     // ACTIVE, EXPIRED, REVOKED
}
```

### 7.2 강의 조회 로직

```java
@Service
public class CourseQueryService {

    public List<Course> findAvailableCourses(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();

        if (tenant.getType() == TenantType.B2C) {
            // B2C: 공개 강의만
            return courseRepository.findByVisibility(CourseVisibility.PUBLIC);
        }

        // B2B: 자체 강의 + 라이선스 강의
        List<Course> ownCourses = courseRepository.findByTenantId(tenantId);
        List<Course> licensedCourses = courseLicenseRepository
            .findActiveLicensedCourses(tenantId);

        return Stream.concat(ownCourses.stream(), licensedCourses.stream())
            .distinct()
            .toList();
    }
}
```

---

## 8. 테넌트 생성 프로세스 (B2B)

```
1. 기업 신청 (웹 폼 또는 영업팀)
       │
       ▼
2. Tenant 생성 (status: PENDING)
       │
       ▼
3. 관리자 승인
       │
       ▼
4. 초기 설정
   ├─ TenantBranding 생성
   ├─ TenantSettings 생성
   ├─ 관리자 계정 생성
   └─ 기본 권한 설정
       │
       ▼
5. 활성화 (status: ACTIVE)
       │
       ▼
6. 서브도메인 DNS 설정
   (samsung.learn.mzc.com)
```

---

## 9. 캐싱 전략

```java
@Service
@RequiredArgsConstructor
public class TenantCacheService {
    private final TenantRepository tenantRepository;
    private final RedisTemplate<String, Tenant> redisTemplate;

    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    @Cacheable(value = "tenants", key = "#subdomain")
    public Tenant findBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomain(subdomain)
            .orElseThrow(() -> new TenantNotFoundException(subdomain));
    }

    @CacheEvict(value = "tenants", key = "#tenant.subdomain")
    public void evict(Tenant tenant) {
        // 테넌트 정보 변경 시 캐시 삭제
    }
}
```

---

## 10. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [user-roles.md](./user-roles.md) | 사용자 역할 및 권한 |
| [24-MULTI-TENANCY.md](../conventions/24-MULTI-TENANCY.md) | 구현 컨벤션 |

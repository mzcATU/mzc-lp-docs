# Tenant Infrastructure 구축

> 작성자: 신동구
> 작성일: 2025-12-15
> 관련 이슈: #32
> 브랜치: refactor/tenant-infrastructure

## 개요

멀티테넌시 지원을 위한 Tenant Context 인프라를 구축했습니다. 이 작업은 모든 엔티티가 tenant_id를 기준으로 데이터를 격리할 수 있도록 하는 기반 작업입니다.

## 구현 내용

### 1. TenantContext (ThreadLocal 기반)

**파일**: `common/context/TenantContext.java`

```java
public class TenantContext {
    private static final ThreadLocal<Long> currentTenant = new ThreadLocal<>();

    public static void setTenantId(Long tenantId);
    public static Long getCurrentTenantId();
    public static Long getCurrentTenantIdOrNull();
    public static boolean isSet();
    public static void clear();
}
```

- 요청별로 현재 테넌트 ID를 저장/조회
- ThreadLocal 기반으로 스레드 안전성 보장
- 메모리 릭 방지를 위해 요청 종료 시 `clear()` 필수

### 2. TenantFilter (Servlet Filter)

**파일**: `common/filter/TenantFilter.java`

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TenantFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        boolean wasAlreadySet = TenantContext.isSet();

        try {
            if (!wasAlreadySet) {
                Long tenantId = extractTenantIdFromRequest(httpRequest);
                TenantContext.setTenantId(tenantId != null ? tenantId : 1L);
            }
            chain.doFilter(request, response);
        } finally {
            if (!wasAlreadySet) {
                TenantContext.clear();
            }
        }
    }
}
```

**주요 특징**:
- 기존 TenantContext 보존 로직 추가 (테스트 환경 호환)
- JWT에서 tenantId 추출 준비 (TODO)
- 기본 테넌트 ID: 1L (임시)

### 3. TenantEntity (베이스 클래스)

**파일**: `common/entity/TenantEntity.java`

```java
@Getter
@MappedSuperclass
@FilterDef(
    name = "tenantFilter",
    parameters = @ParamDef(name = "tenantId", type = Long.class),
    defaultCondition = "tenant_id = :tenantId"
)
@Filter(name = "tenantFilter")
public abstract class TenantEntity extends BaseTimeEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @PrePersist
    protected void prePersistTenant() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getCurrentTenantId();
        }
    }
}
```

**주요 특징**:
- `@PrePersist`로 저장 시 tenant_id 자동 주입
- Hibernate `@FilterDef`, `@Filter`로 조회 시 자동 필터링 준비
- 모든 테넌트 종속 엔티티는 이 클래스를 상속

### 4. TenantFilterConfig (AOP)

**파일**: `common/config/TenantFilterConfig.java`

```java
@Aspect
@Component
public class TenantFilterConfig {

    private final EntityManager entityManager;

    @Before("execution(* org.springframework.data.jpa.repository.JpaRepository+.*(..))")
    public void enableTenantFilter() {
        if (TenantContext.isSet()) {
            Long tenantId = TenantContext.getCurrentTenantId();
            Session session = entityManager.unwrap(Session.class);

            if (session.getEnabledFilter("tenantFilter") == null) {
                session.enableFilter("tenantFilter")
                    .setParameter("tenantId", tenantId);
            }
        }
    }
}
```

**주요 특징**:
- JpaRepository 메서드 호출 전 Hibernate Filter 자동 활성화
- TenantContext에서 tenantId를 가져와 필터 파라미터 설정

### 5. TenantTestSupport (테스트 지원)

**파일**: `test/common/support/TenantTestSupport.java`

```java
public abstract class TenantTestSupport {
    protected static final Long DEFAULT_TENANT_ID = 1L;

    @BeforeEach
    protected void setUpTenantContext() {
        TenantContext.setTenantId(DEFAULT_TENANT_ID);
    }

    @AfterEach
    protected void tearDownTenantContext() {
        TenantContext.clear();
    }

    protected void switchTenant(Long tenantId) {
        TenantContext.clear();
        TenantContext.setTenantId(tenantId);
    }
}
```

**주요 특징**:
- 테스트 클래스에서 상속하여 사용
- `protected` 접근제한자로 다른 패키지에서 상속 가능
- `switchTenant()` 메서드로 멀티테넌시 테스트 지원

## 해결한 문제

### 문제: 테스트 실패 (TenantNotFoundException)

**원인**:
1. `TenantTestSupport.setUpTenantContext()`가 package-private이어서 다른 패키지의 테스트 클래스에서 호출되지 않음
2. `TenantFilter.doFilter()`의 finally 블록에서 테스트가 설정한 TenantContext를 삭제

**해결**:
1. `@BeforeEach` 메서드를 `protected`로 변경
2. TenantFilter에 기존 컨텍스트 보존 로직 추가 (`wasAlreadySet` 플래그)

## 테스트 결과

- 전체 통합 테스트: 273개 통과
- MySQL 8.0.36 연결 테스트: 성공
- 서버 기동 테스트: 성공

## 다음 작업

- [ ] JWT에서 tenantId 추출 연동
- [ ] Tenant 도메인 엔티티 구현 (#29)
- [ ] Tenant CRUD API 구현 (#34)

## 변경 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `common/context/TenantContext.java` | 기존 | ThreadLocal 기반 컨텍스트 |
| `common/filter/TenantFilter.java` | 수정 | 기존 컨텍스트 보존 로직 추가 |
| `common/entity/TenantEntity.java` | 수정 | @FilterDef, @Filter 추가 |
| `common/config/TenantFilterConfig.java` | 신규 | AOP 기반 필터 활성화 |
| `common/config/SecurityConfig.java` | 수정 | CORS 설정 추가 |
| `test/common/support/TenantTestSupport.java` | 수정 | protected 접근제한자 |

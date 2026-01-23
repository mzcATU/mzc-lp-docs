# Tenant Entity 및 도메인 설계

> 작성자: 신동구
> 작성일: 2025-12-16
> 관련 이슈: #29
> 관련 PR: #72

## 개요

Tenant 마스터 테이블 및 도메인 레이어를 구현했습니다. B2C, B2B, KPOP 테넌트 유형을 지원하며, 테넌트별 상태 및 요금제를 관리합니다.

## 구현 내용

### 1. Tenant Entity

**파일**: `domain/tenant/entity/Tenant.java`

```java
@Entity
@Table(name = "tenants", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"code"}),
    @UniqueConstraint(columnNames = {"subdomain"}),
    @UniqueConstraint(columnNames = {"custom_domain"})
})
public class Tenant extends BaseTimeEntity {

    private String code;           // 테넌트 고유 코드
    private String name;           // 테넌트 이름
    private TenantType type;       // B2C, B2B, KPOP
    private TenantStatus status;   // PENDING, ACTIVE, SUSPENDED, TERMINATED
    private PlanType plan;         // FREE, BASIC, PRO, ENTERPRISE
    private String subdomain;      // 서브도메인
    private String customDomain;   // 커스텀 도메인 (선택)
}
```

**주요 특징**:
- `BaseTimeEntity` 상속 (TenantEntity 아님)
- 테넌트 마스터 테이블이므로 tenant_id 필터링 불필요
- code, subdomain, customDomain 유니크 제약

### 2. TenantType Enum

**파일**: `domain/tenant/constant/TenantType.java`

```java
public enum TenantType {
    B2C,    // 개인 고객용 (인프런형)
    B2B,    // 기업 고객용 (기업 LMS)
    KPOP    // K-POP 교육 특화
}
```

### 3. TenantStatus Enum

**파일**: `domain/tenant/constant/TenantStatus.java`

```java
public enum TenantStatus {
    PENDING,     // 대기 (생성 직후)
    ACTIVE,      // 활성
    SUSPENDED,   // 정지
    TERMINATED   // 종료
}
```

**상태 전이**:
```
PENDING → ACTIVE (활성화)
ACTIVE → SUSPENDED (정지)
SUSPENDED → ACTIVE (재활성화)
ACTIVE/SUSPENDED → TERMINATED (종료)
```

### 4. PlanType Enum

**파일**: `domain/tenant/constant/PlanType.java`

```java
public enum PlanType {
    FREE,       // 무료 (제한적)
    BASIC,      // 기본
    PRO,        // 프로
    ENTERPRISE  // 엔터프라이즈
}
```

### 5. TenantRepository

**파일**: `domain/tenant/repository/TenantRepository.java`

```java
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByCode(String code);
    Optional<Tenant> findBySubdomain(String subdomain);
    Optional<Tenant> findByCustomDomain(String customDomain);
    boolean existsByCode(String code);
    boolean existsBySubdomain(String subdomain);
    boolean existsByCustomDomain(String customDomain);
    Page<Tenant> findByNameContaining(String keyword, Pageable pageable);
}
```

### 6. Request/Response DTO

**CreateTenantRequest.java**:
```java
public record CreateTenantRequest(
    @NotBlank String code,
    @NotBlank String name,
    @NotNull TenantType type,
    @NotBlank String subdomain,
    PlanType plan,
    String customDomain
) {}
```

**TenantResponse.java**:
```java
public record TenantResponse(
    Long id,
    String code,
    String name,
    String type,
    String status,
    String plan,
    String subdomain,
    String customDomain,
    Instant createdAt,
    Instant updatedAt
) {
    public static TenantResponse from(Tenant tenant);
}
```

## 테스트

### TenantTest (Entity 테스트)

| 테스트 | 설명 |
|--------|------|
| create_success | 테넌트 생성 성공 |
| create_withCustomDomain | 커스텀 도메인 포함 생성 |
| activate_success | PENDING → ACTIVE |
| suspend_success | ACTIVE → SUSPENDED |
| terminate_success | ACTIVE → TERMINATED |
| status_check_methods | isActive, isPending 등 확인 |

### TenantRepositoryTest

| 테스트 | 설명 |
|--------|------|
| findByCode_success | 코드로 테넌트 조회 |
| findBySubdomain_success | 서브도메인으로 조회 |
| existsByCode_true | 코드 존재 여부 확인 |
| findByNameContaining | 키워드 검색 |

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `domain/tenant/entity/Tenant.java` | 신규 |
| `domain/tenant/constant/TenantType.java` | 신규 |
| `domain/tenant/constant/TenantStatus.java` | 신규 |
| `domain/tenant/constant/PlanType.java` | 신규 |
| `domain/tenant/repository/TenantRepository.java` | 신규 |
| `domain/tenant/dto/request/CreateTenantRequest.java` | 신규 |
| `domain/tenant/dto/request/UpdateTenantRequest.java` | 신규 |
| `domain/tenant/dto/response/TenantResponse.java` | 신규 |
| `test/domain/tenant/entity/TenantTest.java` | 신규 |
| `test/domain/tenant/repository/TenantRepositoryTest.java` | 신규 |

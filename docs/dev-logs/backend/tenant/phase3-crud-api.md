# Tenant CRUD API 구현

> 작성자: 신동구
> 작성일: 2025-12-16
> 관련 이슈: #34
> 관련 PR: #74

## 개요

시스템 관리자(SYSTEM_ADMIN)가 테넌트를 관리할 수 있는 CRUD API를 구현했습니다.

## API 스펙

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/tenants` | 테넌트 생성 | SYSTEM_ADMIN |
| GET | `/api/tenants` | 테넌트 목록 조회 (페이징) | SYSTEM_ADMIN |
| GET | `/api/tenants/{tenantId}` | 테넌트 상세 조회 | SYSTEM_ADMIN |
| PUT | `/api/tenants/{tenantId}` | 테넌트 수정 | SYSTEM_ADMIN |
| DELETE | `/api/tenants/{tenantId}` | 테넌트 삭제 | SYSTEM_ADMIN |
| PATCH | `/api/tenants/{tenantId}/status` | 상태 변경 | SYSTEM_ADMIN |
| GET | `/api/tenants/code/{code}` | 코드로 조회 | SYSTEM_ADMIN |

## 구현 내용

### 1. TenantService 인터페이스

**파일**: `domain/tenant/service/TenantService.java`

```java
public interface TenantService {
    TenantResponse createTenant(CreateTenantRequest request);
    Page<TenantResponse> getTenants(String keyword, Pageable pageable);
    TenantResponse getTenant(Long tenantId);
    TenantResponse getTenantByCode(String code);
    TenantResponse updateTenant(Long tenantId, UpdateTenantRequest request);
    TenantResponse updateTenantStatus(Long tenantId, UpdateTenantStatusRequest request);
    void deleteTenant(Long tenantId);
}
```

### 2. TenantServiceImpl 구현체

**파일**: `domain/tenant/service/TenantServiceImpl.java`

**주요 로직**:
- 중복 검증 (code, subdomain, customDomain)
- 상태 전이 검증
- 트랜잭션 관리

```java
@Override
@Transactional
public TenantResponse createTenant(CreateTenantRequest request) {
    // 중복 검증
    if (tenantRepository.existsByCode(request.code())) {
        throw new DuplicateTenantCodeException(request.code());
    }
    if (tenantRepository.existsBySubdomain(request.subdomain())) {
        throw new DuplicateSubdomainException(request.subdomain());
    }
    if (request.customDomain() != null &&
        tenantRepository.existsByCustomDomain(request.customDomain())) {
        throw new DuplicateCustomDomainException(request.customDomain());
    }

    Tenant tenant = Tenant.create(...);
    return TenantResponse.from(tenantRepository.save(tenant));
}
```

### 3. TenantController

**파일**: `domain/tenant/controller/TenantController.java`

```java
@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> createTenant(
            @Valid @RequestBody CreateTenantRequest request) {
        TenantResponse response = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    // ... 나머지 API
}
```

### 4. SYSTEM_ADMIN 역할 추가

**파일**: `domain/user/constant/TenantRole.java`

```java
public enum TenantRole {
    SYSTEM_ADMIN,   // 시스템 최고 관리자 (테넌트 관리)
    TENANT_ADMIN,   // 테넌트 최고 관리자
    OPERATOR,       // 운영자
    USER            // 일반 사용자
}
```

### 5. Exception 클래스

| Exception | 설명 | HTTP 상태 |
|-----------|------|----------|
| TenantDomainNotFoundException | 테넌트 없음 | 404 |
| DuplicateTenantCodeException | 코드 중복 | 409 |
| DuplicateSubdomainException | 서브도메인 중복 | 409 |
| DuplicateCustomDomainException | 커스텀 도메인 중복 | 409 |
| InvalidTenantStatusException | 잘못된 상태 전이 | 400 |

### 6. ErrorCode 추가

**파일**: `common/constant/ErrorCode.java`

```java
// Tenant (TN)
TENANT_NOT_FOUND(HttpStatus.NOT_FOUND, "TN001", "Tenant not found"),
DUPLICATE_TENANT_CODE(HttpStatus.CONFLICT, "TN002", "Tenant code already exists"),
DUPLICATE_SUBDOMAIN(HttpStatus.CONFLICT, "TN003", "Subdomain already exists"),
DUPLICATE_CUSTOM_DOMAIN(HttpStatus.CONFLICT, "TN004", "Custom domain already exists"),
INVALID_TENANT_STATUS(HttpStatus.BAD_REQUEST, "TN005", "Invalid tenant status transition");
```

## 테스트

### TenantControllerTest

| 테스트 | 설명 |
|--------|------|
| createTenant_success | 테넌트 생성 성공 |
| createTenant_fail_duplicateCode | 코드 중복 시 409 |
| createTenant_fail_duplicateSubdomain | 서브도메인 중복 시 409 |
| getTenants_success | 목록 조회 (페이징) |
| getTenants_success_withKeyword | 키워드 검색 |
| getTenant_success | 상세 조회 |
| getTenant_fail_notFound | 없는 테넌트 조회 시 404 |
| updateTenant_success | 테넌트 수정 |
| updateTenantStatus_success | 상태 변경 |
| deleteTenant_success | 테넌트 삭제 |

## 사용 예시

### 테넌트 생성

```bash
POST /api/tenants
Authorization: Bearer {SYSTEM_ADMIN_TOKEN}
Content-Type: application/json

{
  "code": "acme",
  "name": "ACME Corporation",
  "type": "B2B",
  "subdomain": "acme",
  "plan": "PRO",
  "customDomain": "learn.acme.com"
}
```

### 테넌트 상태 변경

```bash
PATCH /api/tenants/1/status
Authorization: Bearer {SYSTEM_ADMIN_TOKEN}
Content-Type: application/json

{
  "status": "ACTIVE"
}
```

## 변경 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `domain/tenant/service/TenantService.java` | 신규 |
| `domain/tenant/service/TenantServiceImpl.java` | 신규 |
| `domain/tenant/controller/TenantController.java` | 신규 |
| `domain/tenant/dto/request/UpdateTenantStatusRequest.java` | 신규 |
| `domain/tenant/exception/*.java` | 신규 (5개) |
| `domain/user/constant/TenantRole.java` | 수정 |
| `common/constant/ErrorCode.java` | 수정 |
| `test/domain/tenant/controller/TenantControllerTest.java` | 신규 |

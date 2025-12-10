# Tenant API 명세

> 테넌트 관리 모듈 API (SUPER_ADMIN / TENANT_ADMIN)

---

## 1. 테넌트 관리 API (SUPER_ADMIN)

### 1.1 테넌트 생성

```http
POST /api/tenants
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "code": "SAMSUNG",
  "name": "삼성전자",
  "type": "B2B",
  "subdomain": "samsung",
  "plan": "ENTERPRISE"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | String | O | 테넌트 코드 (unique) |
| name | String | O | 테넌트 이름 |
| type | String | O | 타입 (B2C, B2B, KPOP) |
| subdomain | String | O | 서브도메인 (unique) |
| plan | String | X | 요금제 (FREE, BASIC, PRO, ENTERPRISE) |
| customDomain | String | X | 커스텀 도메인 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "code": "SAMSUNG",
    "name": "삼성전자",
    "type": "B2B",
    "subdomain": "samsung",
    "status": "PENDING",
    "plan": "ENTERPRISE",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 1.2 테넌트 목록 조회

```http
GET /api/tenants
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| type | String | X | 타입 필터 (B2C, B2B, KPOP) |
| status | String | X | 상태 필터 (ACTIVE, PENDING, SUSPENDED) |
| keyword | String | X | 이름/코드 검색 |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "tenantId": 1,
        "code": "B2C_MAIN",
        "name": "MZC Learn",
        "type": "B2C",
        "subdomain": "www",
        "status": "ACTIVE",
        "plan": "ENTERPRISE",
        "userCount": 10000,
        "courseCount": 500,
        "createdAt": "2025-01-01T00:00:00"
      },
      {
        "tenantId": 2,
        "code": "SAMSUNG",
        "name": "삼성전자",
        "type": "B2B",
        "subdomain": "samsung",
        "status": "ACTIVE",
        "plan": "ENTERPRISE",
        "userCount": 5000,
        "courseCount": 100,
        "createdAt": "2025-01-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 10,
    "totalPages": 1
  }
}
```

### 1.3 테넌트 상세 조회

```http
GET /api/tenants/{tenantId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "code": "SAMSUNG",
    "name": "삼성전자",
    "type": "B2B",
    "subdomain": "samsung",
    "customDomain": "learn.samsung.com",
    "status": "ACTIVE",
    "plan": "ENTERPRISE",
    "branding": {
      "logoUrl": "https://cdn.example.com/logos/samsung.png",
      "faviconUrl": "https://cdn.example.com/favicons/samsung.ico",
      "primaryColor": "#1428A0",
      "platformName": "삼성 러닝센터"
    },
    "settings": {
      "enablePayment": false,
      "enableInstructorMode": true,
      "enableReviews": true,
      "enableCertificates": true,
      "enableSso": true,
      "maxUsers": 10000,
      "maxCourses": 500,
      "maxStorageBytes": 107374182400
    },
    "stats": {
      "userCount": 5000,
      "courseCount": 100,
      "enrollmentCount": 25000,
      "storageUsedBytes": 53687091200
    },
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 1.4 테넌트 수정

```http
PUT /api/tenants/{tenantId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "삼성전자 러닝센터",
  "customDomain": "learn.samsung.com",
  "plan": "ENTERPRISE"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "name": "삼성전자 러닝센터",
    "customDomain": "learn.samsung.com",
    "plan": "ENTERPRISE",
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 1.5 테넌트 상태 변경

```http
PUT /api/tenants/{tenantId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "결제 미납"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | String | O | 상태 (ACTIVE, SUSPENDED, TERMINATED) |
| reason | String | X | 변경 사유 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "status": "SUSPENDED",
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 1.6 테넌트 삭제

```http
DELETE /api/tenants/{tenantId}
Authorization: Bearer {accessToken}
```

> 테넌트 삭제는 status를 TERMINATED로 변경 (소프트 삭제)

**Response** (`204 No Content`)

---

## 2. 브랜딩 API (TENANT_ADMIN)

### 2.1 브랜딩 조회

```http
GET /api/tenants/{tenantId}/branding
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "logoUrl": "https://cdn.example.com/logos/samsung.png",
    "faviconUrl": "https://cdn.example.com/favicons/samsung.ico",
    "primaryColor": "#1428A0",
    "secondaryColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "fontFamily": "Noto Sans KR",
    "platformName": "삼성 러닝센터",
    "courseLabel": "교육과정",
    "instructorLabel": "강사",
    "studentLabel": "학습자",
    "showFooter": true,
    "showSidebar": true,
    "headerStyle": "FULL"
  }
}
```

### 2.2 브랜딩 수정

```http
PUT /api/tenants/{tenantId}/branding
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "logoUrl": "https://cdn.example.com/logos/samsung-new.png",
  "primaryColor": "#1428A0",
  "secondaryColor": "#000000",
  "platformName": "삼성 러닝센터",
  "courseLabel": "교육과정",
  "showFooter": true,
  "headerStyle": "MINIMAL"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "logoUrl": "https://cdn.example.com/logos/samsung-new.png",
    "primaryColor": "#1428A0",
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

---

## 3. 설정 API (TENANT_ADMIN)

### 3.1 설정 조회

```http
GET /api/tenants/{tenantId}/settings
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "enablePayment": false,
    "enableInstructorMode": true,
    "enableReviews": true,
    "enableCertificates": true,
    "enableSso": true,
    "maxUsers": 10000,
    "maxCourses": 500,
    "maxStorageBytes": 107374182400,
    "ssoProvider": "AZURE_AD",
    "ssoClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "ssoTenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### 3.2 설정 수정

```http
PUT /api/tenants/{tenantId}/settings
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "enableReviews": false,
  "enableCertificates": true
}
```

> 일부 설정(maxUsers, maxCourses 등)은 SUPER_ADMIN만 수정 가능

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "enableReviews": false,
    "enableCertificates": true,
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 3.3 SSO 설정 (SUPER_ADMIN)

```http
PUT /api/tenants/{tenantId}/settings/sso
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "enableSso": true,
  "ssoProvider": "AZURE_AD",
  "ssoClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ssoTenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ssoClientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| enableSso | Boolean | O | SSO 활성화 |
| ssoProvider | String | O | 제공자 (OKTA, AZURE_AD, GOOGLE) |
| ssoClientId | String | O | 클라이언트 ID |
| ssoTenantId | String | X | 테넌트 ID (Azure AD) |
| ssoClientSecret | String | O | 클라이언트 시크릿 |

---

## 4. 현재 테넌트 API

### 4.1 현재 테넌트 정보 조회

```http
GET /api/tenant
```

> 서브도메인/커스텀 도메인 기반으로 현재 테넌트 정보 반환 (인증 불필요)

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "tenantId": 2,
    "code": "SAMSUNG",
    "name": "삼성전자",
    "type": "B2B",
    "branding": {
      "logoUrl": "https://cdn.example.com/logos/samsung.png",
      "primaryColor": "#1428A0",
      "platformName": "삼성 러닝센터"
    },
    "features": {
      "enablePayment": false,
      "enableInstructorMode": true,
      "enableReviews": true,
      "enableSso": true
    }
  }
}
```

---

## 5. 에러 응답

### 공통 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "테넌트를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| TENANT_NOT_FOUND | 404 | 테넌트 없음 |
| DUPLICATE_TENANT_CODE | 400 | 테넌트 코드 중복 |
| DUPLICATE_SUBDOMAIN | 400 | 서브도메인 중복 |
| DUPLICATE_CUSTOM_DOMAIN | 400 | 커스텀 도메인 중복 |
| TENANT_SUSPENDED | 403 | 정지된 테넌트 |
| TENANT_TERMINATED | 403 | 종료된 테넌트 |
| PLAN_LIMIT_EXCEEDED | 400 | 요금제 한도 초과 |
| INVALID_SSO_CONFIG | 400 | 잘못된 SSO 설정 |

---

## 6. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/tenant/
├── controller/
│   └── TenantController.java
├── service/
│   ├── TenantService.java
│   ├── TenantBrandingService.java
│   └── TenantSettingsService.java
├── repository/
│   ├── TenantRepository.java
│   ├── TenantBrandingRepository.java
│   └── TenantSettingsRepository.java
├── entity/
│   ├── Tenant.java
│   ├── TenantBranding.java
│   ├── TenantSettings.java
│   ├── TenantType.java
│   ├── TenantStatus.java
│   └── PlanType.java
├── dto/
│   ├── request/
│   └── response/
└── resolver/
    ├── TenantResolver.java
    └── TenantContext.java
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Tenant DB 스키마 |
| [multi-tenancy.md](../../context/multi-tenancy.md) | 멀티테넌시 설계 |
| [user/api.md](../user/api.md) | User API |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

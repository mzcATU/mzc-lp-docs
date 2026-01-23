# User API 명세

> UM (User Master) 모듈 API

---

## 1. 인증 API

### 1.1 회원가입

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | String | O | 이메일 (unique) |
| password | String | O | 비밀번호 (8자 이상, 영문+숫자+특수문자) |
| name | String | O | 이름 |
| phone | String | X | 전화번호 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "USER",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 1.2 로그인

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "userId": 1,
      "email": "user@example.com",
      "name": "홍길동",
      "role": "USER",
      "tenantId": 1
    }
  }
}
```

### 1.3 토큰 갱신

```http
POST /api/auth/refresh
Content-Type: application/json
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

### 1.4 로그아웃

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "message": "로그아웃되었습니다."
  }
}
```

---

## 2. 소셜 로그인 API

> OAuth 2.0 기반 소셜 로그인 (Google, Kakao, Naver)

### 2.1 소셜 로그인 URL 요청

```http
GET /api/auth/oauth/{provider}
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| provider | String | 소셜 제공자 (google, kakao, naver) |

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| redirectUri | String | X | 로그인 완료 후 리다이렉트 URL |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=xxx&scope=email%20profile&response_type=code&state=xxx"
  }
}
```

### 2.2 소셜 로그인 콜백 (인가 코드 처리)

```http
POST /api/auth/oauth/{provider}/callback
Content-Type: application/json
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| provider | String | 소셜 제공자 (google, kakao, naver) |

**Request Body**:
```json
{
  "code": "authorization_code_from_provider",
  "state": "csrf_state_token"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| code | String | O | OAuth 인가 코드 |
| state | String | O | CSRF 방지용 state 토큰 |

**Response** (`200 OK`) - 기존 회원:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "isNewUser": false,
    "user": {
      "userId": 1,
      "email": "user@gmail.com",
      "name": "홍길동",
      "role": "USER",
      "tenantId": 1,
      "provider": "GOOGLE",
      "profileImageUrl": "https://lh3.googleusercontent.com/..."
    }
  }
}
```

**Response** (`200 OK`) - 신규 회원 (자동 가입):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "isNewUser": true,
    "user": {
      "userId": 100,
      "email": "newuser@gmail.com",
      "name": "김신규",
      "role": "USER",
      "tenantId": 1,
      "provider": "GOOGLE",
      "profileImageUrl": "https://lh3.googleusercontent.com/..."
    }
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 지원하지 않는 제공자 | 400 | UNSUPPORTED_PROVIDER | Unsupported OAuth provider |
| 인가 코드 오류 | 400 | INVALID_OAUTH_CODE | Invalid authorization code |
| state 불일치 | 400 | INVALID_STATE | Invalid state token |
| 이메일 미제공 | 400 | EMAIL_REQUIRED | Email permission is required |
| 이미 다른 방식으로 가입 | 409 | EMAIL_ALREADY_REGISTERED | Email already registered with different provider |

### 2.3 소셜 계정 연동 (기존 회원)

> 이메일/비밀번호로 가입한 기존 회원이 소셜 계정 연동

```http
POST /api/users/me/oauth/{provider}/link
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "code": "authorization_code_from_provider",
  "state": "csrf_state_token"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "linkedProviders": ["GOOGLE", "KAKAO"],
    "message": "소셜 계정이 연동되었습니다."
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 이미 연동됨 | 409 | PROVIDER_ALREADY_LINKED | This provider is already linked |
| 다른 계정에 연동됨 | 409 | PROVIDER_LINKED_TO_OTHER | This social account is linked to another user |

### 2.4 소셜 계정 연동 해제

```http
DELETE /api/users/me/oauth/{provider}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "linkedProviders": ["KAKAO"],
    "message": "소셜 계정 연동이 해제되었습니다."
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 연동된 계정 아님 | 404 | PROVIDER_NOT_LINKED | This provider is not linked |
| 마지막 로그인 수단 | 400 | CANNOT_UNLINK_LAST_PROVIDER | Cannot unlink the only login method |

### 2.5 내 소셜 연동 현황 조회

```http
GET /api/users/me/oauth
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "hasPassword": true,
    "linkedProviders": [
      {
        "provider": "GOOGLE",
        "email": "user@gmail.com",
        "linkedAt": "2025-01-15T10:00:00"
      },
      {
        "provider": "KAKAO",
        "email": "user@kakao.com",
        "linkedAt": "2025-02-01T14:30:00"
      }
    ]
  }
}
```

### 2.6 소셜 제공자별 설정

| Provider | Scope | 가져오는 정보 |
|----------|-------|--------------|
| **GOOGLE** | `email profile` | 이메일, 이름, 프로필 이미지 |
| **KAKAO** | `profile_nickname profile_image account_email` | 이메일, 닉네임, 프로필 이미지 |
| **NAVER** | `name email profile_image` | 이메일, 이름, 프로필 이미지 |

### 2.7 소셜 로그인 플로우

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Client  │      │ Backend │      │ OAuth   │      │ DB      │
│(Browser)│      │ Server  │      │ Provider│      │         │
└────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘
     │                │                │                │
     │ GET /oauth/google              │                │
     │───────────────>│                │                │
     │                │                │                │
     │ authorizationUrl               │                │
     │<───────────────│                │                │
     │                │                │                │
     │ Redirect to Google             │                │
     │───────────────────────────────>│                │
     │                │                │                │
     │    User Login & Consent        │                │
     │<───────────────────────────────│                │
     │                │                │                │
     │ Redirect with code             │                │
     │<───────────────────────────────│                │
     │                │                │                │
     │ POST /oauth/google/callback    │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ Exchange code for token        │
     │                │───────────────>│                │
     │                │                │                │
     │                │ Access token + user info       │
     │                │<───────────────│                │
     │                │                │                │
     │                │ Find or create user            │
     │                │───────────────────────────────>│
     │                │                │                │
     │                │ User data                      │
     │                │<───────────────────────────────│
     │                │                │                │
     │ JWT tokens + user info         │                │
     │<───────────────│                │                │
     │                │                │                │
```

---

## 3. 사용자 API

### 3.1 내 정보 조회

```http
GET /api/users/me
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "profileImageUrl": "https://cdn.example.com/profiles/1.jpg",
    "role": "USER",
    "status": "ACTIVE",
    "tenantId": 1,
    "organization": null,
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 3.2 내 정보 수정

```http
PUT /api/users/me
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "홍길동",
  "phone": "010-9876-5432",
  "profileImageUrl": "https://cdn.example.com/profiles/1-new.jpg"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-9876-5432",
    "profileImageUrl": "https://cdn.example.com/profiles/1-new.jpg",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

### 3.3 비밀번호 변경

```http
PUT /api/users/me/password
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 변경되었습니다."
  }
}
```

### 3.4 회원 탈퇴

```http
DELETE /api/users/me
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "password": "Password123!",
  "reason": "더 이상 서비스를 이용하지 않습니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| password | String | O | 현재 비밀번호 (본인 확인용) |
| reason | String | X | 탈퇴 사유 |

> 소프트 삭제 처리 (status: WITHDRAWN), 개인정보는 일정 기간 후 완전 삭제

**Response** (`204 No Content`)

### 3.5 사용자 목록 조회 (OPERATOR+)

```http
GET /api/users
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| keyword | String | X | 이름/이메일 검색 |
| role | String | X | 역할 필터 (USER, OPERATOR, TENANT_ADMIN) |
| status | String | X | 상태 필터 (ACTIVE, INACTIVE, SUSPENDED) |
| organizationId | Long | X | 조직 ID 필터 (B2B) |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "userId": 1,
        "email": "user@example.com",
        "name": "홍길동",
        "role": "USER",
        "status": "ACTIVE",
        "organizationName": "개발팀",
        "createdAt": "2025-01-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

### 3.6 사용자 상세 조회

```http
GET /api/users/{userId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "profileImageUrl": "https://cdn.example.com/profiles/1.jpg",
    "role": "USER",
    "status": "ACTIVE",
    "organization": {
      "organizationId": 5,
      "name": "개발팀"
    },
    "courseRoles": [
      {
        "courseId": 10,
        "courseName": "React 기초",
        "role": "DESIGNER"
      }
    ],
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 3.7 사용자 역할 변경 (B2B OPERATOR)

```http
PUT /api/users/{userId}/role
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "role": "OPERATOR"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| role | String | O | 역할 (USER, OPERATOR) |

> B2B에서 OPERATOR가 일반 사용자에게 역할 부여/회수

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "OPERATOR",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

### 3.8 사용자 상태 변경 (OPERATOR+)

```http
PUT /api/users/{userId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "SUSPENDED",
  "reason": "이용약관 위반"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "status": "SUSPENDED",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

---

## 4. 강의 역할 API (CourseRole)

### 4.1 강의 설계자 권한 요청 (B2C)

```http
POST /api/users/me/course-roles/designer
Authorization: Bearer {accessToken}
```

> B2C에서 "강의 개설하기" 버튼 클릭 시 호출

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "courseRoleId": 1,
    "userId": 1,
    "role": "DESIGNER",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 4.2 강의 역할 부여 (B2B OPERATOR)

```http
POST /api/users/{userId}/course-roles
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "courseId": 10,
  "role": "INSTRUCTOR"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| courseId | Long | X | 강의 ID (null이면 테넌트 레벨) |
| role | String | O | 역할 (DESIGNER, INSTRUCTOR) |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "courseRoleId": 2,
    "userId": 1,
    "courseId": 10,
    "role": "INSTRUCTOR",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 4.3 강의 역할 회수 (B2B OPERATOR)

```http
DELETE /api/users/{userId}/course-roles/{courseRoleId}
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

### 4.4 내 강의 역할 목록 조회

```http
GET /api/users/me/course-roles
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "courseRoleId": 1,
      "courseId": null,
      "courseName": null,
      "role": "DESIGNER",
      "createdAt": "2025-01-15T10:00:00"
    },
    {
      "courseRoleId": 2,
      "courseId": 10,
      "courseName": "React 기초",
      "role": "OWNER",
      "revenueSharePercent": 70,
      "createdAt": "2025-01-15T11:00:00"
    }
  ]
}
```

---

## 5. 조직 API (B2B 전용)

### 5.1 조직 생성

```http
POST /api/organizations
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "개발팀",
  "parentId": 1
}
```

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "organizationId": 5,
    "name": "개발팀",
    "parentId": 1,
    "level": 2,
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 5.2 조직 목록 조회

```http
GET /api/organizations
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "organizationId": 1,
      "name": "기술본부",
      "level": 0,
      "memberCount": 50,
      "children": [
        {
          "organizationId": 5,
          "name": "개발팀",
          "level": 1,
          "memberCount": 20,
          "children": []
        }
      ]
    }
  ]
}
```

### 5.3 조직 수정

```http
PUT /api/organizations/{organizationId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "개발1팀"
}
```

### 5.4 조직 삭제

```http
DELETE /api/organizations/{organizationId}
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

### 5.5 사용자 조직 배정

```http
PUT /api/users/{userId}/organization
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "organizationId": 5
}
```

---

## 6. 에러 응답

### 공통 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| USER_NOT_FOUND | 404 | 사용자 없음 |
| DUPLICATE_EMAIL | 400 | 이메일 중복 |
| INVALID_PASSWORD | 400 | 잘못된 비밀번호 형식 |
| PASSWORD_MISMATCH | 401 | 비밀번호 불일치 |
| INVALID_TOKEN | 401 | 유효하지 않은 토큰 |
| TOKEN_EXPIRED | 401 | 토큰 만료 |
| ACCESS_DENIED | 403 | 접근 권한 없음 |
| ORGANIZATION_NOT_FOUND | 404 | 조직 없음 |
| ROLE_ALREADY_EXISTS | 400 | 이미 부여된 역할 |
| USER_ALREADY_WITHDRAWN | 400 | 이미 탈퇴한 사용자 |
| ACTIVE_ENROLLMENT_EXISTS | 400 | 진행 중인 수강이 있어 탈퇴 불가 |

---

## 7. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/user/
├── controller/
│   ├── AuthController.java
│   ├── UserController.java
│   └── OrganizationController.java
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   └── OrganizationService.java
├── repository/
│   ├── UserRepository.java
│   ├── UserCourseRoleRepository.java
│   └── OrganizationRepository.java
├── entity/
│   ├── User.java
│   ├── UserCourseRole.java
│   └── Organization.java
├── dto/
│   ├── request/
│   └── response/
└── security/
    ├── JwtTokenProvider.java
    └── JwtAuthenticationFilter.java
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | User DB 스키마 |
| [user-roles.md](../../context/user-roles.md) | 사용자 역할 및 권한 |
| [multi-tenancy.md](../../context/multi-tenancy.md) | 테넌트 분리 전략 |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

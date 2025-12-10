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

## 2. 사용자 API

### 2.1 내 정보 조회

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

### 2.2 내 정보 수정

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

### 2.3 비밀번호 변경

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

### 2.4 회원 탈퇴

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

### 2.5 사용자 목록 조회 (OPERATOR+)

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

### 2.5 사용자 상세 조회

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

### 2.6 사용자 역할 변경 (B2B OPERATOR)

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

### 2.7 사용자 상태 변경 (OPERATOR+)

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

## 3. 강의 역할 API (CourseRole)

### 3.1 강의 설계자 권한 요청 (B2C)

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

### 3.2 강의 역할 부여 (B2B OPERATOR)

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

### 3.3 강의 역할 회수 (B2B OPERATOR)

```http
DELETE /api/users/{userId}/course-roles/{courseRoleId}
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

### 3.4 내 강의 역할 목록 조회

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

## 4. 조직 API (B2B 전용)

### 4.1 조직 생성

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

### 4.2 조직 목록 조회

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

### 4.3 조직 수정

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

### 4.4 조직 삭제

```http
DELETE /api/organizations/{organizationId}
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

### 4.5 사용자 조직 배정

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

## 5. 에러 응답

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

## 6. 소스 위치

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

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | User DB 스키마 |
| [user-roles.md](../../context/user-roles.md) | 사용자 역할 및 권한 |
| [multi-tenancy.md](../../context/multi-tenancy.md) | 테넌트 분리 전략 |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

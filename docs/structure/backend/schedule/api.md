# Time Schedule API 명세

> TS (Time Schedule) 모듈 API - 강의 개설 및 차수 관리

---

## 1. 강의 개설 API

### 1.1 강의 개설 신청

```http
POST /api/programs
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "React 기초 과정",
  "description": "React의 기초부터 실전까지 배우는 과정입니다.",
  "thumbnailUrl": "https://cdn.example.com/thumbnails/react.jpg",
  "level": "BEGINNER",
  "type": "ONLINE",
  "estimatedHours": 20,
  "categoryId": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | String | O | 강의 제목 |
| description | String | X | 강의 설명 |
| thumbnailUrl | String | X | 썸네일 URL |
| level | String | X | 난이도 (BEGINNER, INTERMEDIATE, ADVANCED) |
| type | String | X | 유형 (ONLINE, OFFLINE, BLENDED) |
| estimatedHours | Integer | X | 예상 학습 시간 |
| categoryId | Long | X | 카테고리 ID |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "programId": 1,
    "title": "React 기초 과정",
    "status": "DRAFT",
    "creatorId": 10,
    "creatorName": "홍길동",
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 1.2 강의 목록 조회

```http
GET /api/programs
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (DRAFT, PENDING, APPROVED, REJECTED, CLOSED) |
| keyword | String | X | 제목 검색 |
| categoryId | Long | X | 카테고리 ID |
| level | String | X | 난이도 필터 |
| creatorId | Long | X | 생성자 ID |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "programId": 1,
        "title": "React 기초 과정",
        "thumbnailUrl": "https://cdn.example.com/thumbnails/react.jpg",
        "level": "BEGINNER",
        "type": "ONLINE",
        "status": "APPROVED",
        "creatorName": "홍길동",
        "timeCount": 3,
        "enrollmentCount": 150,
        "createdAt": "2025-01-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 50,
    "totalPages": 3
  }
}
```

### 1.3 강의 상세 조회

```http
GET /api/programs/{programId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "programId": 1,
    "title": "React 기초 과정",
    "description": "React의 기초부터 실전까지 배우는 과정입니다.",
    "thumbnailUrl": "https://cdn.example.com/thumbnails/react.jpg",
    "level": "BEGINNER",
    "type": "ONLINE",
    "estimatedHours": 20,
    "status": "APPROVED",
    "category": {
      "categoryId": 1,
      "name": "프론트엔드"
    },
    "creator": {
      "userId": 10,
      "name": "홍길동",
      "email": "hong@example.com"
    },
    "approvedAt": "2025-01-16T14:00:00",
    "approvedBy": {
      "userId": 1,
      "name": "관리자"
    },
    "times": [
      {
        "timeId": 1,
        "timeNumber": 1,
        "startDate": "2025-02-01T00:00:00",
        "endDate": "2025-03-01T23:59:59",
        "capacity": 50,
        "currentEnrollment": 45,
        "status": "IN_PROGRESS"
      }
    ],
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-16T14:00:00"
  }
}
```

### 1.4 강의 수정

```http
PUT /api/programs/{programId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "React 기초 과정 (업데이트)",
  "description": "React 18 기반으로 업데이트된 과정입니다.",
  "estimatedHours": 25
}
```

> DRAFT, REJECTED 상태에서만 수정 가능

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "programId": 1,
    "title": "React 기초 과정 (업데이트)",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

### 1.5 강의 삭제

```http
DELETE /api/programs/{programId}
Authorization: Bearer {accessToken}
```

> DRAFT 상태에서만 삭제 가능, 그 외는 CLOSED로 변경

**Response** (`204 No Content`)

### 1.6 강의 개설 신청

```http
POST /api/programs/{programId}/submit
Authorization: Bearer {accessToken}
```

> DRAFT → PENDING 상태로 변경, OPERATOR 검토 대기

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "programId": 1,
    "status": "PENDING",
    "submittedAt": "2025-01-15T12:00:00"
  }
}
```

---

## 2. 강의 검토 API (OPERATOR)

### 2.1 검토 대기 강의 목록

```http
GET /api/programs/pending
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "programId": 1,
        "title": "React 기초 과정",
        "creatorName": "홍길동",
        "submittedAt": "2025-01-15T12:00:00",
        "itemCount": 15
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

### 2.2 강의 승인

```http
PUT /api/programs/{programId}/approve
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body** (선택):
```json
{
  "comment": "승인합니다. 좋은 강의 기대합니다."
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "programId": 1,
    "status": "APPROVED",
    "approvedAt": "2025-01-16T14:00:00",
    "approvedBy": {
      "userId": 1,
      "name": "관리자"
    }
  }
}
```

> 승인 시 강의 생성자에게 OWNER 역할 자동 부여

### 2.3 강의 반려

```http
PUT /api/programs/{programId}/reject
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "커리큘럼 구성이 부족합니다. 섹션 3의 내용을 보강해주세요."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| reason | String | O | 반려 사유 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "programId": 1,
    "status": "REJECTED",
    "rejectedAt": "2025-01-16T14:00:00",
    "rejectedReason": "커리큘럼 구성이 부족합니다. 섹션 3의 내용을 보강해주세요."
  }
}
```

---

## 3. 차수(Time) 관리 API

### 3.1 차수 생성 (OPERATOR)

```http
POST /api/programs/{programId}/times
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "timeNumber": 1,
  "startDate": "2025-02-01T00:00:00",
  "endDate": "2025-03-01T23:59:59",
  "capacity": 50,
  "enrollmentStartDate": "2025-01-20T00:00:00",
  "enrollmentEndDate": "2025-01-31T23:59:59"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| timeNumber | Integer | O | 차수 번호 (1차, 2차...) |
| startDate | DateTime | O | 수강 시작일 |
| endDate | DateTime | O | 수강 종료일 |
| capacity | Integer | X | 정원 (null이면 무제한) |
| enrollmentStartDate | DateTime | X | 수강신청 시작일 |
| enrollmentEndDate | DateTime | X | 수강신청 종료일 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "timeId": 1,
    "programId": 1,
    "timeNumber": 1,
    "startDate": "2025-02-01T00:00:00",
    "endDate": "2025-03-01T23:59:59",
    "capacity": 50,
    "currentEnrollment": 0,
    "status": "SCHEDULED",
    "createdBy": {
      "userId": 1,
      "name": "관리자"
    },
    "createdAt": "2025-01-17T10:00:00"
  }
}
```

### 3.2 차수 목록 조회

```http
GET /api/programs/{programId}/times
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (SCHEDULED, OPEN, IN_PROGRESS, COMPLETED, CANCELLED) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "timeId": 1,
      "timeNumber": 1,
      "startDate": "2025-02-01T00:00:00",
      "endDate": "2025-03-01T23:59:59",
      "capacity": 50,
      "currentEnrollment": 45,
      "status": "IN_PROGRESS",
      "instructors": [
        {
          "userId": 10,
          "name": "홍길동",
          "role": "MAIN"
        }
      ]
    },
    {
      "timeId": 2,
      "timeNumber": 2,
      "startDate": "2025-03-01T00:00:00",
      "endDate": "2025-04-01T23:59:59",
      "capacity": 50,
      "currentEnrollment": 20,
      "status": "OPEN",
      "instructors": []
    }
  ]
}
```

### 3.3 차수 상세 조회

```http
GET /api/times/{timeId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "timeId": 1,
    "program": {
      "programId": 1,
      "title": "React 기초 과정"
    },
    "timeNumber": 1,
    "startDate": "2025-02-01T00:00:00",
    "endDate": "2025-03-01T23:59:59",
    "enrollmentStartDate": "2025-01-20T00:00:00",
    "enrollmentEndDate": "2025-01-31T23:59:59",
    "capacity": 50,
    "currentEnrollment": 45,
    "status": "IN_PROGRESS",
    "instructors": [
      {
        "assignmentId": 1,
        "userId": 10,
        "name": "홍길동",
        "email": "hong@example.com",
        "role": "MAIN",
        "assignedAt": "2025-01-18T10:00:00"
      }
    ],
    "createdBy": {
      "userId": 1,
      "name": "관리자"
    },
    "createdAt": "2025-01-17T10:00:00",
    "updatedAt": "2025-01-18T10:00:00"
  }
}
```

### 3.4 차수 수정 (OPERATOR)

```http
PUT /api/times/{timeId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "endDate": "2025-03-15T23:59:59",
  "capacity": 60
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "timeId": 1,
    "endDate": "2025-03-15T23:59:59",
    "capacity": 60,
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 3.5 차수 상태 변경 (OPERATOR)

```http
PUT /api/times/{timeId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "OPEN"
}
```

| 상태 | 설명 |
|------|------|
| SCHEDULED | 예정 (수강신청 불가) |
| OPEN | 수강신청 가능 |
| IN_PROGRESS | 진행 중 |
| COMPLETED | 완료 |
| CANCELLED | 취소됨 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "timeId": 1,
    "status": "OPEN",
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 3.6 차수 삭제 (OPERATOR)

```http
DELETE /api/times/{timeId}
Authorization: Bearer {accessToken}
```

> SCHEDULED 상태에서만 삭제 가능, 수강생이 있으면 CANCELLED로 변경

**Response** (`204 No Content`)

---

## 4. 에러 응답

### 공통 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "강의를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| COURSE_NOT_FOUND | 404 | 강의 없음 |
| TIME_NOT_FOUND | 404 | 차수 없음 |
| INVALID_COURSE_STATUS | 400 | 잘못된 강의 상태 |
| INVALID_TIME_STATUS | 400 | 잘못된 차수 상태 |
| DUPLICATE_TIME_NUMBER | 400 | 중복된 차수 번호 |
| CAPACITY_EXCEEDED | 400 | 정원 초과 |
| ENROLLMENT_PERIOD_CLOSED | 400 | 수강신청 기간 종료 |
| CANNOT_DELETE_WITH_ENROLLMENTS | 400 | 수강생이 있어 삭제 불가 |

---

## 5. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/schedule/
├── controller/
│   ├── CourseController.java
│   └── CourseTimeController.java
├── service/
│   ├── CourseService.java
│   ├── CourseTimeService.java
│   └── CourseApprovalService.java
├── repository/
│   ├── CourseRepository.java
│   └── CourseTimeRepository.java
├── entity/
│   ├── Course.java
│   ├── CourseTime.java
│   ├── CourseStatus.java
│   └── TimeStatus.java
└── dto/
    ├── request/
    └── response/
```

---

## 6. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | TS DB 스키마 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [instructor/api.md](../instructor/api.md) | 강사 배정 API (IIS) |
| [student/api.md](../student/api.md) | 수강 관리 API (SIS) |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

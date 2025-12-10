# Instructor API 명세

> IIS (Instructor Information System) 모듈 API - 강사 배정 관리

---

## 1. 강사 배정 API

### 1.1 강사 배정 (OPERATOR)

```http
POST /api/times/{timeId}/instructors
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": 10,
  "role": "MAIN"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| userId | Long | O | 강사로 배정할 사용자 ID |
| role | String | O | 역할 (MAIN: 주강사, SUB: 보조강사) |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "assignmentId": 1,
    "userKey": 10,
    "timeKey": 1,
    "assignedAt": "2025-01-18T10:00:00",
    "role": "MAIN",
    "status": "ACTIVE",
    "assignedBy": {
      "userId": 1,
      "name": "관리자"
    },
    "instructor": {
      "userId": 10,
      "name": "홍길동",
      "email": "hong@example.com"
    },
    "courseTime": {
      "timeId": 1,
      "programId": 1,
      "programName": "React 기초 과정",
      "timeNumber": 1
    }
  }
}
```

### 1.2 차수별 강사 목록 조회

```http
GET /api/times/{timeId}/instructors
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (ACTIVE, REPLACED, CANCELLED) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "assignmentId": 1,
      "userKey": 10,
      "instructor": {
        "userId": 10,
        "name": "홍길동",
        "email": "hong@example.com",
        "profileImageUrl": "https://cdn.example.com/profiles/10.jpg"
      },
      "role": "MAIN",
      "status": "ACTIVE",
      "assignedAt": "2025-01-18T10:00:00",
      "assignedBy": {
        "userId": 1,
        "name": "관리자"
      }
    },
    {
      "assignmentId": 2,
      "userKey": 11,
      "instructor": {
        "userId": 11,
        "name": "김철수",
        "email": "kim@example.com",
        "profileImageUrl": "https://cdn.example.com/profiles/11.jpg"
      },
      "role": "SUB",
      "status": "ACTIVE",
      "assignedAt": "2025-01-18T11:00:00",
      "assignedBy": {
        "userId": 1,
        "name": "관리자"
      }
    }
  ]
}
```

### 1.3 강사 배정 수정 (OPERATOR)

```http
PUT /api/instructor-assignments/{assignmentId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "role": "SUB"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "assignmentId": 1,
    "role": "SUB",
    "updatedAt": "2025-01-20T15:00:00"
  }
}
```

### 1.4 강사 교체 (OPERATOR)

```http
POST /api/instructor-assignments/{assignmentId}/replace
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "newUserId": 12,
  "reason": "기존 강사 휴직으로 인한 교체"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| newUserId | Long | O | 새 강사 사용자 ID |
| reason | String | X | 교체 사유 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "oldAssignment": {
      "assignmentId": 1,
      "userKey": 10,
      "status": "REPLACED",
      "replacedAt": "2025-02-01T10:00:00"
    },
    "newAssignment": {
      "assignmentId": 3,
      "userKey": 12,
      "role": "MAIN",
      "status": "ACTIVE",
      "assignedAt": "2025-02-01T10:00:00"
    }
  }
}
```

### 1.5 강사 배정 취소 (OPERATOR)

```http
DELETE /api/instructor-assignments/{assignmentId}
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| reason | String | X | 취소 사유 |

**Response** (`204 No Content`)

---

## 2. 강사별 조회 API

### 2.1 강사별 배정 이력 조회

```http
GET /api/users/{userId}/instructor-assignments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (ACTIVE, REPLACED, CANCELLED) |
| from | DateTime | X | 조회 시작일 |
| to | DateTime | X | 조회 종료일 |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "assignmentId": 1,
        "courseTime": {
          "timeId": 1,
          "program": {
            "programId": 1,
            "title": "React 기초 과정"
          },
          "timeNumber": 1,
          "startDate": "2025-02-01T00:00:00",
          "endDate": "2025-03-01T23:59:59",
          "status": "IN_PROGRESS"
        },
        "role": "MAIN",
        "status": "ACTIVE",
        "assignedAt": "2025-01-18T10:00:00",
        "enrollmentCount": 45
      },
      {
        "assignmentId": 2,
        "courseTime": {
          "timeId": 5,
          "program": {
            "programId": 3,
            "title": "Vue.js 입문"
          },
          "timeNumber": 2,
          "startDate": "2025-01-01T00:00:00",
          "endDate": "2025-01-31T23:59:59",
          "status": "COMPLETED"
        },
        "role": "MAIN",
        "status": "ACTIVE",
        "assignedAt": "2024-12-15T10:00:00",
        "enrollmentCount": 38
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 10,
    "totalPages": 1
  }
}
```

### 2.2 내 강의 배정 목록 조회

```http
GET /api/users/me/instructor-assignments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 |
| timeStatus | String | X | 차수 상태 필터 (IN_PROGRESS 등) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "assignmentId": 1,
      "program": {
        "programId": 1,
        "title": "React 기초 과정",
        "thumbnailUrl": "https://cdn.example.com/thumbnails/react.jpg"
      },
      "courseTime": {
        "timeId": 1,
        "timeNumber": 1,
        "startDate": "2025-02-01T00:00:00",
        "endDate": "2025-03-01T23:59:59",
        "status": "IN_PROGRESS"
      },
      "role": "MAIN",
      "enrollmentCount": 45,
      "completedCount": 12,
      "assignedAt": "2025-01-18T10:00:00"
    }
  ]
}
```

---

## 3. 강사 통계 API

### 3.1 강사 통계 조회

```http
GET /api/users/{userId}/instructor-stats
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 10,
    "totalAssignments": 15,
    "activeAssignments": 3,
    "completedAssignments": 12,
    "totalStudents": 450,
    "averageCompletionRate": 85.5,
    "averageRating": 4.7,
    "reviewCount": 120,
    "coursesByStatus": {
      "IN_PROGRESS": 3,
      "COMPLETED": 12
    },
    "recentPrograms": [
      {
        "programId": 1,
        "title": "React 기초 과정",
        "timeNumber": 1,
        "enrollmentCount": 45,
        "completionRate": 90.2
      }
    ]
  }
}
```

---

## 4. 에러 응답

### 공통 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "ASSIGNMENT_NOT_FOUND",
    "message": "강사 배정을 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| ASSIGNMENT_NOT_FOUND | 404 | 강사 배정 없음 |
| USER_NOT_FOUND | 404 | 사용자 없음 |
| TIME_NOT_FOUND | 404 | 차수 없음 |
| ALREADY_ASSIGNED | 400 | 이미 배정된 강사 |
| INVALID_INSTRUCTOR_ROLE | 400 | 잘못된 강사 역할 |
| CANNOT_REPLACE_INACTIVE | 400 | 비활성 배정은 교체 불가 |
| MAIN_INSTRUCTOR_REQUIRED | 400 | 주강사가 필요함 |

---

## 5. Entity 구조

### InstructorAssignment

```java
@Entity
@Table(name = "iis_instructor_assignments")
public class InstructorAssignment extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 필수 필드 ===
    @Column(name = "user_key", nullable = false)
    private Long userKey;               // 강사 ID

    @Column(name = "time_key", nullable = false)
    private Long timeKey;               // 차수 ID

    @Column(nullable = false)
    private LocalDateTime assignedAt;   // 배정 시점 (timestamp)

    // === 추가 필드 ===
    @Enumerated(EnumType.STRING)
    private InstructorRole role;        // MAIN, SUB

    @Enumerated(EnumType.STRING)
    private AssignmentStatus status;    // ACTIVE, REPLACED, CANCELLED

    private LocalDateTime replacedAt;   // 교체된 시점
    private Long assignedBy;            // 배정한 OPERATOR ID
}
```

---

## 6. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/instructor/
├── controller/
│   └── InstructorAssignmentController.java
├── service/
│   └── InstructorAssignmentService.java
├── repository/
│   └── InstructorAssignmentRepository.java
├── entity/
│   ├── InstructorAssignment.java
│   ├── InstructorRole.java
│   └── AssignmentStatus.java
└── dto/
    ├── request/
    │   ├── AssignInstructorRequest.java
    │   └── ReplaceInstructorRequest.java
    └── response/
        ├── InstructorAssignmentResponse.java
        └── InstructorStatsResponse.java
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | IIS DB 스키마 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [schedule/api.md](../schedule/api.md) | 강의/차수 API (TS) |
| [student/api.md](../student/api.md) | 수강 관리 API (SIS) |
| [user/api.md](../user/api.md) | User API (UM) |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

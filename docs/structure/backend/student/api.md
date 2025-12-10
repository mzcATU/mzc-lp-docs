# Student API 명세

> SIS (Student Information System) 모듈 API - 수강 관리

---

## 1. 수강 신청 API

### 1.1 수강 신청

```http
POST /api/times/{timeId}/enrollments
Authorization: Bearer {accessToken}
```

**Request Body** (선택):
```json
{
  "comment": "열심히 수강하겠습니다."
}
```

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "enrollmentId": 1,
    "userKey": 10,
    "timeKey": 1,
    "enrolledAt": "2025-01-20T10:00:00",
    "type": "VOLUNTARY",
    "status": "ENROLLED",
    "progressPercent": 0,
    "courseTime": {
      "timeId": 1,
      "course": {
        "courseId": 1,
        "title": "React 기초 과정"
      },
      "timeNumber": 1,
      "startDate": "2025-02-01T00:00:00",
      "endDate": "2025-03-01T23:59:59"
    }
  }
}
```

### 1.2 필수 수강 강제 신청 (OPERATOR)

```http
POST /api/times/{timeId}/enrollments/force
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "userIds": [10, 11, 12, 13],
  "reason": "신입사원 필수 교육"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| userIds | Long[] | O | 강제 신청할 사용자 ID 목록 |
| reason | String | X | 강제 신청 사유 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "successCount": 4,
    "failCount": 0,
    "enrollments": [
      {
        "enrollmentId": 2,
        "userKey": 10,
        "timeKey": 1,
        "type": "MANDATORY",
        "status": "ENROLLED"
      },
      {
        "enrollmentId": 3,
        "userKey": 11,
        "timeKey": 1,
        "type": "MANDATORY",
        "status": "ENROLLED"
      }
    ],
    "failures": []
  }
}
```

### 1.3 차수별 수강생 목록 조회

```http
GET /api/times/{timeId}/enrollments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (ENROLLED, COMPLETED, DROPPED, FAILED) |
| type | String | X | 유형 필터 (VOLUNTARY, MANDATORY) |
| keyword | String | X | 이름/이메일 검색 |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "enrollmentId": 1,
        "user": {
          "userId": 10,
          "name": "홍길동",
          "email": "hong@example.com",
          "profileImageUrl": "https://cdn.example.com/profiles/10.jpg",
          "organizationName": "개발팀"
        },
        "enrolledAt": "2025-01-20T10:00:00",
        "type": "VOLUNTARY",
        "status": "ENROLLED",
        "progressPercent": 45,
        "lastAccessedAt": "2025-02-15T14:30:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 45,
    "totalPages": 3
  }
}
```

### 1.4 사용자별 수강 이력 조회

```http
GET /api/users/{userId}/enrollments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 |
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
        "enrollmentId": 1,
        "course": {
          "courseId": 1,
          "title": "React 기초 과정",
          "thumbnailUrl": "https://cdn.example.com/thumbnails/react.jpg"
        },
        "courseTime": {
          "timeId": 1,
          "timeNumber": 1,
          "startDate": "2025-02-01T00:00:00",
          "endDate": "2025-03-01T23:59:59"
        },
        "enrolledAt": "2025-01-20T10:00:00",
        "type": "VOLUNTARY",
        "status": "ENROLLED",
        "progressPercent": 45,
        "score": null,
        "completedAt": null
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

### 1.5 내 수강 목록 조회

```http
GET /api/users/me/enrollments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (ENROLLED, COMPLETED) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": 1,
      "course": {
        "courseId": 1,
        "title": "React 기초 과정",
        "thumbnailUrl": "https://cdn.example.com/thumbnails/react.jpg",
        "level": "BEGINNER"
      },
      "courseTime": {
        "timeId": 1,
        "timeNumber": 1,
        "startDate": "2025-02-01T00:00:00",
        "endDate": "2025-03-01T23:59:59",
        "status": "IN_PROGRESS"
      },
      "instructors": [
        {
          "userId": 10,
          "name": "홍길동"
        }
      ],
      "enrolledAt": "2025-01-20T10:00:00",
      "status": "ENROLLED",
      "progressPercent": 45,
      "lastAccessedAt": "2025-02-15T14:30:00"
    }
  ]
}
```

---

## 2. 수강 상태 관리 API

### 2.1 수강 상세 조회

```http
GET /api/enrollments/{enrollmentId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "enrollmentId": 1,
    "user": {
      "userId": 10,
      "name": "홍길동",
      "email": "hong@example.com"
    },
    "course": {
      "courseId": 1,
      "title": "React 기초 과정"
    },
    "courseTime": {
      "timeId": 1,
      "timeNumber": 1,
      "startDate": "2025-02-01T00:00:00",
      "endDate": "2025-03-01T23:59:59"
    },
    "enrolledAt": "2025-01-20T10:00:00",
    "type": "VOLUNTARY",
    "status": "ENROLLED",
    "progressPercent": 45,
    "score": null,
    "completedAt": null,
    "enrolledBy": null,
    "progress": {
      "totalItems": 20,
      "completedItems": 9,
      "lastCompletedItem": {
        "itemId": 9,
        "itemName": "1-3. 컴포넌트 기초",
        "completedAt": "2025-02-15T14:30:00"
      }
    }
  }
}
```

### 2.2 진도율 업데이트

```http
PUT /api/enrollments/{enrollmentId}/progress
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemId": 10,
  "progressPercent": 50
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| itemId | Long | X | 완료한 학습 항목 ID |
| progressPercent | Integer | O | 전체 진도율 (0-100) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "enrollmentId": 1,
    "progressPercent": 50,
    "updatedAt": "2025-02-16T10:00:00"
  }
}
```

### 2.3 수료 처리

```http
PUT /api/enrollments/{enrollmentId}/complete
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "score": 85
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| score | Integer | X | 최종 점수 (0-100) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "enrollmentId": 1,
    "status": "COMPLETED",
    "progressPercent": 100,
    "score": 85,
    "completedAt": "2025-02-28T16:00:00",
    "certificate": {
      "certificateId": 1,
      "certificateNumber": "CERT-2025-000001",
      "issuedAt": "2025-02-28T16:00:00"
    }
  }
}
```

### 2.4 수강 취소

```http
DELETE /api/enrollments/{enrollmentId}
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| reason | String | X | 취소 사유 |

**Response** (`204 No Content`)

### 2.5 수강 상태 변경 (OPERATOR)

```http
PUT /api/enrollments/{enrollmentId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "FAILED",
  "reason": "수강 기간 내 미이수"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | String | O | 상태 (ENROLLED, COMPLETED, DROPPED, FAILED) |
| reason | String | X | 변경 사유 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "enrollmentId": 1,
    "status": "FAILED",
    "updatedAt": "2025-03-02T10:00:00"
  }
}
```

---

## 3. 학습 통계 API

### 3.1 차수별 수강 통계 조회

```http
GET /api/times/{timeId}/enrollments/stats
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "timeId": 1,
    "totalEnrollments": 45,
    "byStatus": {
      "ENROLLED": 30,
      "COMPLETED": 12,
      "DROPPED": 2,
      "FAILED": 1
    },
    "byType": {
      "VOLUNTARY": 35,
      "MANDATORY": 10
    },
    "averageProgress": 67.5,
    "completionRate": 26.7,
    "averageScore": 82.3
  }
}
```

### 3.2 사용자별 학습 통계 조회

```http
GET /api/users/{userId}/enrollments/stats
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 10,
    "totalEnrollments": 15,
    "completedCount": 10,
    "inProgressCount": 3,
    "droppedCount": 2,
    "completionRate": 66.7,
    "averageScore": 88.5,
    "totalLearningHours": 120,
    "recentActivity": {
      "lastAccessedAt": "2025-02-15T14:30:00",
      "lastCompletedCourse": {
        "courseId": 5,
        "title": "JavaScript 심화",
        "completedAt": "2025-02-10T16:00:00"
      }
    }
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
    "code": "ENROLLMENT_NOT_FOUND",
    "message": "수강 정보를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| ENROLLMENT_NOT_FOUND | 404 | 수강 정보 없음 |
| USER_NOT_FOUND | 404 | 사용자 없음 |
| TIME_NOT_FOUND | 404 | 차수 없음 |
| ALREADY_ENROLLED | 400 | 이미 수강 중 |
| ENROLLMENT_PERIOD_CLOSED | 400 | 수강신청 기간 종료 |
| CAPACITY_EXCEEDED | 400 | 정원 초과 |
| PREREQUISITE_NOT_MET | 400 | 선수강 조건 미충족 |
| CANNOT_CANCEL_COMPLETED | 400 | 수료 후 취소 불가 |
| INVALID_PROGRESS_VALUE | 400 | 잘못된 진도율 값 |

---

## 5. Entity 구조

### Enrollment

```java
@Entity
@Table(name = "sis_enrollments")
public class Enrollment extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 필수 필드 ===
    @Column(name = "user_key", nullable = false)
    private Long userKey;               // 수강생 ID

    @Column(name = "time_key", nullable = false)
    private Long timeKey;               // 차수 ID

    @Column(nullable = false)
    private LocalDateTime enrolledAt;   // 수강신청 시점 (timestamp)

    // === 추가 필드 ===
    @Enumerated(EnumType.STRING)
    private EnrollmentType type;        // VOLUNTARY, MANDATORY

    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status;    // ENROLLED, COMPLETED, DROPPED, FAILED

    private LocalDateTime completedAt;  // 수료 시점
    private Integer progressPercent;    // 진도율 (0-100)
    private Integer score;              // 점수
    private Long enrolledBy;            // 신청자 (본인 또는 OPERATOR)
}
```

---

## 6. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/student/
├── controller/
│   └── EnrollmentController.java
├── service/
│   ├── EnrollmentService.java
│   └── EnrollmentStatsService.java
├── repository/
│   └── EnrollmentRepository.java
├── entity/
│   ├── Enrollment.java
│   ├── EnrollmentType.java
│   └── EnrollmentStatus.java
└── dto/
    ├── request/
    │   ├── EnrollRequest.java
    │   ├── ForceEnrollRequest.java
    │   └── UpdateProgressRequest.java
    └── response/
        ├── EnrollmentResponse.java
        ├── EnrollmentDetailResponse.java
        └── EnrollmentStatsResponse.java
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | SIS DB 스키마 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [schedule/api.md](../schedule/api.md) | 강의/차수 API (TS) |
| [instructor/api.md](../instructor/api.md) | 강사 배정 API (IIS) |
| [course/api.md](../course/api.md) | 커리큘럼 API (CM/CR) |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

# API 명세서 (API Specification)

> 작성일: 2026-01-22
> 최종 수정: 2026-01-23
> MZC Learning Platform REST API v1

**통계**: 총 200+ API 엔드포인트 (60+ Controllers)

---

## 📋 개요

### 기본 정보
- **Base URL**: `http://localhost:8080/api` (로컬)
- **API Version**: v1
- **Protocol**: HTTP/HTTPS
- **Data Format**: JSON
- **Character Encoding**: UTF-8

### 인증 방식
- **JWT (JSON Web Token)** 기반 인증
- **Access Token**: 1시간 유효
- **Refresh Token**: 7일 유효

### HTTP 헤더
```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

---

## 🔐 인증 (Authentication)

### 1.1 로그인

**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "홍길동",
      "roles": ["USER", "INSTRUCTOR"]
    }
  }
}
```

**Error 401:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "이메일 또는 비밀번호가 잘못되었습니다"
  }
}
```

---

### 1.2 토큰 갱신

**POST** `/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

---

### 1.3 로그아웃

**POST** `/auth/logout`

**Request:** (Header에 Authorization 필요)

**Response 200:**
```json
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

---

### 1.4 역할 전환

**POST** `/auth/switch-role`

**Request:**
```json
{
  "roleId": 2
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "currentRole": "INSTRUCTOR"
  }
}
```

---

## 👤 사용자 관리 (User Management)

### 2.1 사용자 목록 조회

**GET** `/users?page=0&size=20&search=홍길동&departmentId=1`

**권한:** ADMIN, OPERATOR

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | Integer | N | 페이지 번호 (기본: 0) |
| size | Integer | N | 페이지 크기 (기본: 20) |
| search | String | N | 이름/이메일 검색 |
| departmentId | Long | N | 부서 ID |
| roleType | String | N | 역할 필터 |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "email": "hong@example.com",
        "name": "홍길동",
        "department": {
          "id": 1,
          "name": "개발팀"
        },
        "roles": ["USER", "INSTRUCTOR"],
        "status": "ACTIVE",
        "createdAt": "2026-01-15T10:00:00Z",
        "lastLoginAt": "2026-01-22T14:30:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 150,
      "totalPages": 8
    }
  }
}
```

---

### 2.2 사용자 상세 조회

**GET** `/users/{userId}`

**권한:** ADMIN, OPERATOR, 본인

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "hong@example.com",
    "name": "홍길동",
    "phoneNumber": "010-1234-5678",
    "department": {
      "id": 1,
      "name": "개발팀",
      "path": "회사/개발본부/개발팀"
    },
    "roles": [
      {
        "id": 1,
        "roleType": "USER",
        "assignedAt": "2026-01-15T10:00:00Z"
      },
      {
        "id": 2,
        "roleType": "INSTRUCTOR",
        "courseId": 10,
        "courseName": "React 완벽 가이드",
        "assignedAt": "2026-01-20T09:00:00Z"
      }
    ],
    "status": "ACTIVE",
    "createdAt": "2026-01-15T10:00:00Z",
    "lastLoginAt": "2026-01-22T14:30:00Z"
  }
}
```

---

### 2.3 사용자 등록

**POST** `/users`

**권한:** ADMIN

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "신규사용자",
  "password": "tempPassword123!",
  "phoneNumber": "010-9999-8888",
  "departmentId": 1,
  "roleTypes": ["USER"]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 150,
    "email": "newuser@example.com",
    "name": "신규사용자",
    "createdAt": "2026-01-22T15:00:00Z"
  }
}
```

---

### 2.4 사용자 일괄 등록

**POST** `/users/bulk-upload`

**권한:** ADMIN

**Request:** `multipart/form-data`
```
file: users.xlsx
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalCount": 100,
    "successCount": 95,
    "failCount": 5,
    "errors": [
      {
        "row": 3,
        "email": "duplicate@example.com",
        "message": "이미 존재하는 이메일입니다"
      },
      {
        "row": 7,
        "email": "invalid@",
        "message": "이메일 형식이 잘못되었습니다"
      }
    ]
  }
}
```

---

### 2.5 사용자 수정

**PUT** `/users/{userId}`

**권한:** ADMIN, 본인 (제한적)

**Request:**
```json
{
  "name": "홍길동",
  "phoneNumber": "010-1234-5678",
  "departmentId": 2
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "hong@example.com",
    "name": "홍길동",
    "updatedAt": "2026-01-22T15:30:00Z"
  }
}
```

---

### 2.6 사용자 비활성화

**PUT** `/users/{userId}/status`

**권한:** ADMIN

**Request:**
```json
{
  "status": "INACTIVE",
  "reason": "퇴사"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "사용자가 비활성화되었습니다"
}
```

---

## 📚 강의 관리 (Course Management)

### 3.1 강의 템플릿 목록

**GET** `/courses?page=0&size=20&category=개발&status=ACTIVE`

**권한:** 모두 (공개 강의), DESIGNER (본인 강의)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "React 완벽 가이드",
        "category": {
          "id": 1,
          "name": "개발",
          "parentName": "IT"
        },
        "level": "INTERMEDIATE",
        "thumbnailUrl": "https://cdn.example.com/thumb1.jpg",
        "description": "React 기초부터 고급까지",
        "designer": {
          "id": 5,
          "name": "김개발"
        },
        "itemCount": 20,
        "estimatedHours": 40,
        "rating": 4.8,
        "reviewCount": 234,
        "status": "ACTIVE",
        "createdAt": "2025-12-01T10:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 45,
      "totalPages": 3
    }
  }
}
```

---

### 3.2 강의 상세 조회

**GET** `/courses/{courseId}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "React 완벽 가이드",
    "description": "React 기초부터 고급까지 모든 것을 다룹니다",
    "category": {
      "id": 1,
      "name": "프론트엔드",
      "path": "IT/개발/프론트엔드"
    },
    "level": "INTERMEDIATE",
    "thumbnailUrl": "https://cdn.example.com/thumb1.jpg",
    "designer": {
      "id": 5,
      "name": "김개발",
      "email": "kim@example.com"
    },
    "learningObjectives": [
      "React 기본 개념 이해",
      "Hooks 활용",
      "상태 관리"
    ],
    "prerequisites": ["JavaScript 기본", "HTML/CSS"],
    "tags": ["React", "JavaScript", "Frontend"],
    "curriculum": {
      "totalItems": 20,
      "totalDuration": 2400,
      "items": [
        {
          "id": 1,
          "type": "FOLDER",
          "title": "1. React 기초",
          "orderIndex": 0,
          "children": [
            {
              "id": 2,
              "type": "CONTENT",
              "title": "1-1. React 소개",
              "contentType": "VIDEO",
              "duration": 600,
              "orderIndex": 0
            }
          ]
        }
      ]
    },
    "statistics": {
      "enrollmentCount": 280,
      "completionCount": 156,
      "averageRating": 4.8,
      "reviewCount": 234
    },
    "status": "ACTIVE",
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2026-01-10T14:20:00Z"
  }
}
```

---

### 3.3 강의 생성

**POST** `/courses`

**권한:** DESIGNER

**Request:**
```json
{
  "title": "Python 데이터 분석",
  "description": "Python으로 데이터 분석하기",
  "categoryId": 2,
  "level": "BEGINNER",
  "thumbnailUrl": "https://cdn.example.com/thumb2.jpg",
  "learningObjectives": ["Pandas 활용", "데이터 시각화"],
  "prerequisites": ["Python 기본"],
  "tags": ["Python", "Data", "Analysis"]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 50,
    "title": "Python 데이터 분석",
    "status": "DRAFT",
    "createdAt": "2026-01-22T16:00:00Z"
  }
}
```

---

### 3.4 커리큘럼 아이템 추가

**POST** `/courses/{courseId}/items`

**권한:** DESIGNER (소유자)

**Request:**
```json
{
  "type": "CONTENT",
  "title": "1-1. Python 소개",
  "parentItemId": 1,
  "orderIndex": 0,
  "learningObjectId": 10,
  "contentType": "VIDEO",
  "duration": 600
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "type": "CONTENT",
    "title": "1-1. Python 소개",
    "orderIndex": 0,
    "createdAt": "2026-01-22T16:10:00Z"
  }
}
```

---

## 🎓 차수 관리 (CourseTime Management)

### 4.1 차수 목록 조회

**GET** `/course-times?status=ACTIVE&courseId=1`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "courseId": 1,
        "courseTitle": "React 완벽 가이드",
        "timeName": "2026년 1기",
        "deliveryType": "ONLINE",
        "enrollmentType": "AUTO",
        "capacity": 30,
        "enrolledCount": 28,
        "price": 50000,
        "startDate": "2026-02-01",
        "endDate": "2026-03-31",
        "enrollStartDate": "2026-01-01",
        "enrollEndDate": "2026-01-31",
        "status": "ACTIVE",
        "instructors": [
          {
            "id": 2,
            "name": "김강사",
            "instructorType": "MAIN"
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 15,
      "totalPages": 1
    }
  }
}
```

---

### 4.2 차수 개설

**POST** `/course-times`

**권한:** OPERATOR, ADMIN

**Request:**
```json
{
  "programId": 10,
  "timeName": "2026년 2기",
  "deliveryType": "ONLINE",
  "enrollmentType": "AUTO",
  "capacity": 30,
  "price": 50000,
  "startDate": "2026-04-01",
  "endDate": "2026-05-31",
  "enrollStartDate": "2026-03-01",
  "enrollEndDate": "2026-03-31",
  "locationInfo": null
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 20,
    "timeName": "2026년 2기",
    "status": "SCHEDULED",
    "createdAt": "2026-01-22T16:30:00Z"
  }
}
```

---

### 4.3 차수 상세 조회

**GET** `/course-times/{courseTimeId}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "program": {
      "id": 10,
      "course": {
        "id": 1,
        "title": "React 완벽 가이드"
      }
    },
    "timeName": "2026년 1기",
    "deliveryType": "ONLINE",
    "enrollmentType": "AUTO",
    "capacity": 30,
    "enrolledCount": 28,
    "waitingCount": 0,
    "price": 50000,
    "startDate": "2026-02-01",
    "endDate": "2026-03-31",
    "enrollStartDate": "2026-01-01",
    "enrollEndDate": "2026-01-31",
    "status": "ACTIVE",
    "instructors": [
      {
        "id": 1,
        "userId": 10,
        "userName": "김강사",
        "instructorType": "MAIN",
        "assignedAt": "2026-01-15T10:00:00Z"
      }
    ],
    "statistics": {
      "averageProgress": 65.5,
      "averageAttendance": 85.2,
      "completionCount": 5
    }
  }
}
```

---

## 📝 수강 관리 (Enrollment Management)

### 5.1 수강 신청

**POST** `/enrollments`

**권한:** USER

**Request:**
```json
{
  "courseTimeId": 1,
  "paymentInfo": {
    "method": "CARD",
    "amount": 50000
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 500,
    "courseTimeId": 1,
    "status": "APPROVED",
    "enrolledAt": "2026-01-22T17:00:00Z",
    "approvedAt": "2026-01-22T17:00:01Z"
  }
}
```

**Error 400:**
```json
{
  "success": false,
  "error": {
    "code": "ENROLL_001",
    "message": "정원이 마감되었습니다"
  }
}
```

---

### 5.2 수강 신청 승인

**PUT** `/enrollments/{enrollmentId}/approve`

**권한:** OPERATOR, ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 500,
    "status": "APPROVED",
    "approvedAt": "2026-01-22T17:10:00Z"
  }
}
```

---

### 5.3 수강 신청 반려

**PUT** `/enrollments/{enrollmentId}/reject`

**권한:** OPERATOR, ADMIN

**Request:**
```json
{
  "reason": "정원 초과로 인한 반려"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "수강 신청이 반려되었습니다"
}
```

---

### 5.4 내 수강 목록

**GET** `/enrollments/me?status=ACTIVE`

**권한:** USER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 500,
        "courseTime": {
          "id": 1,
          "courseTitle": "React 완벽 가이드",
          "timeName": "2026년 1기",
          "thumbnailUrl": "https://cdn.example.com/thumb1.jpg"
        },
        "progress": {
          "completedItems": 12,
          "totalItems": 20,
          "progressRate": 60.0,
          "lastAccessedAt": "2026-01-22T14:30:00Z"
        },
        "status": "APPROVED",
        "enrolledAt": "2026-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

## 📊 학습 진행 (Learning Progress)

### 6.1 학습 진행 기록

**POST** `/learning-progress`

**권한:** USER

**Request:**
```json
{
  "enrollmentId": 500,
  "snapshotItemId": 150,
  "progressStatus": "COMPLETED",
  "timeSpent": 600
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1000,
    "progressRate": 65.0,
    "updatedAt": "2026-01-22T18:00:00Z"
  }
}
```

---

### 6.2 학습 진행 현황 조회

**GET** `/learning-progress/{enrollmentId}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enrollmentId": 500,
    "totalItems": 20,
    "completedItems": 13,
    "progressRate": 65.0,
    "totalTimeSpent": 7800,
    "items": [
      {
        "snapshotItemId": 150,
        "title": "1-1. React 소개",
        "progressStatus": "COMPLETED",
        "timeSpent": 600,
        "completedAt": "2026-01-22T14:00:00Z"
      },
      {
        "snapshotItemId": 151,
        "title": "1-2. JSX 문법",
        "progressStatus": "IN_PROGRESS",
        "timeSpent": 300,
        "completedAt": null
      }
    ]
  }
}
```

---

## 📤 과제 관리 (Assignment Management)

### 7.1 과제 제출

**POST** `/assignments/{assignmentId}/submissions`

**권한:** USER

**Request:** `multipart/form-data`
```
file: assignment.zip
content: "과제 설명..."
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 300,
    "assignmentId": 10,
    "fileUrl": "https://storage.example.com/submissions/300.zip",
    "submittedAt": "2026-01-22T18:30:00Z",
    "status": "SUBMITTED"
  }
}
```

---

### 7.2 과제 채점

**PUT** `/submissions/{submissionId}/grade`

**권한:** INSTRUCTOR

**Request:**
```json
{
  "score": 95,
  "feedback": "전반적으로 잘 작성되었습니다. 다만 에러 처리 부분을 보완하면 더 좋을 것 같습니다."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 300,
    "score": 95,
    "status": "GRADED",
    "gradedAt": "2026-01-23T10:00:00Z"
  }
}
```

---

## ❓ 퀴즈 관리 (Quiz Management)

### 8.1 퀴즈 응시 시작

**POST** `/quizzes/{quizId}/attempts`

**권한:** USER

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1000,
    "quizId": 5,
    "startedAt": "2026-01-22T19:00:00Z",
    "timeLimit": 3600,
    "expiresAt": "2026-01-22T20:00:00Z",
    "questions": [
      {
        "id": 1,
        "questionText": "React에서 상태 관리를 위해 사용하는 Hook은?",
        "questionType": "MULTIPLE_CHOICE",
        "options": [
          {"id": 1, "text": "useState"},
          {"id": 2, "text": "useContext"},
          {"id": 3, "text": "useEffect"},
          {"id": 4, "text": "useReducer"}
        ],
        "points": 10
      }
    ]
  }
}
```

---

### 8.2 퀴즈 제출

**PUT** `/quiz-attempts/{attemptId}/submit`

**권한:** USER

**Request:**
```json
{
  "answers": [
    {
      "questionId": 1,
      "selectedOptionId": 1
    },
    {
      "questionId": 2,
      "answerText": "Virtual DOM을 사용하여 효율적인 렌더링"
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1000,
    "score": 85,
    "totalPoints": 100,
    "correctCount": 8,
    "totalCount": 10,
    "status": "COMPLETED",
    "submittedAt": "2026-01-22T19:45:00Z"
  }
}
```

---

## 🔔 알림 관리 (Notification Management)

### 9.1 알림 목록 조회

**GET** `/notifications?read=false&page=0&size=20`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1000,
        "type": "ENROLLMENT_APPROVED",
        "title": "수강 신청이 승인되었습니다",
        "message": "React 완벽 가이드 2026년 1기 수강 신청이 승인되었습니다.",
        "relatedUrl": "/my/courses/500",
        "isRead": false,
        "createdAt": "2026-01-22T17:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 15,
      "totalPages": 1
    },
    "unreadCount": 5
  }
}
```

---

### 9.2 알림 읽음 처리

**PUT** `/notifications/{notificationId}/read`

**Response 200:**
```json
{
  "success": true,
  "message": "알림이 읽음 처리되었습니다"
}
```

---

### 9.3 알림 전체 읽음 처리

**PUT** `/notifications/read-all`

**Response 200:**
```json
{
  "success": true,
  "message": "모든 알림이 읽음 처리되었습니다"
}
```

---

## 📈 통계 (Analytics)

### 10.1 대시보드 통계

**GET** `/analytics/dashboard`

**권한:** ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1234,
    "activeCourseTimes": 15,
    "totalEnrollments": 856,
    "completionCount": 189,
    "monthlyStats": {
      "newUsers": 42,
      "newEnrollments": 123,
      "completions": 34
    }
  }
}
```

---

### 10.2 차수별 통계

**GET** `/analytics/course-times/{courseTimeId}`

**권한:** INSTRUCTOR, ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "courseTimeId": 1,
    "enrollmentCount": 28,
    "averageProgress": 65.5,
    "averageAttendance": 85.2,
    "completionCount": 5,
    "assignmentSubmissionRate": 92.3,
    "averageQuizScore": 87.5,
    "progressDistribution": {
      "0-20": 2,
      "21-40": 3,
      "41-60": 8,
      "61-80": 10,
      "81-100": 5
    }
  }
}
```

---

## 📢 공지사항 관리 (Notice Management)

### 11.1 시스템 공지 목록 조회

**GET** `/sa/notices?page=0&size=20&status=ACTIVE`

**권한:** SYSTEM_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "시스템 점검 안내",
        "content": "2026년 1월 25일 02:00~06:00 시스템 점검이 예정되어 있습니다.",
        "priority": "HIGH",
        "status": "ACTIVE",
        "startDate": "2026-01-22T00:00:00Z",
        "endDate": "2026-01-25T06:00:00Z",
        "targetTenants": ["ALL"],
        "createdBy": {
          "id": 1,
          "name": "시스템 관리자"
        },
        "createdAt": "2026-01-20T10:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 5,
      "totalPages": 1
    }
  }
}
```

---

### 11.2 시스템 공지 생성

**POST** `/sa/notices`

**권한:** SYSTEM_ADMIN

**Request:**
```json
{
  "title": "시스템 점검 안내",
  "content": "2026년 1월 25일 02:00~06:00 시스템 점검이 예정되어 있습니다.",
  "priority": "HIGH",
  "startDate": "2026-01-22T00:00:00Z",
  "endDate": "2026-01-25T06:00:00Z",
  "targetTenantIds": []
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "시스템 점검 안내",
    "status": "DRAFT",
    "createdAt": "2026-01-22T10:00:00Z"
  }
}
```

---

### 11.3 시스템 공지 배포

**POST** `/sa/notices/{noticeId}/distribute`

**권한:** SYSTEM_ADMIN

**Request:**
```json
{
  "targetTenantIds": [1, 2, 3],
  "sendNotification": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "status": "ACTIVE",
    "distributedCount": 3,
    "distributedAt": "2026-01-22T10:30:00Z"
  }
}
```

---

### 11.4 테넌트 공지 목록 조회

**GET** `/tenant/notices?page=0&size=20&status=ACTIVE`

**권한:** TENANT_ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 100,
        "title": "2026년 1분기 교육 일정 안내",
        "content": "2026년 1분기 교육 일정을 안내드립니다...",
        "priority": "NORMAL",
        "status": "ACTIVE",
        "startDate": "2026-01-01T00:00:00Z",
        "endDate": "2026-03-31T23:59:59Z",
        "targetRoles": ["USER", "INSTRUCTOR"],
        "isPinned": true,
        "viewCount": 234,
        "createdBy": {
          "id": 10,
          "name": "테넌트 관리자"
        },
        "createdAt": "2025-12-20T09:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 12,
      "totalPages": 1
    }
  }
}
```

---

### 11.5 테넌트 공지 생성

**POST** `/tenant/notices`

**권한:** TENANT_ADMIN

**Request:**
```json
{
  "title": "2026년 1분기 교육 일정 안내",
  "content": "2026년 1분기 교육 일정을 안내드립니다...",
  "priority": "NORMAL",
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-03-31T23:59:59Z",
  "targetRoles": ["USER", "INSTRUCTOR"],
  "isPinned": true,
  "sendNotification": true
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "title": "2026년 1분기 교육 일정 안내",
    "status": "ACTIVE",
    "createdAt": "2026-01-22T11:00:00Z"
  }
}
```

---

### 11.6 공지사항 조회 (사용자용)

**GET** `/notices?type=ALL&page=0&size=20`

**권한:** 모든 인증된 사용자

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| type | String | N | SYSTEM, TENANT, ALL (기본: ALL) |
| page | Integer | N | 페이지 번호 (기본: 0) |
| size | Integer | N | 페이지 크기 (기본: 20) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "pinnedNotices": [
      {
        "id": 100,
        "type": "TENANT",
        "title": "2026년 1분기 교육 일정 안내",
        "priority": "NORMAL",
        "createdAt": "2025-12-20T09:00:00Z"
      }
    ],
    "content": [
      {
        "id": 1,
        "type": "SYSTEM",
        "title": "시스템 점검 안내",
        "priority": "HIGH",
        "createdAt": "2026-01-20T10:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 15,
      "totalPages": 1
    }
  }
}
```

---

## 🔄 자동수강규칙 관리 (Auto-enrollment Rules)

### 12.1 자동수강규칙 목록 조회

**GET** `/auto-enrollment-rules?status=ACTIVE&page=0&size=20`

**권한:** OPERATOR, ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "신입사원 필수 교육 자동 등록",
        "description": "신입사원 그룹에 입사 시 필수 교육 자동 등록",
        "status": "ACTIVE",
        "triggerType": "USER_GROUP_ADDED",
        "conditions": {
          "userGroupIds": [10],
          "departmentIds": null
        },
        "actions": {
          "courseTimeIds": [1, 2, 3],
          "autoApprove": true
        },
        "executionCount": 156,
        "lastExecutedAt": "2026-01-22T09:00:00Z",
        "createdBy": {
          "id": 5,
          "name": "운영자"
        },
        "createdAt": "2025-11-01T10:00:00Z"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 5,
      "totalPages": 1
    }
  }
}
```

---

### 12.2 자동수강규칙 생성

**POST** `/auto-enrollment-rules`

**권한:** OPERATOR, ADMIN

**Request:**
```json
{
  "name": "신입사원 필수 교육 자동 등록",
  "description": "신입사원 그룹에 추가 시 필수 교육 자동 등록",
  "triggerType": "USER_GROUP_ADDED",
  "conditions": {
    "userGroupIds": [10],
    "departmentIds": null,
    "roleTypes": null
  },
  "actions": {
    "courseTimeIds": [1, 2, 3],
    "autoApprove": true,
    "sendNotification": true
  },
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z"
}
```

**Trigger Types:**
| 타입 | 설명 |
|------|------|
| USER_GROUP_ADDED | 사용자가 특정 그룹에 추가될 때 |
| DEPARTMENT_JOINED | 사용자가 특정 부서에 배정될 때 |
| COURSE_TIME_OPENED | 차수가 모집 시작될 때 |
| SCHEDULED | 스케줄 기반 (Cron) |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "신입사원 필수 교육 자동 등록",
    "status": "DRAFT",
    "createdAt": "2026-01-22T14:00:00Z"
  }
}
```

---

### 12.3 자동수강규칙 활성화

**POST** `/auto-enrollment-rules/{ruleId}/activate`

**권한:** OPERATOR, ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "status": "ACTIVE",
    "activatedAt": "2026-01-22T14:10:00Z"
  }
}
```

---

### 12.4 자동수강규칙 비활성화

**POST** `/auto-enrollment-rules/{ruleId}/deactivate`

**권한:** OPERATOR, ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "status": "INACTIVE",
    "deactivatedAt": "2026-01-22T15:00:00Z"
  }
}
```

---

### 12.5 자동수강규칙 수동 실행

**POST** `/auto-enrollment-rules/{ruleId}/execute`

**권한:** OPERATOR, ADMIN

**Request:**
```json
{
  "targetUserIds": [100, 101, 102],
  "dryRun": false
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ruleId": 10,
    "executedAt": "2026-01-22T15:30:00Z",
    "results": {
      "totalTargets": 3,
      "successCount": 3,
      "skipCount": 0,
      "failCount": 0,
      "enrollments": [
        {
          "userId": 100,
          "courseTimeId": 1,
          "status": "APPROVED"
        },
        {
          "userId": 100,
          "courseTimeId": 2,
          "status": "APPROVED"
        }
      ]
    }
  }
}
```

---

### 12.6 자동수강규칙 실행 이력 조회

**GET** `/auto-enrollment-rules/{ruleId}/history?page=0&size=20`

**권한:** OPERATOR, ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 500,
        "ruleId": 10,
        "executionType": "AUTO",
        "executedAt": "2026-01-22T09:00:00Z",
        "totalTargets": 5,
        "successCount": 5,
        "skipCount": 0,
        "failCount": 0,
        "triggerInfo": {
          "type": "USER_GROUP_ADDED",
          "userGroupId": 10,
          "affectedUserIds": [200, 201, 202, 203, 204]
        }
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 156,
      "totalPages": 8
    }
  }
}
```

---

## 🔧 시스템 관리자 API (System Admin)

### 13.1 SA 대시보드 조회

**GET** `/sa/dashboard?period=MONTH`

**권한:** SYSTEM_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalTenants": 15,
    "activeTenants": 12,
    "totalUsers": 5000,
    "activeUsersToday": 450,
    "totalCourses": 200,
    "newTenantsThisMonth": 2
  }
}
```

---

### 13.2 시스템 설정 조회/수정

**GET** `/admin/system/settings`

**권한:** SYSTEM_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "platformName": "MZC Learning Platform",
    "timezone": "Asia/Seoul",
    "maintenanceMode": false,
    "sessionTimeoutMinutes": 30,
    "maxLoginAttempts": 5
  }
}
```

**PUT** `/admin/system/settings`

**Request:**
```json
{
  "platformName": "MZC Learning Platform",
  "timezone": "Asia/Seoul",
  "maintenanceMode": false,
  "sessionTimeoutMinutes": 60,
  "maxLoginAttempts": 5
}
```

---

### 13.3 SA 분석/로그 조회

**GET** `/sa/analytics/logs?tenantId=1&type=LOGIN&page=0&size=20`

**권한:** SYSTEM_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1000,
        "tenantId": 1,
        "userId": 100,
        "userName": "홍길동",
        "activityType": "LOGIN",
        "description": "로그인 성공",
        "ipAddress": "192.168.1.100",
        "createdAt": "2026-01-22T10:00:00Z"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, "totalElements": 500 }
  }
}
```

---

## 🏢 테넌트 관리 API (Tenant Management)

### 14.1 테넌트 목록 조회

**GET** `/tenants?keyword=삼성&page=0&size=20`

**권한:** SYSTEM_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "code": "samsung",
        "name": "삼성전자",
        "type": "ENTERPRISE",
        "status": "ACTIVE",
        "subdomain": "samsung",
        "customDomain": "learning.samsung.com",
        "userCount": 1500,
        "createdAt": "2025-06-01T00:00:00Z"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, "totalElements": 15 }
  }
}
```

---

### 14.2 테넌트 생성

**POST** `/tenants`

**권한:** SYSTEM_ADMIN

**Request:**
```json
{
  "code": "newcorp",
  "name": "신규기업",
  "type": "ENTERPRISE",
  "plan": "PREMIUM",
  "subdomain": "newcorp",
  "adminEmail": "admin@newcorp.com",
  "adminName": "관리자"
}
```

---

### 14.3 테넌트 상태 변경

**PATCH** `/tenants/{tenantId}/status`

**권한:** SYSTEM_ADMIN

**Request:**
```json
{
  "status": "SUSPENDED",
  "reason": "결제 미납"
}
```

---

## ⚙️ 테넌트 설정 API (Tenant Settings)

### 15.1 테넌트 설정 조회

**GET** `/tenant/settings`

**권한:** TENANT_ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "logoUrl": "https://storage.example.com/logo.png",
    "primaryColor": "#2563eb",
    "defaultLanguage": "ko",
    "timezone": "Asia/Seoul",
    "allowSelfRegistration": true
  }
}
```

---

### 15.2 브랜딩 설정 수정

**PUT** `/tenant/settings/branding/extended`

**권한:** TENANT_ADMIN

**Request:**
```json
{
  "logoUrl": "https://storage.example.com/logo.png",
  "primaryColor": "#2563eb",
  "secondaryColor": "#1e40af",
  "faviconUrl": "https://storage.example.com/favicon.ico"
}
```

---

### 15.3 기능 설정 조회/수정

**GET** `/tenant/settings/features`

**권한:** TENANT_ADMIN, OPERATOR

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enableCommunity": true,
    "enableRoadmap": true,
    "enableCertificate": true,
    "enableQuiz": false,
    "enableAssignment": true
  }
}
```

**PUT** `/tenant/settings/features`

**권한:** TENANT_ADMIN

**Request:**
```json
{
  "enableCommunity": true,
  "enableRoadmap": false,
  "enableCertificate": true
}
```

---

### 15.4 네비게이션 관리

**GET** `/tenant/settings/navigation`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "홈",
      "icon": "home",
      "path": "/tu",
      "enabled": true,
      "displayOrder": 1
    },
    {
      "id": 2,
      "label": "강의 탐색",
      "icon": "search",
      "path": "/tu/catalog",
      "enabled": true,
      "displayOrder": 2
    }
  ]
}
```

**POST** `/tenant/settings/navigation`

**권한:** TENANT_ADMIN

**Request:**
```json
{
  "label": "커뮤니티",
  "icon": "users",
  "path": "/tu/community",
  "enabled": true,
  "displayOrder": 5
}
```

---

## 📂 콘텐츠 관리 API (Content Management)

### 16.1 콘텐츠 업로드

**POST** `/contents/upload`

**권한:** DESIGNER, OPERATOR, TENANT_ADMIN

**Request:** `multipart/form-data`
```
file: video.mp4
title: React 강좌 1강
folderId: 10 (optional)
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "status": "PROCESSING",
    "contentType": "VIDEO",
    "originalFileName": "video.mp4",
    "fileSize": 104857600,
    "duration": null,
    "resolution": null,
    "createdAt": "2026-01-22T10:00:00Z"
  }
}
```

---

### 16.2 외부 링크 콘텐츠 생성

**POST** `/contents/external-link`

**권한:** DESIGNER, OPERATOR, TENANT_ADMIN

**Request:**
```json
{
  "title": "외부 YouTube 강좌",
  "externalUrl": "https://youtube.com/watch?v=xxx",
  "folderId": 10
}
```

---

### 16.3 내 콘텐츠 목록 조회

**GET** `/contents/my?contentType=VIDEO&status=ACTIVE&keyword=react&folderId=10`

**권한:** DESIGNER

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 100,
        "status": "ACTIVE",
        "contentType": "VIDEO",
        "originalFileName": "react-intro.mp4",
        "fileSize": 104857600,
        "duration": 3600,
        "resolution": "1080p",
        "createdAt": "2026-01-22T10:00:00Z"
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, "totalElements": 50 }
  }
}
```

---

### 16.4 콘텐츠 스트리밍/다운로드

**GET** `/contents/{contentId}/stream`

**권한:** DESIGNER, OPERATOR, TENANT_ADMIN

**Response:** `video/mp4` (스트리밍)

**GET** `/contents/{contentId}/download`

**Response:** `application/octet-stream` (다운로드)

---

## 🏆 수료증 API (Certificate Management)

### 17.1 수료증 발급

**POST** `/enrollments/{enrollmentId}/certificate`

**권한:** 인증된 사용자 (본인 수강)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 500,
    "certificateNumber": "CERT-2026-000500",
    "userName": "홍길동",
    "courseTitle": "React 완벽 가이드",
    "status": "ISSUED",
    "issuedAt": "2026-01-22T15:00:00Z",
    "expiresAt": "2027-01-22T15:00:00Z"
  }
}
```

---

### 17.2 내 수료증 목록 조회

**GET** `/users/me/certificates`

**권한:** 인증된 사용자

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 500,
      "certificateNumber": "CERT-2026-000500",
      "courseTitle": "React 완벽 가이드",
      "completedAt": "2026-01-22T14:00:00Z",
      "issuedAt": "2026-01-22T15:00:00Z",
      "expiresAt": "2027-01-22T15:00:00Z"
    }
  ]
}
```

---

### 17.3 수료증 다운로드

**GET** `/certificates/{id}/download`

**권한:** 인증된 사용자 (본인 수료증)

**Response:** `application/pdf`

---

### 17.4 수료증 진위 확인 (공개)

**GET** `/certificates/verify/{certificateNumber}`

**권한:** 인증 불필요

**Response 200:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificateNumber": "CERT-2026-000500",
    "userName": "홍길동",
    "courseTitle": "React 완벽 가이드",
    "issuedAt": "2026-01-22T15:00:00Z",
    "status": "VALID"
  }
}
```

---

## 🛒 장바구니/위시리스트 API (Cart & Wishlist)

### 18.1 장바구니 조회

**GET** `/cart`

**권한:** 인증된 사용자

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "courseTimeId": 100,
        "courseTitle": "React 완벽 가이드",
        "timeName": "2026년 1기",
        "price": 50000,
        "addedAt": "2026-01-22T10:00:00Z"
      }
    ],
    "totalPrice": 50000,
    "itemCount": 1
  }
}
```

---

### 18.2 장바구니에 항목 추가

**POST** `/cart/items`

**권한:** 인증된 사용자

**Request:**
```json
{
  "courseTimeId": 100
}
```

---

### 18.3 장바구니에서 항목 삭제

**DELETE** `/cart/items/{courseTimeId}`

**권한:** 인증된 사용자

---

## 🎓 알림 템플릿 API (Notification Template)

### 19.1 알림 템플릿 목록 조회

**GET** `/ta/notification-templates?category=ENROLLMENT`

**권한:** TENANT_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "triggerType": "ENROLLMENT_APPROVED",
      "category": "ENROLLMENT",
      "name": "수강 승인 알림",
      "titleTemplate": "{{courseName}} 수강이 승인되었습니다",
      "messageTemplate": "{{userName}}님, {{courseName}} 강의 수강이 승인되었습니다.",
      "isActive": true
    }
  ]
}
```

---

### 19.2 알림 템플릿 초기화

**POST** `/ta/notification-templates/initialize`

**권한:** TENANT_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "initializedCount": 15,
    "templates": [ ... ]
  }
}
```

---

## 📊 분석 API (Analytics)

### 20.1 TA 분석 로그 조회

**GET** `/admin/analytics/logs?type=LOGIN&page=0&size=20`

**권한:** TENANT_ADMIN

---

### 20.2 활동 통계 조회

**GET** `/admin/analytics/stats?days=30`

**권한:** TENANT_ADMIN

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalActivities": 5000,
    "uniqueUsers": 450,
    "byType": {
      "LOGIN": 2000,
      "COURSE_VIEW": 1500,
      "ENROLLMENT": 500
    },
    "dailyTrend": [
      { "date": "2026-01-22", "count": 200 },
      { "date": "2026-01-21", "count": 180 }
    ]
  }
}
```

---

### 20.3 리포트 내보내기

**GET** `/admin/analytics/reports/export?type=ENROLLMENT&format=CSV&startDate=2026-01-01&endDate=2026-01-31`

**권한:** TENANT_ADMIN, OPERATOR

**Response:** `text/csv`

---

## 🌐 Public API (인증 불필요)

### 21.1 학습자용 차수 목록 조회

**GET** `/public/course-times?status=RECRUITING&categoryId=1&keyword=react`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 100,
        "courseId": 10,
        "courseTitle": "React 완벽 가이드",
        "timeName": "2026년 1기",
        "deliveryType": "ONLINE",
        "status": "RECRUITING",
        "enrollStartDate": "2026-01-01",
        "enrollEndDate": "2026-01-31",
        "classStartDate": "2026-02-01",
        "price": 50000,
        "capacity": 100,
        "currentEnrollment": 45
      }
    ],
    "pageable": { "pageNumber": 0, "pageSize": 20, "totalElements": 50 }
  }
}
```

---

### 21.2 테넌트 브랜딩 조회 (공개)

**GET** `/tenant/settings/branding`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logoUrl": "https://storage.example.com/logo.png",
    "primaryColor": "#2563eb",
    "secondaryColor": "#1e40af",
    "platformName": "MZC Learning"
  }
}
```

---

### 21.3 활성 배너 조회 (공개)

**GET** `/banners/public/displayable/MAIN_TOP`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "신규 강의 오픈!",
      "imageUrl": "https://storage.example.com/banner1.jpg",
      "linkUrl": "/tu/courses/100",
      "position": "MAIN_TOP"
    }
  ]
}
```

---

## 🚫 에러 코드

### 인증 (AUTH)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| AUTH_001 | 이메일 또는 비밀번호가 잘못되었습니다 | 401 |
| AUTH_002 | 토큰이 만료되었습니다 | 401 |
| AUTH_003 | 유효하지 않은 토큰입니다 | 401 |
| AUTH_004 | 권한이 없습니다 | 403 |

### 사용자 (USER)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| USER_001 | 이미 존재하는 이메일입니다 | 400 |
| USER_002 | 사용자를 찾을 수 없습니다 | 404 |
| USER_003 | 비활성화된 사용자입니다 | 403 |

### 수강 신청 (ENROLL)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| ENROLL_001 | 정원이 마감되었습니다 | 400 |
| ENROLL_002 | 이미 신청한 차수입니다 | 400 |
| ENROLL_003 | 수강 신청 기간이 아닙니다 | 400 |
| ENROLL_004 | 결제가 필요합니다 | 402 |

### 강의 (COURSE)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| COURSE_001 | 강의를 찾을 수 없습니다 | 404 |
| COURSE_002 | 커리큘럼이 완성되지 않았습니다 | 400 |
| COURSE_003 | 강의 수정 권한이 없습니다 | 403 |

### 공지사항 (NOTICE)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| NOTICE_001 | 공지사항을 찾을 수 없습니다 | 404 |
| NOTICE_002 | 공지사항 수정 권한이 없습니다 | 403 |
| NOTICE_003 | 이미 배포된 공지사항입니다 | 400 |
| NOTICE_004 | 공지 기간이 유효하지 않습니다 | 400 |

### 자동수강규칙 (AUTO_ENROLL)
| 코드 | 메시지 | HTTP 상태 |
|------|--------|-----------|
| AUTO_ENROLL_001 | 규칙을 찾을 수 없습니다 | 404 |
| AUTO_ENROLL_002 | 규칙 수정 권한이 없습니다 | 403 |
| AUTO_ENROLL_003 | 이미 활성화된 규칙입니다 | 400 |
| AUTO_ENROLL_004 | 조건 설정이 유효하지 않습니다 | 400 |
| AUTO_ENROLL_005 | 대상 차수가 존재하지 않습니다 | 400 |

---

## 📌 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "선택적 메시지"
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": [ ... ]
  }
}
```

### 페이징 응답
```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 20,
      "totalElements": 150,
      "totalPages": 8,
      "first": true,
      "last": false
    }
  }
}
```

---

## 🔧 개발 참고사항

### Rate Limiting
- 기본: 100 requests/분
- 인증 API: 10 requests/분

### CORS
- 로컬: `http://localhost:5173`
- Dev: `https://dev.mzc-learning.com`
- Prod: `https://mzc-learning.com`

### 파일 업로드
- 최대 크기: 10MB
- 허용 형식: PDF, DOCX, ZIP, JPG, PNG, MP4

---

**최종 업데이트**: 2026-01-23
**버전**: 2.0.0

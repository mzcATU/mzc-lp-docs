# Course API 명세

> CM (Course Matrix) + CR (Course Relation) 모듈 API

---

## 1. 강의 (Course) API

### 1.1 강의 생성

```http
POST /api/courses
Content-Type: application/json
```

**Request Body**:
```json
{
  "courseName": "React 기초 과정",
  "instructorId": 1
}
```

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseName": "React 기초 과정",
    "instructorId": 1,
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 1.2 강의 목록 조회

```http
GET /api/courses
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "courseId": 1,
      "courseName": "React 기초 과정",
      "instructorId": 1,
      "itemCount": 5,
      "createdAt": "2025-01-15T10:00:00"
    }
  ]
}
```

### 1.3 강의 상세 조회

```http
GET /api/courses/{courseId}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseName": "React 기초 과정",
    "instructorId": 1,
    "items": [],
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 1.4 강의 수정

```http
PUT /api/courses/{courseId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "courseName": "React 심화 과정",
  "instructorId": 2
}
```

### 1.5 강의 삭제

```http
DELETE /api/courses/{courseId}
```

**Response** (`204 No Content`)

---

## 2. 차시/폴더 (CourseItem) API

### 2.1 차시 추가

```http
POST /api/courses/{courseId}/items
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemName": "1-1. 환경설정",
  "parentId": 1,
  "learningObjectId": 10
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| itemName | String | O | 차시 이름 |
| parentId | Long | X | 부모 폴더 ID (NULL이면 최상위) |
| learningObjectId | Long | O | 학습객체 ID |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "itemId": 2,
    "itemName": "1-1. 환경설정",
    "depth": 1,
    "parentId": 1,
    "learningObjectId": 10,
    "isFolder": false
  }
}
```

### 2.2 폴더 생성

```http
POST /api/courses/{courseId}/folders
Content-Type: application/json
```

**Request Body**:
```json
{
  "folderName": "1주차",
  "parentId": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| folderName | String | O | 폴더 이름 |
| parentId | Long | X | 부모 폴더 ID (NULL이면 최상위) |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "itemId": 1,
    "itemName": "1주차",
    "depth": 0,
    "parentId": null,
    "learningObjectId": null,
    "isFolder": true
  }
}
```

### 2.3 항목 삭제

```http
DELETE /api/courses/items/{itemId}
```

**Response** (`204 No Content`)

> 폴더 삭제 시 하위 항목도 함께 삭제됨

### 2.4 계층 구조 조회

```http
GET /api/courses/{courseId}/items/hierarchy
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "itemId": 1,
      "itemName": "1주차",
      "depth": 0,
      "isFolder": true,
      "children": [
        {
          "itemId": 2,
          "itemName": "1-1. 환경설정",
          "depth": 1,
          "isFolder": false,
          "learningObjectId": 10,
          "children": []
        },
        {
          "itemId": 3,
          "itemName": "1-2. 기본 문법",
          "depth": 1,
          "isFolder": false,
          "learningObjectId": 11,
          "children": []
        }
      ]
    }
  ]
}
```

### 2.5 항목 이름 변경

```http
PATCH /api/courses/{courseId}/items/{itemId}/name
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemName": "1-1. 개발환경 설정"
}
```

---

## 3. 학습 순서 (CourseRelation) API

### 3.1 학습 순서 설정

```http
POST /api/courses/{courseId}/relations
Content-Type: application/json
```

**Request Body**:
```json
{
  "relations": [
    { "fromItemId": null, "toItemId": 2 },
    { "fromItemId": 2, "toItemId": 3 },
    { "fromItemId": 3, "toItemId": 5 }
  ]
}
```

> `fromItemId = null`인 항목이 시작점

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "relationCount": 3,
    "startItemId": 2
  }
}
```

### 3.2 학습 순서 조회

```http
GET /api/courses/{courseId}/relations
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "orderedItems": [
      { "itemId": 2, "itemName": "1-1. 환경설정", "order": 1 },
      { "itemId": 3, "itemName": "1-2. 기본 문법", "order": 2 },
      { "itemId": 5, "itemName": "2-1. 컴포넌트", "order": 3 }
    ],
    "relations": [
      { "relationId": 1, "fromItemId": null, "toItemId": 2 },
      { "relationId": 2, "fromItemId": 2, "toItemId": 3 },
      { "relationId": 3, "fromItemId": 3, "toItemId": 5 }
    ]
  }
}
```

### 3.3 학습 순서 수정

```http
PUT /api/courses/{courseId}/relations
Content-Type: application/json
```

**Request Body**:
```json
{
  "relations": [
    { "fromItemId": null, "toItemId": 3 },
    { "fromItemId": 3, "toItemId": 2 },
    { "fromItemId": 2, "toItemId": 5 }
  ]
}
```

> 기존 순서 전체 삭제 후 새로 설정

### 3.4 순서 연결 삭제

```http
DELETE /api/courses/{courseId}/relations/{relationId}
```

### 3.5 자동 순서 생성

```http
POST /api/courses/{courseId}/relations/auto
```

> depth 순서대로 자동으로 학습 순서 생성

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "relationCount": 4,
    "message": "자동 순서 생성 완료"
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
| ITEM_NOT_FOUND | 404 | 차시/폴더 없음 |
| INVALID_PARENT | 400 | 잘못된 부모 폴더 |
| MAX_DEPTH_EXCEEDED | 400 | 최대 깊이(10) 초과 |
| CIRCULAR_RELATION | 400 | 순환 참조 감지 |
| LEARNING_OBJECT_NOT_FOUND | 404 | 학습객체 없음 |

---

## 5. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/course/
├── controller/
│   ├── CourseController.java
│   └── CourseRelationController.java
├── service/
│   ├── CourseService.java
│   └── CourseRelationService.java
├── repository/
│   ├── CourseRepository.java
│   ├── CourseItemRepository.java
│   └── CourseRelationRepository.java
└── dto/
    ├── request/
    └── response/
```

---

## 6. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Course DB 스키마 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [learning/api.md](../learning/api.md) | LearningObject API |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

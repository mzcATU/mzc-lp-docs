# Course API 명세

> CM (Course Matrix) + CR (Course Relation) 모듈 API

---

## 1. 강의 (Course) API

### 1.1 강의 생성

```http
POST /api/courses
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

**Request Body**:
```json
{
  "title": "React 기초 과정",
  "description": "React의 기본 개념을 학습합니다.",
  "level": "BEGINNER",
  "type": "ONLINE",
  "estimatedHours": 10,
  "categoryId": 1,
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "tags": ["React", "Frontend", "입문"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | String | O | 강의명 (최대 255자) |
| description | String | X | 강의 설명 |
| level | String | X | 난이도 (BEGINNER, INTERMEDIATE, ADVANCED) |
| type | String | X | 유형 (ONLINE, OFFLINE, BLENDED) |
| estimatedHours | Integer | X | 예상 학습 시간 |
| categoryId | Long | X | 카테고리 ID |
| thumbnailUrl | String | X | 썸네일 URL |
| tags | String[] | X | 태그 목록 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "title": "React 기초 과정",
    "description": "React의 기본 개념을 학습합니다.",
    "level": "BEGINNER",
    "type": "ONLINE",
    "status": "DRAFT",
    "estimatedHours": 10,
    "categoryId": 1,
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "tags": ["React", "Frontend", "입문"],
    "createdBy": 100,
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 1.2 강의 목록 조회

```http
GET /api/courses
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| keyword | String | X | 강의명 검색 |
| categoryId | Long | X | 카테고리 ID 필터 |
| status | String | X | 상태 필터 (DRAFT, READY, REGISTERED) |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "courseId": 1,
        "title": "React 기초 과정",
        "description": "React의 기본 개념을 학습합니다.",
        "level": "BEGINNER",
        "type": "ONLINE",
        "status": "DRAFT",
        "itemCount": 5,
        "tags": ["React", "Frontend"],
        "createdBy": 100,
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

### 1.3 내 강의 목록 조회

```http
GET /api/courses/my
Authorization: Bearer {accessToken}
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

> 로그인한 사용자가 생성한 강의 목록 조회

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`): 목록 조회와 동일한 형식

### 1.4 강의 상세 조회

```http
GET /api/courses/{courseId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "title": "React 기초 과정",
    "description": "React의 기본 개념을 학습합니다.",
    "level": "BEGINNER",
    "type": "ONLINE",
    "status": "DRAFT",
    "estimatedHours": 10,
    "categoryId": 1,
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "tags": ["React", "Frontend", "입문"],
    "items": [],
    "createdBy": 100,
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 1.5 강의 수정

```http
PUT /api/courses/{courseId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

> DRAFT, READY 상태에서만 수정 가능

**Request Body**:
```json
{
  "title": "React 심화 과정",
  "description": "React 심화 내용을 학습합니다.",
  "level": "INTERMEDIATE",
  "type": "ONLINE",
  "estimatedHours": 20,
  "categoryId": 1,
  "thumbnailUrl": "https://example.com/thumbnail2.jpg",
  "tags": ["React", "Frontend", "심화"]
}
```

**Response** (`200 OK`): 생성 응답과 동일한 형식

### 1.6 강의 삭제

```http
DELETE /api/courses/{courseId}
Authorization: Bearer {accessToken}
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

**Response** (`204 No Content`)

---

## 2. 강의 상태 관리 API

### 2.1 상태 전이 다이어그램

```
DRAFT ──ready()──► READY ──register()──► REGISTERED
  ▲                  │
  └──unready()───────┘
```

| 상태 | 설명 | 수정 가능 | 차수 생성 |
|------|------|:--------:|:--------:|
| DRAFT | 작성중 | O | X |
| READY | 작성완료 | O | X |
| REGISTERED | 등록됨 | X | O |

### 2.2 작성완료 (DRAFT → READY)

```http
POST /api/courses/{courseId}/ready
Authorization: Bearer {accessToken}
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "title": "React 기초 과정",
    "status": "READY",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

### 2.3 작성중으로 변경 (READY → DRAFT)

```http
POST /api/courses/{courseId}/unready
Authorization: Bearer {accessToken}
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

**Response** (`200 OK`): 위와 동일한 형식 (status: "DRAFT")

### 2.4 등록 (READY → REGISTERED)

```http
POST /api/courses/{courseId}/register
Authorization: Bearer {accessToken}
```

**권한**: `DESIGNER`, `OPERATOR`, `TENANT_ADMIN`

> 등록 후에는 되돌릴 수 없음

**Response** (`200 OK`): 위와 동일한 형식 (status: "REGISTERED")

### 2.5 (Deprecated) 발행/발행취소

```http
POST /api/courses/{courseId}/publish      # deprecated, use /ready
POST /api/courses/{courseId}/unpublish    # deprecated, use /unready
```

> 하위 호환성을 위해 유지, `/ready`, `/unready` 사용 권장

---

## 3. 차시/폴더 (CourseItem) API

### 3.1 차시 추가

```http
POST /api/courses/{courseId}/items
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemName": "1-1. 환경설정",
  "parentId": 1,
  "learningObjectId": 10,
  "displayName": "개발 환경 구축하기",
  "description": "VS Code, Node.js 설치 및 설정"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| itemName | String | O | 차시 이름 |
| parentId | Long | X | 부모 폴더 ID (NULL이면 최상위) |
| learningObjectId | Long | O | 학습객체 ID |
| displayName | String | X | 표시명 (커스텀) |
| description | String | X | 차시 설명 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "itemId": 2,
    "itemName": "1-1. 환경설정",
    "displayName": "개발 환경 구축하기",
    "description": "VS Code, Node.js 설치 및 설정",
    "depth": 1,
    "parentId": 1,
    "learningObjectId": 10,
    "isFolder": false
  }
}
```

### 3.2 폴더 생성

```http
POST /api/courses/{courseId}/folders
Authorization: Bearer {accessToken}
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

### 3.3 항목 삭제

```http
DELETE /api/courses/{courseId}/items/{itemId}
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

> 폴더 삭제 시 하위 항목도 함께 삭제됨

### 3.4 계층 구조 조회

```http
GET /api/courses/{courseId}/items/hierarchy
Authorization: Bearer {accessToken}
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
          "displayName": "개발 환경 구축하기",
          "description": "VS Code, Node.js 설치",
          "depth": 1,
          "isFolder": false,
          "learningObjectId": 10,
          "children": []
        }
      ]
    }
  ]
}
```

### 3.5 순서대로 항목 조회

```http
GET /api/courses/{courseId}/items/ordered
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "itemId": 2,
      "itemName": "1-1. 환경설정",
      "displayName": "개발 환경 구축하기",
      "order": 1,
      "learningObjectId": 10,
      "isFolder": false
    }
  ]
}
```

> CourseRelation 기반으로 학습 순서대로 정렬된 차시 목록 반환

### 3.6 항목 이동

```http
PUT /api/courses/{courseId}/items/move
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemId": 3,
  "targetParentId": 2,
  "targetIndex": 0
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| itemId | Long | O | 이동할 항목 ID |
| targetParentId | Long | X | 이동할 부모 폴더 ID (NULL이면 최상위) |
| targetIndex | Int | X | 형제 항목 내 순서 (0부터 시작) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "itemId": 3,
    "itemName": "1-2. 기본 문법",
    "parentId": 2,
    "depth": 1
  }
}
```

### 3.7 항목 이름 변경

```http
PATCH /api/courses/{courseId}/items/{itemId}/name
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "itemName": "1-1. 개발환경 설정"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "itemId": 2,
    "itemName": "1-1. 개발환경 설정",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

### 3.8 차시 표시 정보 변경

```http
PATCH /api/courses/{courseId}/items/{itemId}/display-info
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "displayName": "새로운 표시명",
  "description": "새로운 설명"
}
```

> 폴더가 아닌 차시 항목에만 적용 가능

### 3.9 차시 LearningObject 변경

```http
PATCH /api/courses/{courseId}/items/{itemId}/learning-object
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "learningObjectId": 15
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| learningObjectId | Long | O | 새로 연결할 학습객체 ID |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "itemId": 2,
    "itemName": "1-1. 환경설정",
    "learningObjectId": 15,
    "updatedAt": "2025-01-15T11:30:00"
  }
}
```

> 폴더가 아닌 차시 항목에만 적용 가능

---

## 4. 학습 순서 (CourseRelation) API

### 4.1 학습 순서 설정

```http
POST /api/courses/{courseId}/relations
Authorization: Bearer {accessToken}
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

### 4.2 학습 순서 조회

```http
GET /api/courses/{courseId}/relations
Authorization: Bearer {accessToken}
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

### 4.3 학습 순서 수정

```http
PUT /api/courses/{courseId}/relations
Authorization: Bearer {accessToken}
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

### 4.4 순서 연결 삭제

```http
DELETE /api/courses/{courseId}/relations/{relationId}
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

### 4.5 시작점 설정

```http
PUT /api/courses/{courseId}/relations/start
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "startItemId": 3
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| startItemId | Long | O | 시작점으로 설정할 차시 ID |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "startItemId": 3,
    "message": "시작점이 변경되었습니다."
  }
}
```

> 기존 시작점(fromItemId=null)을 새 차시로 변경

### 4.6 자동 순서 생성

```http
POST /api/courses/{courseId}/relations/auto
Authorization: Bearer {accessToken}
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

## 5. 에러 응답

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
| COURSE_ITEM_NOT_FOUND | 404 | 차시/폴더 없음 |
| COURSE_NOT_MODIFIABLE | 400 | REGISTERED 상태에서 수정 시도 |
| INVALID_STATUS_TRANSITION | 400 | 잘못된 상태 전이 |
| INVALID_PARENT | 400 | 잘못된 부모 폴더 |
| MAX_DEPTH_EXCEEDED | 400 | 최대 깊이(10) 초과 |
| CIRCULAR_REFERENCE | 400 | 순환 참조 감지 |
| LEARNING_OBJECT_NOT_FOUND | 404 | 학습객체 없음 |
| COURSE_OWNERSHIP_EXCEPTION | 403 | 강의 소유권 없음 |

---

## 6. 소스 위치

```
mzc-lp-backend/src/main/java/com/mzc/lp/domain/course/
├── constant/
│   ├── CourseStatus.java          # DRAFT, READY, REGISTERED
│   ├── CourseLevel.java           # BEGINNER, INTERMEDIATE, ADVANCED
│   └── CourseType.java            # ONLINE, OFFLINE, BLENDED
├── controller/
│   ├── CourseController.java
│   ├── CourseItemController.java
│   └── CourseRelationController.java
├── service/
│   ├── CourseService.java
│   ├── CourseItemService.java
│   └── CourseRelationService.java
├── repository/
│   ├── CourseRepository.java
│   ├── CourseItemRepository.java
│   └── CourseRelationRepository.java
├── entity/
│   ├── Course.java
│   ├── CourseItem.java
│   └── CourseRelation.java
├── dto/
│   ├── request/
│   └── response/
└── exception/
    ├── CourseNotFoundException.java
    ├── CourseItemNotFoundException.java
    ├── CourseNotModifiableException.java
    └── ...
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Course DB 스키마 |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [learning/api.md](../learning/api.md) | LearningObject API |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

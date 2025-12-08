# Learning Object API 명세

> LO (Learning Object) 모듈 API

---

## 1. 학습객체 (LearningObject) API

### 1.1 학습객체 목록 조회

```http
GET /api/learning-objects
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| folderId | Long | X | 폴더 ID (미지정 시 전체) |
| keyword | String | X | 이름 검색 |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "learningObjectId": 1,
        "name": "react-tutorial.mp4",
        "contentId": 10,
        "contentType": "VIDEO",
        "duration": 1800,
        "resolution": "1920x1080",
        "folderId": 1,
        "folderName": "교육자료",
        "createdAt": "2025-01-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### 1.2 학습객체 상세 조회

```http
GET /api/learning-objects/{learningObjectId}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "learningObjectId": 1,
    "name": "react-tutorial.mp4",
    "content": {
      "contentId": 10,
      "originalFileName": "react-tutorial.mp4",
      "contentType": "VIDEO",
      "fileSize": 104857600,
      "duration": 1800,
      "resolution": "1920x1080"
    },
    "folder": {
      "folderId": 1,
      "folderName": "교육자료",
      "depth": 0
    },
    "createdAt": "2025-01-15T10:00:00",
    "updatedAt": "2025-01-15T10:00:00"
  }
}
```

### 1.3 학습객체 수정

```http
PUT /api/learning-objects/{learningObjectId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "React 기초 튜토리얼 (수정됨)"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "learningObjectId": 1,
    "name": "React 기초 튜토리얼 (수정됨)",
    "updatedAt": "2025-01-15T11:00:00"
  }
}
```

### 1.4 학습객체 삭제

```http
DELETE /api/learning-objects/{learningObjectId}
```

**Response** (`204 No Content`)

> 연결된 Content는 유지됨 (LO만 삭제)

### 1.5 학습객체 폴더 이동

```http
POST /api/learning-objects/{learningObjectId}/move
Content-Type: application/json
```

**Request Body**:
```json
{
  "targetFolderId": 2
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| targetFolderId | Long | X | 이동할 폴더 ID (NULL이면 최상위) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "learningObjectId": 1,
    "name": "react-tutorial.mp4",
    "folderId": 2,
    "folderName": "2025년 자료"
  }
}
```

---

## 2. 콘텐츠 폴더 (ContentFolder) API

### 2.1 폴더 생성

```http
POST /api/content-folders
Content-Type: application/json
```

**Request Body**:
```json
{
  "folderName": "2025년 자료",
  "parentId": 1
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
    "folderId": 3,
    "folderName": "2025년 자료",
    "parentId": 1,
    "depth": 1,
    "createdAt": "2025-01-15T10:00:00"
  }
}
```

### 2.2 폴더 목록 조회

```http
GET /api/content-folders
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| parentId | Long | X | 부모 폴더 ID (미지정 시 최상위) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "folderId": 1,
      "folderName": "교육자료",
      "parentId": null,
      "depth": 0,
      "childCount": 2,
      "itemCount": 5
    },
    {
      "folderId": 2,
      "folderName": "실습자료",
      "parentId": null,
      "depth": 0,
      "childCount": 0,
      "itemCount": 3
    }
  ]
}
```

### 2.3 폴더 트리 구조 조회

```http
GET /api/content-folders/tree
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "folderId": 1,
      "folderName": "교육자료",
      "depth": 0,
      "children": [
        {
          "folderId": 3,
          "folderName": "2024년",
          "depth": 1,
          "children": [
            {
              "folderId": 5,
              "folderName": "1분기",
              "depth": 2,
              "children": []
            }
          ]
        },
        {
          "folderId": 4,
          "folderName": "2025년",
          "depth": 1,
          "children": []
        }
      ]
    },
    {
      "folderId": 2,
      "folderName": "실습자료",
      "depth": 0,
      "children": []
    }
  ]
}
```

### 2.4 폴더 수정

```http
PUT /api/content-folders/{folderId}
Content-Type: application/json
```

**Request Body**:
```json
{
  "folderName": "교육자료 (Archive)"
}
```

### 2.5 폴더 삭제

```http
DELETE /api/content-folders/{folderId}
```

**Response** (`204 No Content`)

> 하위 폴더 및 학습객체도 함께 삭제됨 (CASCADE)

---

## 3. 자동 생성 (Event 기반)

### Content 업로드 시 LO 자동 생성

```
┌─────────────────────────────────────────────────────────┐
│  1. POST /api/contents/upload                           │
│                    ↓                                    │
│  2. ContentCreatedEvent 발행                            │
│                    ↓                                    │
│  3. LearningObjectEventListener.handleContentCreated()  │
│                    ↓                                    │
│  4. LearningObject 자동 생성                            │
│     - name = content.originalFileName                  │
│     - content 연결                                      │
│     - folder = 지정된 폴더 또는 최상위                  │
└─────────────────────────────────────────────────────────┘
```

### EventListener 코드

```java
@Component
public class LearningObjectEventListener {

    @TransactionalEventListener
    public void handleContentCreated(ContentCreatedEvent event) {
        Content content = event.getContent();

        LearningObject lo = LearningObject.builder()
            .name(content.getOriginalFileName())
            .content(content)
            .folder(event.getTargetFolder())  // nullable
            .build();

        learningObjectRepository.save(lo);
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
    "code": "LEARNING_OBJECT_NOT_FOUND",
    "message": "학습객체를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| LEARNING_OBJECT_NOT_FOUND | 404 | 학습객체 없음 |
| FOLDER_NOT_FOUND | 404 | 폴더 없음 |
| MAX_DEPTH_EXCEEDED | 400 | 최대 깊이(3) 초과 |
| FOLDER_NOT_EMPTY | 400 | 폴더에 하위 항목 존재 |
| DUPLICATE_FOLDER_NAME | 400 | 동일 이름 폴더 존재 |

---

## 5. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/learning/
├── controller/
│   ├── LearningObjectController.java
│   └── ContentFolderController.java
├── service/
│   ├── LearningObjectService.java
│   └── ContentFolderService.java
├── repository/
│   ├── LearningObjectRepository.java
│   └── ContentFolderRepository.java
├── entity/
│   ├── LearningObject.java
│   └── ContentFolder.java
├── dto/
│   ├── request/
│   └── response/
└── event/
    └── LearningObjectEventListener.java
```

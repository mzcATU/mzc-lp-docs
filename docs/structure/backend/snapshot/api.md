# Snapshot API 명세

> 스냅샷(개설 강의) 모듈 API

---

## Base URL

```
/api/snapshots
/api/courses/{courseId}/snapshots
```

---

## 엔드포인트 목록

### 스냅샷 CRUD

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/courses/{courseId}/snapshots` | Course(템플릿)에서 스냅샷 생성 |
| POST | `/api/snapshots` | 신규 스냅샷 직접 생성 |
| GET | `/api/snapshots` | 스냅샷 목록 조회 |
| GET | `/api/snapshots/{snapshotId}` | 스냅샷 상세 조회 |
| GET | `/api/courses/{courseId}/snapshots` | Course의 스냅샷 목록 |
| PUT | `/api/snapshots/{snapshotId}` | 스냅샷 수정 |
| DELETE | `/api/snapshots/{snapshotId}` | 스냅샷 삭제 |

### 상태 변경

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/snapshots/{snapshotId}/publish` | 발행 (DRAFT → ACTIVE) |
| POST | `/api/snapshots/{snapshotId}/complete` | 완료 (ACTIVE → COMPLETED) |
| POST | `/api/snapshots/{snapshotId}/archive` | 보관 (COMPLETED → ARCHIVED) |

### 아이템 API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/snapshots/{snapshotId}/items` | 계층 구조 조회 |
| GET | `/api/snapshots/{snapshotId}/items/flat` | 평면 목록 조회 |
| POST | `/api/snapshots/{snapshotId}/items` | 아이템 추가 |
| PUT | `/api/snapshots/{snapshotId}/items/{itemId}` | 아이템 수정 |
| PUT | `/api/snapshots/{snapshotId}/items/{itemId}/move` | 아이템 이동 |
| DELETE | `/api/snapshots/{snapshotId}/items/{itemId}` | 아이템 삭제 |

### 학습경로 API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/snapshots/{snapshotId}/relations` | 연결 목록 조회 |
| GET | `/api/snapshots/{snapshotId}/relations/ordered` | 순서대로 아이템 조회 |
| POST | `/api/snapshots/{snapshotId}/relations` | 연결 생성 |
| PUT | `/api/snapshots/{snapshotId}/relations/start` | 시작점 설정 |
| DELETE | `/api/snapshots/{snapshotId}/relations/{relationId}` | 연결 삭제 |

---

## 엔드포인트 상세

### 1. Course에서 스냅샷 생성

Course(템플릿)로부터 스냅샷을 생성합니다. 구조와 콘텐츠 메타데이터가 깊은 복사됩니다.

**Request**
```
POST /api/courses/{courseId}/snapshots?createdBy=1
```

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "snapshotId": 1,
    "snapshotName": "Spring Boot 입문",
    "sourceCourseId": 1,
    "sourceCourseName": "Spring Boot 입문",
    "createdBy": 1,
    "status": "DRAFT",
    "version": 1,
    "items": [...],
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00"
  }
}
```

---

### 2. 신규 스냅샷 직접 생성

템플릿 없이 새 스냅샷을 생성합니다.

**Request**
```
POST /api/snapshots
Content-Type: application/json
```

```json
{
  "snapshotName": "새 강의",
  "createdBy": 1,
  "description": "강의 설명",
  "hashtags": "#spring #java"
}
```

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "snapshotId": 2,
    "snapshotName": "새 강의",
    "sourceCourseId": null,
    "sourceCourseName": null,
    "createdBy": 1,
    "status": "DRAFT",
    "version": 1,
    "items": [],
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00"
  }
}
```

---

### 3. 스냅샷 목록 조회

**Request**
```
GET /api/snapshots
GET /api/snapshots?status=ACTIVE
GET /api/snapshots?createdBy=1
```

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| status | SnapshotStatus | 상태별 필터 (DRAFT/ACTIVE/COMPLETED/ARCHIVED) |
| createdBy | Long | 생성자 ID로 필터 |

**Response** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "snapshotId": 1,
      "snapshotName": "Spring Boot 입문",
      "status": "ACTIVE",
      "itemCount": 5,
      "totalDuration": 3600,
      ...
    }
  ]
}
```

---

### 4. 스냅샷 상세 조회

**Request**
```
GET /api/snapshots/{snapshotId}
```

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "snapshotId": 1,
    "snapshotName": "Spring Boot 입문",
    "description": "설명",
    "hashtags": "#spring",
    "sourceCourseId": 1,
    "sourceCourseName": "Spring Boot 입문",
    "createdBy": 1,
    "status": "DRAFT",
    "version": 1,
    "tenantId": 1,
    "items": [...],
    "itemCount": 5,
    "totalDuration": 3600,
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00"
  }
}
```

---

### 5. 스냅샷 수정

**Request**
```
PUT /api/snapshots/{snapshotId}
Content-Type: application/json
```

```json
{
  "snapshotName": "새 이름",
  "description": "새 설명",
  "hashtags": "#updated"
}
```

**Response** (200 OK) - 수정된 스냅샷 반환

**제한**: DRAFT/ACTIVE 상태에서만 메타데이터 수정 가능

---

### 6. 상태 변경

**발행** (DRAFT → ACTIVE)
```
POST /api/snapshots/{snapshotId}/publish
```

**완료** (ACTIVE → COMPLETED)
```
POST /api/snapshots/{snapshotId}/complete
```

**보관** (COMPLETED → ARCHIVED)
```
POST /api/snapshots/{snapshotId}/archive
```

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "snapshotId": 1,
    "status": "ACTIVE",
    ...
  }
}
```

---

### 7. 아이템 추가

**Request**
```
POST /api/snapshots/{snapshotId}/items
Content-Type: application/json
```

```json
{
  "itemName": "1강. 환경설정",
  "parentId": null,
  "learningObjectId": 1,
  "itemType": "VIDEO"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| itemName | String | O | 항목 이름 |
| parentId | Long | - | 부모 폴더 ID |
| learningObjectId | Long | - | LO ID (NULL이면 폴더) |
| itemType | String | - | 콘텐츠 타입 (VIDEO/DOCUMENT 등) |

**Response** (201 Created)

**제한**: DRAFT 상태에서만 추가 가능

---

### 8. 아이템 이동

**Request**
```
PUT /api/snapshots/{snapshotId}/items/{itemId}/move
Content-Type: application/json
```

```json
{
  "newParentId": 5
}
```

**제한**: DRAFT 상태에서만 이동 가능

---

### 9. 학습경로 설정

**시작점 설정**
```
PUT /api/snapshots/{snapshotId}/relations/start
Content-Type: application/json
```

```json
{
  "itemId": 3
}
```

**연결 생성**
```
POST /api/snapshots/{snapshotId}/relations
Content-Type: application/json
```

```json
{
  "fromItemId": 3,
  "toItemId": 4
}
```

**순서대로 조회**
```
GET /api/snapshots/{snapshotId}/relations/ordered
```

**Response** (200 OK)
```json
{
  "success": true,
  "data": [
    { "seq": 1, "itemId": 3, "itemName": "1강. 환경설정" },
    { "seq": 2, "itemId": 4, "itemName": "2강. 기초 문법" },
    { "seq": 3, "itemId": 5, "itemName": "3강. 실습" }
  ]
}
```

---

## Response DTO 필드

### SnapshotResponse

| 필드 | 타입 | 설명 |
|------|------|------|
| snapshotId | Long | 스냅샷 ID |
| snapshotName | String | 스냅샷 이름 |
| description | String | 설명 |
| hashtags | String | 해시태그 |
| sourceCourseId | Long | 원본 Course ID (템플릿) |
| sourceCourseName | String | 원본 Course 이름 |
| createdBy | Long | 생성자 ID |
| status | String | 상태 (DRAFT/ACTIVE/COMPLETED/ARCHIVED) |
| version | Integer | 버전 |
| tenantId | Long | 테넌트 ID |
| items | Array | 아이템 목록 |
| itemCount | Long | 차시 수 (폴더 제외) |
| totalDuration | Long | 총 재생시간 (초) |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

### SnapshotItemResponse

| 필드 | 타입 | 설명 |
|------|------|------|
| itemId | Long | 아이템 ID |
| snapshotId | Long | 소속 스냅샷 ID |
| itemName | String | 항목 이름 |
| parentId | Long | 부모 항목 ID |
| depth | Integer | 깊이 (0부터) |
| isFolder | Boolean | 폴더 여부 |
| itemType | String | 콘텐츠 타입 |
| snapshotLearningObject | Object | 학습객체 정보 |
| children | Array | 자식 목록 (계층 조회 시) |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

### SnapshotLearningObjectResponse

| 필드 | 타입 | 설명 |
|------|------|------|
| snapshotLoId | Long | 스냅샷 LO ID |
| sourceLoId | Long | 원본 LO ID |
| contentId | Long | Content ID |
| displayName | String | 표시명 |
| duration | Integer | 재생시간 (초) |
| thumbnailUrl | String | 썸네일 URL |
| resolution | String | 해상도 |
| isCustomized | Boolean | 수정 여부 |

---

## 에러 응답

### 상태 제한 위반

```json
{
  "success": false,
  "error": {
    "code": "SNAPSHOT_STATE_ERROR",
    "message": "DRAFT 상태에서만 아이템을 추가할 수 있습니다."
  }
}
```

### 존재하지 않는 리소스

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "스냅샷을 찾을 수 없습니다. (id: 999)"
  }
}
```

---

## 소스 위치

- Controller:
  - `domain/snapshot/controller/SnapshotController.java`
  - `domain/snapshot/controller/SnapshotItemController.java`
  - `domain/snapshot/controller/SnapshotRelationController.java`
- Service:
  - `domain/snapshot/service/SnapshotService.java`
  - `domain/snapshot/service/SnapshotItemService.java`
  - `domain/snapshot/service/SnapshotRelationService.java`
- DTO: `domain/snapshot/dto/`

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Snapshot DB 스키마 |
| [course/api.md](../course/api.md) | Course(템플릿) API |
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |

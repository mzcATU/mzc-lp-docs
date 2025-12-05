# {Domain} API

> {도메인명} 도메인의 REST API 명세
> **이 파일을 복사하여 새 도메인 문서 생성**

---

## 엔드포인트 요약

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|:----:|
| GET | `/api/{domains}` | 목록 조회 | ✅ |
| GET | `/api/{domains}/{id}` | 단건 조회 | ✅ |
| POST | `/api/{domains}` | 생성 | ✅ |
| PUT | `/api/{domains}/{id}` | 수정 | ✅ |
| DELETE | `/api/{domains}/{id}` | 삭제 | ✅ |

---

## API 상세

### 목록 조회

```http
GET /api/{domains}
Authorization: Bearer {token}

Query Parameters:
- page (optional): 페이지 번호 (default: 0)
- size (optional): 페이지 크기 (default: 20)
- sort (optional): 정렬 (예: createdAt,desc)
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "field1": "value1",
        "createdAt": "2025-01-01T00:00:00"
      }
    ],
    "totalElements": 100,
    "totalPages": 5
  }
}
```

---

### 단건 조회

```http
GET /api/{domains}/{id}
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "field1": "value1",
    "field2": "value2",
    "createdAt": "2025-01-01T00:00:00"
  }
}
```

**Error Response (404 Not Found)**
```json
{
  "success": false,
  "errorCode": "DOMAIN_NOT_FOUND",
  "message": "{Domain}을(를) 찾을 수 없습니다."
}
```

---

### 생성

```http
POST /api/{domains}
Authorization: Bearer {token}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

**Request Body**
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| field1 | String | ✅ | 필드1 설명 |
| field2 | String | | 필드2 설명 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "field1": "value1",
    "field2": "value2"
  }
}
```

---

### 수정

```http
PUT /api/{domains}/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "field1": "updated_value1"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "field1": "updated_value1",
    "updatedAt": "2025-01-02T00:00:00"
  }
}
```

---

### 삭제

```http
DELETE /api/{domains}/{id}
Authorization: Bearer {token}
```

**Response (204 No Content)**
```
(No body)
```

---

## 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| DOMAIN_NOT_FOUND | 404 | 리소스를 찾을 수 없음 |
| DOMAIN_ALREADY_EXISTS | 409 | 이미 존재함 |
| INVALID_DOMAIN_STATUS | 400 | 잘못된 상태 |

---

## 관련 문서

- [DB 스키마](./db.md)
- [API 컨텍스트](../../context/api.md)

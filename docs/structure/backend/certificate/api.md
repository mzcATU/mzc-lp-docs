# Certificate API 명세

> 수료증 발급/조회/검증 API

---

## 1. 수료증 발급 API

### 1.1 수료증 발급 요청

> 수강 완료된 강의에 대해 수료증 발급

```http
POST /api/enrollments/{enrollmentId}/certificate
Authorization: Bearer {accessToken}
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| enrollmentId | Long | 수강 ID |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "certificateId": 1,
    "certificateNumber": "CERT-2025-00001",
    "enrollmentId": 100,
    "userId": 1,
    "userName": "홍길동",
    "courseId": 10,
    "courseTitle": "React 기초 과정",
    "courseTimeId": 5,
    "courseTimeName": "2025년 1월 과정",
    "completionRate": 100,
    "issuedAt": "2025-01-20T10:00:00",
    "expiresAt": null,
    "downloadUrl": "/api/certificates/1/download"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 수강 정보 없음 | 404 | ENROLLMENT_NOT_FOUND | 수강 정보를 찾을 수 없습니다 |
| 본인 수강 아님 | 403 | UNAUTHORIZED_ACCESS | 접근 권한이 없습니다 |
| 미완료 상태 | 400 | ENROLLMENT_NOT_COMPLETED | 수강이 완료되지 않았습니다 |
| 이미 발급됨 | 409 | CERTIFICATE_ALREADY_ISSUED | 이미 수료증이 발급되었습니다 |

---

### 1.2 수료증 재발급

> 기존 수료증을 새 번호로 재발급 (분실, 훼손 시)

```http
POST /api/certificates/{certificateId}/reissue
Authorization: Bearer {accessToken}
```

**Request Body** (선택):
```json
{
  "reason": "분실"
}
```

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "certificateId": 2,
    "certificateNumber": "CERT-2025-00002",
    "originalCertificateId": 1,
    "issuedAt": "2025-02-01T10:00:00",
    "message": "수료증이 재발급되었습니다. 기존 수료증은 무효화됩니다."
  }
}
```

---

## 2. 수료증 조회 API

### 2.1 수료증 상세 조회

```http
GET /api/certificates/{certificateId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "certificateId": 1,
    "certificateNumber": "CERT-2025-00001",
    "enrollmentId": 100,
    "userId": 1,
    "userName": "홍길동",
    "userEmail": "hong@example.com",
    "courseId": 10,
    "courseTitle": "React 기초 과정",
    "courseTimeId": 5,
    "courseTimeName": "2025년 1월 과정",
    "instructorName": "김강사",
    "completionRate": 100,
    "completedAt": "2025-01-19T15:30:00",
    "issuedAt": "2025-01-20T10:00:00",
    "expiresAt": null,
    "status": "VALID",
    "downloadUrl": "/api/certificates/1/download"
  }
}
```

### 2.2 내 수료증 목록 조회

```http
GET /api/users/me/certificates
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (VALID, EXPIRED, REVOKED) |
| page | Int | X | 페이지 번호 (기본: 0) |
| size | Int | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "certificateId": 1,
        "certificateNumber": "CERT-2025-00001",
        "courseTitle": "React 기초 과정",
        "courseTimeName": "2025년 1월 과정",
        "issuedAt": "2025-01-20T10:00:00",
        "status": "VALID"
      },
      {
        "certificateId": 2,
        "certificateNumber": "CERT-2025-00010",
        "courseTitle": "Spring Boot 심화",
        "courseTimeName": "2025년 2월 과정",
        "issuedAt": "2025-02-15T10:00:00",
        "status": "VALID"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 2,
    "totalPages": 1
  }
}
```

### 2.3 수강별 수료증 조회

> 특정 수강에 대한 수료증 확인

```http
GET /api/enrollments/{enrollmentId}/certificate
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "certificateId": 1,
    "certificateNumber": "CERT-2025-00001",
    "issuedAt": "2025-01-20T10:00:00",
    "status": "VALID",
    "downloadUrl": "/api/certificates/1/download"
  }
}
```

**Response** (`404 Not Found`) - 수료증 미발급:
```json
{
  "success": false,
  "error": {
    "code": "CERTIFICATE_NOT_FOUND",
    "message": "발급된 수료증이 없습니다",
    "status": 404
  }
}
```

---

## 3. 수료증 검증 API

### 3.1 수료증 번호로 검증 (Public)

> 외부에서 수료증 진위 확인 (로그인 불필요)

```http
GET /api/certificates/verify/{certificateNumber}
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| certificateNumber | String | 수료증 고유번호 (예: CERT-2025-00001) |

**Response** (`200 OK`) - 유효한 수료증:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificateNumber": "CERT-2025-00001",
    "userName": "홍*동",
    "courseTitle": "React 기초 과정",
    "courseTimeName": "2025년 1월 과정",
    "completedAt": "2025-01-19T15:30:00",
    "issuedAt": "2025-01-20T10:00:00",
    "status": "VALID",
    "message": "유효한 수료증입니다"
  }
}
```

**Response** (`200 OK`) - 만료/취소된 수료증:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "certificateNumber": "CERT-2025-00001",
    "status": "REVOKED",
    "message": "취소된 수료증입니다",
    "revokedAt": "2025-02-01T10:00:00",
    "revokeReason": "재발급으로 인한 기존 수료증 무효화"
  }
}
```

**Response** (`404 Not Found`) - 존재하지 않는 번호:
```json
{
  "success": false,
  "error": {
    "code": "CERTIFICATE_NOT_FOUND",
    "message": "수료증을 찾을 수 없습니다",
    "status": 404
  }
}
```

---

## 4. 수료증 다운로드 API

### 4.1 PDF 다운로드

```http
GET /api/certificates/{certificateId}/download
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="certificate-CERT-2025-00001.pdf"`

### 4.2 이미지 다운로드

```http
GET /api/certificates/{certificateId}/download?format=png
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| format | String | X | 다운로드 형식 (pdf, png) 기본: pdf |

---

## 5. 관리자 API (OPERATOR+)

### 5.1 수료증 취소

```http
DELETE /api/certificates/{certificateId}
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "reason": "부정 수강 적발"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "certificateId": 1,
    "status": "REVOKED",
    "revokedAt": "2025-02-01T10:00:00",
    "revokeReason": "부정 수강 적발",
    "message": "수료증이 취소되었습니다"
  }
}
```

### 5.2 차수별 수료증 발급 현황

```http
GET /api/times/{timeId}/certificates
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 |
| page | Int | X | 페이지 번호 |
| size | Int | X | 페이지 크기 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "certificateId": 1,
        "certificateNumber": "CERT-2025-00001",
        "userId": 1,
        "userName": "홍길동",
        "issuedAt": "2025-01-20T10:00:00",
        "status": "VALID"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 15,
    "totalPages": 1,
    "summary": {
      "totalIssued": 15,
      "valid": 14,
      "revoked": 1
    }
  }
}
```

---

## 6. 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| CERTIFICATE_NOT_FOUND | 404 | 수료증 없음 |
| CERTIFICATE_ALREADY_ISSUED | 409 | 이미 발급됨 |
| ENROLLMENT_NOT_COMPLETED | 400 | 수강 미완료 |
| CERTIFICATE_EXPIRED | 400 | 만료된 수료증 |
| CERTIFICATE_REVOKED | 400 | 취소된 수료증 |

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Certificate DB 스키마 |
| [student/api.md](../student/api.md) | 수강 API (완료 처리) |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

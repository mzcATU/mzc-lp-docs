# Review API 명세

> RV (Review Module) - 강의 리뷰/평점 관리 API

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **수강 완료 후 작성** | 실제 수강 경험 기반의 신뢰성 있는 리뷰 확보 |
| **1인 1리뷰** | enrollment_id 기준 유니크, 중복 리뷰 방지 |
| **익명 옵션** | 솔직한 피드백 유도, 작성자 보호 |
| **강사 답변** | 양방향 소통, 강의 개선 피드백 |
| **좋아요/신고** | 커뮤니티 자정 기능, 유용한 리뷰 노출 |

---

## 1. 리뷰 API

### 1.1 리뷰 작성

```http
POST /api/reviews
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "courseTimeId": 1,
  "rating": 4.5,
  "title": "정말 유익한 강의였습니다",
  "content": "실무에 바로 적용할 수 있는 내용이 많았어요. 특히 프로젝트 실습 부분이 좋았습니다.",
  "isAnonymous": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| courseTimeId | Long | O | 리뷰 대상 차수 ID |
| rating | Decimal | O | 평점 (1.0 ~ 5.0, 0.5 단위) |
| title | String | X | 리뷰 제목 (최대 100자) |
| content | String | X | 리뷰 내용 (최대 2000자) |
| isAnonymous | Boolean | X | 익명 여부 (기본: false) |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "courseTimeId": 1,
    "rating": 4.5,
    "title": "정말 유익한 강의였습니다",
    "content": "실무에 바로 적용할 수 있는 내용이 많았어요...",
    "isAnonymous": false,
    "author": {
      "userId": 3,
      "name": "홍길동",
      "profileImageUrl": "https://cdn.example.com/profiles/3.jpg"
    },
    "likeCount": 0,
    "status": "ACTIVE",
    "createdAt": "2025-02-16T10:00:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 차수 없음 | 404 | TS001 | CourseTime not found |
| 수강 기록 없음 | 403 | RV003 | Cannot write review for incomplete enrollment |
| 수강 미완료 | 403 | RV003 | Cannot write review for incomplete enrollment |
| 이미 리뷰 작성 | 409 | RV002 | Review already exists for this enrollment |
| 평점 범위 초과 | 400 | C001 | Invalid input value |

---

### 1.2 리뷰 상세 조회

```http
GET /api/reviews/{reviewId}
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| reviewId | Long | 리뷰 ID |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "courseTime": {
      "id": 1,
      "title": "React 기초 강의",
      "timeNumber": 1
    },
    "rating": 4.5,
    "title": "정말 유익한 강의였습니다",
    "content": "실무에 바로 적용할 수 있는 내용이 많았어요. 특히 프로젝트 실습 부분이 좋았습니다.",
    "isAnonymous": false,
    "author": {
      "userId": 3,
      "name": "홍길동",
      "profileImageUrl": "https://cdn.example.com/profiles/3.jpg"
    },
    "likeCount": 12,
    "isLiked": false,
    "reply": {
      "content": "수강해주셔서 감사합니다! 다음 강의도 기대해주세요.",
      "repliedAt": "2025-02-17T09:00:00",
      "instructor": {
        "userId": 5,
        "name": "김강사"
      }
    },
    "status": "ACTIVE",
    "createdAt": "2025-02-16T10:00:00",
    "updatedAt": "2025-02-16T10:00:00"
  }
}
```

> 익명 리뷰인 경우 `author`는 `null`로 반환

---

### 1.3 리뷰 수정

```http
PUT /api/reviews/{reviewId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "rating": 5.0,
  "title": "최고의 강의!",
  "content": "수정된 리뷰 내용입니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| rating | Decimal | X | 평점 (1.0 ~ 5.0) |
| title | String | X | 리뷰 제목 |
| content | String | X | 리뷰 내용 |

> 작성 후 7일 이내에만 수정 가능

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "rating": 5.0,
    "title": "최고의 강의!",
    "content": "수정된 리뷰 내용입니다.",
    "updatedAt": "2025-02-18T14:00:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 리뷰 없음 | 404 | RV001 | Review not found |
| 본인 아님 | 403 | A002 | Access denied |
| 수정 기간 만료 | 400 | RV004 | Review edit period expired (7 days) |

---

### 1.4 리뷰 삭제

```http
DELETE /api/reviews/{reviewId}
Authorization: Bearer {accessToken}
```

> 작성 후 7일 이내에만 삭제 가능

**Response** (`204 No Content`)

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 리뷰 없음 | 404 | RV001 | Review not found |
| 본인 아님 | 403 | A002 | Access denied |
| 삭제 기간 만료 | 400 | RV004 | Review edit period expired (7 days) |

---

### 1.5 차수별 리뷰 목록 조회

```http
GET /api/course-times/{courseTimeId}/reviews
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| courseTimeId | Long | 차수 ID |

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| rating | Integer | X | 평점 필터 (1, 2, 3, 4, 5) |
| sort | String | X | 정렬 (latest, oldest, helpful) |
| page | Integer | X | 페이지 번호 (기본: 0) |
| size | Integer | X | 페이지 크기 (기본: 10) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "reviewId": 1,
        "rating": 4.5,
        "title": "정말 유익한 강의였습니다",
        "content": "실무에 바로 적용할 수 있는 내용이 많았어요...",
        "isAnonymous": false,
        "author": {
          "userId": 3,
          "name": "홍길동",
          "profileImageUrl": "https://cdn.example.com/profiles/3.jpg"
        },
        "likeCount": 12,
        "isLiked": false,
        "hasReply": true,
        "createdAt": "2025-02-16T10:00:00"
      },
      {
        "reviewId": 2,
        "rating": 5.0,
        "title": null,
        "content": "좋아요!",
        "isAnonymous": true,
        "author": null,
        "likeCount": 3,
        "isLiked": false,
        "hasReply": false,
        "createdAt": "2025-02-15T09:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 45,
    "totalPages": 5
  }
}
```

---

### 1.6 내 리뷰 목록 조회

```http
GET /api/users/me/reviews
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | Integer | X | 페이지 번호 (기본: 0) |
| size | Integer | X | 페이지 크기 (기본: 10) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "reviewId": 1,
        "courseTime": {
          "id": 1,
          "title": "React 기초 강의",
          "timeNumber": 1
        },
        "rating": 4.5,
        "title": "정말 유익한 강의였습니다",
        "likeCount": 12,
        "hasReply": true,
        "createdAt": "2025-02-16T10:00:00"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

---

## 2. 좋아요/신고 API

### 2.1 좋아요

```http
POST /api/reviews/{reviewId}/like
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "likeCount": 13,
    "isLiked": true
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 리뷰 없음 | 404 | RV001 | Review not found |
| 이미 좋아요 | 409 | RV005 | Already liked this review |
| 본인 리뷰 | 400 | RV008 | Cannot like own review |

---

### 2.2 좋아요 취소

```http
DELETE /api/reviews/{reviewId}/like
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "likeCount": 12,
    "isLiked": false
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 좋아요 안함 | 400 | RV006 | Not liked this review |

---

### 2.3 리뷰 신고

```http
POST /api/reviews/{reviewId}/report
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "INAPPROPRIATE",
  "description": "부적절한 내용이 포함되어 있습니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| reason | String | O | 신고 사유 (SPAM, INAPPROPRIATE, FALSE_INFO, OTHER) |
| description | String | X | 상세 설명 (최대 500자) |

**ReportReason Enum:**
- `SPAM`: 스팸/광고
- `INAPPROPRIATE`: 부적절한 내용
- `FALSE_INFO`: 허위 정보
- `OTHER`: 기타

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "reportId": 1,
    "reviewId": 1,
    "reason": "INAPPROPRIATE",
    "status": "PENDING",
    "createdAt": "2025-02-16T11:00:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 이미 신고 | 409 | RV007 | Already reported this review |
| 본인 리뷰 | 400 | RV008 | Cannot report own review |

---

## 3. 강사 답변 API

### 3.1 답변 작성

```http
POST /api/reviews/{reviewId}/reply
Authorization: Bearer {accessToken}
Content-Type: application/json
```

> 해당 강의의 INSTRUCTOR 또는 OWNER만 가능

**Request Body**:
```json
{
  "content": "수강해주셔서 감사합니다! 피드백 반영해서 더 좋은 강의로 보답하겠습니다."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| content | String | O | 답변 내용 (최대 1000자) |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "reply": {
      "content": "수강해주셔서 감사합니다! 피드백 반영해서 더 좋은 강의로 보답하겠습니다.",
      "repliedAt": "2025-02-17T09:00:00",
      "instructor": {
        "userId": 5,
        "name": "김강사"
      }
    }
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 권한 없음 | 403 | A002 | Access denied |
| 이미 답변 존재 | 409 | RV009 | Reply already exists |

---

### 3.2 답변 수정

```http
PUT /api/reviews/{reviewId}/reply
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "content": "수정된 답변 내용입니다."
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reviewId": 1,
    "reply": {
      "content": "수정된 답변 내용입니다.",
      "repliedAt": "2025-02-17T10:00:00",
      "instructor": {
        "userId": 5,
        "name": "김강사"
      }
    }
  }
}
```

---

### 3.3 답변 삭제

```http
DELETE /api/reviews/{reviewId}/reply
Authorization: Bearer {accessToken}
```

**Response** (`204 No Content`)

---

## 4. 통계 API

### 4.1 차수별 리뷰 통계 조회

```http
GET /api/course-times/{courseTimeId}/reviews/stats
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "courseTimeId": 1,
    "totalReviews": 45,
    "averageRating": 4.3,
    "ratingDistribution": {
      "5": 20,
      "4": 15,
      "3": 7,
      "2": 2,
      "1": 1
    },
    "recommendPercent": 89,
    "replyRate": 78
  }
}
```

| 필드 | 설명 |
|------|------|
| totalReviews | 총 리뷰 수 |
| averageRating | 평균 평점 |
| ratingDistribution | 평점별 분포 |
| recommendPercent | 추천 비율 (4점 이상 비율) |
| replyRate | 강사 답변율 (%) |

---

## 5. 관리자 API

### 5.1 신고된 리뷰 목록 조회 (OPERATOR)

```http
GET /api/admin/reviews/reports
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (PENDING, APPROVED, REJECTED) |
| page | Integer | X | 페이지 번호 |
| size | Integer | X | 페이지 크기 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "reportId": 1,
        "review": {
          "reviewId": 10,
          "rating": 1.0,
          "content": "신고된 리뷰 내용...",
          "author": {
            "userId": 8,
            "name": "신고된사용자"
          }
        },
        "reason": "INAPPROPRIATE",
        "description": "부적절한 내용이 포함되어 있습니다.",
        "reportCount": 5,
        "status": "PENDING",
        "reportedBy": {
          "userId": 3,
          "name": "홍길동"
        },
        "createdAt": "2025-02-16T11:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 10
  }
}
```

---

### 5.2 리뷰 상태 변경 (OPERATOR)

```http
PUT /api/admin/reviews/{reviewId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "HIDDEN",
  "reason": "커뮤니티 가이드라인 위반"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | String | O | 상태 (ACTIVE, HIDDEN, DELETED) |
| reason | String | X | 처리 사유 |

**ReviewStatus Enum:**
- `ACTIVE`: 정상
- `HIDDEN`: 숨김 (신고 처리)
- `DELETED`: 삭제

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reviewId": 10,
    "status": "HIDDEN",
    "processedAt": "2025-02-17T10:00:00"
  }
}
```

---

### 5.3 신고 처리 (OPERATOR)

```http
PUT /api/admin/reviews/reports/{reportId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": "APPROVED",
  "action": "HIDE_REVIEW"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| status | String | O | 신고 처리 상태 (APPROVED, REJECTED) |
| action | String | X | 조치 (HIDE_REVIEW, DELETE_REVIEW, NONE) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "reportId": 1,
    "status": "APPROVED",
    "action": "HIDE_REVIEW",
    "processedAt": "2025-02-17T10:00:00"
  }
}
```

---

## 6. 상태 정의

### 6.1 ReviewStatus

| 상태 | 설명 |
|------|------|
| `ACTIVE` | 정상 노출 |
| `HIDDEN` | 숨김 (신고 처리됨) |
| `DELETED` | 삭제됨 |

### 6.2 ReportReason

| 값 | 설명 |
|----|------|
| `SPAM` | 스팸/광고 |
| `INAPPROPRIATE` | 부적절한 내용 |
| `FALSE_INFO` | 허위 정보 |
| `OTHER` | 기타 |

### 6.3 ReportStatus

| 상태 | 설명 |
|------|------|
| `PENDING` | 처리 대기 |
| `APPROVED` | 신고 승인 |
| `REJECTED` | 신고 기각 |

---

## 7. ErrorCode

| ErrorCode | HTTP | Message |
|-----------|------|---------|
| RV001 | 404 | Review not found |
| RV002 | 409 | Review already exists for this enrollment |
| RV003 | 403 | Cannot write review for incomplete enrollment |
| RV004 | 400 | Review edit period expired (7 days) |
| RV005 | 409 | Already liked this review |
| RV006 | 400 | Not liked this review |
| RV007 | 409 | Already reported this review |
| RV008 | 400 | Cannot like/report own review |
| RV009 | 409 | Reply already exists |

---

## 8. 비즈니스 규칙

### 8.1 리뷰 작성 조건

```
1. 해당 차수에 수강 기록이 있어야 함 (enrollment 존재)
2. 수강 상태가 COMPLETED여야 함
3. 동일 enrollment에 이미 작성한 리뷰가 없어야 함
```

### 8.2 수정/삭제 기간

```
리뷰 작성일로부터 7일 이내에만 수정/삭제 가능
이후에는 관리자만 상태 변경 가능
```

### 8.3 자동 숨김 처리

```
동일 리뷰에 대해 신고가 5건 이상 누적되면
자동으로 HIDDEN 상태로 전환 (관리자 검토 대기)
```

### 8.4 평균 평점 업데이트

```
리뷰 작성/수정/삭제 시 해당 CourseTime의
평균 평점(averageRating)과 리뷰 수(reviewCount) 업데이트
```

---

## 9. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Review DB 스키마 |
| [student/api.md](../student/api.md) | 수강 API (enrollment 참조) |
| [schedule/api.md](../schedule/api.md) | CourseTime API |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | 초기 API 명세 작성 |

---

*최종 업데이트: 2025-12-16*

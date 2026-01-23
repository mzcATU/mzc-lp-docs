# Payment API 명세

> PM (Payment Module) - 결제 관리 API

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **주문-결제 분리** | 주문 생성 → PG 결제 → 확인의 3단계로 안전한 결제 처리 |
| **Webhook 기반** | PG사 Webhook으로 결제 상태 동기화, 클라이언트 의존 최소화 |
| **자동 수강 등록** | 결제 완료 시 Enrollment 자동 생성으로 사용자 경험 향상 |
| **환불 이력 분리** | 부분 환불, 다중 환불 지원을 위한 별도 테이블 |

---

## 1. 결제 API

### 1.1 결제 주문 생성

```http
POST /api/payments
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "courseTimeId": 1,
  "couponCode": "WELCOME2025"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| courseTimeId | Long | O | 결제할 차수 ID |
| couponCode | String | X | 할인 쿠폰 코드 |

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "paymentId": 1,
    "orderId": "ORD-20250216-ABC123",
    "orderName": "React 기초 강의 - 1차",
    "amount": 99000,
    "originalAmount": 110000,
    "discountAmount": 11000,
    "status": "PENDING",
    "courseTime": {
      "id": 1,
      "title": "React 기초 강의",
      "timeNumber": 1
    },
    "createdAt": "2025-02-16T10:00:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 차수 없음 | 404 | TS001 | CourseTime not found |
| 이미 결제 완료 | 409 | PM002 | Payment already completed |
| 이미 수강 중 | 409 | SIS002 | Already enrolled in this course |
| 무료 강의 | 400 | PM007 | Free course does not require payment |

---

### 1.2 결제 확인 (클라이언트)

> PG사 결제 완료 후 클라이언트에서 호출

```http
POST /api/payments/{paymentId}/confirm
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| paymentId | Long | 결제 ID |

**Request Body** (Toss Payments 기준):
```json
{
  "paymentKey": "toss_payment_key_xxxxx",
  "orderId": "ORD-20250216-ABC123",
  "amount": 99000
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| paymentKey | String | O | PG사 결제 키 |
| orderId | String | O | 주문 번호 |
| amount | Integer | O | 결제 금액 (검증용) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "paymentId": 1,
    "orderId": "ORD-20250216-ABC123",
    "status": "COMPLETED",
    "amount": 99000,
    "paymentMethod": "CARD",
    "cardCompany": "삼성카드",
    "cardNumberMasked": "5365-****-****-1234",
    "paidAt": "2025-02-16T10:05:00",
    "enrollment": {
      "id": 100,
      "status": "ENROLLED",
      "enrolledAt": "2025-02-16T10:05:00"
    }
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 결제 없음 | 404 | PM001 | Payment not found |
| 금액 불일치 | 400 | PM003 | Payment amount mismatch |
| 이미 완료됨 | 409 | PM002 | Payment already completed |
| PG 오류 | 502 | PM005 | PG API error |

---

### 1.3 PG Webhook

> PG사에서 결제 상태 변경 시 호출 (서버 간 통신)

```http
POST /api/payments/webhook
Content-Type: application/json
```

**Request Body** (Toss Payments 기준):
```json
{
  "eventType": "PAYMENT_STATUS_CHANGED",
  "data": {
    "paymentKey": "toss_payment_key_xxxxx",
    "orderId": "ORD-20250216-ABC123",
    "status": "DONE",
    "method": "카드",
    "totalAmount": 99000,
    "approvedAt": "2025-02-16T10:05:00"
  }
}
```

**Response** (`200 OK`):
```json
{
  "success": true
}
```

> Webhook 검증: Toss Payments 시크릿 키로 서명 검증

---

### 1.4 결제 상세 조회

```http
GET /api/payments/{paymentId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "paymentId": 1,
    "orderId": "ORD-20250216-ABC123",
    "orderName": "React 기초 강의 - 1차",
    "status": "COMPLETED",
    "amount": 99000,
    "originalAmount": 110000,
    "discountAmount": 11000,
    "paymentMethod": "CARD",
    "cardCompany": "삼성카드",
    "cardNumberMasked": "5365-****-****-1234",
    "pgProvider": "TOSS",
    "paidAt": "2025-02-16T10:05:00",
    "courseTime": {
      "id": 1,
      "title": "React 기초 강의",
      "timeNumber": 1,
      "classStartDate": "2025-03-01",
      "classEndDate": "2025-04-30"
    },
    "enrollment": {
      "id": 100,
      "status": "ENROLLED",
      "progressPercent": 45
    },
    "refunds": [],
    "createdAt": "2025-02-16T10:00:00",
    "updatedAt": "2025-02-16T10:05:00"
  }
}
```

---

### 1.5 내 결제 내역 조회

```http
GET /api/users/me/payments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 (PENDING, COMPLETED, REFUNDED, CANCELLED) |
| page | Integer | X | 페이지 번호 (기본: 0) |
| size | Integer | X | 페이지 크기 (기본: 20) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "paymentId": 1,
        "orderId": "ORD-20250216-ABC123",
        "orderName": "React 기초 강의 - 1차",
        "status": "COMPLETED",
        "amount": 99000,
        "paymentMethod": "CARD",
        "paidAt": "2025-02-16T10:05:00"
      },
      {
        "paymentId": 2,
        "orderId": "ORD-20250210-DEF456",
        "orderName": "Spring Boot 마스터 - 2차",
        "status": "REFUNDED",
        "amount": 150000,
        "paymentMethod": "CARD",
        "paidAt": "2025-02-10T14:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 2,
    "totalPages": 1
  }
}
```

---

## 2. 결제 취소/환불 API

### 2.1 결제 취소 (결제 전)

> PENDING 상태의 결제 주문 취소

```http
POST /api/payments/{paymentId}/cancel
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "paymentId": 1,
    "orderId": "ORD-20250216-ABC123",
    "status": "CANCELLED",
    "cancelledAt": "2025-02-16T10:10:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 이미 결제됨 | 400 | PM006 | Invalid payment status for this operation |

---

### 2.2 환불 요청

> COMPLETED 상태의 결제 환불 요청

```http
POST /api/payments/{paymentId}/refund
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "강의 내용이 기대와 달랐습니다",
  "refundAmount": 99000
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| reason | String | O | 환불 사유 |
| refundAmount | Integer | X | 환불 금액 (미입력 시 전액) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "refundId": 1,
    "paymentId": 1,
    "refundAmount": 99000,
    "reason": "강의 내용이 기대와 달랐습니다",
    "status": "COMPLETED",
    "completedAt": "2025-02-16T11:00:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 환불 불가 | 400 | PM004 | Refund not allowed for this payment |
| 환불 기간 초과 | 400 | PM008 | Refund period expired |
| 진도율 초과 | 400 | PM009 | Cannot refund after 30% progress |

**환불 정책**:
- 수강 시작 전: 전액 환불
- 진도율 30% 미만: 70% 환불
- 진도율 30% 이상: 환불 불가
- 결제 후 7일 이내만 환불 가능

---

### 2.3 환불 내역 조회

```http
GET /api/payments/{paymentId}/refunds
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "refundId": 1,
      "refundAmount": 99000,
      "reason": "강의 내용이 기대와 달랐습니다",
      "status": "COMPLETED",
      "requestedAt": "2025-02-16T10:55:00",
      "completedAt": "2025-02-16T11:00:00",
      "requestedBy": {
        "id": 3,
        "name": "홍길동"
      }
    }
  ]
}
```

---

## 3. 관리자 API

### 3.1 결제 목록 조회 (OPERATOR)

```http
GET /api/admin/payments
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| status | String | X | 상태 필터 |
| courseTimeId | Long | X | 차수 필터 |
| userId | Long | X | 사용자 필터 |
| startDate | LocalDate | X | 시작일 |
| endDate | LocalDate | X | 종료일 |
| page | Integer | X | 페이지 번호 |
| size | Integer | X | 페이지 크기 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "paymentId": 1,
        "orderId": "ORD-20250216-ABC123",
        "user": {
          "id": 3,
          "name": "홍길동",
          "email": "hong@example.com"
        },
        "courseTime": {
          "id": 1,
          "title": "React 기초 강의"
        },
        "amount": 99000,
        "status": "COMPLETED",
        "paymentMethod": "CARD",
        "paidAt": "2025-02-16T10:05:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

---

### 3.2 결제 통계 조회 (OPERATOR)

```http
GET /api/admin/payments/stats
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| startDate | LocalDate | X | 시작일 |
| endDate | LocalDate | X | 종료일 |
| courseTimeId | Long | X | 차수 필터 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "totalPayments": 150,
    "completedPayments": 140,
    "refundedPayments": 8,
    "cancelledPayments": 2,
    "totalAmount": 13860000,
    "refundedAmount": 792000,
    "netAmount": 13068000,
    "byPaymentMethod": {
      "CARD": 120,
      "BANK_TRANSFER": 20,
      "VIRTUAL_ACCOUNT": 10
    },
    "dailyStats": [
      {
        "date": "2025-02-16",
        "count": 15,
        "amount": 1485000
      },
      {
        "date": "2025-02-15",
        "count": 12,
        "amount": 1188000
      }
    ]
  }
}
```

---

### 3.3 관리자 환불 처리 (OPERATOR)

```http
POST /api/admin/payments/{paymentId}/refund
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "고객 요청에 의한 환불",
  "refundAmount": 99000,
  "bypassPolicy": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| reason | String | O | 환불 사유 |
| refundAmount | Integer | X | 환불 금액 |
| bypassPolicy | Boolean | X | 환불 정책 우회 (관리자 권한) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "refundId": 2,
    "paymentId": 1,
    "refundAmount": 99000,
    "status": "COMPLETED"
  }
}
```

---

## 4. 상태 정의

### 4.1 PaymentStatus

| 상태 | 설명 |
|------|------|
| `PENDING` | 결제 대기 (주문 생성됨) |
| `COMPLETED` | 결제 완료 |
| `FAILED` | 결제 실패 |
| `CANCELLED` | 결제 취소 (결제 전) |
| `REFUNDED` | 환불 완료 |
| `PARTIAL_REFUNDED` | 부분 환불 |

### 4.2 PaymentMethod

| 값 | 설명 |
|----|------|
| `CARD` | 신용/체크카드 |
| `BANK_TRANSFER` | 계좌이체 |
| `VIRTUAL_ACCOUNT` | 가상계좌 |
| `PHONE` | 휴대폰 결제 |
| `KAKAO_PAY` | 카카오페이 |
| `NAVER_PAY` | 네이버페이 |
| `TOSS_PAY` | 토스페이 |

### 4.3 RefundStatus

| 상태 | 설명 |
|------|------|
| `PENDING` | 환불 처리 중 |
| `COMPLETED` | 환불 완료 |
| `FAILED` | 환불 실패 |

---

## 5. 결제 플로우

### 5.1 정상 결제 플로우

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Client  │      │ Backend │      │   PG    │      │   SIS   │
└────┬────┘      └────┬────┘      └────┬────┘      └────┬────┘
     │                │                │                │
     │ POST /payments │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │  orderId 반환  │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │    PG 결제창   │                │                │
     │───────────────────────────────>│                │
     │                │                │                │
     │   결제 완료    │                │                │
     │<───────────────────────────────│                │
     │                │                │                │
     │ POST /confirm  │                │                │
     │───────────────>│                │                │
     │                │ 결제 확인 API  │                │
     │                │───────────────>│                │
     │                │                │                │
     │                │   확인 결과    │                │
     │                │<───────────────│                │
     │                │                │                │
     │                │         수강 등록               │
     │                │───────────────────────────────>│
     │                │                │                │
     │  결제+수강완료 │                │                │
     │<───────────────│                │                │
     │                │                │                │
```

### 5.2 Webhook 플로우

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│   PG    │      │ Backend │      │   SIS   │
└────┬────┘      └────┬────┘      └────┬────┘
     │                │                │
     │ POST /webhook  │                │
     │───────────────>│                │
     │                │                │
     │                │ 서명 검증      │
     │                │────┐           │
     │                │    │           │
     │                │<───┘           │
     │                │                │
     │                │ 상태 업데이트  │
     │                │────┐           │
     │                │    │           │
     │                │<───┘           │
     │                │                │
     │                │ 수강 등록      │
     │                │───────────────>│
     │                │                │
     │   200 OK       │                │
     │<───────────────│                │
     │                │                │
```

---

## 6. ErrorCode

| ErrorCode | HTTP | Message |
|-----------|------|---------|
| PM001 | 404 | Payment not found |
| PM002 | 409 | Payment already completed |
| PM003 | 400 | Payment amount mismatch |
| PM004 | 400 | Refund not allowed for this payment |
| PM005 | 502 | PG API error |
| PM006 | 400 | Invalid payment status for this operation |
| PM007 | 400 | Free course does not require payment |
| PM008 | 400 | Refund period expired |
| PM009 | 400 | Cannot refund after 30% progress |

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Payment DB 스키마 |
| [schedule/api.md](../schedule/api.md) | CourseTime API (가격 정보) |
| [student/api.md](../student/api.md) | Enrollment API |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | 신동구 | 초기 API 명세 작성 |

---

*최종 업데이트: 2025-12-16*

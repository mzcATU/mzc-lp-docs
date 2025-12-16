# Settlement API 명세

> ST (Settlement Module) - 강사 정산 관리 API

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **월별 정산 주기** | 세금계산서 발행 주기, 회계 처리 편의 |
| **강사별 Target 분리** | 개별 지급 처리, 정산 내역 추적 용이 |
| **수수료율 유연화** | 강사별/기간별 차등 수수료 적용 |
| **상태 기반 워크플로우** | PENDING → CONFIRMED → PAID 검증 |
| **환불 자동 반영** | 정산 확정 전 환불분 차감 |

---

## 1. 강사용 정산 API

### 1.1 내 정산 목록 조회

```http
GET /api/users/me/settlements
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| year | Integer | X | 정산 연도 |
| status | String | X | 상태 필터 (PENDING, CONFIRMED, PAID) |
| page | Integer | X | 페이지 번호 (기본: 0) |
| size | Integer | X | 페이지 크기 (기본: 12) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "settlementId": 1,
        "targetId": 10,
        "year": 2025,
        "month": 1,
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-31",
        "grossSales": 990000,
        "refundAmount": 99000,
        "netSales": 891000,
        "commissionRate": 20.00,
        "commissionAmount": 178200,
        "payoutAmount": 712800,
        "paymentCount": 10,
        "refundCount": 1,
        "status": "PAID",
        "paidAt": "2025-02-15T10:00:00"
      },
      {
        "settlementId": 2,
        "targetId": 20,
        "year": 2025,
        "month": 2,
        "periodStart": "2025-02-01",
        "periodEnd": "2025-02-28",
        "grossSales": 1485000,
        "refundAmount": 0,
        "netSales": 1485000,
        "commissionRate": 20.00,
        "commissionAmount": 297000,
        "payoutAmount": 1188000,
        "paymentCount": 15,
        "refundCount": 0,
        "status": "CONFIRMED",
        "paidAt": null
      }
    ],
    "page": 0,
    "size": 12,
    "totalElements": 24,
    "totalPages": 2
  }
}
```

---

### 1.2 내 정산 상세 조회

```http
GET /api/users/me/settlements/{targetId}
Authorization: Bearer {accessToken}
```

**Path Parameters**:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| targetId | Long | 정산 대상 ID |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "targetId": 10,
    "settlement": {
      "settlementId": 1,
      "year": 2025,
      "month": 1,
      "periodStart": "2025-01-01",
      "periodEnd": "2025-01-31",
      "status": "PAID"
    },
    "grossSales": 990000,
    "refundAmount": 99000,
    "netSales": 891000,
    "commissionRate": 20.00,
    "commissionAmount": 178200,
    "payoutAmount": 712800,
    "paymentCount": 10,
    "refundCount": 1,
    "status": "PAID",
    "bankInfo": {
      "bankCode": "088",
      "bankName": "신한은행",
      "accountNumber": "110-***-***890",
      "accountHolder": "홍길동"
    },
    "paidAt": "2025-02-15T10:00:00",
    "details": [
      {
        "detailId": 1,
        "courseTime": {
          "courseTimeId": 1,
          "programTitle": "React 기초 과정",
          "timeNumber": 1
        },
        "paymentAmount": 99000,
        "refundAmount": 0,
        "netAmount": 99000,
        "commissionAmount": 19800,
        "payoutAmount": 79200,
        "shareRate": 100.00,
        "paidAt": "2025-01-15T10:00:00"
      },
      {
        "detailId": 2,
        "courseTime": {
          "courseTimeId": 1,
          "programTitle": "React 기초 과정",
          "timeNumber": 1
        },
        "paymentAmount": 99000,
        "refundAmount": 99000,
        "netAmount": 0,
        "commissionAmount": 0,
        "payoutAmount": 0,
        "shareRate": 100.00,
        "paidAt": "2025-01-16T14:00:00"
      }
    ]
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 정산 대상 없음 | 404 | ST005 | Settlement target not found |
| 권한 없음 | 403 | A002 | Access denied |

---

### 1.3 정산 요약 조회

```http
GET /api/users/me/settlements/summary
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| year | Integer | X | 조회 연도 (기본: 현재 연도) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "totalGrossSales": 12500000,
    "totalRefundAmount": 500000,
    "totalNetSales": 12000000,
    "totalCommission": 2400000,
    "totalPayout": 9600000,
    "paidAmount": 8400000,
    "pendingAmount": 1200000,
    "monthlyBreakdown": [
      {
        "month": 1,
        "grossSales": 990000,
        "payoutAmount": 712800,
        "status": "PAID"
      },
      {
        "month": 2,
        "grossSales": 1485000,
        "payoutAmount": 1188000,
        "status": "CONFIRMED"
      }
    ],
    "currentCommissionRate": 20.00
  }
}
```

---

### 1.4 계좌 정보 등록/수정

```http
PUT /api/users/me/bank-account
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "bankCode": "088",
  "bankName": "신한은행",
  "accountNumber": "110-123-456890",
  "accountHolder": "홍길동"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| bankCode | String | O | 은행 코드 |
| bankName | String | O | 은행명 |
| accountNumber | String | O | 계좌번호 |
| accountHolder | String | O | 예금주 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 10,
    "bankCode": "088",
    "bankName": "신한은행",
    "accountNumber": "110-***-***890",
    "accountHolder": "홍길동",
    "updatedAt": "2025-02-01T10:00:00"
  }
}
```

---

### 1.5 내 계좌 정보 조회

```http
GET /api/users/me/bank-account
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "bankCode": "088",
    "bankName": "신한은행",
    "accountNumber": "110-***-***890",
    "accountHolder": "홍길동",
    "updatedAt": "2025-02-01T10:00:00"
  }
}
```

**Response** (`200 OK`) - 미등록 시:
```json
{
  "success": true,
  "data": null
}
```

---

## 2. 관리자용 정산 API (OPERATOR)

### 2.1 월별 정산 생성

```http
POST /api/admin/settlements/generate
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "year": 2025,
  "month": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| year | Integer | O | 정산 연도 |
| month | Integer | O | 정산 월 (1-12) |

> 해당 월의 모든 결제 건을 집계하여 강사별 정산 데이터 생성

**Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "settlementId": 3,
    "year": 2025,
    "month": 1,
    "periodStart": "2025-01-01",
    "periodEnd": "2025-01-31",
    "totalSales": 15000000,
    "totalRefunds": 500000,
    "totalNetSales": 14500000,
    "totalCommission": 2900000,
    "totalPayout": 11600000,
    "targetCount": 25,
    "status": "PENDING",
    "createdAt": "2025-02-01T00:00:00"
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 이미 생성됨 | 409 | ST009 | Settlement already exists for this period |
| 기간 미종료 | 400 | ST003 | Settlement period is not closed |

---

### 2.2 정산 목록 조회 (관리자)

```http
GET /api/admin/settlements
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| year | Integer | X | 정산 연도 |
| status | String | X | 상태 필터 |
| page | Integer | X | 페이지 번호 |
| size | Integer | X | 페이지 크기 |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "settlementId": 1,
        "year": 2025,
        "month": 1,
        "periodStart": "2025-01-01",
        "periodEnd": "2025-01-31",
        "totalSales": 15000000,
        "totalRefunds": 500000,
        "totalNetSales": 14500000,
        "totalCommission": 2900000,
        "totalPayout": 11600000,
        "targetCount": 25,
        "paidCount": 25,
        "status": "PAID",
        "confirmedAt": "2025-02-05T10:00:00",
        "paidAt": "2025-02-15T10:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 12,
    "totalPages": 1
  }
}
```

---

### 2.3 정산 상세 조회 (관리자)

```http
GET /api/admin/settlements/{settlementId}
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "settlementId": 1,
    "year": 2025,
    "month": 1,
    "periodStart": "2025-01-01",
    "periodEnd": "2025-01-31",
    "totalSales": 15000000,
    "totalRefunds": 500000,
    "totalNetSales": 14500000,
    "totalCommission": 2900000,
    "totalPayout": 11600000,
    "status": "CONFIRMED",
    "confirmedAt": "2025-02-05T10:00:00",
    "confirmedBy": {
      "userId": 1,
      "name": "관리자"
    },
    "targets": [
      {
        "targetId": 10,
        "instructor": {
          "userId": 10,
          "name": "홍길동",
          "email": "hong@example.com"
        },
        "grossSales": 990000,
        "refundAmount": 99000,
        "netSales": 891000,
        "commissionRate": 20.00,
        "commissionAmount": 178200,
        "payoutAmount": 712800,
        "paymentCount": 10,
        "refundCount": 1,
        "status": "PENDING",
        "hasBankAccount": true
      },
      {
        "targetId": 11,
        "instructor": {
          "userId": 11,
          "name": "김강사",
          "email": "kim@example.com"
        },
        "grossSales": 1500000,
        "refundAmount": 0,
        "netSales": 1500000,
        "commissionRate": 15.00,
        "commissionAmount": 225000,
        "payoutAmount": 1275000,
        "paymentCount": 15,
        "refundCount": 0,
        "status": "HOLD",
        "hasBankAccount": false
      }
    ],
    "createdAt": "2025-02-01T00:00:00"
  }
}
```

---

### 2.4 정산 확정

```http
PUT /api/admin/settlements/{settlementId}/confirm
Authorization: Bearer {accessToken}
```

> PENDING → CONFIRMED 상태 변경

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "settlementId": 1,
    "status": "CONFIRMED",
    "confirmedAt": "2025-02-05T10:00:00",
    "confirmedBy": {
      "userId": 1,
      "name": "관리자"
    }
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 정산 없음 | 404 | ST001 | Settlement not found |
| 이미 확정됨 | 400 | ST002 | Settlement already confirmed |

---

### 2.5 개별 지급 처리

```http
PUT /api/admin/settlements/{settlementId}/targets/{targetId}/pay
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body** (선택):
```json
{
  "transactionId": "BANK-20250215-001",
  "note": "2월 15일 일괄 이체"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "targetId": 10,
    "status": "PAID",
    "payoutAmount": 712800,
    "paidAt": "2025-02-15T10:00:00",
    "instructor": {
      "userId": 10,
      "name": "홍길동"
    }
  }
}
```

**Error Responses**:
| 상황 | HTTP | ErrorCode | Message |
|------|------|-----------|---------|
| 정산 미확정 | 400 | ST004 | Cannot modify confirmed settlement |
| 이미 지급됨 | 400 | ST006 | Settlement target already paid |
| 계좌 미등록 | 400 | ST007 | Bank account not registered |
| 최소 금액 미달 | 400 | ST008 | Minimum payout amount not reached |

---

### 2.6 일괄 지급 처리

```http
PUT /api/admin/settlements/{settlementId}/pay-all
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body** (선택):
```json
{
  "note": "2025년 1월분 일괄 지급"
}
```

> 계좌 등록된 PENDING 상태 대상만 일괄 처리

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "settlementId": 1,
    "processedCount": 23,
    "skippedCount": 2,
    "skippedReasons": [
      {
        "targetId": 11,
        "userId": 11,
        "name": "김강사",
        "reason": "BANK_ACCOUNT_NOT_REGISTERED"
      },
      {
        "targetId": 15,
        "userId": 15,
        "name": "박강사",
        "reason": "MINIMUM_AMOUNT_NOT_REACHED"
      }
    ],
    "totalPaidAmount": 11100000,
    "status": "PAID",
    "paidAt": "2025-02-15T10:00:00"
  }
}
```

---

### 2.7 정산 대상 보류 처리

```http
PUT /api/admin/settlements/{settlementId}/targets/{targetId}/hold
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "reason": "계좌 정보 확인 필요"
}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "targetId": 10,
    "status": "HOLD",
    "holdReason": "계좌 정보 확인 필요"
  }
}
```

---

## 3. 수수료율 관리 API (TENANT_ADMIN)

### 3.1 기본 수수료율 조회

```http
GET /api/admin/settlement-rates/default
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "defaultCommissionRate": 20.00,
    "minimumPayoutAmount": 1000,
    "mainInstructorShareRate": 70.00,
    "subInstructorShareRate": 30.00,
    "updatedAt": "2025-01-01T00:00:00"
  }
}
```

---

### 3.2 기본 수수료율 변경

```http
PUT /api/admin/settlement-rates/default
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "defaultCommissionRate": 25.00,
  "minimumPayoutAmount": 5000,
  "mainInstructorShareRate": 70.00,
  "subInstructorShareRate": 30.00
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| defaultCommissionRate | Decimal | X | 기본 수수료율 (%) |
| minimumPayoutAmount | Integer | X | 최소 지급 금액 |
| mainInstructorShareRate | Decimal | X | 주강사 배분율 (%) |
| subInstructorShareRate | Decimal | X | 보조강사 배분율 (%) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "defaultCommissionRate": 25.00,
    "minimumPayoutAmount": 5000,
    "mainInstructorShareRate": 70.00,
    "subInstructorShareRate": 30.00,
    "updatedAt": "2025-02-01T10:00:00"
  }
}
```

---

### 3.3 강사별 수수료율 조회

```http
GET /api/admin/users/{userId}/settlement-rate
Authorization: Bearer {accessToken}
```

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 10,
    "userName": "홍길동",
    "currentRate": {
      "commissionRate": 15.00,
      "effectiveFrom": "2025-01-01",
      "effectiveTo": null
    },
    "rateHistory": [
      {
        "commissionRate": 20.00,
        "effectiveFrom": "2024-01-01",
        "effectiveTo": "2024-12-31"
      },
      {
        "commissionRate": 15.00,
        "effectiveFrom": "2025-01-01",
        "effectiveTo": null
      }
    ],
    "defaultRate": 20.00
  }
}
```

---

### 3.4 강사별 수수료율 설정

```http
PUT /api/admin/users/{userId}/settlement-rate
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "commissionRate": 15.00,
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| commissionRate | Decimal | O | 수수료율 (%) |
| effectiveFrom | Date | O | 적용 시작일 |
| effectiveTo | Date | X | 적용 종료일 (null이면 무기한) |

**Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "userId": 10,
    "commissionRate": 15.00,
    "effectiveFrom": "2025-01-01",
    "effectiveTo": null,
    "createdAt": "2025-01-01T10:00:00"
  }
}
```

---

## 4. 상태 정의

### 4.1 SettlementStatus

| 상태 | 설명 |
|------|------|
| `PENDING` | 정산 대기 (집계 완료, 검토 전) |
| `CONFIRMED` | 정산 확정 (관리자 검토 완료) |
| `PAID` | 지급 완료 |
| `CANCELLED` | 정산 취소 |

### 4.2 SettlementTargetStatus

| 상태 | 설명 |
|------|------|
| `PENDING` | 지급 대기 |
| `PAID` | 지급 완료 |
| `HOLD` | 보류 (계좌 미등록, 검토 필요 등) |

---

## 5. 정산 워크플로우

```
[매월 1일 자동/수동]
        │
        ▼
┌───────────────────┐
│  POST /generate   │  전월 결제 집계
│  status: PENDING  │
└─────────┬─────────┘
          │
          ▼ [관리자 검토]
┌───────────────────┐
│  PUT /confirm     │  금액/내역 확인
│  status: CONFIRMED│
└─────────┬─────────┘
          │
          ▼ [실제 이체 후]
┌───────────────────┐
│  PUT /pay-all     │  일괄 지급 처리
│  status: PAID     │
└───────────────────┘
```

---

## 6. ErrorCode

| ErrorCode | HTTP | Message |
|-----------|------|---------|
| ST001 | 404 | Settlement not found |
| ST002 | 400 | Settlement already confirmed |
| ST003 | 400 | Settlement period is not closed |
| ST004 | 400 | Cannot modify confirmed settlement |
| ST005 | 404 | Settlement target not found |
| ST006 | 400 | Settlement target already paid |
| ST007 | 400 | Bank account not registered |
| ST008 | 400 | Minimum payout amount not reached |
| ST009 | 409 | Settlement already exists for this period |

---

## 7. 비즈니스 규칙

### 7.1 정산 주기
```
매월 1일에 전월 정산 생성 가능
예: 2025-02-01에 2025년 1월분 정산 생성
```

### 7.2 수수료 구조
```
기본 플랫폼 수수료: 20%
강사 수익: 80%

예) 99,000원 결제 시
- 플랫폼 수수료: 19,800원 (20%)
- 강사 수익: 79,200원 (80%)
```

### 7.3 공동 강사 배분
```
MAIN 강사: 70%
SUB 강사: 30%

예) 강사 수익 79,200원인 경우
- MAIN: 55,440원
- SUB: 23,760원
```

### 7.4 환불 반영
```
정산 확정 전: 해당 월 정산에서 자동 차감
정산 확정 후 환불: 다음 월 정산에서 차감
```

### 7.5 최소 지급액
```
기본값: 1,000원
정산금액 미만 시: 다음 달로 이월
```

---

## 8. 은행 코드

| 코드 | 은행명 |
|------|--------|
| 004 | KB국민은행 |
| 011 | NH농협은행 |
| 020 | 우리은행 |
| 023 | SC제일은행 |
| 027 | 씨티은행 |
| 032 | 대구은행 |
| 034 | 광주은행 |
| 035 | 제주은행 |
| 037 | 전북은행 |
| 039 | 경남은행 |
| 045 | 새마을금고 |
| 048 | 신협 |
| 071 | 우체국 |
| 081 | 하나은행 |
| 088 | 신한은행 |
| 089 | 케이뱅크 |
| 090 | 카카오뱅크 |
| 092 | 토스뱅크 |

---

## 9. 소스 위치

```
backend/src/main/java/com/lms/platform/domain/settlement/
├── controller/
│   ├── SettlementController.java
│   ├── SettlementAdminController.java
│   └── SettlementRateController.java
├── service/
│   ├── SettlementService.java
│   ├── SettlementGenerateService.java
│   └── SettlementPayoutService.java
├── repository/
│   ├── SettlementRepository.java
│   ├── SettlementTargetRepository.java
│   ├── SettlementDetailRepository.java
│   └── InstructorRateRepository.java
├── entity/
│   ├── Settlement.java
│   ├── SettlementTarget.java
│   ├── SettlementDetail.java
│   ├── InstructorRate.java
│   ├── SettlementStatus.java
│   └── TargetStatus.java
└── dto/
    ├── request/
    │   ├── GenerateSettlementRequest.java
    │   ├── PaySettlementRequest.java
    │   └── SetRateRequest.java
    └── response/
        ├── SettlementResponse.java
        ├── SettlementTargetResponse.java
        └── SettlementSummaryResponse.java
```

---

## 10. 관련 문서

| 문서 | 내용 |
|------|------|
| [db.md](./db.md) | Settlement DB 스키마 |
| [payment/api.md](../payment/api.md) | Payment API (결제 데이터 참조) |
| [instructor/api.md](../instructor/api.md) | Instructor API (강사 배정 참조) |
| [user/api.md](../user/api.md) | User API (강사 정보 참조) |
| [common/overview.md](../common/overview.md) | 공통 응답/예외 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | 초기 API 명세 작성 |

---

*최종 업데이트: 2025-12-16*

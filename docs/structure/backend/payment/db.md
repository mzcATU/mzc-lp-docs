# Payment DB 스키마

> PM (Payment Module) - 결제 관리 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **order_id 별도 관리** | PG사 연동 시 고유 주문번호 필요, 내부 ID와 분리 |
| **PG 정보 저장** | 환불/취소 시 PG사 API 호출에 필요한 키 보관 |
| **환불 테이블 분리** | 부분 환불, 다중 환불 이력 관리 |
| **enrollment_id 연결** | 결제-수강 연동, 환불 시 수강 취소 처리 |

---

## 1. 테이블 구조

### 1.1 pm_payments (결제 정보)

```sql
CREATE TABLE pm_payments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,

    -- 주문 정보
    order_id            VARCHAR(50) NOT NULL,
    order_name          VARCHAR(200) NOT NULL,
    user_id             BIGINT NOT NULL,
    course_time_id      BIGINT NOT NULL,

    -- 금액 정보
    amount              DECIMAL(10,2) NOT NULL,
    original_amount     DECIMAL(10,2) NOT NULL,
    discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- 결제 상태
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- PG사 정보
    pg_provider         VARCHAR(20),
    pg_payment_key      VARCHAR(200),
    pg_transaction_id   VARCHAR(100),

    -- 결제 수단
    payment_method      VARCHAR(20),
    card_company        VARCHAR(50),
    card_number_masked  VARCHAR(20),

    -- 시간 정보
    paid_at             DATETIME(6),
    cancelled_at        DATETIME(6),

    -- 연동 정보
    enrollment_id       BIGINT,

    -- 메타
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_order_id (order_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (tenant_id, user_id),
    INDEX idx_course_time (tenant_id, course_time_id),
    INDEX idx_status (tenant_id, status),
    INDEX idx_paid_at (paid_at),
    INDEX idx_pg_payment_key (pg_payment_key)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| order_id | VARCHAR(50) | NO | 주문번호 (ORD-yyyyMMdd-XXXXXX) |
| order_name | VARCHAR(200) | NO | 주문명 (강의명 - 차수) |
| user_id | BIGINT | NO | 결제자 ID |
| course_time_id | BIGINT | NO | 결제 대상 차수 ID |
| amount | DECIMAL(10,2) | NO | 실제 결제 금액 |
| original_amount | DECIMAL(10,2) | NO | 원가 |
| discount_amount | DECIMAL(10,2) | NO | 할인 금액 |
| status | VARCHAR(20) | NO | 결제 상태 |
| pg_provider | VARCHAR(20) | YES | PG사 (TOSS, PORTONE) |
| pg_payment_key | VARCHAR(200) | YES | PG사 결제 키 |
| pg_transaction_id | VARCHAR(100) | YES | PG사 거래 ID |
| payment_method | VARCHAR(20) | YES | 결제 수단 |
| card_company | VARCHAR(50) | YES | 카드사명 |
| card_number_masked | VARCHAR(20) | YES | 마스킹된 카드번호 |
| paid_at | DATETIME(6) | YES | 결제 완료 시점 |
| cancelled_at | DATETIME(6) | YES | 취소 시점 |
| enrollment_id | BIGINT | YES | 생성된 수강 ID |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**PaymentStatus Enum:**
- `PENDING`: 결제 대기
- `COMPLETED`: 결제 완료
- `FAILED`: 결제 실패
- `CANCELLED`: 결제 취소
- `REFUNDED`: 전액 환불
- `PARTIAL_REFUNDED`: 부분 환불

**PaymentMethod Enum:**
- `CARD`: 신용/체크카드
- `BANK_TRANSFER`: 계좌이체
- `VIRTUAL_ACCOUNT`: 가상계좌
- `PHONE`: 휴대폰 결제
- `KAKAO_PAY`: 카카오페이
- `NAVER_PAY`: 네이버페이
- `TOSS_PAY`: 토스페이

---

### 1.2 pm_refunds (환불 정보)

```sql
CREATE TABLE pm_refunds (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id          BIGINT NOT NULL,

    -- 환불 정보
    refund_amount       DECIMAL(10,2) NOT NULL,
    refund_reason       VARCHAR(500),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- PG사 정보
    pg_refund_key       VARCHAR(200),

    -- 시간 정보
    requested_at        DATETIME(6) NOT NULL,
    completed_at        DATETIME(6),

    -- 요청자
    requested_by        BIGINT NOT NULL,
    bypass_policy       BOOLEAN NOT NULL DEFAULT FALSE,

    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id)
        REFERENCES pm_payments(id) ON DELETE CASCADE,

    INDEX idx_payment (payment_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| payment_id | BIGINT | NO | FK → pm_payments |
| refund_amount | DECIMAL(10,2) | NO | 환불 금액 |
| refund_reason | VARCHAR(500) | YES | 환불 사유 |
| status | VARCHAR(20) | NO | 환불 상태 |
| pg_refund_key | VARCHAR(200) | YES | PG사 환불 키 |
| requested_at | DATETIME(6) | NO | 환불 요청 시점 |
| completed_at | DATETIME(6) | YES | 환불 완료 시점 |
| requested_by | BIGINT | NO | 요청자 ID |
| bypass_policy | BOOLEAN | NO | 정책 우회 여부 (관리자) |
| created_at | DATETIME(6) | NO | 생성일시 |

**RefundStatus Enum:**
- `PENDING`: 환불 처리 중
- `COMPLETED`: 환불 완료
- `FAILED`: 환불 실패

---

## 2. ER 다이어그램

```
┌─────────────────────┐          ┌─────────────────────┐
│      um_users       │          │   course_times      │
│     (외부 참조)     │          │     (외부 참조)     │
└──────────┬──────────┘          └──────────┬──────────┘
           │                                │
           │ user_id                        │ course_time_id
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
              ┌─────────────────────────┐
              │       pm_payments       │
              ├─────────────────────────┤
              │ id (PK)                 │
              │ tenant_id               │
              │ order_id (UK)           │
              │ order_name              │
              │ user_id ────────────────┼──► um_users.id
              │ course_time_id ─────────┼──► course_times.id
              │ amount                  │
              │ original_amount         │
              │ discount_amount         │
              │ status                  │
              │ pg_provider             │
              │ pg_payment_key          │
              │ payment_method          │
              │ paid_at                 │
              │ enrollment_id ──────────┼──► sis_enrollments.id
              └───────────┬─────────────┘
                          │ 1:N
                          ▼
              ┌─────────────────────────┐
              │       pm_refunds        │
              ├─────────────────────────┤
              │ id (PK)                 │
              │ payment_id (FK)         │
              │ refund_amount           │
              │ refund_reason           │
              │ status                  │
              │ pg_refund_key           │
              │ requested_at            │
              │ completed_at            │
              │ requested_by            │
              └─────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 pm_payments 데이터

```sql
INSERT INTO pm_payments (
    id, tenant_id, order_id, order_name, user_id, course_time_id,
    amount, original_amount, discount_amount, status,
    pg_provider, pg_payment_key, payment_method, card_company, card_number_masked,
    paid_at, enrollment_id
) VALUES
-- 정상 결제 완료
(1, 1, 'ORD-20250216-ABC123', 'React 기초 강의 - 1차', 3, 1,
 99000.00, 110000.00, 11000.00, 'COMPLETED',
 'TOSS', 'toss_pk_xxxxx', 'CARD', '삼성카드', '5365-****-****-1234',
 '2025-02-16 10:05:00', 100),

-- 환불 완료
(2, 1, 'ORD-20250210-DEF456', 'Spring Boot 마스터 - 2차', 3, 2,
 150000.00, 150000.00, 0.00, 'REFUNDED',
 'TOSS', 'toss_pk_yyyyy', 'CARD', '현대카드', '4321-****-****-5678',
 '2025-02-10 14:00:00', NULL),

-- 결제 대기
(3, 1, 'ORD-20250216-GHI789', 'TypeScript 심화 - 1차', 4, 3,
 80000.00, 80000.00, 0.00, 'PENDING',
 NULL, NULL, NULL, NULL, NULL,
 NULL, NULL);
```

### 3.2 pm_refunds 데이터

```sql
INSERT INTO pm_refunds (
    id, payment_id, refund_amount, refund_reason, status,
    pg_refund_key, requested_at, completed_at, requested_by, bypass_policy
) VALUES
-- 전액 환불 완료
(1, 2, 150000.00, '강의 내용이 기대와 달랐습니다', 'COMPLETED',
 'toss_refund_xxxxx', '2025-02-12 10:00:00', '2025-02-12 10:05:00', 3, FALSE);
```

---

## 4. 주요 쿼리

### 4.1 사용자별 결제 내역 조회

```sql
SELECT
    p.id, p.order_id, p.order_name, p.amount, p.status,
    p.payment_method, p.paid_at,
    ct.title as course_title, ct.time_number
FROM pm_payments p
JOIN course_times ct ON p.course_time_id = ct.id
WHERE p.tenant_id = :tenantId
  AND p.user_id = :userId
ORDER BY p.created_at DESC;
```

### 4.2 차수별 결제 현황

```sql
SELECT
    p.course_time_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN p.status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_count,
    SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END) as total_amount,
    SUM(CASE WHEN p.status = 'REFUNDED' THEN p.amount ELSE 0 END) as refunded_amount
FROM pm_payments p
WHERE p.tenant_id = :tenantId
  AND p.course_time_id = :courseTimeId
GROUP BY p.course_time_id;
```

### 4.3 일별 매출 통계

```sql
SELECT
    DATE(p.paid_at) as payment_date,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as avg_amount
FROM pm_payments p
WHERE p.tenant_id = :tenantId
  AND p.status = 'COMPLETED'
  AND p.paid_at BETWEEN :startDate AND :endDate
GROUP BY DATE(p.paid_at)
ORDER BY payment_date DESC;
```

### 4.4 환불 가능 여부 확인

```sql
SELECT
    p.id as payment_id,
    p.amount,
    p.paid_at,
    DATEDIFF(NOW(), p.paid_at) as days_since_payment,
    e.progress_percent,
    COALESCE(SUM(r.refund_amount), 0) as already_refunded
FROM pm_payments p
LEFT JOIN sis_enrollments e ON p.enrollment_id = e.id
LEFT JOIN pm_refunds r ON p.id = r.payment_id AND r.status = 'COMPLETED'
WHERE p.id = :paymentId
  AND p.status IN ('COMPLETED', 'PARTIAL_REFUNDED')
GROUP BY p.id;
```

### 4.5 PG 결제키로 결제 조회

```sql
SELECT *
FROM pm_payments
WHERE pg_payment_key = :paymentKey
  AND tenant_id = :tenantId;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| pm_payments | uk_order_id | 주문번호 유니크 |
| pm_payments | idx_tenant | 테넌트별 조회 |
| pm_payments | idx_user | 사용자별 결제 내역 |
| pm_payments | idx_course_time | 차수별 결제 현황 |
| pm_payments | idx_status | 상태별 필터링 |
| pm_payments | idx_paid_at | 일별 통계 |
| pm_payments | idx_pg_payment_key | PG 콜백 조회 |
| pm_refunds | idx_payment | 결제별 환불 내역 |
| pm_refunds | idx_status | 환불 상태별 조회 |

---

## 6. 제약 조건

### 6.1 결제 금액 검증 (애플리케이션)

```java
@Transactional
public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
    Payment payment = paymentRepository.findByOrderId(request.orderId())
        .orElseThrow(() -> new PaymentNotFoundException());

    // 금액 검증
    if (!payment.getAmount().equals(BigDecimal.valueOf(request.amount()))) {
        throw new PaymentAmountMismatchException();
    }

    // PG사 확인
    TossPaymentResponse pgResponse = tossPaymentsAdapter.confirm(request);

    // 상태 업데이트
    payment.complete(pgResponse.paymentKey(), pgResponse.transactionId());

    return PaymentResponse.from(payment);
}
```

### 6.2 환불 정책 검증

```java
public void validateRefundPolicy(Payment payment, Enrollment enrollment) {
    // 환불 기간 체크 (7일)
    if (payment.getPaidAt().plusDays(7).isBefore(Instant.now())) {
        throw new RefundPeriodExpiredException();
    }

    // 진도율 체크 (30%)
    if (enrollment != null && enrollment.getProgressPercent() >= 30) {
        throw new RefundNotAllowedException("Cannot refund after 30% progress");
    }
}

public BigDecimal calculateRefundAmount(Payment payment, Enrollment enrollment) {
    if (enrollment == null || enrollment.getProgressPercent() == 0) {
        return payment.getAmount(); // 전액 환불
    }
    if (enrollment.getProgressPercent() < 30) {
        return payment.getAmount().multiply(BigDecimal.valueOf(0.7)); // 70% 환불
    }
    throw new RefundNotAllowedException();
}
```

### 6.3 중복 결제 방지

```java
public Payment createPayment(CreatePaymentRequest request, Long userId) {
    // 이미 완료된 결제 체크
    if (paymentRepository.existsByUserIdAndCourseTimeIdAndStatus(
            userId, request.courseTimeId(), PaymentStatus.COMPLETED)) {
        throw new PaymentAlreadyCompletedException();
    }

    // 이미 수강 중 체크
    if (enrollmentRepository.existsByUserIdAndCourseTimeId(userId, request.courseTimeId())) {
        throw new AlreadyEnrolledException();
    }

    // 기존 PENDING 결제 취소
    paymentRepository.findByUserIdAndCourseTimeIdAndStatus(
            userId, request.courseTimeId(), PaymentStatus.PENDING)
        .ifPresent(p -> p.cancel());

    return paymentRepository.save(Payment.create(...));
}
```

---

## 7. 주문번호 생성 규칙

```java
public String generateOrderId() {
    String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    String random = RandomStringUtils.randomAlphanumeric(6).toUpperCase();
    return String.format("ORD-%s-%s", date, random);
    // 예: ORD-20250216-ABC123
}
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Payment API 명세 |
| [student/db.md](../student/db.md) | SIS DB (enrollment 연동) |
| [schedule/db.md](../schedule/db.md) | TS DB (course_time 참조) |
| [user/db.md](../user/db.md) | User DB (user_id 참조) |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | 초기 DB 스키마 작성 |

---

*최종 업데이트: 2025-12-16*

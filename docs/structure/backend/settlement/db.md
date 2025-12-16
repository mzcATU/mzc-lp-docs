# Settlement DB 스키마

> ST (Settlement Module) - 강사 정산 관리 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **3단계 테이블 구조** | Settlement(월별) → Target(강사별) → Detail(건별) 계층화 |
| **수수료율 이력 관리** | 기간별 차등 수수료 적용, 변경 이력 추적 |
| **비정규화 합계** | Settlement/Target에 합계 저장으로 조회 성능 최적화 |
| **계좌 정보 Target 저장** | 지급 시점의 계좌 정보 보존 (변경 이력) |
| **share_rate 필드** | 공동 강사 배분 비율 지원 |

---

## 1. 테이블 구조

### 1.1 st_settlements (정산 마스터)

```sql
CREATE TABLE st_settlements (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,

    -- 정산 기간
    settlement_year     INT NOT NULL,
    settlement_month    INT NOT NULL,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,

    -- 금액 합계 (비정규화)
    total_sales         DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_refunds       DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_net_sales     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_commission    DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_payout        DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- 건수
    target_count        INT NOT NULL DEFAULT 0,
    paid_count          INT NOT NULL DEFAULT 0,

    -- 상태
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    confirmed_at        DATETIME(6),
    confirmed_by        BIGINT,
    paid_at             DATETIME(6),

    -- 메타
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_tenant_period (tenant_id, settlement_year, settlement_month),
    INDEX idx_tenant (tenant_id),
    INDEX idx_status (tenant_id, status),
    INDEX idx_period (period_start, period_end)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| settlement_year | INT | NO | 정산 연도 |
| settlement_month | INT | NO | 정산 월 (1-12) |
| period_start | DATE | NO | 정산 기간 시작일 |
| period_end | DATE | NO | 정산 기간 종료일 |
| total_sales | DECIMAL(12,2) | NO | 총 매출 |
| total_refunds | DECIMAL(12,2) | NO | 총 환불 |
| total_net_sales | DECIMAL(12,2) | NO | 순매출 (매출-환불) |
| total_commission | DECIMAL(12,2) | NO | 총 수수료 |
| total_payout | DECIMAL(12,2) | NO | 총 지급액 |
| target_count | INT | NO | 정산 대상 수 (강사 수) |
| paid_count | INT | NO | 지급 완료 수 |
| status | VARCHAR(20) | NO | 정산 상태 |
| confirmed_at | DATETIME(6) | YES | 확정 시점 |
| confirmed_by | BIGINT | YES | 확정자 ID |
| paid_at | DATETIME(6) | YES | 전체 지급 완료 시점 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**SettlementStatus Enum:**
- `PENDING`: 정산 대기 (집계 완료)
- `CONFIRMED`: 정산 확정 (관리자 검토 완료)
- `PAID`: 지급 완료
- `CANCELLED`: 정산 취소

---

### 1.2 st_settlement_targets (정산 대상 - 강사별)

```sql
CREATE TABLE st_settlement_targets (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_id       BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,

    -- 금액 정보
    gross_sales         DECIMAL(12,2) NOT NULL DEFAULT 0,
    refund_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_sales           DECIMAL(12,2) NOT NULL DEFAULT 0,
    commission_rate     DECIMAL(5,2) NOT NULL,
    commission_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
    payout_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- 이월 금액 (전월 최소 금액 미달분)
    carried_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- 정산 건수
    payment_count       INT NOT NULL DEFAULT 0,
    refund_count        INT NOT NULL DEFAULT 0,

    -- 상태
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    hold_reason         VARCHAR(200),

    -- 지급 시점 계좌 정보 (스냅샷)
    bank_code           VARCHAR(10),
    bank_name           VARCHAR(50),
    account_number      VARCHAR(50),
    account_holder      VARCHAR(50),

    -- 지급 정보
    paid_at             DATETIME(6),
    transaction_id      VARCHAR(100),
    note                VARCHAR(500),

    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_target_settlement FOREIGN KEY (settlement_id)
        REFERENCES st_settlements(id) ON DELETE CASCADE,

    UNIQUE KEY uk_settlement_user (settlement_id, user_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| settlement_id | BIGINT | NO | FK → st_settlements |
| user_id | BIGINT | NO | 강사 ID |
| gross_sales | DECIMAL(12,2) | NO | 총 매출 |
| refund_amount | DECIMAL(12,2) | NO | 환불 금액 |
| net_sales | DECIMAL(12,2) | NO | 순매출 |
| commission_rate | DECIMAL(5,2) | NO | 적용 수수료율 (%) |
| commission_amount | DECIMAL(12,2) | NO | 수수료 금액 |
| payout_amount | DECIMAL(12,2) | NO | 지급 예정/완료 금액 |
| carried_amount | DECIMAL(12,2) | NO | 전월 이월 금액 |
| payment_count | INT | NO | 결제 건수 |
| refund_count | INT | NO | 환불 건수 |
| status | VARCHAR(20) | NO | 지급 상태 |
| hold_reason | VARCHAR(200) | YES | 보류 사유 |
| bank_code | VARCHAR(10) | YES | 은행 코드 |
| bank_name | VARCHAR(50) | YES | 은행명 |
| account_number | VARCHAR(50) | YES | 계좌번호 |
| account_holder | VARCHAR(50) | YES | 예금주 |
| paid_at | DATETIME(6) | YES | 지급 시점 |
| transaction_id | VARCHAR(100) | YES | 이체 거래 ID |
| note | VARCHAR(500) | YES | 비고 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**TargetStatus Enum:**
- `PENDING`: 지급 대기
- `PAID`: 지급 완료
- `HOLD`: 보류 (계좌 미등록, 검토 필요 등)

---

### 1.3 st_settlement_details (정산 상세 - 결제건별)

```sql
CREATE TABLE st_settlement_details (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_id       BIGINT NOT NULL,
    target_id           BIGINT NOT NULL,

    -- 결제 참조
    payment_id          BIGINT NOT NULL,
    course_time_id      BIGINT NOT NULL,

    -- 금액
    payment_amount      DECIMAL(10,2) NOT NULL,
    refund_amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_amount          DECIMAL(10,2) NOT NULL,
    commission_amount   DECIMAL(10,2) NOT NULL,
    payout_amount       DECIMAL(10,2) NOT NULL,

    -- 정산 비율 (공동 강사인 경우)
    share_rate          DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    instructor_role     VARCHAR(10),

    -- 원 결제 시점
    paid_at             DATETIME(6) NOT NULL,

    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT fk_detail_settlement FOREIGN KEY (settlement_id)
        REFERENCES st_settlements(id) ON DELETE CASCADE,
    CONSTRAINT fk_detail_target FOREIGN KEY (target_id)
        REFERENCES st_settlement_targets(id) ON DELETE CASCADE,

    UNIQUE KEY uk_target_payment (target_id, payment_id),
    INDEX idx_settlement (settlement_id),
    INDEX idx_payment (payment_id),
    INDEX idx_course_time (course_time_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| settlement_id | BIGINT | NO | FK → st_settlements |
| target_id | BIGINT | NO | FK → st_settlement_targets |
| payment_id | BIGINT | NO | FK → pm_payments |
| course_time_id | BIGINT | NO | 차수 ID |
| payment_amount | DECIMAL(10,2) | NO | 결제 금액 |
| refund_amount | DECIMAL(10,2) | NO | 환불 금액 |
| net_amount | DECIMAL(10,2) | NO | 순 금액 |
| commission_amount | DECIMAL(10,2) | NO | 수수료 |
| payout_amount | DECIMAL(10,2) | NO | 지급액 |
| share_rate | DECIMAL(5,2) | NO | 배분 비율 (%) |
| instructor_role | VARCHAR(10) | YES | 강사 역할 (MAIN, SUB) |
| paid_at | DATETIME(6) | NO | 원 결제 시점 |
| created_at | DATETIME(6) | NO | 생성일시 |

---

### 1.4 st_instructor_rates (강사별 수수료율)

```sql
CREATE TABLE st_instructor_rates (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,

    commission_rate     DECIMAL(5,2) NOT NULL,
    effective_from      DATE NOT NULL,
    effective_to        DATE,

    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_by          BIGINT NOT NULL,

    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_effective (user_id, effective_from, effective_to)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| user_id | BIGINT | NO | 강사 ID |
| commission_rate | DECIMAL(5,2) | NO | 수수료율 (%) |
| effective_from | DATE | NO | 적용 시작일 |
| effective_to | DATE | YES | 적용 종료일 (NULL=무기한) |
| created_at | DATETIME(6) | NO | 생성일시 |
| created_by | BIGINT | NO | 설정자 ID |

---

### 1.5 st_bank_accounts (강사 계좌 정보)

```sql
CREATE TABLE st_bank_accounts (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,

    bank_code           VARCHAR(10) NOT NULL,
    bank_name           VARCHAR(50) NOT NULL,
    account_number      VARCHAR(50) NOT NULL,
    account_holder      VARCHAR(50) NOT NULL,

    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at         DATETIME(6),

    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_tenant_user (tenant_id, user_id),
    INDEX idx_user (user_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| user_id | BIGINT | NO | 강사 ID |
| bank_code | VARCHAR(10) | NO | 은행 코드 |
| bank_name | VARCHAR(50) | NO | 은행명 |
| account_number | VARCHAR(50) | NO | 계좌번호 |
| account_holder | VARCHAR(50) | NO | 예금주 |
| is_verified | BOOLEAN | NO | 인증 여부 |
| verified_at | DATETIME(6) | YES | 인증 시점 |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

---

### 1.6 st_settlement_settings (정산 설정)

```sql
CREATE TABLE st_settlement_settings (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id                   BIGINT NOT NULL,

    default_commission_rate     DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    minimum_payout_amount       INT NOT NULL DEFAULT 1000,
    main_instructor_share_rate  DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    sub_instructor_share_rate   DECIMAL(5,2) NOT NULL DEFAULT 30.00,

    created_at                  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_tenant (tenant_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| default_commission_rate | DECIMAL(5,2) | NO | 기본 수수료율 (%) |
| minimum_payout_amount | INT | NO | 최소 지급 금액 |
| main_instructor_share_rate | DECIMAL(5,2) | NO | 주강사 배분율 (%) |
| sub_instructor_share_rate | DECIMAL(5,2) | NO | 보조강사 배분율 (%) |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

---

## 2. ER 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              st_settlements                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                                     │
│ tenant_id                                                                   │
│ settlement_year, settlement_month (UK)                                      │
│ period_start, period_end                                                    │
│ total_sales, total_refunds, total_net_sales                                │
│ total_commission, total_payout                                              │
│ target_count, paid_count                                                    │
│ status, confirmed_at, confirmed_by, paid_at                                │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ 1:N
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           st_settlement_targets                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                                     │
│ settlement_id (FK) ──────────────────────────────────────► st_settlements   │
│ user_id ─────────────────────────────────────────────────► um_users         │
│ gross_sales, refund_amount, net_sales                                       │
│ commission_rate, commission_amount, payout_amount                           │
│ carried_amount                                                              │
│ payment_count, refund_count                                                 │
│ status, hold_reason                                                         │
│ bank_code, bank_name, account_number, account_holder                        │
│ paid_at, transaction_id, note                                               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ 1:N
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           st_settlement_details                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                                     │
│ settlement_id (FK) ──────────────────────────────────────► st_settlements   │
│ target_id (FK) ──────────────────────────────────────────► st_targets       │
│ payment_id ──────────────────────────────────────────────► pm_payments      │
│ course_time_id ──────────────────────────────────────────► course_times     │
│ payment_amount, refund_amount, net_amount                                   │
│ commission_amount, payout_amount                                            │
│ share_rate, instructor_role                                                 │
│ paid_at                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│   st_instructor_rates   │   │    st_bank_accounts     │   │ st_settlement_settings  │
├─────────────────────────┤   ├─────────────────────────┤   ├─────────────────────────┤
│ id (PK)                 │   │ id (PK)                 │   │ id (PK)                 │
│ tenant_id               │   │ tenant_id               │   │ tenant_id (UK)          │
│ user_id ────────────────┼─► │ user_id (UK) ───────────┼─► │ default_commission_rate │
│ commission_rate         │   │ bank_code, bank_name    │   │ minimum_payout_amount   │
│ effective_from/to       │   │ account_number          │   │ main_instructor_share   │
│ created_by              │   │ account_holder          │   │ sub_instructor_share    │
└─────────────────────────┘   │ is_verified             │   └─────────────────────────┘
                              └─────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 st_settlements 데이터

```sql
INSERT INTO st_settlements (
    id, tenant_id, settlement_year, settlement_month,
    period_start, period_end,
    total_sales, total_refunds, total_net_sales, total_commission, total_payout,
    target_count, paid_count, status, confirmed_at, confirmed_by, paid_at
) VALUES
-- 2025년 1월 정산 (지급 완료)
(1, 1, 2025, 1, '2025-01-01', '2025-01-31',
 15000000.00, 500000.00, 14500000.00, 2900000.00, 11600000.00,
 25, 25, 'PAID', '2025-02-05 10:00:00', 1, '2025-02-15 10:00:00'),

-- 2025년 2월 정산 (확정, 지급 대기)
(2, 1, 2025, 2, '2025-02-01', '2025-02-28',
 18000000.00, 300000.00, 17700000.00, 3540000.00, 14160000.00,
 28, 0, 'CONFIRMED', '2025-03-05 10:00:00', 1, NULL),

-- 2025년 3월 정산 (집계 완료, 검토 대기)
(3, 1, 2025, 3, '2025-03-01', '2025-03-31',
 20000000.00, 200000.00, 19800000.00, 3960000.00, 15840000.00,
 30, 0, 'PENDING', NULL, NULL, NULL);
```

### 3.2 st_settlement_targets 데이터

```sql
INSERT INTO st_settlement_targets (
    id, settlement_id, user_id,
    gross_sales, refund_amount, net_sales,
    commission_rate, commission_amount, payout_amount,
    carried_amount, payment_count, refund_count,
    status, bank_code, bank_name, account_number, account_holder,
    paid_at, transaction_id
) VALUES
-- 홍길동 강사 (1월, 지급 완료)
(1, 1, 10,
 990000.00, 99000.00, 891000.00,
 20.00, 178200.00, 712800.00,
 0.00, 10, 1,
 'PAID', '088', '신한은행', '110-123-456890', '홍길동',
 '2025-02-15 10:00:00', 'BANK-20250215-001'),

-- 김강사 (1월, 지급 완료, 특별 수수료율)
(2, 1, 11,
 1500000.00, 0.00, 1500000.00,
 15.00, 225000.00, 1275000.00,
 0.00, 15, 0,
 'PAID', '090', '카카오뱅크', '3333-01-1234567', '김강사',
 '2025-02-15 10:00:00', 'BANK-20250215-002'),

-- 박강사 (2월, 지급 대기, 계좌 미등록)
(3, 2, 12,
 800000.00, 0.00, 800000.00,
 20.00, 160000.00, 640000.00,
 0.00, 8, 0,
 'HOLD', NULL, NULL, NULL, NULL,
 NULL, NULL);
```

### 3.3 st_settlement_details 데이터

```sql
INSERT INTO st_settlement_details (
    id, settlement_id, target_id,
    payment_id, course_time_id,
    payment_amount, refund_amount, net_amount, commission_amount, payout_amount,
    share_rate, instructor_role, paid_at
) VALUES
-- 홍길동 강사의 결제 건들
(1, 1, 1, 100, 1, 99000.00, 0.00, 99000.00, 19800.00, 79200.00, 100.00, 'MAIN', '2025-01-10 10:00:00'),
(2, 1, 1, 101, 1, 99000.00, 99000.00, 0.00, 0.00, 0.00, 100.00, 'MAIN', '2025-01-12 14:00:00'),
(3, 1, 1, 102, 1, 99000.00, 0.00, 99000.00, 19800.00, 79200.00, 100.00, 'MAIN', '2025-01-15 09:00:00'),

-- 공동 강사 케이스 (MAIN 70%, SUB 30%)
(10, 1, 1, 200, 5, 150000.00, 0.00, 150000.00, 21000.00, 73500.00, 70.00, 'MAIN', '2025-01-20 10:00:00'),
(11, 1, 2, 200, 5, 150000.00, 0.00, 150000.00, 9000.00, 31500.00, 30.00, 'SUB', '2025-01-20 10:00:00');
```

### 3.4 st_instructor_rates 데이터

```sql
INSERT INTO st_instructor_rates (
    id, tenant_id, user_id, commission_rate, effective_from, effective_to, created_by
) VALUES
-- 김강사: 2024년은 기본(20%), 2025년부터 우대(15%)
(1, 1, 11, 20.00, '2024-01-01', '2024-12-31', 1),
(2, 1, 11, 15.00, '2025-01-01', NULL, 1),

-- 이강사: 특별 계약 (10%)
(3, 1, 15, 10.00, '2025-01-01', '2025-12-31', 1);
```

### 3.5 st_bank_accounts 데이터

```sql
INSERT INTO st_bank_accounts (
    id, tenant_id, user_id, bank_code, bank_name, account_number, account_holder,
    is_verified, verified_at
) VALUES
(1, 1, 10, '088', '신한은행', '110-123-456890', '홍길동', TRUE, '2025-01-01 10:00:00'),
(2, 1, 11, '090', '카카오뱅크', '3333-01-1234567', '김강사', TRUE, '2025-01-15 14:00:00');
-- 박강사(user_id=12)는 미등록
```

### 3.6 st_settlement_settings 데이터

```sql
INSERT INTO st_settlement_settings (
    id, tenant_id, default_commission_rate, minimum_payout_amount,
    main_instructor_share_rate, sub_instructor_share_rate
) VALUES
(1, 1, 20.00, 1000, 70.00, 30.00);
```

---

## 4. 주요 쿼리

### 4.1 강사별 정산 목록 조회

```sql
SELECT
    s.id as settlement_id,
    t.id as target_id,
    s.settlement_year,
    s.settlement_month,
    s.period_start,
    s.period_end,
    t.gross_sales,
    t.refund_amount,
    t.net_sales,
    t.commission_rate,
    t.commission_amount,
    t.payout_amount,
    t.payment_count,
    t.refund_count,
    t.status,
    t.paid_at
FROM st_settlements s
JOIN st_settlement_targets t ON s.id = t.settlement_id
WHERE s.tenant_id = :tenantId
  AND t.user_id = :userId
ORDER BY s.settlement_year DESC, s.settlement_month DESC;
```

### 4.2 월별 정산 집계 생성

```sql
-- 강사별 결제 집계
SELECT
    ia.user_key as user_id,
    ia.role as instructor_role,
    SUM(p.amount) as gross_sales,
    COUNT(p.id) as payment_count
FROM pm_payments p
JOIN iis_instructor_assignments ia ON p.course_time_id = ia.time_key
WHERE p.tenant_id = :tenantId
  AND p.status = 'COMPLETED'
  AND p.paid_at BETWEEN :periodStart AND :periodEnd
  AND ia.status = 'ACTIVE'
GROUP BY ia.user_key, ia.role;
```

### 4.3 환불 금액 집계

```sql
SELECT
    p.id as payment_id,
    ia.user_key as user_id,
    COALESCE(SUM(r.refund_amount), 0) as refund_amount
FROM pm_payments p
JOIN iis_instructor_assignments ia ON p.course_time_id = ia.time_key
LEFT JOIN pm_refunds r ON p.id = r.payment_id AND r.status = 'COMPLETED'
WHERE p.tenant_id = :tenantId
  AND p.paid_at BETWEEN :periodStart AND :periodEnd
GROUP BY p.id, ia.user_key;
```

### 4.4 강사 수수료율 조회

```sql
SELECT commission_rate
FROM st_instructor_rates
WHERE tenant_id = :tenantId
  AND user_id = :userId
  AND effective_from <= :date
  AND (effective_to IS NULL OR effective_to >= :date)
ORDER BY effective_from DESC
LIMIT 1;

-- 없으면 기본 수수료율 사용
SELECT default_commission_rate
FROM st_settlement_settings
WHERE tenant_id = :tenantId;
```

### 4.5 정산 요약 통계

```sql
SELECT
    SUM(t.gross_sales) as total_gross_sales,
    SUM(t.refund_amount) as total_refund_amount,
    SUM(t.net_sales) as total_net_sales,
    SUM(t.commission_amount) as total_commission,
    SUM(t.payout_amount) as total_payout,
    SUM(CASE WHEN t.status = 'PAID' THEN t.payout_amount ELSE 0 END) as paid_amount,
    SUM(CASE WHEN t.status != 'PAID' THEN t.payout_amount ELSE 0 END) as pending_amount
FROM st_settlements s
JOIN st_settlement_targets t ON s.id = t.settlement_id
WHERE s.tenant_id = :tenantId
  AND t.user_id = :userId
  AND s.settlement_year = :year;
```

### 4.6 미지급 강사 목록

```sql
SELECT
    t.id as target_id,
    u.id as user_id,
    u.name,
    u.email,
    t.payout_amount,
    t.status,
    t.hold_reason,
    ba.id IS NOT NULL as has_bank_account
FROM st_settlement_targets t
JOIN um_users u ON t.user_id = u.id
LEFT JOIN st_bank_accounts ba ON t.user_id = ba.user_id AND ba.tenant_id = :tenantId
WHERE t.settlement_id = :settlementId
  AND t.status != 'PAID'
ORDER BY t.payout_amount DESC;
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| st_settlements | uk_tenant_period | 테넌트+기간 유니크 |
| st_settlements | idx_tenant | 테넌트별 조회 |
| st_settlements | idx_status | 상태별 필터링 |
| st_settlements | idx_period | 기간별 조회 |
| st_settlement_targets | uk_settlement_user | 정산별 강사 유니크 |
| st_settlement_targets | idx_user | 강사별 정산 목록 |
| st_settlement_targets | idx_status | 지급 상태별 조회 |
| st_settlement_details | uk_target_payment | 중복 방지 |
| st_settlement_details | idx_settlement | 정산별 상세 조회 |
| st_settlement_details | idx_payment | 결제별 정산 추적 |
| st_instructor_rates | idx_effective | 유효 기간 조회 |
| st_bank_accounts | uk_tenant_user | 테넌트+사용자 유니크 |

---

## 6. 트리거 및 이벤트

### 6.1 정산 생성 프로세스 (애플리케이션)

```java
@Transactional
public Settlement generateSettlement(int year, int month, Long tenantId) {
    // 1. 기간 검증
    LocalDate periodEnd = LocalDate.of(year, month, 1).plusMonths(1).minusDays(1);
    if (periodEnd.isAfter(LocalDate.now().minusDays(1))) {
        throw new SettlementPeriodNotClosedException();
    }

    // 2. 중복 체크
    if (settlementRepository.existsByTenantIdAndYearAndMonth(tenantId, year, month)) {
        throw new SettlementAlreadyExistsException();
    }

    // 3. 결제 데이터 집계
    List<PaymentAggregation> aggregations = paymentRepository.aggregateByInstructor(
        tenantId, periodStart, periodEnd);

    // 4. Settlement 생성
    Settlement settlement = Settlement.create(tenantId, year, month);

    // 5. Target 및 Detail 생성
    for (PaymentAggregation agg : aggregations) {
        BigDecimal commissionRate = getCommissionRate(tenantId, agg.getUserId(), periodEnd);
        SettlementTarget target = createTarget(settlement, agg, commissionRate);
        createDetails(target, agg.getPayments());
    }

    // 6. 합계 계산
    settlement.calculateTotals();

    return settlementRepository.save(settlement);
}
```

### 6.2 지급 처리 프로세스

```java
@Transactional
public SettlementTarget payTarget(Long targetId) {
    SettlementTarget target = targetRepository.findById(targetId)
        .orElseThrow(() -> new TargetNotFoundException());

    // 1. 상태 검증
    if (target.getStatus() == TargetStatus.PAID) {
        throw new AlreadyPaidException();
    }

    // 2. 정산 확정 여부 체크
    if (target.getSettlement().getStatus() != SettlementStatus.CONFIRMED) {
        throw new SettlementNotConfirmedException();
    }

    // 3. 계좌 정보 체크
    BankAccount bankAccount = bankAccountRepository
        .findByTenantIdAndUserId(target.getSettlement().getTenantId(), target.getUserId())
        .orElseThrow(() -> new BankAccountNotRegisteredException());

    // 4. 최소 금액 체크
    if (target.getPayoutAmount().compareTo(minimumAmount) < 0) {
        throw new MinimumAmountNotReachedException();
    }

    // 5. 계좌 정보 스냅샷 저장
    target.setBankInfo(bankAccount);

    // 6. 지급 처리
    target.markAsPaid();

    // 7. Settlement 지급 카운트 증가
    target.getSettlement().incrementPaidCount();

    return target;
}
```

---

## 7. 제약 조건

### 7.1 정산 기간 제약

```java
public void validateSettlementPeriod(int year, int month) {
    LocalDate periodEnd = LocalDate.of(year, month, 1).plusMonths(1).minusDays(1);
    if (periodEnd.isAfter(LocalDate.now().minusDays(1))) {
        throw new SettlementPeriodNotClosedException();
    }
}
```

### 7.2 수수료율 범위 제약

```java
public void validateCommissionRate(BigDecimal rate) {
    if (rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(new BigDecimal("100")) > 0) {
        throw new InvalidCommissionRateException();
    }
}
```

### 7.3 배분율 합계 검증

```java
public void validateShareRates(BigDecimal mainRate, BigDecimal subRate) {
    if (mainRate.add(subRate).compareTo(new BigDecimal("100")) != 0) {
        throw new InvalidShareRateException("Share rates must sum to 100%");
    }
}
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Settlement API 명세 |
| [payment/db.md](../payment/db.md) | Payment DB (결제 데이터 참조) |
| [instructor/db.md](../instructor/db.md) | Instructor DB (강사 배정 참조) |
| [user/db.md](../user/db.md) | User DB (강사 정보 참조) |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | 초기 DB 스키마 작성 |

---

*최종 업데이트: 2025-12-16*

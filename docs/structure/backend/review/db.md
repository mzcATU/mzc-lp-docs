# Review DB 스키마

> RV (Review Module) - 강의 리뷰/평점 관리 데이터베이스

---

## 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| **enrollment_id 기반 유니크** | 동일 수강에 중복 리뷰 방지, 실제 수강자만 작성 가능 |
| **좋아요/신고 테이블 분리** | 다대다 관계 관리, 사용자별 이력 추적 |
| **reply 필드 내장** | 리뷰당 1개 답변, 별도 테이블 불필요 |
| **like_count 비정규화** | 목록 조회 성능 최적화 |
| **soft delete** | 신고 처리, 관리자 삭제 이력 관리 |

---

## 1. 테이블 구조

### 1.1 rv_reviews (리뷰)

```sql
CREATE TABLE rv_reviews (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT NOT NULL,

    -- 리뷰 대상
    course_time_id      BIGINT NOT NULL,
    enrollment_id       BIGINT NOT NULL,
    user_id             BIGINT NOT NULL,

    -- 리뷰 내용
    rating              DECIMAL(2,1) NOT NULL,
    title               VARCHAR(100),
    content             VARCHAR(2000),
    is_anonymous        BOOLEAN NOT NULL DEFAULT FALSE,

    -- 통계 (비정규화)
    like_count          INT NOT NULL DEFAULT 0,
    report_count        INT NOT NULL DEFAULT 0,

    -- 강사 답변
    reply_content       VARCHAR(1000),
    reply_user_id       BIGINT,
    replied_at          DATETIME(6),

    -- 상태
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    hidden_reason       VARCHAR(200),
    hidden_at           DATETIME(6),
    hidden_by           BIGINT,

    -- 메타
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_enrollment (enrollment_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_course_time (tenant_id, course_time_id),
    INDEX idx_user (tenant_id, user_id),
    INDEX idx_status (tenant_id, status),
    INDEX idx_rating (tenant_id, course_time_id, rating),
    INDEX idx_created_at (course_time_id, created_at DESC)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| tenant_id | BIGINT | NO | 테넌트 ID |
| course_time_id | BIGINT | NO | FK → course_times |
| enrollment_id | BIGINT | NO | FK → sis_enrollments (UK) |
| user_id | BIGINT | NO | 작성자 ID |
| rating | DECIMAL(2,1) | NO | 평점 (1.0~5.0, 0.5 단위) |
| title | VARCHAR(100) | YES | 리뷰 제목 |
| content | VARCHAR(2000) | YES | 리뷰 내용 |
| is_anonymous | BOOLEAN | NO | 익명 여부 |
| like_count | INT | NO | 좋아요 수 (비정규화) |
| report_count | INT | NO | 신고 수 (비정규화) |
| reply_content | VARCHAR(1000) | YES | 강사 답변 내용 |
| reply_user_id | BIGINT | YES | 답변 작성자 (강사) ID |
| replied_at | DATETIME(6) | YES | 답변 작성일시 |
| status | VARCHAR(20) | NO | 리뷰 상태 |
| hidden_reason | VARCHAR(200) | YES | 숨김 처리 사유 |
| hidden_at | DATETIME(6) | YES | 숨김 처리 시점 |
| hidden_by | BIGINT | YES | 숨김 처리자 ID |
| created_at | DATETIME(6) | NO | 생성일시 |
| updated_at | DATETIME(6) | NO | 수정일시 |

**ReviewStatus Enum:**
- `ACTIVE`: 정상 노출
- `HIDDEN`: 숨김 (신고 처리)
- `DELETED`: 삭제됨

---

### 1.2 rv_review_likes (좋아요)

```sql
CREATE TABLE rv_review_likes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id       BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_review_user (review_id, user_id),

    CONSTRAINT fk_like_review FOREIGN KEY (review_id)
        REFERENCES rv_reviews(id) ON DELETE CASCADE,

    INDEX idx_user (user_id)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| review_id | BIGINT | NO | FK → rv_reviews |
| user_id | BIGINT | NO | 좋아요 누른 사용자 ID |
| created_at | DATETIME(6) | NO | 생성일시 |

---

### 1.3 rv_review_reports (신고)

```sql
CREATE TABLE rv_review_reports (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id       BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,

    -- 신고 내용
    reason          VARCHAR(20) NOT NULL,
    description     VARCHAR(500),

    -- 처리 상태
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    processed_at    DATETIME(6),
    processed_by    BIGINT,
    action_taken    VARCHAR(50),

    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE KEY uk_review_user (review_id, user_id),

    CONSTRAINT fk_report_review FOREIGN KEY (review_id)
        REFERENCES rv_reviews(id) ON DELETE CASCADE,

    INDEX idx_status (status),
    INDEX idx_review_status (review_id, status),
    INDEX idx_created_at (created_at DESC)
);
```

| 컬럼 | 타입 | NULL | 설명 |
|------|------|------|------|
| id | BIGINT | NO | PK, Auto Increment |
| review_id | BIGINT | NO | FK → rv_reviews |
| user_id | BIGINT | NO | 신고자 ID |
| reason | VARCHAR(20) | NO | 신고 사유 |
| description | VARCHAR(500) | YES | 상세 설명 |
| status | VARCHAR(20) | NO | 처리 상태 |
| processed_at | DATETIME(6) | YES | 처리 시점 |
| processed_by | BIGINT | YES | 처리자 ID |
| action_taken | VARCHAR(50) | YES | 조치 내용 |
| created_at | DATETIME(6) | NO | 생성일시 |

**ReportReason Enum:**
- `SPAM`: 스팸/광고
- `INAPPROPRIATE`: 부적절한 내용
- `FALSE_INFO`: 허위 정보
- `OTHER`: 기타

**ReportStatus Enum:**
- `PENDING`: 처리 대기
- `APPROVED`: 신고 승인 (조치 완료)
- `REJECTED`: 신고 기각

**ActionTaken Enum:**
- `HIDE_REVIEW`: 리뷰 숨김
- `DELETE_REVIEW`: 리뷰 삭제
- `NONE`: 조치 없음

---

## 2. ER 다이어그램

```
┌─────────────────────┐          ┌─────────────────────┐
│      um_users       │          │   course_times      │
│     (외부 참조)      │          │     (외부 참조)     │
└──────────┬──────────┘          └──────────┬──────────┘
           │                                │
           │ user_id                        │ course_time_id
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                     rv_reviews                          │
├─────────────────────────────────────────────────────────┤
│ id (PK)                                                 │
│ tenant_id                                               │
│ course_time_id ─────────────────────────────────────────┼──► course_times.id
│ enrollment_id (UK) ─────────────────────────────────────┼──► sis_enrollments.id
│ user_id ────────────────────────────────────────────────┼──► um_users.id
│ rating, title, content, is_anonymous                    │
│ like_count, report_count                                │
│ reply_content, reply_user_id, replied_at                │
│ status, hidden_reason, hidden_at, hidden_by             │
└───────────────┬─────────────────────────┬───────────────┘
                │ 1:N                     │ 1:N
                ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│    rv_review_likes      │   │   rv_review_reports     │
├─────────────────────────┤   ├─────────────────────────┤
│ id (PK)                 │   │ id (PK)                 │
│ review_id (FK)          │   │ review_id (FK)          │
│ user_id                 │   │ user_id                 │
│ created_at              │   │ reason, description     │
│                         │   │ status, processed_at    │
│ UK: (review_id, user_id)│   │ processed_by            │
└─────────────────────────┘   │ action_taken            │
                              │                         │
                              │ UK: (review_id, user_id)│
                              └─────────────────────────┘
```

---

## 3. 데이터 예시

### 3.1 rv_reviews 데이터

```sql
INSERT INTO rv_reviews (
    id, tenant_id, course_time_id, enrollment_id, user_id,
    rating, title, content, is_anonymous,
    like_count, report_count,
    reply_content, reply_user_id, replied_at,
    status, created_at
) VALUES
-- 일반 리뷰 (강사 답변 있음)
(1, 1, 1, 100, 3,
 4.5, '정말 유익한 강의였습니다', '실무에 바로 적용할 수 있는 내용이 많았어요. 특히 프로젝트 실습 부분이 좋았습니다.', FALSE,
 12, 0,
 '수강해주셔서 감사합니다! 다음 강의도 기대해주세요.', 5, '2025-02-17 09:00:00',
 'ACTIVE', '2025-02-16 10:00:00'),

-- 익명 리뷰
(2, 1, 1, 101, 4,
 5.0, NULL, '좋아요!', TRUE,
 3, 0,
 NULL, NULL, NULL,
 'ACTIVE', '2025-02-15 09:00:00'),

-- 신고로 숨김 처리된 리뷰
(3, 1, 1, 102, 8,
 1.0, '별로였어요', '신고된 리뷰 내용...', FALSE,
 0, 5,
 NULL, NULL, NULL,
 'HIDDEN', '2025-02-14 14:00:00');
```

### 3.2 rv_review_likes 데이터

```sql
INSERT INTO rv_review_likes (id, review_id, user_id, created_at) VALUES
(1, 1, 4, '2025-02-16 11:00:00'),
(2, 1, 5, '2025-02-16 12:00:00'),
(3, 1, 6, '2025-02-16 13:00:00'),
(4, 2, 3, '2025-02-15 10:00:00');
```

### 3.3 rv_review_reports 데이터

```sql
INSERT INTO rv_review_reports (
    id, review_id, user_id, reason, description, status,
    processed_at, processed_by, action_taken, created_at
) VALUES
-- 처리 완료된 신고
(1, 3, 3, 'INAPPROPRIATE', '부적절한 내용이 포함되어 있습니다.', 'APPROVED',
 '2025-02-15 10:00:00', 1, 'HIDE_REVIEW', '2025-02-14 15:00:00'),

-- 처리 대기 중인 신고
(2, 3, 4, 'SPAM', NULL, 'PENDING',
 NULL, NULL, NULL, '2025-02-14 16:00:00');
```

---

## 4. 주요 쿼리

### 4.1 차수별 리뷰 목록 조회

```sql
SELECT
    r.id, r.rating, r.title, r.content, r.is_anonymous,
    r.like_count, r.reply_content IS NOT NULL as has_reply,
    r.created_at,
    CASE WHEN r.is_anonymous THEN NULL ELSE u.id END as author_id,
    CASE WHEN r.is_anonymous THEN NULL ELSE u.name END as author_name,
    CASE WHEN r.is_anonymous THEN NULL ELSE u.profile_image_url END as author_profile,
    EXISTS(
        SELECT 1 FROM rv_review_likes l
        WHERE l.review_id = r.id AND l.user_id = :currentUserId
    ) as is_liked
FROM rv_reviews r
LEFT JOIN um_users u ON r.user_id = u.id
WHERE r.tenant_id = :tenantId
  AND r.course_time_id = :courseTimeId
  AND r.status = 'ACTIVE'
ORDER BY r.created_at DESC
LIMIT :limit OFFSET :offset;
```

### 4.2 리뷰 통계 조회

```sql
SELECT
    COUNT(*) as total_reviews,
    ROUND(AVG(rating), 1) as average_rating,
    SUM(CASE WHEN rating = 5.0 THEN 1 ELSE 0 END) as rating_5,
    SUM(CASE WHEN rating >= 4.0 AND rating < 5.0 THEN 1 ELSE 0 END) as rating_4,
    SUM(CASE WHEN rating >= 3.0 AND rating < 4.0 THEN 1 ELSE 0 END) as rating_3,
    SUM(CASE WHEN rating >= 2.0 AND rating < 3.0 THEN 1 ELSE 0 END) as rating_2,
    SUM(CASE WHEN rating >= 1.0 AND rating < 2.0 THEN 1 ELSE 0 END) as rating_1,
    ROUND(SUM(CASE WHEN rating >= 4.0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0) as recommend_percent,
    ROUND(SUM(CASE WHEN reply_content IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0) as reply_rate
FROM rv_reviews
WHERE tenant_id = :tenantId
  AND course_time_id = :courseTimeId
  AND status = 'ACTIVE';
```

### 4.3 내 리뷰 목록 조회

```sql
SELECT
    r.id, r.rating, r.title, r.like_count,
    r.reply_content IS NOT NULL as has_reply,
    r.created_at,
    ct.id as course_time_id,
    ct.title as course_title,
    ct.time_number
FROM rv_reviews r
JOIN course_times ct ON r.course_time_id = ct.id
WHERE r.tenant_id = :tenantId
  AND r.user_id = :userId
  AND r.status != 'DELETED'
ORDER BY r.created_at DESC;
```

### 4.4 신고된 리뷰 목록 (관리자)

```sql
SELECT
    rp.id as report_id,
    rp.reason, rp.description, rp.status, rp.created_at,
    r.id as review_id, r.rating, r.content, r.report_count,
    u.id as author_id, u.name as author_name,
    reporter.id as reporter_id, reporter.name as reporter_name
FROM rv_review_reports rp
JOIN rv_reviews r ON rp.review_id = r.id
JOIN um_users u ON r.user_id = u.id
JOIN um_users reporter ON rp.user_id = reporter.id
WHERE r.tenant_id = :tenantId
  AND rp.status = 'PENDING'
ORDER BY r.report_count DESC, rp.created_at ASC;
```

### 4.5 좋아요 토글

```sql
-- 좋아요 추가
INSERT INTO rv_review_likes (review_id, user_id) VALUES (:reviewId, :userId);
UPDATE rv_reviews SET like_count = like_count + 1 WHERE id = :reviewId;

-- 좋아요 취소
DELETE FROM rv_review_likes WHERE review_id = :reviewId AND user_id = :userId;
UPDATE rv_reviews SET like_count = like_count - 1 WHERE id = :reviewId;
```

### 4.6 수정 가능 여부 확인

```sql
SELECT
    r.id,
    r.user_id,
    r.created_at,
    TIMESTAMPDIFF(DAY, r.created_at, NOW()) as days_since_creation,
    CASE WHEN TIMESTAMPDIFF(DAY, r.created_at, NOW()) <= 7 THEN TRUE ELSE FALSE END as can_edit
FROM rv_reviews r
WHERE r.id = :reviewId
  AND r.status = 'ACTIVE';
```

---

## 5. 인덱스 전략

| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| rv_reviews | uk_enrollment | enrollment당 1개 리뷰 보장 |
| rv_reviews | idx_tenant | 테넌트별 조회 |
| rv_reviews | idx_course_time | 차수별 리뷰 목록 |
| rv_reviews | idx_user | 내 리뷰 목록 |
| rv_reviews | idx_status | 상태별 필터링 |
| rv_reviews | idx_rating | 평점별 필터링 |
| rv_reviews | idx_created_at | 최신순 정렬 |
| rv_review_likes | uk_review_user | 중복 좋아요 방지 |
| rv_review_likes | idx_user | 사용자별 좋아요 목록 |
| rv_review_reports | uk_review_user | 중복 신고 방지 |
| rv_review_reports | idx_status | 처리 상태별 조회 |

---

## 6. 트리거 및 이벤트

### 6.1 자동 숨김 트리거 (애플리케이션 구현)

```java
@Transactional
public ReviewReport createReport(Long reviewId, ReportRequest request, Long userId) {
    Review review = reviewRepository.findById(reviewId)
        .orElseThrow(() -> new ReviewNotFoundException());

    // 중복 신고 체크
    if (reportRepository.existsByReviewIdAndUserId(reviewId, userId)) {
        throw new AlreadyReportedException();
    }

    // 본인 리뷰 체크
    if (review.getUserId().equals(userId)) {
        throw new CannotReportOwnReviewException();
    }

    // 신고 생성
    ReviewReport report = ReviewReport.create(reviewId, userId, request);
    reportRepository.save(report);

    // 신고 수 증가
    review.incrementReportCount();

    // 5건 이상 신고 시 자동 숨김
    if (review.getReportCount() >= 5 && review.getStatus() == ReviewStatus.ACTIVE) {
        review.hide("자동 숨김: 신고 5건 이상", null);
    }

    return report;
}
```

### 6.2 CourseTime 평균 평점 업데이트 (애플리케이션 구현)

```java
@Transactional
public void updateCourseTimeStats(Long courseTimeId) {
    ReviewStats stats = reviewRepository.getStatsByCourseTimeId(courseTimeId);

    courseTimeService.updateReviewStats(
        courseTimeId,
        stats.getTotalReviews(),
        stats.getAverageRating()
    );
}

// Review 생성/수정/삭제 후 호출
@EventListener
public void onReviewChanged(ReviewChangedEvent event) {
    updateCourseTimeStats(event.getCourseTimeId());
}
```

---

## 7. 제약 조건

### 7.1 리뷰 작성 조건 검증

```java
public void validateReviewEligibility(Long courseTimeId, Long userId) {
    // 수강 기록 조회
    Enrollment enrollment = enrollmentRepository
        .findByUserIdAndCourseTimeId(userId, courseTimeId)
        .orElseThrow(() -> new EnrollmentNotFoundException());

    // 수강 완료 체크
    if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
        throw new IncompleteEnrollmentException();
    }

    // 기존 리뷰 체크
    if (reviewRepository.existsByEnrollmentId(enrollment.getId())) {
        throw new ReviewAlreadyExistsException();
    }
}
```

### 7.2 수정/삭제 기간 검증

```java
public void validateEditPeriod(Review review) {
    Instant editDeadline = review.getCreatedAt().plus(7, ChronoUnit.DAYS);
    if (Instant.now().isAfter(editDeadline)) {
        throw new ReviewEditPeriodExpiredException();
    }
}
```

### 7.3 평점 범위 검증

```java
public void validateRating(BigDecimal rating) {
    if (rating.compareTo(BigDecimal.valueOf(1.0)) < 0 ||
        rating.compareTo(BigDecimal.valueOf(5.0)) > 0) {
        throw new InvalidRatingException();
    }

    // 0.5 단위 검증
    BigDecimal remainder = rating.remainder(BigDecimal.valueOf(0.5));
    if (remainder.compareTo(BigDecimal.ZERO) != 0) {
        throw new InvalidRatingException("Rating must be in 0.5 increments");
    }
}
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [api.md](./api.md) | Review API 명세 |
| [student/db.md](../student/db.md) | SIS DB (enrollment 참조) |
| [schedule/db.md](../schedule/db.md) | TS DB (course_time 참조) |
| [user/db.md](../user/db.md) | User DB (user_id 참조) |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-16 | Claude Code | 초기 DB 스키마 작성 |

---

*최종 업데이트: 2025-12-16*

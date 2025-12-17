# 19. Database Conventions (MySQL)

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> MySQL 데이터베이스 설계 및 운영 컨벤션

---

## 핵심 규칙

```
✅ UTF8MB4 사용 → 이모지 지원
✅ created_at, updated_at 필수 → 감사 추적
✅ 외래키 명명: fk_테이블_참조테이블
✅ 인덱스 명명: idx_테이블_컬럼
✅ ENUM 대신 참조 테이블 → 확장성
```

---

## 테이블 설계

### 기본 템플릿

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_users_email (email),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 네이밍 규칙

| 구분 | 규칙 | 예시 |
|------|------|------|
| 테이블 | snake_case, 복수형 | `users`, `course_enrollments` |
| 컬럼 | snake_case | `created_at`, `user_id` |
| PK | `id` | `id BIGINT` |
| FK | `참조테이블_id` | `user_id`, `course_id` |
| UK | `uk_테이블_컬럼` | `uk_users_email` |
| IDX | `idx_테이블_컬럼` | `idx_users_status` |
| FK 제약 | `fk_테이블_참조` | `fk_enrollments_users` |

---

## 외래키 설계

```sql
CREATE TABLE enrollments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enrollments_users
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollments_courses
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,

    UNIQUE KEY uk_enrollments_user_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### ON DELETE 전략

| 전략 | 사용 시점 |
|------|----------|
| `CASCADE` | 부모 삭제 시 자식도 삭제 (수강신청 등) |
| `SET NULL` | 부모 삭제 시 NULL로 변경 (작성자 탈퇴) |
| `RESTRICT` | 자식 있으면 삭제 불가 (기본값, 안전) |

---

## 인덱스 전략

### 생성 기준

```sql
-- 1. WHERE 조건에 자주 사용
INDEX idx_users_status (status)

-- 2. JOIN 컬럼
INDEX idx_enrollments_user_id (user_id)

-- 3. ORDER BY 컬럼
INDEX idx_courses_created_at (created_at DESC)

-- 4. 복합 인덱스 (조건 순서대로)
INDEX idx_enrollments_user_status (user_id, status)
```

### 금지 사항

```sql
-- ❌ 모든 컬럼에 인덱스 (쓰기 성능 저하)
-- ❌ 카디널리티 낮은 컬럼 단독 인덱스 (성별 등)
-- ❌ 자주 변경되는 컬럼 인덱스
```

---

## JPA 매핑

### Entity 설정

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_status", columnList = "status")
})
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;
}
```

### application.yml

```yaml
spring:
  datasource:
    # Local
    url: jdbc:mysql://localhost:3306/mza_newlp?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    # Dev/Prod (RDS)
    # url: jdbc:mysql://mza-newlp-db-instance.cni8cqie2yhm.ap-northeast-2.rds.amazonaws.com:3306/mza_newlp
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: validate  # 운영: validate, 개발: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
    open-in-view: false  # 성능 최적화
```

---

## 마이그레이션 (Flyway)

### 파일 구조

```
resources/db/migration/
├── V1__init_schema.sql
├── V2__add_courses_table.sql
└── V3__add_enrollments_table.sql
```

### 명명 규칙

```
V{버전}__{설명}.sql
V1__init_schema.sql
V2__add_user_status_column.sql
```

### 마이그레이션 스크립트 예시

```sql
-- V2__add_courses_table.sql
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructor_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_courses_instructor
        FOREIGN KEY (instructor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 쿼리 최적화

### N+1 해결

```java
// ❌ N+1 발생
@Query("SELECT e FROM Enrollment e")
List<Enrollment> findAll();

// ✅ Fetch Join
@Query("SELECT e FROM Enrollment e JOIN FETCH e.user JOIN FETCH e.course")
List<Enrollment> findAllWithUserAndCourse();
```

### 페이징

```java
@Query("SELECT c FROM Course c ORDER BY c.createdAt DESC")
Page<Course> findAllOrderByCreatedAtDesc(Pageable pageable);
```

---

## 체크리스트

### 테이블 생성 시
- [ ] UTF8MB4 설정
- [ ] created_at, updated_at 컬럼
- [ ] 적절한 인덱스
- [ ] 외래키 제약조건
- [ ] ON DELETE 전략 결정

### 쿼리 작성 시
- [ ] N+1 확인 (Fetch Join)
- [ ] 인덱스 활용 여부 (EXPLAIN)
- [ ] 페이징 처리

---

> DB 스키마 상세 → [structure/backend/](../structure/backend/)

# 06. Entity Conventions

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

**목적**: 도메인 모델, 비즈니스 로직, 데이터베이스 매핑

---

## 언제 이 문서를 보는가?

| 상황 | 참조 섹션 |
|------|----------|
| Entity 작성? | 섹션 1 기본 템플릿 |
| 연관관계 매핑? | 섹션 2 |
| 생성 패턴? | 섹션 5 정적 팩토리/Builder |
| 낙관적 락? | 섹션 7 @Version |
| 비관적 락? | 섹션 8 |

---

## ⛔ 가장 중요한 규칙: Setter 절대 금지!

```java
// ❌ 절대 금지!
public void setName(String name) { this.name = name; }

// ✅ 비즈니스 메서드 사용
public void updateName(String newName) {
    validateName(newName);
    this.name = newName;
}
```

---

## 1. 기본 템플릿

```java
@Entity
@Table(name = "{table_name}")
@NoArgsConstructor(access = AccessLevel.PROTECTED)  // ✅ Protected
@Getter  // ⛔ Setter 금지!
public class {Domain} extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String field1;

    @Enumerated(EnumType.STRING)  // ✅ 항상 STRING
    @Column(nullable = false)
    private {Status}Enum status;

    // ===== 정적 팩토리 메서드 =====
    public static {Domain} create(String field1) {
        {Domain} entity = new {Domain}();
        entity.field1 = field1;
        entity.status = {Status}Enum.ACTIVE;
        return entity;
    }

    // ===== 비즈니스 메서드 =====
    public void updateField1(String newField1) {
        validateField1(newField1);
        this.field1 = newField1;
    }

    public void activate() {
        if (this.status == {Status}Enum.ACTIVE) {
            throw new BusinessException("이미 활성화된 상태입니다");
        }
        this.status = {Status}Enum.ACTIVE;
    }

    // ===== Private 검증 메서드 =====
    private void validateField1(String field1) {
        if (field1 == null || field1.isBlank()) {
            throw new IllegalArgumentException("field1은 필수입니다");
        }
    }
}
```

---

## 2. 연관관계 매핑

### @ManyToOne (다대일)

```java
@Entity
@Getter
public class ChildEntity {

    @ManyToOne(fetch = FetchType.LAZY)  // ✅ 항상 LAZY
    @JoinColumn(name = "parent_id")
    private ParentEntity parent;

    void assignParent(ParentEntity parent) {
        this.parent = parent;
    }
}

@Entity
@Getter
public class ParentEntity {

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<ChildEntity> children = new ArrayList<>();

    // ✅ 연관관계 편의 메서드
    public void addChild(ChildEntity child) {
        this.children.add(child);
        child.assignParent(this);  // 양방향 동기화
    }
}
```

---

## 3. Column 매핑

```java
@Entity
public class {Domain} {

    // ✅ String
    @Column(nullable = false, length = 100)
    private String field1;

    // ✅ Enum (항상 STRING)
    @Enumerated(EnumType.STRING)  // ⛔ ORDINAL 금지
    @Column(nullable = false)
    private {Status}Enum status;

    // ✅ 날짜/시간 (Instant - UTC 기준, 글로벌 서비스 대응)
    @Column(nullable = false)
    private Instant createdAt;

    // ❌ BAD: Date, Timestamp, LocalDateTime 사용 금지
    private Date createdDate;  // ❌
    private LocalDateTime localCreatedAt;  // ❌ 타임존 정보 없음
}
```

---

## 4. BaseEntity 패턴

> **Note**: `Instant` 타입 사용 (UTC 기준, 글로벌 서비스 대응)

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public abstract class BaseTimeEntity extends BaseEntity {

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Version  // ✅ 낙관적 락 (동시 수정 감지)
    private Long version;
}
```

---

## 5. Entity 생성 패턴

### 정적 팩토리 메서드 (권장)

```java
public static {Domain} create(String field1, String field2) {
    {Domain} entity = new {Domain}();
    entity.field1 = field1;
    entity.field2 = field2;
    entity.status = {Status}Enum.ACTIVE;
    return entity;
}
```

### Builder (복잡한 경우)

```java
@Builder
private {Domain}(String field1, String field2, String field3) {
    this.field1 = field1;
    this.field2 = field2;
    this.field3 = field3;
    this.status = {Status}Enum.ACTIVE;
}

// 사용
{Domain} entity = {Domain}.builder()
    .field1("value1")
    .field2("value2")
    .build();
```

---

## 6. 자주 하는 실수

```java
// ❌ 1. Setter 사용
public void setName(String name) { }  // ⛔ 절대 금지!

// ❌ 2. Enum ORDINAL 사용
@Enumerated(EnumType.ORDINAL)  // ❌ STRING 사용
private {Status}Enum status;

// ❌ 3. EAGER 로딩
@ManyToOne(fetch = FetchType.EAGER)  // ❌ LAZY 사용
private ParentEntity parent;

// ❌ 4. 검증 로직 없음
public void updateTitle(String newTitle) {
    this.title = newTitle;  // ❌ 검증 없음
}
```

---

## 7. @Version 낙관적 락

### 7.1 개념

```
[낙관적 락 동작 원리]

1. 사용자 A: 조회 (version=1)
2. 사용자 B: 조회 (version=1)
3. 사용자 A: 수정 → UPDATE ... WHERE id=1 AND version=1 → version=2
4. 사용자 B: 수정 → UPDATE ... WHERE id=1 AND version=1 → 0건 업데이트!
                 → OptimisticLockingFailureException 발생
```

### 7.2 사용 시점

| 상황 | 사용 여부 | 이유 |
|------|----------|------|
| 동시 수정 가능성 있는 엔티티 | ✅ 사용 | 데이터 무결성 보장 |
| 읽기 전용 엔티티 | ❌ 불필요 | 수정이 없으므로 충돌 없음 |
| 높은 충돌 빈도 예상 | ⚠️ 고려 | 비관적 락 검토 필요 |

### 7.3 구현 패턴

```java
@Entity
public class Course extends BaseTimeEntity {
    // BaseTimeEntity에서 @Version 상속

    public void updateTitle(String newTitle) {
        validateTitle(newTitle);
        this.title = newTitle;
        // JPA가 자동으로 version 증가 및 검증
    }
}
```

### 7.4 예외 처리

```java
@Service
public class CourseService {

    @Transactional
    public void updateCourse(Long courseId, UpdateRequest request) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new CourseNotFoundException(courseId));
            course.updateTitle(request.title());
            // 저장 시 version 불일치하면 OptimisticLockingFailureException 발생
        } catch (OptimisticLockingFailureException e) {
            throw new ConcurrentModificationException(
                "다른 사용자가 이미 수정했습니다. 새로고침 후 다시 시도해주세요.");
        }
    }
}
```

### 7.5 낙관적 락 vs 비관적 락

| 구분 | 낙관적 락 (@Version) | 비관적 락 (PESSIMISTIC_WRITE) |
|------|---------------------|------------------------------|
| 충돌 감지 시점 | 커밋 시점 | 조회 시점 |
| 성능 영향 | 낮음 (읽기 시 락 없음) | 높음 (DB 락 대기) |
| 사용 시점 | 일반적인 동시 수정 방지 | Race Condition 방지 (INSERT 전 검증) |
| 예시 | 강의 정보 수정 | 수강 신청 정원 체크 |

---

## 8. 비관적 락 (Race Condition 방지)

"조회 → 판단 → INSERT" 패턴에서 발생하는 Race Condition 방지:

```java
// Repository
public interface CourseTimeRepository extends JpaRepository<CourseTime, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ct FROM CourseTime ct WHERE ct.id = :id")
    Optional<CourseTime> findByIdWithLock(@Param("id") Long id);
}

// Service
@Transactional
public void enroll(Long courseTimeId, Long userId) {
    // 비관적 락으로 조회 - 다른 트랜잭션 대기
    CourseTime courseTime = courseTimeRepository.findByIdWithLock(courseTimeId)
            .orElseThrow();

    // 모든 검증을 락 상태에서 수행
    if (isCapacityFull(courseTimeId)) {
        throw new CapacityExceededException();
    }
    if (isAlreadyEnrolled(courseTimeId, userId)) {
        throw new AlreadyEnrolledException();
    }

    // INSERT (락 상태에서 안전하게)
    enrollmentRepository.save(Enrollment.create(courseTimeId, userId));
}
```

> 상세 내용: [transaction-boundaries.md](../context/transaction-boundaries.md)


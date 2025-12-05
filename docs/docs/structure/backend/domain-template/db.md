# {Domain} DB 스키마

> {도메인명} 도메인의 데이터베이스 스키마
> **이 파일을 복사하여 새 도메인 문서 생성**

---

## 테이블: {domains}

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGINT | PK, AUTO | ID |
| field1 | VARCHAR(255) | NOT NULL | 필드1 설명 |
| field2 | VARCHAR(100) | | 필드2 설명 |
| status | VARCHAR(20) | NOT NULL | 상태 (Enum) |
| created_at | TIMESTAMP | NOT NULL | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정일시 |

---

## Entity 클래스

```java
@Entity
@Table(name = "{domains}")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class {Domain} extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String field1;

    private String field2;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private {Domain}Status status;

    // 정적 팩토리 메서드
    public static {Domain} create(String field1, String field2) {
        {Domain} entity = new {Domain}();
        entity.field1 = field1;
        entity.field2 = field2;
        entity.status = {Domain}Status.ACTIVE;
        return entity;
    }

    // 비즈니스 메서드 (Setter 대신)
    public void updateField1(String field1) {
        this.field1 = field1;
    }
}
```

---

## Enum: {Domain}Status

| 값 | 설명 |
|----|------|
| ACTIVE | 활성 |
| INACTIVE | 비활성 |
| DELETED | 삭제됨 |

```java
public enum {Domain}Status {
    ACTIVE,
    INACTIVE,
    DELETED
}
```

---

## 연관관계

```
{Domain} (1) ──── (N) Related{Domain}
                        │
                        │ N:1
                        ▼
                   Another{Domain}
```

### 연관 엔티티

| 엔티티 | 관계 | FK | 설명 |
|--------|------|-----|------|
| Related{Domain} | 1:N | {domain}_id | 관련 엔티티 |
| Another{Domain} | N:1 | another_id | 다른 엔티티 |

---

## 인덱스

```sql
-- 자주 조회되는 컬럼
CREATE INDEX idx_{domains}_status ON {domains}(status);
CREATE INDEX idx_{domains}_field1 ON {domains}(field1);
```

---

## 주의사항

### N+1 쿼리 방지

```java
// ❌ N+1 발생
List<{Domain}> list = repository.findAll();
for ({Domain} item : list) {
    item.getRelated().getName(); // 매번 쿼리
}

// ✅ Fetch Join 사용
@Query("SELECT d FROM {Domain} d JOIN FETCH d.related")
List<{Domain}> findAllWithRelated();
```

---

## 관련 문서

- [API 명세](./api.md)
- [DB 컨텍스트](../../context/database.md)

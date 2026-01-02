# data.sql cm_programs 컬럼명 불일치 이슈

## 작업 정보

- **작업 일자**: 2026-01-02
- **작업 담당**: hjj240228mz
- **관련 모듈**: CM (Course Management) - Program

---

## 1. 이슈 개요

### 증상

`./gradlew bootRun` 실행 시 `data.sql` 초기화 단계에서 에러 발생:

```
Caused by: java.sql.SQLException: Field 'creator_id' doesn't have a default value
```

### 원인

데이터베이스 스키마와 data.sql 간 컬럼명 불일치:

| 위치 | 컬럼명 |
|------|--------|
| DB 테이블 (기존 생성) | `creator_id` |
| Program.java 엔티티 | `created_by` |
| data.sql INSERT | `created_by` |

---

## 2. 발생 원인 분석

### 2.1 Hibernate DDL-AUTO 설정

```yaml
# application.yml
jpa:
  hibernate:
    ddl-auto: ${JPA_DDL_AUTO:update}
```

- `update` 모드는 기존 컬럼을 삭제/수정하지 않음
- 이전에 `creator_id`로 생성된 컬럼이 남아있음
- 엔티티가 `created_by`로 변경되어도 DB에 반영되지 않음

### 2.2 엔티티 정의

```java
// Program.java
@Column(name = "created_by", nullable = false)
private Long createdBy;
```

### 2.3 data.sql INSERT

```sql
INSERT INTO cm_programs (
  id, tenant_id, version, title, description, thumbnail_url,
  level, type, estimated_hours, status,
  created_by,  -- 엔티티와 일치하나 DB와 불일치
  approved_by, approved_at, created_at, updated_at
)
```

---

## 3. 해결 방법

### 옵션 1: 테이블 재생성 (개발 환경)

```sql
DROP TABLE cm_programs;
-- bootRun 시 Hibernate가 새 스키마로 생성
```

### 옵션 2: 컬럼 마이그레이션

```sql
ALTER TABLE cm_programs CHANGE creator_id created_by BIGINT NOT NULL;
```

### 옵션 3: DDL-AUTO 변경 (비권장)

```yaml
ddl-auto: create-drop  # 매번 스키마 재생성
```

---

## 4. 적용한 해결 방법

**옵션 1 선택**: 개발 환경이므로 테이블 DROP 후 재실행

```sql
DROP TABLE cm_programs;
```

이후 `bootRun` 실행 시 Hibernate가 엔티티 기준으로 새 테이블 생성.

---

## 5. 예방 조치

### 5.1 컬럼명 변경 시 주의사항

1. `ddl-auto: update`는 컬럼 삭제/이름 변경을 하지 않음
2. 컬럼명 변경 시 수동 마이그레이션 필요
3. data.sql과 엔티티 @Column(name) 일치 확인 필수

### 5.2 권장 워크플로우

```
1. 엔티티 @Column(name = "xxx") 확인
2. data.sql INSERT 컬럼명 일치 확인
3. 로컬 DB 스키마와 비교
4. 불일치 시 마이그레이션 스크립트 작성 또는 테이블 재생성
```

---

## 6. 관련 파일

| 파일 | 내용 |
|------|------|
| `Program.java` | `@Column(name = "created_by")` 정의 |
| `data.sql` | `cm_programs` INSERT 문 |
| `application.yml` | `ddl-auto: update` 설정 |

---

**작성**: hjj240228mz
**검토 완료**: 2026-01-02

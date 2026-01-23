# 시드 데이터 구조 최적화

> **작업일**: 2026-01-20 ~ 2026-01-21
> **작업 범위**: `mzc-lp-backend/src/main/resources/db/seed/`, `DataSourceInitConfig`
> **관련 모듈**: CM(Course Management), TS(Training Session), Snapshot
> **관련 PR**: #421, #427

## 개요

시드 데이터의 엔티티 관계 불일치 및 누락된 데이터 구조를 정비하여, 백엔드 애플리케이션이 정상적으로 부팅되고 개발/테스트 환경에서 사용 가능한 상태로 만드는 작업을 수행했습니다.

## 주요 변경 사항

### 1. LearningObject 시드 데이터 신규 생성

**파일**: `V007_5__learning_objects.sql` (신규 생성)

기존에 `CourseItem.learning_object_id`가 모두 NULL로 설정되어 있던 문제를 해결하기 위해, Content 기반의 LearningObject 시드 데이터를 생성했습니다.

```
Content → LearningObject → CourseItem
                        → SnapshotLearningObject
```

| 테넌트 | ID 범위 | 레코드 수 |
|--------|---------|----------|
| 1 | 1-22 | 22개 |
| 2 | 101-104 | 4개 |
| 3 | 201-204 | 4개 |

### 2. CourseItem 구조 재설계

**파일**: `V008__courses.sql`

폴더/아이템 계층 구조를 명확히 분리하고, 학습 아이템에 `learning_object_id`를 연결했습니다.

```sql
-- 폴더 (learning_object_id = NULL)
(1, 1, 1, NULL, NULL, '1장. Spring Boot 시작하기', NULL, NULL, 0, ...)

-- 학습 아이템 (learning_object_id 지정)
(3, 1, 1, 1, 1, 'Spring Boot 소개', '설명...', 1, ...)
```

**구조 규칙**:
- `depth=0` + `learning_object_id=NULL`: 폴더
- `depth=1` + `learning_object_id=N`: 학습 아이템

### 3. Snapshot-CourseTime 1:1 관계 수정

**파일**: `V009__snapshots.sql`, `V010__course_times.sql`

#### 문제점
`CourseTime.snapshot`이 `@OneToOne` 관계로 설정되어 있어 unique constraint가 존재하는데, 기존 시드 데이터에서는 동일한 `snapshot_id`를 여러 차수에서 재사용하여 constraint violation 발생.

```
ERROR: Duplicate entry '1' for key 'course_times.UKtlj0cpsbgcks31708ag26uvuy'
```

#### 해결
차수(CourseTime) ID와 스냅샷(Snapshot) ID를 1:1로 매핑하여 각 차수가 고유한 스냅샷을 갖도록 수정.

| 테넌트 | 스냅샷 ID | 차수 ID | 개수 |
|--------|-----------|---------|------|
| 1 | 1-12 | 1-12 | 12개 |
| 2 | 51-56 | 51-56 | 6개 |
| 3 | 101-106 | 101-106 | 6개 |

### 4. DataSourceInitConfig 수정

**파일**: `DataSourceInitConfig.java`

V007_5를 시드 로딩 순서에 추가:

```java
populator.addScript(new ClassPathResource("db/seed/V007__contents.sql"));
populator.addScript(new ClassPathResource("db/seed/V007_5__learning_objects.sql")); // 추가
populator.addScript(new ClassPathResource("db/seed/V008__courses.sql"));
```

### 5. TRUNCATE 테이블 목록 수정

**파일**: `V001__truncate_tables.sql`

`learning_object` 테이블 추가:

```sql
-- 콘텐츠/러닝오브젝트
TRUNCATE TABLE learning_object;
TRUNCATE TABLE content;
```

## 엔티티 관계 정리

### Course-Snapshot-CourseTime 관계

```
Course (REGISTERED)
   │
   ├──[1:N]──▶ CourseTime 1 ◀──[1:1]──▶ Snapshot 1
   │
   ├──[1:N]──▶ CourseTime 2 ◀──[1:1]──▶ Snapshot 2
   │
   └──[1:N]──▶ CourseTime 3 ◀──[1:1]──▶ Snapshot 3
```

| 관계 | 카디널리티 | JPA 어노테이션 |
|------|-----------|---------------|
| Course → CourseTime | 1:N | `@ManyToOne` (CourseTime) |
| Course → CourseSnapshot | 1:N | `@ManyToOne` (CourseSnapshot.sourceCourse) |
| CourseSnapshot → CourseTime | 1:1 | `@OneToOne` (CourseTime.snapshot) |

### Content-LearningObject-CourseItem 관계

```
Content (콘텐츠)
   │
   └──[1:N]──▶ LearningObject (러닝오브젝트)
                    │
                    ├──▶ CourseItem.learning_object_id
                    │
                    └──▶ SnapshotLearningObject.source_lo_id
```

## 비즈니스 플로우

### 코스 등록 → 차수 생성 플로우

```
1. Course 생성 (DRAFT)
       ↓
2. Course 상태 변경 (READY)
       ↓
3. Course 등록 (REGISTERED)
   - Course.register() 호출
   - status만 변경, 스냅샷 생성 안함
       ↓
4. CourseTime 생성 요청
   - CourseTimeServiceImpl.createCourseTime()
   - snapshotService.createSnapshotFromCourse() 호출
   - 새 스냅샷 생성 (Course 딥카피)
   - courseTime.linkCourseAndSnapshot(course, snapshot)
       ↓
5. 완료: 차수 + 고유 스냅샷 생성됨
```

**핵심 포인트**: 스냅샷은 코스 등록 시점이 아닌 **차수 생성 시점**에 생성됨

## 최종 데이터 현황

| 테이블 | 레코드 수 |
|--------|----------|
| course_times | 24 |
| cm_snapshots | 24 |
| learning_object | 30 |
| cm_course_items | 41 |
| cm_snapshot_items | 27 |

## 수정된 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `V001__truncate_tables.sql` | 수정 | learning_object TRUNCATE 추가 |
| `V007_5__learning_objects.sql` | 신규 | LearningObject 시드 데이터 |
| `V008__courses.sql` | 수정 | CourseItem에 learning_object_id 연결 |
| `V009__snapshots.sql` | 수정 | 차수별 고유 스냅샷 (24개) |
| `V010__course_times.sql` | 수정 | snapshot_id 1:1 매핑 |
| `DataSourceInitConfig.java` | 수정 | V007_5 로딩 순서 추가 |

## 검증 결과

- 애플리케이션 부팅: 성공
- 시드 데이터 로드: 성공
- FK/Unique Constraint: 모두 충족
- 엔티티 관계: 정합성 확인

## 향후 고려사항

1. **스냅샷 LO/Item 확장**: 현재 스냅샷별 LO/Item 데이터가 최소화되어 있음. 필요시 확장 가능.
2. **테넌트별 데이터 균형**: 테넌트 1에 데이터가 집중되어 있음. 테넌트 2, 3 데이터 보강 검토.
3. **성능 테스트**: 대량 데이터 시드 시 성능 검증 필요.

---

## 추가 작업: DepartmentInitializer 조건부 실행 (#427)

> **작업일**: 2026-01-21

### 배경

서버 재부팅 시 DB 데이터가 초기화되는 문제가 있었습니다. 원인은 `sql.init.mode=always` 설정으로 인해 매번 seed 데이터가 TRUNCATE → 재삽입되기 때문입니다.

데이터 보존을 위해 `sql.init.mode=never`로 변경하면, `DepartmentInitializer`가 seed 데이터 없이 실행되어 트랜잭션 롤백 오류(`UnexpectedRollbackException`)가 발생했습니다.

### 해결

`DepartmentInitializer`에 `@ConditionalOnProperty` 추가하여 `sql.init.mode=always`일 때만 실행되도록 수정.

```java
@ConditionalOnProperty(name = "spring.sql.init.mode", havingValue = "always")
public class DepartmentInitializer { ... }
```

### 로컬에서 데이터 보존하려면

`application.yml` 또는 환경변수에서 다음과 같이 설정:

```yaml
spring:
  sql:
    init:
      mode: never
```

또는 `.env` 파일에:
```
SQL_INIT_MODE=never
```

> ⚠️ 이 설정은 로컬 개발용입니다. 기본값(`always`)은 seed 데이터 초기화가 필요한 경우를 위해 유지됩니다.

### 검증 결과

- `sql.init.mode=always`로 서버 시작 → 정상 동작 확인
- `sql.init.mode=never`로 서버 시작 → 오류 없이 시작, 데이터 보존 확인

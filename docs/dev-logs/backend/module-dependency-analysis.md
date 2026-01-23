# 모듈 의존성 분석 및 개선 방안

> 모듈 간 양방향 의존성, Master/Driving 관계, 동시성 이슈 분석

---

## 1. 모듈 의존성 현황

### 1.1 의존성 유형 분류

```
┌─────────────────────────────────────────────────────────────────┐
│                    의존성 유형 분류                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [단방향 의존성]                                                  │
│  A ────────► B                                                   │
│  A가 B를 참조, B는 A를 모름                                       │
│                                                                  │
│  [양방향 의존성]                                                  │
│  A ◄────────► B                                                  │
│  서로 참조 (순환 참조 가능성)                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 현재 모듈 간 의존성 맵

```
┌─────────────────────────────────────────────────────────────────┐
│                      모듈 의존성 맵                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────┐                              │
│                    │   Content    │                              │
│                    │    (CMS)     │                              │
│                    └──────┬───────┘                              │
│                           │ FK                                   │
│                           ▼                                      │
│     ┌────────────────────────────────────────────┐               │
│     │             LearningObject (LO)            │               │
│     │          learning_object.content_id        │               │
│     └────────────────────┬───────────────────────┘               │
│                          │ FK                                    │
│                          ▼                                       │
│     ┌────────────────────────────────────────────┐               │
│     │               CourseItem (CM)              │               │
│     │       course_item.learning_object_id       │               │
│     └────────────────────┬───────────────────────┘               │
│                          │ FK                                    │
│                          ▼                                       │
│     ┌────────────────────────────────────────────┐               │
│     │                 Course (CM)                │               │
│     │            course_item.course_id           │               │
│     └────────────────────┬───────────────────────┘               │
│                          │ FK (optional)                         │
│                          ▼                                       │
│     ┌────────────────────────────────────────────┐               │
│     │            CourseSnapshot (TS)             │               │
│     │         cm_snapshots.source_course_id      │               │
│     └────────────────────┬───────────────────────┘               │
│                          │ FK (optional)                         │
│                          ▼                                       │
│     ┌────────────────────────────────────────────┐               │
│     │               Program (TS)                 │               │
│     │           cm_programs.snapshot_id          │               │
│     └────────────────────────────────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 양방향 의존성 상세 분석

### 2.1 Content ↔ LearningObject

| 항목 | 상세 |
|------|------|
| **FK 위치** | `learning_object.content_id` → `content.id` |
| **Master** | Content (FK를 소유하지 않음) |
| **Detail** | LearningObject (FK 소유) |
| **관계 유형** | 1:1 (Content 하나당 LO 하나) |

```java
// LearningObject.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "content_id")
private Content content;

// Content.java
@OneToOne(mappedBy = "content")
private LearningObject learningObject;  // 양방향 참조
```

**이슈**:
- Content 삭제 시 LO도 삭제해야 함
- Event 기반으로 LO 자동 생성 중 (ContentCreatedEvent)

### 2.2 Course ↔ CourseSnapshot

| 항목 | 상세 |
|------|------|
| **FK 위치** | `cm_snapshots.source_course_id` → `cm_courses.id` |
| **Master** | Course (FK를 소유하지 않음) |
| **Detail** | CourseSnapshot (FK 소유, optional) |
| **관계 유형** | 1:N (Course 하나에 여러 Snapshot) |

```java
// CourseSnapshot.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "source_course_id")
private Course sourceCourse;  // nullable - 스냅샷 전용 코스일 수 있음

// Course.java
@OneToMany(mappedBy = "sourceCourse")
private List<CourseSnapshot> snapshots = new ArrayList<>();
```

**이슈**:
- Snapshot은 Course의 특정 시점 복사본
- source_course_id가 NULL인 경우: 스냅샷 전용 코스
- Course 삭제 시 Snapshot 처리 정책 필요

### 2.3 CourseSnapshot ↔ Program

| 항목 | 상세 |
|------|------|
| **FK 위치** | `cm_programs.snapshot_id` → `cm_snapshots.id` |
| **Master** | CourseSnapshot (FK를 소유하지 않음) |
| **Detail** | Program (FK 소유, optional) |
| **관계 유형** | 1:N (Snapshot 하나에 여러 Program) |

```java
// Program.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "snapshot_id")
private CourseSnapshot snapshot;  // nullable

// CourseSnapshot.java
@OneToMany(mappedBy = "snapshot")
private List<Program> programs = new ArrayList<>();
```

**이슈**:
- Program은 실제 운영 단위 (차수)
- Snapshot 수정 시 연결된 Program에 영향

---

## 3. Master/Driving 관계 정의

### 3.1 Driving Order (생성 순서)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Driving Order (생성 순서)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: 콘텐츠 생성                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Content 업로드 (CMS)                                 │    │
│  │     POST /api/contents/upload                           │    │
│  │                       │                                 │    │
│  │                       ▼                                 │    │
│  │  2. LearningObject 자동 생성 (Event)                    │    │
│  │     ContentCreatedEvent → LearningObjectEventListener   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Phase 2: 강의 구성                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  3. Course 생성 (CM)                                    │    │
│  │     POST /api/courses                                   │    │
│  │                       │                                 │    │
│  │                       ▼                                 │    │
│  │  4. CourseItem 생성 + LO 연결 (CM)                      │    │
│  │     POST /api/courses/{id}/items                        │    │
│  │     - learningObjectId 지정                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Phase 3: 스냅샷/프로그램                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  5. CourseSnapshot 생성 (TS)                            │    │
│  │     POST /api/snapshots                                 │    │
│  │     - sourceCourseId 지정 (optional)                    │    │
│  │                       │                                 │    │
│  │                       ▼                                 │    │
│  │  6. Program 생성 (TS)                                   │    │
│  │     POST /api/programs                                  │    │
│  │     - snapshotId 지정 (optional)                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Master 엔티티 요약

| 관계 | Master | Slave | 비고 |
|------|--------|-------|------|
| Content - LO | **Content** | LearningObject | FK: LO가 소유 |
| Course - Snapshot | **Course** | CourseSnapshot | FK: Snapshot이 소유 (optional) |
| Snapshot - Program | **CourseSnapshot** | Program | FK: Program이 소유 (optional) |

---

## 4. 동시성/격리성 이슈

### 4.1 현재 상태: 동시성 제어 없음

현재 코드베이스에서 확인된 사항:
- `@Version` (Optimistic Lock): 미사용
- `@Lock` (Pessimistic Lock): 미사용
- 트랜잭션: `@Transactional` 메서드 레벨 적용

### 4.2 발생 가능한 문제 시나리오

#### 시나리오 1: Lost Update (갱신 손실)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lost Update 시나리오                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Time   User A                    User B                        │
│  ─────────────────────────────────────────────────────────      │
│  T1     Course 조회 (v1)                                        │
│  T2                               Course 조회 (v1)              │
│  T3     title 수정 → 저장                                       │
│  T4                               description 수정 → 저장       │
│  ─────────────────────────────────────────────────────────      │
│  결과: User A의 title 변경 사라짐 (User B가 덮어씀)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 시나리오 2: 연관 엔티티 동시 수정

```
┌─────────────────────────────────────────────────────────────────┐
│                    연관 엔티티 충돌 시나리오                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Time   Admin A                   Admin B                       │
│  ─────────────────────────────────────────────────────────      │
│  T1     CourseItem 순서 변경                                    │
│  T2                               같은 Course의 Item 삭제       │
│  T3     정합성 문제 발생                                         │
│         - 삭제된 Item에 대한 순서 참조                           │
│         - CourseRelation 깨짐                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 위험도 평가

| 엔티티 | 동시 수정 가능성 | 위험도 | 비고 |
|--------|-----------------|--------|------|
| Course | 높음 (다중 관리자) | **높음** | 커리큘럼 수정 빈번 |
| CourseItem | 높음 | **높음** | 순서 변경, 추가/삭제 |
| LearningObject | 중간 | **중간** | 메타데이터 수정 |
| Content | 낮음 | 낮음 | 주로 읽기 |
| CourseSnapshot | 낮음 | 낮음 | 생성 후 수정 드묾 |
| Program | 중간 | **중간** | 운영 중 수정 가능 |

---

## 5. 개선 방안

### 5.1 Optimistic Locking 도입

**대상 엔티티**: Course, CourseItem, LearningObject, Program

```java
@Entity
@Table(name = "cm_courses")
public class Course extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version  // 추가
    private Long version;

    // ... 기존 필드
}
```

**적용 효과**:
- 동시 수정 시 `OptimisticLockException` 발생
- 클라이언트에서 재시도 또는 충돌 알림 가능

### 5.2 Pessimistic Locking (선택적)

**대상**: 순서 변경, 대량 업데이트 시

```java
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdForUpdate(@Param("id") Long id);
}
```

**사용 시나리오**:
- CourseItem 일괄 순서 변경
- CourseRelation 재구성
- 대량 데이터 처리

### 5.3 서비스 레벨 동시성 제어

```java
@Service
@RequiredArgsConstructor
public class CourseItemService {

    private final CourseRepository courseRepository;
    private final CourseItemRepository courseItemRepository;

    @Transactional
    public void reorderItems(Long courseId, List<Long> itemOrder) {
        // 1. Course에 Pessimistic Lock
        Course course = courseRepository.findByIdForUpdate(courseId)
            .orElseThrow(() -> new EntityNotFoundException("Course not found"));

        // 2. 순서 변경 로직
        // ...

        // 3. 트랜잭션 종료 시 Lock 해제
    }
}
```

### 5.4 적용 우선순위

| 우선순위 | 엔티티 | 적용 방식 | 이유 |
|----------|--------|----------|------|
| **1순위** | Course | @Version | 동시 수정 가장 빈번 |
| **1순위** | CourseItem | @Version | 순서/구조 변경 잦음 |
| **2순위** | LearningObject | @Version | 메타데이터 수정 |
| **2순위** | Program | @Version | 운영 데이터 |
| **3순위** | CourseSnapshot | 검토 후 결정 | 수정 빈도 낮음 |

---

## 6. 구현 체크리스트

### 6.1 Phase 1: Optimistic Locking

- [ ] Course Entity에 @Version 추가
- [ ] CourseItem Entity에 @Version 추가
- [ ] LearningObject Entity에 @Version 추가
- [ ] Program Entity에 @Version 추가
- [ ] OptimisticLockException 예외 핸들러 추가
- [ ] Frontend 충돌 처리 UI 구현

### 6.2 Phase 2: Pessimistic Locking

- [ ] CourseRepository.findByIdForUpdate() 추가
- [ ] CourseItem 순서 변경 시 Pessimistic Lock 적용
- [ ] CourseRelation 재구성 시 Lock 적용

### 6.3 Phase 3: 모니터링

- [ ] 동시성 충돌 로깅 추가
- [ ] 충돌 빈도 메트릭 수집
- [ ] 알림 설정 (임계치 초과 시)

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 시스템 전체 아키텍처 |
| [06-ENTITY-CONVENTIONS.md](../conventions/06-ENTITY-CONVENTIONS.md) | 엔티티 컨벤션 |
| [04-SERVICE-CONVENTIONS.md](../conventions/04-SERVICE-CONVENTIONS.md) | 서비스 컨벤션 |

---

## 변경 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2025-12-19 | Claude | 초안 작성 |

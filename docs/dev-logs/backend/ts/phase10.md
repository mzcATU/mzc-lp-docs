# Backend TS (Training Session) 개발 로그 - Phase 10

> Course 상태 재설계 및 Program 엔티티 제거

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz |
| **작업 기간** | 2026-01-13 ~ 2026-01-14 |
| **관련 이슈** | #368 |
| **관련 PR** | #373, #378, #381 |
| **담당 모듈** | TS (Training Session), CM (Course Management) |

---

## 1. 구현 개요

### 1.1 주요 작업 내역

| Phase | 설명 | 관련 PR |
|-------|------|---------|
| Phase 1 | Course 상태 전환 재설계 (DRAFT → READY → REGISTERED) | #373 |
| Phase 2 | Course 기반 CourseTime 생성 및 Snapshot 자동 딥카피 | #378 |
| Phase 3 | Program 엔티티 완전 제거 및 Course 직접 참조 체계 전환 | #381 |

---

## 2. Phase 1: Course 상태 전환 재설계 (#373)

### 2.1 CourseStatus enum 재설계

| 상태 | 설명 | 수정 가능 | 차수 생성 |
|------|------|----------|----------|
| `DRAFT` | 작성중 | ✅ | ❌ |
| `READY` | 작성완료 | ✅ | ❌ |
| `REGISTERED` | 등록됨 | ❌ | ✅ |

### 2.2 신규 API 엔드포인트

```
POST /api/courses/{id}/ready     - DRAFT → READY
POST /api/courses/{id}/unready   - READY → DRAFT
POST /api/courses/{id}/register  - READY → REGISTERED (단방향)
```

### 2.3 상태 전환 규칙

```
DRAFT ──[ready()]──▶ READY ──[register()]──▶ REGISTERED
  ▲                    │
  └────[unready()]─────┘
```

- `REGISTERED` 상태는 되돌릴 수 없음 (단방향)
- `REGISTERED` 상태에서만 차수(CourseTime) 생성 가능

### 2.4 신규 예외 클래스

| 예외 | 에러코드 | 설명 |
|------|----------|------|
| `CourseNotModifiableException` | CM018 | REGISTERED 상태에서 수정 시도 |
| `InvalidCourseStatusTransitionException` | CM019 | 잘못된 상태 전환 시도 |

### 2.5 수정 파일

- `ErrorCode.java` - CM018, CM019 추가
- `CourseStatus.java` - enum 재설계 및 헬퍼 메서드
- `Course.java` - 상태 전환 메서드 추가
- `CourseService.java` / `CourseServiceImpl.java` - 신규 메서드 구현
- `CourseItemServiceImpl.java` - 수정 가능 상태 검증 추가
- `CourseController.java` - 신규 엔드포인트
- `V20260113__course_status_migration.sql` - PUBLISHED → READY 마이그레이션

---

## 3. Phase 2: Course 기반 CourseTime 생성 (#378)

### 3.1 변경 사항

CourseTime 엔티티에 Course, Snapshot 직접 참조 추가.

| 필드 | 상태 | 설명 |
|------|------|------|
| `course` | 신규 | Course 직접 참조 |
| `snapshot` | 신규 | Snapshot 직접 참조 |
| `program` | deprecated | 기존 Program 참조 (하위 호환) |

### 3.2 CourseTime 생성 플로우

```
1. createCourseTimeFromCourse(courseId, request) 호출
2. Course가 REGISTERED 상태인지 검증
3. snapshotService.createSnapshotFromCourse() 호출
   - Course 데이터 딥카피하여 Snapshot 생성
4. CourseTime 생성 및 Course, Snapshot 연결
5. 완료: CourseTime + 고유 Snapshot 생성됨
```

### 3.3 신규 예외 클래스

| 예외 | 에러코드 | 설명 |
|------|----------|------|
| `CourseNotRegisteredException` | CM020 | REGISTERED가 아닌 Course에서 차수 생성 시도 |

### 3.4 수정 파일

- `CourseTime.java` - course, snapshot 필드 추가
- `CreateCourseTimeRequest.java` - courseId 추가, programId deprecated
- `CourseTimeServiceImpl.java` - createCourseTimeFromCourse() 메서드 추가
- `ErrorCode.java` - CM_COURSE_NOT_REGISTERED (CM020) 추가
- `V20260113_2__coursetime_course_snapshot_relation.sql` - 마이그레이션

---

## 4. Phase 3: Program 엔티티 제거 (#381)

### 4.1 삭제된 파일 (20개)

`com.mzc.lp.domain.program` 패키지 전체 삭제:
- Program 엔티티, Repository, Service, Controller
- ProgramStatus, ProgramType enum
- 관련 DTO, Exception 클래스

### 4.2 CourseTime → Course 직접 참조

| Before | After |
|--------|-------|
| `CourseTime.program.title` | `CourseTime.course.title` |
| `ProgramSummaryResponse` | `CourseSummaryResponse` |
| `withProgramId()` | `withCourseId()` |

### 4.3 Certificate 변경

`Certificate` 엔티티에서 `programId`, `programTitle` 필드 제거.

### 4.4 Dashboard/Cart/Wishlist 변경

| 컴포넌트 | Before | After |
|----------|--------|-------|
| `AdminKpiResponse` | `ProgramStats` | `CourseStats` |
| `OwnerStatsResponse` | `ProgramStat` | `CourseStat` |
| Cart/Wishlist 서비스 | Program 참조 | Course 참조 |

### 4.5 Roadmap 비활성화

Roadmap 기능은 Course 기반으로 재설계 예정. 현재 503 SERVICE_UNAVAILABLE 응답.

```java
@GetMapping
public ResponseEntity<?> getRoadmaps() {
    throw new UnsupportedOperationException("ROADMAP_FEATURE_DISABLED");
}
```

### 4.6 DB 마이그레이션

`V20260114__remove_program_entity.sql` 추가.

---

## 5. 엔티티 관계도 (변경 후)

```
Course (REGISTERED)
   │
   ├──[1:N]──▶ CourseTime ◀──[1:1]──▶ CourseSnapshot
   │               │
   │               └──▶ Enrollment ──▶ Certificate
   │
   └──[1:N]──▶ CourseItem
                   │
                   └──▶ LearningObject ──▶ Content
```

---

## 6. Git 커밋 히스토리

```
2026-01-14 feat(ts): Program 엔티티 제거 및 Course 직접 참조 (Phase 3) (#381)
2026-01-13 feat(ts): Course 기반 CourseTime 생성 및 Snapshot 자동 생성 (Phase 2) (#378)
2026-01-13 feat(course): Course 상태 전환 재설계 (Phase 1) (#373)
```

---

**작성자**: hjj240228mz
**최종 수정**: 2026-01-14

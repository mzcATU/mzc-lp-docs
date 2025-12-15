# Backend TS 모듈 개발 로그 - Phase 4

> TS 배치 Job 구현 - 차수 상태 자동 전환

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-15 |
| **관련 이슈** | [#30](https://github.com/mzcATU/mzc-lp-backend/issues/30) |
| **담당 모듈** | TS (Time Schedule - 차수 관리) |

---

## 1. 구현 개요

배치 Job을 통한 차수 상태 자동 전환 기능:

| 구성요소 | 내용 |
|----------|------|
| Scheduler | Spring @Scheduled 기반 스케줄러 |
| Repository | 배치용 쿼리 메서드 2개 |
| Config | @EnableScheduling 활성화 |
| Test | Scheduler 단위 테스트 7개 |

---

## 2. 신규 생성 파일 (2개)

### Scheduler

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeScheduler.java | `scheduler/` | 배치 스케줄러 컴포넌트 |

### Test

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseTimeSchedulerTest.java | `test/.../scheduler/` | Scheduler 단위 테스트 |

---

## 3. 수정된 파일 (2개)

| 파일 | 변경 내용 |
|------|----------|
| LpApplication.java | `@EnableScheduling` 추가 |
| CourseTimeRepository.java | 배치용 쿼리 메서드 2개 추가 |

---

## 4. 파일 구조

```
domain/ts/
├── scheduler/
│   └── CourseTimeScheduler.java         ✅ 신규
└── repository/
    └── CourseTimeRepository.java        ✅ 수정

com/mzc/lp/
└── LpApplication.java                   ✅ 수정

test/.../ts/
└── scheduler/
    └── CourseTimeSchedulerTest.java     ✅ 신규
```

---

## 5. 배치 Job 상세

### 상태 전환 규칙

| 배치 | 조건 | 전환 |
|------|------|------|
| startCourseTimes | status=RECRUITING AND classStartDate <= today | RECRUITING → ONGOING |
| closeCourseTimes | status=ONGOING AND classEndDate < today | ONGOING → CLOSED |

### 스케줄 설정

| 배치 | cron 표현식 | 설명 |
|------|-------------|------|
| startCourseTimes | `0 0 0 * * *` | 매일 자정 실행 |
| closeCourseTimes | `0 0 0 * * *` | 매일 자정 실행 |

### 외부 설정 지원

```yaml
# application.yml (선택)
scheduler:
  course-time:
    start-class: "0 0 0 * * *"  # 기본값: 매일 자정
    close-class: "0 0 0 * * *"  # 기본값: 매일 자정
```

---

## 6. B2C 상시 모집 제외 로직

### 설계 결정

| 방식 | 설명 |
|------|------|
| 기간으로 판단 | classEndDate = 9999-12-31인 경우 자연스럽게 제외 |

### 동작 원리

```sql
-- closeCourseTimes 쿼리 조건
WHERE status = 'ONGOING' AND classEndDate < today

-- 상시 모집 차수 (classEndDate = 9999-12-31)
-- 9999-12-31 < 2025-12-15 → FALSE → 조회되지 않음 → 자동 제외
```

### 장점

- 추가 필드 불필요
- 별도 필터링 로직 불필요
- 기존 설계(Feature 1-2)와 일치

---

## 7. Repository 쿼리

### 신규 추가 메서드

```java
// RECRUITING → ONGOING (classStartDate 도래)
List<CourseTime> findByStatusAndClassStartDateLessThanEqual(
    CourseTimeStatus status,
    LocalDate today
);

// ONGOING → CLOSED (classEndDate 경과)
List<CourseTime> findByStatusAndClassEndDateLessThan(
    CourseTimeStatus status,
    LocalDate today
);
```

---

## 8. Scheduler 구현

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class CourseTimeScheduler {

    private final CourseTimeRepository courseTimeRepository;

    @Scheduled(cron = "${scheduler.course-time.start-class:0 0 0 * * *}")
    @Transactional
    public void startCourseTimes() {
        LocalDate today = LocalDate.now();
        log.info("[Batch] Starting course times: date={}", today);

        List<CourseTime> courseTimesToStart = courseTimeRepository
                .findByStatusAndClassStartDateLessThanEqual(CourseTimeStatus.RECRUITING, today);

        // 개별 처리 및 에러 핸들링
        for (CourseTime courseTime : courseTimesToStart) {
            try {
                courseTime.startClass();
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.error("[Batch] Failed to start: id={}", courseTime.getId());
            }
        }
    }

    @Scheduled(cron = "${scheduler.course-time.close-class:0 0 0 * * *}")
    @Transactional
    public void closeCourseTimes() {
        // 유사한 구조로 ONGOING → CLOSED 처리
    }
}
```

---

## 9. 테스트 결과

### Scheduler 단위 테스트 (7개)

| 카테고리 | 테스트 | 결과 |
|----------|--------|------|
| startCourseTimes | 성공 - classStartDate 도래한 차수 ONGOING 전환 | ✅ |
| startCourseTimes | 성공 - 전환할 차수가 없는 경우 | ✅ |
| startCourseTimes | 성공 - 여러 차수 일괄 전환 | ✅ |
| closeCourseTimes | 성공 - classEndDate 경과한 차수 CLOSED 전환 | ✅ |
| closeCourseTimes | 성공 - 종료할 차수가 없는 경우 | ✅ |
| closeCourseTimes | 성공 - 여러 차수 일괄 종료 | ✅ |
| B2C 상시모집 | 상시 모집(9999-12-31)은 배치에서 제외됨 검증 | ✅ |

### DB 기능 테스트 (수동)

| 시나리오 | classStartDate / classEndDate | 기대 결과 | 실제 결과 |
|----------|-------------------------------|----------|----------|
| RECRUITING + 오늘 시작 | 2025-12-15 | ONGOING | ✅ ONGOING |
| RECRUITING + 과거 시작 | 2025-12-10 | ONGOING | ✅ ONGOING |
| RECRUITING + 미래 시작 | 2025-12-25 | RECRUITING | ✅ RECRUITING |
| ONGOING + 과거 종료 | 2025-12-14 | CLOSED | ✅ CLOSED |
| ONGOING + 오늘 종료 | 2025-12-15 | ONGOING | ✅ ONGOING |
| ONGOING + 미래 종료 | 2026-01-14 | ONGOING | ✅ ONGOING |
| ONGOING + 상시(9999-12-31) | 9999-12-31 | ONGOING | ✅ ONGOING (제외됨) |

---

## 10. 컨벤션 준수 체크

### Scheduler

- [x] `@Slf4j` 로깅
- [x] `@RequiredArgsConstructor` 생성자 주입
- [x] `@Transactional` 쓰기 작업에 적용
- [x] cron 표현식 외부 설정 지원

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] Spring Data JPA 네이밍 컨벤션 활용
- [x] Javadoc 주석으로 쿼리 설명

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] Given-When-Then 패턴
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] BDDMockito (`given()`) 사용
- [x] `verify()` 호출 검증

---

## 11. 주요 결정 사항

### closeCourseTimes 조건: LessThan vs LessThanEqual

| 조건 | 쿼리 | 선택 |
|------|------|------|
| LessThan | `classEndDate < today` | ✅ 선택 |
| LessThanEqual | `classEndDate <= today` | ❌ |

**이유**: 종료일 당일까지는 수강 가능해야 하므로, 종료일이 지난 다음날 자정에 CLOSED로 전환

### startCourseTimes 조건: LessThanEqual

| 조건 | 쿼리 | 선택 |
|------|------|------|
| LessThanEqual | `classStartDate <= today` | ✅ 선택 |

**이유**: 시작일 당일 자정에 ONGOING으로 전환되어야 수강 시작 가능

---

## 12. 다음 작업

| 이슈 | 내용 | 비고 |
|------|------|------|
| #51 | TS 강사 배정 CRUD API | IIS 모듈 연동 |
| #50 | SIS 수강신청 CRUD API | occupySeat/releaseSeat 연동 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-15 | Claude Code | Phase 4 구현 완료 (배치 Job, 상태 자동 전환) |

---

*최종 업데이트: 2025-12-15*

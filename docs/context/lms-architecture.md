# LMS 아키텍처 (Learning Management System)

> 학습 관리 시스템의 핵심 개념, 수업 유형, 진도/성적 관리

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 섹션 |
|----------|----------|
| LMS vs SIS 차이점? | 섹션 1 |
| 수업 유형별 완료 조건? | 섹션 2 |
| 진도 추적 방식? | 섹션 3 |
| 성적 산출 방식? | 섹션 4 |
| 학습 순서 규칙? | 섹션 5 |
| 전체 학습 플로우? | 섹션 6 |

---

## 1. LMS vs SIS 구분

```
┌─────────────────────────────────────────────────────────────┐
│                     교육 플랫폼                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────────────┐    ┌──────────────────────┐      │
│   │   LMS (Learning      │    │   SIS (Student       │      │
│   │   Management System) │    │   Information System)│      │
│   ├──────────────────────┤    ├──────────────────────┤      │
│   │ - 강의 콘텐츠 관리    │    │ - 수강생 정보 관리    │      │
│   │ - 커리큘럼 구성       │    │ - 수강 기록           │      │
│   │ - 학습 경로 설정      │    │ - 성적/진도 추적      │      │
│   │ - 퀴즈/과제 관리      │    │ - 출결 관리           │      │
│   └──────────────────────┘    └──────────────────────┘      │
│              │                          ▲                    │
│              │      학습 결과 기록       │                    │
│              └──────────────────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**핵심 구분:**
- **SIS**: "누가 언제 수강 신청했는가" (수강 이력)
- **LMS**: "어디까지 학습했고 점수가 얼마인가" (학습 이력)

---

## 2. 수업 유형 (Course Type)

### 유형 분류

| 유형 | 학습 방식 | 기간 제한 | 진도 추적 | 출결 관리 |
|------|----------|---------|---------|---------|
| **ONLINE** | 동영상, 문서 등 | O | O | X |
| **OFFLINE** | 대면 수업 | O | X | O |
| **BLENDED** | 온+오프 병행 | O | O | O |
| **SELF_PACED** | 자기 주도 | X | O | X |

### 유형별 완료 조건

| 유형 | 완료 조건 |
|------|----------|
| ONLINE | 진도율 80% 이상 |
| OFFLINE | 출석률 80% 이상 |
| BLENDED | 진도율 80% + 출석률 80% |
| SELF_PACED | 진도율 100% |

---

## 3. 학습 진도 관리

### 진도 추적 구조

```
Enrollment (수강 기록)
├── progressPercent: 전체 진도율 (0-100%)
├── completedItemCount: 완료한 차시 수
└── lastAccessedAt: 마지막 학습 시점

LearningProgress (차시별 진도)
├── enrollmentId: 수강 ID
├── itemId: 차시 ID
├── progressPercent: 차시 진도 (0-100%)
├── completedAt: 완료 시점
└── watchTime: 시청 시간 (영상)
```

### 진도 완료 판정
- 차시 진도 80% 이상 → 해당 차시 완료
- 전체 진도율 = (완료 차시 수 / 전체 차시 수) × 100

### 핵심 Entity

| 테이블 | 역할 |
|--------|------|
| `sis_learning_progress` | 차시별 진도 기록 |
| `sis_enrollments` | 전체 진도율, 수료 상태 |

---

## 4. 성적 관리

### 성적 산출 구조

```
CourseGradePolicy (강의별 평가 정책)
├── progressWeight: 진도 가중치 (40%)
├── quizWeight: 퀴즈 가중치 (30%)
├── assignmentWeight: 과제 가중치 (30%)
└── passingScore: 수료 기준 점수 (60점)

FinalScore = Σ(항목 점수 × 가중치)
```

### 평가 항목

| 항목 | 설명 | 적용 유형 |
|------|------|----------|
| PROGRESS | 진도 기반 점수 | 온라인, 블렌디드, 자기주도 |
| QUIZ | 퀴즈 점수 | 온라인, 블렌디드 |
| ASSIGNMENT | 과제 점수 | 온라인, 블렌디드 |
| ATTENDANCE | 출석 점수 | 오프라인, 블렌디드 |

### 수료 판정
- 최종 점수 ≥ 수료 기준 점수 → PASSED
- 최종 점수 < 수료 기준 점수 → IN_PROGRESS / FAILED

### 핵심 Entity

| 테이블 | 역할 |
|--------|------|
| `cm_grade_policies` | 강의별 평가 정책 |
| `sis_enrollment_grades` | 수강생별 성적 |
| `sis_quiz_attempts` | 퀴즈 응시 기록 |

---

## 5. 학습 경로 (Learning Path)

### 학습 순서 규칙

| 규칙 | 설명 |
|------|------|
| **SEQUENTIAL** | 순차적 (이전 차시 완료 후 다음 차시 접근) |
| **FLEXIBLE** | 유연 (자유 접근, 순서 무관) |
| **CONDITIONAL** | 조건부 (특정 조건 충족 시 접근) |

### 접근 권한 검증 로직

```
1. FLEXIBLE → 항상 접근 가능
2. SEQUENTIAL → 이전 차시 완료 여부 확인
3. CONDITIONAL → 조건 충족 여부 확인 (점수, 출석 등)
```

> CR (Course Relation) 모듈에서 학습 순서 관리
> 상세: [module-structure.md](./module-structure.md)

---

## 6. LMS-SIS 통합 흐름

### 전체 학습 플로우

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              학습 플로우                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 수강 신청                                                                │
│     USER ─────► SIS: Enrollment 생성                                        │
│                     └─ status: ENROLLED, progressPercent: 0                  │
│                                                                              │
│  2. 학습 시작                                                                │
│     USER ─────► LMS: 차시 접근 요청                                          │
│                     └─ 접근 권한 검증 (ProgressionRule)                       │
│                                                                              │
│  3. 진도 갱신                                                                │
│     USER ─────► LMS: 시청 기록 전송 (매 30초)                                │
│                     └─ LearningProgress 갱신 → 완료 판정 (80%)               │
│                                                                              │
│  4. 평가 (퀴즈/과제)                                                         │
│     USER ─────► LMS: 퀴즈 응시 → 점수 산출 → EnrollmentGrade 갱신           │
│                                                                              │
│  5. 수료 판정                                                                │
│     SYSTEM ───► SIS: 수료 조건 충족 시                                       │
│                     └─ Enrollment.status: COMPLETED                          │
│                     └─ Certificate 발급 (옵션)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

| 단계 | 소스 | 대상 | 데이터 |
|------|------|------|--------|
| 수강 신청 | USER | SIS | Enrollment 생성 |
| 학습 접근 | LMS | SIS | 진도 조회 |
| 진도 갱신 | LMS | SIS | Progress 업데이트 |
| 퀴즈 채점 | LMS | SIS | Grade 업데이트 |
| 수료 처리 | LMS | SIS | 상태 변경 (COMPLETED) |

---

## 7. 수료증 발급

### 발급 조건
1. Enrollment.status = COMPLETED
2. 미발급 상태 (중복 발급 방지)

### 수료증 데이터

| 필드 | 설명 |
|------|------|
| certificateNumber | 발급 번호 (고유) |
| userName | 발급 시점 이름 스냅샷 |
| courseTitle | 발급 시점 강의명 스냅샷 |
| completionDate | 수료일 |
| finalScore | 최종 점수 |
| verificationCode | 진위 확인용 코드 |

### 핵심 Entity

| 테이블 | 역할 |
|--------|------|
| `sis_certificates` | 수료증 정보 |

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [module-structure.md](./module-structure.md) | 모듈 분리 및 역할 |
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [transaction-boundaries.md](./transaction-boundaries.md) | 트랜잭션 설계 |
| [user-roles.md](./user-roles.md) | 역할 및 권한 |

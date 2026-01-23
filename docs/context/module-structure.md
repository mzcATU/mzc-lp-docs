# 모듈 구조 설계

> 시스템 모듈 분리 및 역할 정의

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 |
|----------|------|
| 모듈 간 통신 규칙? | 섹션 1 |
| 각 모듈 역할? | 섹션 2 |
| 전체 데이터 흐름? | 섹션 3 |
| Entity/API 상세? | 섹션 4 (structure 폴더 링크) |

---

## 1. 모듈 개요

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              mzc-lp Platform                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [콘텐츠 계층 - 마스터]                                                           │
│                              ┌──────────────┐      ┌──────────────┐             │
│                              │   Learning   │◄─────│   Content    │             │
│                              │    Object    │      │  Management  │             │
│                              │     (LO)     │      │    (CMS)     │             │
│                              └──────┬───────┘      └──────────────┘             │
│                                     │              (CMS → LO: 단방향)            │
│                                     ▼                                            │
│  [사용자 계층]   [강의 계층 - 마스터]                                             │
│  ┌──────────┐     ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    UM    │     │   IIS    │    │    Course    │────►│    Course    │          │
│  │   User   │────►│Instructor│    │    Metric    │     │   Relation   │          │
│  │  Master  │     │   Info   │    │     (CM)     │     │     (CR)     │          │
│  └────┬─────┘     └────┬─────┘    └──────┬───────┘    └──────────────┘          │
│       │                │                 │           (CM → CR: 단방향)           │
│       │           ┌────┴─────────────────┘                                       │
│       │           │                                                              │
│       │           ▼                                                              │
│  [운영 계층 - 마스터]                                                             │
│       │     ┌──────────┐                                                         │
│       └────►│    TS    │                                                         │
│             │   Time   │                                                         │
│             │ Schedule │                                                         │
│             └────┬─────┘                                                         │
│                  │                                                               │
│  [기록 계층 - 서브]    (TS → IIS, SIS: 단방향)                                   │
│  ┌──────────┐    │     ┌──────────┐                                              │
│  │   SIS    │◄───┴────►│   IIS    │                                              │
│  │ Student  │          │Instructor│                                              │
│  │   Info   │          │   Info   │                                              │
│  └──────────┘          └──────────┘                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 단방향 통신 규칙

**핵심 원칙:**
- 마스터 → 서브 방향으로만 호출
- 역방향 호출 금지
- 디테일이 바뀌면서 마스터도 바뀌어야 하면, "마스터를 바꾸면서 디테일을 함께 바꾸는" 방향으로 설계

| 마스터 | 서브 | 흐름 |
|--------|------|------|
| CMS | LO | 콘텐츠 업로드 → LO 자동 생성 |
| CM | CR | 강의 아이템 기반 관계 설정 |
| TS | IIS, SIS | 차수 기반 강사/수강 기록 생성 |

---

## 2. 모듈별 역할

### 사용자/수강 관련

| 모듈 | 풀네임 | 역할 | 핵심 Entity |
|------|--------|------|-------------|
| **UM** | User Master | 사용자 정보, 인증/인가, 역할 관리 | `um_users` |
| **SIS** | Student Information System | 수강 기록 (수강신청 시점 저장) | `sis_enrollments` |
| **IIS** | Instructor Information System | 강사 배정 기록 (배정 시점 저장) | `iis_instructor_assignments` |
| **TS** | Time Schedule | 강의 개설, 차수 관리, 강사 배정 | `ts_course_times` |

### 강의/컨텐츠 관련

| 모듈 | 풀네임 | 역할 | 핵심 Entity |
|------|--------|------|-------------|
| **CM** | Course Matrix | 강의 메타데이터, 커리큘럼 구성 | `cm_courses`, `cm_course_items` |
| **CR** | Course Relation | 차시 간 학습 순서 (Linked List 패턴) | `cr_course_relations` |
| **LO** | Learning Object | 학습 객체 메타데이터, 재사용 단위 | `lo_learning_objects` |
| **CMS** | Content Management | 파일 업로드/저장, 인코딩, CDN | `cms_contents` |

### 특수 모듈

| 모듈 | 역할 | 핵심 개념 |
|------|------|----------|
| **Program** | 강의 개설 신청/승인 워크플로우 | DRAFT → PENDING → APPROVED/REJECTED → CLOSED |
| **Snapshot** | 개설 강의 (템플릿의 깊은 복사본) | Content는 공유 참조, 메타데이터는 깊은 복사 |

---

## 3. 모듈 간 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. 컨텐츠 생성                                                              │
│     USER ──────► CMS (파일 업로드) ──────► LO (학습객체 생성)                │
│                                                                              │
│  2. 강의 구성                                                                │
│     USER ──────► CM (커리큘럼 구성) ◄────── LO (학습객체 연결)               │
│                        │                                                     │
│                        ▼                                                     │
│                  CR (학습 순서 설정)                                         │
│                                                                              │
│  3. 강의 개설                                                                │
│     USER ──────► Program (개설 신청) ──────► OPERATOR (검토/승인)            │
│                        │                                                     │
│                        ▼                                                     │
│                  TS (차수 생성)                                              │
│                        │                                                     │
│             ┌──────────┴──────────┐                                          │
│             ▼                     ▼                                          │
│     IIS (강사 배정)         SIS (수강 신청)                                  │
│                                                                              │
│  4. 학습 진행                                                                │
│     USER ──────► SIS (진도 업데이트) ──────► SIS (수료)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 상세 흐름: 강의 개설 → 수강 완료

| 단계 | 모듈 | 동작 |
|------|------|------|
| 1 | CMS → LO | 영상/문서 업로드 → Content 생성 → LO 자동 생성 |
| 2 | CM | Course 생성, CourseItem 계층 구성, LO 연결 |
| 3 | CR | 학습 순서 설정 (Linked List) |
| 4 | Program | 강의 개설 신청 (DRAFT → PENDING) |
| 5 | Program | OPERATOR 검토/승인 (PENDING → APPROVED) |
| 6 | Snapshot | Course 템플릿에서 Snapshot 생성 (깊은 복사) |
| 7 | TS | CourseTime 차수 생성 |
| 8 | IIS | 강사 배정 기록: `{ userKey, timeKey, assignedAt }` |
| 9 | SIS | 수강 신청 기록: `{ userKey, timeKey, enrolledAt }` |
| 10 | SIS | 학습 진행 → 수료: `status=COMPLETED` |

---

## 4. 구현 상세 명세

> **Entity 코드, API 스펙, DB 스키마는 structure 폴더 참조**

| 모듈 | 상세 문서 |
|------|----------|
| Course (템플릿) | [structure/backend/course/](../structure/backend/course/) |
| Snapshot (개설 강의) | [structure/backend/snapshot/](../structure/backend/snapshot/) |
| LearningObject | [structure/backend/learning/](../structure/backend/learning/) |
| Content | [structure/backend/content/](../structure/backend/content/) |
| Program (개설 신청) | [structure/backend/schedule/](../structure/backend/schedule/) |

### 설계 의도 (Why)

| 설계 결정 | 이유 |
|----------|------|
| CR: Linked List 패턴 | 순서 변경 시 O(1), 조건부 분기 확장 용이 |
| Snapshot: Content 공유 참조 | 파일 불변, 스토리지 절약 |
| Snapshot: 메타데이터 깊은 복사 | 수강이력 불변성 보장 |
| SIS/IIS: timestamp 필수 | 시점 기록으로 이력 추적 |
| CMS → LO: 이벤트 기반 자동 생성 | 느슨한 결합, 사용자 편의성 |

---

## 5. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 전체 시스템 구조, 단방향 통신 원칙 |
| [user-roles.md](./user-roles.md) | 사용자 역할 및 권한 |
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 분리 전략 |
| [lms-architecture.md](./lms-architecture.md) | 진도/성적/수료 관리 |

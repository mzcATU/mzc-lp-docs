# 모듈 구조 설계

> 시스템 모듈 분리 및 역할 정의

---

## 1. 모듈 개요

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              mzc-lp Platform                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              ┌──────────────┐      ┌──────────────┐             │
│                              │   Learning   │◄────►│   Content    │             │
│                              │    Object    │      │  Management  │             │
│                              │     (LO)     │      │    (CMS)     │             │
│                              └──────┬───────┘      └──────────────┘             │
│                                     │                                            │
│                                     ▼                                            │
│  ┌──────────┐     ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │    UM    │     │   IIS    │    │    Course    │    │    Course    │          │
│  │   User   │────►│Instructor│    │    Matrix    │◄───│   Relation   │          │
│  │  Master  │     │   Info   │    │     (CM)     │    │     (CR)     │          │
│  └────┬─────┘     └────┬─────┘    └──────┬───────┘    └──────────────┘          │
│       │                │                 │                                       │
│       │           ┌────┴─────────────────┘                                       │
│       │           │                                                              │
│       │           ▼                                                              │
│       │     ┌──────────┐                                                         │
│       └────►│    TS    │                                                         │
│             │   Time   │                                                         │
│       ┌────►│ Schedule │                                                         │
│       │     └────┬─────┘                                                         │
│       │          │                                                               │
│  ┌────┴─────┐    │                                                               │
│  │   SIS    │◄───┘                                                               │
│  │ Student  │                                                                    │
│  │   Info   │                                                                    │
│  └──────────┘                                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 모듈별 역할

### 사용자/수강 관련

| 모듈 | 풀네임 | 역할 |
|------|--------|------|
| **UM** | User Master | 사용자 정보 관리 (프로필, 인증, 역할) |
| **SIS** | Student Information System | 수강 기록 (수강신청 시점 저장) |
| **IIS** | Instructor Information System | 강사 배정 기록 (배정 시점 저장) |
| **TS** | Time Schedule | 강의 개설, 차수 관리, 강사 배정 |

### 강의/컨텐츠 관련

| 모듈 | 풀네임 | 역할 |
|------|--------|------|
| **CM** | Course Matrix | 강의 메타데이터, 커리큘럼 구성 |
| **CR** | Course Relation | 강의 간 관계 (선수강, 연관강의 등) |
| **LO** | Learning Object | 학습 객체 (영상, 문서, 퀴즈 등) |
| **CMS** | Content Management | 컨텐츠 파일 관리 (업로드, 인코딩, 저장) |

---

## 3. UM (User Master)

### 역할
- 사용자 기본 정보 관리
- 인증/인가 처리
- 역할(Role) 관리

### Entity

```java
@Entity
@Table(name = "um_users")
public class User extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    private String phone;
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    private UserStatus status;          // ACTIVE, INACTIVE, SUSPENDED

    @Enumerated(EnumType.STRING)
    private TenantRole role;            // USER, MEMBER, OPERATOR, ADMIN 등

    // B2B: 소속 조직
    @ManyToOne(fetch = FetchType.LAZY)
    private Organization organization;
}
```

---

## 4. TS (Time Schedule)

### 역할
- 강의 개설 신청 접수/검토
- **차수(Time) 생성** 및 관리
- 강사 배정
- 필수 수강 강제 신청
- 차수 수정/삭제

### 주요 Entity

#### Course (강의)

```java
@Entity
@Table(name = "ts_courses")
public class Course extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Enumerated(EnumType.STRING)
    private CourseStatus status;    // DRAFT, PENDING, APPROVED, REJECTED, CLOSED

    @ManyToOne(fetch = FetchType.LAZY)
    private User creator;           // 강의 개설 신청자

    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private User approvedBy;        // 승인한 Operator

    @OneToMany(mappedBy = "course")
    private List<CourseTime> times = new ArrayList<>();  // 차수들
}

public enum CourseStatus {
    DRAFT,      // 작성 중
    PENDING,    // 개설 신청됨 (검토 대기)
    APPROVED,   // 승인됨
    REJECTED,   // 반려됨
    CLOSED      // 종료됨
}
```

#### CourseTime (차수)

```java
@Entity
@Table(name = "ts_course_times")
public class CourseTime extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private Integer timeNumber;         // 차수 번호 (1차, 2차...)

    private LocalDateTime startDate;    // 수강 시작일
    private LocalDateTime endDate;      // 수강 종료일

    private Integer capacity;           // 정원
    private Integer currentEnrollment;  // 현재 수강 인원

    @Enumerated(EnumType.STRING)
    private TimeStatus status;          // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;             // 차수 생성한 Operator

    // 배정된 강사들
    @OneToMany(mappedBy = "courseTime")
    private List<InstructorAssignment> instructors = new ArrayList<>();
}

public enum TimeStatus {
    SCHEDULED,      // 예정
    OPEN,           // 수강신청 가능
    IN_PROGRESS,    // 진행 중
    COMPLETED,      // 완료
    CANCELLED       // 취소됨
}
```

### Operator 주요 기능

```java
@Service
@RequiredArgsConstructor
public class TimeScheduleService {

    // 1. 강의 개설 신청 검토/승인
    @Transactional
    public void approveCourse(Long courseId, Long operatorId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        course.approve(operatorId);
    }

    // 2. 차수 생성
    @Transactional
    public CourseTime createTime(Long courseId, CreateTimeRequest request, Long operatorId) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        return CourseTime.create(course, request, operatorId);
    }

    // 3. 강사 배정
    @Transactional
    public void assignInstructor(Long timeId, Long instructorUserId, Long operatorId) {
        CourseTime time = courseTimeRepository.findById(timeId).orElseThrow();
        User instructor = userRepository.findById(instructorUserId).orElseThrow();

        // IIS에 기록 저장
        iisService.recordAssignment(instructor.getId(), time.getId());

        time.assignInstructor(instructor);
    }

    // 4. 필수 수강 강제 신청
    @Transactional
    public void forceEnroll(Long timeId, List<Long> userIds, Long operatorId) {
        CourseTime time = courseTimeRepository.findById(timeId).orElseThrow();

        for (Long userId : userIds) {
            // SIS에 기록 저장
            sisService.recordEnrollment(userId, time.getId(), EnrollmentType.MANDATORY);
        }
    }

    // 5. 차수 삭제
    @Transactional
    public void deleteTime(Long timeId, Long operatorId) {
        CourseTime time = courseTimeRepository.findById(timeId).orElseThrow();
        time.cancel(operatorId);
    }
}
```

---

## 5. SIS (Student Information System)

### 역할
- **수강신청 시점 기록**
- 수강 이력 관리
- 학습 진도 추적

### 필수 필드
- `userKey` (사용자 ID)
- `timeKey` (차수 ID)
- `timestamp` (수강신청 시점)

### Entity

```java
@Entity
@Table(name = "sis_enrollments")
public class Enrollment extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 필수 필드 ===
    @Column(name = "user_key", nullable = false)
    private Long userKey;               // 수강생 ID

    @Column(name = "time_key", nullable = false)
    private Long timeKey;               // 차수 ID

    @Column(nullable = false)
    private LocalDateTime enrolledAt;   // 수강신청 시점 (timestamp)

    // === 추가 필드 ===
    @Enumerated(EnumType.STRING)
    private EnrollmentType type;        // VOLUNTARY, MANDATORY

    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status;    // ENROLLED, COMPLETED, DROPPED, FAILED

    private LocalDateTime completedAt;  // 수료 시점
    private Integer progressPercent;    // 진도율 (0-100)
    private Integer score;              // 점수

    @ManyToOne(fetch = FetchType.LAZY)
    private User enrolledBy;            // 신청자 (본인 또는 Operator)

    // 연관관계 (조회용)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_key", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_key", insertable = false, updatable = false)
    private CourseTime courseTime;

    // 정적 팩토리
    public static Enrollment create(Long userKey, Long timeKey, EnrollmentType type) {
        Enrollment e = new Enrollment();
        e.userKey = userKey;
        e.timeKey = timeKey;
        e.enrolledAt = LocalDateTime.now();  // 수강신청 시점 기록
        e.type = type;
        e.status = EnrollmentStatus.ENROLLED;
        e.progressPercent = 0;
        return e;
    }
}

public enum EnrollmentType {
    VOLUNTARY,      // 자발적 수강신청
    MANDATORY       // 필수 수강 (Operator 강제 신청)
}

public enum EnrollmentStatus {
    ENROLLED,       // 수강 중
    COMPLETED,      // 수료
    DROPPED,        // 중도 포기
    FAILED          // 미이수
}
```

---

## 6. IIS (Instructor Information System)

### 역할
- **강사 배정 시점 기록**
- 강의 이력 관리
- 강사별 강의 현황

### 필수 필드
- `userKey` (강사 ID)
- `timeKey` (차수 ID)
- `timestamp` (배정 시점)

### Entity

```java
@Entity
@Table(name = "iis_instructor_assignments")
public class InstructorAssignment extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === 필수 필드 ===
    @Column(name = "user_key", nullable = false)
    private Long userKey;               // 강사 ID

    @Column(name = "time_key", nullable = false)
    private Long timeKey;               // 차수 ID

    @Column(nullable = false)
    private LocalDateTime assignedAt;   // 배정 시점 (timestamp)

    // === 추가 필드 ===
    @Enumerated(EnumType.STRING)
    private InstructorRole role;        // MAIN, SUB, ASSISTANT

    @Enumerated(EnumType.STRING)
    private AssignmentStatus status;    // ACTIVE, REPLACED, CANCELLED

    private LocalDateTime replacedAt;   // 교체된 시점 (있을 경우)

    @ManyToOne(fetch = FetchType.LAZY)
    private User assignedBy;            // 배정한 Operator

    // 연관관계 (조회용)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_key", insertable = false, updatable = false)
    private User instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_key", insertable = false, updatable = false)
    private CourseTime courseTime;

    // 정적 팩토리
    public static InstructorAssignment create(Long userKey, Long timeKey,
                                               InstructorRole role, Long operatorId) {
        InstructorAssignment ia = new InstructorAssignment();
        ia.userKey = userKey;
        ia.timeKey = timeKey;
        ia.assignedAt = LocalDateTime.now();  // 배정 시점 기록
        ia.role = role;
        ia.status = AssignmentStatus.ACTIVE;
        return ia;
    }
}

public enum InstructorRole {
    MAIN,           // 주강사
    SUB             // 보조강사
}

public enum AssignmentStatus {
    ACTIVE,         // 활성
    REPLACED,       // 다른 강사로 교체됨
    CANCELLED       // 취소됨
}
```

---

## 7. CM (Course Matrix)

### 역할
- 강의 메타데이터 관리
- 커리큘럼 구성
- 강의 카테고리/태그 관리

### Entity

```java
@Entity
@Table(name = "cm_courses")
public class CourseMeta extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;
    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    private CourseLevel level;          // BEGINNER, INTERMEDIATE, ADVANCED

    @Enumerated(EnumType.STRING)
    private CourseType type;            // ONLINE, OFFLINE, BLENDED

    private Integer estimatedHours;     // 예상 학습 시간

    @ManyToOne(fetch = FetchType.LAZY)
    private Category category;

    // 커리큘럼 (섹션 → 학습객체)
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    @OrderBy("sortOrder")
    private List<CourseSection> sections = new ArrayList<>();
}

@Entity
@Table(name = "cm_course_sections")
public class CourseSection extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private CourseMeta course;

    private String title;
    private Integer sortOrder;

    // 섹션 내 학습 객체들
    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL)
    @OrderBy("sortOrder")
    private List<SectionItem> items = new ArrayList<>();
}

@Entity
@Table(name = "cm_section_items")
public class SectionItem extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private CourseSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    private LearningObject learningObject;  // LO 모듈 연결

    private Integer sortOrder;
    private Boolean isMandatory;            // 필수 여부
}
```

---

## 8. CR (Course Relation)

### 역할
- 강의 간 관계 설정
- 선수강 조건 관리
- 연관/추천 강의 관리

### Entity

```java
@Entity
@Table(name = "cr_course_relations")
public class CourseRelation extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_course_id")
    private CourseMeta sourceCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_course_id")
    private CourseMeta targetCourse;

    @Enumerated(EnumType.STRING)
    private RelationType type;

    private Integer priority;           // 우선순위 (추천 시)
}

public enum RelationType {
    PREREQUISITE,       // 선수강 (source를 먼저 들어야 target 수강 가능)
    RECOMMENDED,        // 추천 (source 수료 후 target 추천)
    RELATED,            // 연관 (비슷한 주제)
    ADVANCED,           // 심화 (source의 심화 과정이 target)
    BUNDLE              // 번들 (함께 수강 시 할인 등)
}
```

### 선수강 검증

```java
@Service
public class CourseRelationService {

    public boolean canEnroll(Long userId, Long courseId) {
        List<CourseRelation> prerequisites = courseRelationRepository
            .findByTargetCourseIdAndType(courseId, RelationType.PREREQUISITE);

        for (CourseRelation prereq : prerequisites) {
            boolean completed = enrollmentRepository
                .existsByUserIdAndCourseIdAndStatus(
                    userId,
                    prereq.getSourceCourse().getId(),
                    EnrollmentStatus.COMPLETED
                );
            if (!completed) return false;
        }
        return true;
    }
}
```

---

## 9. LO (Learning Object)

### 역할
- 학습 객체 메타데이터 관리
- 재사용 가능한 학습 단위
- CMS와 연동하여 실제 컨텐츠 참조

### Entity

```java
@Entity
@Table(name = "lo_learning_objects")
public class LearningObject extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Enumerated(EnumType.STRING)
    private LearningObjectType type;

    private Integer durationSeconds;    // 영상 길이 또는 예상 학습 시간

    // CMS 연동
    private String contentId;           // CMS에서 관리하는 컨텐츠 ID
    private String contentUrl;          // 컨텐츠 URL (CDN)

    // 퀴즈/과제의 경우
    private Integer passingScore;       // 통과 점수
    private Integer maxAttempts;        // 최대 시도 횟수
}

public enum LearningObjectType {
    VIDEO,              // 동영상
    DOCUMENT,           // 문서 (PDF, PPT)
    QUIZ,               // 퀴즈
    ASSIGNMENT,         // 과제
    LIVE_SESSION,       // 실시간 강의
    EXTERNAL_LINK,      // 외부 링크
    SCORM               // SCORM 패키지
}
```

---

## 10. CMS (Content Management System)

### 역할
- 컨텐츠 파일 업로드/저장
- 영상 인코딩/트랜스코딩
- CDN 연동
- 파일 버전 관리

### Entity

```java
@Entity
@Table(name = "cms_contents")
public class Content extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String originalFileName;
    private String storedFileName;      // UUID 기반

    @Enumerated(EnumType.STRING)
    private ContentType type;

    private Long fileSize;
    private String mimeType;

    // 저장 위치
    private String bucketName;          // S3 버킷
    private String objectKey;           // S3 키

    // CDN
    private String cdnUrl;

    // 영상 전용
    private Integer durationSeconds;
    private String resolution;          // 1080p, 720p 등

    @Enumerated(EnumType.STRING)
    private ContentStatus status;       // UPLOADING, PROCESSING, READY, FAILED

    @ManyToOne(fetch = FetchType.LAZY)
    private User uploadedBy;
}

public enum ContentType {
    VIDEO,
    DOCUMENT,
    IMAGE,
    AUDIO,
    ARCHIVE
}

public enum ContentStatus {
    UPLOADING,          // 업로드 중
    PROCESSING,         // 인코딩/처리 중
    READY,              // 사용 가능
    FAILED              // 처리 실패
}
```

### 영상 업로드 흐름

```
1. 사용자: 영상 파일 업로드 요청
       │
       ▼
2. CMS: Presigned URL 발급 → S3 직접 업로드
       │
       ▼
3. CMS: Content 레코드 생성 (status: UPLOADING)
       │
       ▼
4. S3 → Lambda/MediaConvert: 인코딩 트리거
       │
       ▼
5. CMS: 인코딩 완료 콜백 → status: READY
       │
       ▼
6. LO: Learning Object에 contentId 연결
```

---

## 11. 모듈 간 데이터 흐름

### 전체 흐름

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
│                  CR (선수강/연관강의 설정)                                   │
│                                                                              │
│  3. 강의 개설                                                                │
│     USER ──────► TS (개설 신청) ──────► OPERATOR (검토/승인)                 │
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

```
1. 컨텐츠 업로드
   └─ CMS: 영상/문서 업로드 → Content 생성
   └─ LO: Learning Object 생성, contentId 연결

2. 커리큘럼 구성
   └─ CM: Course 생성, Section 구성
   └─ CM: SectionItem에 LO 연결
   └─ CR: 선수강 조건 설정 (선택)

3. 강의 개설 신청
   └─ TS: Course (status: PENDING)

4. OPERATOR: 강의 검토 & 승인
   └─ TS: Course (status: APPROVED)

5. OPERATOR: 차수 생성
   └─ TS: CourseTime 생성

6. OPERATOR: 강사 배정 (보통 OWNER가 INSTRUCTOR로 배정됨)
   └─ IIS에 기록: { userKey, timeKey, timestamp }

7. USER: 수강신청 (또는 OPERATOR 강제 신청)
   └─ CR: 선수강 검증
   └─ SIS에 기록: { userKey, timeKey, timestamp }

8. USER: 학습 진행
   └─ SIS 업데이트: progressPercent

9. 수료
   └─ SIS 업데이트: status=COMPLETED, completedAt
```

---

## 12. ERD 요약

### 사용자/수강 도메인

```
┌─────────────────┐
│    um_users     │
├─────────────────┤
│ id (PK)         │
│ email           │
│ name            │
│ role            │
│ tenant_id       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│   ts_courses    │──1:N──│ ts_course_times │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ title           │       │ course_id (FK)  │
│ status          │       │ time_number     │
│ creator_id (FK) │       │ start_date      │
│ tenant_id       │       │ end_date        │
└─────────────────┘       │ tenant_id       │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌─────────────────┐           ┌─────────────────┐
         │ sis_enrollments │           │iis_instructor_  │
         │                 │           │   assignments   │
         ├─────────────────┤           ├─────────────────┤
         │ id (PK)         │           │ id (PK)         │
         │ user_key (FK)   │           │ user_key (FK)   │
         │ time_key (FK)   │           │ time_key (FK)   │
         │ enrolled_at     │           │ assigned_at     │
         │ type            │           │ role            │
         │ status          │           │ status          │
         │ tenant_id       │           │ tenant_id       │
         └─────────────────┘           └─────────────────┘
```

### 강의/컨텐츠 도메인

```
┌─────────────────┐       ┌─────────────────┐
│  cms_contents   │       │lo_learning_     │
│                 │       │    objects      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ original_name   │◄──────│ content_id (FK) │
│ cdn_url         │       │ title           │
│ type            │       │ type            │
│ status          │       │ duration        │
│ tenant_id       │       │ tenant_id       │
└─────────────────┘       └────────┬────────┘
                                   │
                                   │ N:1
                                   ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│cm_section_items │──N:1──│cm_course_       │──N:1──│  cm_courses     │
│                 │       │   sections      │       │                 │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ section_id (FK) │       │ course_id (FK)  │       │ title           │
│ lo_id (FK)      │       │ title           │       │ description     │
│ sort_order      │       │ sort_order      │       │ level           │
│ is_mandatory    │       │ tenant_id       │       │ type            │
│ tenant_id       │       └─────────────────┘       │ tenant_id       │
└─────────────────┘                                 └────────┬────────┘
                                                             │
                                                             │ N:N
                                                             ▼
                                                   ┌─────────────────┐
                                                   │cr_course_       │
                                                   │   relations     │
                                                   ├─────────────────┤
                                                   │ id (PK)         │
                                                   │ source_id (FK)  │
                                                   │ target_id (FK)  │
                                                   │ type            │
                                                   │ priority        │
                                                   │ tenant_id       │
                                                   └─────────────────┘
```

---

## 13. Operator 권한

| 기능 | 설명 |
|------|------|
| 강의 검토/승인 | PENDING 상태 강의 검토 후 승인/반려 |
| 차수 생성 | 승인된 강의에 차수 추가 |
| 차수 수정/삭제 | 차수 정보 변경, 취소 |
| 강사 배정 | 차수에 강사 배정 (IIS 기록) |
| 강사 변경 | 기존 강사 교체 (IIS 이력 유지) |
| 필수 수강 신청 | 특정 사용자 강제 수강신청 (SIS 기록) |
| 수강 현황 조회 | SIS 데이터 조회 |
| 강사 현황 조회 | IIS 데이터 조회 |

---

## 14. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [user-roles.md](./user-roles.md) | 사용자 역할 및 권한 |
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 분리 전략 |

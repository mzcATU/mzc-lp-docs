# 사용자 역할 및 권한

> 역할 계층, 권한 부여 전략, 사이트별 권한 체계

---

## 1. 플랫폼 관계

```
┌─────────────────────────────────────────────────────────────┐
│                    B2C (메인 러닝 플랫폼)                     │
│                      핵심 코어 시스템                         │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ 테넌트화 (브랜딩 + 커스터마이징) │
            └───────────────┬───────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────┐           ┌───────────────────────┐
│    B2B (기업용 LMS)    │           │  KPOP (K-POP 교육)   │
│  삼성, LG, 현대 등     │           │  외국인 단기 연수     │
│  기업 브랜딩 적용      │           │  스케줄/시설/피드백   │
└───────────────────────┘           └───────────────────────┘
```

> **B2C가 코어**: B2B와 KPOP은 B2C를 기반으로 테넌트화하여 각 도메인에 맞게 커스터마이징한 버전

---

## 2. 역할 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER_ADMIN                             │
│                   (플랫폼 최고 관리자)                        │
│              모든 테넌트 관리, 시스템 설정                    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  TENANT_ADMIN │   │  TENANT_ADMIN │   │  TENANT_ADMIN │
│   (B2C 관리)  │   │(B2B 통계/브랜딩)│  │ (KPOP 관리)   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   OPERATOR    │   │   OPERATOR    │   │   OPERATOR    │
│   (운영자)    │   │   (운영자)    │   │   (운영자)    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│     USER      │   │     USER      │   │     USER      │
│ (수강+강의등록)│   │   (직원)      │   │   (학생)      │
└───────────────┘   └───────────────┘   └───────────────┘
```

> **역할 통일**: 모든 테넌트에서 동일한 역할명 사용 (TENANT_ADMIN → OPERATOR → USER)
> **차이점**: 테넌트 타입(B2C/B2B/KPOP)에 따라 **기능/권한**만 다르게 적용

### B2C 특징: 강의별 권한

```
USER (일반 사용자)
  │
  ├── 수강생으로서: 다른 사람 강의 수강
  │
  └── "강의 개설하기" 버튼 클릭 → DESIGNER Role 부여 → 강의 설계 페이지 접근
        │
        │ 강의 구성 완료 후 "개설 신청"
        ▼
      OPERATOR 승인 → OWNER Role 부여 (강의 소유자 + 강사)

※ B2C에서는 OWNER = 강사 (별도 INSTRUCTOR 없음)

OPERATOR (운영자)
  │
  ├── 강의 등록 신청 검토/승인 → 승인 시 DESIGNER → OWNER로 전환
  │
  ├── 차수(기수) 등록 관리
  │
  └── 수강 신청 관리 (승인/거절)
```

---

## 3. 역할 정의

### 3.1 시스템 레벨 역할

```java
public enum SystemRole {
    SUPER_ADMIN     // 플랫폼 전체 관리 (MZC 내부)
}
```

### 3.2 테넌트 레벨 역할

```java
public enum TenantRole {
    SYSTEM_ADMIN,   // 시스템 최고 관리자 (테넌트 관리)
    TENANT_ADMIN,   // 테넌트 최고 관리자
    OPERATOR,       // 운영자 (강의 검토, 차수 생성, 역할 부여)
    DESIGNER,       // 설계자 (강의 개설 신청)
    USER            // 일반 사용자 (수강)
}
```

> **통일된 역할**: 모든 테넌트(B2C/B2B/KPOP)에서 동일한 역할 사용
> **차이점**: 테넌트 타입에 따라 같은 역할이라도 기능이 다름

| 역할 | B2C | B2B | KPOP |
|------|-----|-----|------|
| **USER** | 수강 | 수강만 (역할 부여 전까지) | 수강 |
| **DESIGNER** | 강의 개설 신청 가능 | OPERATOR가 부여 | OPERATOR가 부여 |
| **OPERATOR** | 강의 승인, 차수 관리 | 강의 승인 + **역할 부여/회수** | 강의/스케줄 관리 |

### 3.3 Operator 역할 상세 (B2C)

```
OPERATOR가 TS(Time Schedule) 모듈에서 수행하는 업무:

1. 강의 개설 검토
   └─ USER가 강의 개설 신청 → OPERATOR가 검토/승인/반려

2. 차수(Time) 생성
   └─ 승인된 강의에 차수 추가 (1차, 2차...)

3. 강사 배정
   └─ 차수에 강사 배정 → IIS에 기록 저장

4. 필수 수강 강제 신청
   └─ 특정 USER에게 강제 수강신청 → SIS에 기록 저장

5. 차수/강사 수정/삭제
   └─ 운영 중 변경사항 처리
```

### 3.4 강의 레벨 역할

```java
public enum CourseRole {
    DESIGNER,       // 강의 설계자 (커리큘럼 구성, 콘텐츠 제작)
    OWNER,          // 강의 소유자 (B2C: 소유 + 강사, B2B: 소유만)
    INSTRUCTOR      // 강사 (B2B/KPOP 전용, 강의 진행)
}
```

### 3.5 B2C vs B2B 역할 부여 방식

| | B2C | B2B |
|---|---|---|
| **DESIGNER 부여** | 셀프 ("강의 개설하기" 버튼 클릭) | OPERATOR가 부여 |
| **OWNER 부여** | 개설 신청 승인 후 | 개설 신청 승인 후 |
| **INSTRUCTOR** | ❌ 없음 (OWNER = 강사) | ✅ OPERATOR가 부여 |
| **역할 회수** | ❌ (본인 판단) | ✅ OPERATOR가 회수 가능 |

### 3.6 역할 부여 플로우

**B2C 플로우:**
```
USER
  │
  └─► "강의 개설하기" 버튼 클릭
          │
          ▼
      DESIGNER (강의 설계자)
          │
          │ 강의 구성 완료 후 "개설 신청"
          ▼
      OPERATOR 승인
          │
          ▼
      OWNER (강의 소유자 + 강사)
```

**B2B 플로우:**
```
USER
  │
  ├─► OPERATOR가 "강사 부여" ───────► INSTRUCTOR
  │
  └─► OPERATOR가 "강의설계자 부여" ──► DESIGNER
                                          │
                                          │ 강의 구성 완료 후 "개설 신청"
                                          ▼
                                        OWNER (승인 시)
```

> **핵심 차이**: B2C는 셀프 서비스, B2B는 관리자 통제

---

## 4. 역할별 권한 매트릭스

### 4.1 B2C 사이트

#### 테넌트 레벨 권한

| 권한 | TENANT_ADMIN | OPERATOR | USER |
|------|--------------|----------|------|
| 플랫폼 설정 | O | X | X |
| 모든 강의 관리 | O | O | X |
| 사용자 관리 | O | O | X |
| 강의 검토/승인 | O | O | X |
| 차수 생성/강사 배정 | O | O | X |
| 강의 생성 | O | O | **O** |
| 강의 수강 | O | O | O |
| 리뷰 작성 | O | O | O |

#### 강의 레벨 권한 (CourseRole) - B2C

| 권한 | DESIGNER | OWNER (=강사) | 수강생 |
|------|----------|---------------|--------|
| 강의 설계/구성 | O | O | X |
| 커리큘럼 작성 | O | O | X |
| 영상 업로드 | O | O | X |
| 개설 신청 | O | X | X |
| 강의 삭제 | X | O | X |
| 가격 설정 | X | O | X |
| 수익 전체 조회 | X | O | X |
| Q&A 답변 | X | O | X |
| 수강생 관리 | X | O | X |
| 강의 시청 | X | O | O |

> **B2C**: USER가 "강의 개설하기" 클릭 → DESIGNER → 승인 후 OWNER (OWNER = 강사)

### 4.2 B2B 사이트

#### 테넌트 레벨 권한

| 권한 | TENANT_ADMIN | OPERATOR | USER |
|------|--------------|----------|------|
| 전사 통계/대시보드 | O | O | X |
| 브랜딩 설정 | O | X | X |
| 조직 생성/삭제 | O | O | X |
| 모든 사용자 관리 | O | O | X |
| 강의 생성 | O | O | X |
| 강사 배정 | O | O | X |
| 조직별 학습 현황 | O | O | 본인만 |
| **유저 역할 부여/회수** | O | **O** | X |
| 수강 | O | O | O |

> **TENANT_ADMIN**: 전사 통계/브랜딩 담당
> **OPERATOR**: 전체 운영 (모든 조직의 유저/강의/학습현황 관리) + **역할 부여/회수**

#### 강의 레벨 권한 (CourseRole) - B2B

| 권한 | DESIGNER | OWNER | INSTRUCTOR | 수강생 |
|------|----------|-------|------------|--------|
| 강의 설계/구성 | O | O | X | X |
| 커리큘럼 작성 | O | O | X | X |
| 콘텐츠 업로드 | O | O | X | X |
| 개설 신청 | O | X | X | X |
| 강의 정보 수정 | X | O | O | X |
| Q&A 답변/피드백 | X | O | O | X |
| 수강생 관리 | X | O | O | X |
| 강의 시청 | X | O | O | O |

> **B2B**: OPERATOR가 유저 목록에서 "강사 부여" / "강의설계자 부여" 버튼으로 역할 관리

### 4.3 KPOP 사이트 (K-POP 단기 연수)

#### 테넌트 레벨 권한

| 권한 | TENANT_ADMIN | OPERATOR | USER (학생) |
|------|--------------|----------|-------------|
| 플랫폼 설정 | O | X | X |
| 프로그램/캠프 생성 | O | O | X |
| 스케줄 관리 | O | O | X |
| 팀 구성/관리 | O | O | X |
| 시설 예약 관리 | O | O | X |
| 강의 생성 | O | O | X |
| 강사 배정 | O | O | X |
| 스케줄 조회 | O | O | O |
| 시설 예약 | O | O | O |
| 팀 채팅 | O | O | O |
| 강의 수강 | O | O | O |
| 영상 업로드 (피드백용) | O | O | O |

#### 강의 레벨 권한 (CourseRole)

| 권한 | OWNER | INSTRUCTOR | 수강생 |
|------|-------|------------|--------|
| 강의 정보 수정 | O | O | X |
| 콘텐츠 업로드 | O | O | X |
| **피드백 제공** | O | O | X |
| 수강생 관리 | O | O | X |
| 강의 시청 | O | O | O |

> **KPOP 특화 기능**: 학생이 귀국 후 춤/노래 영상을 업로드하면 INSTRUCTOR가 피드백 제공

---

## 5. User Entity 설계

### 5.1 User (기본)

```java
@Entity
@Table(name = "users")
public class User extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;        // BCrypt 해시

    @Column(nullable = false, length = 50)
    private String name;

    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;      // ACTIVE, INACTIVE, SUSPENDED

    // 테넌트 레벨 역할
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantRole role;        // USER, OPERATOR, TENANT_ADMIN

    // B2B 전용: 소속 조직
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    // B2C: 내가 강사인 강의들
    @OneToMany(mappedBy = "user")
    private List<CourseInstructor> instructingCourses = new ArrayList<>();

    // 수강 중인 강의들
    @OneToMany(mappedBy = "user")
    private List<Enrollment> enrollments = new ArrayList<>();
}
```

### 5.2 CourseRole (강의별 역할)

```java
@Entity
@Table(name = "course_roles")
public class UserCourseRole extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;          // null이면 테넌트 레벨 역할

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseRole role;        // DESIGNER, OWNER, INSTRUCTOR

    private Integer revenueSharePercent;  // 수익 분배 비율 (B2C OWNER: 70%)

    // B2C: 강의 개설 버튼 클릭 시 DESIGNER 부여
    public static UserCourseRole createDesigner(User user) {
        UserCourseRole ucr = new UserCourseRole();
        ucr.user = user;
        ucr.course = null;  // 아직 강의 없음
        ucr.role = CourseRole.DESIGNER;
        return ucr;
    }

    // 강의 승인 후 OWNER로 전환
    public static UserCourseRole createOwner(Course course, User user) {
        UserCourseRole ucr = new UserCourseRole();
        ucr.course = course;
        ucr.user = user;
        ucr.role = CourseRole.OWNER;
        ucr.revenueSharePercent = 70;  // B2C 기본 70% (플랫폼 30%)
        return ucr;
    }

    // B2B: OPERATOR가 강사 부여
    public static UserCourseRole createInstructor(Course course, User user) {
        UserCourseRole ucr = new UserCourseRole();
        ucr.course = course;
        ucr.user = user;
        ucr.role = CourseRole.INSTRUCTOR;
        return ucr;
    }
}
```

### 5.3 Course와 역할 관계

```java
@Entity
@Table(name = "courses")
public class Course extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private Integer price;

    @Enumerated(EnumType.STRING)
    private CourseStatus status;    // DRAFT, PENDING, PUBLISHED, CLOSED

    // 역할 (DESIGNER, OWNER, INSTRUCTOR)
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<UserCourseRole> roles = new ArrayList<>();

    // B2C: DESIGNER가 강의 구성 (아직 승인 전)
    public static Course createDraft(String title, User designer) {
        Course course = new Course();
        course.title = title;
        course.status = CourseStatus.DRAFT;
        // DESIGNER는 이미 user에게 부여되어 있음
        return course;
    }

    // 승인 후 OWNER 등록
    public void approve(User designer) {
        this.status = CourseStatus.PUBLISHED;
        this.roles.add(UserCourseRole.createOwner(this, designer));
    }

    // B2B: 강사 추가
    public void addInstructor(User user) {
        this.roles.add(UserCourseRole.createInstructor(this, user));
    }

    // OWNER 조회
    public User getOwner() {
        return roles.stream()
            .filter(r -> r.getRole() == CourseRole.OWNER)
            .findFirst()
            .map(UserCourseRole::getUser)
            .orElseThrow();
    }
}
```

### 5.4 Organization (B2B 조직)

```java
@Entity
@Table(name = "organizations")
public class Organization extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;            // "개발1팀", "인사부"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Organization parent;    // 상위 조직

    @OneToMany(mappedBy = "parent")
    private List<Organization> children = new ArrayList<>();

    private Integer level;          // 0: 최상위, 1: 본부, 2: 팀
    private Integer sortOrder;
}
```

---

## 6. 권한 부여 플로우

### 6.1 B2C 사용자 가입 및 강의 생성

```
1. 회원가입
       │
       ▼
2. 기본 역할 부여: USER (수강 가능)
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
3-A. 강의 수강                      3-B. "강의 개설하기" 버튼 클릭
     (Enrollment 생성)                    │
                                          ▼
                                    4. DESIGNER Role 부여
                                       (강의 설계 페이지 접근 가능)
                                          │
                                          ▼
                                    5. 강의 구성 (커리큘럼, 영상 등)
                                          │
                                          ▼
                                    6. "개설 신청" 버튼 클릭
                                       (status: PENDING)
                                          │
                                          ▼
                                    7. OPERATOR 승인
                                          │
                                          ▼
                                    8. OWNER Role 부여 (=강사)
                                       (status: PUBLISHED)
```

> **B2C 특징**: OWNER = 강사 (별도 INSTRUCTOR 없음, 1인 크리에이터 구조)

### 6.2 B2B 사용자 등록 및 역할 부여

```
1. 관리자가 사용자 생성 (대량 등록 가능)
   또는 SSO로 자동 생성
       │
       ▼
2. 조직 배정 + 기본 역할 부여
   예: organization_id = 5, role = USER
       │
       ▼
3. OPERATOR가 역할 부여 (유저 목록에서)
       │
       ├─► "강사 부여" 버튼 ──────────► INSTRUCTOR
       │
       └─► "강의설계자 부여" 버튼 ────► DESIGNER
                                          │
                                          ▼
                                    4. 강의 구성 (커리큘럼, 영상 등)
                                          │
                                          ▼
                                    5. "개설 신청" 버튼 클릭
                                          │
                                          ▼
                                    6. 승인 → OWNER Role 부여
```

> **B2B 특징**:
> - OPERATOR가 역할 부여/회수 가능
> - INSTRUCTOR와 OWNER 분리 (조직 내 역할 분담)
> - 일반 USER는 강의 개설 버튼 자체가 안 보임 (역할 부여 전까지)

### 6.3 KPOP 사용자 가입

```
1. 회원가입 (무료)
       │
       ▼
2. 기본 역할: USER
       │
       ▼
3. 구독 결제
       │
       ▼
4. 구독 상태 활성화 (콘텐츠 접근)
```

---

## 7. 권한 검증 구현

### 7.1 Spring Security 설정

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                // 공개 API
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()

                // 관리자 API
                .requestMatchers("/api/admin/**").hasRole("TENANT_ADMIN")

                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            .build();
    }
}
```

### 7.2 메서드 레벨 권한

```java
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    // 모든 인증된 사용자 - 강의 목록 조회
    @GetMapping
    public List<CourseResponse> getCourses() { }

    // B2C: 모든 USER가 강의 생성 가능
    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'TENANT_ADMIN')")
    public CourseResponse createCourse() { }

    // 강의 수정: OWNER 또는 INSTRUCTOR만
    @PutMapping("/{id}")
    @PreAuthorize("@courseSecurity.canEdit(#id) or hasRole('TENANT_ADMIN')")
    public CourseResponse updateCourse(@PathVariable Long id) { }

    // 강의 삭제: OWNER만
    @DeleteMapping("/{id}")
    @PreAuthorize("@courseSecurity.isOwner(#id) or hasRole('TENANT_ADMIN')")
    public void deleteCourse(@PathVariable Long id) { }

    // 강사 추가: OWNER만
    @PostMapping("/{id}/instructors")
    @PreAuthorize("@courseSecurity.isOwner(#id)")
    public void addInstructor(@PathVariable Long id) { }
}
```

### 7.3 커스텀 Security Service (B2C 강의 권한)

```java
@Service
@RequiredArgsConstructor
public class CourseSecurityService {
    private final CourseInstructorRepository courseInstructorRepository;
    private final EnrollmentRepository enrollmentRepository;

    // OWNER 여부
    public boolean isOwner(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return courseInstructorRepository
            .existsByCourseIdAndUserIdAndRole(courseId, userId, CourseRole.OWNER);
    }

    // OWNER 또는 INSTRUCTOR 여부 (수정 권한)
    public boolean canEdit(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return courseInstructorRepository
            .existsByCourseIdAndUserIdAndRoleIn(
                courseId, userId, List.of(CourseRole.OWNER, CourseRole.INSTRUCTOR)
            );
    }

    // 강의 접근 권한 (강사 또는 수강생)
    public boolean canAccess(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return courseInstructorRepository.existsByCourseIdAndUserId(courseId, userId)
            || enrollmentRepository.existsByCourseIdAndUserId(courseId, userId);
    }

    // Q&A 답변 권한 (OWNER, INSTRUCTOR)
    public boolean canAnswerQna(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return courseInstructorRepository.existsByCourseIdAndUserId(courseId, userId);
    }
}

@Service
@RequiredArgsConstructor
public class OrgSecurityService {

    public boolean isOperator() {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return userRepository.findById(currentUserId)
            .map(user -> user.getRole() == TenantRole.OPERATOR)
            .orElse(false);
    }

    public boolean belongsToOrg(Long orgId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return userRepository.findById(currentUserId)
            .map(user -> user.getOrganization() != null
                && user.getOrganization().getId().equals(orgId))
            .orElse(false);
    }
}
```

---

## 8. JWT 토큰 구조

```java
public class JwtTokenProvider {

    public String createAccessToken(User user) {
        Claims claims = Jwts.claims()
            .setSubject(user.getId().toString());

        // 토큰에 포함할 정보
        claims.put("email", user.getEmail());
        claims.put("tenantId", user.getTenantId());
        claims.put("roles", user.getRoles().stream()
            .map(r -> r.getRole().name())
            .toList());

        // B2B의 경우 조직 정보
        if (user.getOrganization() != null) {
            claims.put("organizationId", user.getOrganization().getId());
        }

        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
            .signWith(secretKey, SignatureAlgorithm.HS256)
            .compact();
    }
}
```

**JWT Payload 예시:**

```json
{
  "sub": "12345",
  "email": "user@samsung.com",
  "tenantId": 2,
  "roles": ["OPERATOR"],
  "organizationId": 5,
  "iat": 1699000000,
  "exp": 1699000900
}
```

---

## 9. 사이트별 권한 요약

### B2C (인프런형) - 셀프 서비스 모델

```
TENANT_ADMIN ─── 전체 관리
       │
       ▼
   OPERATOR ──── 강의 개설 신청 검토/승인, 차수 생성
       │
       ▼
     USER ─────── 수강 + "강의 개설하기" 버튼 접근
       │
       │ "강의 개설하기" 클릭
       ▼
┌─────────────────────────────────────┐
│           CourseRole                │
├─────────────────────────────────────┤
│ DESIGNER ─ 강의 설계 (승인 전)      │
│     │                               │
│     │ 승인 후                       │
│     ▼                               │
│ OWNER ──── 강의 소유 + 강사 (=1인)  │
└─────────────────────────────────────┘
```

**핵심**: B2C는 OWNER = 강사 (INSTRUCTOR 없음), 1인 크리에이터 구조

### B2B (기업 전용) - 관리자 통제 모델

```
TENANT_ADMIN ─────┬─ 전사 통계/브랜딩
                  │
OPERATOR ─────────┼─ 전체 운영 + 역할 부여/회수
                  │     │
                  │     ├─► "강사 부여" ────► INSTRUCTOR
                  │     │
                  │     └─► "강의설계자 부여" ► DESIGNER → (승인 후) → OWNER
                  │
USER ─────────────┴─ 학습 (역할 부여 전까지 강의 개설 불가)
```

**핵심**: OPERATOR가 유저 목록에서 역할 부여/회수, OWNER ≠ 강사 (분리 가능)

### KPOP (K-POP 단기 연수)

```
TENANT_ADMIN ─┬─ 전체 관리
              │
OPERATOR ─────┼─ 프로그램/스케줄/시설/강의 관리
              │
USER ─────────┴─ 학생 (스케줄 조회, 시설 예약, 수강, 영상 업로드)
```

**특화 기능**: 귀국 후 춤/노래 영상 업로드 → INSTRUCTOR 피드백

---

## 10. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 분리 전략 |
| [21-SECURITY-CONVENTIONS.md](../conventions/21-SECURITY-CONVENTIONS.md) | 보안 컨벤션 |

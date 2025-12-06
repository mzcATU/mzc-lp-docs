# 사용자 역할 및 권한

> 역할 계층, 권한 부여 전략, 사이트별 권한 체계

---

## 1. 역할 계층 구조

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
│   (B2C 관리)  │   │  (B2B 관리)   │   │ (KPOP 관리)   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│     USER      │   │ TENANT_OPERATOR│  │   ARTIST      │
│ (수강+강의등록)│   │   (운영자)    │   │  (아티스트)   │
└───────────────┘   └───────────────┘   └───────────────┘
                           │                   │
                           ▼                   ▼
                    ┌───────────────┐   ┌───────────────┐
                    │    MEMBER     │   │     FAN       │
                    │   (직원)      │   │    (팬)       │
                    └───────────────┘   └───────────────┘
```

### B2C 특징: 강의별 권한

```
USER (일반 사용자)
  │
  ├── 수강생으로서: 다른 사람 강의 수강
  │
  └── 강사로서: 본인이 만든 강의 관리
      │
      ├── 강의 생성 → 자동으로 해당 강의의 INSTRUCTOR
      │
      └── 다른 사람 강의에 강사로 배정됨 → 해당 강의의 INSTRUCTOR
```

---

## 2. 역할 정의

### 2.1 시스템 레벨 역할

```java
public enum SystemRole {
    SUPER_ADMIN     // 플랫폼 전체 관리 (MZC 내부)
}
```

### 2.2 테넌트 레벨 역할

```java
public enum TenantRole {
    // 공통
    TENANT_ADMIN,       // 테넌트 최고 관리자

    // B2C 전용
    OPERATOR,           // 운영자 (강의 검토, 차수 생성, 강사 배정)
    USER,               // 일반 사용자 (수강 + 강의 등록 가능)

    // B2B 전용
    TENANT_OPERATOR,    // 테넌트 운영자 (B2B 전체 운영)
    ORG_ADMIN,          // 조직(부서) 관리자
    MEMBER,             // 일반 직원

    // KPOP 전용
    ARTIST,             // 아티스트 (콘텐츠 제작)
    FAN                 // 팬 (구독자)
}
```

### 2.4 Operator 역할 상세 (B2C)

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

### 2.3 강의 레벨 역할 (B2C 전용)

```java
public enum CourseRole {
    OWNER,          // 강의 생성자 (소유권, 수익)
    INSTRUCTOR,     // 강사 (강의 관리, 수익 분배)
    ASSISTANT       // 조교 (Q&A 답변, 과제 채점)
}
```

> **핵심**: B2C는 `TenantRole.USER`로 통일, 강의별 권한은 `CourseInstructor` 테이블로 관리

---

## 3. 역할별 권한 매트릭스

### 3.1 B2C 사이트

#### 테넌트 레벨 권한

| 권한 | TENANT_ADMIN | USER |
|------|--------------|------|
| 플랫폼 설정 | O | X |
| 모든 강의 관리 | O | X |
| 사용자 관리 | O | X |
| 강의 생성 | O | **O** |
| 강의 수강 | O | O |
| 리뷰 작성 | O | O |

#### 강의 레벨 권한 (CourseRole)

| 권한 | OWNER | INSTRUCTOR | ASSISTANT | 수강생 |
|------|-------|------------|-----------|--------|
| 강의 삭제 | O | X | X | X |
| 강의 정보 수정 | O | O | X | X |
| 영상 업로드 | O | O | X | X |
| 가격 설정 | O | X | X | X |
| 수익 전체 조회 | O | X | X | X |
| 수익 분배 받기 | O | O | X | X |
| Q&A 답변 | O | O | O | X |
| 과제 채점 | O | O | O | X |
| 수강생 관리 | O | O | X | X |
| 강의 시청 | O | O | O | O |

> **USER는 누구나 강의를 만들 수 있고, 만든 순간 해당 강의의 OWNER가 됨**

### 3.2 B2B 사이트

| 권한 | TENANT_ADMIN | TENANT_OPERATOR | ORG_ADMIN | MEMBER |
|------|--------------|-----------------|-----------|--------|
| 테넌트 설정 | O | X | X | X |
| 브랜딩 설정 | O | O | X | X |
| 모든 사용자 관리 | O | O | X | X |
| 조직 관리 | O | O | 본인 조직 | X |
| 강의 업로드 | O | O | X | X |
| 학습 현황 조회 | O | O | 본인 조직 | 본인 |
| 대시보드 | 전체 | 전체 | 조직 | 개인 |
| 수강 | O | O | O | O |

### 3.3 KPOP 사이트

| 권한 | TENANT_ADMIN | ARTIST | FAN |
|------|--------------|--------|-----|
| 플랫폼 설정 | O | X | X |
| 콘텐츠 업로드 | O | O | X |
| 캠프 생성 | O | O | X |
| 피드백 제공 | O | O | X |
| 구독 | O | O | O |
| 콘텐츠 시청 | O | O | 구독자만 |
| 댓글 | O | O | O |

---

## 4. User Entity 설계

### 4.1 User (기본)

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
    private TenantRole role;        // USER, MEMBER, FAN 등

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

### 4.2 CourseInstructor (강의별 강사 - B2C 핵심)

```java
@Entity
@Table(name = "course_instructors")
public class CourseInstructor extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseRole role;        // OWNER, INSTRUCTOR, ASSISTANT

    private Integer revenueSharePercent;  // 수익 분배 비율 (예: 70%)

    // 정적 팩토리
    public static CourseInstructor createOwner(Course course, User user) {
        CourseInstructor ci = new CourseInstructor();
        ci.course = course;
        ci.user = user;
        ci.role = CourseRole.OWNER;
        ci.revenueSharePercent = 70;  // 기본 70% (플랫폼 30%)
        return ci;
    }

    public static CourseInstructor addInstructor(Course course, User user, int sharePercent) {
        CourseInstructor ci = new CourseInstructor();
        ci.course = course;
        ci.user = user;
        ci.role = CourseRole.INSTRUCTOR;
        ci.revenueSharePercent = sharePercent;
        return ci;
    }
}
```

### 4.3 Course와 강사 관계

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

    // 강사들 (OWNER 포함)
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<CourseInstructor> instructors = new ArrayList<>();

    // 강의 생성 시 OWNER 자동 등록
    public static Course create(String title, User creator) {
        Course course = new Course();
        course.title = title;
        course.status = CourseStatus.DRAFT;
        course.instructors.add(CourseInstructor.createOwner(course, creator));
        return course;
    }

    // 강사 추가
    public void addInstructor(User user, int sharePercent) {
        this.instructors.add(CourseInstructor.addInstructor(this, user, sharePercent));
    }

    // OWNER 조회
    public User getOwner() {
        return instructors.stream()
            .filter(i -> i.getRole() == CourseRole.OWNER)
            .findFirst()
            .map(CourseInstructor::getUser)
            .orElseThrow();
    }
}
```

### 4.4 Organization (B2B 조직)

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

## 5. 권한 부여 플로우

### 5.1 B2C 사용자 가입 및 강의 생성

```
1. 회원가입
       │
       ▼
2. 기본 역할 부여: USER (수강 + 강의 생성 가능)
       │
       ├──────────────────────────────────┐
       ▼                                  ▼
3-A. 강의 수강                      3-B. 강의 생성
     (Enrollment 생성)                    │
                                          ▼
                                    4. CourseInstructor 생성
                                       (role: OWNER)
                                          │
                                          ▼
                                    5. 강의 심사 (PENDING)
                                          │
                                          ▼
                                    6. 승인 → PUBLISHED
```

### 5.2 B2C 강사 배정 (공동 강의)

```
1. 강의 OWNER가 강사 초대
       │
       ▼
2. 초대받은 USER 승낙
       │
       ▼
3. CourseInstructor 생성
   (role: INSTRUCTOR, revenueSharePercent: 30%)
       │
       ▼
4. 해당 강의에 대해 강사 권한 획득
```

### 5.3 B2B 사용자 등록

```
1. 관리자가 사용자 생성 (대량 등록 가능)
   또는 SSO로 자동 생성
       │
       ▼
2. 조직 배정 + 역할 부여
   예: organization_id = 5, role = MEMBER
       │
       ▼
3. 추가 권한 부여 (선택)
   예: role = ORG_ADMIN (해당 조직 관리자)
```

### 5.4 KPOP 사용자 가입

```
1. 회원가입 (무료)
       │
       ▼
2. 기본 역할: FAN
       │
       ▼
3. 구독 결제
       │
       ▼
4. 구독 상태 활성화 (콘텐츠 접근)
```

---

## 6. 권한 검증 구현

### 6.1 Spring Security 설정

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

### 6.2 메서드 레벨 권한

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

### 6.3 커스텀 Security Service (B2C 강의 권한)

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

    // Q&A 답변 권한 (OWNER, INSTRUCTOR, ASSISTANT)
    public boolean canAnswerQna(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return courseInstructorRepository.existsByCourseIdAndUserId(courseId, userId);
    }
}

@Service
@RequiredArgsConstructor
public class OrgSecurityService {

    public boolean isOrgAdmin(Long orgId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        return userRoleRepository.existsByUserIdAndRoleAndScopeOrganizationId(
            currentUserId, TenantRole.ORG_ADMIN, orgId
        );
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

## 7. JWT 토큰 구조

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
  "roles": ["MEMBER", "ORG_ADMIN"],
  "organizationId": 5,
  "iat": 1699000000,
  "exp": 1699000900
}
```

---

## 8. 사이트별 권한 요약

### B2C (인프런형) - 강의별 권한 모델

```
TENANT_ADMIN ─── 전체 관리
       │
       ▼
     USER ─────── 수강 + 강의 생성 가능
       │
       │ 강의 생성 시
       ▼
┌─────────────────────────────────────┐
│         CourseInstructor            │
├─────────────────────────────────────┤
│ OWNER ──── 강의 소유, 삭제, 수익    │
│ INSTRUCTOR ─ 강의 관리, 수익 분배   │
│ ASSISTANT ── Q&A, 과제 채점         │
└─────────────────────────────────────┘
```

**핵심**: USER는 동시에 여러 강의의 수강생이면서, 다른 강의의 OWNER/INSTRUCTOR일 수 있음

### B2B (기업 전용)

```
TENANT_ADMIN ─────┬─ 테넌트 전체 관리
                  │
TENANT_OPERATOR ──┼─ 운영 (사용자, 강의, 대시보드)
                  │
ORG_ADMIN ────────┼─ 소속 조직 관리
                  │
MEMBER ───────────┴─ 학습
```

### KPOP (팬 플랫폼)

```
TENANT_ADMIN ─┬─ 전체 관리
              │
ARTIST ───────┼─ 콘텐츠 제작, 캠프 운영
              │
FAN ──────────┴─ 구독, 시청, 참여
```

---

## 9. 관련 문서

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 분리 전략 |
| [21-SECURITY-CONVENTIONS.md](../conventions/21-SECURITY-CONVENTIONS.md) | 보안 컨벤션 |

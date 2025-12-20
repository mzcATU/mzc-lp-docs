# 권한 모델 (Authorization Model)

> RBAC 기반 Role → Authority → Privilege → Resource 4계층 권한 체계
> **역할 정의/플로우는 → [user-roles.md](./user-roles.md)**

---

## 언제 이 문서를 보는가?

| 상황 | 이 문서 | 다른 문서 |
|------|---------|----------|
| 권한 검증 코드 작성 | ✅ 섹션 4, 7 | - |
| Authority 종류 확인 | ✅ 섹션 2 | - |
| RBAC 매트릭스 확인 | ✅ 섹션 5 | - |
| 역할이 뭐가 있지? | - | [user-roles.md](./user-roles.md) |
| 역할 부여 플로우? | - | [user-roles.md](./user-roles.md) |

---

## 1. 권한 체계 기본 개념

### 1.1 Role / Authority / Privilege 구분

일반적인 SaaS 권한 체계에서 세 가지 개념을 명확히 구분해야 한다:

| 개념 | 정의 | 예시 |
|------|------|------|
| **Role (역할)** | "누구인가" - 직책/직무 | OPERATOR, DESIGNER, INSTRUCTOR |
| **Authority (권한)** | "무엇을 할 수 있는가" - 허용된 작업 종류 | COURSE_CREATE, COURSE_APPROVE |
| **Privilege (특권)** | "어떤 조건에서 할 수 있는가" - 리소스 범위 | 본인 콘텐츠만, 본인 강의만, 배정된 차수만 |

### 1.2 4계층 권한 구조 (확장된 RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Role (역할)                                 │
│         "누구인가" - 사용자의 정체성/직책                          │
│         TenantRole: SYSTEM_ADMIN, TENANT_ADMIN, OPERATOR...      │
│         CourseRole: DESIGNER, OWNER, INSTRUCTOR                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ has
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Authority (권한)                               │
│         "무엇을 할 수 있는가" - 허용된 작업                        │
│         COURSE_CREATE, COURSE_APPROVE, USER_MANAGE...            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ with privilege
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Privilege (특권/범위)                          │
│         "어떤 범위에서" - 리소스 접근 조건                        │
│         ALL (전체), OWN (본인만), ASSIGNED (배정된 것만)          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ on
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Resource (리소스)                              │
│         "대상이 무엇인가" - 작업 대상 엔티티                       │
│         Course, CourseTime, Enrollment, Content...               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 핵심 원칙

- Role은 Authority의 묶음
- Authority는 Resource에 대한 Action 조합
- **Privilege는 Authority의 범위 제한** (본인 것만, 배정된 것만 등)
- 권한 검증: `hasAuthority('COURSE_APPROVE')` 또는 `hasRole('OPERATOR')`

### 1.4 System Admin ≠ Tenant Admin (역할 분리)

```
❌ 잘못된 설계:
- System Admin이 Tenant Admin 업무를 직접 처리
- 역할 경계 모호 → 책임 불명확

✅ 올바른 설계:
┌─────────────────────────────────────────────────────────────────┐
│  SYSTEM_ADMIN                    TENANT_ADMIN                    │
│  ├── 테넌트 생성/삭제             ├── 해당 테넌트 사용자 관리      │
│  ├── 시스템 설정                  ├── 테넌트 설정/브랜딩           │
│  └── 전체 통계                    └── 테넌트 내 강의/차수 관리     │
│                                                                  │
│  → 각 역할은 본인 범위 내에서만 작업                              │
│  → SYSTEM_ADMIN이 TENANT_ADMIN 역할을 대행하지 않음               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.5 리소스 접근 통제 예시

```java
/**
 * 콘텐츠 삭제 권한 검증
 * 핵심: "콘텐츠 생성자만 본인이 생성한 콘텐츠를 삭제할 수 있다"
 */
@Service
public class ContentSecurityService {

    // Privilege 적용: OWN (본인 것만)
    public boolean canDelete(Long contentId) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        Content content = contentRepository.findById(contentId).orElseThrow();

        // CONTENT_DELETE Authority + OWN Privilege
        return content.getUploadedBy().equals(currentUserId);
    }
}

// Controller
@DeleteMapping("/contents/{id}")
@PreAuthorize("@contentSecurityService.canDelete(#id) or hasRole('TENANT_ADMIN')")
public void deleteContent(@PathVariable Long id) { }
```

**Privilege 종류:**

| Privilege | 설명 | 적용 예시 |
|-----------|------|----------|
| `ALL` | 전체 접근 | TENANT_ADMIN의 모든 강의 관리 |
| `OWN` | 본인 것만 | OWNER가 본인 강의만 수정/삭제 |
| `ASSIGNED` | 배정된 것만 | INSTRUCTOR가 배정된 차수만 관리 |
| `ENROLLED` | 수강 중인 것만 | USER가 수강 중인 강의만 진도 조회 |

---

## 2. Authority 정의

### 2.1 테넌트 레벨 Authority

| Authority | 설명 | 부여 대상 Role |
|-----------|------|----------------|
| `TENANT_MANAGE` | 테넌트 설정, 브랜딩 관리 | SYSTEM_ADMIN, TENANT_ADMIN |
| `USER_MANAGE` | 사용자 생성/수정/삭제 | TENANT_ADMIN, OPERATOR |
| `USER_ROLE_ASSIGN` | 사용자 역할 부여/회수 | TENANT_ADMIN, OPERATOR |
| `COURSE_APPROVE` | 강의 개설 신청 승인/반려 | TENANT_ADMIN, OPERATOR |
| `COURSE_TIME_MANAGE` | 차수 생성/수정/삭제 | TENANT_ADMIN, OPERATOR |
| `INSTRUCTOR_ASSIGN` | 강사 배정 | TENANT_ADMIN, OPERATOR |
| `ENROLLMENT_MANAGE` | 수강 신청 강제/취소 | TENANT_ADMIN, OPERATOR |
| `STATISTICS_VIEW` | 전체 통계 조회 | TENANT_ADMIN, OPERATOR |
| `COURSE_CREATE` | 강의 생성 (초안) | USER, DESIGNER, OPERATOR, TENANT_ADMIN |
| `ENROLLMENT_SELF` | 본인 수강 신청 | USER 이상 모든 역할 |

### 2.2 강의 레벨 Authority

| Authority | 설명 | 부여 대상 CourseRole |
|-----------|------|---------------------|
| `COURSE_DESIGN` | 커리큘럼 구성, 콘텐츠 배치 | DESIGNER, OWNER |
| `COURSE_SUBMIT` | 개설 신청 제출 | DESIGNER |
| `COURSE_EDIT` | 강의 정보 수정 | OWNER, INSTRUCTOR |
| `COURSE_DELETE` | 강의 삭제 | OWNER |
| `COURSE_PRICE_SET` | 가격 설정 | OWNER |
| `CONTENT_UPLOAD` | 콘텐츠 업로드 | DESIGNER, OWNER, INSTRUCTOR |
| `STUDENT_MANAGE` | 수강생 관리 (명단 조회 등) | OWNER, INSTRUCTOR |
| `QNA_ANSWER` | Q&A 답변 | OWNER, INSTRUCTOR |
| `REVENUE_VIEW` | 수익 조회 | OWNER |

### 2.3 차수(Time) 레벨 Authority

| Authority | 설명 | 부여 대상 |
|-----------|------|----------|
| `TIME_INSTRUCTOR_MAIN` | 주강사 권한 (출석, 성적) | InstructorRole.MAIN |
| `TIME_INSTRUCTOR_SUB` | 보조강사 권한 (강의 보조) | InstructorRole.SUB |
| `TIME_INSTRUCTOR_ASSISTANT` | 조교 권한 (행정 보조) | InstructorRole.ASSISTANT |

---

## 3. Role → Authority 매핑

### 3.1 TenantRole 매핑

```java
public enum TenantRole {
    SYSTEM_ADMIN(Set.of(
        "TENANT_MANAGE", "USER_MANAGE", "USER_ROLE_ASSIGN",
        "COURSE_APPROVE", "COURSE_TIME_MANAGE", "INSTRUCTOR_ASSIGN",
        "ENROLLMENT_MANAGE", "STATISTICS_VIEW", "COURSE_CREATE", "ENROLLMENT_SELF"
    )),

    TENANT_ADMIN(Set.of(
        "TENANT_MANAGE", "USER_MANAGE", "USER_ROLE_ASSIGN",
        "COURSE_APPROVE", "COURSE_TIME_MANAGE", "INSTRUCTOR_ASSIGN",
        "ENROLLMENT_MANAGE", "STATISTICS_VIEW", "COURSE_CREATE", "ENROLLMENT_SELF"
    )),

    OPERATOR(Set.of(
        "USER_MANAGE", "USER_ROLE_ASSIGN",
        "COURSE_APPROVE", "COURSE_TIME_MANAGE", "INSTRUCTOR_ASSIGN",
        "ENROLLMENT_MANAGE", "STATISTICS_VIEW", "COURSE_CREATE", "ENROLLMENT_SELF"
    )),

    DESIGNER(Set.of(
        "COURSE_CREATE", "ENROLLMENT_SELF"
    )),

    USER(Set.of(
        "COURSE_CREATE", "ENROLLMENT_SELF"  // B2C: 강의 개설 버튼 접근 가능
    ));

    private final Set<String> authorities;
}
```

### 3.2 CourseRole 매핑

```java
public enum CourseRole {
    DESIGNER(Set.of(
        "COURSE_DESIGN", "COURSE_SUBMIT", "CONTENT_UPLOAD"
    )),

    OWNER(Set.of(
        "COURSE_DESIGN", "COURSE_EDIT", "COURSE_DELETE", "COURSE_PRICE_SET",
        "CONTENT_UPLOAD", "STUDENT_MANAGE", "QNA_ANSWER", "REVENUE_VIEW"
    )),

    INSTRUCTOR(Set.of(
        "COURSE_EDIT", "CONTENT_UPLOAD", "STUDENT_MANAGE", "QNA_ANSWER"
    ));

    private final Set<String> authorities;
}
```

---

## 4. 권한 검증 패턴

### 4.1 테넌트 레벨 검증

```java
// Role 기반 검증
@PreAuthorize("hasRole('OPERATOR')")
public void approveCoourse(Long courseId) { }

// Authority 기반 검증 (권장)
@PreAuthorize("hasAuthority('COURSE_APPROVE')")
public void approveCourse(Long courseId) { }

// 복합 조건
@PreAuthorize("hasAuthority('COURSE_APPROVE') or hasRole('TENANT_ADMIN')")
public void approveCourse(Long courseId) { }
```

### 4.2 리소스 소유권 검증

```java
@Service
public class CourseSecurityService {

    // 강의 수정 권한: OWNER 또는 INSTRUCTOR
    public boolean canEdit(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return userCourseRoleRepository.existsByCourseIdAndUserIdAndRoleIn(
            courseId, userId, List.of(CourseRole.OWNER, CourseRole.INSTRUCTOR)
        );
    }

    // 강의 삭제 권한: OWNER만
    public boolean canDelete(Long courseId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return userCourseRoleRepository.existsByCourseIdAndUserIdAndRole(
            courseId, userId, CourseRole.OWNER
        );
    }
}

// Controller에서 사용
@DeleteMapping("/{id}")
@PreAuthorize("@courseSecurityService.canDelete(#id) or hasRole('TENANT_ADMIN')")
public void deleteCourse(@PathVariable Long id) { }
```

### 4.3 차수(Time) 레벨 검증

```java
@Service
public class TimeSecurityService {

    // 차수 강사 권한 확인
    public boolean isInstructor(Long timeId) {
        Long userId = SecurityUtils.getCurrentUserId();
        Long tenantId = TenantContext.getCurrentTenantId();
        return instructorAssignmentRepository
            .existsByTimeKeyAndUserKeyAndTenantIdAndStatus(
                timeId, userId, tenantId, AssignmentStatus.ACTIVE
            );
    }

    // 주강사 권한 확인
    public boolean isMainInstructor(Long timeId) {
        Long userId = SecurityUtils.getCurrentUserId();
        Long tenantId = TenantContext.getCurrentTenantId();
        return instructorAssignmentRepository
            .existsByTimeKeyAndUserKeyAndTenantIdAndStatusAndRole(
                timeId, userId, tenantId, AssignmentStatus.ACTIVE, InstructorRole.MAIN
            );
    }
}
```

---

## 5. RBAC 매트릭스

### 5.1 강의(Course) 리소스

| Action | USER | DESIGNER | OWNER | INSTRUCTOR | OPERATOR | TENANT_ADMIN |
|--------|------|----------|-------|------------|----------|--------------|
| 목록 조회 | O | O | O | O | O | O |
| 상세 조회 | O | O | O | O | O | O |
| 생성 (초안) | O | O | - | - | O | O |
| 설계/구성 | - | **본인** | **본인** | - | - | O |
| 개설 신청 | - | **본인** | - | - | - | O |
| 승인/반려 | - | - | - | - | O | O |
| 수정 | - | - | **본인** | **배정된** | - | O |
| 삭제 | - | - | **본인** | - | - | O |
| 가격 설정 | - | - | **본인** | - | - | O |

### 5.2 차수(CourseTime) 리소스

| Action | USER | OWNER | INSTRUCTOR | OPERATOR | TENANT_ADMIN |
|--------|------|-------|------------|----------|--------------|
| 목록 조회 | O | O | O | O | O |
| 상세 조회 | O | O | O | O | O |
| 생성 | - | - | - | O | O |
| 수정 | - | - | - | O | O |
| 삭제 | - | - | - | O | O |
| 강사 배정 | - | - | - | O | O |

### 5.3 수강(Enrollment) 리소스

| Action | USER | OWNER | INSTRUCTOR | OPERATOR | TENANT_ADMIN |
|--------|------|-------|------------|----------|--------------|
| 본인 신청 | O | O | O | O | O |
| 본인 취소 | O | O | O | O | O |
| 목록 조회 | **본인** | **강의** | **차수** | O | O |
| 강제 신청 | - | - | - | O | O |
| 강제 취소 | - | - | - | O | O |

### 5.4 콘텐츠(Content) 리소스

| Action | USER | DESIGNER | OWNER | INSTRUCTOR | OPERATOR | TENANT_ADMIN |
|--------|------|----------|-------|------------|----------|--------------|
| 조회 | **수강생** | **본인** | **본인** | **배정된** | O | O |
| 업로드 | - | **본인** | **본인** | **배정된** | - | O |
| 수정 | - | **본인** | **본인** | **배정된** | - | O |
| 삭제 | - | - | **본인** | - | - | O |

---

## 6. B2C vs B2B 권한 차이

### 6.1 역할 부여 방식

| 항목 | B2C | B2B |
|------|-----|-----|
| DESIGNER 부여 | 셀프 (버튼 클릭) | OPERATOR가 부여 |
| INSTRUCTOR | 없음 (OWNER=강사) | OPERATOR가 부여 |
| 역할 회수 | 불가 (본인 판단) | OPERATOR가 회수 |
| 강의 개설 | 모든 USER 가능 | DESIGNER만 가능 |

### 6.2 Authority 차이

```java
// B2C: USER도 COURSE_CREATE 권한
if (tenantType == TenantType.B2C) {
    authorities.add("COURSE_CREATE");
}

// B2B: OPERATOR가 부여해야 COURSE_CREATE 권한
if (tenantType == TenantType.B2B) {
    if (hasRole(TenantRole.DESIGNER)) {
        authorities.add("COURSE_CREATE");
    }
}
```

---

## 7. 구현 가이드

### 7.1 Authority Enum 정의

```java
public enum Authority {
    // 테넌트 레벨
    TENANT_MANAGE,
    USER_MANAGE,
    USER_ROLE_ASSIGN,
    COURSE_APPROVE,
    COURSE_TIME_MANAGE,
    INSTRUCTOR_ASSIGN,
    ENROLLMENT_MANAGE,
    STATISTICS_VIEW,

    // 공통
    COURSE_CREATE,
    ENROLLMENT_SELF,

    // 강의 레벨
    COURSE_DESIGN,
    COURSE_SUBMIT,
    COURSE_EDIT,
    COURSE_DELETE,
    COURSE_PRICE_SET,
    CONTENT_UPLOAD,
    STUDENT_MANAGE,
    QNA_ANSWER,
    REVENUE_VIEW,

    // 차수 레벨
    TIME_INSTRUCTOR_MAIN,
    TIME_INSTRUCTOR_SUB,
    TIME_INSTRUCTOR_ASSISTANT
}
```

### 7.2 UserDetails 구현

```java
public class CustomUserDetails implements UserDetails {
    private final User user;
    private final Set<GrantedAuthority> authorities;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> result = new HashSet<>();

        // Role 추가 (ROLE_ prefix)
        result.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        // Authority 추가
        for (String auth : user.getRole().getAuthorities()) {
            result.add(new SimpleGrantedAuthority(auth));
        }

        return result;
    }
}
```

### 7.3 Security Config

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                // Authority 기반 접근 제어
                .requestMatchers("/api/admin/tenants/**").hasAuthority("TENANT_MANAGE")
                .requestMatchers("/api/admin/users/**").hasAuthority("USER_MANAGE")
                .requestMatchers("/api/courses/approve/**").hasAuthority("COURSE_APPROVE")
                .requestMatchers("/api/times/**").hasAuthority("COURSE_TIME_MANAGE")

                // Role 기반 접근 제어 (대체 가능)
                .requestMatchers("/api/operator/**").hasRole("OPERATOR")

                .anyRequest().authenticated()
            )
            .build();
    }
}
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [user-roles.md](./user-roles.md) | 역할 정의 및 플로우 상세 |
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 분리 전략 |
| [20-SECURITY-CONVENTIONS.md](../conventions/20-SECURITY-CONVENTIONS.md) | 보안 컨벤션 |

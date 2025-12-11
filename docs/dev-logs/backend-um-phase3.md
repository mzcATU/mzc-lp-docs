# Backend UM 모듈 개발 로그 - Phase 3

> CourseRole API (강의별 역할 관리) 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업 일자** | 2025-12-11 |
| **관련 이슈** | [#13](https://github.com/mzcATU/mzc-lp-backend/issues/13) |
| **담당 모듈** | UM (User Master) |
| **브랜치** | `feat/um-course-role` |

---

## 1. 구현 개요

사용자가 강의 개설을 위한 DESIGNER 역할을 요청하고 조회할 수 있는 API 2개 구현:

| Method | Endpoint | 권한 | 기능 | HTTP Status |
|--------|----------|------|------|-------------|
| POST | `/api/users/me/course-roles/designer` | 인증된 사용자 | DESIGNER 역할 요청 | 201 Created |
| GET | `/api/users/me/course-roles` | 인증된 사용자 | 내 강의 역할 목록 조회 | 200 OK |

---

## 2. 비즈니스 로직

### CourseRole Enum

```java
public enum CourseRole {
    DESIGNER,    // 강의 개설 권한 (B2C)
    OWNER,       // 강의 소유자 (승인 후)
    INSTRUCTOR   // 강사 (B2B)
}
```

### B2C 플로우

```
1. USER가 "강의 개설하기" 클릭
2. DESIGNER 역할 부여 (테넌트 레벨, courseId = null)
3. 강의 작성 및 제출
4. 관리자 승인
5. OWNER 역할 부여 (강의 레벨, courseId = 실제 ID)
```

---

## 3. 신규 생성 파일 (4개)

### Entity

| 파일 | 경로 | 설명 |
|------|------|------|
| UserCourseRole.java | `entity/` | 강의별 역할 엔티티 |

### Repository

| 파일 | 경로 | 설명 |
|------|------|------|
| UserCourseRoleRepository.java | `repository/` | 역할 조회/존재 확인 |

### DTO

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseRoleResponse.java | `dto/response/` | 강의 역할 응답 |

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| RoleAlreadyExistsException.java | `exception/` | 중복 역할 예외 |

---

## 4. 수정 파일 (4개)

### ErrorCode.java

```java
// 추가
ROLE_ALREADY_EXISTS(HttpStatus.CONFLICT, "U006", "Role already exists for this user"),
```

### UserService.java (인터페이스)

```java
// CourseRole API 추가
CourseRoleResponse requestDesignerRole(Long userId);
List<CourseRoleResponse> getMyCourseRoles(Long userId);
```

### UserServiceImpl.java (구현체)

```java
@Override
@Transactional
public CourseRoleResponse requestDesignerRole(Long userId) {
    // 중복 체크 후 DESIGNER 역할 부여
}

@Override
public List<CourseRoleResponse> getMyCourseRoles(Long userId) {
    // 사용자의 모든 강의 역할 조회
}
```

### UserController.java

```java
// CourseRole API 엔드포인트 추가
@PostMapping("/me/course-roles/designer")
@GetMapping("/me/course-roles")
```

---

## 5. 파일 구조

```
domain/user/
├── controller/
│   └── UserController.java      (수정) +2 엔드포인트
├── service/
│   ├── UserService.java         (수정) +2 메서드
│   └── UserServiceImpl.java     (수정) +2 메서드
├── repository/
│   ├── UserRepository.java      (기존)
│   └── UserCourseRoleRepository.java    ✅ 신규
├── entity/
│   ├── User.java                (기존)
│   └── UserCourseRole.java      ✅ 신규
├── dto/
│   └── response/
│       └── CourseRoleResponse.java      ✅ 신규
├── exception/
│   └── RoleAlreadyExistsException.java  ✅ 신규
└── constant/
    └── CourseRole.java          (기존)

common/
└── constant/
    └── ErrorCode.java           (수정) +1 에러코드
```

---

## 6. Entity 상세

### UserCourseRole

```java
@Entity
@Table(name = "user_course_roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "course_id", "role"})
})
public class UserCourseRole extends BaseTimeEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "course_id")
    private Long courseId;  // null이면 테넌트 레벨 역할 (DESIGNER)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseRole role;

    private Integer revenueSharePercent;  // 수익 분배 비율 (B2C OWNER: 70%)

    // 정적 팩토리 메서드
    public static UserCourseRole createDesigner(User user) { ... }
    public static UserCourseRole createOwner(User user, Long courseId) { ... }
    public static UserCourseRole createInstructor(User user, Long courseId) { ... }
}
```

---

## 7. 테스트 케이스 (6개)

### POST /api/users/me/course-roles/designer

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - DESIGNER 역할 요청 | 201 Created |
| 실패 - 이미 DESIGNER 역할 보유 | 409 Conflict, U006 |
| 실패 - 인증 없이 접근 | 403 Forbidden |

### GET /api/users/me/course-roles

| 테스트 | 기대 결과 |
|--------|----------|
| 성공 - 역할이 없는 경우 | 200 OK, 빈 배열 |
| 성공 - DESIGNER 역할 조회 | 200 OK, 역할 목록 |
| 실패 - 인증 없이 접근 | 403 Forbidden |

---

## 8. API 테스트 검증 (실제 MySQL 연동)

### 테스트 환경

- DB: MySQL 8.0 (`mza_newlp`)
- 서버: `http://localhost:8080`

### 테스트 결과

| API | 요청 | 결과 |
|-----|------|------|
| POST /api/users/me/course-roles/designer | 첫 요청 | ✅ 201 Created |
| POST /api/users/me/course-roles/designer | 중복 요청 | ✅ 409 Conflict |
| GET /api/users/me/course-roles | 조회 | ✅ 200 OK (DESIGNER 포함) |

### 응답 예시

**DESIGNER 역할 요청 성공:**
```json
{
  "success": true,
  "data": {
    "courseRoleId": 1,
    "courseId": null,
    "courseName": null,
    "role": "DESIGNER",
    "revenueSharePercent": null,
    "createdAt": "2025-12-11T04:32:35.639481400Z"
  }
}
```

**중복 요청 시 에러:**
```json
{
  "success": false,
  "error": {
    "code": "U006",
    "message": "Role already exists: DESIGNER"
  }
}
```

---

## 9. 컨벤션 준수 체크

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@RestController`, `@RequiredArgsConstructor`, `@Validated`
- [x] Service만 호출 (비즈니스 로직 없음)
- [x] HTTP Status 준수 (POST → 201 Created)

### Service (04-SERVICE-CONVENTIONS)

- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`
- [x] 로깅: INFO(상태 변경), DEBUG(조회)

### Entity (06-ENTITY-CONVENTIONS)

- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`
- [x] `@Getter` (Setter 금지)
- [x] `@Enumerated(EnumType.STRING)`
- [x] 정적 팩토리 메서드

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Response: `from()` 정적 팩토리 메서드

### Repository (05-REPOSITORY-CONVENTIONS)

- [x] JpaRepository 상속
- [x] Query Method 네이밍 규칙

### Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc` 통합 테스트
- [x] `@Nested` + `@DisplayName` 그룹화
- [x] Given-When-Then 패턴

---

## 10. 커밋 정보

| 항목 | 내용 |
|------|------|
| **커밋** | `bcb9a80` - [Feat] CourseRole API (DESIGNER 역할 요청/조회) 구현 - #13 |
| **브랜치** | `feat/um-course-role` → `dev` |
| **관련 이슈** | closes #13 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2025-12-11 | Phase 3 구현 완료 (API 2개, 테스트 6개) |

---

*최종 업데이트: 2025-12-11*

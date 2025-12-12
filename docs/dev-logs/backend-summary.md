# Backend 개발 작업 요약

> 2025-12-09 ~ 2025-12-12 작업 내역

---

## PR 히스토리

| PR | 제목 | 브랜치 | 머지일 |
|----|------|--------|--------|
| #44 | [Feat] CM 모듈 기반 구조 구현 | feat/cm-module-foundation | 2025-12-12 |
| #38 | 회원 탈퇴 API RefreshToken 삭제 로직 추가 | feat/um-withdraw | 2025-12-12 |
| #37 | GitHub 이슈 마크다운 템플릿 추가 | chore/github-issue-templates | 2025-12-12 |
| #36 | [Feat] TS 모듈 기반 구조 구현 | feat/ts-module-foundation | 2025-12-12 |
| #19 | [Refactor] UserCourseRole 엔티티 멀티테넌시 적용 | refactor/um-tenant-filtering | 2025-12-11 |
| #18 | [Chore] 불필요한 파일 제거 | chore/cleanup-files | 2025-12-11 |
| #17 | [Feat] CourseRole 관리 API (역할 부여/회수) | feat/um-course-role-admin | 2025-12-11 |
| #16 | [Feat] CourseRole API (DESIGNER 역할 요청/조회) | feat/um-course-role | 2025-12-11 |
| #15 | [Feat] User 관리 API (OPERATOR 권한) | feat/um-user-admin | 2025-12-11 |
| #14 | [Feat] User API 확장 (/me 엔드포인트) | feat/um-user-api | 2025-12-11 |
| #5 | [Chore] GitHub 템플릿 추가 | chore/github-templates | 2025-12-11 |
| #4 | [Refactor] AuthController @Validated 추가 | feat/user-convention-fix | 2025-12-10 |
| #3 | [Feat] 로그인/로그아웃 API 및 JWT 인증 | feat/user-login | 2025-12-10 |
| #2 | [Feat] User 도메인 기본 구조 및 회원가입 API | feat/user-register | 2025-12-10 |
| #1 | [Feat] 프로젝트 초기 구조 | feat/init-structure | 2025-12-09 |

---

## 모듈별 구현 현황

### UM (User Master) 모듈

#### Phase 1: User API (/me 엔드포인트)

| Method | Endpoint | 기능 |
|--------|----------|------|
| GET | `/api/users/me` | 내 정보 조회 |
| PUT | `/api/users/me` | 내 정보 수정 |
| PUT | `/api/users/me/password` | 비밀번호 변경 |
| DELETE | `/api/users/me` | 회원 탈퇴 |

#### Phase 2: User 관리 API (OPERATOR/TENANT_ADMIN)

| Method | Endpoint | 권한 | 기능 |
|--------|----------|------|------|
| GET | `/api/users` | OPERATOR, TENANT_ADMIN | 사용자 목록 조회 |
| GET | `/api/users/{userId}` | OPERATOR, TENANT_ADMIN | 사용자 상세 조회 |
| PUT | `/api/users/{userId}/role` | TENANT_ADMIN | 역할 변경 |
| PUT | `/api/users/{userId}/status` | OPERATOR, TENANT_ADMIN | 상태 변경 |

#### Phase 3: CourseRole API

| Method | Endpoint | 권한 | 기능 |
|--------|----------|------|------|
| POST | `/api/users/me/course-roles/designer` | 인증된 사용자 | DESIGNER 역할 요청 |
| GET | `/api/users/me/course-roles` | 인증된 사용자 | 내 강의 역할 조회 |
| POST | `/api/users/{userId}/course-roles` | OPERATOR, TENANT_ADMIN | 역할 부여 |
| DELETE | `/api/users/{userId}/course-roles/{id}` | OPERATOR, TENANT_ADMIN | 역할 회수 |

#### Phase 4: 회원 탈퇴 보안 강화

| 기능 | 설명 |
|------|------|
| RefreshToken 삭제 | 회원 탈퇴 시 모든 RefreshToken 자동 삭제 |

#### Phase 5: 프로필 이미지 업로드

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/users/me/profile-image` | 프로필 이미지 업로드 (JPG/PNG, 최대 5MB) |

#### Auth API (인증)

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 갱신 |

---

### TS (Time Schedule) 모듈

#### Phase 1: 기반 구조

| 구성요소 | 파일 |
|----------|------|
| Entity | CourseTime.java |
| Enum | CourseTimeStatus, DeliveryType, EnrollmentMethod |
| Repository | CourseTimeRepository.java (비관적 락 포함) |
| Exception | 5개 커스텀 예외 |
| DTO | Request 2개, Response 2개 |
| Test | CourseTimeRepositoryTest (25개) |

#### Phase 2: 차수 CRUD API

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/ts/course-times` | 차수 생성 | OPERATOR, TENANT_ADMIN |
| GET | `/api/ts/course-times` | 차수 목록 조회 | 인증된 사용자 |
| GET | `/api/ts/course-times/{id}` | 차수 상세 조회 | 인증된 사용자 |
| PATCH | `/api/ts/course-times/{id}` | 차수 수정 | OPERATOR, TENANT_ADMIN |
| DELETE | `/api/ts/course-times/{id}` | 차수 삭제 | OPERATOR, TENANT_ADMIN |
| POST | `/api/ts/course-times/{id}/open` | 모집 시작 | OPERATOR, TENANT_ADMIN |
| POST | `/api/ts/course-times/{id}/start` | 수업 시작 | OPERATOR, TENANT_ADMIN |
| POST | `/api/ts/course-times/{id}/close` | 수업 종료 | OPERATOR, TENANT_ADMIN |
| POST | `/api/ts/course-times/{id}/archive` | 보관 처리 | OPERATOR, TENANT_ADMIN |

**상태 전이**: DRAFT → RECRUITING → ONGOING → CLOSED → ARCHIVED

---

### CMS (Content Management) 모듈

#### Phase 1: 파일 업로드 및 콘텐츠 관리

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/contents/upload` | 파일 업로드 + Content 생성 |
| POST | `/api/contents/external-link` | 외부 링크 등록 |
| GET | `/api/contents` | 목록 조회 (필터/페이징) |
| GET | `/api/contents/{id}` | 상세 조회 |
| GET | `/api/contents/{id}/stream` | 스트리밍 |
| GET | `/api/contents/{id}/download` | 다운로드 |
| GET | `/api/contents/{id}/preview` | 미리보기 |
| PATCH | `/api/contents/{id}` | 메타데이터 수정 |
| PUT | `/api/contents/{id}/file` | 파일 교체 |
| DELETE | `/api/contents/{id}` | 삭제 |

**지원 파일 형식**:
- VIDEO: mp4, avi, mov, mkv, webm (최대 2GB)
- AUDIO: mp3, wav, m4a, flac (최대 500MB)
- DOCUMENT: pdf, doc, docx, ppt, pptx, xls, xlsx (최대 100MB)
- IMAGE: jpg, jpeg, png, gif, svg, webp (최대 50MB)
- EXTERNAL_LINK: YouTube, Vimeo, Google Form URL

---

### LO (Learning Object) 모듈

#### Phase 1: 학습객체 및 콘텐츠 폴더 관리

**LearningObject API (7개)**

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/learning-objects` | LO 수동 생성 |
| GET | `/api/learning-objects` | 목록 조회 (폴더/키워드 필터) |
| GET | `/api/learning-objects/{id}` | 상세 조회 |
| GET | `/api/learning-objects/content/{contentId}` | Content ID로 LO 조회 |
| PATCH | `/api/learning-objects/{id}` | 메타데이터 수정 |
| PATCH | `/api/learning-objects/{id}/folder` | 폴더 이동 |
| DELETE | `/api/learning-objects/{id}` | 삭제 |

**ContentFolder API (7개)**

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/content-folders` | 폴더 생성 |
| GET | `/api/content-folders/tree` | 전체 트리 조회 |
| GET | `/api/content-folders/{id}` | 폴더 상세 조회 |
| GET | `/api/content-folders/{id}/children` | 하위 폴더 목록 |
| PUT | `/api/content-folders/{id}` | 폴더명 수정 |
| PUT | `/api/content-folders/{id}/move` | 폴더 이동 |
| DELETE | `/api/content-folders/{id}` | 폴더 삭제 |

**특징**:
- 최대 3단계 계층 (depth 0~2)
- Content 생성 시 LearningObject 자동 생성 (이벤트 기반)

---

### CM (Course Matrix) 모듈

#### Phase 1: 기반 구조

| 구성요소 | 파일 |
|----------|------|
| Entity | Course.java, CourseItem.java, CourseRelation.java |
| Enum | CourseLevel, CourseType |
| Repository | CourseRepository, CourseItemRepository, CourseRelationRepository |
| Exception | 5개 커스텀 예외 |
| DTO | Request 6개, Response 5개 |

**CourseItem 계층**: 최대 10단계 (depth 0~9), Self-reference 구조

**CourseRelation**: Linked List 패턴으로 학습 순서 관리

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Spring Boot 3.4.x |
| Language | Java 21 |
| Database | MySQL 8.0 |
| ORM | Spring Data JPA + Hibernate |
| Security | Spring Security + JWT |
| Build | Gradle |
| Test | JUnit 5 + MockMvc |

---

## 프로젝트 구조

```
src/main/java/com/mzc/lp/
├── common/
│   ├── config/          # SecurityConfig, JwtConfig, WebConfig
│   ├── constant/        # ErrorCode
│   ├── dto/             # ApiResponse
│   ├── entity/          # BaseTimeEntity, TenantEntity
│   ├── exception/       # GlobalExceptionHandler
│   ├── security/        # JwtTokenProvider, JwtAuthenticationFilter
│   └── service/         # FileStorageService
├── domain/
│   ├── user/            # UM 모듈
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   └── exception/
│   ├── ts/              # TS 모듈
│   │   ├── constant/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   └── exception/
│   ├── content/         # CMS 모듈
│   │   ├── constant/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── event/
│   │   └── exception/
│   ├── learning/        # LO 모듈
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── listener/
│   │   └── exception/
│   └── course/          # CM 모듈
│       ├── constant/
│       ├── repository/
│       ├── entity/
│       ├── dto/
│       └── exception/
└── MzcLpApplication.java
```

---

## 테스트 현황

| 모듈 | 테스트 수 |
|------|----------|
| Auth API | 20+ |
| User API (/me) | 11 |
| User 관리 API | 14 |
| CourseRole API | 15 |
| 프로필 이미지 | 6 |
| TS CourseTime Repository | 25 |
| TS CourseTime Controller | 14+ |
| CMS Content | 17 |
| LO LearningObject | 13 |
| LO ContentFolder | 12 |
| **합계** | **147+** |

---

## 컨벤션 준수

- [x] Controller: `@RestController`, `@RequiredArgsConstructor`, `@Validated`
- [x] Service: `@Transactional(readOnly=true)`, 쓰기는 `@Transactional`
- [x] Repository: JpaRepository + Custom Repository 패턴
- [x] Entity: `@NoArgsConstructor(protected)`, `@Getter`, Setter 금지
- [x] DTO: Java Record, `from()` 정적 팩토리 메서드
- [x] Exception: `BusinessException` 상속, `ErrorCode` 사용
- [x] Security: `@PreAuthorize` 메서드 레벨 권한 검증
- [x] Multi-tenancy: `TenantEntity` 상속, 자동 tenant_id 필터링

---

## 다음 작업

- [ ] CM 모듈 Service/Controller 구현 (Course CRUD API)
- [ ] TS Phase 3: 스케줄러 기반 자동 상태 전이
- [ ] CMS/LO 모듈 PR 머지

---

*최종 업데이트: 2025-12-12*

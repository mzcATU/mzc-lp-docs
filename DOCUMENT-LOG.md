# mzc-lp 문서 작업 로그

> test-lms-v2-integration 프로젝트 문서를 mzc-lp 공통 레포에 통합한 작업 기록

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | 김희수 |
| **검토자** |  |
| **작업 기간** | 2025-12-08 |
| **담당 모듈** | CM, CR, LO, CMS |

---

## 모듈 설명

| 모듈 | 전체 이름 | 역할 |
|------|----------|------|
| **CM** | Course Matrix | 강의 메타데이터, 커리큘럼 구성 |
| **CR** | Course Relation | 차시 간 학습 순서 연결 |
| **LO** | Learning Object | 학습 객체 메타데이터 관리 |
| **CMS** | Content Management System | 컨텐츠 파일 업로드/저장/인코딩 |

---

## 1. 신규 생성 문서 (9개)

### Backend 구조 문서

| 파일 경로 | 모듈 | 내용 요약 | 작성자 |
|----------|------|----------|--------|
| `docs/structure/backend/course/api.md` | CM + CR | 강의/차시 CRUD API, 학습순서 API, 에러 코드 | 김희수 |
| `docs/structure/backend/course/db.md` | CM + CR | course, course_item, course_relation 테이블 스키마, Recursive CTE 쿼리 | 김희수 |
| `docs/structure/backend/content/api.md` | CMS | 파일 업로드, 외부링크 등록, 스트리밍/다운로드 API | 김희수 |
| `docs/structure/backend/content/db.md` | CMS | content 테이블 스키마, ContentType ENUM, 파일 저장 경로 규칙 | 김희수 |
| `docs/structure/backend/learning/api.md` | LO | 학습객체 CRUD, 폴더 관리, 이벤트 기반 자동 생성 | 김희수 |
| `docs/structure/backend/learning/db.md` | LO | learning_object, content_folder 테이블 스키마, 3단계 계층 구조 | 김희수 |
| `docs/structure/backend/common/overview.md` | 공통 | BaseTimeEntity, ApiResponse, ErrorCode, GlobalExceptionHandler | 김희수 |

### Frontend 구조 문서

| 파일 경로 | 내용 요약 | 작성자 |
|----------|----------|--------|
| `docs/structure/frontend/api.md` | courseApi, contentApi, learningApi + React Query Hooks | 김희수 |
| `docs/structure/frontend/pages.md` | CourseListPage, CourseDetailPage, ContentPoolPage, LearningObjectsPage | 김희수 |

---

## 2. 수정 문서 (2개)

### docs/context/module-structure.md

| 섹션 | 추가 내용 | 수정자 |
|------|----------|--------|
| 7. CM (Course Matrix) | `구현 상세 (test-lms-v2-integration)` 서브섹션 추가: Course Entity, CourseItem Entity (차시/폴더 계층), API 엔드포인트 테이블 | 김희수 |
| 8. CR (Course Relation) | `구현 상세` 서브섹션 추가: CourseRelation Entity (Linked List), 학습 순서 연결 예시, API 엔드포인트 | 김희수 |
| 9. LO (Learning Object) | `구현 상세` 서브섹션 추가: LearningObject Entity, ContentFolder Entity (3단계 계층), 이벤트 기반 자동 생성 흐름 | 김희수 |
| 10. CMS | `구현 상세` 서브섹션 추가: Content Entity, ContentType ENUM, 외부 링크 지원, 메타데이터 자동 추출 | 김희수 |

### docs/context/architecture.md

| 섹션 | 추가 내용 | 수정자 |
|------|----------|--------|
| 8. 강의/컨텐츠 모듈 연동 (신규) | CM/CR/LO/CMS 모듈 개요, Content→LO→Course 데이터 흐름 다이어그램, Entity 관계도, 주요 기능 요약 | 김희수 |
| 9. 관련 문서 (기존 8번에서 이동) | module-structure.md 링크 추가 | 김희수 |

---

## 3. 생성된 폴더 구조

```
docs/structure/                    (신규 폴더)
├── backend/
│   ├── course/
│   │   ├── api.md                 ✅ 생성
│   │   └── db.md                  ✅ 생성
│   ├── content/
│   │   ├── api.md                 ✅ 생성
│   │   └── db.md                  ✅ 생성
│   ├── learning/
│   │   ├── api.md                 ✅ 생성
│   │   └── db.md                  ✅ 생성
│   └── common/
│       └── overview.md            ✅ 생성
└── frontend/
    ├── api.md                     ✅ 생성
    └── pages.md                   ✅ 생성
```

---

## 4. 작업 요약

| 구분 | 개수 | 상태 |
|------|------|------|
| 신규 생성 문서 | 9개 | ✅ 완료 |
| 수정 문서 | 2개 | ✅ 완료 |
| 신규 폴더 | 1개 (`docs/structure/`) | ✅ 완료 |
| **총 작업** | **11개** | **✅ 완료** |

---

## 5. 수정하지 않은 문서

다른 팀 담당 문서로 수정하지 않음:

- `docs/context/user-roles.md`
- `docs/context/multi-tenancy.md`
- `docs/conventions/*`
- `docs/templates/*`

---

## 6. 참고 사항

### 모듈-도메인 매핑

| mzc-lp 모듈 | test-lms-v2 도메인 폴더 | 포함 기능 |
|-------------|------------------------|----------|
| CM + CR | `course/` | 강의 CRUD, 차시/폴더 계층, 학습 순서 |
| CMS | `content/` | 파일 업로드, 메타데이터 추출, 스트리밍 |
| LO | `learning/` | 학습객체 CRUD, 콘텐츠 폴더 관리 |

### 소스 참조 경로

```
test-lms-v2-integration/
├── backend/src/main/java/com/lms/platform/
│   ├── domain/
│   │   ├── course/      # CM + CR
│   │   ├── content/     # CMS
│   │   └── learning/    # LO
│   └── common/          # 공통 컴포넌트
└── frontend/src/
    ├── pages/           # 페이지 컴포넌트
    ├── api/             # API 클라이언트
    └── components/      # 공통 컴포넌트
```

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-08 | 김희수 | 초기 문서 작업 완료 (9개 생성, 2개 수정) |
| 2025-12-10 | 신동구 | UM 기본 구조 구현 (회원가입 API) |
| 2025-12-10 | 신동구 | 로그인/로그아웃 API + JWT 인증 구현 |
| 2025-12-10 | 신동구 | BaseTimeEntity 시간 타입 `LocalDateTime` → `Instant` 변경 |
| 2025-12-10 | 신동구 | `docs/structure/backend/common/overview.md` 업데이트 |

---

*최종 업데이트: 2025-12-10*

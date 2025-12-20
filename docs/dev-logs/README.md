# 개발 로그 (Development Logs)

프로젝트의 모든 개발 작업 내역을 모듈별로 정리한 문서입니다.

---

## 📁 디렉토리 구조

```
dev-logs/
├── README.md                # 이 파일
├── backend-summary.md       # 백엔드 전체 요약
├── backend/                 # 백엔드 모듈별 개발 로그
│   ├── um/                  # User Master (사용자 관리)
│   ├── ts/                  # Time Schedule (강의 시간표)
│   ├── tenant/              # Multi-Tenancy (멀티 테넌트)
│   ├── sis/                 # Student Information System
│   ├── cm/                  # Course Management (코스 관리)
│   ├── cms/                 # Content Management System
│   └── lo/                  # Learning Object (학습 객체)
└── frontend/                # 프론트엔드 역할별 개발 로그
    ├── README.md            # 프론트엔드 인덱스
    ├── common/              # 공통 (디자인 시스템, 레이아웃, 인증)
    ├── sa/                  # System Admin 페이지
    ├── ta/                  # Tenant Admin 페이지
    ├── to/                  # Tenant Operator 페이지
    └── tu/                  # Tenant User 페이지
```

---

## 🎯 모듈별 개발 현황

### Backend

#### UM (User Master) - 사용자 관리
- **Phase 1**: 회원가입, 로그인, JWT 인증 구현
- **Phase 2**: 내 정보 조회/수정, 비밀번호 변경 구현
- **Phase 3**: Multi-Tenancy 적용 (UserCourseRole)
- **Phase 4**: 회원 탈퇴 시 RefreshToken 삭제 로직 추가
- **Phase 5**: 프로필 이미지 업로드 API 구현

#### TS (Time Schedule) - 강의 시간표
- **Phase 1**: CourseTime Entity 및 CRUD API 구현
- **Phase 2**: CourseTime 상세 조회, 필터링 API
- **Phase 3**: CourseTime 상태 관리 (ACTIVE/INACTIVE)
- **Phase 4**: 차수별 정원 관리 및 검증
- **Phase 5**: CourseTime 일괄 생성 API
- **Phase 6**: 차수 기간 중복 검증
- **Phase 7**: CourseTime @Version 낙관적 락 추가

#### CM (Course Management) - 코스 관리
- **Phase 1**: Course Entity 및 기본 CRUD API
- **Phase 2**: Course-CourseTime 연관관계 설정
- **Phase 3**: Course 상태 관리 (DRAFT → PENDING → APPROVED)
- **Phase 4**: Course 카테고리 연동
- **Phase 5**: Course 검색 및 필터링
- **Phase 6**: Course 권한 검증 (CourseRole)
- **Phase 7**: Course @Version 낙관적 락 추가

#### CMS (Content Management System) - 콘텐츠 관리
- **Phase 1**: Content Entity 및 기본 CRUD
- **Phase 2**: Content 파일 업로드 연동
- **Phase 3**: Content 순서 관리
- **Phase 4**: Content @Version 낙관적 락 추가

#### LO (Learning Object) - 학습 객체
- **Phase 1**: LO Entity 및 타입별 구현

#### Tenant (Multi-Tenancy)
- **Phase 1**: 인프라 구조 설계
- **Phase 2**: Tenant Entity 구현
- **Phase 3**: Tenant CRUD API 구현

#### SIS (Student Information System) - 수강 관리
- **Phase 1**: Enrollment Entity 및 기본 수강 신청
- **Phase 2**: 수강 취소, 상태 관리 구현
- **Phase 3**: Race Condition 방지 (비관적 락), @Version 추가

#### IIS (Instructor Information System) - 강사 배정
- **Phase 1**: InstructorAssignment Entity 및 기본 구조
- **Phase 2**: 강사 배정 CRUD API 구현
- **Phase 3**: 배정 해제 및 이력 관리
- **Phase 4**: InstructorRole (MAIN/SUB/ASSISTANT) 구현
- **Phase 5**: 주강사 중복 배정 방지 로직
- **Phase 6**: Race Condition 방지 (비관적 락), @Version 추가

### Frontend

#### Common (공통)
- **Phase 1**: 디자인 시스템, 레이아웃, 인증

#### SA (System Admin)
- **Phase 1**: 테넌트 관리, 시스템 설정 페이지

#### TA (Tenant Admin)
- **Phase 1**: 사용자 관리, 코스 관리 페이지

#### TO (Tenant Operator)
- **Phase 1**: 콘텐츠 관리, 학습 관리 페이지

#### TU (Tenant User)
- **Phase 1**: 내 학습, 강의 관리 페이지

---

## 📝 문서 작성 규칙

### 파일명 규칙
- 형식: `phase{숫자}.md`
- 예시: `phase1.md`, `phase2.md`

### 문서 구조
각 개발 로그는 다음 섹션을 포함합니다:

1. **작업 정보**
   - 작업 일자
   - 관련 이슈/PR
   - 담당 모듈
   - 브랜치

2. **구현 개요**
   - API 엔드포인트 목록
   - 주요 기능 요약

3. **비즈니스 로직**
   - 플로우 다이어그램
   - 보안 고려사항

4. **추가/수정 파일**
   - 신규 파일 목록 및 설명
   - 수정 파일 목록 및 변경 내용

5. **API 스펙**
   - Request/Response 형식
   - 에러 케이스

6. **테스트 결과**
   - 단위 테스트 결과
   - 통합 테스트 결과

7. **Git 커밋 히스토리**
   - 커밋 메시지
   - 브랜치 정보

---

## 🔍 검색 가이드

### 특정 기능 찾기
- **회원가입/로그인**: `backend/um/phase1.md`
- **프로필 관리**: `backend/um/phase2.md`
- **멀티테넌시**: `backend/um/phase3.md`
- **회원 탈퇴**: `backend/um/phase4.md`
- **프로필 이미지**: `backend/um/phase5.md`
- **강의 시간표**: `backend/ts/`
- **코스 관리**: `backend/cm/`
- **콘텐츠 관리**: `backend/cms/`
- **학습 객체**: `backend/lo/phase1.md`
- **테넌트 관리**: `backend/tenant/`
- **수강 관리**: `backend/sis/`
- **강사 배정**: `backend/iis/`

### 전체 개요 보기
- **백엔드 요약**: `backend-summary.md`
- **프론트엔드 인덱스**: `frontend/README.md`

---

## 📊 진행 상황

| 모듈 | Phase | 상태 | 완료일 |
|-----|-------|------|--------|
| UM | Phase 1-5 | ✅ 완료 | 2025-12-12 |
| TS | Phase 1-7 | ✅ 완료 | 2025-12-19 |
| CM | Phase 1-7 | ✅ 완료 | 2025-12-18 |
| CMS | Phase 1-4 | ✅ 완료 | 2025-12-19 |
| LO | Phase 1 | ✅ 완료 | 2025-12-17 |
| Tenant | Phase 1-3 | ✅ 완료 | 2025-12-16 |
| SIS | Phase 1-3 | ✅ 완료 | 2025-12-19 |
| IIS | Phase 1-6 | ✅ 완료 | 2025-12-19 |

### Frontend

| 역할 | Phase | 상태 | 완료일 |
|-----|-------|------|--------|
| Common | Phase 1 | 📋 계획 중 | - |
| SA | Phase 1 | 📋 계획 중 | - |
| TA | Phase 1 | 📋 계획 중 | - |
| TO | Phase 1 | 📋 계획 중 | - |
| TU | Phase 1 | 📋 계획 중 | - |

---

## 📌 참고사항

- 각 Phase는 독립적인 기능 단위로 구성됩니다
- 모든 개발 로그는 실제 구현과 테스트가 완료된 후 작성됩니다
- Git 커밋 히스토리와 연동되어 추적이 가능합니다

---

**작성자**: Development Team
**최종 수정**: 2025-12-20

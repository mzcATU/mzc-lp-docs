# 문서 인벤토리 (Documentation Inventory)

> 작성일: 2026-01-22
> MZC Learning Platform 문서 현황 및 구조

---

## 📋 문서 개요

### 전체 통계
- **총 문서 수**: 31개
- **문서 분류**: 7개 카테고리
- **최종 업데이트**: 2026-01-23

---

## 📚 문서 구조

```
mzc-lp-docs/
├── README.md                           [메인 프로젝트 문서]
├── DOCUMENTATION_INVENTORY.md          [이 문서]
│
├── .github/                            [GitHub 설정]
│   ├── BRANCH_RULES.md                 ✅ 브랜치 보호 규칙
│   └── PULL_REQUEST_TEMPLATE.md        ✅ PR 템플릿
│
├── docs/                               [핵심 기술 문서]
│   ├── setup-guide.md                  ✅ 개발 환경 설정 가이드
│   ├── architecture.md                 ✅ 시스템 아키텍처
│   ├── module-structure.md             ✅ 모듈 구조 상세
│   ├── api-specification.md            ✅ API 명세서 (신규)
│   ├── database-schema.md              ✅ 데이터베이스 스키마 (신규)
│   ├── deployment-guide.md             ✅ 배포 가이드 (신규)
│   ├── troubleshooting.md              ✅ 트러블슈팅 가이드 (신규)
│   ├── testing-guide.md                ✅ 테스트 가이드 (신규)
│   ├── development-workflow.md         ✅ 개발 워크플로우 (신규)
│   ├── configuration-guide.md          ✅ 환경 설정 가이드 (신규)
│   ├── implementation-status.md        ✅ 구현 현황 (신규)
│   ├── page-routing.md                 ✅ 페이지 URL 라우팅 (신규)
│   └── context/                        [상세 컨텍스트]
│       ├── business-logic.md           ✅ 비즈니스 로직
│       └── cicd.md                     ✅ CI/CD 파이프라인
│
├── user-flows/                         [역할별 사용자 플로우]
│   ├── README.md                       ✅ 사용자 플로우 인덱스
│   ├── learner-flow.md                 ✅ 학습자 플로우 (USER)
│   ├── designer-flow.md                ✅ 강의 설계자 플로우 (DESIGNER)
│   ├── instructor-flow.md              ✅ 강사 플로우 (INSTRUCTOR) (신규)
│   ├── operator-flow.md                ✅ 운영자 플로우 (OPERATOR) (신규)
│   └── admin-flow.md                   ✅ 관리자 플로우 (TENANT_ADMIN) (신규)
│
├── use-cases/                          [유스케이스]
│   ├── README.md                       ✅ 유스케이스 인덱스
│   └── UC-202-enrollment.md            ✅ 수강 신청 유스케이스
│
└── storyboards/                        [화면 플로우 & 와이어프레임]
    ├── README.md                       ✅ 스토리보드 인덱스
    ├── SB-002-course-enrollment.md     ✅ 강의 탐색/수강 신청
    ├── SB-003-learning-flow.md         ✅ 학습 진행
    ├── SB-101-course-creation.md       ✅ 강의 생성/편집
    └── SB-302-ui-components.md         ✅ UI 컴포넌트 가이드
```

---

## 📖 카테고리별 문서 상세

### 1. GitHub 설정 문서 (2개)

| 문서 | 경로 | 상태 | 설명 |
|------|------|------|------|
| 브랜치 규칙 | `.github/BRANCH_RULES.md` | ✅ | main/dev 보호 규칙 |
| PR 템플릿 | `.github/PULL_REQUEST_TEMPLATE.md` | ✅ | PR 작성 가이드 |

---

### 2. 핵심 기술 문서 (14개)

| 문서 | 경로 | 상태 | 설명 |
|------|------|------|------|
| 메인 README | `README.md` | ✅ | 프로젝트 개요 |
| 개발환경 설정 | `docs/setup-guide.md` | ✅ | 로컬 개발 환경 설정 |
| 아키텍처 | `docs/architecture.md` | ✅ | 멀티테넌트, 인증, 역할 시스템 |
| 모듈 구조 | `docs/module-structure.md` | ✅ | 백엔드/프론트엔드 모듈 |
| **API 명세서** | `docs/api-specification.md` | ✅ | REST API 전체 명세 |
| **DB 스키마** | `docs/database-schema.md` | ✅ | 29개 테이블 DDL |
| **배포 가이드** | `docs/deployment-guide.md` | ✅ | 배포 절차 및 롤백 |
| **트러블슈팅** | `docs/troubleshooting.md` | ✅ | 문제 해결 가이드 |
| **테스트 가이드** | `docs/testing-guide.md` | ✅ | Unit/Integration/E2E |
| **개발 워크플로우** | `docs/development-workflow.md` | ✅ | Git 브랜치/PR/코드리뷰 |
| **환경 설정** | `docs/configuration-guide.md` | ✅ | 환경별 설정 관리 |
| **구현 현황** | `docs/implementation-status.md` | ✅ | 기능별 완료율 |
| **페이지 라우팅** | `docs/page-routing.md` | ✅ | 프론트엔드 URL 라우팅 |
| 비즈니스 로직 | `docs/context/business-logic.md` | ✅ | 도메인별 핵심 로직 |
| CI/CD | `docs/context/cicd.md` | ✅ | GitHub Actions 파이프라인 |

**핵심 내용:**
- 멀티테넌트 아키텍처 (Row-Level Security)
- 6-tier 역할 시스템 (SYSTEM_ADMIN ~ USER)
- JWT 인증 (Access Token 1h + Refresh Token 7d)
- 29개 도메인 모듈

---

### 3. 사용자 플로우 문서 (6개)

| 문서 | 경로 | 역할 | 상태 |
|------|------|------|------|
| 플로우 인덱스 | `user-flows/README.md` | - | ✅ |
| 학습자 플로우 | `user-flows/learner-flow.md` | USER | ✅ |
| 강의 설계자 플로우 | `user-flows/designer-flow.md` | DESIGNER | ✅ |
| **강사 플로우** | `user-flows/instructor-flow.md` | INSTRUCTOR | ✅ |
| **운영자 플로우** | `user-flows/operator-flow.md` | OPERATOR | ✅ |
| **관리자 플로우** | `user-flows/admin-flow.md` | TENANT_ADMIN | ✅ |

**커버 역할 (5/6):**
- ✅ USER (학습자)
- ✅ DESIGNER (강의 설계자)
- ✅ INSTRUCTOR (강사)
- ✅ OPERATOR (운영자)
- ✅ TENANT_ADMIN (관리자)
- ⏳ SYSTEM_ADMIN (시스템 관리자) - 향후 작성

---

### 4. 유스케이스 문서 (2개)

| 문서 | 경로 | 상태 | 설명 |
|------|------|------|------|
| 유스케이스 인덱스 | `use-cases/README.md` | ✅ | 유스케이스 목록 |
| 수강 신청 | `use-cases/UC-202-enrollment.md` | ✅ | 완전한 UC 명세 |

---

### 5. 스토리보드 문서 (5개)

| 문서 | 경로 | 상태 | 설명 |
|------|------|------|------|
| 스토리보드 인덱스 | `storyboards/README.md` | ✅ | 화면 설계 목록 |
| 강의 탐색/수강 신청 | `storyboards/SB-002-course-enrollment.md` | ✅ | 카탈로그 → 결제 |
| 학습 진행 | `storyboards/SB-003-learning-flow.md` | ✅ | 학습 화면 |
| 강의 생성/편집 | `storyboards/SB-101-course-creation.md` | ✅ | 강의 편집기 |
| UI 컴포넌트 가이드 | `storyboards/SB-302-ui-components.md` | ✅ | 디자인 시스템 |

---

## 🎯 문서 상태 요약

### ✅ 현행 유효 (30개)
모든 문서가 현재 프로젝트 상태를 반영하고 있습니다.

### ⚠️ 업데이트 필요 (0개)
없음

### ❌ 삭제 필요 (0개)
없음

---

## 📝 향후 작성 예정 문서

### 사용자 플로우
- [ ] system-admin-flow.md (시스템 관리자 플로우)

### 유스케이스 (우선순위 높음)
- [ ] UC-001: 사용자 등록 및 로그인
- [ ] UC-101: 강의 생성 및 편집
- [ ] UC-201: 강의 탐색 및 검색
- [ ] UC-203: 학습 진행

### 스토리보드
- [ ] SB-001: 로그인 및 대시보드
- [ ] SB-004: 과제 제출
- [ ] SB-201: 관리자 대시보드

---

## 🔍 문서 찾기 가이드

### 프로젝트 처음 시작하는 경우
1. [README.md](./README.md) - 프로젝트 개요
2. [docs/setup-guide.md](./docs/setup-guide.md) - 개발 환경 설정
3. [docs/architecture.md](./docs/architecture.md) - 시스템 이해

### 기능 개발하는 경우
1. [docs/module-structure.md](./docs/module-structure.md) - 모듈 찾기
2. [docs/api-specification.md](./docs/api-specification.md) - API 명세
3. [docs/database-schema.md](./docs/database-schema.md) - DB 스키마
4. [docs/context/business-logic.md](./docs/context/business-logic.md) - 비즈니스 로직

### 배포/운영하는 경우
1. [docs/deployment-guide.md](./docs/deployment-guide.md) - 배포 절차
2. [docs/configuration-guide.md](./docs/configuration-guide.md) - 환경 설정
3. [docs/troubleshooting.md](./docs/troubleshooting.md) - 문제 해결

### 테스트하는 경우
1. [docs/testing-guide.md](./docs/testing-guide.md) - 테스트 가이드

### 협업 규칙 확인하는 경우
1. [docs/development-workflow.md](./docs/development-workflow.md) - 개발 워크플로우
2. [.github/BRANCH_RULES.md](./.github/BRANCH_RULES.md) - 브랜치 규칙
3. [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) - PR 작성

### 현재 구현 상태 확인
1. [docs/implementation-status.md](./docs/implementation-status.md) - 구현 현황

---

## 📊 문서 품질 지표

| 카테고리 | 문서 수 | 완성도 |
|---------|---------|--------|
| GitHub 설정 | 2 | ✅ 100% |
| 핵심 기술 | 13 | ✅ 100% |
| 사용자 플로우 | 6 | ✅ 83% (5/6 역할) |
| 유스케이스 | 2 | ⚠️ 5% (1/20) |
| 스토리보드 | 5 | ⚠️ 31% (4/13) |

**전체 완성도**: ✅ 핵심 문서 100% 완료

---

## 📌 유지보수 가이드

### 문서 업데이트 시점
1. **즉시 업데이트**: 아키텍처 변경, API 변경, 중요 비즈니스 로직 변경
2. **정기 업데이트**: 모듈 추가/제거, 역할 변경, 화면 추가

### 문서 작성 규칙
- 모든 문서 상단에 메타데이터 포함: `> 작성일: YYYY-MM-DD`
- 한글 기반, 코드/API는 영문
- 이모지: ✅ 완료, ⚠️ 진행중, ❌ 미완료
- 다이어그램: ASCII 아트 또는 Mermaid

### 문서 컨벤션
- 제목: `# 제목 (영문)`
- 섹션: `## 📋 섹션명`
- 링크: 상대 경로 사용 `./path/file.md`
- 푸터: `**최종 업데이트**: YYYY-MM-DD`

---

## 📅 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-22 | 최초 인벤토리 작성 |
| 2026-01-22 | 핵심 기술 문서 추가 (setup, architecture, module) |
| 2026-01-22 | 사용자 플로우 3개 추가 (instructor, operator, admin) |
| 2026-01-22 | 핸드오프 문서 8개 추가 (API, DB, 배포, 트러블슈팅 등) |
| 2026-01-23 | 문서 일관성 검토 및 메타데이터 통일 |

---

**최종 업데이트**: 2026-01-23
**문서 버전**: 2.0.0

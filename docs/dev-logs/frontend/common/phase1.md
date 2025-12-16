# Frontend Common 개발 로그 - Phase 1

> 디자인 시스템, 레이아웃, 인증 공통 모듈 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | - |
| **작업 일자** | YYYY-MM-DD |
| **관련 이슈** | - |
| **담당 모듈** | Common |

---

## 1. 구현 개요

### 디자인 시스템

| 파일 | 경로 | 설명 |
|------|------|------|
| design-tokens.ts | `src/styles/` | 색상, 타이포그래피 토큰 |
| index.css | `src/` | CSS 변수 |
| cn.ts | `src/utils/` | clsx + tailwind-merge |

### 공통 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|----------|------|------|
| Button | `components/common/Button/` | CVA 기반 버튼 |
| Input | `components/common/Input/` | 입력 필드 |
| Badge | `components/common/Badge/` | 상태 뱃지 |

### 레이아웃

| 컴포넌트 | 라우트 | 설명 |
|----------|--------|------|
| SuperAdminLayout | `/sa/*` | 슈퍼 관리자 |
| TenantAdminLayout | `/ta/*` | 테넌트 관리자 |
| TenantOperatorLayout | `/to/*` | 테넌트 운영자 |
| TenantUserLayout | `/tu/*` | 테넌트 사용자 |

### 인증

| 파일 | 경로 | 설명 |
|------|------|------|
| authStore.ts | `src/store/` | 인증 상태 (Zustand) |
| authService.ts | `src/services/` | 인증 API |

---

## 2. 체크리스트

### 디자인 시스템
- [ ] CSS 변수 정의
- [ ] TypeScript 토큰 정의
- [ ] Tailwind config 연동

### 공통 컴포넌트
- [ ] Button (neutral, brand, ghost, danger)
- [ ] Input (default, error)
- [ ] Badge (success, warning, error)

### 레이아웃
- [ ] 4종 레이아웃 구현
- [ ] 사이드바 다크/라이트 모드
- [ ] 반응형 처리

### 인증
- [ ] 로그인 페이지
- [ ] 회원가입 페이지
- [ ] 인증 상태 관리

---

## 3. Git 커밋 히스토리

```
# 작업 완료 후 작성
```

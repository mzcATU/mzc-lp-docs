# Design Conventions

> Frontend 디자인 시스템 및 스타일링 컨벤션

---

## 문서 목록

### Design System

| # | 문서 | 설명 |
|---|------|------|
| 00 | [DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) | 디자인 구현 컨벤션 (CVA, Radix UI, 레이아웃, 반응형) |
| 01 | [DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md) | Admin 공통 디자인 토큰 (SA, TA, TO, TU) |
| 02 | [DESIGN-TOKENS-TENANT-TEMPLATE](./02-DESIGN-TOKENS-TENANT-TEMPLATE.md) | 테넌시별 커스텀 디자인 토큰 템플릿 |

### UX Guide

| # | 문서 | 설명 |
|---|------|------|
| 03 | [UX-PATTERNS](./03-UX-PATTERNS.md) | UX 패턴 가이드 (상태 피드백, 사용자 플로우) |
| 04 | [UX-PAGES](./04-UX-PAGES.md) | 페이지별 UX 가이드 (와이어프레임, 플로우) |
| 05 | [UX-COMPONENTS](./05-UX-COMPONENTS.md) | 컴포넌트별 UX 가이드 (상태, 인터랙션) |
| 06 | [UX-RESPONSIVE](./06-UX-RESPONSIVE.md) | 반응형 레이아웃 변환 규칙 |
| 07 | [UX-ANIMATIONS](./07-UX-ANIMATIONS.md) | 애니메이션/트랜지션 가이드 |
| 08 | [UX-ACCESSIBILITY](./08-UX-ACCESSIBILITY.md) | 접근성 가이드 (WCAG 2.1 AA) |
| 09 | [UX-ERROR-MESSAGES](./09-UX-ERROR-MESSAGES.md) | 에러 메시지 템플릿 |
| 10 | [UX-FORMS](./10-UX-FORMS.md) | 폼 패턴 가이드 (유효성, 단계별 폼) |

---

## 디자인 토큰 구조

### 토큰 분류

```
디자인 토큰
├── Common (Admin)              # 관리자 화면 공통
│   └── SA, TA, TO, TU에서 사용
│
└── Tenant Custom               # 테넌시별 커스텀
    └── 각 테넌트 학습자 화면(LMS)에서 사용
```

### 적용 범위

| 구분 | 문서 | 적용 대상 |
|------|------|----------|
| **Common** | 01-DESIGN-TOKENS-COMMON | SA, TA, TO, TU 관리자 화면 |
| **Tenant** | 02-DESIGN-TOKENS-TENANT-TEMPLATE | 테넌트별 학습자 화면 |

---

## 핵심 원칙

### Design System

```
✅ 디자인 토큰 사용 → 하드코딩 금지
✅ CSS 변수 + TypeScript 토큰 동기화
✅ CVA로 컴포넌트 Variant 관리
✅ Radix UI 기반 접근성 확보
✅ WCAG AA 대비율 준수 (4.5:1)
✅ 테넌시별 브랜딩 지원
```

### UX

```
✅ 모든 비동기 작업에 로딩 상태 표시
✅ 에러 발생 시 명확한 메시지와 복구 방법 제공
✅ 빈 상태에 안내 메시지와 다음 액션 제시
✅ 사용자 플로우는 3단계 이내로 단순화
```

---

## 기술 스택

| 항목 | 기술 | 용도 |
|------|------|------|
| 스타일링 | TailwindCSS | 유틸리티 CSS |
| Variant 관리 | CVA | 컴포넌트 스타일 타입 안전성 |
| UI 컴포넌트 | Radix UI | Headless 컴포넌트 |
| 아이콘 | Lucide React | 아이콘 라이브러리 |

---

## 파일 구조

```
src/styles/
├── design-tokens.ts           # Admin 공통 토큰
├── index.css                  # CSS 변수 (공통)
└── tenant/                    # 테넌시별 토큰
    ├── index.ts               # 테넌트 토큰 엔트리
    ├── types.ts               # 타입 정의
    ├── default.ts             # 기본 테넌트 토큰
    └── [tenant-id].ts         # 개별 테넌트 토큰
```

---

## 관련 문서

- [11-REACT-PROJECT-STRUCTURE](../11-REACT-PROJECT-STRUCTURE.md) - 프로젝트 구조
- [12-REACT-COMPONENT-CONVENTIONS](../12-REACT-COMPONENT-CONVENTIONS.md) - 컴포넌트 컨벤션
- [23-MULTI-TENANCY](../23-MULTI-TENANCY.md) - 멀티테넌시 아키텍처

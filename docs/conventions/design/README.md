# Design Conventions

> Frontend 디자인 시스템 및 스타일링 컨벤션

---

## 문서 목록

| 문서 | 설명 |
|------|------|
| [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) | 디자인 구현 컨벤션 (CVA, Radix UI, 레이아웃, 반응형) |
| [01-DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md) | Admin 공통 디자인 토큰 (SA, TA, TO, TU) |
| [02-DESIGN-TOKENS-TENANT-TEMPLATE](./02-DESIGN-TOKENS-TENANT-TEMPLATE.md) | 테넌시별 커스텀 디자인 토큰 템플릿 |

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

```
✅ 디자인 토큰 사용 → 하드코딩 금지
✅ CSS 변수 + TypeScript 토큰 동기화
✅ CVA로 컴포넌트 Variant 관리
✅ Radix UI 기반 접근성 확보
✅ WCAG AA 대비율 준수 (4.5:1)
✅ 테넌시별 브랜딩 지원
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

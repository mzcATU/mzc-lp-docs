# Design Conventions

> Frontend 디자인 시스템 및 스타일링 컨벤션

---

## 문서 목록

| 문서 | 설명 |
|------|------|
| [17-DESIGN-CONVENTIONS](./17-DESIGN-CONVENTIONS.md) | 디자인 구현 컨벤션 (CVA, Radix UI, 레이아웃, 반응형) |
| [18-DESIGN-TOKENS](./18-DESIGN-TOKENS.md) | 디자인 토큰 시스템 (CSS 변수, TypeScript 토큰, Tailwind) |

---

## 핵심 원칙

```
✅ 디자인 토큰 사용 → 하드코딩 금지
✅ CSS 변수 + TypeScript 토큰 동기화
✅ CVA로 컴포넌트 Variant 관리
✅ Radix UI 기반 접근성 확보
✅ WCAG AA 대비율 준수 (4.5:1)
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

## 관련 문서

- [11-REACT-PROJECT-STRUCTURE](../11-REACT-PROJECT-STRUCTURE.md) - 프로젝트 구조
- [12-REACT-COMPONENT-CONVENTIONS](../12-REACT-COMPONENT-CONVENTIONS.md) - 컴포넌트 컨벤션

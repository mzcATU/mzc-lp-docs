# TO (Tenant Operator) 화면 정의서

> MZRUN Admin Dashboard - 운영자 화면 정의
> 상세 화면별 정의 → [TO-screens-detail.md](./TO-screens-detail.md)

---

## 핵심 정보

| 항목 | 내용 |
|------|------|
| 시스템명 | MZRUN Admin Dashboard |
| 대상 | Tenant Operator (운영자) |
| 기술 스택 | React 18 + TypeScript + Radix UI + Tailwind CSS |
| 테마 | 다크/라이트 모드 전환 |
| 라우팅 | 탭 기반 (useState) |

---

## 디자인 토큰

### CSS 변수 (globals.css)

```css
:root {
  /* Brand Colors */
  --color-primary-green: #70f2a0;
  --color-primary-purple: #6778ff;
  --color-primary-cyan: #6bc2f0;

  /* Dark Mode */
  --color-bg-sidebar: #1a1a1a;
  --color-bg-main: #2a2a2a;
  --color-bg-card: #3a3a3a;
  --color-bg-hover: #4a4a4a;
  --color-text-primary: #ffffff;
  --color-text-secondary: #9ca3af;

  /* Light Mode */
  --color-bg-sidebar-light: #e5e5e5;
  --color-bg-main-light: #f7f7f7;
  --color-bg-card-light: #ffffff;

  /* Spacing & Radius */
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Tailwind Config

```typescript
export default {
  theme: {
    extend: {
      colors: {
        'brand-green': 'var(--color-primary-green)',
        'brand-purple': 'var(--color-primary-purple)',
        'brand-cyan': 'var(--color-primary-cyan)',
      },
    },
  },
}
```

---

## 레이아웃

```
┌────────────────────────────────────────────────────────────┐
│                      Header                                 │
│  [Logo: MZRUN]           [검색]    [알림] [사용자]          │
├──────────────┬─────────────────────────────────────────────┤
│   Sidebar    │              Main Content                   │
│  - 대시보드   │                                             │
│  - 강의 관리  │                                             │
│  - 사용자관리 │                                             │
│  - 설정      │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

---

## 화면 목록

| 화면 ID | 화면명 | 상태 |
|---------|--------|------|
| `dashboard` | 대시보드 | 완료 |
| `courses` | 강의 목록 | 완료 |
| `sessions` | 차수 관리 | 완료 |
| `users` | 사용자 관리 | 준비중 |
| `userSettings` | 사용자 설정 | 완료 |
| `settings` | 시스템 설정 | 준비중 |

---

## 컴포넌트 패턴 (CVA)

### Button

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors rounded-xl',
  {
    variants: {
      variant: {
        primary: 'bg-brand-purple text-white hover:opacity-90',
        secondary: 'bg-bg-card text-text-primary hover:bg-bg-hover',
        destructive: 'bg-red-500 text-white',
        ghost: 'hover:bg-bg-hover',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);
```

### Badge (상태 표시)

```typescript
const badgeVariants = cva('px-2 py-1 rounded-full text-xs font-medium', {
  variants: {
    status: {
      active: 'bg-brand-green/15 text-brand-green',      // 활성/진행중
      featured: 'bg-brand-purple/25 text-brand-purple',  // Best Seller/모집중
      inactive: 'bg-gray-500 text-white',                // 임시저장/종료
    },
  },
});
```

---

## 상태 스타일링

```typescript
// 버튼 호버/포커스/비활성
<button className="
  hover:bg-bg-hover
  focus:ring-2 focus:ring-brand-purple
  disabled:opacity-50 disabled:cursor-not-allowed
">

// 입력 필드
<input className={cn(
  'border rounded-lg px-3 py-2 bg-bg-card',
  error && 'border-red-500',
  !error && 'border-gray-600 focus:ring-brand-purple'
)} />
```

---

## 반응형

```typescript
// 모바일 우선 접근
<div className="px-4 md:px-6 lg:px-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// 사이드바 숨김/표시
<aside className="hidden md:flex w-64">
<button className="md:hidden">메뉴</button>
```

---

## 주요 아이콘 (Lucide React)

| 아이콘 | 용도 |
|--------|------|
| `LayoutDashboard` | 대시보드 메뉴 |
| `BookOpen` | 강의 관리 |
| `Users` | 사용자 관리 |
| `Settings` | 설정 |
| `Search` | 검색 |
| `Bell` | 알림 |
| `Plus` | 새 항목 등록 |
| `Edit`, `Trash` | 수정, 삭제 |
| `Sun`, `Moon` | 테마 전환 |

---

## 체크리스트

- [ ] 디자인 토큰 사용 (하드코딩 금지)
- [ ] CVA로 컴포넌트 variants 정의
- [ ] 반응형 적용 (모바일 우선)
- [ ] 상태 스타일 (hover, focus, disabled)
- [ ] 다크/라이트 모드 지원
- [ ] 아이콘 일관성 (Lucide React)

---

> 화면별 상세 정의 → [TO-screens-detail.md](./TO-screens-detail.md)
> 디자인 컨벤션 → [../conventions/17-DESIGN-CONVENTIONS.md](../conventions/17-DESIGN-CONVENTIONS.md)

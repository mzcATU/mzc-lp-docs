# TU (Tenant User) 화면 정의서

> MZRUN Student Platform - 수강생 화면 정의
> 상세 화면별 정의 → [TU-screens-detail.md](./TU-screens-detail.md)

---

## 핵심 정보

| 항목 | 내용 |
|------|------|
| 시스템명 | MZRUN Student Platform |
| 대상 | Tenant User (수강생) |
| 기술 스택 | React 19 + TypeScript + Tailwind CSS 4 |
| 테마 | 다크 모드 전용 (Glassmorphism) |
| 라우팅 | React Router DOM |

---

## 디자인 토큰

### CSS 변수 (index.css)

```css
:root {
  /* Brand Colors */
  --color-primary-blue: #6778ff;
  --color-primary-purple: #a855f7;
  --color-primary-cyan: #6bc2f0;
  --color-primary-green: #70f2a0;

  /* Dark Mode (기본) */
  --color-bg-page: #0a0a0a;
  --color-bg-card: rgba(255, 255, 255, 0.05);
  --color-bg-hover: rgba(255, 255, 255, 0.1);
  --color-border: rgba(255, 255, 255, 0.1);
  --color-text-primary: #ffffff;
  --color-text-secondary: #d1d5db;
  --color-text-muted: #9ca3af;

  /* Gradient */
  --gradient-primary: linear-gradient(to right, #6778ff, #a855f7);

  /* Spacing & Radius */
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
}
```

### Tailwind Config

```typescript
export default {
  theme: {
    extend: {
      colors: {
        'brand-blue': 'var(--color-primary-blue)',
        'brand-purple': 'var(--color-primary-purple)',
        'brand-cyan': 'var(--color-primary-cyan)',
        'brand-green': 'var(--color-primary-green)',
      },
    },
  },
}
```

---

## 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│ [프로모션 배너] - 닫기 가능                                        │
├─────────────────────────────────────────────────────────────────┤
│                         Header                                   │
│  [Logo]  [강의] [로드맵] [멘토링] [커뮤니티] [채용]  [🔍] [🛒] [🔔] [👤] │
├─────────────────────────────────────────────────────────────────┤
│                       Main Content                               │
├─────────────────────────────────────────────────────────────────┤
│                          Footer                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 화면 목록

| 라우트 | 화면명 | 인증 |
|--------|--------|------|
| `/` | 홈 (랜딩) | X |
| `/login` | 로그인 | X |
| `/signup` | 회원가입 | X |
| `/courses` | 강의 목록 | X |
| `/course/:id` | 강의 상세 | X |
| `/cart` | 장바구니 | O |
| `/mypage` | 마이페이지 | O |
| `/roadmap` | 학습 로드맵 | X |
| `/mentoring` | 멘토링 | X |
| `/community` | 커뮤니티 | X |
| `/jobs` | 채용 정보 | X |
| `/notifications` | 알림 센터 | O |

---

## 컴포넌트 패턴 (CVA)

### Button

```typescript
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all rounded-xl',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-lg',
        outline: 'border border-white/20 bg-transparent hover:bg-white/10',
        ghost: 'hover:bg-white/10',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-10 px-6',
        lg: 'h-12 px-8 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);
```

### Badge

```typescript
const badgeVariants = cva('px-2 py-1 rounded-full text-xs font-semibold', {
  variants: {
    type: {
      new: 'bg-brand-blue text-white',
      best: 'bg-brand-purple text-white',
      sale: 'bg-red-500 text-white',
    },
  },
});
```

### Glass Card

```typescript
const glassCard = cva(
  'bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl',
  {
    variants: {
      hover: {
        true: 'hover:bg-white/10 hover:border-white/20 transition-all',
      },
    },
  }
);
```

---

## 상태 스타일링

```typescript
// 버튼
<button className="
  hover:opacity-90
  focus:ring-2 focus:ring-brand-blue
  disabled:opacity-50 disabled:cursor-not-allowed
">

// 입력 필드
<input className={cn(
  'bg-white/5 border border-white/10 rounded-lg px-10 py-3',
  'focus:border-brand-blue focus:ring-1 focus:ring-brand-blue',
  error && 'border-red-500'
)} />

// 카드 호버
<div className="hover:scale-[1.02] hover:bg-white/10 transition-all duration-300">
```

---

## 반응형

```typescript
// 모바일 우선 접근
<div className="px-4 md:px-6 lg:px-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// 네비게이션
<nav className="hidden md:flex">데스크톱 메뉴</nav>
<button className="md:hidden">햄버거 메뉴</button>

// 컨테이너
<div className="max-w-7xl mx-auto">
```

---

## 애니메이션 클래스

| 클래스 | 효과 |
|--------|------|
| `.gradient-text` | 멀티컬러 그라데이션 애니메이션 |
| `.animated-bg` | 배경 그라데이션 이동 |
| `.glass` | Glassmorphism 효과 |
| `.card-hover` | 카드 호버 효과 (scale + glow) |

---

## 주요 아이콘 (Lucide React)

| 아이콘 | 용도 |
|--------|------|
| `Search` | 검색 |
| `ShoppingCart` | 장바구니 |
| `Bell` | 알림 |
| `User` | 프로필 |
| `Mail`, `Lock` | 폼 필드 |
| `Eye`, `EyeOff` | 비밀번호 토글 |
| `Star` | 평점 |
| `Heart` | 찜하기 |
| `ChevronLeft`, `ChevronRight` | 캐러셀 |

---

## 체크리스트

- [ ] 디자인 토큰 사용 (하드코딩 금지)
- [ ] CVA로 컴포넌트 variants 정의
- [ ] 반응형 적용 (모바일 우선)
- [ ] 상태 스타일 (hover, focus, disabled)
- [ ] Glassmorphism 효과 일관성
- [ ] 아이콘 일관성 (Lucide React)
- [ ] 애니메이션 성능 최적화 (will-change)

---

> 화면별 상세 정의 → [TU-screens-detail.md](./TU-screens-detail.md)
> 디자인 컨벤션 → [../conventions/17-DESIGN-CONVENTIONS.md](../conventions/17-DESIGN-CONVENTIONS.md)

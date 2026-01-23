# 00. Design Implementation Conventions

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](../00-CONVENTIONS-CORE.md)

> Frontend 디자인 구현 - TailwindCSS + CVA + Radix UI

---

## 버전 정보

| 항목 | 버전 | 비고 |
|------|------|------|
| React | ^19.0.0 | 최신 React 19 |
| TypeScript | ~5.6.0 | 타입 안정성 |
| TailwindCSS | ^3.4.0 | 유틸리티 CSS |
| Radix UI | ^1.x | Headless UI 컴포넌트 |
| CVA | ^0.7.1 | 컴포넌트 Variant 관리 |
| Lucide React | ^0.487.0 | 아이콘 라이브러리 |
| Vite | ^6.0.0 | 빌드 도구 |

---

## 핵심 규칙

```
✅ 디자인 토큰 사용 → 하드코딩 금지
✅ CVA로 컴포넌트 Variant 관리 → 타입 안전한 스타일링
✅ Radix UI 기반 컴포넌트 → 접근성 보장
✅ WCAG AA 준수 → 4.5:1 대비율 필수
```

---

## 1. 컴포넌트 패턴 (CVA)

### Button 컴포넌트

```typescript
// src/components/common/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        neutral: 'bg-btn-neutral text-white hover:bg-btn-neutral-hover',
        brand: 'bg-btn-brand text-white hover:bg-btn-brand-hover',
        ghost: 'bg-transparent text-text-secondary hover:bg-bg-secondary',
        danger: 'bg-status-error-bg text-status-error hover:opacity-80',
      },
      size: {
        sm: 'h-8 px-3 text-sm gap-1',
        md: 'h-10 px-4 gap-2',
        lg: 'h-12 px-6 text-lg gap-2',
      },
    },
    defaultVariants: {
      variant: 'brand',
      size: 'md',
    },
  }
);

export const Button = ({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps & VariantProps<typeof buttonVariants>) => (
  <button
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  >
    {children}
  </button>
);
```

### cn 유틸리티

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## 2. UI 컴포넌트 라이브러리

### Radix UI 컴포넌트 목록

| 컴포넌트 | 패키지 | 용도 |
|----------|--------|------|
| Accordion | `@radix-ui/react-accordion` | 아코디언 |
| AlertDialog | `@radix-ui/react-alert-dialog` | 확인 다이얼로그 |
| Checkbox | `@radix-ui/react-checkbox` | 체크박스 |
| Dialog | `@radix-ui/react-dialog` | 모달 |
| DropdownMenu | `@radix-ui/react-dropdown-menu` | 드롭다운 메뉴 |
| Popover | `@radix-ui/react-popover` | 팝오버 |
| Select | `@radix-ui/react-select` | 셀렉트 박스 |
| Tabs | `@radix-ui/react-tabs` | 탭 |
| Tooltip | `@radix-ui/react-tooltip` | 툴팁 |
| Switch | `@radix-ui/react-switch` | 토글 스위치 |

### 기타 UI 라이브러리

| 라이브러리 | 용도 |
|------------|------|
| `lucide-react` | 아이콘 |
| `react-day-picker` | 날짜 선택기 |
| `recharts` | 차트 |
| `react-dropzone` | 파일 업로드 |
| `sonner` | 토스트 알림 |
| `cmdk` | 커맨드 팔레트 |

---

## 3. 레이아웃 시스템

### 역할별 레이아웃

```
/sa/*  → SystemAdminLayout   (시스템 관리자)
/ta/*  → TenantAdminLayout   (테넌트 관리자)
/to/*  → TenantOperatorLayout (테넌트 운영자)
/tu/*  → TenantUserLayout    (테넌트 사용자)
```

### 레이아웃 구조

```typescript
// 공통 레이아웃 패턴
import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { designTokens } from '@/styles/design-tokens';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleMenuItemClick = (menuId: string) => {
    // 메뉴 클릭 핸들러
    console.log('Menu clicked:', menuId);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: designTokens.bg.app_default }}>
      <Sidebar
        isExpanded={isSidebarExpanded}
        isDarkMode={isDarkMode}
        onMenuItemClick={handleMenuItemClick}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

---

## 4. 상태 스타일링

### 인터랙티브 요소

```typescript
// 버튼 상태
<button className="
  hover:bg-btn-neutral-hover
  focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">

// 입력 필드 상태
<input className={cn(
  'border rounded-md px-3 py-2',
  'focus:ring-2 focus:ring-btn-brand focus:border-transparent',
  error && 'border-status-error',
  !error && 'border-border'
)} />
```

---

## 5. 반응형 디자인

### 브레이크포인트

| 이름 | 크기 | 대상 | 사용 예시 |
|------|------|------|-----------|
| sm | 640px | 모바일 | `sm:flex` |
| md | 768px | 태블릿 | `md:grid-cols-2` |
| lg | 1024px | 데스크톱 | `lg:px-8` |
| xl | 1280px | 대형 화면 | `xl:max-w-7xl` |
| 2xl | 1536px | 초대형 화면 | `2xl:grid-cols-4` |

### 모바일 우선 접근 (Mobile First)

```typescript
// ✅ 모바일 → 데스크톱 (권장)
<div className="px-4 md:px-6 lg:px-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ 데스크톱 → 모바일 (지양)
<div className="px-8 sm:px-4">  // 역순 브레이크포인트 사용 금지
```

### 반응형 컴포넌트 패턴

```typescript
// 사이드바 반응형
<aside className="hidden md:flex w-64">데스크톱 사이드바</aside>
<nav className="md:hidden fixed bottom-0 w-full">모바일 하단 네비게이션</nav>

// 카드 그리드 반응형
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// 테이블 → 카드 전환 (모바일)
<table className="hidden md:table">...</table>
<div className="md:hidden space-y-4">
  {data.map(row => <MobileCard key={row.id} data={row} />)}
</div>

// 폼 레이아웃 반응형
<form className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Input label="이름" className="md:col-span-1" />
  <Input label="이메일" className="md:col-span-1" />
  <Textarea label="설명" className="md:col-span-2" />
</form>
```

### 반응형 타이포그래피

```typescript
// 제목 크기 반응형
<h1 className="text-xl md:text-2xl lg:text-3xl">제목</h1>

// 본문 크기 반응형
<p className="text-sm md:text-base">본문 텍스트</p>
```

### 반응형 간격 (Spacing)

```typescript
// 패딩 반응형
<div className="p-4 md:p-6 lg:p-8">

// 마진 반응형
<section className="my-8 md:my-12 lg:my-16">

// 갭 반응형
<div className="flex flex-col md:flex-row gap-4 md:gap-6">
```

### 반응형 체크리스트

```
✅ 모바일 우선 설계 (기본 스타일 = 모바일)
✅ 터치 타겟 최소 44x44px (모바일)
✅ 사이드바 → 하단 네비게이션 전환
✅ 테이블 → 카드 레이아웃 전환
✅ 폼 필드 스택 → 그리드 전환
✅ 이미지/미디어 반응형 처리
✅ 모든 브레이크포인트에서 테스트
```

---

## 6. 접근성 (A11y)

### WCAG AA 준수

| 항목 | 요구사항 | 현재 상태 |
|------|----------|-----------|
| 텍스트 대비율 | 4.5:1 이상 | ✅ `#333333` on `#FFFFFF` = 12.6:1 |
| 포커스 표시 | 명확한 표시 | ✅ `focus:ring-2` |
| 키보드 접근 | 전체 탐색 가능 | ✅ Radix UI 기본 지원 |

---

## 7. 체크리스트

### 컴포넌트
- [ ] CVA로 variant 정의
- [ ] cn() 유틸리티로 클래스 병합
- [ ] Radix UI 기반 접근성 확보

### 레이아웃
- [ ] 역할별 레이아웃 적용
- [ ] 사이드바 다크/라이트 모드 지원
- [ ] 반응형 브레이크포인트 적용

### 접근성
- [ ] WCAG AA 대비율 준수
- [ ] 포커스 스타일 명확
- [ ] 키보드 네비게이션 테스트

---

## 8. 파일 구조

```
src/
├── styles/
│   └── design-tokens.ts     # TypeScript 디자인 토큰
├── index.css                # CSS 변수 + 글로벌 스타일
├── components/
│   ├── common/              # 공통 UI 컴포넌트
│   │   ├── Button/
│   │   ├── Input/
│   │   └── ...
│   └── layout/              # 레이아웃 컴포넌트
│       ├── sa/
│       ├── ta/
│       ├── to/
│       └── tu/
├── utils/
│   └── cn.ts                # 클래스 병합 유틸리티
└── tailwind.config.js       # Tailwind 설정
```

---

> 디자인 토큰 (Common) → [01-DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md)
> 디자인 토큰 (Tenant) → [02-DESIGN-TOKENS-TENANT-TEMPLATE](./02-DESIGN-TOKENS-TENANT-TEMPLATE.md)
> 컴포넌트 컨벤션 → [12-REACT-COMPONENT-CONVENTIONS](../12-REACT-COMPONENT-CONVENTIONS.md)
> 프로젝트 구조 → [11-REACT-PROJECT-STRUCTURE](../11-REACT-PROJECT-STRUCTURE.md)

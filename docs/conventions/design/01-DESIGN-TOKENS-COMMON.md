# 18. Design Tokens - Common (Admin)

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](../00-CONVENTIONS-CORE.md)

> Admin 스타일 공통 디자인 토큰 - SA, TA, TO, TU 공통 사용

---

## 핵심 규칙

```
✅ 디자인 토큰 사용 → 하드코딩 금지
✅ CSS 변수 + TypeScript 토큰 동기화 → 일관성 유지
✅ Tailwind 클래스로 토큰 참조
✅ WCAG AA 준수 → 4.5:1 대비율 필수
```

---

## 1. CSS 변수 (index.css)

```css
:root {
  /* === Background and Neutral Tones === */
  --color-bg-default: #FFFFFF;       /* 주요 콘텐츠/카드 배경 */
  --color-bg-app: #FAFAFA;           /* 전체 앱 배경 */
  --color-bg-secondary: #F4F4F4;     /* Admin 페이지/테이블 헤더 */
  --color-border: #E0E0E0;           /* 경계선, 인풋 테두리 */

  /* === Text Colors === */
  --color-text-primary: #333333;     /* 핵심 텍스트 */
  --color-text-secondary: #666666;   /* 보조 텍스트/아이콘 */
  --color-text-placeholder: #999999; /* 플레이스홀더 */

  /* === Button - Neutral === */
  --color-btn-neutral: #2A2A2A;
  --color-btn-neutral-hover: #3D3D3D;
  --color-btn-neutral-text: #FFFFFF;

  /* === Button - Brand === */
  --color-btn-brand: #4C2D9A;        /* 브랜드 컬러 (Indigo) */
  --color-btn-brand-hover: #3D2478;
  --color-btn-brand-text: #FFFFFF;

  /* === Status Colors === */
  --color-status-success: #388E3C;
  --color-status-success-bg: #D4EDDA;
  --color-status-warning: #FFA000;
  --color-status-warning-bg: #FFF3CD;
  --color-status-error: #D32F2F;
  --color-status-error-bg: #FFEBEE;
  --color-status-disabled: #666666;
  --color-status-disabled-bg: #E0E0E0;

  /* === Badge Colors (태그/카테고리용 - 뮤트 톤) === */
  --color-badge-red: #9E3A3A;
  --color-badge-red-bg: #FAECEC;
  --color-badge-orange: #B5663A;
  --color-badge-orange-bg: #FDF3EC;
  --color-badge-yellow: #8C7A35;
  --color-badge-yellow-bg: #FBF8E8;
  --color-badge-green: #3D7A4A;
  --color-badge-green-bg: #EDF5EF;
  --color-badge-blue: #3A6B9E;
  --color-badge-blue-bg: #ECF3FA;
  --color-badge-indigo: #4C2D9A;
  --color-badge-indigo-bg: #EDE7F6;
  --color-badge-purple: #7A4A8C;
  --color-badge-purple-bg: #F5EDF8;
  --color-badge-gray: #616161;
  --color-badge-gray-bg: #F5F5F5;

  /* === Sidebar - Dark Mode === */
  --sidebar-dark-bg: #2A2A2A;
  --sidebar-dark-border: #3F3F3F;
  --sidebar-dark-text-primary: #D4D4D4;
  --sidebar-dark-text-secondary: #9E9E9E;
  --sidebar-dark-hover: #353535;
  --sidebar-dark-active-bg: #4A4A4A;
  --sidebar-dark-active-text: #E8E8E8;

  /* === Sidebar - Light Mode === */
  --sidebar-light-bg: #EFEFEF;
  --sidebar-light-border: #D0D0D0;
  --sidebar-light-text-primary: #333333;
  --sidebar-light-text-secondary: #666666;
  --sidebar-light-hover: #E0E0E0;
  --sidebar-light-active-bg: #D5D5D5;
  --sidebar-light-active-text: #1F1F1F;

  /* === Typography === */
  --font-size-base: 16px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* === Spacing & Radius === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

---

## 2. TypeScript 디자인 토큰 (design-tokens.ts)

```typescript
// src/styles/design-tokens.ts
export const designTokens = {
  bg: {
    default: '#FFFFFF',
    app_default: '#FAFAFA',
    secondary: '#F4F4F4',
    border: '#E0E0E0',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    placeholder: '#999999',
  },
  button: {
    neutral_default: '#2A2A2A',
    neutral_hover: '#3D3D3D',
    brand_default: '#4C2D9A',
    brand_hover: '#3D2478',
  },
  status: {
    success_text: '#388E3C',
    success_background: '#D4EDDA',
    warning_text: '#FFA000',
    warning_background: '#FFF3CD',
    error_text: '#D32F2F',
    error_background: '#FFEBEE',
    disabled_text: '#666666',
    disabled_background: '#E0E0E0',
  },
  badge: {
    red: { text: '#9E3A3A', bg: '#FAECEC' },
    orange: { text: '#B5663A', bg: '#FDF3EC' },
    yellow: { text: '#8C7A35', bg: '#FBF8E8' },
    green: { text: '#3D7A4A', bg: '#EDF5EF' },
    blue: { text: '#3A6B9E', bg: '#ECF3FA' },
    indigo: { text: '#4C2D9A', bg: '#EDE7F6' },
    purple: { text: '#7A4A8C', bg: '#F5EDF8' },
    gray: { text: '#616161', bg: '#F5F5F5' },
  },
  sidebar: {
    dark: {
      bg: '#2A2A2A',
      border: '#3F3F3F',
      textPrimary: '#D4D4D4',
      textSecondary: '#9E9E9E',
      hover: '#353535',
      activeBg: '#4A4A4A',
      activeText: '#E8E8E8',
    },
    light: {
      bg: '#EFEFEF',
      border: '#D0D0D0',
      textPrimary: '#333333',
      textSecondary: '#666666',
      hover: '#E0E0E0',
      activeBg: '#D5D5D5',
      activeText: '#1F1F1F',
    },
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
} as const;

export type DesignTokens = typeof designTokens;
```

---

## 3. Tailwind Config (tailwind.config.js)

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-default': 'var(--color-bg-default)',
        'bg-app': 'var(--color-bg-app)',
        'bg-secondary': 'var(--color-bg-secondary)',
        border: 'var(--color-border)',

        // Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-placeholder': 'var(--color-text-placeholder)',

        // Button - Neutral
        'btn-neutral': 'var(--color-btn-neutral)',
        'btn-neutral-hover': 'var(--color-btn-neutral-hover)',

        // Button - Brand
        'btn-brand': 'var(--color-btn-brand)',
        'btn-brand-hover': 'var(--color-btn-brand-hover)',

        // Status
        'status-success': 'var(--color-status-success)',
        'status-success-bg': 'var(--color-status-success-bg)',
        'status-warning': 'var(--color-status-warning)',
        'status-warning-bg': 'var(--color-status-warning-bg)',
        'status-error': 'var(--color-status-error)',
        'status-error-bg': 'var(--color-status-error-bg)',
        'status-disabled': 'var(--color-status-disabled)',
        'status-disabled-bg': 'var(--color-status-disabled-bg)',

        // Badge (태그/카테고리용)
        'badge-red': 'var(--color-badge-red)',
        'badge-red-bg': 'var(--color-badge-red-bg)',
        'badge-orange': 'var(--color-badge-orange)',
        'badge-orange-bg': 'var(--color-badge-orange-bg)',
        'badge-yellow': 'var(--color-badge-yellow)',
        'badge-yellow-bg': 'var(--color-badge-yellow-bg)',
        'badge-green': 'var(--color-badge-green)',
        'badge-green-bg': 'var(--color-badge-green-bg)',
        'badge-blue': 'var(--color-badge-blue)',
        'badge-blue-bg': 'var(--color-badge-blue-bg)',
        'badge-indigo': 'var(--color-badge-indigo)',
        'badge-indigo-bg': 'var(--color-badge-indigo-bg)',
        'badge-purple': 'var(--color-badge-purple)',
        'badge-purple-bg': 'var(--color-badge-purple-bg)',
        'badge-gray': 'var(--color-badge-gray)',
        'badge-gray-bg': 'var(--color-badge-gray-bg)',

        // Sidebar (Nested)
        'sidebar-dark': {
          bg: 'var(--sidebar-dark-bg)',
          border: 'var(--sidebar-dark-border)',
          'text-primary': 'var(--sidebar-dark-text-primary)',
          'text-secondary': 'var(--sidebar-dark-text-secondary)',
          hover: 'var(--sidebar-dark-hover)',
          'active-bg': 'var(--sidebar-dark-active-bg)',
          'active-text': 'var(--sidebar-dark-active-text)',
        },
        'sidebar-light': {
          bg: 'var(--sidebar-light-bg)',
          border: 'var(--sidebar-light-border)',
          'text-primary': 'var(--sidebar-light-text-primary)',
          'text-secondary': 'var(--sidebar-light-text-secondary)',
          hover: 'var(--sidebar-light-hover)',
          'active-bg': 'var(--sidebar-light-active-bg)',
          'active-text': 'var(--sidebar-light-active-text)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
    },
  },
};
```

---

## 4. 컬러 팔레트

### 브랜드 컬러

| 용도 | 색상 | HEX | 사용처 |
|------|------|-----|--------|
| Brand Primary | Indigo | `#4C2D9A` | 브랜드 버튼, 강조 |
| Brand Hover | Dark Indigo | `#3D2478` | 브랜드 버튼 호버 |
| Neutral Primary | Dark Gray | `#2A2A2A` | 주요 액션 버튼 |
| Neutral Hover | Gray | `#3D3D3D` | 주요 버튼 호버 |

### 시맨틱 컬러 (Status)

| 상태 | 텍스트 | 배경 | 용도 |
|------|--------|------|------|
| Success | `#388E3C` | `#D4EDDA` | 완료, 성공 |
| Warning | `#FFA000` | `#FFF3CD` | 경고, 주의 |
| Error | `#D32F2F` | `#FFEBEE` | 에러, 삭제 |
| Disabled | `#666666` | `#E0E0E0` | 비활성 |

### Badge 컬러 (태그/카테고리용)

> 노션 스타일의 다중 선택 컬러 팔레트. 카테고리, 태그, 라벨 등에 사용.

| 이름 | 텍스트 | 배경 | 용도 예시 |
|------|--------|------|----------|
| Red | `#9E3A3A` | `#FAECEC` | 긴급, 중요 |
| Orange | `#B5663A` | `#FDF3EC` | 안내, 공지 |
| Yellow | `#8C7A35` | `#FBF8E8` | 주의, 대기 |
| Green | `#3D7A4A` | `#EDF5EF` | 참고자료, 완료 |
| Blue | `#3A6B9E` | `#ECF3FA` | 과제, 프로그래밍 |
| Indigo | `#4C2D9A` | `#EDE7F6` | 브랜드 관련 |
| Purple | `#7A4A8C` | `#F5EDF8` | 프론트엔드 |
| Gray | `#616161` | `#F5F5F5` | 기본, 기타 |

### 배경 컬러

| 용도 | HEX | 설명 |
|------|-----|------|
| Default | `#FFFFFF` | 카드, 콘텐츠 배경 |
| App | `#FAFAFA` | 전체 앱 배경 |
| Secondary | `#F4F4F4` | 테이블 헤더, 섹션 구분 |
| Border | `#E0E0E0` | 경계선, 인풋 테두리 |

### 텍스트 컬러

| 용도 | HEX | 대비율 | 설명 |
|------|-----|--------|------|
| Primary | `#333333` | 12.6:1 | 핵심 텍스트 |
| Secondary | `#666666` | 5.7:1 | 보조 텍스트 |
| Placeholder | `#999999` | 2.8:1 | 플레이스홀더 |

---

## 5. 사이드바 테마

### 다크 모드

| 요소 | HEX | 용도 |
|------|-----|------|
| Background | `#2A2A2A` | 배경 |
| Border | `#3F3F3F` | 구분선 |
| Text Primary | `#D4D4D4` | 주요 텍스트 |
| Text Secondary | `#9E9E9E` | 보조 텍스트 |
| Hover | `#353535` | 호버 배경 |
| Active BG | `#4A4A4A` | 활성 배경 |
| Active Text | `#E8E8E8` | 활성 텍스트 |

### 라이트 모드

| 요소 | HEX | 용도 |
|------|-----|------|
| Background | `#EFEFEF` | 배경 |
| Border | `#D0D0D0` | 구분선 |
| Text Primary | `#333333` | 주요 텍스트 |
| Text Secondary | `#666666` | 보조 텍스트 |
| Hover | `#E0E0E0` | 호버 배경 |
| Active BG | `#D5D5D5` | 활성 배경 |
| Active Text | `#1F1F1F` | 활성 텍스트 |

### 스크롤바 스타일

```css
/* 다크 모드 스크롤바 */
.sidebar-scrollbar::-webkit-scrollbar-thumb {
  background-color: #606060;
}
.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #707070;
}

/* 라이트 모드 스크롤바 */
.sidebar-scrollbar-light::-webkit-scrollbar-thumb {
  background-color: #C8C8C8;
}
.sidebar-scrollbar-light::-webkit-scrollbar-thumb:hover {
  background-color: #B0B0B0;
}
```

---

## 6. 타이포그래피

### 기본 설정

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
}

h1 { @apply text-2xl; }  /* 24px */
h2 { @apply text-xl; }   /* 20px */
h3 { @apply text-lg; }   /* 18px */
h4 { @apply text-base; } /* 16px */
```

### Font Weight

| 이름 | 값 | 용도 |
|------|-----|------|
| normal | 400 | 본문 |
| medium | 500 | 헤딩, 레이블 |
| semibold | 600 | 강조 |

---

## 7. Spacing & Radius

### Border Radius

| 토큰 | 값 | 용도 |
|------|-----|------|
| sm | 4px | 작은 요소 (태그, 뱃지) |
| md | 8px | 기본 (버튼, 인풋) |
| lg | 12px | 카드, 모달 |
| xl | 16px | 큰 컨테이너 |

### 사용 예시

```typescript
// Tailwind 클래스 사용
<button className="rounded-md">기본 버튼</button>
<div className="rounded-lg">카드</div>

// CSS 변수 직접 사용
<div style={{ borderRadius: 'var(--radius-lg)' }}>카드</div>

// TypeScript 토큰 사용
import { designTokens } from '@/styles/design-tokens';
<div style={{ borderRadius: designTokens.radius.lg }}>카드</div>
```

---

## 8. 접근성 대비율

### WCAG AA 기준

| 항목 | 요구사항 | 현재 상태 |
|------|----------|-----------|
| 일반 텍스트 | 4.5:1 이상 | ✅ Primary: 12.6:1 |
| 대형 텍스트 | 3:1 이상 | ✅ Secondary: 5.7:1 |
| 포커스 표시 | 명확한 표시 | ✅ `focus:ring-2` |

### 다크 모드 대비율

| 요소 | 조합 | 대비율 | 상태 |
|------|------|--------|------|
| Primary Text | `#D4D4D4` on `#2A2A2A` | 9.7:1 | ✅ |
| Secondary Text | `#9E9E9E` on `#2A2A2A` | 5.2:1 | ✅ |
| Active Text | `#E8E8E8` on `#4A4A4A` | 6.8:1 | ✅ |

### 라이트 모드 대비율

| 요소 | 조합 | 대비율 | 상태 |
|------|------|--------|------|
| Primary Text | `#333333` on `#EFEFEF` | 10.3:1 | ✅ |
| Secondary Text | `#666666` on `#EFEFEF` | 4.8:1 | ✅ |
| Active Text | `#1F1F1F` on `#D5D5D5` | 9.1:1 | ✅ |

---

## 9. 체크리스트

### 토큰 동기화
- [ ] CSS 변수 정의 완료
- [ ] TypeScript 토큰 동기화
- [ ] Tailwind config 연동

### 색상 사용
- [ ] 하드코딩 색상 사용 금지
- [ ] 시맨틱 컬러 올바르게 적용
- [ ] 상태 색상 일관성 유지

### 접근성
- [ ] WCAG AA 대비율 준수
- [ ] 다크/라이트 모드 모두 검증
- [ ] 포커스 스타일 명확

---

## 10. 파일 구조

```
src/
├── styles/
│   └── design-tokens.ts     # TypeScript 디자인 토큰
├── index.css                # CSS 변수 + 글로벌 스타일
└── tailwind.config.js       # Tailwind 설정
```

---

> 디자인 컨벤션 → [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md)
> 테넌트 토큰 템플릿 → [02-DESIGN-TOKENS-TENANT-TEMPLATE](./02-DESIGN-TOKENS-TENANT-TEMPLATE.md)
> 컴포넌트 컨벤션 → [12-REACT-COMPONENT-CONVENTIONS](../12-REACT-COMPONENT-CONVENTIONS.md)

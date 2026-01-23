# 01. Design Tokens - Common (Admin)

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](../00-CONVENTIONS-CORE.md)

> Admin 스타일 공통 디자인 토큰 - SA, TA, TO, TU 공통 사용

---

## 핵심 규칙

```
✅ 디자인 토큰 사용 → 하드코딩 금지
✅ CSS 변수 + TypeScript 토큰 동기화
✅ Tailwind 클래스로 토큰 참조
✅ WCAG AA 준수 → 4.5:1 대비율 필수
```

---

## 1. CSS 변수 (index.css)

```css
:root {
  /* Background */
  --color-bg-default: #FFFFFF;
  --color-bg-app: #FAFAFA;
  --color-bg-secondary: #F4F4F4;
  --color-bg-card-static: #F0F0F0;
  --color-border: #E0E0E0;

  /* Text */
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-placeholder: #999999;

  /* Action Colors */
  --color-action-primary: #2A2A2A;
  --color-action-primary-hover: #3D3D3D;
  --color-action-text: #FFFFFF;
  --color-action-delete: #F44336;

  /* Button - Neutral */
  --color-btn-neutral: #2A2A2A;
  --color-btn-neutral-hover: #3D3D3D;
  --color-btn-neutral-text: #FFFFFF;

  /* Button - Brand */
  --color-btn-brand: #4C2D9A;
  --color-btn-brand-hover: #3D2478;
  --color-btn-brand-text: #FFFFFF;

  /* Tenant Brand (동적) */
  --color-tenant-primary: #4C2D9A;
  --color-tenant-primary-hover: #3D2478;
  --color-tenant-primary-text: #FFFFFF;

  /* Status */
  --color-status-success: #388E3C;
  --color-status-success-bg: #D4EDDA;
  --color-status-warning: #FFA000;
  --color-status-warning-bg: #FFF3CD;
  --color-status-error: #D32F2F;
  --color-status-error-bg: #FFEBEE;
  --color-status-disabled: #666666;
  --color-status-disabled-bg: #E0E0E0;

  /* Badge (태그/카테고리) */
  --color-badge-red: #9E3A3A; --color-badge-red-bg: #FAECEC;
  --color-badge-orange: #B5663A; --color-badge-orange-bg: #FDF3EC;
  --color-badge-yellow: #8C7A35; --color-badge-yellow-bg: #FBF8E8;
  --color-badge-green: #3D7A4A; --color-badge-green-bg: #EDF5EF;
  --color-badge-blue: #3A6B9E; --color-badge-blue-bg: #ECF3FA;
  --color-badge-indigo: #4C2D9A; --color-badge-indigo-bg: #EDE7F6;
  --color-badge-purple: #7A4A8C; --color-badge-purple-bg: #F5EDF8;
  --color-badge-gray: #616161; --color-badge-gray-bg: #F5F5F5;

  /* Sidebar - Dark */
  --sidebar-dark-bg: #2A2A2A;
  --sidebar-dark-hover: #353535;
  --sidebar-dark-active-bg: #4A4A4A;
  --sidebar-dark-text-primary: #D4D4D4;
  --sidebar-dark-tooltip-bg: #353535;

  /* Sidebar - Light */
  --sidebar-light-bg: #EFEFEF;
  --sidebar-light-hover: #E0E0E0;
  --sidebar-light-active-bg: #D5D5D5;
  --sidebar-light-text-primary: #333333;
  --sidebar-light-tooltip-bg: #FFFFFF;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

---

## 2. TypeScript 토큰 (admin-design-tokens.ts)

```typescript
export const designTokens = {
  bg: {
    default: '#FFFFFF',
    app_default: '#FAFAFA',
    secondary: '#F4F4F4',
    card_static: '#F0F0F0',
    border: '#E0E0E0',
    brand_active: '#D4CDEF',
    sidebar_light_hover: '#F5F5F5',
    sidebar_light_active: '#E8E8E8',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    placeholder: '#999999',
    on_brand_active: '#4C2D9A',
    on_neutral_active: '#333333',
  },
  action: {
    primary_default: '#2A2A2A',
    primary_hover: '#3D3D3D',
    primary_text: '#FFFFFF',
    delete_text: '#F44336',
  },
  button: {
    neutral_default: '#2A2A2A',
    neutral_hover: '#3D3D3D',
    brand_default: '#4C2D9A',
    brand_hover: '#3D2478',
  },
  status: { /* success, warning, error, disabled */ },
  badge: { /* red, orange, yellow, green, blue, indigo, purple, gray */ },
  darkMode: { /* 사이드바 다크 */ tooltipBg: '#353535' },
  lightMode: { /* 사이드바 라이트 */ tooltipBg: '#FFFFFF' },
} as const;
```

---

## 3. 컬러 팔레트

### 브랜드 컬러

| 용도 | HEX | 사용처 |
|------|-----|--------|
| Brand Primary | `#4C2D9A` | 브랜드 버튼, 강조 |
| Brand Hover | `#3D2478` | 브랜드 버튼 호버 |
| Neutral Primary | `#2A2A2A` | 주요 액션 버튼 |
| Neutral Hover | `#3D3D3D` | 주요 버튼 호버 |

### Status 컬러

| 상태 | 텍스트 | 배경 |
|------|--------|------|
| Success | `#388E3C` | `#D4EDDA` |
| Warning | `#FFA000` | `#FFF3CD` |
| Error | `#D32F2F` | `#FFEBEE` |
| Disabled | `#666666` | `#E0E0E0` |

### Badge 컬러 (태그/카테고리)

| 이름 | 텍스트 | 배경 | 용도 |
|------|--------|------|------|
| Red | `#9E3A3A` | `#FAECEC` | 긴급, 중요 |
| Orange | `#B5663A` | `#FDF3EC` | 안내 |
| Yellow | `#8C7A35` | `#FBF8E8` | 주의, 대기 |
| Green | `#3D7A4A` | `#EDF5EF` | 완료 |
| Blue | `#3A6B9E` | `#ECF3FA` | 과제 |
| Indigo | `#4C2D9A` | `#EDE7F6` | 브랜드 |
| Purple | `#7A4A8C` | `#F5EDF8` | 기타 |
| Gray | `#616161` | `#F5F5F5` | 기본 |

---

## 4. 접근성 대비율 (WCAG AA)

| 조합 | 대비율 | 상태 |
|------|--------|------|
| `#333333` on `#FFFFFF` | 12.6:1 | ✅ |
| `#666666` on `#FFFFFF` | 5.7:1 | ✅ |
| `#D4D4D4` on `#2A2A2A` (Dark) | 9.7:1 | ✅ |
| `#333333` on `#EFEFEF` (Light) | 10.3:1 | ✅ |

---

## 5. 파일 구조

```
src/
├── styles/
│   ├── admin-design-tokens.ts      # Admin 토큰 (SA, TA, TO)
│   └── user-site-design-tokens.ts  # User Site 토큰 (TU)
├── index.css                       # CSS 변수
└── tailwind.config.js              # Tailwind 설정
```

---

## 소스 참조

| 파일 | 설명 |
|------|------|
| [admin-design-tokens.ts](../../../mzc-lp-frontend/src/styles/admin-design-tokens.ts) | Admin 토큰 (SA, TA, TO) |
| [user-site-design-tokens.ts](../../../mzc-lp-frontend/src/styles/user-site-design-tokens.ts) | User Site 토큰 (TU) |
| [index.css](../../../mzc-lp-frontend/src/index.css) | CSS 변수 정의 |
| [tailwind.config.js](../../../mzc-lp-frontend/tailwind.config.js) | Tailwind 설정 |

---

> 테넌트 토큰 → [02-DESIGN-TOKENS-TENANT-TEMPLATE](./02-DESIGN-TOKENS-TENANT-TEMPLATE.md)
> 랜딩 페이지 → [11-UX-LANDING-PAGE](./11-UX-LANDING-PAGE.md)

# 19. Design Tokens - Tenant Template

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](../00-CONVENTIONS-CORE.md)

> 테넌시별 커스텀 디자인 토큰 템플릿

---

## 개요

이 문서는 테넌시별로 커스터마이징 가능한 디자인 토큰의 템플릿입니다.
각 테넌트는 이 템플릿을 기반으로 고유한 브랜드 컬러와 스타일을 정의할 수 있습니다.

### 적용 범위

| 구분 | 설명 |
|------|------|
| **Common (Admin)** | SA, TA, TO, TU 관리자 화면에서 사용하는 공통 토큰 |
| **Tenant Custom** | 각 테넌트의 학습자 화면(LMS)에서 사용하는 커스텀 토큰 |

---

## 1. 테넌트 토큰 구조

### 1.1 CSS 변수 네이밍 규칙

```css
/* 테넌트별 CSS 변수 네이밍 */
:root {
  /* 공통 토큰은 --color- 접두사 */
  --color-bg-default: #FFFFFF;

  /* 테넌트 토큰은 --tenant- 접두사 */
  --tenant-primary: #4C2D9A;
  --tenant-primary-hover: #3D2478;
  --tenant-secondary: #6B7280;
  --tenant-accent: #10B981;
}
```

### 1.2 파일 구조

```
src/styles/
├── design-tokens.ts           # 공통 토큰 (Admin)
└── tenant/
    ├── index.ts               # 테넌트 토큰 엔트리
    ├── default.ts             # 기본 테넌트 토큰
    └── [tenant-id].ts         # 개별 테넌트 토큰
```

---

## 2. 테넌트 토큰 템플릿

### 2.1 CSS 변수 템플릿

```css
/* src/styles/tenant/[tenant-id].css */

:root[data-tenant="TENANT_ID"] {
  /* === Brand Colors === */
  --tenant-primary: #4C2D9A;           /* 메인 브랜드 컬러 */
  --tenant-primary-hover: #3D2478;     /* 호버 상태 */
  --tenant-primary-light: #EDE9F6;     /* 라이트 버전 (배경용) */
  --tenant-secondary: #6B7280;         /* 보조 컬러 */
  --tenant-accent: #10B981;            /* 강조 컬러 */

  /* === Button Colors === */
  --tenant-btn-primary: var(--tenant-primary);
  --tenant-btn-primary-hover: var(--tenant-primary-hover);
  --tenant-btn-primary-text: #FFFFFF;

  /* === Link Colors === */
  --tenant-link: var(--tenant-primary);
  --tenant-link-hover: var(--tenant-primary-hover);

  /* === Header/Navigation === */
  --tenant-header-bg: #FFFFFF;
  --tenant-header-text: #333333;
  --tenant-nav-active: var(--tenant-primary);
  --tenant-nav-active-bg: var(--tenant-primary-light);

  /* === Progress/Status === */
  --tenant-progress: var(--tenant-primary);
  --tenant-progress-bg: #E5E7EB;
  --tenant-complete: #10B981;
  --tenant-incomplete: #9CA3AF;

  /* === Card/Container === */
  --tenant-card-bg: #FFFFFF;
  --tenant-card-border: #E5E7EB;
  --tenant-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  /* === Typography === */
  --tenant-font-family: 'Pretendard', -apple-system, sans-serif;
  --tenant-heading-color: #111827;
  --tenant-body-color: #374151;
}
```

### 2.2 TypeScript 토큰 템플릿

```typescript
// src/styles/tenant/[tenant-id].ts
export const tenantTokens = {
  id: 'TENANT_ID',
  name: '테넌트 이름',

  brand: {
    primary: '#4C2D9A',
    primaryHover: '#3D2478',
    primaryLight: '#EDE9F6',
    secondary: '#6B7280',
    accent: '#10B981',
  },

  button: {
    primary: '#4C2D9A',
    primaryHover: '#3D2478',
    primaryText: '#FFFFFF',
  },

  link: {
    default: '#4C2D9A',
    hover: '#3D2478',
  },

  header: {
    bg: '#FFFFFF',
    text: '#333333',
  },

  navigation: {
    active: '#4C2D9A',
    activeBg: '#EDE9F6',
  },

  progress: {
    bar: '#4C2D9A',
    bg: '#E5E7EB',
    complete: '#10B981',
    incomplete: '#9CA3AF',
  },

  card: {
    bg: '#FFFFFF',
    border: '#E5E7EB',
    shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  typography: {
    fontFamily: "'Pretendard', -apple-system, sans-serif",
    headingColor: '#111827',
    bodyColor: '#374151',
  },
} as const;

export type TenantTokens = typeof tenantTokens;
```

---

## 3. 테넌트 토큰 적용

### 3.1 테넌트 감지 및 토큰 로드

```typescript
// src/hooks/common/useTenantTokens.ts
import { useEffect, useState } from 'react';
import { defaultTokens } from '@/styles/tenant/default';

export const useTenantTokens = (tenantId: string) => {
  const [tokens, setTokens] = useState(defaultTokens);

  useEffect(() => {
    const loadTenantTokens = async () => {
      try {
        // 동적으로 테넌트 토큰 로드
        const tenantTokens = await import(`@/styles/tenant/${tenantId}.ts`);
        setTokens(tenantTokens.default);

        // CSS 변수 적용
        document.documentElement.setAttribute('data-tenant', tenantId);
      } catch {
        // 테넌트 토큰이 없으면 기본값 사용
        console.warn(`Tenant tokens not found for: ${tenantId}`);
        setTokens(defaultTokens);
      }
    };

    loadTenantTokens();
  }, [tenantId]);

  return tokens;
};
```

### 3.2 테넌트 토큰 Provider

```typescript
// src/providers/TenantTokenProvider.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useTenantTokens } from '@/hooks/common/useTenantTokens';
import type { TenantTokens } from '@/styles/tenant/types';

const TenantTokenContext = createContext<TenantTokens | null>(null);

interface TenantTokenProviderProps {
  tenantId: string;
  children: ReactNode;
}

export const TenantTokenProvider = ({
  tenantId,
  children
}: TenantTokenProviderProps) => {
  const tokens = useTenantTokens(tenantId);

  return (
    <TenantTokenContext.Provider value={tokens}>
      {children}
    </TenantTokenContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantTokenContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantTokenProvider');
  }
  return context;
};
```

### 3.3 Tailwind 동적 적용

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 테넌트 토큰 (CSS 변수 참조)
        'tenant-primary': 'var(--tenant-primary)',
        'tenant-primary-hover': 'var(--tenant-primary-hover)',
        'tenant-primary-light': 'var(--tenant-primary-light)',
        'tenant-secondary': 'var(--tenant-secondary)',
        'tenant-accent': 'var(--tenant-accent)',

        // 테넌트 버튼
        'tenant-btn-primary': 'var(--tenant-btn-primary)',
        'tenant-btn-primary-hover': 'var(--tenant-btn-primary-hover)',

        // 테넌트 링크
        'tenant-link': 'var(--tenant-link)',
        'tenant-link-hover': 'var(--tenant-link-hover)',

        // 테넌트 진행률
        'tenant-progress': 'var(--tenant-progress)',
        'tenant-progress-bg': 'var(--tenant-progress-bg)',
      },
    },
  },
};
```

---

## 4. 테넌트별 토큰 예시

### 4.1 기본 테넌트 (Default)

```typescript
// src/styles/tenant/default.ts
export const defaultTokens = {
  id: 'default',
  name: 'Default Tenant',
  brand: {
    primary: '#4C2D9A',      // Indigo
    primaryHover: '#3D2478',
    primaryLight: '#EDE9F6',
    secondary: '#6B7280',
    accent: '#10B981',
  },
  // ... 나머지 토큰
};
```

### 4.2 테넌트 A 예시

```typescript
// src/styles/tenant/tenant-a.ts
export const tenantATokens = {
  id: 'tenant-a',
  name: 'Company A',
  brand: {
    primary: '#2563EB',      // Blue
    primaryHover: '#1D4ED8',
    primaryLight: '#EFF6FF',
    secondary: '#64748B',
    accent: '#F59E0B',
  },
  // ... 나머지 토큰
};
```

### 4.3 테넌트 B 예시

```typescript
// src/styles/tenant/tenant-b.ts
export const tenantBTokens = {
  id: 'tenant-b',
  name: 'Company B',
  brand: {
    primary: '#059669',      // Emerald
    primaryHover: '#047857',
    primaryLight: '#ECFDF5',
    secondary: '#6B7280',
    accent: '#F43F5E',
  },
  // ... 나머지 토큰
};
```

---

## 5. 컴포넌트에서 사용

### 5.1 테넌트 토큰 사용 예시

```typescript
// 학습자 화면의 버튼 컴포넌트
export const LearnerButton = ({ children, ...props }) => {
  return (
    <button
      className="bg-tenant-primary hover:bg-tenant-primary-hover text-white px-4 py-2 rounded-md"
      {...props}
    >
      {children}
    </button>
  );
};

// 학습 진행률 바
export const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <div className="w-full bg-tenant-progress-bg rounded-full h-2">
      <div
        className="bg-tenant-progress h-2 rounded-full transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// 링크 컴포넌트
export const TenantLink = ({ href, children }) => {
  return (
    <a
      href={href}
      className="text-tenant-link hover:text-tenant-link-hover underline"
    >
      {children}
    </a>
  );
};
```

---

## 6. 체크리스트

### 새 테넌트 추가 시

- [ ] `src/styles/tenant/[tenant-id].ts` 파일 생성
- [ ] `src/styles/tenant/[tenant-id].css` 파일 생성 (선택)
- [ ] 브랜드 컬러 설정 (Primary, Secondary, Accent)
- [ ] 버튼 컬러 설정
- [ ] 네비게이션 컬러 설정
- [ ] 진행률 바 컬러 설정
- [ ] 카드 스타일 설정
- [ ] 폰트 설정 (필요시)
- [ ] 접근성 대비율 검증 (4.5:1 이상)

### 테넌트 토큰 검증

- [ ] 모든 필수 토큰 정의 확인
- [ ] CSS 변수 네이밍 규칙 준수
- [ ] TypeScript 타입 정의 일치
- [ ] 다크/라이트 모드 대응 (필요시)

---

## 7. 관련 문서

- [01-DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md) - Admin 공통 디자인 토큰
- [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) - 디자인 구현 컨벤션
- [23-MULTI-TENANCY](../23-MULTI-TENANCY.md) - 멀티테넌시 아키텍처

# 19. Design Tokens - Tenant Template

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](../00-CONVENTIONS-CORE.md)

> 테넌시별 커스텀 디자인 토큰 템플릿

---

## 개요

SA(System Admin)에서 테넌트별 브랜드 색상을 설정하면, 해당 테넌트 로그인 시 자동으로 적용되는 시스템입니다.

### 적용 범위

| 항목 | 설명 |
|------|------|
| **적용 대상** | Step 인디케이터, CTA 버튼 (다음, 이전, 등록, 발행) |
| **미적용** | Input focus, 보조 버튼 (임시저장, 닫기), Admin 화면 |
| **설정 방법** | SP에서 테넌트 생성 시 브랜드 색상 지정 |

---

## 1. 구현 방식

### 1.1 적용 흐름

```
1. SP: 테넌트 생성 + 브랜드 색상 설정 (#2563EB)
   ↓
2. DB 저장: tenant.brand_color
   ↓
3. 테넌트 로그인 → applyTenantBrandColor() 자동 호출
   ↓
4. CSS Variable 동적 변경
   ↓
5. UI에 자동 반영
```

**예시:**
- SP가 "Company A" 생성 시 브랜드 색상 `#2563EB` (파랑) 지정
- Company A의 TO/TU 로그인 → Step 인디케이터, CTA 버튼이 파랑으로 표시

### 1.2 CSS 토큰

```css
/* src/index.css */
:root {
  /* 기본값: Admin 브랜드와 동일 */
  --color-tenant-primary: var(--color-btn-brand);
  --color-tenant-primary-hover: var(--color-btn-brand-hover);
  --color-tenant-primary-text: #FFFFFF;
}
```

### 1.3 컴포넌트 사용

```jsx
// Step 인디케이터
<div className={cn(
  'w-8 h-8 rounded-full',
  currentStep >= step ? 'bg-tenant-primary text-white' : 'bg-border text-text-secondary'
)}>
  {step}
</div>

// 연결선
<div className="bg-tenant-primary h-0.5" />

// Button
<Button variant="tenant">다음</Button>
```

### 1.4 색상 적용 구현

```typescript
// utils/tenantTheme.ts
export const applyTenantBrandColor = (brandColor: string) => {
  const root = document.documentElement;

  root.style.setProperty('--color-tenant-primary', brandColor);
  root.style.setProperty('--color-tenant-primary-hover', darkenColor(brandColor, 10));

  const lightness = calculateLightness(brandColor);
  const textColor = lightness > 60 ? '#000000' : '#FFFFFF';
  root.style.setProperty('--color-tenant-primary-text', textColor);
};
```

### 1.5 적용 시점

```typescript
// AuthProvider에서 자동 적용 (권장)
useEffect(() => {
  if (tenant?.brandColor) {
    applyTenantBrandColor(tenant.brandColor);
  }
}, [tenant?.brandColor]);
```


---

## 2. 체크리스트

### 테넌트 생성 (SP)

- [ ] 브랜드 색상 지정 (HEX 형식, 예: #4C2D9A)
- [ ] DB에 `tenant.brand_color` 저장
- [ ] 접근성 대비율 검증 (WCAG AA: 4.5:1 이상)

### 프론트엔드 적용

- [ ] `AuthProvider`에서 `applyTenantBrandColor()` 호출
- [ ] Step 인디케이터: `bg-tenant-primary` 사용
- [ ] CTA 버튼: `variant="tenant"` 사용
- [ ] Input focus: `focus:ring-action-primary` 유지 (tenant 금지)

---

## 3. 테넌트 토큰 템플릿 (미래 확장용)

향후 더 많은 커스터마이징이 필요할 경우를 위한 템플릿입니다.

### 3.1 TypeScript 토큰 예시

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

  navigation: {
    active: '#4C2D9A',
    activeBg: '#EDE9F6',
  },

  progress: {
    bar: '#4C2D9A',
    bg: '#E5E7EB',
  },
} as const;
```

### 3.2 확장 시 체크리스트

- [ ] `src/styles/tenant/[tenant-id].ts` 파일 생성
- [ ] 브랜드 컬러 설정 (Primary, Secondary, Accent)
- [ ] 버튼 컬러 설정
- [ ] 네비게이션 컬러 설정
- [ ] 진행률 바 컬러 설정
- [ ] 접근성 대비율 검증 (4.5:1 이상)
- [ ] CSS 변수 네이밍 규칙 준수
- [ ] TypeScript 타입 정의 일치

---

## 4. 관련 문서

- [01-DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md) - Admin 공통 디자인 토큰
- [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) - 디자인 구현 컨벤션

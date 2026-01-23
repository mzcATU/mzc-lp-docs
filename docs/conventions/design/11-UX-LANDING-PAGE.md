# 11. UX Landing Page

> 랜딩 페이지 테마 시스템 - 다이나믹 브랜딩, Light/Dark 테마

---

## 핵심 규칙

```
✅ CSS 변수로 동적 브랜딩 지원
✅ Light/Dark 테마 전환
✅ Glass-morphism 효과 사용
✅ 반응형 + 애니메이션 성능 최적화
```

---

## 1. 브랜딩 CSS 변수

> JavaScript로 동적 변경 가능

```css
:root {
  /* Primary Colors */
  --landing-primary-color: #6778ff;
  --landing-secondary-color: #a855f7;
  --landing-accent-color: #10B981;

  /* Gradient */
  --landing-gradient-from: #6778ff;
  --landing-gradient-to: #a855f7;

  /* Typography */
  --landing-heading-font: 'Pretendard', sans-serif;
  --landing-body-font: 'Pretendard', sans-serif;
}
```

---

## 2. 테마 클래스

### Light Theme (`.landing-light`)

```css
.landing-light {
  --landing-bg: #FAFAFA;
  --landing-bg-card: #FFFFFF;
  --landing-text-primary: #333333;
  --landing-text-secondary: #666666;
  --landing-border: #E0E0E0;
  --landing-header-bg: rgba(255, 255, 255, 0.9);
}
```

### Dark Theme (`.landing-dark`)

```css
.landing-dark {
  --landing-bg: #1e1e1e;
  --landing-bg-card: rgba(255, 255, 255, 0.05);
  --landing-text-primary: #FFFFFF;
  --landing-text-secondary: #D4D4D4;
  --landing-border: rgba(255, 255, 255, 0.1);
  --landing-header-bg: rgba(30, 30, 30, 0.95);
}
```

---

## 3. 유틸리티 클래스

### Glass Effect

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-dark {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(15px);
}
```

### Button Styles

```css
.landing-btn-primary {
  background: linear-gradient(135deg, var(--landing-primary-color), var(--landing-secondary-color));
  color: #ffffff;
}

.landing-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--landing-primary-color) 40%, transparent);
}

.landing-btn-outline {
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### Card Styles

```css
.landing-card {
  background: var(--landing-card-bg);
  border: 1px solid var(--landing-card-border);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(90deg, var(--landing-accent-color), var(--landing-primary-color), #6bc2f0);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 4s ease infinite;
}
```

---

## 4. 섹션별 스타일

### Hero Section

```css
.animated-bg {
  background: linear-gradient(-45deg, #1a1a2e, #2a2a4e, #243358, #1a1a2e);
  background-size: 400% 400%;
  animation: bg-gradient 15s ease infinite;
}
```

### Category Chip

```css
/* Dark */
.landing-dark .category-chip {
  background: rgba(255, 255, 255, 0.05);
  color: #9E9E9E;
}

.landing-dark .category-chip.active {
  background: linear-gradient(135deg, #6778ff, #a855f7);
  color: #FFFFFF;
}

/* Light */
.landing-light .category-chip {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
}
```

---

## 5. 사용 예시

### 테마 적용

```tsx
<div className={cn("landing-page", isDark ? "landing-dark" : "landing-light")}>
  <header className="glass-dark">...</header>
  <main>
    <section className="animated-bg">Hero</section>
    <section className="landing-section-alt">Courses</section>
  </main>
</div>
```

### 동적 브랜딩 변경

```typescript
const applyBranding = (primaryColor: string, secondaryColor: string) => {
  document.documentElement.style.setProperty('--landing-primary-color', primaryColor);
  document.documentElement.style.setProperty('--landing-secondary-color', secondaryColor);
  document.documentElement.style.setProperty('--landing-gradient-from', primaryColor);
  document.documentElement.style.setProperty('--landing-gradient-to', secondaryColor);
};
```

---

## 6. 주요 클래스 참조

| 클래스 | 용도 |
|--------|------|
| `.landing-page` | 페이지 컨테이너 |
| `.landing-dark` / `.landing-light` | 테마 |
| `.glass` / `.glass-dark` | Glass 효과 |
| `.animated-bg` | Hero 배경 |
| `.gradient-text` | 그라디언트 텍스트 |
| `.landing-btn-primary` | Primary 버튼 |
| `.landing-btn-outline` | Outline 버튼 |
| `.landing-card` | 카드 |
| `.card-hover` | 카드 호버 효과 |
| `.hover-glow` | Glow 호버 효과 |
| `.category-chip` | 카테고리 칩 |

---

## 소스 참조

| 파일 | 설명 |
|------|------|
| [user-site-design-tokens.ts](../../../mzc-lp-frontend/src/styles/user-site-design-tokens.ts) | User Site 토큰 |
| [index.css](../../../mzc-lp-frontend/src/index.css) | 랜딩 페이지 CSS 클래스 |

---

## 관련 문서

- [01-DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md) - Admin 토큰
- [07-UX-ANIMATIONS](./07-UX-ANIMATIONS.md) - 애니메이션

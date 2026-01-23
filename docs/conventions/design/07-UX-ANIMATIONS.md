# 07. UX Animations

> 애니메이션 및 트랜지션 규칙 - Duration, Easing, 모션 패턴

---

## 핵심 규칙

```
✅ 의미 있는 애니메이션만 사용 (장식용 X)
✅ 일관된 Duration과 Easing
✅ prefers-reduced-motion 존중
✅ transform, opacity만 애니메이션 (성능)
```

---

## 1. Duration 가이드

| 이름 | 값 | 용도 |
|------|-----|------|
| instant | 0ms | 포커스 링 |
| fast | 100ms | 버튼 hover |
| normal | 150-200ms | 색상 변경, 토글 |
| moderate | 250-300ms | 드롭다운, 아코디언 |
| slow | 400-500ms | 모달, 페이지 전환 |

---

## 2. Easing 가이드

| 이름 | CSS | 용도 |
|------|-----|------|
| ease-out | `cubic-bezier(0, 0, 0.2, 1)` | 요소 진입 (열림) |
| ease-in | `cubic-bezier(0.4, 0, 1, 1)` | 요소 퇴장 (닫힘) |
| ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | 상태 전환 |

---

## 3. 컴포넌트별 애니메이션

### Button

| 상태 | 속성 | Duration |
|------|------|----------|
| Hover | background-color | 150ms |
| Active | transform (scale) | 75ms |
| Focus | box-shadow | 150ms |

### Modal/Dialog

| 요소 | 동작 | Duration | 속성 |
|------|------|----------|------|
| Backdrop | 열림 | 300ms | opacity |
| Modal | 열림 | 300ms | opacity, scale, translate |
| Modal | 닫힘 | 200ms | opacity, scale |

### Dropdown

| 동작 | Duration | 속성 |
|------|----------|------|
| 열림 | 200ms | opacity, scale |
| 닫힘 | 150ms | opacity, scale |

### Toast

| 동작 | Duration | 속성 |
|------|----------|------|
| 진입 | 300ms | opacity, translate |
| 퇴장 | 200ms | opacity, translate |

---

## 4. 랜딩 페이지 애니메이션

### Gradient Text Animation

```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.gradient-text {
  background: linear-gradient(90deg, var(--landing-accent-color), var(--landing-primary-color), #6bc2f0);
  background-size: 300% 100%;
  animation: gradient-shift 4s ease infinite;
}
```

### Animated Background

```css
@keyframes bg-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animated-bg {
  background: linear-gradient(-45deg, #1a1a2e, #2a2a4e, #243358, #1a1a2e);
  background-size: 400% 400%;
  animation: bg-gradient 15s ease infinite;
}
```

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

### Hover Effects

```css
.hover-glow:hover {
  box-shadow: 0 0 30px color-mix(in srgb, var(--landing-primary-color) 30%, transparent);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

---

## 5. 접근성: 모션 감소

```tsx
// Tailwind
<div className="transition-all motion-reduce:transition-none">

// CSS
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 6. 성능 가이드

| 권장 (GPU 가속) | 비권장 (리플로우) |
|----------------|------------------|
| `transform` | `width`, `height` |
| `opacity` | `margin`, `padding` |
| `filter` | `top`, `left` |

---

## 관련 문서

- [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) - 디자인 기본 규칙
- [11-UX-LANDING-PAGE](./11-UX-LANDING-PAGE.md) - 랜딩 페이지 스타일

# 07. UX Animations

> 애니메이션 및 트랜지션 규칙 - Duration, Easing, 모션 패턴

---

## 핵심 규칙

```
✅ 의미 있는 애니메이션만 사용 (장식용 X)
✅ 일관된 Duration과 Easing 사용
✅ 모션 감소 설정 존중 (prefers-reduced-motion)
✅ 성능 고려 (transform, opacity만 애니메이션)
```

---

## 1. Duration 가이드

### 1.1 Duration 체계

| 이름 | 값 | 용도 | 예시 |
|------|-----|------|------|
| **instant** | 0ms | 즉시 반응 | 포커스 링 |
| **fast** | 100ms | 마이크로 인터랙션 | 버튼 hover |
| **normal** | 150-200ms | 일반 트랜지션 | 색상 변경, 토글 |
| **moderate** | 250-300ms | 컴포넌트 상태 변경 | 드롭다운, 아코디언 |
| **slow** | 400-500ms | 큰 레이아웃 변경 | 모달 열기, 페이지 전환 |

### 1.2 Tailwind Duration 클래스

```tsx
// Tailwind 기본 제공
duration-75    // 75ms
duration-100   // 100ms
duration-150   // 150ms (권장: 일반)
duration-200   // 200ms (권장: 일반)
duration-300   // 300ms (권장: 컴포넌트)
duration-500   // 500ms (권장: 레이아웃)
duration-700   // 700ms
duration-1000  // 1000ms
```

---

## 2. Easing 가이드

### 2.1 Easing 체계

| 이름 | Tailwind | CSS | 용도 |
|------|----------|-----|------|
| **ease-out** | `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | 요소 진입 (열림) |
| **ease-in** | `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 요소 퇴장 (닫힘) |
| **ease-in-out** | `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | 상태 전환 |
| **linear** | `ease-linear` | `linear` | 프로그레스 바 |

### 2.2 사용 예시

```tsx
// 열림 (ease-out): 빠르게 시작 → 천천히 끝
<div className="transition-all duration-300 ease-out">

// 닫힘 (ease-in): 천천히 시작 → 빠르게 끝
<div className="transition-all duration-200 ease-in">

// 상태 전환 (ease-in-out): 부드러운 시작과 끝
<div className="transition-colors duration-150 ease-in-out">
```

---

## 3. 컴포넌트별 애니메이션

### 3.1 버튼

```tsx
// 버튼 기본 트랜지션
<button className="
  transition-colors duration-150 ease-in-out
  hover:bg-btn-brand-hover
  active:scale-[0.98]          // 클릭 시 살짝 축소
  active:transition-transform active:duration-75
">
  버튼
</button>
```

**상태별 애니메이션:**

| 상태 | 속성 | Duration | Easing |
|------|------|----------|--------|
| Hover | background-color | 150ms | ease-in-out |
| Active | transform (scale) | 75ms | ease-out |
| Focus | box-shadow | 150ms | ease-out |

---

### 3.2 드롭다운 / 셀렉트

```
[닫힘]                    [열림]
┌──────────────┐         ┌──────────────┐
│  선택       ▼│   →     │  선택       ▲│
└──────────────┘         ├──────────────┤
                         │  옵션 1      │  ← 페이드 + 슬라이드
                         │  옵션 2      │
                         │  옵션 3      │
                         └──────────────┘
```

```tsx
// 드롭다운 메뉴 애니메이션
<div className={cn(
  "transition-all duration-200 ease-out",
  "origin-top",
  isOpen
    ? "opacity-100 scale-y-100"
    : "opacity-0 scale-y-95 pointer-events-none"
)}>
  {/* 메뉴 콘텐츠 */}
</div>
```

**애니메이션 스펙:**

| 동작 | Duration | Easing | 속성 |
|------|----------|--------|------|
| 열림 | 200ms | ease-out | opacity, scale |
| 닫힘 | 150ms | ease-in | opacity, scale |

---

### 3.3 모달 / 다이얼로그

```
[닫힘]                         [열림]
                              ┌────────────────┐
░░░░░░░░░░░░░    →           │    Modal       │
░░░░░░░░░░░░░                │    Content     │
░░░░░░░░░░░░░                └────────────────┘
(투명)                        (Backdrop + Modal)
```

```tsx
// Backdrop
<div className={cn(
  "fixed inset-0 bg-black/50",
  "transition-opacity duration-300",
  isOpen ? "opacity-100" : "opacity-0"
)} />

// Modal
<div className={cn(
  "transition-all duration-300 ease-out",
  isOpen
    ? "opacity-100 scale-100 translate-y-0"
    : "opacity-0 scale-95 translate-y-4"
)}>
  {/* 모달 콘텐츠 */}
</div>
```

**애니메이션 스펙:**

| 요소 | 동작 | Duration | Easing | 속성 |
|------|------|----------|--------|------|
| Backdrop | 열림 | 300ms | ease-out | opacity |
| Backdrop | 닫힘 | 200ms | ease-in | opacity |
| Modal | 열림 | 300ms | ease-out | opacity, scale, translate |
| Modal | 닫힘 | 200ms | ease-in | opacity, scale |

---

### 3.4 아코디언

```
[닫힘]                         [열림]
┌────────────────────┐        ┌────────────────────┐
│  섹션 제목       ▶ │   →    │  섹션 제목       ▼ │
└────────────────────┘        ├────────────────────┤
                              │                    │
                              │  펼쳐진 콘텐츠     │  ← 높이 애니메이션
                              │                    │
                              └────────────────────┘
```

```tsx
// 아코디언 콘텐츠
<div className={cn(
  "overflow-hidden transition-all duration-300 ease-out",
  isOpen ? "max-h-96" : "max-h-0"
)}>
  <div className="p-4">
    {/* 콘텐츠 */}
  </div>
</div>

// 화살표 아이콘 회전
<ChevronRight className={cn(
  "transition-transform duration-200",
  isOpen && "rotate-90"
)} />
```

---

### 3.5 토스트 / 알림

```
                              ┌────────────────────┐
(화면 밖)   →   (슬라이드 인)  │  ✅ 저장되었습니다  │
                              └────────────────────┘
                                      │
                                      ↓ (3초 후)
                              ┌────────────────────┐
(슬라이드 아웃)  ←            │  ✅ 저장되었습니다  │
                              └────────────────────┘
```

```tsx
// 토스트 애니메이션 (우측 상단)
<div className={cn(
  "fixed top-4 right-4",
  "transition-all duration-300",
  isVisible
    ? "opacity-100 translate-x-0"
    : "opacity-0 translate-x-full"
)}>
  {/* 토스트 콘텐츠 */}
</div>
```

**애니메이션 스펙:**

| 동작 | Duration | Easing | 속성 |
|------|----------|--------|------|
| 진입 | 300ms | ease-out | opacity, translate |
| 퇴장 | 200ms | ease-in | opacity, translate |

---

### 3.6 스켈레톤 로딩

```tsx
// 펄스 애니메이션
<div className="animate-pulse bg-gray-200 rounded h-4 w-full" />

// 커스텀: 시머 효과
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 4. 페이지 전환

### 4.1 기본 전환

```tsx
// 페이지 컨테이너
<div className="
  animate-in fade-in duration-300
  slide-in-from-bottom-4
">
  {/* 페이지 콘텐츠 */}
</div>
```

### 4.2 전환 유형

| 유형 | 애니메이션 | 용도 |
|------|-----------|------|
| 기본 | fade-in | 일반 페이지 이동 |
| 드릴다운 | slide-in-from-right | 상세 페이지 진입 |
| 뒤로가기 | slide-in-from-left | 이전 페이지로 |
| 모달 오픈 | fade-in + scale | 오버레이 컨텐츠 |

---

## 5. 접근성: 모션 감소

### 5.1 prefers-reduced-motion

```tsx
// Tailwind로 모션 감소 지원
<div className="
  transition-all duration-300
  motion-reduce:transition-none
  motion-reduce:animate-none
">
  {/* 콘텐츠 */}
</div>
```

### 5.2 CSS로 전역 처리

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. 성능 가이드

### 6.1 권장 속성

| 권장 (GPU 가속) | 비권장 (리플로우 유발) |
|----------------|---------------------|
| `transform` | `width`, `height` |
| `opacity` | `margin`, `padding` |
| `filter` | `top`, `left`, `right`, `bottom` |
| | `font-size` |

```tsx
// ✅ 권장: transform 사용
<div className="transition-transform translate-x-0 hover:translate-x-2">

// ❌ 비권장: left 사용
<div className="transition-all left-0 hover:left-2">
```

### 6.2 will-change 사용

```tsx
// 복잡한 애니메이션 전 힌트
<div className="will-change-transform">
  {/* 애니메이션될 요소 */}
</div>

// 애니메이션 후 제거 (메모리 절약)
```

---

## 7. 애니메이션 토큰

### CSS 변수로 정의

```css
:root {
  /* Duration */
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-moderate: 300ms;
  --duration-slow: 500ms;

  /* Easing */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 8. 체크리스트

### 애니메이션 구현 시

- [ ] 의미 있는 애니메이션인가?
- [ ] 일관된 Duration/Easing 사용
- [ ] transform/opacity만 애니메이션
- [ ] prefers-reduced-motion 지원
- [ ] 60fps 유지 확인
- [ ] 모바일에서 테스트

---

## 관련 문서

- [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) - 디자인 기본 규칙
- [05-UX-COMPONENTS](./05-UX-COMPONENTS.md) - 컴포넌트 인터랙션
- [06-UX-RESPONSIVE](./06-UX-RESPONSIVE.md) - 반응형 디자인

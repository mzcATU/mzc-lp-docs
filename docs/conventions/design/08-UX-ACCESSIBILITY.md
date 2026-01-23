# 08. UX Accessibility

> 접근성 가이드 - 키보드, 스크린 리더, 대비율, WCAG 준수

---

## 핵심 규칙

```
✅ WCAG 2.1 AA 준수 필수
✅ 모든 인터랙티브 요소 키보드 접근 가능
✅ 스크린 리더 호환성 확보
✅ 색상 대비율 4.5:1 이상 유지
✅ 모션 감소 설정 존중
```

---

## 1. WCAG 2.1 AA 요구사항

### 1.1 주요 기준

| 원칙 | 항목 | 요구사항 |
|------|------|---------|
| **인식 가능** | 텍스트 대비 | 4.5:1 (일반), 3:1 (큰 텍스트) |
| | 비텍스트 대비 | 3:1 (UI 컴포넌트, 그래픽) |
| | 이미지 대체 텍스트 | alt 속성 필수 |
| **운용 가능** | 키보드 접근 | 모든 기능 키보드로 사용 가능 |
| | 포커스 표시 | 명확한 포커스 인디케이터 |
| | 충분한 시간 | 시간 제한 조절 가능 |
| **이해 가능** | 오류 식별 | 에러 메시지 명확히 표시 |
| | 레이블 | 입력 필드 레이블 제공 |
| **견고함** | 호환성 | 보조 기술과 호환 |

---

## 2. 키보드 접근성

### 2.1 필수 키보드 지원

| 키 | 동작 |
|-----|------|
| `Tab` | 다음 포커스 요소로 이동 |
| `Shift + Tab` | 이전 포커스 요소로 이동 |
| `Enter` / `Space` | 버튼 클릭, 링크 활성화 |
| `Escape` | 모달/드롭다운 닫기 |
| `Arrow Keys` | 메뉴/리스트 내 이동 |
| `Home` / `End` | 첫/마지막 항목으로 이동 |

### 2.2 포커스 순서

```
┌─────────────────────────────────────────────────────────────┐
│  [1] Header Logo    [2] Nav Link 1    [3] Nav Link 2       │
├────────────────┬────────────────────────────────────────────┤
│  [4] Sidebar   │  [5] Main Title                           │
│  [5] Menu 1    │  [6] Form Field 1                         │
│  [6] Menu 2    │  [7] Form Field 2                         │
│  [7] Menu 3    │  [8] Submit Button                        │
└────────────────┴────────────────────────────────────────────┘
```

```tsx
// 포커스 순서 조정 (필요시)
<div tabIndex={0}>포커스 가능 요소</div>
<div tabIndex={-1}>프로그래밍으로만 포커스</div>

// 포커스 순서에서 제외
<div tabIndex={-1} aria-hidden="true">장식용 요소</div>
```

### 2.3 포커스 트랩 (모달)

```tsx
// 모달 내 포커스 트랩
function Modal({ isOpen, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 모달 열릴 때 첫 번째 요소에 포커스
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (firstFocusable as HTMLElement)?.focus();
    }
  }, [isOpen]);

  // Tab 키 트랩 처리
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      // 포커스가 모달 내에서만 순환하도록
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}
```

---

## 3. 포커스 스타일

### 3.1 포커스 인디케이터

```
┌─────────────────────────────────────────────────────────────┐
│  [Default]              [Focused]                           │
│  ┌────────────┐        ┌────────────┐                      │
│  │   버튼    │        │   버튼    │ ← focus ring          │
│  └────────────┘        └────────────┘                      │
│                        └──────────────┘ (2px offset)       │
│                          Brand Color                        │
└─────────────────────────────────────────────────────────────┘
```

```tsx
// Tailwind 포커스 스타일
<button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-btn-brand
  focus-visible:ring-offset-2
">
  버튼
</button>

// focus-visible: 키보드 포커스만 표시 (마우스 클릭 X)
```

### 3.2 포커스 스타일 토큰

```css
:root {
  --focus-ring-width: 2px;
  --focus-ring-color: var(--btn-brand);
  --focus-ring-offset: 2px;
}

/* 전역 포커스 스타일 */
*:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

---

## 4. 스크린 리더 지원

### 4.1 시맨틱 HTML

```tsx
// ✅ 시맨틱 태그 사용
<header>...</header>
<nav>...</nav>
<main>...</main>
<aside>...</aside>
<footer>...</footer>

// ❌ div만 사용
<div className="header">...</div>
```

### 4.2 ARIA 속성

| 속성 | 용도 | 예시 |
|------|------|------|
| `aria-label` | 요소에 라벨 제공 | `<button aria-label="닫기">X</button>` |
| `aria-labelledby` | 다른 요소를 라벨로 참조 | `<div aria-labelledby="title-id">` |
| `aria-describedby` | 추가 설명 연결 | `<input aria-describedby="hint-id">` |
| `aria-hidden` | 스크린 리더에서 숨김 | `<div aria-hidden="true">장식</div>` |
| `aria-live` | 동적 콘텐츠 알림 | `<div aria-live="polite">업데이트</div>` |
| `aria-expanded` | 확장/축소 상태 | `<button aria-expanded="true">` |
| `aria-current` | 현재 항목 표시 | `<a aria-current="page">현재 페이지</a>` |

### 4.3 역할(Role)

```tsx
// 버튼처럼 동작하는 요소
<div role="button" tabIndex={0} onClick={handleClick}>
  클릭 가능
</div>

// 모달
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">모달 제목</h2>
</div>

// 알림
<div role="alert">에러가 발생했습니다.</div>

// 탭
<div role="tablist">
  <button role="tab" aria-selected="true">탭 1</button>
  <button role="tab" aria-selected="false">탭 2</button>
</div>
```

### 4.4 라이브 리전 (동적 알림)

```tsx
// 토스트 알림
<div
  role="status"
  aria-live="polite"      // 현재 읽기 완료 후 알림
  aria-atomic="true"      // 전체 내용 읽기
>
  저장되었습니다.
</div>

// 중요한 에러
<div
  role="alert"
  aria-live="assertive"   // 즉시 알림 (읽기 중단)
>
  세션이 만료되었습니다.
</div>
```

---

## 5. 색상 대비율

### 5.1 대비율 요구사항

| 텍스트 크기 | 최소 대비율 | 예시 |
|------------|-----------|------|
| 일반 텍스트 (< 18px) | 4.5:1 | 본문 |
| 큰 텍스트 (≥ 18px bold / 24px) | 3:1 | 제목 |
| UI 컴포넌트 | 3:1 | 버튼 테두리, 아이콘 |

### 5.2 현재 디자인 토큰 대비율

| 조합 | 대비율 | 준수 |
|------|--------|------|
| `text-primary` (#333333) on `bg-default` (#FFFFFF) | 12.6:1 | ✅ AAA |
| `text-secondary` (#666666) on `bg-default` (#FFFFFF) | 5.7:1 | ✅ AA |
| `text-tertiary` (#999999) on `bg-default` (#FFFFFF) | 2.8:1 | ⚠️ 큰 텍스트만 |
| `btn-brand` (#4F46E5) on white | 4.6:1 | ✅ AA |
| white on `btn-brand` (#4F46E5) | 4.6:1 | ✅ AA |

### 5.3 대비율 검사 도구

```tsx
// 개발 시 대비율 확인
// - Chrome DevTools > Accessibility
// - WebAIM Contrast Checker
// - Figma Contrast Plugin
```

---

## 6. 이미지 접근성

### 6.1 대체 텍스트

```tsx
// 의미 있는 이미지
<img src="chart.png" alt="월별 매출 그래프: 12월 최고 매출 기록" />

// 장식용 이미지
<img src="decoration.png" alt="" role="presentation" />

// 아이콘 버튼
<button aria-label="검색">
  <SearchIcon aria-hidden="true" />
</button>

// 아이콘 + 텍스트
<button>
  <SaveIcon aria-hidden="true" />
  <span>저장</span>
</button>
```

---

## 7. 폼 접근성

### 7.1 레이블 연결

```tsx
// 명시적 연결
<label htmlFor="email">이메일</label>
<input id="email" type="email" />

// 암시적 연결
<label>
  이메일
  <input type="email" />
</label>

// 시각적으로 숨긴 레이블
<label htmlFor="search" className="sr-only">검색</label>
<input id="search" type="search" placeholder="검색..." />
```

### 7.2 에러 상태

```tsx
<div>
  <label htmlFor="email">이메일 *</label>
  <input
    id="email"
    type="email"
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : undefined}
  />
  {error && (
    <p id="email-error" role="alert" className="text-status-error">
      유효한 이메일을 입력해주세요.
    </p>
  )}
</div>
```

### 7.3 필수 필드

```tsx
<label htmlFor="name">
  이름
  <span aria-hidden="true" className="text-status-error">*</span>
</label>
<input id="name" required aria-required="true" />
```

---

## 8. 모션 접근성

### 8.1 모션 감소 지원

```tsx
// Tailwind
<div className="
  animate-bounce
  motion-reduce:animate-none
">
  {/* 콘텐츠 */}
</div>

// CSS
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8.2 자동 재생 콘텐츠

```tsx
// 자동 재생 비디오는 일시정지 버튼 필수
<video autoPlay muted>
  <source src="video.mp4" />
</video>
<button onClick={togglePlay}>
  {isPlaying ? '일시정지' : '재생'}
</button>

// 또는 autoPlay 사용 금지
<video controls>
  <source src="video.mp4" />
</video>
```

---

## 9. 스크린 리더 전용 텍스트

```tsx
// sr-only 클래스 (시각적으로 숨김, 스크린 리더는 읽음)
<span className="sr-only">현재 페이지:</span>
<span>대시보드</span>

// Tailwind sr-only
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 10. 체크리스트

### 컴포넌트 개발 시

- [ ] 키보드로 모든 기능 사용 가능
- [ ] Tab 순서가 논리적
- [ ] 포커스 스타일 명확
- [ ] 적절한 ARIA 속성 사용
- [ ] 색상 대비율 4.5:1 이상
- [ ] 이미지 대체 텍스트 제공
- [ ] 폼 레이블 연결
- [ ] 에러 메시지 접근 가능
- [ ] 모션 감소 설정 존중

### 페이지 개발 시

- [ ] 시맨틱 HTML 사용
- [ ] 랜드마크 영역 정의 (header, nav, main, footer)
- [ ] 제목 계층 구조 유지 (h1 → h2 → h3)
- [ ] 스킵 링크 제공
- [ ] 라이브 리전으로 동적 알림

---

## 관련 문서

- [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) - 접근성 기본 규칙
- [01-DESIGN-TOKENS-COMMON](./01-DESIGN-TOKENS-COMMON.md) - 색상 대비율
- [07-UX-ANIMATIONS](./07-UX-ANIMATIONS.md) - 모션 접근성
- [09-UX-ERROR-MESSAGES](./09-UX-ERROR-MESSAGES.md) - 에러 메시지 접근성

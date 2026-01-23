# 05. UX Components

> 컴포넌트별 UX 가이드 - 상태, 인터랙션, 카탈로그

---

## 공통 컴포넌트 카탈로그

> **데모**: `/showcase` | **소스**: `src/components/common/index.ts`

### 10개 카테고리 (66+ 컴포넌트)

| # | 카테고리 | 주요 컴포넌트 |
|---|----------|--------------|
| 1 | **PRIMITIVES** | Button, Input, Textarea, Label, Badge, Separator, Skeleton |
| 2 | **FORM INPUTS** | Checkbox, Switch, Select, NativeSelect, Combobox, MultiCombobox, RadioGroup, RadioOptionCard, TagInput, Slider, Form, DatePicker, DateRangePicker, TimePicker |
| 3 | **OVERLAY** | Dialog, AlertDialog, Sheet, Drawer, Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu, Command |
| 4 | **LAYOUT** | Card, Tabs, Accordion, Collapsible, ScrollArea, AspectRatio, Resizable |
| 5 | **DATA DISPLAY** | Table, DataTable, Avatar, Progress, Calendar, Chart, Timeline, HorizontalTimeline |
| 6 | **FEEDBACK** | Alert, Toaster (Sonner), EmptyState, NoResultsEmpty, NoDataEmpty, QualityRatingBadge |
| 7 | **NAVIGATION** | BackButton, Breadcrumb, NavigationMenu, Menubar, Pagination, Stepper, ViewToggle |
| 8 | **DOMAIN** | IconStatCard, StatsCard, SettingsCard, FileUpload, ImageUpload, KanbanBoard, Carousel, Toggle, ToggleGroup |
| 9 | **AUTH** | ProtectedRoute, ProfileRequiredRoute |
| 10 | **WISHLIST** | WishlistButton |

---

## 빠른 참조: 기능별 선택

| 기능 | 컴포넌트 | 비고 |
|------|----------|------|
| 테이블 | **DataTable** | 정렬/필터/페이지네이션 |
| 드롭다운 (단순) | **NativeSelect** | HTML select 기반 |
| 드롭다운 (커스텀) | **Select** | Radix 기반 |
| 드롭다운 (검색) | **Combobox** / **MultiCombobox** | 옵션 많을 때 |
| 모달 | **Dialog** / **AlertDialog** / **Sheet** | 용도별 선택 |
| 빈 상태 | **EmptyState** / **NoDataEmpty** | 데이터 없음 |
| 알림 | **Toaster** (토스트) / **Alert** (인라인) | |
| 통계 카드 | **IconStatCard** / **StatsCard** | 대시보드 |
| 날짜/시간 | **DatePicker** / **DateRangePicker** / **TimePicker** | |
| 로딩 | **Skeleton** | 스켈레톤 UI |
| 인증 보호 | **ProtectedRoute** / **ProfileRequiredRoute** | 라우트 보호 |
| 찜하기 | **WishlistButton** | 강의 찜 |

---

## 핵심 규칙

```
✅ 모든 인터랙티브 요소에 상태 피드백 (hover, focus, active, disabled)
✅ 키보드 접근성 보장 (Tab, Enter, Escape)
✅ 로딩/에러/성공 상태 처리
✅ 일관된 스타일과 동작 유지
```

---

## 컴포넌트 UX 가이드

### Button 상태

| 상태 | 시각적 변화 | 접근성 |
|------|------------|--------|
| Default | 기본 배경색 | - |
| Hover | 배경 어두워짐 | - |
| Focus | ring 표시 | Tab 이동 |
| Active | 더 어두워짐 | 클릭 순간 |
| Disabled | opacity-50 | aria-disabled |
| Loading | Spinner + 비활성화 | aria-busy |

### Button 배치 규칙

```
[폼 하단]   [ 취소(Ghost) ]  [ 저장(Brand) ]  ← 우측 정렬
[목록 헤더] 제목 ─────────── [ + 새 항목 ]    ← 우측 상단
```

### Modal/Dialog

| 요소 | 가이드 |
|------|--------|
| 열기 | fade-in 200ms |
| 닫기 | X, 취소, Escape, Backdrop 클릭 |
| 포커스 | 모달 내부로 이동 + 트랩 |
| 버튼 순서 | 좌: 취소(Ghost), 우: 확인(Primary) |

### AlertDialog 유형

| 유형 | 버튼 | 색상 |
|------|------|------|
| 정보 확인 | 확인 | Brand |
| 삭제 확인 | 삭제 | Danger |
| 경고 | 계속 | Warning |

### FileUpload 상태

| 상태 | 피드백 |
|------|--------|
| 기본 | 점선 테두리, 안내 텍스트 |
| 드래그 중 | 테두리 강조, 배경색 변경 |
| 업로드 중 | Progress Bar, 취소 버튼 |
| 완료 | ✅ 체크 표시 |
| 에러 | 빨간 테두리, 재시도 버튼 |

### Skeleton 패턴

```tsx
// 카드
<Skeleton className="h-48 w-full rounded-lg" />
<Skeleton className="h-4 w-3/4" />

// 아바타 + 텍스트
<Skeleton className="h-12 w-12 rounded-full" />
<Skeleton className="h-4 w-32" />
```

---

## 컴포넌트 추가 체크리스트

- [ ] 상태 정의 (default, hover, focus, disabled, loading, error)
- [ ] 키보드 접근성 (Tab, Enter, Escape)
- [ ] 스크린 리더 지원 (aria-label, role)
- [ ] 애니메이션 (열기/닫기)
- [ ] 반응형 처리
- [ ] `components/common/index.ts`에 export 추가

---

## 소스 참조

| 파일 | 설명 |
|------|------|
| [components/common/index.ts](../../../mzc-lp-frontend/src/components/common/index.ts) | 컴포넌트 export |
| [admin-design-tokens.ts](../../../mzc-lp-frontend/src/styles/admin-design-tokens.ts) | Admin 토큰 |
| [user-site-design-tokens.ts](../../../mzc-lp-frontend/src/styles/user-site-design-tokens.ts) | User Site 토큰 |

---

## 관련 문서

- [03-UX-PATTERNS](./03-UX-PATTERNS.md) - UX 패턴
- [00-DESIGN-CONVENTIONS](./00-DESIGN-CONVENTIONS.md) - 디자인 컨벤션
- [12-REACT-COMPONENT-CONVENTIONS](../12-REACT-COMPONENT-CONVENTIONS.md) - 컴포넌트 개발

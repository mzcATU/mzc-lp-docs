# Frontend TU (Tenant User) 개발 로그 - Phase 13

> 찜/장바구니 CourseTime 기반으로 변경

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-05 |
| **관련 이슈** | [#207](https://github.com/mzcATU/mzc-lp-frontend/issues/207) |
| **관련 PR** | TBD |
| **관련 브랜치** | feat/tu-cart-wishlist-coursetime |
| **담당 모듈** | TU (Tenant User) - Cart & Wishlist |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 기존 찜/장바구니가 Course(강의 설계 템플릿) 기반으로 구현되어 있음 |
| 원인 | Course = 강의 설계 템플릿, CourseTime = 실제 수강 가능한 차수. 학습자는 CourseTime을 담아야 함 |
| 해결 | 찜/장바구니를 CourseTime 기반으로 변경 (백엔드 API 변경 완료) |

### 1.2 데이터 모델 변경

```
[Before - Course 기반]
┌─────────────────────────────────────────────────────────────┐
│ CartItem / WishlistItem                                      │
│ - courseId: number                                           │
│ - courseTitle: string                                        │
│ - ...                                                        │
└─────────────────────────────────────────────────────────────┘

[After - CourseTime 기반]
┌─────────────────────────────────────────────────────────────┐
│ CartItem / WishlistItem                                      │
│ - courseTimeId: number                                       │
│ - courseTimeTitle: string                                    │
│ - isFree: boolean                                            │
│ - price: string | null                                       │
│ - ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 구현 범위

| 구분 | 내용 |
|------|------|
| Types | CartItemResponse, WishlistItemResponse 필드 변경 |
| Endpoints | WISHLIST 엔드포인트 경로 변경 |
| Service | cartService, wishlistService 업데이트 |
| Hooks | useCartQueries, useWishlistQueries Query Key 변경 |
| Pages | CartPage, WishlistPage 전체 리팩토링 |
| Components | WishlistButton props 변경 |

---

## 2. 타입 변경

### 2.1 cart.types.ts

```typescript
// Before
export interface CartItemResponse {
  cartItemId: number;
  courseId: number;
  courseTitle: string;
  courseDescription: string | null;
  thumbnailUrl: string | null;
  level: string | null;
  type: string | null;
  estimatedHours: number | null;
  addedAt: string;
}

export interface CartAddRequest {
  courseId: number;
}

export interface CartRemoveRequest {
  courseIds: number[];
}

// After
export interface CartItemResponse {
  cartItemId: number;
  courseTimeId: number;
  courseTimeTitle: string;
  thumbnailUrl: string | null;
  level: string | null;
  estimatedHours: number | null;
  isFree: boolean;
  price: string | null;
  addedAt: string;
}

export interface CartAddRequest {
  courseTimeId: number;
}

export interface CartRemoveRequest {
  courseTimeIds: number[];
}
```

### 2.2 wishlist.types.ts

```typescript
// Before
export interface WishlistItemResponse {
  id: number;
  courseId: number;
  courseTitle: string | null;
  courseLevel: string | null;
  courseType: string | null;
  courseEstimatedHours: number | null;
  courseThumbnailUrl: string | null;
  addedAt: string;
}

// After
export interface WishlistItemResponse {
  id: number;
  courseTimeId: number;
  courseTimeTitle: string;
  thumbnailUrl: string | null;
  level: string | null;
  estimatedHours: number | null;
  isFree: boolean;
  price: string | null;
  addedAt: string;
}
```

---

## 3. API 엔드포인트 변경

### 3.1 Wishlist Endpoints

```typescript
// Before
WISHLIST: {
  BASE: '/wishlist',
  COUNT: '/wishlist/count',
  CHECK_BULK: '/wishlist/check',
  COURSE: (courseId: number) => `/wishlist/courses/${courseId}`,
  COURSE_CHECK: (courseId: number) => `/wishlist/courses/${courseId}/check`,
}

// After
WISHLIST: {
  BASE: '/wishlist',
  COUNT: '/wishlist/count',
  CHECK_BULK: '/wishlist/check',
  COURSE_TIME: (courseTimeId: number) => `/wishlist/course-times/${courseTimeId}`,
  COURSE_TIME_CHECK: (courseTimeId: number) => `/wishlist/course-times/${courseTimeId}/check`,
}
```

### 3.2 Cart Endpoints (변경 없음)

```typescript
CART: {
  BASE: '/cart',
  ITEMS: '/cart/items',
  COUNT: '/cart/count',
  ITEM: (courseTimeId: number) => `/cart/items/${courseTimeId}`,
  ITEM_CHECK: (courseTimeId: number) => `/cart/items/${courseTimeId}/check`,
}
```

---

## 4. 페이지 라우팅 변경

| Before | After |
|--------|-------|
| `/tu/b2c/courses/{courseId}` | `/tu/b2c/times/{courseTimeId}` |

---

## 5. 수정 파일 목록

### 5.1 Types

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/tu/cart.types.ts` | `courseId` → `courseTimeId`, 필드 이름 변경 |
| `src/types/tu/wishlist.types.ts` | `courseId` → `courseTimeId`, 레거시 타입 제거 |
| `src/types/tu/index.ts` | 레거시 타입 export 제거 |

### 5.2 Services

| 파일 | 변경 내용 |
|------|-----------|
| `src/services/common/api/endpoints.ts` | WISHLIST 엔드포인트 경로 변경 |
| `src/services/tu/cartService.ts` | 주석 업데이트 |
| `src/services/tu/wishlistService.ts` | COURSE_TIME 엔드포인트 사용 |

### 5.3 Hooks

| 파일 | 변경 내용 |
|------|-----------|
| `src/hooks/tu/useCartQueries.ts` | Query key 및 mutation 파라미터 변경 |
| `src/hooks/tu/useWishlistQueries.ts` | Query key 및 mutation 파라미터 변경 |
| `src/hooks/tu/index.ts` | 삭제된 hook export 제거 |

### 5.4 Pages

| 파일 | 변경 내용 |
|------|-----------|
| `src/pages/tu/main/CartPage.tsx` | courseTimeId 기반으로 전체 리팩토링 |
| `src/pages/tu/main/WishlistPage.tsx` | courseTimeId 기반으로 전체 리팩토링 |

### 5.5 Components

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/common/WishlistButton/WishlistButton.tsx` | props `courseId` → `courseTimeId` |

---

## 6. 주요 변경 코드

### 6.1 CartPage.tsx - 상태 관리 변경

```typescript
// Before
const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
const cartCourseIds = useMemo(() => new Set(cartItems.map(item => item.courseId)), [cartItems]);

// After
const [selectedCourseTimeIds, setSelectedCourseTimeIds] = useState<number[]>([]);
const cartCourseTimeIds = useMemo(() => new Set(cartItems.map(item => item.courseTimeId)), [cartItems]);
```

### 6.2 WishlistButton.tsx - Props 변경

```typescript
// Before
interface WishlistButtonProps {
  courseId: number;
  // ...
}

// After
interface WishlistButtonProps {
  courseTimeId: number;
  // ...
}
```

---

## 7. 테스트 결과

### 7.1 TypeScript 컴파일

```bash
$ npx tsc --noEmit
# No errors
```

---

## 8. Breaking Changes

### 8.1 WishlistButton Component

```typescript
// Before
<WishlistButton courseId={123} />

// After
<WishlistButton courseTimeId={456} />
```

WishlistButton을 사용하는 다른 컴포넌트들도 `courseTimeId`를 전달해야 합니다.

---

## 9. 향후 작업

1. WishlistButton을 사용하는 다른 컴포넌트들 업데이트 필요
2. 카탈로그 카드 컴포넌트에서 WishlistButton 연동 확인

---

**작성자**: Claude Code
**최종 수정**: 2026-01-05

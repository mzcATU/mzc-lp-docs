# Frontend TU (Tenant User) 개발 로그 - Phase 14

> B2B 가격 표시 변경 (무료 숨김, 유료 → 자기부담)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-06 |
| **관련 이슈** | [#276](https://github.com/mzcATU/mzc-lp-frontend/issues/276) |
| **관련 PR** | TBD |
| **관련 브랜치** | feat/tu-b2b-price-display |
| **담당 모듈** | TU (Tenant User) - Landing, Catalog, Cart, Wishlist |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | B2B 환경에서 실제 가격(₩180,000)이나 '무료' 표시가 부적절함 |
| 원인 | B2B LMS는 회사가 비용을 지불하므로 사용자에게 금액 노출 불필요 |
| 해결 | 무료 강의는 가격 표시 숨김, 유료 강의는 '자기부담'으로 표시 |

### 1.2 가격 표시 정책

```
[B2B 가격 표시 정책]
┌─────────────────────────────────────────────────────────────┐
│ 무료 강의 (isFree = true)                                    │
│ → 가격 표시 안함 (null)                                      │
│                                                             │
│ 유료 강의 (isFree = false && price > 0)                      │
│ → '자기부담' 표시 (오렌지색 배지)                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 구현 범위

| 구분 | 파일 | 변경 내용 |
|------|------|-----------|
| 랜딩 페이지 | LandingPage.tsx | 태그/가격 생성 로직 변경 |
| 카드 컴포넌트 | LandingCourseCard.tsx | 가격 타입 및 표시 로직 변경 |
| 탐색 페이지 | CoursesExplorePage.tsx | 태그/가격 생성 로직 변경 |
| 장바구니 | CartPage.tsx | 가격 표시 및 결제 요약 변경 |
| 찜 목록 | WishlistPage.tsx | 가격 표시 로직 변경 |

---

## 2. 상세 변경 사항

### 2.1 LandingPage.tsx

#### 변경 전
```typescript
// 가격 포맷팅
const price = courseTime.isFree ? 0 : parseFloat(courseTime.price);
const priceDisplay = courseTime.isFree ? '무료' : `₩${price.toLocaleString()}`;

// 태그 생성
if (courseTime.isFree) {
  tags.push('무료');
}

// 추천 강의 필터
const featuredCourses = courses
  .filter((c) => c.tags.includes('무료') || c.tags.includes('상시모집'))
```

#### 변경 후
```typescript
// B2B 가격 포맷팅 (유료 → 자기부담, 무료 → 표시 안함)
const price = courseTime.isFree ? 0 : parseFloat(courseTime.price);
const priceDisplay = (!courseTime.isFree && price > 0) ? '자기부담' : null;

// 태그 생성 (B2B: 무료 태그 제거)
// B2B 환경: 유료 강의만 '자기부담' 표시
if (!courseTime.isFree && price > 0) {
  tags.push('자기부담');
}

// 추천 강의 필터 (상시모집 우선, B2B에서는 무료 태그 없음)
const featuredCourses = courses
  .filter((c) => c.tags.includes('상시모집') || !c.tags.includes('자기부담'))
```

### 2.2 LandingCourseCard.tsx

#### 타입 변경
```typescript
// Before
interface LandingCourseCardProps {
  price: string;
  // ...
}

// After
interface LandingCourseCardProps {
  price: string | null; // B2B: null이면 표시 안함
  // ...
}
```

#### 태그 스타일 변경
```typescript
// '무료' 태그 → '자기부담' 태그
tag === '자기부담'
  ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316]'
```

#### 가격 표시 변경
```typescript
// Before
<span className="font-bold text-[#6778ff] text-lg">{price}</span>

// After
{price && (
  <span className="font-bold text-[#f59e0b] text-lg">{price}</span>
)}
```

### 2.3 CoursesExplorePage.tsx

#### 태그 생성 변경
```typescript
// Before
if (courseTime.isFree) {
  tags.push('무료');
}

// After
// B2B 환경: 유료 강의만 '자기부담' 표시
if (!courseTime.isFree && parseFloat(courseTime.price) > 0) {
  tags.push('자기부담');
}
```

#### 가격 표시 변경
```typescript
// Before
const priceDisplay = courseTime.isFree ? '무료' : `₩${price.toLocaleString()}`;

// After
const priceDisplay = (!courseTime.isFree && parseFloat(courseTime.price) > 0) ? '자기부담' : null;
```

### 2.4 CartPage.tsx

#### 가격 헬퍼 함수 추가
```typescript
/**
 * B2B 가격 표시 (유료 → 자기부담, 무료 → 표시 안함)
 */
function formatB2BPrice(price: string | null | undefined, isFree: boolean): string | null {
  if (isFree) return null;
  if (!price) return null;
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice === 0) return null;
  return '자기부담';
}
```

#### 결제 요약 변경
```typescript
// Before - 총 결제금액
<span>총 결제금액</span>
<span>₩{totalPrice.toLocaleString()}</span>

// After - 자기부담 강의 수
<span>자기부담 강의</span>
<span>{selectedCartItems.filter(item => !item.isFree && item.price && parseFloat(item.price) > 0).length}개</span>
```

### 2.5 WishlistPage.tsx

#### 가격 헬퍼 함수 추가
```typescript
/**
 * B2B 가격 표시 (유료 → 자기부담, 무료 → 표시 안함)
 */
function formatB2BPrice(price: string | null | undefined, isFree: boolean): string | null {
  if (isFree) return null;
  if (!price) return null;
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice === 0) return null;
  return '자기부담';
}
```

---

## 3. UI 스타일 변경

### 3.1 색상 체계

| 요소 | Before | After |
|------|--------|-------|
| 가격 텍스트 | `#6778ff` (파란색) | `#f59e0b` (오렌지색) |
| 태그 배경 | `#ff7867 → #ff9a5a` | `#f59e0b → #f97316` |
| 배지 배경 | `orange-100/500` | `orange-100/500` (유지) |

### 3.2 표시 규칙

| 조건 | 가격 텍스트 | 태그 |
|------|------------|------|
| isFree = true | 숨김 | 표시 안함 |
| isFree = false, price > 0 | '자기부담' | '자기부담' |
| isFree = false, price = 0 | 숨김 | 표시 안함 |

---

## 4. 수정 파일 목록

| 파일 | 변경 라인 | 주요 변경 |
|------|----------|-----------|
| `src/pages/tu/main/LandingPage.tsx` | +10, -6 | 가격/태그 생성 로직 B2B 적용 |
| `src/components/landing/LandingCourseCard.tsx` | +7, -7 | 가격 타입 변경, 태그 스타일 추가 |
| `src/pages/tu/main/CoursesExplorePage.tsx` | +8, -8 | 가격/태그 생성 로직 B2B 적용 |
| `src/pages/tu/main/CartPage.tsx` | +23, -32 | 가격 헬퍼 함수, 결제 요약 변경 |
| `src/pages/tu/main/WishlistPage.tsx` | +12, -9 | 가격 헬퍼 함수 적용 |

---

## 5. 테스트 결과

### 5.1 TypeScript 컴파일

```bash
$ npx tsc --noEmit
# No errors
```

---

## 6. 향후 고려 사항

1. **환경 설정 기반 전환**: 현재는 하드코딩으로 B2B 정책 적용. 추후 테넌트 설정에 따라 B2B/B2C 가격 표시 전환 필요
2. **국제화**: '자기부담' 텍스트 다국어 지원 필요시 i18n 적용

---

**작성자**: Claude Code
**최종 수정**: 2026-01-06

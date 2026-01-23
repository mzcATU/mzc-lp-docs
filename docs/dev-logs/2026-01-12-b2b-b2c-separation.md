# B2B/B2C 페이지 분리 및 랜딩 페이지 구현

> **작업 기간**: 2026-01-12 ~ 2026-01-18
> **관련 이슈**: #409, #422, #425, #460, #519

## 개요

기업용(B2B)과 일반 사용자용(B2C) 페이지를 분리하고, 테넌트 브랜딩에 맞는 랜딩 페이지를 구현했습니다.

## 라우팅 구조

### B2C (일반 사용자)
```
/tu/b2c/                    - B2C 메인 (강의 탐색)
/tu/b2c/courses             - 강의 목록
/tu/b2c/courses/:id         - 강의 상세
/tu/b2c/learning/:id        - 학습 플레이어
/tu/b2c/mypage              - 마이페이지
```

### B2B (기업 사용자)
```
/tu/b2b/                    - B2B 랜딩 페이지
/tu/b2b/courses             - 과정 목록 (카드형)
/tu/b2b/courses/:id         - 과정 상세
/tu/b2b/learning/:id        - 학습 플레이어 (커리큘럼 포함)
/tu/b2b/mypage              - 마이페이지
```

## 서브도메인 기반 라우팅

### URL 패턴
```
/{subdomain}/tu/b2c/...     - 테넌트별 B2C
/{subdomain}/tu/b2b/...     - 테넌트별 B2B
```

### 리다이렉트 로직
```typescript
// 로그인 후 리다이렉트
const subdomain = user.tenantSubdomain;
const isB2B = tenant?.type === 'B2B';
const basePath = isB2B ? '/tu/b2b' : '/tu/b2c';
navigate(`/${subdomain}${basePath}`);
```

## B2B 랜딩 페이지 구성

### 섹션 구조
1. **히어로 배너**: 테넌트 브랜딩 이미지
2. **과정 캐러셀**: 추천 과정 슬라이더
3. **카테고리 그리드**: 분야별 과정 탐색
4. **통계 섹션**: 수강생 수, 과정 수 등

### 테넌트 브랜딩 적용
```typescript
interface TenantBranding {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  // ...
}
```

## B2B 학습 플레이어 개선

### 커리큘럼 사이드바
- 섹션별 진도율 표시
- 콘텐츠 타입 아이콘
- 현재 학습 아이템 하이라이트

### 댓글 섹션
- 강의별 Q&A
- 강사 답변 표시

## 검색 페이지 개선 (#425)

### 필터 옵션
- 카테고리
- 난이도
- 수강 기간
- 가격 (유료/무료)

### 정렬 옵션
- 최신순
- 인기순
- 평점순

## 관련 파일

### Frontend
- `B2BLandingPage.tsx`
- `B2BCoursesPage.tsx`
- `B2BLearningPage.tsx`
- `B2CMainPage.tsx`
- `SearchPage.tsx`
- `TenantRouter.tsx` - 라우팅 분기

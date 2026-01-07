# Backend Tenant (Multi-Tenancy) 개발 로그 - Phase 4

> 테넌트 기능 설정 및 TU 브랜딩 통합 API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-07 |
| **관련 이슈** | #320 |
| **관련 PR** | #323, #337 |
| **담당 모듈** | Tenant (Multi-Tenancy) |

---

## 1. 구현 개요

### 1.1 주요 작업 내역

| 기능 | 설명 | 관련 PR |
|------|------|---------|
| 테넌트 기능 설정 | 테넌트별 기능 활성화/비활성화 설정 | #337 |
| TU 브랜딩 통합 API | 공개 레이아웃 및 네비게이션 API | #323 |

---

## 2. 테넌트 기능 설정

### 2.1 기능 설정 항목

| 설정 키 | 설명 | 기본값 |
|---------|------|--------|
| `COMMUNITY_ENABLED` | 커뮤니티 기능 활성화 | true |
| `REVIEW_ENABLED` | 수강평 기능 활성화 | true |
| `WISHLIST_ENABLED` | 찜하기 기능 활성화 | true |
| `CART_ENABLED` | 장바구니 기능 활성화 | true |
| `CERTIFICATE_ENABLED` | 수료증 기능 활성화 | true |
| `ROADMAP_ENABLED` | 로드맵 기능 활성화 | true |

### 2.2 API 엔드포인트

```
# 테넌트 기능 설정 조회
GET /api/tenants/{tenantId}/features

# 테넌트 기능 설정 수정 (TA 전용)
PUT /api/tenants/{tenantId}/features

# 현재 테넌트 기능 설정 조회 (Public)
GET /api/public/features
```

### 2.3 Response 예시

```json
{
  "communityEnabled": true,
  "reviewEnabled": true,
  "wishlistEnabled": false,
  "cartEnabled": true,
  "certificateEnabled": true,
  "roadmapEnabled": true
}
```

---

## 3. TU 브랜딩 통합 API

### 3.1 공개 레이아웃 API

학습자(TU) 페이지에서 사용할 공개 레이아웃 정보 제공.

```
GET /api/public/layout
```

#### Response

```json
{
  "header": {
    "logoUrl": "https://...",
    "logoAlt": "테넌트명",
    "showSearch": true,
    "menuItems": [
      { "label": "강의 탐색", "path": "/courses" },
      { "label": "로드맵", "path": "/roadmaps" }
    ]
  },
  "footer": {
    "companyName": "회사명",
    "links": [...],
    "copyright": "© 2026 ..."
  },
  "theme": {
    "primaryColor": "#6778ff",
    "accentColor": "#ff7867"
  }
}
```

### 3.2 공개 네비게이션 API

```
GET /api/public/navigation
```

#### Response

```json
{
  "mainMenu": [
    { "label": "홈", "path": "/", "icon": "home" },
    { "label": "강의 탐색", "path": "/courses", "icon": "book" },
    { "label": "내 학습", "path": "/my-courses", "icon": "graduation-cap" }
  ],
  "userMenu": [
    { "label": "내 프로필", "path": "/profile" },
    { "label": "설정", "path": "/settings" }
  ]
}
```

---

## 4. 활용 시나리오

### 4.1 기능 설정 활용

```
프론트엔드 → /api/public/features 호출
        → 비활성화된 기능 UI 숨김 처리
        → 예: wishlistEnabled=false면 찜하기 버튼 숨김
```

### 4.2 브랜딩 통합 활용

```
TU 앱 로드 → /api/public/layout 호출
          → 헤더/푸터 동적 렌더링
          → 테넌트별 브랜드 일관성 유지
```

---

## 5. Git 커밋 히스토리

```
5a61354 Feat/tenant feature settings (#337)
fc952c2 feat: TU 브랜딩 통합을 위한 공개 레이아웃 및 네비게이션 API 추가 (#323)
```

---

**작성자**: Claude Code
**최종 수정**: 2026-01-07

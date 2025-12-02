# MZRUN - LMS (Learning Management System)

![MZRUN Main](apps/web/public/images/readme_main.png)

온라인 강의 플랫폼 MZRUN의 프론트엔드 프로젝트입니다.

## 기술 스택

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Package Manager**: pnpm (Monorepo)

## 시작하기

### 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 빌드

```bash
pnpm build
```

## 프로젝트 구조

```
figma_front/
├── apps/
│   └── web/                     # 메인 웹 애플리케이션 (@lms/web)
│       ├── src/
│       │   ├── components/      # 재사용 가능한 컴포넌트
│       │   │   ├── Header.tsx
│       │   │   ├── Footer.tsx
│       │   │   ├── CourseCard.tsx
│       │   │   └── HeroSection.tsx
│       │   ├── pages/           # 페이지 컴포넌트
│       │   │   ├── LoginPage.tsx
│       │   │   ├── SignupPage.tsx
│       │   │   ├── CoursesPage.tsx
│       │   │   ├── CourseDetailPage.tsx
│       │   │   ├── RoadmapPage.tsx
│       │   │   ├── MentoringPage.tsx
│       │   │   ├── CommunityPage.tsx
│       │   │   ├── JobsPage.tsx
│       │   │   ├── CartPage.tsx
│       │   │   └── NotificationsPage.tsx
│       │   ├── data/            # Mock 데이터
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   ├── ui/                      # 공유 UI 컴포넌트 (@lms/ui)
│   │   └── src/
│   └── shared/                  # 공유 유틸리티/타입 (@lms/shared)
│       └── src/
├── package.json                 # 루트 워크스페이스 설정
├── pnpm-workspace.yaml
└── tsconfig.json
```

## 워크스페이스 패키지

| 패키지 | 설명 |
|--------|------|
| `@lms/web` | 메인 웹 애플리케이션 |
| `@lms/ui` | 공유 UI 컴포넌트 라이브러리 |
| `@lms/shared` | 공유 유틸리티 및 타입 |

## 주요 기능

### 네비게이션
- 반응형 헤더 (모바일/데스크톱)
- 실시간 검색 기능 (강의명, 강사명 검색)
- 장바구니 및 알림 아이콘 (배지 표시)
- 로그인/회원가입 버튼

### 메인 페이지
- 슬라이드 배너 (자동 전환, 애니메이션 효과)
- 인기 강의 목록
- 카테고리별 강의 필터링

### 강의
- **강의 목록 페이지**: 카테고리 필터, 검색, 정렬 기능
- **강의 상세 페이지**:
  - 강의 정보 (가격, 할인율, 평점, 수강생 수)
  - 강의 소개 프로모션 영상
  - 커리큘럼 (섹션별 접기/펼치기)
  - 강사 소개
  - 장바구니 담기 / 바로 구매 버튼
  - 찜하기 / 공유 기능
  - Breadcrumb 네비게이션

### 장바구니
- 강의 선택/해제 (전체 선택)
- 선택 항목 삭제
- 쿠폰 코드 입력
- 실시간 가격 계산 (할인 금액 표시)

### 알림
- 알림 필터링 (전체, 안읽음)
- 읽음/안읽음 상태 관리
- 알림 삭제

### 인증
- 로그인 페이지 (소셜 로그인 UI)
- 회원가입 페이지 (약관 동의)

## 페이지 라우팅

| 경로 | 페이지 |
|------|--------|
| `/` | 메인 페이지 |
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/courses` | 강의 목록 |
| `/courses?search=검색어` | 강의 검색 결과 |
| `/courses?category=dev` | 카테고리별 강의 |
| `/course/:id` | 강의 상세 |
| `/roadmap` | 로드맵 |
| `/mentoring` | 멘토링 |
| `/community` | 커뮤니티 |
| `/jobs` | 채용 |
| `/cart` | 장바구니 |
| `/notifications` | 알림 |

## 스타일 가이드

### 색상
- Primary Gradient: `#6778ff` → `#a855f7`
- Accent: `#6bc2f0`
- Background: `#0a0a0a`
- Glass Effect: `bg-white/5`, `border-white/10`

### 컴포넌트 스타일
- `btn-primary`: 그라디언트 버튼
- `btn-outline`: 테두리 버튼
- `glass`: 글래스모피즘 효과
- `gradient-text`: 그라디언트 텍스트
- `card-hover`: 카드 호버 효과

## 라이선스

© 2024 MEGAZONECLOUD Corp. All rights reserved.

# 시스템 아키텍처

> 전체 시스템 구조 및 사이트 분리 전략

---

## 1. 사이트 구조 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        mzc-lp Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │    B2C      │   │    B2B      │   │   K-Pop     │          │
│   │  (인프런형) │   │ (기업 전용) │   │  (특화)     │          │
│   │             │   │             │   │             │          │
│   │ learn.com   │   │ *.learn.com │   │ kpop.com    │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│          │                 │                 │                  │
│          └─────────────────┴─────────────────┘                  │
│                            │                                    │
│                    ┌───────▼───────┐                           │
│                    │  Core Engine  │                           │
│                    │  (공통 기능)  │                           │
│                    └───────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 사이트별 특징

### 2.1 B2C 사이트 (메인)

```
URL: learn.mzc.com (또는 www.mzc-learn.com)
특징: 인프런/Udemy 스타일의 오픈 마켓플레이스
```

| 기능 | 설명 |
|------|------|
| 강사 등록 | 누구나 강사 신청 가능 |
| 강의 판매 | 강사가 직접 강의 등록/판매 |
| 수익 분배 | 플랫폼 수수료 (예: 30%) |
| 결제 | 개인 결제 (카드, 간편결제) |
| 리뷰/평점 | 수강생 리뷰 시스템 |
| 검색/추천 | 강의 검색, AI 추천 |

### 2.2 B2B 사이트 (기업 전용)

```
URL: {company}.learn.mzc.com
예시: samsung.learn.mzc.com, lg.learn.mzc.com
특징: B2C 기반 + 브랜딩 + 기업 전용 기능
```

| 기능 | 설명 |
|------|------|
| 화이트라벨 | 로고, 색상, 도메인 커스터마이징 |
| 조직 관리 | 부서/팀 구조, 대량 사용자 등록 |
| 기업 전용 강의 | 외부 비공개 강의 |
| 학습 대시보드 | 조직별 학습 현황 분석 |
| SSO 연동 | 기업 인증 시스템 연동 |
| 계약 결제 | 연간 라이선스, 인보이스 |

### 2.3 K-Pop 사이트 (특화)

```
URL: kpop.mzc.com (또는 mzc-kpop.com)
특징: K-Pop 아티스트/팬 특화 플랫폼
```

| 기능 | 설명 |
|------|------|
| 아티스트 채널 | 아티스트별 전용 공간 |
| 팬 구독 | 월정액 구독 모델 |
| 캠프/이벤트 | 오프라인 연계 프로그램 |
| 영상 피드백 | 1:1 피드백 시스템 |
| 프로모션 | 앨범/굿즈 연계 |

---

## 3. 데이터 분리 전략

### 3.1 단일 DB + Row-Level Security

```
┌─────────────────────────────────────────────────────────────┐
│                      MySQL Database                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  tenants 테이블 (사이트/기업 정보)                           │
│  ┌────┬──────────┬───────┬─────────────────────────────┐    │
│  │ id │ code     │ type  │ subdomain                   │    │
│  ├────┼──────────┼───────┼─────────────────────────────┤    │
│  │ 1  │ B2C_MAIN │ B2C   │ www                         │    │
│  │ 2  │ SAMSUNG  │ B2B   │ samsung                     │    │
│  │ 3  │ LG       │ B2B   │ lg                          │    │
│  │ 4  │ KPOP     │ KPOP  │ kpop (별도 도메인 가능)     │    │
│  └────┴──────────┴───────┴─────────────────────────────┘    │
│                                                              │
│  courses 테이블 (강의)                                       │
│  ┌────┬───────────┬──────────────┬────────────┐             │
│  │ id │ tenant_id │ title        │ visibility │             │
│  ├────┼───────────┼──────────────┼────────────┤             │
│  │ 1  │ 1         │ React 기초   │ PUBLIC     │ ← B2C 공개  │
│  │ 2  │ 1         │ AWS 입문     │ PUBLIC     │ ← B2C 공개  │
│  │ 3  │ 2         │ 삼성 신입교육│ PRIVATE    │ ← 삼성 전용 │
│  │ 4  │ 4         │ 댄스 기초    │ PUBLIC     │ ← K-Pop    │
│  └────┴───────────┴──────────────┴────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 강의 가시성 규칙

```java
public enum CourseVisibility {
    PUBLIC,      // 해당 테넌트 내 전체 공개
    PRIVATE,     // 특정 그룹/조직만
    SHARED       // B2C 강의를 B2B에서도 사용 (라이선스)
}
```

| 테넌트 타입 | PUBLIC 강의 | PRIVATE 강의 | SHARED 강의 |
|-------------|-------------|--------------|-------------|
| B2C | 모든 사용자 | 구매자만 | - |
| B2B | 해당 기업 전체 | 특정 부서만 | B2C 강의 연동 |
| KPOP | 구독자 | 특정 팬클럽만 | - |

---

## 4. 요청 흐름

```
사용자 요청
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    TenantFilter                          │
│  1. URL/Subdomain 파싱                                   │
│  2. Tenant 조회 (캐싱)                                   │
│  3. TenantContext에 설정                                 │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                  JwtAuthFilter                           │
│  1. JWT 토큰 검증                                        │
│  2. 사용자 정보 + 권한 로드                              │
│  3. SecurityContext에 설정                               │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    Controller                            │
│  @PreAuthorize로 권한 체크                               │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    Repository                            │
│  Hibernate Filter로 tenant_id 자동 필터링                │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Frontend 구조

### 5.1 모노레포 + 공유 컴포넌트

```
frontend/
├── packages/
│   ├── shared/              # 공유 컴포넌트/훅
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   │
│   ├── b2c/                 # B2C 전용
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── b2b/                 # B2B 전용 (브랜딩 기능)
│   │   ├── src/
│   │   └── package.json
│   │
│   └── kpop/                # K-Pop 전용
│       ├── src/
│       └── package.json
│
└── package.json             # Workspace 설정
```

### 5.2 단일 앱 + 동적 렌더링 (권장)

```
frontend/
├── src/
│   ├── features/
│   │   ├── common/          # 공통 기능
│   │   ├── b2c/             # B2C 전용 기능
│   │   ├── b2b/             # B2B 전용 기능
│   │   └── kpop/            # K-Pop 전용 기능
│   │
│   ├── providers/
│   │   └── TenantProvider.tsx
│   │
│   └── App.tsx
```

```tsx
// App.tsx
function App() {
  const { tenant } = useTenant();

  return (
    <TenantThemeProvider>
      {tenant?.type === 'B2C' && <B2CLayout />}
      {tenant?.type === 'B2B' && <B2BLayout />}
      {tenant?.type === 'KPOP' && <KpopLayout />}
    </TenantThemeProvider>
  );
}
```

---

## 6. B2C → B2B 브랜딩 전환

### 6.1 브랜딩 설정

```java
@Entity
public class TenantBranding {
    @Id
    private Long tenantId;

    // 기본 브랜딩
    private String logoUrl;
    private String faviconUrl;
    private String primaryColor;      // #3B82F6
    private String secondaryColor;
    private String fontFamily;

    // 커스텀 도메인
    private String customDomain;      // learn.samsung.com

    // 텍스트 커스터마이징
    private String platformName;      // "삼성 러닝센터"
    private String courseLabel;       // "교육과정" (강의 대신)
    private String instructorLabel;   // "강사" or "튜터"
}
```

### 6.2 Frontend 테마 적용

```typescript
// useTenantTheme.ts
export const useTenantTheme = () => {
  const { tenant } = useTenant();

  useEffect(() => {
    if (!tenant?.branding) return;

    const { primaryColor, secondaryColor, fontFamily } = tenant.branding;

    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-secondary', secondaryColor);
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [tenant]);
};
```

---

## 7. 배포 구조

```
┌─────────────────────────────────────────────────────────┐
│                     CloudFront                           │
│  *.learn.mzc.com → Frontend (S3)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    ALB (API Gateway)                     │
│  api.learn.mzc.com → Backend (ECS)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    ECS Cluster                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  API (x3)   │  │  API (x3)   │  │  Worker     │     │
│  │  Instance   │  │  Instance   │  │  (비동기)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    RDS (MySQL)                           │
│  단일 DB, Row-Level Security                            │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 상세 설계 |
| [user-roles.md](./user-roles.md) | 사용자 역할 및 권한 |
| [24-MULTI-TENANCY.md](../conventions/24-MULTI-TENANCY.md) | 구현 컨벤션 |

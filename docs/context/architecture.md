# 시스템 아키텍처

> 전체 시스템 구조 및 사이트 분리 전략

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 섹션/문서 |
|----------|---------------|
| B2C/B2B/K-Pop 사이트별 차이점? | 섹션 2. 사이트별 특징 |
| 테넌트 데이터 분리 방식? | 섹션 3. 데이터 분리 전략 또는 [multi-tenancy.md](./multi-tenancy.md) |
| 모듈 간 통신 규칙? | 섹션 8.1 단방향 데이터 흐름 |
| LMS/SIS 차이점? | 섹션 8.2 LMS 개념 또는 [lms-architecture.md](./lms-architecture.md) |
| 각 모듈별 역할 상세? | [module-structure.md](./module-structure.md) |
| 프론트엔드 구조? | 섹션 5. Frontend 구조 |
| AWS 배포 구조? | 섹션 7. 배포 구조 |

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
| 강의 생성 | 누구나(USER) 강의 생성 가능 → OWNER가 됨 |
| 등록 신청 | OWNER가 강의 등록 신청 → OPERATOR 검토/승인 |
| 차수/강사 관리 | OPERATOR가 차수 등록, 강사 배정 (보통 OWNER → INSTRUCTOR) |
| 결제 | 개인 결제 (카드, 간편결제) |
| 리뷰/평점 | 수강생 리뷰 시스템 |

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
특징: K-POP 교육 플랫폼 (외국인 단기 연수)
```

| 기능 | 설명 |
|------|------|
| 스케줄 관리 | 2~3주 연수 일정표 |
| 팀 구성/채팅 | 팀원 배정 및 팀 채팅 |
| 시설 예약 | 춤/노래 연습실 예약 |
| 강의 수강 | 댄스, 보컬 등 교육 |
| 영상 피드백 | 귀국 후 영상 업로드 → 강사 피드백 |

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
| KPOP | 수강생 전체 | 특정 그룹만 | - |

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

### 현재 인프라 (Dev)

```
┌─────────────────────────────────────────────────────────┐
│                  AWS Cloud (ap-northeast-2)              │
├─────────────────────────────────────────────────────────┤
│  [Public Subnet]                                         │
│    Bastion Server (43.201.252.223)                      │
│    NAT Gateway                                           │
│                                                          │
│  [Private Subnet - App]                                  │
│    API Server EC2 (10.50.101.214)                       │
│    → api.mzanewlp.cloudclass.co.kr                      │
│                                                          │
│  [Private Subnet - DB]                                   │
│    RDS MySQL (mza_newlp)                                │
│                                                          │
│  ECR: 697924056608.dkr.ecr.ap-northeast-2.amazonaws.com │
│  CloudFront + S3 (Frontend) - 필요시 구성               │
└─────────────────────────────────────────────────────────┘
```

### 확장 구조 (Prod)

```
┌─────────────────────────────────────────────────────────┐
│                     CloudFront                           │
│  *.mzanewlp.cloudclass.co.kr → Frontend (S3)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    ALB (API Gateway)                     │
│  api.mzanewlp.cloudclass.co.kr → Backend                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    RDS (MySQL)                           │
│  mza_newlp, Row-Level Security                          │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 모듈 간 통신 원칙

### 8.1 단방향 데이터 흐름 (핵심 원칙)

```
❌ 양방향 통신 문제:
├─ Race Condition 발생 가능
├─ Deadlock 위험
└─ 순환 의존성 → 유지보수 어려움

✅ 단방향 통신 원칙:
├─ 마스터 → 서브 방향으로만 호출
├─ 서브 → 마스터 역방향 호출 금지
└─ 디테일 변경 시 "마스터가 디테일을 함께 변경" 방식
```

**모듈 계층 및 통신 방향:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 mzc-lp Platform                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [콘텐츠 계층 - 마스터]                                                            │
│      CMS (파일) ────────► LO (학습객체)                                            │
│                              단방향                                                │
│                                │                                                  │
│                                ▼                                                  │
│  [강의 계층 - 마스터]                                                              │
│      CM (커리큘럼) ────────► CR (관계)                                             │
│                              단방향                                                │
│                                │                                                  │
│                                ▼                                                  │
│  [운영 계층 - 마스터]                                                              │
│      TS (차수) ─────┬────────────────────┐                                        │
│                     │                    │                                        │
│                     ▼                    ▼                                        │
│  [기록 계층 - 서브]                                                                │
│      SIS (수강)              IIS (강사)                                            │
│      LMS (진도/성적)                                                               │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

[통신 규칙]
✅ CMS → LO: 콘텐츠 업로드 시 LO 자동 생성
✅ CM → CR: 커리큘럼 기반 학습 순서 설정
✅ TS → SIS/IIS: 차수 기반 수강/강사 기록 생성
❌ SIS → TS: 역방향 호출 금지
❌ LO → CMS: 역방향 호출 금지
```

**역방향이 필요한 경우 처리:**

```java
// ❌ Bad: SIS에서 TS를 직접 수정
public class EnrollmentService {
    public void complete(Long enrollmentId) {
        enrollment.complete();
        courseTime.decrementEnrollment();  // 역방향 호출!
    }
}

// ✅ Good: TS가 SIS 변경을 감지하고 자신을 수정
public class CourseTimeService {
    @EventListener
    public void onEnrollmentCompleted(EnrollmentCompletedEvent event) {
        CourseTime courseTime = findById(event.getCourseTimeId());
        courseTime.decrementEnrollment();  // 마스터가 자신을 수정
    }
}
```

---

## 8.2 LMS 개념 (누락 보완)

> **상세 설계:** [lms-architecture.md](./lms-architecture.md) - 진도/성적/퀴즈/수료증 상세

### 학습 관리 시스템 연계

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            LMS (Learning Management System)                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [핵심 기능]                                                                      │
│  ├── 진도 관리: 학습 진행률 추적 (0-100%)                                         │
│  ├── 성적 관리: 퀴즈/과제 점수, 최종 점수                                         │
│  ├── 수료 판정: 진도율 + 점수 기준 충족 여부                                      │
│  └── 학습 추천: 진도/성적 기반 추가 강좌 추천                                     │
│                                                                                   │
│  [SIS와의 관계]                                                                   │
│  ┌─────────────────┐              ┌─────────────────┐                            │
│  │       SIS       │              │       LMS       │                            │
│  │   (수강 기록)    │──────────────│   (학습 기록)    │                            │
│  ├─────────────────┤              ├─────────────────┤                            │
│  │ - 수강 신청     │              │ - 진도 추적     │                            │
│  │ - 수강 상태     │              │ - 퀴즈 응시     │                            │
│  │ - 수료 여부     │◄─────────────│ - 점수 계산     │                            │
│  │                 │  수료 판정   │ - 수료 기준 체크│                            │
│  └─────────────────┘              └─────────────────┘                            │
│                                                                                   │
│  SIS: "누가 언제 수강 신청했는가" (수강 이력)                                      │
│  LMS: "어디까지 학습했고 점수가 얼마인가" (학습 이력)                               │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### LMS 데이터 모델 (예시)

| 테이블 | 역할 | 주요 필드 |
|--------|------|----------|
| `lms_progress` | 차시별 진도 | enrollment_id, item_id, progress, watched_seconds |
| `lms_quiz_attempts` | 퀴즈 응시 | enrollment_id, quiz_id, score, attempt_count |
| `lms_certificates` | 수료증 | enrollment_id, issued_at, certificate_number |

---

## 9. 관련 문서

> **모듈 상세 (CM/CR/LO/CMS):** [module-structure.md](./module-structure.md)

| 문서 | 내용 |
|------|------|
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 상세 설계 |
| [user-roles.md](./user-roles.md) | 사용자 역할 및 권한 |
| [23-MULTI-TENANCY.md](../conventions/23-MULTI-TENANCY.md) | 구현 컨벤션 |
| [module-structure.md](./module-structure.md) | 모듈 구조 상세 |

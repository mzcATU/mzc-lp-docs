# 11. React + TypeScript Project Structure

> 📌 **먼저 읽기**: [10-REACT-TYPESCRIPT-CORE.md](./10-REACT-TYPESCRIPT-CORE.md)

> Frontend 프로젝트 디렉토리 구조 및 파일 배치 규칙

---

## 언제 이 문서를 보는가?

| 상황 | 참조 섹션 |
|------|----------|
| 폴더 구조? | 섹션 1 프로젝트 구조 |
| 파일 배치? | 섹션 2 역할별 규칙 |
| common vs domain? | 섹션 3 컴포넌트 구조 |

---

## 1. 프로젝트 구조

```
src/
├── assets/                        # 정적 리소스 (images, icons, fonts)
│
├── components/                    # 재사용 컴포넌트
│   ├── common/                    # 공통 UI (Button, Input, Modal, Dialog)
│   ├── domain/                    # 도메인 특화 컴포넌트 (비즈니스 로직 종속)
│   │   ├── sa/                    # System Admin 전용
│   │   ├── ta/                    # Tenant Admin 전용
│   │   ├── to/                    # Tenant Operator 전용
│   │   └── tu/                    # Tenant User 전용
│   └── layout/                    # 레이아웃 컴포넌트 (sa/ta/to/tu)
│
├── pages/                         # 역할별 페이지 (sa/ta/to/tu)
├── hooks/                         # 커스텀 훅 (common + sa/ta/to/tu)
├── store/                         # Zustand 전역 상태 (common + sa/ta/to/tu)
├── services/                      # API 통신 (common + sa/ta/to/tu)
├── types/                         # 타입 정의 (common + sa/ta/to/tu)
│
├── styles/                        # 스타일 (design-tokens.ts)
├── utils/                         # 유틸리티 (cn.ts, format.ts, validation.ts)
├── config/                        # 설정 (constants.ts)
├── routes/                        # 라우팅 (index.tsx)
│
├── App.tsx
└── main.tsx
```

---

## 2. 역할별 폴더 구조 규칙

### 역할 구분

| 역할 | 폴더명 | 설명 |
|------|--------|------|
| 공통 | `common/` | 모든 역할에서 사용 |
| System Admin | `sa/` | 슈퍼 관리자 전용 |
| Tenant Admin | `ta/` | 테넌트 관리자 전용 |
| Tenant Operator | `to/` | 테넌트 운영자 전용 |
| Tenant User | `tu/` | 테넌트 사용자 전용 |

### 적용 대상

```
역할별로 분리: components/domain, components/layout, pages, hooks, store, services, types
공통으로 유지: assets, components/common, styles, utils, config, routes
```

---

## 3. 컴포넌트 폴더 구조

### common vs domain 구분

| 구분 | 판단 기준 | 예시 |
|------|----------|------|
| **common** | 다른 프로젝트에서도 재사용 가능? | Button, Input, Modal, Dialog |
| **domain** | LMS 비즈니스 로직을 알아야 함? | ContentWizard, CourseCard, EnrollmentBadge |

### 공통 컴포넌트 구조

```
components/common/Button/
├── Button.tsx           # 메인 컴포넌트
├── Button.types.ts      # Props 타입 정의
├── Button.test.tsx      # 테스트 (선택)
└── index.ts             # re-export
```

### index.ts 패턴

```typescript
// components/common/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

### 역할별 라우팅

```
/sa/*  → SystemAdminLayout
/ta/*  → TenantAdminLayout
/to/*  → TenantOperatorLayout
/tu/*  → TenantUserLayout
```

---

## 4. Services / Types / Hooks / Store

모두 동일한 패턴:

```
{folder}/
├── common/          # 공통
├── sa/              # System Admin 전용
├── ta/              # Tenant Admin 전용
├── to/              # Tenant Operator 전용
└── tu/              # Tenant User 전용
```

### 주요 파일 예시

| 폴더 | common 예시 | 역할별 예시 |
|------|-------------|-------------|
| services | axiosInstance.ts, authService.ts | tenantService.ts, contentService.ts |
| types | auth.types.ts, api.types.ts | tenant.types.ts, learning.types.ts |
| hooks | useAuth.ts, useDebounce.ts | useTenantManagement.ts, useMyLearning.ts |
| store | authStore.ts, uiStore.ts | tenantStore.ts, learningStore.ts |

---

## 5. 설정

### Path Alias

```typescript
// tsconfig.json
{ "paths": { "@/*": ["./src/*"] } }

// vite.config.ts
resolve: { alias: { '@': path.resolve(__dirname, './src') } }
```

---

> 컴포넌트 컨벤션 → [12-REACT-COMPONENT-CONVENTIONS](./12-REACT-COMPONENT-CONVENTIONS.md)
> 상태 관리 → [13-REACT-STATE-MANAGEMENT](./13-REACT-STATE-MANAGEMENT.md)
> API 통합 → [14-REACT-API-INTEGRATION](./14-REACT-API-INTEGRATION.md)

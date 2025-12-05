# Multi-Tenancy Context - SaaS 멀티테넌시 아키텍처

> SaaS 기반 멀티테넌시 구조 설계 개요
> **상세 구현 가이드 → [24-MULTI-TENANCY.md](../../conventions/24-MULTI-TENANCY.md)**

---

## 이 문서를 읽어야 할 때

```
✅ 멀티테넌시 전체 구조 파악 시
✅ 역할/권한 체계 이해 시
✅ 테넌트 기능 범위 확인 시
```

> 구현 코드 작성 시 → [24-MULTI-TENANCY.md](../../conventions/24-MULTI-TENANCY.md) 참조

---

## 1. 멀티테넌시 전략

### Row-Level Tenant Isolation

```
┌─────────────────────────────────────────────────────────┐
│                    Single Database                       │
├─────────────────────────────────────────────────────────┤
│  tenant_id = 1  │  tenant_id = 2  │  tenant_id = 3     │
│  Company A      │  Company B      │  Company C         │
└─────────────────────────────────────────────────────────┘
```

**선택 이유**: 운영 복잡도 낮음, 비용 효율적, 확장 용이

### 테넌트 식별 방식

| 방식 | 예시 | 용도 |
|------|------|------|
| **Subdomain** | `company-a.platform.com` | 일반 접속 |
| **Custom Domain** | `learning.company-a.com` | 화이트라벨링 |
| **JWT Claim** | `tenant_id: 1` | 인증된 요청 |

---

## 2. 역할 계층 구조

```
SUPER_ADMIN (플랫폼 전체)
    ↓
TENANT_ADMIN (테넌트별 최고 관리자)
    ↓
TENANT_OPERATOR (테넌트 운영자, 기존 OPERATOR)
    ↓
INSTRUCTOR / STUDENT / USER (기존 역할 유지)
```

### 역할별 권한 요약

| 기능 | SUPER | T_ADMIN | T_OP | 일반 |
|------|:-----:|:-------:|:----:|:----:|
| 테넌트 CRUD | ✅ | ❌ | ❌ | ❌ |
| 전체 통계 | ✅ | ❌ | ❌ | ❌ |
| 요금제 관리 | ✅ | ❌ | ❌ | ❌ |
| 테넌트 브랜딩/설정 | ❌ | ✅ | ❌ | ❌ |
| Operator 관리 | ❌ | ✅ | ❌ | ❌ |
| 테넌트 통계 | ❌ | ✅ | ✅ | ❌ |
| 강의/사용자 관리 | ❌ | ✅ | ✅ | 🔸 |

> 🔸 = 제한된 권한

---

## 3. Super Admin 기능

### 테넌트 관리
- **CRUD**: 생성, 조회, 수정, 삭제 (소프트)
- **상태**: PENDING → ACTIVE → SUSPENDED → TERMINATED

### 전체 통계
| 지표 | 집계 |
|------|------|
| 테넌트/사용자/강의 수 | 실시간 |
| 전체 평점, 사용량 | 일별 |
| 테넌트별 비교 | 일별 |

### 시스템 설정
- 기본 테마 템플릿, 글로벌 공지, 기능 플래그
- **요금제**: FREE / BASIC / PRO / ENTERPRISE

| 플랜 | 사용자 | 강의 | 스토리지 |
|------|:------:|:----:|:--------:|
| FREE | 10명 | 5개 | 1GB |
| BASIC | 100명 | 50개 | 10GB |
| PRO | 무제한 | 무제한 | 100GB |
| ENTERPRISE | 무제한 | 무제한 | 협의 |

### 기타
- 감사 로그 (Audit Log)
- 일괄 작업 (상태 변경, 공지 발송)

---

## 4. Tenant Admin 기능

### 브랜딩
```
├── 로고, 파비콘, 브랜드명
├── 테마 (색상, 폰트, 헤더)
├── 커스텀 테마 저장 (최대 5개)
└── 화이트라벨링 (커스텀 도메인, 이메일 템플릿)
```

### 네이밍 커스터마이징
| 기본값 | 커스텀 예시 |
|--------|------------|
| 강의 | 교육과정, 코스 |
| 수강생 | 학습자, 교육생 |
| 강사 | 튜터, 트레이너 |

### 레이아웃 커스터마이징
- 컴포넌트 On/Off (사이드바, 배너, 팝업)
- 위치 변경 (사이드바 좌/우, 카테고리)
- 메뉴 순서 변경

### 테넌트 통계
- 사용자 수, 활동량, 강의 수, 평점, DAU/MAU

### Operator 관리
- CRUD + 권한 세분화 (Full/ReadOnly/Custom)

### 추가 설정
- 로그인/보안 (비밀번호 정책, 2FA, 세션)
- 알림 (이메일/SMS On/Off)
- 데이터 관리 (CSV 일괄 등록, Excel 내보내기)
- 다국어 (i18n), API 키 관리
- **스토리지 관리** (플랜별 용량 제한, 사용량 모니터링)

---

## 5. Tenant Operator / 일반 사용자

### Tenant Operator
> 기존 OPERATOR + 테넌트 범위 제한

### 일반 사용자 (Instructor/Student/User)
> 기존 역할 유지 + 테넌트 브랜딩/네이밍/레이아웃 자동 적용

---

## 6. 데이터베이스 개요

### 신규 테이블
| 테이블 | 용도 |
|--------|------|
| `tenants` | 테넌트 기본 정보 |
| `tenant_brandings` | 브랜딩 설정 |
| `tenant_namings` | 네이밍 설정 |
| `tenant_layouts` | 레이아웃 설정 |
| `plans` | 요금제 정의 |
| `tenant_api_keys` | API 키 |
| `audit_logs` | 감사 로그 |
| `tenant_usage_daily` | 일별 사용량 통계 |

### 기존 테이블 수정
- `users`, `courses`, `course_terms`, `enrollments`에 `tenant_id` 추가
- Role Enum 확장: `SUPER_ADMIN`, `TENANT_ADMIN`, `TENANT_OPERATOR` 추가

### ERD 요약
```
tenants ─┬─ tenant_brandings
         ├─ tenant_namings
         └─ tenant_layouts

tenant_id (FK) → users, courses, course_terms, enrollments
```

---

## 7. API 개요

### Super Admin
```
/api/admin/tenants/*      - 테넌트 CRUD, 승인/정지
/api/admin/statistics/*   - 전체/테넌트별 통계
/api/admin/plans/*        - 요금제 관리
/api/admin/audit-logs     - 감사 로그
```

### Tenant Admin
```
/api/tenant/settings      - 테넌트 설정
/api/tenant/branding      - 브랜딩
/api/tenant/naming        - 네이밍
/api/tenant/layout        - 레이아웃
/api/tenant/operators/*   - Operator 관리
/api/tenant/statistics    - 테넌트 통계
/api/tenant/api-keys/*    - API 키
/api/tenant/export/*      - 데이터 내보내기
```

### Public
```
/api/tenants/by-subdomain/{subdomain}
/api/tenants/current
```

---

## 8. 보안 원칙

```
✅ 모든 쿼리에 tenant_id 자동 적용 (Hibernate Filter)
✅ JWT에 tenant_id 포함하여 검증
✅ 크로스 테넌트 접근 차단 (API 레벨)
✅ 테넌트 비활성화 시 접근 거부
```

---

## 9. 마이그레이션 단계

| Phase | 내용 |
|-------|------|
| 1 | 테넌트 테이블 생성, tenant_id 컬럼 추가 |
| 2 | Backend: TenantContext, Filter, API |
| 3 | Frontend: Provider, 동적 테마/네이밍 |
| 4 | 테스트 및 단계별 롤아웃 |

---

## 관련 문서

| 문서 | 용도 |
|------|------|
| **[24-MULTI-TENANCY.md](../../conventions/24-MULTI-TENANCY.md)** | 구현 가이드, 코드 패턴 |
| [architecture.md](./architecture.md) | 기존 아키텍처 |
| [database.md](./database.md) | DB 스키마 |
| [api.md](./api.md) | API 명세 |

---

> **업데이트 시점**: 테넌트 기능 추가, 역할 체계 변경, 데이터 격리 방식 변경 시

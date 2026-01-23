# Phase 3 Backend 개발 작업 요약

> 2025-12-15 ~ 2025-12-16 작업 내역

---

## PR 히스토리

| PR | 제목 | 이슈 | 머지일 |
|----|------|------|--------|
| #63 | fix: Course 도메인 필드 정합성 수정 | #60 | 2025-12-15 |
| #65 | feat(sis): 수강신청 CRUD API 구현 | - | 2025-12-15 |
| #66 | feat: CourseItem API 구현 (계층 구조) | #64 | 2025-12-15 |
| #67 | feat(sis): 학습 통계 API 구현 | - | 2025-12-15 |
| #68 | [Feat] TS 배치 Job 구현 - 차수 상태 자동 전환 | #30 | 2025-12-15 |
| #70 | [Feat] CourseRelation API 구현 (학습 순서) | #69 | 2025-12-15 |
| #71 | Refactor/tenant infrastructure | #32 | 2025-12-15 |
| #72 | Feat/tenant domain | #29 | 2025-12-16 |
| #73 | fix: IllegalArgumentException 예외 처리 및 테스트 수정 | - | 2025-12-16 |
| #74 | feat: Tenant CRUD API 구현 | #34 | 2025-12-16 |

---

## 모듈별 구현 현황

### CM (Course Matrix) 모듈

#### CourseItem API (#64)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/courses/{courseId}/items` | 차시/폴더 생성 | DESIGNER, OPERATOR, TENANT_ADMIN |
| GET | `/api/courses/{courseId}/items` | 차시 목록 조회 | 인증된 사용자 |
| GET | `/api/courses/{courseId}/items/tree` | 트리 구조 조회 | 인증된 사용자 |
| GET | `/api/courses/{courseId}/items/{itemId}` | 차시 상세 조회 | 인증된 사용자 |
| PUT | `/api/courses/{courseId}/items/{itemId}` | 차시 수정 | DESIGNER, OPERATOR, TENANT_ADMIN |
| PATCH | `/api/courses/{courseId}/items/{itemId}/move` | 차시 이동 | DESIGNER, OPERATOR, TENANT_ADMIN |
| DELETE | `/api/courses/{courseId}/items/{itemId}` | 차시 삭제 | DESIGNER, OPERATOR, TENANT_ADMIN |

**계층 구조 특징**:
- 최대 10단계 depth (0~9)
- 폴더/차시 구분
- LearningObject 연결 지원

---

#### CourseRelation API (#69)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/courses/{courseId}/relations` | 학습 순서 생성 | DESIGNER, OPERATOR, TENANT_ADMIN |
| GET | `/api/courses/{courseId}/relations` | 학습 순서 조회 | 인증된 사용자 |
| PUT | `/api/courses/{courseId}/relations` | 학습 순서 수정 | DESIGNER, OPERATOR, TENANT_ADMIN |
| POST | `/api/courses/{courseId}/relations/auto` | 자동 순서 생성 | DESIGNER, OPERATOR, TENANT_ADMIN |
| PATCH | `/api/courses/{courseId}/relations/start` | 시작점 설정 | DESIGNER, OPERATOR, TENANT_ADMIN |
| DELETE | `/api/courses/{courseId}/relations/{relationId}` | 관계 삭제 | DESIGNER, OPERATOR, TENANT_ADMIN |

**학습 순서 모델**:
- Linked List 패턴 (fromItem → toItem)
- 순환 참조 검사
- 시작점 (fromItem = null) 관리

---

### SIS (Student Information System) 모듈

#### 수강신청 CRUD API (#65)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/enrollments` | 수강 신청 | 인증된 사용자 |
| GET | `/api/enrollments` | 수강 목록 (관리자) | OPERATOR, TENANT_ADMIN |
| GET | `/api/enrollments/me` | 내 수강 목록 | 인증된 사용자 |
| GET | `/api/enrollments/{id}` | 수강 상세 | 인증된 사용자 |
| PATCH | `/api/enrollments/{id}/cancel` | 수강 취소 | 인증된 사용자 |
| PATCH | `/api/enrollments/{id}/progress` | 진도 업데이트 | 인증된 사용자 |
| PATCH | `/api/enrollments/{id}/status` | 상태 변경 (관리자) | OPERATOR, TENANT_ADMIN |
| PATCH | `/api/enrollments/{id}/complete` | 수료 처리 | OPERATOR, TENANT_ADMIN |
| DELETE | `/api/enrollments/{id}` | 수강 삭제 (관리자) | OPERATOR, TENANT_ADMIN |

---

#### 학습 통계 API (#67)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/enrollments/me/stats` | 내 학습 통계 |
| GET | `/api/enrollments/course-time/{id}/stats` | 차수별 통계 (관리자) |

**통계 항목**:
- 전체/수료/진행중/취소/미수료 건수
- 평균 진도율
- 수료율

---

### TS (Time Schedule) 모듈

#### 배치 Job - 차수 상태 자동 전환 (#30)

| Job | 스케줄 | 기능 |
|-----|--------|------|
| CourseTimeStatusJob | 매일 00:05 | RECRUITING → ONGOING 전환 |
| CourseTimeStatusJob | 매일 00:05 | ONGOING → CLOSED 전환 |

**전환 조건**:
- RECRUITING → ONGOING: 시작일 도래
- ONGOING → CLOSED: 종료일 경과

---

### Tenant 모듈

#### Tenant Infrastructure (#32)

| 구성요소 | 파일 | 설명 |
|----------|------|------|
| Base Entity | TenantEntity.java | tenant_id 포함 기본 엔티티 |
| Filter | TenantFilter.java | HTTP 요청에서 tenant_id 추출 |
| Context | TenantContext.java | ThreadLocal 기반 테넌트 컨텍스트 |
| Config | TenantFilterConfig.java | Hibernate Filter 활성화 AOP |
| Test Support | TenantTestSupport.java | 테스트용 테넌트 설정 |

**멀티테넌시 구현**:
- Hibernate @Filter를 사용한 자동 tenant_id 필터링
- 모든 테넌트 소속 엔티티는 TenantEntity 상속
- AOP로 쿼리 실행 전 Filter 자동 활성화

---

#### Tenant Entity 및 도메인 설계 (#29)

| 구성요소 | 내용 |
|----------|------|
| Entity | Tenant.java (BaseTimeEntity 상속) |
| Enum | TenantType (B2C, B2B, KPOP) |
| Enum | TenantStatus (PENDING, ACTIVE, SUSPENDED, TERMINATED) |
| Enum | PlanType (FREE, BASIC, PRO, ENTERPRISE) |
| Repository | TenantRepository.java |
| DTO | CreateTenantRequest, UpdateTenantRequest, TenantResponse |

**Tenant는 TenantEntity를 상속하지 않음**:
- 테넌트 마스터 테이블이므로 tenant_id 필터링 불필요
- BaseTimeEntity만 상속 (createdAt, updatedAt)

---

#### Tenant CRUD API (#34)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/tenants` | 테넌트 생성 | SYSTEM_ADMIN |
| GET | `/api/tenants` | 테넌트 목록 조회 | SYSTEM_ADMIN |
| GET | `/api/tenants/{tenantId}` | 테넌트 상세 조회 | SYSTEM_ADMIN |
| PUT | `/api/tenants/{tenantId}` | 테넌트 수정 | SYSTEM_ADMIN |
| DELETE | `/api/tenants/{tenantId}` | 테넌트 삭제 | SYSTEM_ADMIN |
| PATCH | `/api/tenants/{tenantId}/status` | 테넌트 상태 변경 | SYSTEM_ADMIN |
| GET | `/api/tenants/code/{code}` | 코드로 테넌트 조회 | SYSTEM_ADMIN |

**역할 추가**:
- TenantRole에 SYSTEM_ADMIN 추가 (시스템 최고 관리자)

**Exception 클래스**:
- TenantDomainNotFoundException
- DuplicateTenantCodeException
- DuplicateSubdomainException
- DuplicateCustomDomainException
- InvalidTenantStatusException

---

### 공통 수정

#### IllegalArgumentException 예외 처리 (#73)

| 변경 | 내용 |
|------|------|
| GlobalExceptionHandler | IllegalArgumentException 핸들러 추가 |
| 응답 코드 | 500 → 400 Bad Request |
| CourseRelationControllerTest | TenantTestSupport 상속 추가 |

---

## 테스트 현황

| 모듈 | 테스트 수 |
|------|----------|
| CourseItem API | 15 |
| CourseRelation API | 15 |
| SIS Enrollment CRUD | 20+ |
| 학습 통계 | 8 |
| TS 배치 Job | 5+ |
| Tenant Entity | 9 |
| Tenant Repository | 9 |
| Tenant Controller | 10 |
| **Phase 3 합계** | **91+** |
| **전체 합계** | **322** |

---

## 프로젝트 구조 추가

```
src/main/java/com/mzc/lp/
├── common/
│   ├── context/        # TenantContext
│   ├── config/         # TenantFilterConfig (추가)
│   ├── filter/         # TenantFilter (추가)
│   └── support/        # TenantTestSupport (테스트)
├── domain/
│   ├── tenant/         # Tenant 모듈 (신규)
│   │   ├── constant/   # TenantType, TenantStatus, PlanType
│   │   ├── controller/ # TenantController
│   │   ├── service/    # TenantService, TenantServiceImpl
│   │   ├── repository/ # TenantRepository
│   │   ├── entity/     # Tenant
│   │   ├── dto/        # Request/Response DTOs
│   │   └── exception/  # 5개 커스텀 예외
│   └── ...
```

---

## 다음 작업

- [ ] #35 Tenant 설정 API
- [ ] #31 Tenant 브랜딩 API
- [ ] #51 IIS 강사 배정 CRUD API
- [ ] #25 UM 조직 Entity 및 도메인 설계

---

*최종 업데이트: 2025-12-16*

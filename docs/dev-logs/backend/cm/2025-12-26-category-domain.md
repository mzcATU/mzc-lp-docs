# Category 도메인 구현 (멀티테넌트 지원)

## 작업 정보

- **작업 일자**: 2025-12-26
- **작업 담당**: hjj240228mz
- **관련 이슈**: #175
- **관련 PR**: #181

---

## 1. 구현 개요

강의(Course) 분류를 위한 Category 도메인 신규 구현:

| 구성요소 | 내용 |
|----------|------|
| Entity | Category (TenantEntity 상속) |
| Repository | CategoryRepository (테넌트별 조회 메서드) |
| Service | CategoryService / CategoryServiceImpl |
| Controller | CategoryController (5개 API) |
| DTO | Request 2개, Response 1개 |
| Exception | CategoryNotFoundException, DuplicateCategoryCodeException |
| ErrorCode | CAT001, CAT002 |
| Test | CategoryControllerTest |

---

## 2. 신규 생성 파일 (12개)

### Entity (1개)

| 파일 | 설명 |
|------|------|
| Category.java | 카테고리 엔티티 (TenantEntity 상속) |

### Repository (1개)

| 파일 | 설명 |
|------|------|
| CategoryRepository.java | JPA Repository (테넌트별 조회) |

### Service (2개)

| 파일 | 설명 |
|------|------|
| CategoryService.java | 서비스 인터페이스 |
| CategoryServiceImpl.java | 서비스 구현체 |

### Controller (1개)

| 파일 | API 수 | 설명 |
|------|--------|------|
| CategoryController.java | 5개 | CRUD API 엔드포인트 |

### DTO (3개)

| 파일 | 설명 |
|------|------|
| CreateCategoryRequest.java | 생성 요청 DTO |
| UpdateCategoryRequest.java | 수정 요청 DTO |
| CategoryResponse.java | 응답 DTO |

### Exception (2개)

| 파일 | ErrorCode | HTTP | 설명 |
|------|-----------|------|------|
| CategoryNotFoundException.java | CAT001 | 404 | 카테고리 없음 |
| DuplicateCategoryCodeException.java | CAT002 | 409 | 코드 중복 |

### Test (1개)

| 파일 | 테스트 수 | 설명 |
|------|----------|------|
| CategoryControllerTest.java | 다수 | CRUD API 통합 테스트 |

---

## 3. 파일 구조

```
domain/category/
├── controller/
│   └── CategoryController.java         ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateCategoryRequest.java  ✅ 신규
│   │   └── UpdateCategoryRequest.java  ✅ 신규
│   └── response/
│       └── CategoryResponse.java       ✅ 신규
├── entity/
│   └── Category.java                   ✅ 신규
├── exception/
│   ├── CategoryNotFoundException.java  ✅ 신규
│   └── DuplicateCategoryCodeException.java ✅ 신규
├── repository/
│   └── CategoryRepository.java         ✅ 신규
└── service/
    ├── CategoryService.java            ✅ 신규
    └── CategoryServiceImpl.java        ✅ 신규
```

---

## 4. 핵심 설계

### 4.1 Category Entity

```java
@Entity
@Table(name = "cm_categories")
public class Category extends TenantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;           // 카테고리명 (예: "프로그래밍")

    @Column(nullable = false, length = 50)
    private String code;           // 고유 코드 (예: "PROGRAMMING")

    @Column(nullable = false)
    private Integer sortOrder = 0; // 정렬 순서

    @Column(nullable = false)
    private Boolean active = true; // 활성화 여부
}
```

> **TenantEntity 상속**: 멀티테넌트 지원 (tenantId 자동 관리)

### 4.2 코드 중복 검증

```java
// 생성 시
if (categoryRepository.existsByCodeAndTenantId(request.code(), tenantId)) {
    throw new DuplicateCategoryCodeException(request.code());
}

// 수정 시 (자기 자신 제외)
if (categoryRepository.existsByCodeAndTenantIdAndIdNot(request.code(), tenantId, categoryId)) {
    throw new DuplicateCategoryCodeException(request.code());
}
```

### 4.3 활성화 필터링

```java
// 전체 조회
List<Category> findByTenantIdOrderBySortOrderAsc(Long tenantId);

// 활성 카테고리만 조회
List<Category> findByTenantIdAndActiveOrderBySortOrderAsc(Long tenantId, Boolean active);
```

---

## 5. API 명세

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| POST | `/api/categories` | OPERATOR, TENANT_ADMIN | 카테고리 생성 |
| GET | `/api/categories` | ALL | 목록 조회 (activeOnly 파라미터) |
| GET | `/api/categories/{id}` | ALL | 상세 조회 |
| PUT | `/api/categories/{id}` | OPERATOR, TENANT_ADMIN | 수정 |
| DELETE | `/api/categories/{id}` | OPERATOR, TENANT_ADMIN | 삭제 |

### 5.1 생성 API

**Request**
```json
POST /api/categories
{
    "name": "프로그래밍",
    "code": "PROGRAMMING",
    "sortOrder": 1
}
```

**Response (201)**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "name": "프로그래밍",
        "code": "PROGRAMMING",
        "sortOrder": 1,
        "active": true,
        "createdAt": "2025-12-26T04:54:04Z",
        "updatedAt": "2025-12-26T04:54:04Z"
    }
}
```

### 5.2 목록 조회 API

```
GET /api/categories                  → 전체 조회 (정렬순)
GET /api/categories?activeOnly=true  → 활성 카테고리만
```

### 5.3 수정 API

**Request**
```json
PUT /api/categories/1
{
    "name": "프로그래밍 언어",
    "code": "PROGRAMMING",
    "sortOrder": 2,
    "active": false
}
```

> 모든 필드는 선택적 (부분 업데이트 지원)

---

## 6. 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| CAT001 | 404 | Category not found |
| CAT002 | 409 | Category code already exists |

---

## 7. DB 스키마

```sql
CREATE TABLE cm_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    UNIQUE KEY uk_tenant_code (tenant_id, code)
);
```

> `ddl-auto: update` 설정으로 자동 적용됨

---

## 8. 컨벤션 준수 체크

### Entity
- [x] TenantEntity 상속 (멀티테넌트)
- [x] 정적 팩토리 메서드 (`Category.create()`)
- [x] 비즈니스 메서드 (update, activate, deactivate)
- [x] Protected 기본 생성자

### Service
- [x] 인터페이스/구현체 분리
- [x] `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`
- [x] 로깅: INFO(주요 이벤트), DEBUG(조회)

### Controller
- [x] `@RestController`, `@RequestMapping`
- [x] `@PreAuthorize` 권한 체크
- [x] `@Valid @RequestBody`
- [x] ResponseEntity<ApiResponse<T>> 응답

### DTO
- [x] Java Record 사용
- [x] Request: Validation 어노테이션
- [x] Response: `from()` 정적 팩토리 메서드
- [x] Compact Constructor에서 trim 처리

### Exception
- [x] BusinessException 상속
- [x] ErrorCode 사용

---

## 9. 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| ErrorCode.java | CAT001, CAT002 추가 |
| Category.java | 신규 엔티티 |
| CategoryRepository.java | 신규 Repository |
| CategoryService.java | 신규 인터페이스 |
| CategoryServiceImpl.java | 신규 구현체 |
| CategoryController.java | 신규 Controller |
| CreateCategoryRequest.java | 신규 DTO |
| UpdateCategoryRequest.java | 신규 DTO |
| CategoryResponse.java | 신규 DTO |
| CategoryNotFoundException.java | 신규 Exception |
| DuplicateCategoryCodeException.java | 신규 Exception |
| CategoryControllerTest.java | 신규 테스트 |

**총 12개 파일, +1,082줄**

---

## 10. 향후 작업

- [ ] Course 엔티티의 categoryId와 연동 (FK 관계 설정)
- [ ] 카테고리별 강의 목록 조회 API
- [ ] 카테고리 계층 구조 지원 (parentId)

---

**작성**: hjj240228mz
**검토 완료**: 2025-12-26

# Backend LO 모듈 성능 최적화 개발 로그

> N+1 쿼리 최적화 및 낙관적 락 적용

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | 김희수 |
| **작업 일자** | 2025-12-23 |
| **이슈** | #141 콘텐츠 폴더 N+1 쿼리 최적화 및 동시성 제어 |
| **PR** | #147 |

---

## 1. 구현 개요

### 문제점

1. **N+1 쿼리 문제**: `getFolderTree()` 호출 시 트리 깊이만큼 쿼리 발생
   - 루트 폴더 3개 + 각각 자식 2개 = 최소 10개 쿼리

2. **동시성 제어 부재**: `ContentFolder`, `LearningObject`에 `@Version` 없음
   - 동시 수정 시 데이터 충돌 가능

### 해결책

1. **JOIN FETCH 쿼리**: 한 번의 쿼리로 모든 폴더와 children 로드
2. **낙관적 락**: `@Version` 어노테이션으로 동시 수정 감지

---

## 2. 수정 파일 (4개)

### Entity

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| ContentFolder.java | `entity/` | `@Version` 필드 추가 |
| LearningObject.java | `entity/` | `@Version` 필드 추가 |

### Repository

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| ContentFolderRepository.java | `repository/` | JOIN FETCH 쿼리 추가 |

### Service

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| ContentFolderServiceImpl.java | `service/` | 최적화된 쿼리 사용 |

---

## 3. 코드 변경 상세

### 3.1 ContentFolder.java

```java
@Version
private Long version;
```

### 3.2 LearningObject.java

```java
@Version
private Long version;
```

### 3.3 ContentFolderRepository.java

```java
@Query("SELECT DISTINCT cf FROM ContentFolder cf " +
        "LEFT JOIN FETCH cf.children " +
        "WHERE cf.tenantId = :tenantId " +
        "ORDER BY cf.depth ASC, cf.folderName ASC")
List<ContentFolder> findAllWithChildrenByTenantId(@Param("tenantId") Long tenantId);
```

### 3.4 ContentFolderServiceImpl.java

```java
@Override
public List<ContentFolderResponse> getFolderTree(Long tenantId) {
    // JOIN FETCH로 모든 폴더를 한 번에 조회 (N+1 최적화)
    List<ContentFolder> allFolders = contentFolderRepository
            .findAllWithChildrenByTenantId(tenantId);

    // 루트 폴더만 필터링 (children은 이미 로드됨)
    return allFolders.stream()
            .filter(folder -> folder.getParent() == null)
            .map(ContentFolderResponse::fromWithChildren)
            .toList();
}
```

---

## 4. DB 스키마 변경

### learning_object 테이블

```sql
ALTER TABLE learning_object ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
```

### content_folder 테이블

```sql
ALTER TABLE content_folder ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
```

---

## 5. 테스트

### API 테스트

| 테스트 | 결과 |
|--------|------|
| 폴더 트리 조회 | ✅ 정상 동작 |
| 계층 구조 확인 (Marketing > 2024 > Q1, Q2) | ✅ 정상 |
| children 포함 응답 | ✅ 정상 |

### DB 테스트

| 테스트 | 결과 |
|--------|------|
| version 컬럼 생성 확인 | ✅ Hibernate ddl-auto로 자동 생성 |
| 초기값 0 확인 | ✅ 정상 |

---

## 6. 성능 개선 효과

### Before (N+1)

```
폴더 10개 기준:
- 루트 조회: 1 쿼리
- 각 폴더별 children 조회: 10 쿼리
- 총: 11 쿼리
```

### After (JOIN FETCH)

```
폴더 10개 기준:
- 전체 조회: 1 쿼리
- 총: 1 쿼리
```

**쿼리 수 90% 감소**

---

## 7. 낙관적 락 동작

동시 수정 시나리오:

1. 사용자 A가 폴더 조회 (version=0)
2. 사용자 B가 폴더 조회 (version=0)
3. 사용자 A가 수정 → 성공 (version=1)
4. 사용자 B가 수정 → `OptimisticLockException` 발생

→ 프론트엔드에서 재조회 후 재시도 필요

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-23 | 김희수 | N+1 최적화 및 낙관적 락 추가 (#141) |

---

*최종 업데이트: 2025-12-23*

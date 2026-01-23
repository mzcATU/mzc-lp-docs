# Backend CMS 모듈 - 강의 포함 콘텐츠 수정 제한 (Feature 3)

> Content Edit Restriction - 강의(Course)에 포함된 콘텐츠 수정/삭제 제한

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-22 |
| **담당 모듈** | CMS (Content Management) |
| **관련 이슈** | [#140](https://github.com/mzcATU/mzc-lp-backend/issues/140) |
| **관련 PR** | [#144](https://github.com/mzcATU/mzc-lp-backend/pull/144) |
| **관련 브랜치** | `feature/content-edit-restriction` |

---

## 1. 구현 개요

강의(Course)에 포함된 콘텐츠의 수정/삭제를 제한하는 기능 구현:

### 핵심 비즈니스 규칙

- **강의 포함 판단**: `Content → LearningObject → CourseItem` 연결 체인 확인
- **수정 제한**: 강의에 포함된 콘텐츠는 메타데이터 수정, 파일 교체 불가
- **inCourse 필드**: 응답 DTO에 강의 포함 여부 제공

### Phase 4와의 차이점

| 항목 | Phase 4 (버전 관리) | Phase 5 (수정 제한) |
|------|---------------------|---------------------|
| 수정 제한 기준 | LearningObject 존재 여부 | Course 포함 여부 |
| 체크 체인 | Content → LearningObject | Content → LearningObject → CourseItem |
| 적용 범위 | 콘텐츠 수정/교체/복원 | 콘텐츠 수정/교체 |

---

## 2. 수정 파일 (4개)

### CourseItemRepository.java

**추가 메서드:**
```java
/**
 * 특정 콘텐츠가 LearningObject를 통해 강의(Course)에 포함되어 있는지 확인
 */
@Query("SELECT CASE WHEN COUNT(ci) > 0 THEN true ELSE false END " +
       "FROM CourseItem ci WHERE ci.learningObjectId IN " +
       "(SELECT lo.id FROM LearningObject lo WHERE lo.content.id = :contentId)")
boolean existsByContentIdThroughLearningObject(@Param("contentId") Long contentId);
```

### ContentServiceImpl.java

**추가 의존성:**
```java
private final CourseItemRepository courseItemRepository;
```

**추가 메서드:**
```java
/**
 * 콘텐츠가 강의(Course)에 포함되어 있는지 확인
 * Content → LearningObject → CourseItem 연결 확인
 */
public boolean isContentInCourse(Long contentId) {
    // LearningObject가 없으면 Course에도 포함될 수 없음
    if (!learningObjectRepository.existsByContentId(contentId)) {
        return false;
    }
    // LearningObject가 CourseItem에 포함되어 있는지 확인
    return courseItemRepository.existsByContentIdThroughLearningObject(contentId);
}

private void validateContentNotInUse(Long contentId) {
    if (isContentInCourse(contentId)) {
        throw new ContentInUseException(contentId);
    }
}
```

**수정된 메서드:**
```java
@Override
public ContentResponse getContent(Long contentId, Long tenantId) {
    Content content = findContentOrThrow(contentId, tenantId);
    boolean inCourse = isContentInCourse(contentId);
    return ContentResponse.from(content, inCourse);
}
```

### ContentResponse.java

**추가 필드:**
```java
public record ContentResponse(
    // ... 기존 필드 ...
    Boolean inCourse,           // 추가: 강의 포함 여부
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static ContentResponse from(Content content) {
        return from(content, null);
    }

    public static ContentResponse from(Content content, Boolean inCourse) {
        return new ContentResponse(
            // ... 기존 필드 매핑 ...
            inCourse,
            // ... 시간 필드 ...
        );
    }
}
```

### ContentListResponse.java

**추가 필드:**
```java
public record ContentListResponse(
    // ... 기존 필드 ...
    Boolean inCourse,           // 추가: 강의 포함 여부 (목록에서는 null)
    LocalDateTime createdAt
) {
    public static ContentListResponse from(Content content) {
        return from(content, null);
    }

    public static ContentListResponse from(Content content, Boolean inCourse) {
        // ...
    }
}
```

---

## 3. 파일 구조

```
domain/content/
├── dto/
│   └── response/
│       ├── ContentResponse.java        📝 수정 (inCourse 필드 추가)
│       └── ContentListResponse.java    📝 수정 (inCourse 필드 추가)
└── service/
    └── ContentServiceImpl.java         📝 수정 (isContentInCourse, validateContentNotInUse)

domain/course/
└── repository/
    └── CourseItemRepository.java       📝 수정 (existsByContentIdThroughLearningObject 추가)
```

---

## 4. API 변경

### GET /api/contents/{contentId}

**Response 변경:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "originalFileName": "test.pdf",
    "contentType": "DOCUMENT",
    "status": "ACTIVE",
    "inCourse": true,           // 추가됨
    "currentVersion": 1,
    "createdAt": "2025-12-17T13:18:50",
    "updatedAt": "2025-12-17T13:18:50"
  }
}
```

### PATCH /api/contents/{contentId} (강의 포함 시)

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "CT010",
    "message": "Content 2 is in use by learning objects and cannot be modified"
  }
}
```

---

## 5. 수정 제한 동작

### 제한되는 작업

| 작업 | 엔드포인트 | 강의 미포함 | 강의 포함 |
|------|-----------|------------|----------|
| 메타데이터 수정 | `PATCH /api/contents/{id}` | ✅ 허용 | ❌ CT010 |
| 파일 교체 | `PUT /api/contents/{id}/file` | ✅ 허용 | ❌ CT010 |
| 콘텐츠 삭제 | `DELETE /api/contents/{id}` | ✅ 허용 | ❌ CT010 |

### inCourse 값 반환

| API | inCourse 반환 |
|-----|--------------|
| `GET /api/contents/{id}` (단건 조회) | `true` / `false` |
| `GET /api/contents` (목록 조회) | `null` (N+1 방지) |
| `GET /api/contents/my` (내 콘텐츠 목록) | `null` (N+1 방지) |

---

## 6. 구현 참고사항

### 기존 예외 재사용

- 계획서에는 `ContentNotEditableException` (CT011) 신규 생성 예정이었으나
- 기존 `ContentInUseException` (CT010)을 재사용하여 동일 기능 구현
- 결과적으로 더 간결한 구현

### N+1 쿼리 방지

- 목록 조회 시 `inCourse` 필드는 `null` 반환
- 각 콘텐츠마다 Course 포함 여부 조회 시 N+1 문제 발생
- 단건 조회에서만 실제 값 계산

---

## 7. 테스트

### API 테스트 결과

**테스트 환경:**
- 사용자: test1222@test.test (DESIGNER 역할)
- 콘텐츠: content_id = 2
- 연결 체인: Content(2) → LearningObject(8) → CourseItem(1)

**테스트 1: 단건 조회 - inCourse 확인**
```bash
GET /api/contents/2
Response: { "inCourse": true, ... }
```

**테스트 2: 수정 시도 - CT010 에러 확인**
```bash
PATCH /api/contents/2
Request: { "originalFileName": "modified.pdf" }
Response: { "error": { "code": "CT010", "message": "Content 2 is in use..." } }
```

---

## 8. 관련 문서

- [Phase 1](phase1.md) - CMS 기반 구조
- [Phase 2](phase2.md) - Content API
- [Phase 3](phase3.md) - 콘텐츠 상태 관리 (Feature 1)
- [Phase 4](phase4.md) - 콘텐츠 버전 관리 (Feature 2)
- [Content API 명세](../../../structure/backend/content/api.md)
- [Content DB 스키마](../../../structure/backend/content/db.md)

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-22 | Claude Code | 강의 포함 콘텐츠 수정 제한 구현 (Feature 3) |
| 2025-12-22 | Claude Code | inCourse 필드 추가 (ContentResponse, ContentListResponse) |
| 2025-12-22 | Claude Code | CourseItemRepository에 existsByContentIdThroughLearningObject() 추가 |

---

*최종 업데이트: 2025-12-22*

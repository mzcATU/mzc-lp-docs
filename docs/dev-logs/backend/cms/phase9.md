# Backend CMS 모듈 - 다운로드 허용 옵션 및 CourseItem 생성 개선 (Feature 7)

> Content Downloadable Option & ContentId-based CourseItem Creation

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-31 |
| **담당 모듈** | CMS (Content Management), CM (Course Matrix) |
| **관련 이슈** | [#226](https://github.com/mzcATU/mzc-lp-backend/issues/226) |
| **관련 PR (Backend)** | [#235](https://github.com/mzcATU/mzc-lp-backend/pull/235) |
| **관련 PR (Frontend)** | [#159](https://github.com/mzcATU/mzc-lp-frontend/pull/159) |
| **관련 브랜치** | `fix/226-course-content-deletion` |

---

## 1. 구현 개요

콘텐츠 다운로드 허용 옵션 추가 및 강의 차시 생성 로직 개선:

| 기능 | 설명 |
|------|------|
| downloadable 필드 추가 | 콘텐츠별 다운로드 허용 여부 설정 (기본값: true) |
| 다운로드 API 권한 체크 | downloadable=false 시 403 FORBIDDEN 반환 |
| contentId 기반 CourseItem 생성 | learningObjectId 대신 contentId로 차시 생성, LO 자동 생성 |
| JWT 만료 응답 코드 변경 | 403 → 401 UNAUTHORIZED |
| ExistingContentModal 오버플로우 수정 | 스크롤 영역 수정 |

---

## 2. 수정 파일

### Backend (8개)

#### Content.java (Entity)

**추가 필드:**
```java
@Column(name = "downloadable", nullable = false)
private boolean downloadable = true;
```

**생성자 수정:**
```java
public static Content createFileContent(Long tenantId, Long userId, ...) {
    Content content = new Content();
    // ... 기존 코드 ...
    content.downloadable = true;  // 기본값 설정
    return content;
}
```

**업데이트 메서드 추가:**
```java
public void updateDownloadable(boolean downloadable) {
    this.downloadable = downloadable;
}
```

#### ContentServiceImpl.java

**다운로드 권한 체크 추가:**
```java
@Override
public ContentDownloadInfo getFileForDownload(Long contentId, Long tenantId) {
    Content content = findContentOrThrow(contentId, tenantId);

    // 다운로드 허용 여부 체크
    if (!content.isDownloadable()) {
        throw new BusinessException(ErrorCode.DOWNLOAD_NOT_ALLOWED);
    }

    // ... 기존 다운로드 로직 ...
}
```

**업데이트 메서드 추가:**
```java
@Override
@Transactional
public ContentResponse updateDownloadable(Long contentId, boolean downloadable, Long tenantId) {
    Content content = findContentOrThrow(contentId, tenantId);
    content.updateDownloadable(downloadable);
    return ContentResponse.from(content);
}
```

#### ContentController.java

**다운로드 허용 설정 API 추가:**
```java
@PatchMapping("/{id}/downloadable")
public ResponseEntity<ApiResponse<ContentResponse>> updateDownloadable(
        @PathVariable Long id,
        @RequestParam boolean downloadable,
        @AuthenticationPrincipal UserPrincipal principal
) {
    ContentResponse response = contentService.updateDownloadable(
            id, downloadable, principal.getTenantId());
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

#### ErrorCode.java

**에러 코드 추가:**
```java
DOWNLOAD_NOT_ALLOWED(HttpStatus.FORBIDDEN, "C006", "다운로드가 허용되지 않은 콘텐츠입니다"),
```

#### CourseItemService.java / CourseItemServiceImpl.java

**contentId 기반 생성 로직:**
```java
@Override
@Transactional
public CourseItemResponse createItem(Long courseId, CreateItemRequest request, Long tenantId) {
    Course course = findCourseOrThrow(courseId, tenantId);

    // contentId로 LearningObject 조회 또는 생성
    LearningObject learningObject = learningObjectService
            .findOrCreateByContentId(request.contentId(), tenantId);

    CourseItem item = CourseItem.createContentItem(
            course,
            request.itemName(),
            findParentItem(request.parentId()),
            getNextOrderIndex(course, request.parentId()),
            learningObject,
            request.displayName(),
            request.description()
    );

    return CourseItemResponse.from(courseItemRepository.save(item));
}
```

#### LearningObjectService.java / LearningObjectServiceImpl.java

**findOrCreateByContentId 메서드 추가:**
```java
@Override
@Transactional
public LearningObject findOrCreateByContentId(Long contentId, Long tenantId) {
    // 기존 LO가 있으면 반환
    return learningObjectRepository.findByContentIdAndTenantId(contentId, tenantId)
            .orElseGet(() -> {
                // 없으면 새로 생성
                Content content = contentRepository.findByIdAndTenantId(contentId, tenantId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.CONTENT_NOT_FOUND));

                LearningObject newLo = LearningObject.create(
                        tenantId,
                        content.getUserId(),
                        content.getOriginalFileName(),
                        content
                );
                return learningObjectRepository.save(newLo);
            });
}
```

#### JwtAuthenticationFilter.java

**토큰 만료 시 401 반환:**
```java
@Override
protected void doFilterInternal(...) {
    try {
        // ... JWT 검증 로직 ...
    } catch (ExpiredJwtException e) {
        // 403 → 401로 변경
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
            "{\"success\":false,\"error\":{\"code\":\"A002\",\"message\":\"토큰이 만료되었습니다\"}}"
        );
        return;
    }
}
```

#### CourseItemControllerTest.java

**테스트 수정 - 실제 Content 엔티티 사용:**
```java
@Test
void createItem_Success() {
    // Content 먼저 생성
    Content content = Content.createFileContent(
            tenantId, userId, "test.mp4", "stored.mp4",
            "/path/to/file", 1024L, ContentType.VIDEO);
    contentRepository.save(content);

    CreateItemRequest request = new CreateItemRequest(
            "테스트 차시",
            null,
            content.getId(),  // learningObjectId 대신 contentId
            "표시 이름",
            "설명"
    );

    // ... 테스트 로직 ...
}
```

### Frontend (4개)

#### curriculum.types.ts

**CurriculumContentItem 타입 변경:**
```typescript
export interface CurriculumContentItem extends CurriculumItemBase {
  type: 'content';
  contentId: number;  // learningObjectId → contentId
  originalFileName: string;
  contentType: string;
  displayName?: string;
  description?: string;
}
```

#### CourseCreatePage.tsx

**차시 생성 시 contentId 사용:**
```typescript
} else if (isCurriculumContent(item)) {
  await courseService.createItem(courseId, {
    itemName: item.name,
    parentId: parentId ?? undefined,
    contentId: item.contentId,  // learningObjectId → contentId
    displayName: item.displayName || undefined,
    description: item.description || undefined,
  });
}
```

#### ExistingContentModal.tsx

**오버플로우 수정:**
```tsx
<DialogContent className="max-w-2xl max-h-[80vh] bg-bg-default flex flex-col overflow-hidden">
  {/* ... */}
  <div className="flex flex-col gap-4 py-4 flex-1 min-h-0 overflow-hidden">
    {/* 콘텐츠 목록 - 스크롤 영역 */}
    <div className="border border-border rounded-lg overflow-y-auto flex-1 min-h-0">
      {/* ... */}
    </div>
  </div>
</DialogContent>
```

#### courseService.ts (타입)

**CreateItemRequest 타입 업데이트:**
```typescript
export interface CreateItemRequest {
  itemName: string;
  parentId?: number;
  contentId: number;  // learningObjectId → contentId
  displayName?: string;
  description?: string;
}
```

---

## 3. 데이터베이스 스키마 변경

### content 테이블 수정

```sql
ALTER TABLE content
ADD COLUMN downloadable BOOLEAN NOT NULL DEFAULT TRUE;
```

---

## 4. API 변경

### PATCH /api/contents/{id}/downloadable (신규)

콘텐츠 다운로드 허용 여부 설정

**파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| downloadable | boolean | Y | 다운로드 허용 여부 |

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "originalFileName": "example.mp4",
    "downloadable": false,
    ...
  }
}
```

### GET /api/contents/{id}/download

**변경사항:**
- `downloadable=false`인 콘텐츠 다운로드 시 403 FORBIDDEN 반환

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "C006",
    "message": "다운로드가 허용되지 않은 콘텐츠입니다"
  }
}
```

### POST /api/courses/{courseId}/items

**변경사항:**
- `learningObjectId` → `contentId` 파라미터명 변경
- 서버에서 LearningObject 자동 생성/조회

**요청:**
```json
{
  "itemName": "1차시 - 강의 소개",
  "parentId": null,
  "contentId": 123,
  "displayName": "강의 소개 영상",
  "description": "이 강의에 대한 소개입니다"
}
```

---

## 5. 주요 변경 사항

### JWT 토큰 만료 응답 코드

| 변경 전 | 변경 후 |
|--------|--------|
| 403 FORBIDDEN | 401 UNAUTHORIZED |

프론트엔드에서 401 응답 시 토큰 갱신 또는 로그인 페이지로 리다이렉트 처리

### CourseItem 생성 흐름

**변경 전:**
```
Frontend → learningObjectId로 CourseItem 생성 요청
         → LO가 없으면 에러
```

**변경 후:**
```
Frontend → contentId로 CourseItem 생성 요청
         → Backend: Content 조회
         → Backend: LO 존재 확인, 없으면 자동 생성
         → Backend: CourseItem 생성
```

---

## 6. 테스트 결과

| 항목 | 결과 |
|------|------|
| downloadable=true 콘텐츠 다운로드 | ✅ 정상 |
| downloadable=false 콘텐츠 다운로드 | ✅ 403 반환 |
| downloadable 업데이트 API | ✅ 정상 |
| contentId로 CourseItem 생성 | ✅ 정상 |
| LO 자동 생성 확인 | ✅ 정상 |
| JWT 만료 시 401 반환 | ✅ 정상 |
| ExistingContentModal 스크롤 | ✅ 정상 |
| CI 테스트 통과 | ✅ 정상 |

---

## 7. 관련 문서

- [Phase 1](phase1.md) - CMS 기반 구조
- [Phase 2](phase2.md) - Content API
- [Phase 3](phase3.md) - 콘텐츠 상태 관리
- [Phase 4](phase4.md) - Content 버전 관리
- [Phase 5](phase5.md) - 강의 포함 콘텐츠 수정 제한
- [Phase 6](phase6.md) - uploadedFileName 필드 추가
- [Phase 7](phase7.md) - 버전 기록 로직 수정
- [Phase 8](phase8.md) - 콘텐츠 메타데이터 및 다운로드 개선
- [LO-CMS API Summary](../../../../LO-CMS-API-SUMMARY.md) - LO/CMS API 요약

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-31 | Claude Code | Content.downloadable 필드 추가 |
| 2025-12-31 | Claude Code | 다운로드 API 권한 체크 (403 처리) |
| 2025-12-31 | Claude Code | contentId 기반 CourseItem 생성 구현 |
| 2025-12-31 | Claude Code | LearningObject 자동 생성 로직 추가 |
| 2025-12-31 | Claude Code | JWT 토큰 만료 시 401 반환으로 변경 |
| 2025-12-31 | Claude Code | ExistingContentModal 오버플로우 버그 수정 |
| 2025-12-31 | Claude Code | CourseItemControllerTest 수정 (실제 Content 사용) |

---

*최종 업데이트: 2025-12-31*

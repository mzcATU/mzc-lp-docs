# Backend CMS (Content Management System) 개발 로그 - Phase 11

> 학습자용 콘텐츠 스트리밍 API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-07 |
| **관련 이슈** | #303 |
| **관련 PR** | #338 |
| **담당 모듈** | CMS (Content Management System) |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 학습자가 수강 중인 콘텐츠에 직접 접근할 수 있는 API 부재 |
| 원인 | 기존 콘텐츠 API는 관리자용으로 설계됨 |
| 해결 | 학습자 전용 콘텐츠 스트리밍 API 추가 |

### 1.2 구현 범위

| 기능 | 설명 |
|------|------|
| 콘텐츠 스트리밍 | 동영상/오디오 콘텐츠 스트리밍 지원 |
| 접근 권한 검증 | 수강 등록 여부 확인 후 콘텐츠 제공 |
| 진도 추적 연동 | 콘텐츠 시청 시 진도 자동 업데이트 |

---

## 2. API 엔드포인트

### 2.1 스트리밍 API

```
GET /api/learner/contents/{contentId}/stream
```

#### Request Headers

```
Authorization: Bearer {accessToken}
Range: bytes=0-1000000 (선택)
```

#### Response

- 성공 (200/206)
  - Content-Type: video/mp4, audio/mpeg 등
  - Accept-Ranges: bytes
  - Content-Range: bytes 0-1000000/5000000

#### 권한 검증 플로우

```
1. JWT 토큰에서 사용자 ID 추출
2. 콘텐츠가 포함된 코스 확인
3. 사용자의 해당 코스 수강 등록 여부 확인
4. 수강 등록 + 수강 기간 내인 경우만 스트리밍 허용
```

---

## 3. 구현 상세

### 3.1 권한 검증

```java
@GetMapping("/api/learner/contents/{contentId}/stream")
public ResponseEntity<Resource> streamContent(
    @PathVariable Long contentId,
    @AuthenticationPrincipal UserDetails user,
    @RequestHeader(value = "Range", required = false) String rangeHeader
) {
    // 1. 콘텐츠 조회
    Content content = contentService.findById(contentId);

    // 2. 수강 권한 확인
    if (!enrollmentService.hasAccessToContent(user.getId(), contentId)) {
        throw new AccessDeniedException("콘텐츠 접근 권한이 없습니다.");
    }

    // 3. 스트리밍 응답 반환
    return streamingService.stream(content, rangeHeader);
}
```

### 3.2 Range Request 지원

| 기능 | 설명 |
|------|------|
| Partial Content | HTTP 206 응답으로 부분 콘텐츠 제공 |
| Seek 지원 | 동영상 탐색(시간 이동) 지원 |
| 대용량 파일 | 청크 단위로 스트리밍하여 메모리 효율화 |

---

## 4. 보안 고려사항

| 항목 | 대응 방안 |
|------|-----------|
| 무단 접근 | 수강 등록 여부 필수 검증 |
| 토큰 만료 | JWT 유효성 검증 |
| URL 직접 접근 | 서명된 URL 또는 토큰 기반 접근 |

---

## 5. Git 커밋 히스토리

```
12b1e5e feat: 학습자용 콘텐츠 스트리밍 API #303 (#338)
```

---

**작성자**: Claude Code
**최종 수정**: 2026-01-07

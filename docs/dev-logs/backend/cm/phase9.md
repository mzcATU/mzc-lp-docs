# Backend CM (Course Management) 개발 로그 - Phase 9

> 코스 리뷰 시스템 개선, 커뮤니티/공지사항 기능, Course status 필드 추가

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-07 |
| **관련 이슈** | #303, #319, #320, #324, #325, #326, #328, #329, #331, #332, #333, #335, #336 |
| **관련 PR** | #321, #324, #327, #328, #329, #331, #332, #334, #335, #336, #338 |
| **담당 모듈** | CM (Course Management) |

---

## 1. 구현 개요

### 1.1 주요 작업 내역

| 기능 | 설명 | 관련 PR |
|------|------|---------|
| Course status 필드 추가 | Course 엔티티에 DRAFT/PUBLISHED/ARCHIVED 상태 추가 | #333, #335 |
| 코스 리뷰 시스템 개선 | 인프런 방식으로 리뷰 시스템 전면 개편, 차수(CourseTime) 기반으로 변경 | #324, #336 |
| 코스 커뮤니티 기능 | 코스 단위 커뮤니티(Q&A, 자유게시판) 기능 구현 | #319, #331, #332 |
| 코스 공지사항 기능 | 코스별 공지사항 CRUD 기능 구현 | #328 |
| 로드맵 수정 로직 | Safe vs Destructive Update 구분 로직 구현 | #325, #334 |
| Navigation Deadlock 수정 | Navigation 관련 동시성 이슈 해결 | #329 |

---

## 2. Course Status 필드 추가

### 2.1 상태 정의

```java
public enum CourseStatus {
    DRAFT,      // 임시저장 상태
    PUBLISHED,  // 게시됨
    ARCHIVED    // 보관됨
}
```

### 2.2 변경 사항

- Course 엔티티에 `status` 필드 추가
- UpdateCourseRequest에 status 파라미터 추가
- 테스트 코드 업데이트

---

## 3. 코스 리뷰 시스템 개선

### 3.1 인프런 방식 리뷰 시스템

| 변경 전 | 변경 후 |
|---------|---------|
| 코스 단위 리뷰 | 차수(CourseTime) 단위 리뷰 |
| 단순 별점/내용 | 별점 + 제목 + 내용 + 추천 |
| 리뷰 수정 불가 | 리뷰 수정/삭제 가능 |

### 3.2 API 엔드포인트

```
POST   /api/courses/{courseId}/course-times/{courseTimeId}/reviews
GET    /api/courses/{courseId}/course-times/{courseTimeId}/reviews
PUT    /api/courses/{courseId}/course-times/{courseTimeId}/reviews/{reviewId}
DELETE /api/courses/{courseId}/course-times/{courseTimeId}/reviews/{reviewId}
```

### 3.3 리뷰 집계 기능

- 차수별 평균 평점 계산
- 별점 분포 통계 (1~5점)
- 코스 전체 리뷰 수 집계

---

## 4. 코스 커뮤니티 기능

### 4.1 게시판 유형

| 유형 | 설명 |
|------|------|
| Q&A | 질문/답변 게시판 |
| FREE | 자유 게시판 |

### 4.2 API 엔드포인트

```
# 게시글
POST   /api/courses/{courseId}/community/posts
GET    /api/courses/{courseId}/community/posts
GET    /api/courses/{courseId}/community/posts/{postId}
PUT    /api/courses/{courseId}/community/posts/{postId}
DELETE /api/courses/{courseId}/community/posts/{postId}

# 댓글
POST   /api/courses/{courseId}/community/posts/{postId}/comments
GET    /api/courses/{courseId}/community/posts/{postId}/comments
PUT    /api/courses/{courseId}/community/posts/{postId}/comments/{commentId}
DELETE /api/courses/{courseId}/community/posts/{postId}/comments/{commentId}
```

### 4.3 권한 변경

- 코스 커뮤니티 조회 권한 변경 (#332)
- 수강생/강사만 접근 가능하도록 제한

---

## 5. 코스 공지사항 기능

### 5.1 API 엔드포인트

```
POST   /api/courses/{courseId}/announcements
GET    /api/courses/{courseId}/announcements
GET    /api/courses/{courseId}/announcements/{announcementId}
PUT    /api/courses/{courseId}/announcements/{announcementId}
DELETE /api/courses/{courseId}/announcements/{announcementId}
```

### 5.2 기능

- 코스별 공지사항 CRUD
- 중요 공지 상단 고정
- 공지 읽음 처리

---

## 6. 로드맵 수정 로직 개선

### 6.1 Safe vs Destructive Update 구분

| Update 유형 | 설명 | 예시 |
|-------------|------|------|
| Safe Update | 기존 데이터에 영향 없음 | 제목 변경, 설명 추가 |
| Destructive Update | 기존 수강 데이터에 영향 | 코스 삭제, 순서 변경 |

### 6.2 Destructive Update 제한

- 이미 수강생이 있는 로드맵의 파괴적 수정 방지
- 경고 메시지 및 확인 절차 추가

---

## 7. Navigation Deadlock 수정

### 7.1 문제 상황

- 동시 요청 시 Navigation 관련 데드락 발생
- 트랜잭션 충돌로 인한 성능 저하

### 7.2 해결 방안

- 트랜잭션 격리 수준 조정
- 락 순서 일관성 확보

---

## 8. Git 커밋 히스토리

```
3504d83 feat: 리뷰 시스템을 차수(CourseTime) 기반으로 변경
5428357 feat: 코스 리뷰 시스템을 인프런 방식으로 개선 (#336)
35a75ea feat: Course 엔티티에 status 필드 추가 (#335)
ba0c724 fix: UpdateCourseRequest 테스트 코드에 status 파라미터 추가
08b79de feat: Course 엔티티에 status 필드 추가 (#333)
a54c8dc feat: 로드맵 수정 시 Safe vs Destructive Update 구분 로직 구현 (#325) (#334)
d896f81 fix: 코스 커뮤니티 조회 권한 변경 (#332)
4b7c699 feat: 코스 커뮤니티 댓글 API 추가 (#331)
b3172dd Fix/navigation deadlock (#329)
8151dca feat: 코스 공지사항 기능 구현 (#328)
ddcb5f9 fix: /api/courses/my permitAll 제외 처리 (#326) (#327)
4810f48 feat: 코스 리뷰 작성 및 조회 기능 구현 (#324)
dedf7bd feat: TU(강의 설계자/소유자) Roadmap 관리 기능 구현 #320 (#321)
6bd024f feat: 코스(차수) 단위 커뮤니티 기능 구현 (#319)
```

---

**작성자**: Claude Code
**최종 수정**: 2026-01-07

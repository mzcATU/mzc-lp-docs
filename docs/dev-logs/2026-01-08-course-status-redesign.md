# Course 상태 전환 재설계

> **작업 기간**: 2026-01-08 ~ 2026-01-12
> **관련 이슈**: #373, #378, #381, #397, #403, #416, #420, #427, #434

## 개요

Program 엔티티를 제거하고 Course 기반으로 전환하면서, 강의 상태 관리 체계를 재설계했습니다.

## Phase 1: Course 상태 필드 추가 (#373, #335)

### 상태 정의
```java
public enum CourseStatus {
    DRAFT,      // 초안 - 수정 가능
    READY,      // 작성 완료 - 승인 대기
    APPROVED,   // 승인됨 - 차수 개설 가능
    ARCHIVED    // 보관됨
}
```

### 상태 전이 규칙
```
DRAFT → READY (작성완료)
READY → APPROVED (승인)
READY → DRAFT (반려/수정)
APPROVED → ARCHIVED (보관)
```

## Phase 2: Course 기반 CourseTime 생성 (#378)

### 변경 전
```
Program → Snapshot → CourseTime
```

### 변경 후
```
Course (APPROVED) → Snapshot (자동 생성) → CourseTime
```

### API 변경
```
POST /api/course-times
{
  "courseId": 1,        // programId 대신 courseId
  "name": "2026년 1기",
  // ...
}
```

## Phase 3: Program 엔티티 완전 제거 (#381)

### 삭제된 파일 (Backend)
- `Program.java`
- `ProgramRepository.java`
- `ProgramService.java`
- `ProgramController.java`

### 마이그레이션
- `programs` 테이블 → `cm_courses` 테이블로 데이터 이관
- FK 참조 업데이트

## Frontend 적용

### Phase 1: API 연동 변경 (#416)
- `programService.ts` → `courseService.ts`로 메서드 이동

### Phase 2: UI 텍스트 통일 (#420)
- "프로그램" → "과정" 용어 통일

### Phase 3: Program 타입 완전 제거 (#434)
- `Program` 타입 삭제
- `Course` 타입으로 통합

## 완성도 검증 시스템 (#404, #408)

### 과정 발행 전 검증 항목
1. 기본 정보 (제목, 설명, 썸네일)
2. 커리큘럼 (최소 1개 아이템)
3. 각 아이템의 콘텐츠 연결

### 에러 메시지 상세화
```json
{
  "code": "CM017",
  "message": "발행 조건을 충족하지 않습니다",
  "details": {
    "missingFields": ["thumbnail", "description"],
    "emptyItems": [3, 5]
  }
}
```

## 관련 파일

### Backend
- `Course.java` - status 필드 추가
- `CourseStatus.java` - 새 enum
- `CourseServiceImpl.java` - 상태 전환 로직
- `CourseTimeServiceImpl.java` - courseId 기반 생성

### Frontend
- `courseService.ts` - API 메서드 통합
- `CourseDesignPage.tsx` - 상태 전환 UI
- `types/course.ts` - Course 타입 정의

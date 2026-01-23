# Backend CM (Course Management) 개발 로그 - Phase 10

> Course 권한 및 완성도 검증 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228mz |
| **작업 기간** | 2026-01-16 ~ 2026-01-19 |
| **관련 이슈** | #390, #395, #404 |
| **관련 PR** | #391, #403, #408 |
| **담당 모듈** | CM (Course Management) |

---

## 1. 구현 개요

### 1.1 주요 작업 내역

| 기능 | 설명 | 관련 PR |
|------|------|---------|
| DESIGNER 권한 추가 | Course 등록 API에 DESIGNER 역할 권한 부여 | #391 |
| 날짜 필드 제거 | Course 엔티티에서 startDate/endDate 필드 제거 | #403 |
| 완성도 검증 상세화 | CM017 에러 응답에 누락 항목 상세 정보 포함 | #408 |

---

## 2. Course 등록 API DESIGNER 권한 추가 (#391)

### 2.1 변경 사항

DESIGNER(TU) 역할 사용자가 직접 과정을 등록할 수 있도록 권한 추가.

**CourseController.registerCourse()**

| Before | After |
|--------|-------|
| `hasAnyRole('OPERATOR', 'TENANT_ADMIN')` | `hasAnyRole('DESIGNER', 'OPERATOR', 'TENANT_ADMIN')` |

### 2.2 배경

- 기존에는 DESIGNER가 과정을 READY 상태로만 변경 가능
- CO(Course Operator)가 최종 등록(REGISTERED) 처리 필요
- 워크플로우 간소화를 위해 DESIGNER도 직접 등록 가능하도록 변경

---

## 3. Course 시작일/종료일 필드 제거 (#403)

### 3.1 변경 사항

Course 엔티티에서 날짜 관련 필드 및 메서드 완전 제거.

| 파일 | 변경 내용 |
|------|----------|
| `Course.java` | `startDate`, `endDate` 필드 제거 |
| `CreateCourseRequest.java` | 날짜 필드 제거 |
| `UpdateCourseRequest.java` | 날짜 필드 제거 |
| `CourseResponse.java` | 날짜 필드 제거 |
| `CourseTimeFormDataResponse.java` | Course 날짜 의존 제거 |

### 3.2 배경

- Course는 강의 설계 단위, 날짜는 차수(CourseTime)에서 관리
- 불필요한 중복 필드 제거로 도메인 모델 명확화

---

## 4. 완성도 검증 에러 메시지 상세화 (#408)

### 4.1 변경 사항

CM017 에러 응답에 누락된 항목(`missingFields`) 정보를 포함하여 사용자가 어떤 항목이 누락되었는지 명확히 파악 가능.

### 4.2 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `CourseIncompleteException.java` | `missingFields` 필드 추가, 한글 레이블 매핑 |
| `CourseServiceImpl.java` | 누락 항목별 수집 로직으로 변경 |
| `GlobalExceptionHandler.java` | 전용 핸들러 추가 (data에 missingFields 포함) |

### 4.3 API 응답 (개선 후)

```json
{
  "success": false,
  "data": ["description", "items"],
  "error": {
    "code": "CM017",
    "message": "완성되지 않은 강의입니다. 누락 항목: 설명, 차시 (ID: 597)"
  }
}
```

### 4.4 누락 필드 한글 매핑

| 필드명 | 한글 라벨 |
|--------|----------|
| `title` | 제목 |
| `description` | 설명 |
| `categoryId` | 카테고리 |
| `items` | 차시 |

---

## 5. Git 커밋 히스토리

```
2026-01-19 feat: 과정 발행 완성도 검증 에러 메시지 상세화 (CM017) (#408)
2026-01-19 feat: Course 시작일/종료일 필드 제거 (#403)
2026-01-16 feat: Course 등록 API에 DESIGNER 권한 추가 (#391)
```

---

**작성자**: hjj240228mz
**최종 수정**: 2026-01-19

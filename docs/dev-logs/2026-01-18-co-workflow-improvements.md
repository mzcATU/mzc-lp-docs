# CO(운영자) 워크플로우 개선

> **작업 기간**: 2026-01-18 ~ 2026-01-23
> **관련 이슈**: #399, #402, #405, #417, #425, #478, #484, #517

## 개요

운영자(Course Operator)의 차수 관리, 수강생 관리, 과정 목록 기능을 개선했습니다.

## 차수(CourseTime) 관리 개선

### 1. DurationType 기능 추가 (#484)
```java
public enum DurationType {
    FIXED,      // 고정 기간 (startDate ~ endDate)
    FLEXIBLE    // 유연 기간 (수강신청일로부터 N일)
}
```

### CourseTime 생성 시
```typescript
// FIXED 타입
{
  durationType: "FIXED",
  startDate: "2026-02-01",
  endDate: "2026-02-28"
}

// FLEXIBLE 타입
{
  durationType: "FLEXIBLE",
  durationDays: 30  // 수강신청일로부터 30일
}
```

### 2. 차수 상세 페이지 개선 (#513)
- 과정 정보 필드 연동
- 수강생 현황 카드
- 진도율 통계 차트

### 3. 차수 복제 API 확장 (#416)
```
POST /api/course-times/{id}/duplicate
{
  "name": "2026년 2기",
  "startDate": "2026-03-01"
}
```

## 과정 목록 페이지 개선

### 1. 리팩토링 (#478)
- 검색/필터 기능 추가
- 카테고리 필터
- 상태 필터 (DRAFT, READY, APPROVED)

### 2. DatePicker 개선 (#517)
- 월 선택 기능 추가
- 날짜 범위 필터링

## 수강생 관리 개선

### 1. 강제 배정 기능 (#405)
```
POST /api/enrollments/force
{
  "courseTimeId": 1,
  "userIds": [101, 102, 103]
}
```
- 정원 초과 가능
- 관리자 메모 입력

### 2. 필터 기능 (#405)
- 진도율 범위 필터
- 상태 필터 (진행중/완료/미시작)
- 부서별 필터

### 3. 수강신청 워크플로우 개선 (#425)
```
승인 대기 → 승인 → 학습 중 → 수료
           ↘ 반려 ↗
```

## 수강신청 접근 정책 (#425)

### 정책 유형
```java
public enum EnrollmentPolicy {
    OPEN,           // 자유 신청
    APPROVAL,       // 승인 필요
    INVITATION_ONLY // 초대만
}
```

### CourseTime 설정
```json
{
  "enrollmentPolicy": "APPROVAL",
  "autoApprove": false,
  "approvalRequired": true
}
```

## 관련 파일

### Backend
- `CourseTime.java` - durationType 필드 추가
- `EnrollmentPolicy.java` - 새 enum
- `CourseTimeConstraintValidator.java` - 검증 로직
- `EnrollmentServiceImpl.java` - 강제 배정 로직

### Frontend
- `CourseTimeCreatePage.tsx`
- `CourseTimeDetailPage.tsx`
- `StudentManagementPage.tsx`
- `COCoursesPage.tsx`

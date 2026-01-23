# 강의 설계자 (DESIGNER) 플로우

## 1. 강의 생성

### 플로우
```
로그인
  → 강의 관리 메뉴
  → 새 강의 만들기
  → 기본 정보 입력
    - 강의명
    - 카테고리
    - 난이도
    - 설명
    - 썸네일
  → 저장 (임시 저장)
  → 커리큘럼 설계
  → 발행
```

### 주요 화면
1. **강의 관리** (`/designer/courses`)
   - 내가 만든 강의 목록
   - 상태별 필터 (작성 중, 발행됨, 보관됨)
   - 강의 생성 버튼

2. **강의 편집기** (`/designer/courses/:courseId/edit`)
   - 기본 정보 탭
   - 커리큘럼 탭
   - 설정 탭
   - 미리보기

3. **기본 정보**
   - 강의명
   - 카테고리 선택
   - 난이도 (초급/중급/고급)
   - 상세 설명 (에디터)
   - 썸네일 업로드
   - 태그

### API 호출 순서
```typescript
// 1. 강의 생성
POST /api/courses
{
  "title": string,
  "categoryId": number,
  "level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "description": string,
  "thumbnailUrl": string
}

// 2. 강의 수정
PUT /api/courses/{courseId}
{
  ...
}

// 3. 강의 목록 조회
GET /api/courses/my
```

## 2. 커리큘럼 설계

### 플로우
```
강의 편집기
  → 커리큘럼 탭
  → 차시(Item) 추가
  → 차시 유형 선택
    - 비디오
    - 문서
    - 퀴즈
    - 과제
  → 콘텐츠 등록
  → 순서 조정 (드래그앤드롭)
  → 완료 조건 설정
  → 저장
```

### 주요 화면
1. **커리큘럼 편집** (`/designer/courses/:courseId/curriculum`)
   - 차시 목록 (트리 구조)
   - 차시 추가/수정/삭제
   - 순서 조정
   - 미리보기

2. **차시 편집 모달**
   - 차시명
   - 유형 선택
   - 콘텐츠 업로드/선택
   - 완료 조건
     - 동영상: 진도율 (예: 80% 이상)
     - 문서: 열람 시간
     - 퀴즈: 통과 점수
     - 과제: 제출 필수 여부

### API 호출 순서
```typescript
// 1. 차시 추가
POST /api/courses/{courseId}/items
{
  "title": string,
  "type": "VIDEO" | "DOCUMENT" | "QUIZ" | "ASSIGNMENT",
  "contentId": number,
  "sortOrder": number,
  "completionCriteria": {
    "type": string,
    "value": number
  }
}

// 2. 차시 목록 조회
GET /api/courses/{courseId}/items

// 3. 차시 순서 변경
PUT /api/courses/{courseId}/items/reorder
{
  "items": [
    { "id": number, "sortOrder": number }
  ]
}

// 4. 차시 수정
PUT /api/courses/{courseId}/items/{itemId}

// 5. 차시 삭제
DELETE /api/courses/{courseId}/items/{itemId}
```

## 3. 콘텐츠 관리

### 플로우
```
콘텐츠 라이브러리
  → 콘텐츠 업로드
    - 동영상: 파일 업로드 또는 외부 URL
    - 문서: PDF, SCORM 업로드
    - 퀴즈: 퀴즈 빌더로 작성
  → 콘텐츠 메타데이터 입력
  → 저장
  → 커리큘럼에서 재사용
```

### 주요 화면
1. **콘텐츠 라이브러리** (`/designer/contents`)
   - 내가 만든 콘텐츠 목록
   - 유형별 필터
   - 검색
   - 업로드 버튼

2. **콘텐츠 업로드**
   - 파일 선택/드래그앤드롭
   - 제목, 설명
   - 태그
   - 저작권 정보

3. **퀴즈 빌더** (`/designer/quizzes/:quizId/edit`)
   - 문제 추가
   - 문제 유형 (객관식, 주관식, OX)
   - 정답 설정
   - 배점
   - 피드백 메시지

### API 호출 순서
```typescript
// 1. 콘텐츠 업로드
POST /api/contents
{
  "title": string,
  "type": "VIDEO" | "DOCUMENT" | "QUIZ",
  "file": File // 또는 url
}

// 2. 콘텐츠 목록 조회
GET /api/contents/my

// 3. 퀴즈 생성
POST /api/quizzes
{
  "title": string,
  "questions": [
    {
      "question": string,
      "type": "MULTIPLE_CHOICE",
      "options": string[],
      "correctAnswer": number,
      "points": number
    }
  ]
}
```

## 4. 차수(Course Time) 개설

### 플로우
```
강의 상세
  → 차수 관리 탭
  → 새 차수 만들기
  → 일정 설정
    - 시작일
    - 종료일
    - 수강 신청 기간
  → 정원 설정
  → 가격 설정
  → 승인 방식 선택
    - 자동 승인
    - 관리자 승인
    - 초대 전용
  → 강사 배정
  → 발행
```

### 주요 화면
1. **차수 관리** (`/designer/courses/:courseId/times`)
   - 차수 목록
   - 상태 (예정, 진행 중, 종료)
   - 수강 인원
   - 차수 생성 버튼

2. **차수 편집** (`/designer/course-times/:timeId/edit`)
   - 기본 정보
     - 차수명
     - 일정
     - 정원
   - 수강 설정
     - 가격
     - 승인 방식
     - 자동 입과 규칙
   - 강사 배정

### API 호출 순서
```typescript
// 1. 차수 생성
POST /api/course-times
{
  "courseId": number,
  "title": string,
  "startDate": string,
  "endDate": string,
  "enrollmentStartDate": string,
  "enrollmentEndDate": string,
  "capacity": number,
  "price": number,
  "enrollmentType": "AUTO" | "APPROVAL" | "INVITE_ONLY"
}

// 2. 차수 목록 조회
GET /api/course-times?courseId={courseId}

// 3. 강사 배정
POST /api/course-times/{timeId}/instructors
{
  "userId": number
}
```

## 5. 스냅샷 생성

### 플로우
```
강의 편집
  → 커리큘럼 완성
  → 스냅샷 생성 (버전 관리)
  → 차수 연결
  → 차수별로 독립적인 커리큘럼 운영
```

### 설명
- 스냅샷: 특정 시점의 강의 커리큘럼 버전
- 차수마다 다른 스냅샷 사용 가능
- 스냅샷 생성 후에도 원본 강의 수정 가능
- 이미 시작된 차수는 스냅샷 변경 불가

### API 호출 순서
```typescript
// 1. 스냅샷 생성
POST /api/courses/{courseId}/snapshots
{
  "version": string,
  "description": string
}

// 2. 스냅샷 목록 조회
GET /api/courses/{courseId}/snapshots

// 3. 차수에 스냅샷 연결
PUT /api/course-times/{timeId}
{
  "snapshotId": number
}
```

## 6. 수강생 관리

### 플로우
```
차수 상세
  → 수강생 탭
  → 수강 신청 승인/거부
  → 수강생 목록 확인
  → 진도 현황 모니터링
  → 개별 메시지 발송
```

### 주요 화면
1. **수강생 관리** (`/designer/course-times/:timeId/students`)
   - 수강 신청 대기 목록
   - 승인/거부 버튼
   - 수강생 목록
   - 진도율
   - 완료 여부

2. **진도 현황**
   - 전체 진도율
   - 차시별 완료율
   - 미완료 학습자
   - 알림 발송

### API 호출 순서
```typescript
// 1. 수강 신청 목록 조회
GET /api/course-times/{timeId}/enrollments?status=PENDING

// 2. 수강 신청 승인
PUT /api/enrollments/{enrollmentId}/approve

// 3. 수강 신청 거부
PUT /api/enrollments/{enrollmentId}/reject

// 4. 수강생 목록 및 진도 조회
GET /api/course-times/{timeId}/enrollments
GET /api/course-times/{timeId}/progress
```

## 7. 통계 및 분석

### 플로우
```
강의/차수 대시보드
  → 통계 확인
    - 수강 인원
    - 완료율
    - 평균 진도
    - 수강평 점수
  → 학습 패턴 분석
  → 개선점 도출
```

### API 호출 순서
```typescript
// 1. 강의 통계 조회
GET /api/courses/{courseId}/statistics

// 2. 차수 통계 조회
GET /api/course-times/{timeId}/statistics

// 3. 학습 패턴 분석
GET /api/analytics/learning-patterns?courseTimeId={timeId}
```

## 주요 상태 전환

### 강의 상태
```
작성 중 → 발행됨 → (업데이트) → 보관됨
```

### 차시 상태
```
작성 중 → 발행됨 → 삭제됨
```

### 차수 상태
```
예정 → 모집 중 → 진행 중 → 종료됨
```

### 스냅샷 상태
```
생성됨 → 차수에 연결됨 → 잠금됨 (차수 시작 후)
```

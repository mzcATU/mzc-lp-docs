# 학습자 (USER) 플로우

## 1. 강의 탐색 및 수강 신청

### 플로우
```
로그인
  → 대시보드 진입
  → 카탈로그 메뉴 선택
  → 카테고리/검색으로 강의 탐색
  → 강의 상세 보기
  → 차수(Course Time) 선택
  → 수강 신청
  → 결제 (유료인 경우)
  → 수강 확정
  → 내 강의실로 이동
```

### 주요 화면
1. **강의 카탈로그** (`/catalog`)
   - 카테고리별 필터링
   - 검색 기능
   - 강의 목록 (카드 형식)
   - 정렬 옵션 (인기순, 최신순, 가격순 등)

2. **강의 상세** (`/courses/:courseId`)
   - 강의 정보 (제목, 설명, 강사, 난이도)
   - 커리큘럼
   - 수강평
   - 차수 목록
   - 수강 신청 버튼

3. **차수 선택** (`/course-times/:courseTimeId`)
   - 일정 (시작일, 종료일)
   - 정원 및 현재 수강 인원
   - 가격 정보
   - 신청 방식 (자동 승인/관리자 승인/초대 전용)

4. **수강 신청 확인**
   - 신청 정보 확인
   - 결제 (유료인 경우)
   - 신청 완료

### API 호출 순서
```typescript
// 1. 강의 목록 조회
GET /api/courses?category={categoryId}&keyword={keyword}&page={page}

// 2. 강의 상세 조회
GET /api/courses/{courseId}

// 3. 차수 목록 조회
GET /api/course-times?courseId={courseId}

// 4. 수강 신청
POST /api/enrollments
{
  "courseTimeId": number,
  "paymentInfo": {...} // 유료인 경우
}

// 5. 내 수강 목록 조회
GET /api/enrollments/my
```

## 2. 학습 진행

### 플로우
```
내 강의실 진입
  → 수강 중인 강의 선택
  → 학습 화면 진입
  → 차시(Item) 선택
  → 콘텐츠 학습
  → 진도 자동 저장
  → 완료 처리
  → 다음 차시 이동
  → (모든 차시 완료 시) 수료 처리
```

### 주요 화면
1. **내 강의실** (`/my/courses`)
   - 수강 중인 강의 목록
   - 진도율 표시
   - 최근 학습한 강의
   - 수강 상태 (진행 중, 완료, 미시작)

2. **학습 화면** (`/learning/:enrollmentId`)
   - 좌측: 커리큘럼 (차시 목록)
   - 중앙: 콘텐츠 뷰어
     - 비디오
     - 문서 (PDF, SCORM)
     - 퀴즈
     - 과제
   - 우측: 학습 정보
     - 진도율
     - 학습 시간
     - 완료 조건

3. **진도 관리**
   - 자동 진도 저장
   - 완료 조건 충족 시 자동 완료
   - 수료 조건 충족 시 수료증 발급

### API 호출 순서
```typescript
// 1. 수강 정보 조회
GET /api/enrollments/{enrollmentId}

// 2. 학습 콘텐츠 조회
GET /api/learning/{enrollmentId}/items/{itemId}

// 3. 진도 업데이트
PUT /api/learning/{enrollmentId}/items/{itemId}/progress
{
  "progressRate": number,
  "completedAt": string,
  "learningTime": number
}

// 4. 진도 조회
GET /api/learning/{enrollmentId}/progress
```

## 3. 과제 제출

### 플로우
```
학습 화면
  → 과제 차시 선택
  → 과제 안내 확인
  → 과제 작성/파일 업로드
  → 제출
  → 강사 피드백 대기
  → 피드백 확인
  → (필요 시) 재제출
```

### API 호출 순서
```typescript
// 1. 과제 정보 조회
GET /api/assignments/{assignmentId}

// 2. 과제 제출
POST /api/assignments/{assignmentId}/submissions
{
  "content": string,
  "attachments": File[]
}

// 3. 제출 내역 조회
GET /api/assignments/{assignmentId}/submissions/my

// 4. 피드백 확인
GET /api/assignments/{assignmentId}/submissions/{submissionId}
```

## 4. 커뮤니티 참여

### 플로우
```
강의 상세/학습 화면
  → 커뮤니티 탭 선택
  → 게시글 목록 확인
  → 게시글 작성/댓글 작성
  → 좋아요/북마크
  → 알림 수신
```

### API 호출 순서
```typescript
// 1. 게시글 목록 조회
GET /api/community/posts?courseTimeId={courseTimeId}

// 2. 게시글 작성
POST /api/community/posts
{
  "courseTimeId": number,
  "title": string,
  "content": string
}

// 3. 댓글 작성
POST /api/community/posts/{postId}/comments
{
  "content": string
}

// 4. 좋아요
POST /api/community/posts/{postId}/likes
```

## 5. 수료증 발급

### 플로우
```
모든 차시 완료
  → 자동 수료 처리
  → 수료증 발급
  → 수료증 다운로드
  → 수료증 공유
```

### API 호출 순서
```typescript
// 1. 수료 여부 확인
GET /api/enrollments/{enrollmentId}/completion

// 2. 수료증 조회
GET /api/certificates?enrollmentId={enrollmentId}

// 3. 수료증 다운로드
GET /api/certificates/{certificateId}/download
```

## 6. 장바구니 및 찜

### 플로우
```
강의 탐색
  → 관심 강의 찜하기
  → 장바구니 담기
  → 장바구니 확인
  → 결제
  → 수강 신청 완료
```

### API 호출 순서
```typescript
// 1. 찜하기
POST /api/wishlist
{
  "courseTimeId": number
}

// 2. 장바구니 담기
POST /api/cart
{
  "courseTimeId": number
}

// 3. 장바구니 조회
GET /api/cart

// 4. 일괄 결제 및 수강 신청
POST /api/enrollments/bulk
{
  "cartItemIds": number[]
}
```

## 주요 상태 전환

### 수강 상태
```
미신청 → 신청 → (승인 대기) → 승인 완료 → 학습 중 → 완료 → 수료
```

### 진도 상태
```
미시작 → 진행 중 → 완료
```

### 과제 상태
```
미제출 → 제출 → 채점 중 → 채점 완료 (합격/불합격) → (재제출)
```

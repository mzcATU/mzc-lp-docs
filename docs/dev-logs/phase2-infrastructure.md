# Phase 2 Backend 개발 작업 요약

> 2025-12-13 ~ 2025-12-14 작업 내역

---

## PR 히스토리

| PR | 제목 | 이슈 | 머지일 |
|----|------|------|--------|
| #55 | feat(course): Course CRUD API 구현 | #53 | 2025-12-14 |
| #61 | [Feat] TS 정원 관리 및 Public API 구현 | #28 | 2025-12-14 |
| #62 | [Feat] 콘텐츠 썸네일 자동 생성 기능 구현 | #54 | 2025-12-14 |
| #57 | feat: IIS 기반 구조 구현 | - | 2025-12-14 |
| #58 | feat(sis): Enrollment Entity 및 기반 구조 구현 | - | 2025-12-14 |

---

## 모듈별 구현 현황

### CM (Course Matrix) 모듈

#### Course CRUD API (#53)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/courses` | 강의 생성 | DESIGNER, OPERATOR, TENANT_ADMIN |
| GET | `/api/courses` | 강의 목록 조회 (페이징, 키워드 검색) | 인증된 사용자 |
| GET | `/api/courses/{courseId}` | 강의 상세 조회 | 인증된 사용자 |
| PUT | `/api/courses/{courseId}` | 강의 수정 | DESIGNER, OPERATOR, TENANT_ADMIN |
| DELETE | `/api/courses/{courseId}` | 강의 삭제 | DESIGNER, OPERATOR, TENANT_ADMIN |

---

### TS (Time Schedule) 모듈

#### 정원 관리 및 Public API (#28)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| PATCH | `/api/ts/course-times/{id}/capacity` | 정원 변경 | OPERATOR, TENANT_ADMIN |
| GET | `/api/public/course-times` | 공개 차수 목록 | 인증 불필요 |
| GET | `/api/public/course-times/{id}` | 공개 차수 상세 | 인증 불필요 |

**정원 관리 로직**:
- 비관적 락을 사용한 동시성 제어
- 현재 수강 인원보다 적은 정원 설정 방지

---

### CMS (Content Management) 모듈

#### 콘텐츠 썸네일 자동 생성 (#54)

| 기능 | 설명 |
|------|------|
| 이미지 콘텐츠 | 이미지 리사이즈하여 썸네일 생성 |
| 비디오 콘텐츠 | 기본 비디오 아이콘 썸네일 |
| 문서 콘텐츠 | 기본 문서 아이콘 썸네일 |

**ThumbnailService 구현**:
- Java AWT를 사용한 이미지 처리
- 최대 200x200 크기, 비율 유지
- PNG 형식 저장

---

### IIS (Instructor Information System) 모듈

#### 기반 구조 구현 (#57)

| 구성요소 | 파일 |
|----------|------|
| Entity | InstructorAssignment.java, AssignmentHistory.java |
| Enum | InstructorRole (MAIN, ASSISTANT) |
| Repository | InstructorAssignmentRepository, AssignmentHistoryRepository |
| Exception | 4개 커스텀 예외 |
| DTO | Request 2개, Response 2개 |

**강사 배정 모델**:
- 차수(CourseTime)별 강사 배정
- 주강사/보조강사 구분
- 배정 이력 관리 (변경 추적)

---

### SIS (Student Information System) 모듈

#### Enrollment 기반 구조 (#58)

| 구성요소 | 파일 |
|----------|------|
| Entity | Enrollment.java |
| Enum | EnrollmentStatus (ENROLLED, COMPLETED, CANCELLED, FAILED) |
| Repository | EnrollmentRepository.java |
| Exception | 5개 커스텀 예외 |
| DTO | Request 3개, Response 2개 |

**수강 상태 전이**:
```
ENROLLED → COMPLETED (수료)
ENROLLED → CANCELLED (취소)
ENROLLED → FAILED (미수료)
```

---

## 테스트 현황

| 모듈 | 테스트 수 |
|------|----------|
| Course CRUD API | 15+ |
| TS 정원 관리 | 8+ |
| Thumbnail Service | 5+ |
| IIS Repository | 10+ |
| SIS Repository | 10+ |
| **추가 합계** | **48+** |

---

*최종 업데이트: 2025-12-14*

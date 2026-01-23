# Backend IIS 모듈 개발 로그 - Phase 3

> IIS 강사 배정 테스트 코드 구현 (Service, Controller, Repository Test)

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-17 |
| **관련 이슈** | [#49](https://github.com/mzcATU/mzc-lp-backend/issues/49) |
| **담당 모듈** | IIS (Instructor Information System - 강사 배정 관리) |

---

## 1. 구현 개요

강사 배정(InstructorAssignment) 테스트 코드 구현:

| 구성요소 | 내용 |
|----------|------|
| Service Test | InstructorAssignmentServiceTest (Mockito 기반 단위 테스트) |
| Controller Test | InstructorAssignmentControllerTest (MockMvc 기반 통합 테스트) |
| Repository Test | InstructorAssignmentRepositoryTest, AssignmentHistoryRepositoryTest |
| 설정 | build.gradle JWT_SECRET 환경변수 설정 |

---

## 2. 테스트 파일 (4개)

### Service Test

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentServiceTest.java | `test/.../service/` | Service 단위 테스트 (16개) |

### Controller Test

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentControllerTest.java | `test/.../controller/` | Controller 통합 테스트 (6개) |

### Repository Test

| 파일 | 경로 | 설명 |
|------|------|------|
| InstructorAssignmentRepositoryTest.java | `test/.../repository/` | 배정 Repository 테스트 (25개) |
| AssignmentHistoryRepositoryTest.java | `test/.../repository/` | 이력 Repository 테스트 |

---

## 3. 파일 구조

```
test/java/com/mzc/lp/domain/iis/
├── service/
│   └── InstructorAssignmentServiceTest.java     ✅ 테스트
├── controller/
│   └── InstructorAssignmentControllerTest.java  ✅ 테스트
└── repository/
    ├── InstructorAssignmentRepositoryTest.java  ✅ 테스트
    └── AssignmentHistoryRepositoryTest.java     ✅ 테스트
```

---

## 4. 테스트 API 커버리지

### Service 테스트 (16개)

| Method | 테스트 케이스 |
|--------|--------------|
| assignInstructor | MAIN/SUB 배정 성공, 중복 실패, 주강사 중복 실패 |
| getInstructorsByTimeId | 차수별 강사 목록 조회 |
| getAssignment | 배정 단건 조회, NotFound 예외 |
| getAssignmentsByUserId | 사용자별 배정 목록 조회 |
| updateRole | 역할 변경 성공, 비활성 상태 실패, 주강사 중복 실패 |
| replaceInstructor | 강사 교체 성공, 비활성 상태 실패 |
| cancelAssignment | 배정 취소 성공, 비활성 상태 실패 |

### Controller 테스트 (6개)

| Method | Endpoint | 테스트 |
|--------|----------|--------|
| GET | `/api/instructor-assignments/{id}` | 배정 조회 성공/실패 |
| PUT | `/api/instructor-assignments/{id}` | 역할 변경 |
| POST | `/api/instructor-assignments/{id}/replace` | 강사 교체 |
| DELETE | `/api/instructor-assignments/{id}` | 배정 취소 |
| GET | `/api/users/me/instructor-assignments` | 내 배정 목록 |

---

## 5. 테스트 케이스

### Service 테스트 (Mockito)

| 카테고리 | 테스트 | 검증 |
|----------|--------|------|
| 배정 | MAIN 강사 배정 성공 | 배정 생성, 이력 저장 |
| 배정 | SUB 강사 배정 성공 | 배정 생성, 이력 저장 |
| 배정 | 동일 차수 중복 배정 실패 | IIS002 예외 |
| 배정 | MAIN 강사 중복 배정 실패 | IIS003 예외 |
| 조회 | 차수별 강사 목록 조회 | 목록 반환, 상태 필터링 |
| 조회 | 배정 단건 조회 성공 | 배정 정보 반환 |
| 조회 | 존재하지 않는 배정 조회 | IIS001 예외 |
| 조회 | 사용자별 배정 목록 조회 | 페이징 목록 반환 |
| 역할 변경 | ASSISTANT → MAIN 변경 | 역할 변경, 이력 저장 |
| 역할 변경 | 비활성 배정 역할 변경 | IIS004 예외 |
| 역할 변경 | MAIN 존재 시 MAIN으로 변경 | IIS003 예외 |
| 교체 | 강사 교체 성공 | 기존 REPLACED, 신규 ACTIVE |
| 교체 | 비활성 배정 교체 | IIS004 예외 |
| 취소 | 배정 취소 성공 | CANCELLED 상태, 이력 저장 |
| 취소 | 비활성 배정 취소 | IIS004 예외 |

### Controller 테스트 (MockMvc)

| 카테고리 | 테스트 | HTTP Status |
|----------|--------|-------------|
| 조회 | 배정 단건 조회 성공 | 200 OK |
| 조회 | 존재하지 않는 배정 조회 | 404 Not Found |
| 역할 변경 | 역할 변경 성공 | 200 OK |
| 교체 | 강사 교체 성공 | 201 Created |
| 취소 | 배정 취소 성공 | 204 No Content |
| 내 배정 | 내 배정 목록 조회 | 200 OK |

---

## 6. 테스트 결과

### 통합 테스트 (BUILD SUCCESSFUL)

```
47 tests completed, 0 failures
```

### 테스트 유형별 결과

| 테스트 유형 | 테스트 수 | 결과 |
|------------|----------|------|
| Service Tests | 16 | ✅ 전체 통과 |
| Controller Tests | 6 | ✅ 전체 통과 |
| Repository Tests | 25 | ✅ 전체 통과 |
| **Total** | **47** | **✅** |

### 해결한 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| JWT WeakKeyException (0 bits) | JWT_SECRET 환경변수가 빈 문자열 | build.gradle에 테스트용 환경변수 설정 |

---

## 7. 컨벤션 준수 체크

### Service Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@ExtendWith(MockitoExtension.class)` 사용
- [x] `@Mock`, `@InjectMocks` 어노테이션 적용
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴

### Controller Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@SpringBootTest` + `@AutoConfigureMockMvc` 통합 테스트
- [x] `TenantTestSupport` 상속 (멀티테넌시 지원)
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화
- [x] Given-When-Then 패턴
- [x] JWT 인증 토큰 사용

### Repository Test (15-BACKEND-TEST-CONVENTIONS)

- [x] `@DataJpaTest` 사용
- [x] `@DisplayName` 한글 설명
- [x] `@Nested` 그룹화

---

## 8. 수정 파일

### build.gradle

```gradle
tasks.named('test') {
    useJUnitPlatform()
    // JWT_SECRET 환경변수가 빈 문자열인 경우 테스트용 값 설정
    environment 'JWT_SECRET', 'test-secret-key-for-testing-only-minimum-32-characters'
}
```

---

## 9. 참고 사항

### 테스트 환경

| 항목 | 설정 |
|------|------|
| Database | H2 (in-memory) |
| JWT Secret | build.gradle 환경변수 설정 |
| Tenant ID | TenantTestSupport (기본값 1L) |

### 테스트 파일 위치

| 파일 | 경로 |
|------|------|
| InstructorAssignmentServiceTest.java | `src/test/java/com/mzc/lp/domain/iis/service/` |
| InstructorAssignmentControllerTest.java | `src/test/java/com/mzc/lp/domain/iis/controller/` |
| InstructorAssignmentRepositoryTest.java | `src/test/java/com/mzc/lp/domain/iis/repository/` |
| AssignmentHistoryRepositoryTest.java | `src/test/java/com/mzc/lp/domain/iis/repository/` |

---

## 10. 다음 작업

### 완료된 IIS 모듈

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 1 | Entity, Repository, DTO, Exception | ✅ 완료 |
| Phase 2 | Service, Controller | ✅ 완료 |
| Phase 3 | Test Code | ✅ 완료 |

### 추가 개발 사항

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 높음 | TS ↔ IIS 연동 | CourseTime.open() 시 MAIN 강사 배정 검증 |
| 중간 | 강사 정보 조회 API | User 모듈 연동하여 강사 상세 정보 반환 |
| 낮음 | 강사 배정 통계 API | 강사별 배정 현황 통계 |

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-17 | Claude Code | Phase 3 구현 완료 (Test Code) |

---

*최종 업데이트: 2025-12-17*

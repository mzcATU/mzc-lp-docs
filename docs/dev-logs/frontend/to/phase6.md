# Frontend TO Phase 5: 강사 배정 정보 확인 페이지

## 개요

- **이슈**: [#158 - TO 강사 배정 정보 확인 페이지](https://github.com/mzcATU/mzc-lp-frontend/issues/158)
- **브랜치**: `feat/158-to-instructor-assignment-list`
- **작업일**: 2025-12-31

## 작업 내용

TO(Tenant Operator)가 전체 강사 배정 현황을 한눈에 조회할 수 있는 페이지를 구현했습니다.

### 구현 기능

1. **전체 강사 배정 목록 테이블**
   - 강사명, 이메일
   - 차수명, 과정명
   - 역할 (주강사/보조강사/조교)
   - 배정 상태 (활동중/교체됨/취소됨)
   - 학습 기간
   - 배정일

2. **필터 기능**
   - 역할별 필터 (MAIN/SUB/ASSISTANT)
   - 상태별 필터 (ACTIVE/REPLACED/CANCELLED)

3. **검색 기능**
   - 강사명, 차수명, 과정명 검색 (클라이언트 사이드)

4. **통계 카드**
   - 전체 배정 수
   - 주강사 수
   - 보조강사 수
   - 활동 중 배정 수

5. **상세 정보 모달**
   - 행 클릭 시 모달로 상세 정보 표시
   - 강사 정보: 이름, 이메일, 역할, 상태, 배정일
   - 차수 정보: 차수명, 과정명, 학습 기간
   - "차수 상세 페이지로 이동" 버튼

6. **Null 데이터 처리**
   - orphaned 데이터(삭제된 강사/차수/프로그램 참조)에 대한 안전한 처리
   - Optional chaining(`?.`)과 nullish coalescing(`??`)으로 null-safe 구현

## 변경 파일

### Types
- `src/types/to/instructorAssignment.types.ts`
  - `InstructorAssignmentListResponse` 추가
  - `InstructorInfo`, `CourseTimeInfo`, `ProgramInfo` 추가
  - `InstructorAssignmentFilterParams` 확장

### Services
- `src/services/common/api/endpoints.ts`
  - `INSTRUCTOR_ASSIGNMENTS.BASE`, `BY_ID` 추가

- `src/services/to/instructorAssignmentService.ts`
  - `getAssignments()` 함수 추가

### Hooks
- `src/hooks/to/useInstructorAssignmentQueries.ts`
  - `useInstructorAssignments()` 훅 추가
  - Query key 구조 개선

### Pages
- `src/pages/to/instructor/InstructorAssignmentsPage.tsx` (신규)
- `src/pages/to/instructor/index.ts` (신규)

### Routes
- `src/routes/to.routes.tsx`
  - `/to/instructor-assignments` 라우트 추가

### Config
- `src/config/sidebar-menus.ts`
  - IIS Lookup 경로 변경 (`/to/iis` → `/to/instructor-assignments`)

## 백엔드 API

```
GET /api/instructor-assignments
  ?instructorId={number}
  &courseTimeId={number}
  &role={MAIN|SUB|ASSISTANT}
  &status={ACTIVE|REPLACED|CANCELLED}
  &page={number}
  &size={number}
```

**응답 구조:**
```typescript
interface InstructorAssignmentListResponse {
  id: number;
  instructor: { id: number; name: string; email: string } | null;
  courseTime: { id: number; title: string; startDate: string; endDate: string } | null;
  program: { id: number; title: string } | null;
  role: 'MAIN' | 'SUB' | 'ASSISTANT';
  status: 'ACTIVE' | 'REPLACED' | 'CANCELLED';
  assignedAt: string;
  createdAt: string;
}
```

## 디자인 패턴

- `CourseTimesPage`와 동일한 구조 채택
  - 상단: 제목 + 검색바 + 필터 버튼
  - 통계 카드 그리드
  - DataTable로 목록 표시
  - 페이지네이션

- Dialog 컴포넌트로 상세 정보 모달 구현
  - Radix UI 기반 접근성 확보
  - 키보드/ESC 닫기 지원

- 디자인 토큰 사용
  - `bg-bg-app`, `bg-bg-default`, `bg-bg-secondary`
  - `text-text-primary`, `text-text-secondary`
  - `border-border`

- 다국어 지원
  - `t` 객체를 통한 ko/en 라벨 관리

## 테스트 결과

- 빌드 성공 (TypeScript 타입 체크 통과)
- 라우트 등록 확인
- 사이드바 메뉴 연결 확인
- 백엔드 API 연동 테스트 완료
- Null 데이터 처리 확인

## 해결된 이슈

- **Null reference error**: 백엔드에서 orphaned 데이터(삭제된 강사/차수/프로그램 참조) 반환 시 발생하는 `Cannot read properties of null` 오류 해결

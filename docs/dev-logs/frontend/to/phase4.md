# Frontend TO (Tenant Operator) 개발 로그 - Phase 4

> TO 강사 배정(InstructorAssignment) 타입 및 API 서비스 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-28 |
| **관련 이슈** | [#73](https://github.com/mzcATU/mzc-lp-frontend/issues/73) |
| **관련 브랜치** | `feat/to-instructor-assignment-service` |
| **담당 모듈** | TO (Tenant Operator) - 강사 배정 관리 |

---

## 1. 구현 개요

TO(Tenant Operator) 역할에서 차수별 강사 배정을 관리하기 위한 타입 정의와 API 서비스를 구현했습니다.

### 배경

기존 프론트엔드에는 **TU(강사 본인)이 자신의 배정 현황을 조회**하는 기능만 존재했습니다:
- `myAssignmentService.ts`: 내 배정 목록 조회, 내 통계 조회
- `instructorAssignment.types.ts`: TU 전용 응답 타입

하지만 **TO(운영자)가 강사를 배정/교체/취소**하는 관리 기능이 없어 다음 문제가 있었습니다:
1. 강사 배정 불가: 차수를 개설해도 강사를 배정할 수 없음
2. 역할 변경 불가: 보조강사를 주강사로 승격하는 등의 조정이 불가능
3. 강사 교체 불가: 강사 사정으로 인한 교체 시 이력 단절

### 구현 범위

| 구분 | 내용 |
|------|------|
| 타입 재사용 | TU의 `InstructorRole`, `AssignmentStatus`, `InstructorAssignmentResponse` |
| TO 전용 타입 | `AssignInstructorRequest`, `UpdateInstructorRoleRequest`, `ReplaceInstructorRequest`, `CancelAssignmentRequest` |
| 서비스 메서드 | 5개 (배정, 목록조회, 역할변경, 교체, 취소) |

---

## 2. 파일 구조

### 신규 생성

```
src/
├── types/to/
│   └── instructorAssignment.types.ts    # 강사 배정 타입 (신규)
└── services/to/
    └── instructorAssignmentService.ts   # 강사 배정 서비스 (신규)
```

### 수정

```
src/
├── types/to/
│   └── index.ts    # instructorAssignment.types export 추가
└── services/to/
    └── index.ts    # instructorAssignmentService export 추가
```

---

## 3. 상세 구현

### 3.1 타입 정의 (`instructorAssignment.types.ts`)

#### TU 타입 재사용

```typescript
// 공통 타입은 TU에서 재사용 (중복 방지)
export type {
  InstructorRole,
  AssignmentStatus,
  InstructorAssignmentResponse,
} from '@/types/tu/instructorAssignment.types';

export {
  INSTRUCTOR_ROLE_LABELS,
  ASSIGNMENT_STATUS_LABELS,
} from '@/types/tu/instructorAssignment.types';
```

#### TO 전용 Request 타입

```typescript
/** 강사 배정 요청 */
export interface AssignInstructorRequest {
  userId: number;
  role: InstructorRole;
  forceAssign?: boolean; // 일정 충돌 무시
}

/** 역할 변경 요청 */
export interface UpdateInstructorRoleRequest {
  role: InstructorRole;
}

/** 강사 교체 요청 */
export interface ReplaceInstructorRequest {
  newUserId: number;
}

/** 배정 취소 요청 */
export interface CancelAssignmentRequest {
  reason?: string;
}
```

---

### 3.2 서비스 구현 (`instructorAssignmentService.ts`)

| 메서드 | HTTP | 엔드포인트 | 설명 |
|--------|------|------------|------|
| `assignInstructor` | POST | `/times/{timeId}/instructors` | 강사 배정 |
| `getInstructors` | GET | `/times/{timeId}/instructors` | 강사 목록 조회 |
| `updateRole` | PUT | `/times/{timeId}/instructors/{id}` | 역할 변경 |
| `replaceInstructor` | POST | `/times/{timeId}/instructors/{id}/replace` | 강사 교체 |
| `cancelAssignment` | DELETE | `/times/{timeId}/instructors/{id}` | 배정 취소 |

**사용 예시:**
```typescript
// 강사 배정
await instructorAssignmentService.assignInstructor(timeId, {
  userId: 123,
  role: 'MAIN',
  forceAssign: false,
});

// 강사 교체
await instructorAssignmentService.replaceInstructor(timeId, assignmentId, {
  newUserId: 456,
});
```

---

## 4. 설계 결정

### TU 타입 재사용

| 결정 | 이유 |
|------|------|
| `InstructorRole`, `AssignmentStatus` 재사용 | 동일한 enum 값, 중복 정의 방지 |
| `InstructorAssignmentResponse` 재사용 | TO/TU 모두 동일한 응답 구조 사용 |
| Request 타입만 TO에서 정의 | TU는 조회만, TO만 변경 작업 수행 |

### forceAssign 옵션

```typescript
interface AssignInstructorRequest {
  forceAssign?: boolean; // 일정 충돌 무시
}
```

- 강사가 다른 차수와 일정이 겹칠 때 경고 후 강제 배정 가능
- 기본값 `false`: 충돌 시 에러 반환
- `true`: 충돌 무시하고 배정

---

## 5. 체크리스트

- [x] 컨벤션 및 기존 패턴 확인
- [x] 타입 정의 파일 생성 (`instructorAssignment.types.ts`)
- [x] 서비스 구현 (`instructorAssignmentService.ts`)
- [x] Index 파일 업데이트
- [x] TypeScript 빌드 검증 (`npx tsc --noEmit` 통과)
- [x] 코드 리뷰 (기존 패턴 일관성 확인)

---

## 6. 후속 작업

| 이슈 | 제목 | 의존성 |
|------|------|--------|
| #74 | TO 강사 배정 React Query 훅 구현 | #73 완료 필요 |

---

## 7. 관련 문서

- [Phase 1](phase1.md) - 차수 타입 및 API 서비스
- [Phase 2](phase2.md) - 차수 React Query 훅
- [TU instructorAssignment.types.ts](../../../src/types/tu/instructorAssignment.types.ts) - TU 강사 배정 타입

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-28 | Claude Code | TU 타입 재사용 (InstructorRole, AssignmentStatus, Response) |
| 2025-12-28 | Claude Code | TO 전용 Request 타입 정의 (4개) |
| 2025-12-28 | Claude Code | instructorAssignmentService 구현 (5개 메서드) |

---

*최종 업데이트: 2025-12-28*

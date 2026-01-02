# Frontend TO (Tenant Operator) 개발 로그 - Phase 5

> TO 프로그램 페이지 사용자 이름 표시 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-31 |
| **관련 이슈** | [#113](https://github.com/mzcATU/mzc-lp-frontend/issues/113) |
| **관련 브랜치** | `feat/113-program-user-name` |
| **담당 모듈** | TO (Tenant Operator) - 프로그램 관리 페이지 |
| **백엔드 의존성** | [Backend PR #225](https://github.com/mzcATU/mzc-lp-backend/pull/225) 완료 필요 |

---

## 1. 구현 개요

### 배경

프로그램 상세 페이지에서 생성자와 승인자 정보가 숫자(ID)로 표시되어 사용자가 누군지 알 수 없는 문제가 있었습니다.

**현재**: "생성자 ID: 5", "승인자: 3"
**개선**: "생성자: 홍길동", "승인자: 김운영"

### 해결 방안

백엔드 PR #225에서 추가된 사용자 이름 필드들을 프론트엔드 타입에 반영하고, UI에서 이름을 우선 표시하도록 수정했습니다.

### 구현 범위

| 구분 | 내용 | 파일 |
|------|------|------|
| 타입 수정 | 백엔드 응답 필드 추가 | `program.types.ts` |
| 상세 페이지 | creatorName, approvedByName 표시 | `ProgramDetailPage.tsx` |
| 검토 대기 목록 | 신청자(creatorName) 컬럼 추가 | `ProgramPendingPage.tsx` |

---

## 2. 파일 구조

### 수정 파일

```
src/
├── types/common/
│   └── program.types.ts          # 타입 필드 추가
└── pages/to/program/
    ├── ProgramDetailPage.tsx     # 이름 표시 로직
    └── ProgramPendingPage.tsx    # 신청자 컬럼 추가
```

---

## 3. 상세 구현

### 3.1 program.types.ts (타입 수정)

**추가된 필드:**

| 인터페이스 | 추가 필드 |
|-----------|----------|
| `ProgramResponse` | `creatorName`, `ownerId`, `ownerName`, `ownerEmail` |
| `ProgramDetailResponse` | `creatorName`, `ownerId`, `ownerName`, `ownerEmail`, `approvedByName` |
| `PendingProgramResponse` | `creatorName` |

**코드 변경:**

```typescript
// ProgramResponse
export interface ProgramResponse {
  // ... existing fields
  creatorId: number;
  creatorName: string | null;    // NEW
  ownerId: number | null;        // NEW
  ownerName: string | null;      // NEW
  ownerEmail: string | null;     // NEW
  // ...
}

// ProgramDetailResponse
export interface ProgramDetailResponse {
  // ... existing fields
  creatorName: string | null;    // NEW
  ownerId: number | null;        // NEW
  ownerName: string | null;      // NEW
  ownerEmail: string | null;     // NEW
  approvedByName: string | null; // NEW
  // ...
}

// PendingProgramResponse
export interface PendingProgramResponse {
  // ... existing fields
  creatorName: string | null;    // NEW
  // ...
}
```

---

### 3.2 ProgramDetailPage.tsx (상세 페이지)

**변경 내용:**

1. 라벨 변경: "생성자 ID" → "생성자"
2. 생성자 표시: `creatorName` 우선, 없으면 `ID: ${creatorId}` 폴백
3. 승인자 표시: `approvedByName` 우선, 없으면 `ID: ${approvedBy}` 폴백

**다국어 번역 수정:**

```typescript
// Before
creatorId: { ko: '생성자 ID', en: 'Creator ID' },

// After
creator: { ko: '생성자', en: 'Creator' },
```

**생성자 표시 로직:**

```tsx
<div>
  <Label className="text-text-secondary text-xs uppercase tracking-wide">
    {getText('creator')}
  </Label>
  <p className="text-text-primary mt-1 font-medium flex items-center gap-1">
    <User size={14} className="text-text-secondary" />
    {program.creatorName || `ID: ${program.creatorId}`}
  </p>
</div>
```

**승인자 표시 로직:**

```tsx
<p className="text-text-primary mt-1">
  {program.approvedByName || (program.approvedBy ? `ID: ${program.approvedBy}` : getText('notSet'))}
</p>
```

---

### 3.3 ProgramPendingPage.tsx (검토 대기 목록)

**변경 내용:**

검토 대기 프로그램 목록에 "신청자" 컬럼을 추가하여 누가 프로그램을 신청했는지 바로 확인할 수 있도록 개선했습니다.

**다국어 번역 추가:**

```typescript
columnCreator: { ko: '신청자', en: 'Applicant' },
```

**컬럼 정의 추가:**

```tsx
{
  accessorKey: 'creatorName',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title={getText('columnCreator')} />
  ),
  cell: ({ row }) => (
    <span className="text-sm text-text-secondary whitespace-nowrap">
      {row.original.creatorName || `ID: ${row.original.creatorId}`}
    </span>
  ),
},
```

---

## 4. 폴백 패턴

백엔드 호환성을 위해 이름이 없는 경우 ID를 폴백으로 표시합니다:

```typescript
// 기본 패턴
{name || `ID: ${id}`}

// 승인자 (null 가능)
{approvedByName || (approvedBy ? `ID: ${approvedBy}` : '미설정')}
```

---

## 5. 사용된 공통 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| `Label` | 필드 라벨 |
| `DataTable` | 검토 대기 목록 테이블 |
| `DataTableColumnHeader` | 정렬 가능한 컬럼 헤더 |
| `User` (lucide-react) | 사용자 아이콘 |

---

## 6. 체크리스트

- [x] `program.types.ts` 타입 필드 추가
- [x] `ProgramDetailPage.tsx` 생성자/승인자 이름 표시
- [x] `ProgramPendingPage.tsx` 신청자 컬럼 추가
- [x] ID 폴백 로직 구현
- [x] 다국어 지원 (ko/en)
- [x] 빌드 성공 확인

---

## 7. 백엔드 연동

### Backend PR #225 추가 필드

| 응답 타입 | 추가 필드 |
|----------|----------|
| `ProgramResponse` | `creatorName`, `ownerId`, `ownerName`, `ownerEmail` |
| `ProgramDetailResponse` | `creatorName`, `approvedByName`, `ownerId`, `ownerName`, `ownerEmail` |

---

## 8. 후속 작업

| 이슈 | 제목 | 내용 |
|------|------|------|
| #130 | TO 강사 배정 기능 구현 | AssignInstructorModal, 강사 배정 페이지 |
| - | Owner 정보 표시 | ownerName, ownerEmail 필드 활용 |

---

## 9. 관련 문서

- [Phase 4](phase4.md) - TO 프로그램 관리 페이지
- [Backend PR #225](https://github.com/mzcATU/mzc-lp-backend/pull/225) - Program API 사용자 정보 추가
- [Backend PR #222](https://github.com/mzcATU/mzc-lp-backend/pull/222) - B2C OWNER 자동화

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-31 | Claude Code | program.types.ts 타입 필드 추가 |
| 2025-12-31 | Claude Code | ProgramDetailPage.tsx 이름 표시 로직 구현 |
| 2025-12-31 | Claude Code | ProgramPendingPage.tsx 신청자 컬럼 추가 |

---

*최종 업데이트: 2025-12-31*

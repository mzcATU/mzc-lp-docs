# Frontend TU (Tenant User) 개발 로그 - Phase 13

> 프로그램 DRAFT 상태 및 제출 흐름 개선

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228 |
| **작업 일자** | 2026-01-06 |
| **관련 이슈** | [#268](https://github.com/mzcATU/mzc-lp-frontend/issues/268), [#285](https://github.com/mzcATU/mzc-lp-frontend/issues/285), [#293](https://github.com/mzcATU/mzc-lp-frontend/issues/293) |
| **관련 PR** | [#269](https://github.com/mzcATU/mzc-lp-frontend/pull/269), [#289](https://github.com/mzcATU/mzc-lp-frontend/pull/289), [#295](https://github.com/mzcATU/mzc-lp-frontend/pull/295) |
| **담당 모듈** | TU (Tenant User) - Program Management |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 강의(Course)에서 프로그램 신청 시 즉시 PENDING 상태로 전환되어 수정 불가 |
| 원인 | Course → Program 생성과 제출이 한 번에 처리되는 구조 |
| 해결 | DRAFT 상태로 생성 후, 사용자가 검토/수정 후 별도로 제출하는 흐름으로 변경 |

### 1.2 변경된 프로그램 신청 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│ 기존 흐름 (문제)                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Course 상세 → [프로그램 신청] → 바로 PENDING 상태 → 수정 불가          │
└─────────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 개선된 흐름                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Course 상세 → [프로그램 신청] → CourseApplyPage                       │
│                                    │                                │
│                                    ▼                                │
│                              DRAFT 상태로 생성                        │
│                                    │                                │
│                                    ▼                                │
│                            프로그램 상세 페이지                        │
│                                    │                                │
│                                    ▼                                │
│                         ProgramEditPage에서 수정                      │
│                         (스냅샷 정보 수정 가능)                        │
│                                    │                                │
│                                    ▼                                │
│                            [검토 신청] 버튼                           │
│                                    │                                │
│                                    ▼                                │
│                              PENDING 상태                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 구현 범위

| 구분 | 내용 |
|------|------|
| 신규 페이지 | CourseApplyPage (Course → Program 신청 중간 페이지) |
| 신규 컴포넌트 | SnapshotEditForm (스냅샷 정보 수정 폼) |
| 수정 페이지 | ProgramEditPage, CourseDetailPage, MyCoursesPage, MyProgramsPage |
| 백엔드 연동 | Program 삭제 시 Snapshot 삭제 로직 |

---

## 2. 신규/수정 파일

### 2.1 Frontend 신규 파일 (2개)

| 파일 | 경로 | 설명 |
|------|------|------|
| CourseApplyPage.tsx | `src/pages/tu/teaching/courses/` | Course → Program 신청 중간 페이지 |
| SnapshotEditForm.tsx | `src/pages/tu/teaching/programs/components/` | 스냅샷 기본정보 수정 폼 |

### 2.2 Frontend 수정 파일 (7개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| ProgramEditPage.tsx | `src/pages/tu/teaching/programs/` | 스냅샷 수정 폼 통합, DRAFT 생성 로직 |
| CourseDetailPage.tsx | `src/pages/tu/teaching/courses/` | 신청 버튼 → /apply 페이지 이동 |
| MyCoursesPage.tsx | `src/pages/tu/teaching/courses/` | 프로그램 신청 버튼 경로 변경 |
| MyProgramsPage.tsx | `src/pages/tu/teaching/programs/` | 신청 버튼 → /edit 페이지 이동 |
| tu.teaching.routes.tsx | `src/routes/` | /apply 라우트 추가 |
| index.ts | `src/pages/tu/teaching/courses/` | CourseApplyPage export 추가 |
| index.ts | `src/pages/tu/teaching/` | export 경로 수정 |

### 2.3 Backend 수정 파일 (1개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| ProgramServiceImpl.java | `domain/program/service/` | DRAFT 프로그램 삭제 시 스냅샷 함께 삭제 |

---

## 3. 주요 구현 내용

### 3.1 CourseApplyPage - 프로그램 신청 중간 페이지

```typescript
// src/pages/tu/teaching/courses/CourseApplyPage.tsx
const CourseApplyPage = () => {
  // Course 정보 조회 후 폼에 prefill
  const { data: course } = useCourseDetail(courseId);

  const handleSubmit = async (formData: ProgramFormData) => {
    // 1. Snapshot 생성 (Course 커리큘럼 복사)
    const snapshot = await snapshotService.createFromCourse(courseId, {
      name: formData.title,
      description: formData.description,
    });

    // 2. Program 생성 (DRAFT 상태)
    const program = await programService.create({
      courseSnapshotId: snapshot.id,
      title: formData.title,
      // ... 기타 필드
    });

    // 3. 프로그램 상세 페이지로 이동 (수정/제출 가능)
    navigate(`/tu/teaching/programs/${program.id}`);
  };
};
```

### 3.2 DRAFT 상태로 생성 (제출 분리)

```typescript
// 기존: 생성 즉시 PENDING으로 제출
const handleSubmit = async () => {
  const program = await programService.create(data);
  await programService.submit(program.id);  // 즉시 PENDING
};

// 개선: DRAFT 상태 유지, 사용자가 별도 제출
const handleSubmit = async () => {
  const program = await programService.create(data);
  // submit 호출 제거 - DRAFT 상태 유지
  navigate(`/tu/teaching/programs/${program.id}`);  // 상세 페이지에서 검토 후 제출
};
```

### 3.3 SnapshotEditForm - 스냅샷 정보 수정

```typescript
// src/pages/tu/teaching/programs/components/SnapshotEditForm.tsx
interface SnapshotEditFormProps {
  snapshot: SnapshotDetailResponse;
  onSave: (data: SnapshotUpdateRequest) => Promise<void>;
  readOnly?: boolean;  // DRAFT/ACTIVE 외 상태에서는 읽기 전용
}

const SnapshotEditForm = ({ snapshot, onSave, readOnly }: SnapshotEditFormProps) => {
  // 수정 가능 필드: name, description, hashtags
  const [formData, setFormData] = useState({
    name: snapshot.name,
    description: snapshot.description,
    hashtags: snapshot.hashtags,
  });

  // DRAFT/ACTIVE 상태에서만 수정 가능
  const isEditable = !readOnly && ['DRAFT', 'ACTIVE'].includes(snapshot.status);
};
```

### 3.4 Backend - Program 삭제 시 Snapshot 정리

```java
// ProgramServiceImpl.java
@Override
@Transactional
public void delete(Long programId) {
    Program program = findById(programId);

    // DRAFT 상태만 삭제 가능
    if (program.getStatus() != ProgramStatus.DRAFT) {
        throw new ProgramNotDeletableException(programId);
    }

    Long snapshotId = program.getCourseSnapshotId();

    programRepository.delete(program);

    // 스냅샷을 참조하는 다른 프로그램이 없으면 스냅샷도 삭제
    if (snapshotId != null) {
        long refCount = programRepository.countBySnapshotId(snapshotId);
        if (refCount == 0) {
            snapshotService.delete(snapshotId);
        }
    }
}
```

---

## 4. 라우트 구성

### 4.1 추가된 라우트

| 경로 | 컴포넌트 | 용도 |
|------|----------|------|
| `/tu/teaching/courses/:courseId/apply` | CourseApplyPage | Course → Program 신청 |

### 4.2 프로그램 관련 페이지 흐름

```
/tu/teaching/courses                    # 내 강의 목록
    └── /:courseId                      # 강의 상세
        └── /apply                      # 프로그램 신청 (신규)

/tu/teaching/programs                   # 내 프로그램 목록
    └── /:programId                     # 프로그램 상세
        └── /edit                       # 프로그램 수정 (스냅샷 수정 포함)
```

---

## 5. UI 변경 사항

### 5.1 버튼 텍스트 변경

| 위치 | 기존 | 변경 |
|------|------|------|
| CourseDetailPage | "프로그램 신청" | "프로그램 생성" |
| MyCoursesPage | "프로그램 신청" | "프로그램 생성" |
| CourseApplyPage (완료 메시지) | "신청 완료" | "생성 완료" |

### 5.2 ProgramEditPage 개선

| 항목 | 내용 |
|------|------|
| 스냅샷 정보 섹션 | SnapshotEditForm 컴포넌트 추가 |
| 수정 가능 상태 | DRAFT, ACTIVE |
| 저장 동작 | 프로그램 + 스냅샷 변경사항 동시 저장 |

---

## 6. 상태 흐름

### 6.1 Program 상태 전이

```
                    ┌──────────┐
     생성 ─────────▶│  DRAFT   │◀─────── 반려 후 수정
                    └────┬─────┘
                         │ 검토 신청
                         ▼
                    ┌──────────┐
                    │ PENDING  │
                    └────┬─────┘
                    승인 │ │ 반려
              ┌─────────┘ └─────────┐
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │ APPROVED │          │ REJECTED │
        └──────────┘          └──────────┘
```

### 6.2 Snapshot 상태와 수정 가능 여부

| Snapshot 상태 | 수정 가능 | 설명 |
|---------------|----------|------|
| DRAFT | ✅ | 프로그램 생성 직후 |
| ACTIVE | ✅ | 운영 중 (수정 시 버전 관리) |
| ARCHIVED | ❌ | 보관됨 (읽기 전용) |

---

## 7. Git 커밋 히스토리

| 커밋 | 날짜 | 내용 |
|------|------|------|
| 18f3702 | 2026-01-06 | feat: 프로그램 신청 중간 페이지 구현 (#269) |
| 37bd63d | 2026-01-06 | feat(program): add snapshot edit form to ProgramEditPage (#289) |
| 4a368ee | 2026-01-06 | [TU] 프로그램 DRAFT 상태로 생성 후 별도 제출 흐름 적용 (#295) |
| 38a28ce | 2026-01-06 | feat(program): delete snapshot when program is deleted (#309) |

---

## 8. 파일 변경 요약

| 구분 | 파일 수 | 설명 |
|------|---------|------|
| Frontend 신규 | 2 | CourseApplyPage, SnapshotEditForm |
| Frontend 수정 | 7 | 페이지 및 라우트 |
| Backend 수정 | 1 | ProgramServiceImpl |
| **합계** | **10** | |

---

## 9. 관련 문서

- [Frontend TU Phase 12](phase12.md) - CourseTime Public API 연동
- [Backend CM Phase 8](../../backend/cm/phase8.md) - Program 상태 관리

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-06 | hjj240228 | CourseApplyPage 신규 생성 |
| 2026-01-06 | hjj240228 | SnapshotEditForm 컴포넌트 구현 |
| 2026-01-06 | hjj240228 | DRAFT 상태 생성 흐름 적용 |
| 2026-01-06 | hjj240228 | Program 삭제 시 Snapshot 삭제 로직 추가 |

---

*최종 업데이트: 2026-01-06*

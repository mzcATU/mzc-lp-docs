# Frontend TU (Tenant User) 개발 로그 - Phase 19

> 학습 플레이어 개선, 콘텐츠 등록 UX 개선, 일괄 업로드, 오디오 지원

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hseegr-mz |
| **작업 기간** | 2026-01-08 ~ 2026-01-15 |
| **관련 PR** | #361, #366, #372, #398, #401, #404, #411, #418, #431, #433 |
| **담당 모듈** | TU (Tenant User) |

---

## 1. PDF 뷰어 개선 및 메타데이터 표시 (#361)

### 1.1 구현 내용

| 항목 | 설명 |
|------|------|
| PDF 렌더링 개선 | @react-pdf-viewer/core 라이브러리 적용 |
| 다운로드 조건부 표시 | downloadable 여부에 따라 다운로드 버튼 표시 |
| 커리큘럼 정보 | description, pageCount 표시 추가 |

### 1.2 라이브러리 변경

```json
{
  "@react-pdf-viewer/core": "^3.12.0",
  "pdfjs-dist": "3.11.174"  // 라이브러리 호환성 위해 다운그레이드
}
```

### 1.3 Git 커밋

```
80067e0 feat: PDF 뷰어 개선 및 다운로드/커리큘럼 정보 표시 (#338) (#361)
```

---

## 2. 학습 플레이어 커리큘럼 UI 개선 (#372)

### 2.1 개선 내용

| 변경 전 | 변경 후 |
|---------|---------|
| 아이템만 표시 | 차시(폴더) 구조 표시 |
| duration 초단위 | mm:ss 포맷 변환 |
| pageCount 미표시 | PDF 페이지 수 표시 |

### 2.2 CurriculumSidebar 개선

```typescript
// 폴더 포함하여 아이템 평탄화
const flattenItems = (items: CurriculumItem[]): CurriculumItem[] => {
  return items.reduce((acc, item) => {
    if (item.isFolder) {
      acc.push(item);  // 폴더 추가
      acc.push(...flattenItems(item.children || []));  // 하위 아이템
    } else {
      acc.push(item);
    }
    return acc;
  }, [] as CurriculumItem[]);
};
```

### 2.3 Git 커밋

```
4761db9 feat: 학습 플레이어 커리큘럼 UI 개선 (#368) (#372)
```

---

## 3. 콘텐츠 설정 UI 개선 (#366)

### 3.1 변경 내용

| 항목 | 설명 |
|------|------|
| disabled 옵션 | 미구현 옵션 비활성화 + 안내 문구 |
| 카드뷰 페이지 조정 | 3x3 그리드 맞춤 9개 표시 |
| 폴더 서비스 버그 | data.data 이중 래핑 수정 |

### 3.2 RadioOptionCard disabled 지원

```typescript
interface RadioOptionCardProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  disabledMessage?: string;  // "추후 개발 예정"
}
```

### 3.3 Git 커밋

```
2d87b41 feat: 콘텐츠 설정 UI 개선 및 버그 수정 (#363) (#366)
```

---

## 4. 콘텐츠 등록 페이지 UI/UX 개선 (#398)

### 4.1 변경 사항

| 변경 전 | 변경 후 |
|---------|---------|
| 간략 설명, 카테고리 필수 | 선택 필드로 변경 (* 표시 제거) |
| 썸네일 모든 타입에 표시 | 동영상 타입에만 표시 |
| 임시저장, 템플릿 버튼 있음 | 버튼 제거 |
| downloadable 체크 로직 | 체크 제거 (항상 허용) |

### 4.2 Git 커밋

```
3b62da7 feat: 콘텐츠 등록 페이지 UI/UX 개선 (#398)
```

---

## 5. 콘텐츠 등록 위자드 단일 스텝 통합 (#401)

### 5.1 변경 사항

| 변경 전 | 변경 후 |
|---------|---------|
| Step 1: 유형 선택 | Step 1: 유형 선택 + 파일 업로드 + 설정 통합 |
| Step 2: 파일 업로드 | 삭제 |
| Step 3: 설정 및 발행 | 삭제 |

### 5.2 고정값

| 필드 | 값 |
|------|-----|
| completionCriteria | BUTTON_CLICK |
| downloadable | false |

### 5.3 Git 커밋

```
9222426 feat: 콘텐츠 등록 위자드 단일 스텝으로 통합 (#401)
```

---

## 6. 콘텐츠 일괄 등록 기능 (#404)

### 6.1 신규 페이지

```
src/pages/tu/content/ContentBulkUploadPage.tsx
```

### 6.2 기능

| 기능 | 설명 |
|------|------|
| 다중 파일 선택 | 파일 선택 대화상자 |
| 폴더 업로드 | 폴더 단위 업로드 |
| 드래그 앤 드롭 | 드래그로 파일 추가 |
| 업로드 결과 | 성공/실패 건수 표시 |

### 6.3 제한 사항

| 항목 | 제한 |
|------|------|
| 최대 파일 수 | 10개 |
| 최대 파일 크기 | 2GB |

### 6.4 Git 커밋

```
2ea1fce feat: 콘텐츠 일괄 등록 기능 (#402) (#404)
```

---

## 7. 콘텐츠 상세 페이지 인라인 뷰어 적용 (#411)

### 7.1 변경 사항

| 변경 전 | 변경 후 |
|---------|---------|
| 미리보기 버튼 클릭 → 모달 | 페이지 내 바로 표시 |

### 7.2 콘텐츠 타입별 표시

| 콘텐츠 타입 | 표시 방법 |
|-------------|-----------|
| VIDEO | 플레이어 즉시 로드 (autoplay 없음) |
| AUDIO | 오디오 플레이어 바로 표시 |
| IMAGE | 이미지 바로 표시 |
| DOCUMENT/PDF | 인라인 뷰어로 바로 표시 |
| EXTERNAL_LINK | 외부 링크 열기 버튼 표시 |

### 7.3 Git 커밋

```
abe1eea feat: 콘텐츠 상세 페이지 인라인 뷰어 적용 (#410) (#411)
```

---

## 8. 오디오 콘텐츠 업로드 지원 (#418)

### 8.1 지원 포맷

| 확장자 | MIME 타입 |
|--------|-----------|
| mp3 | audio/mpeg |
| wav | audio/wav |
| m4a | audio/mp4 |
| flac | audio/flac |

### 8.2 UI 변경

- 콘텐츠 타입에 audio 추가
- 오디오 타입 카드 UI (Music 아이콘)
- 미리보기 모달의 오디오 아이콘 통일

### 8.3 Git 커밋

```
1bb3850 feat: 오디오 콘텐츠 업로드 지원 (#415) (#418)
```

---

## 9. 콘텐츠 유형 변경 시 업로드 파일 초기화 (#431)

### 9.1 문제 상황

```
동영상 선택 → 파일 업로드 → 문서로 유형 변경
→ 기존: 동영상 파일이 남아있음 (버그)
→ 수정: 파일 정보 초기화
```

### 9.2 해결

```typescript
// loType 변경 시
const handleLoTypeChange = (newType: LOType) => {
  setLoType(newType);
  setUploadedFile(null);      // 파일 초기화
  setExternalUrl('');         // 외부링크 초기화
};
```

### 9.3 Git 커밋

```
8f4b170 fix: 콘텐츠 유형 변경 시 업로드 파일 초기화 (#431)
```

---

## 10. snapshotId 조회 버그 수정 (#433)

### 10.1 문제 상황

```
학습 플레이어 페이지 진입 시 스냅샷 조회 실패
→ 원인: Program에서 snapshotId 조회 시도 (잘못된 위치)
→ 수정: CourseTime에서 snapshotId 조회
```

### 10.2 수정 내용

```typescript
// enrollmentService.ts
export const getEnrollmentForPlayer = async (enrollmentId: number) => {
  const enrollment = await getEnrollment(enrollmentId);

  // 수정 전: enrollment.program.snapshotId (오류)
  // 수정 후: enrollment.courseTime.snapshotId (정상)
  const snapshotId = enrollment.courseTime.snapshotId;

  return {
    ...enrollment,
    snapshotId,
    courseTitle: enrollment.courseTime.courseTitle,
  };
};
```

### 10.3 추가 개선

- 플레이어 페이지 로드 시 완료 상태 동기화 추가

### 10.4 Git 커밋

```
f8a24b4 fix: snapshotId를 CourseTime에서 조회하도록 수정 (#433)
```

---

## 11. 변경 이력

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-01-15 | f8a24b4 | snapshotId 조회 버그 수정 (CourseTime 사용) |
| 2026-01-15 | 8f4b170 | 콘텐츠 유형 변경 시 업로드 파일 초기화 |
| 2026-01-14 | 1bb3850 | 오디오 콘텐츠 업로드 지원 |
| 2026-01-14 | abe1eea | 콘텐츠 상세 페이지 인라인 뷰어 적용 |
| 2026-01-13 | 2ea1fce | 콘텐츠 일괄 등록 기능 |
| 2026-01-13 | 9222426 | 콘텐츠 등록 위자드 단일 스텝 통합 |
| 2026-01-13 | 3b62da7 | 콘텐츠 등록 페이지 UI/UX 개선 |
| 2026-01-08 | 4761db9 | 학습 플레이어 커리큘럼 UI 개선 |
| 2026-01-08 | 2d87b41 | 콘텐츠 설정 UI 개선 및 버그 수정 |
| 2026-01-08 | 80067e0 | PDF 뷰어 개선 및 커리큘럼 정보 표시 |

---

**작성자**: hseegr-mz
**최종 수정**: 2026-01-15

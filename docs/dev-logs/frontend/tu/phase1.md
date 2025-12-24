# Frontend TU (Tenant User) 개발 로그 - Phase 1

> 테넌트 사용자 페이지 구현 - 콘텐츠 관리 API 연동

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | - |
| **작업 일자** | 2024-12-24 |
| **관련 이슈** | - |
| **담당 모듈** | TU (Tenant User) - Content Management |

---

## 1. 구현 개요

### 페이지 목록

| 페이지 | 경로 | 기능 | 상태 |
|--------|------|------|------|
| Dashboard | `/tu/dashboard` | 대시보드 | 미구현 |
| MyLearning | `/tu/learning` | 내 학습 | 미구현 |
| CourseList | `/tu/teaching/courses` | 강의 목록 | 미구현 |
| MyContentPage | `/tu/teaching/content` | 내 콘텐츠 목록 | ✅ 완료 |
| ContentCreatePage | `/tu/teaching/content/new` | 콘텐츠 등록 | ✅ 완료 |
| ContentDetailPage | `/tu/teaching/content/:id` | 콘텐츠 상세 | ✅ 완료 |

---

## 2. 파일 구조

```
src/
├── pages/tu/
│   └── teaching/
│       └── content/
│           ├── MyContentPage.tsx          # 내 콘텐츠 목록 페이지
│           ├── ContentCreatePage.tsx      # 콘텐츠 등록 페이지
│           ├── ContentDetailPage.tsx      # 콘텐츠 상세 페이지
│           └── index.ts
│
├── components/domain/tu/content/
│   ├── ContentRegistrationWizard.tsx      # 콘텐츠 등록 위저드
│   ├── Step1ContentDefinition.tsx         # Step 1: 콘텐츠 정의
│   ├── Step2ContentUpload.tsx             # Step 2: 파일 업로드/외부링크
│   ├── Step3Settings.tsx                  # Step 3: 설정
│   ├── ContentPreviewModal.tsx            # 미리보기 모달
│   └── index.ts
│
├── hooks/tu/
│   ├── useContentQueries.ts               # 콘텐츠 관련 React Query hooks
│   ├── useLearningObjectQueries.ts        # LO 관련 hooks
│   ├── useContentFolderQueries.ts         # 폴더 관련 hooks
│   └── index.ts
│
├── services/tu/
│   ├── contentService.ts                  # 콘텐츠 API 서비스
│   ├── learningObjectService.ts           # LO API 서비스
│   ├── contentFolderService.ts            # 폴더 API 서비스
│   └── index.ts
│
└── types/tu/
    ├── content.ts                         # 콘텐츠 타입 정의
    ├── learningObject.ts                  # LO 타입 정의
    ├── contentFolder.ts                   # 폴더 타입 정의
    └── index.ts
```

---

## 3. 구현 상세

### 3.1 콘텐츠 API 연동

#### contentService.ts
- `getMyContents()` - 내 콘텐츠 목록 조회 (페이징, 필터링)
- `getContent()` - 콘텐츠 상세 조회
- `uploadContent()` - 파일 업로드
- `createExternalLink()` - 외부 링크 생성
- `updateContent()` - 콘텐츠 수정
- `deleteContent()` - 콘텐츠 삭제
- `archiveContent()` - 콘텐츠 보관
- `restoreContent()` - 콘텐츠 복원
- `getPreviewData()` - 미리보기 데이터 (Blob)
- `getVersions()` - 버전 히스토리 조회
- `restoreVersion()` - 버전 복원

#### useContentQueries.ts
- `useContents` - 전체 콘텐츠 목록
- `useMyContents` - 내 콘텐츠 목록
- `useContent` - 콘텐츠 상세
- `useUploadContent` - 파일 업로드 mutation
- `useCreateExternalLink` - 외부 링크 생성 mutation
- `useDeleteContent` - 삭제 mutation
- `useArchiveContent` - 보관 mutation
- `useRestoreContent` - 복원 mutation
- `useContentPreview` - 미리보기 데이터

### 3.2 MyContentPage 기능

- 콘텐츠 목록 카드 형태로 표시
- 통계 카드 (전체, 활성, 보관됨, 외부링크)
- 타입/상태별 필터링
- 검색 기능
- 페이지네이션
- 미리보기 모달
- 보관/복원/삭제 기능

### 3.3 ContentPreviewModal 기능

- VIDEO: `<video>` 태그로 Blob URL 재생
- AUDIO: `<audio>` 태그로 Blob URL 재생
- IMAGE: `<img>` 태그로 Blob URL 표시
- DOCUMENT (PDF): 새 탭에서 보기 + 다운로드 버튼
- EXTERNAL_LINK: 외부 링크 정보 표시 + 새 탭 열기 버튼

### 3.4 ContentCreatePage 기능

- 3단계 위저드 형태
- Step 1: 콘텐츠 타입 선택, 제목/설명 입력
- Step 2: 파일 업로드 또는 외부 링크 입력
- Step 3: 추가 설정

---

## 4. 해결한 이슈

### 4.1 403 Forbidden 에러
- **문제**: API 호출 시 Authorization 헤더 누락
- **해결**: axios 인터셉터에서 토큰 자동 추가
```typescript
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4.2 콘텐츠 목록 미표시
- **문제**: 백엔드 응답 구조 불일치 (`data.content` vs `data`)
- **해결**: 응답 파싱 로직 수정
```typescript
const response = await axiosInstance.get<PageResponse<ContentListResponse>>(...);
return response.data; // PageResponse 전체 반환
```

### 4.3 외부 링크 400 Bad Request
- **문제**: `loType` 필드 값 불일치 (`external-link` vs `EXTERNAL_LINK`)
- **해결**: 백엔드 Enum 형식에 맞게 수정

### 4.4 외부 링크 파일 크기 NaN
- **문제**: 외부 링크는 fileSize가 null
- **해결**: null 체크 후 '-' 표시

### 4.5 PDF 미리보기 검은 화면
- **문제**: iframe/object 태그로 Blob URL PDF 렌더링 실패
- **해결**: "새 탭에서 보기" + "다운로드" 버튼으로 대체

---

## 5. 체크리스트

- [ ] 대시보드 페이지
- [ ] 내 학습 페이지
- [ ] 강의 목록 페이지
- [x] 콘텐츠 목록 페이지 (MyContentPage)
- [x] 콘텐츠 등록 페이지 (ContentCreatePage)
- [x] 콘텐츠 미리보기 모달 (ContentPreviewModal)
- [x] 콘텐츠 API 연동 (CRUD)
- [x] 콘텐츠 상세 페이지 (ContentDetailPage)
- [x] 버전 히스토리 UI 구현

---

## 6. Git 커밋 히스토리

```
feat: TU 콘텐츠 API 연동 및 미리보기 모달 구현
- contentService에 getPreviewData 메서드 추가 (Blob 응답)
- useContentPreview hook 추가
- ContentPreviewModal 컴포넌트 구현
  - VIDEO/AUDIO: 직접 재생
  - IMAGE: 직접 표시
  - DOCUMENT: 새 탭/다운로드 버튼
  - EXTERNAL_LINK: 외부 링크 열기 버튼
- MyContentPage에 미리보기 모달 연동
```

---

## 7. 다음 단계

1. ~~콘텐츠 상세 페이지 (ContentDetailPage) 구현~~ ✅ 완료
2. ~~버전 히스토리 UI 구현~~ ✅ 완료
3. 대시보드, 내 학습, 강의 목록 페이지 구현
4. 콘텐츠 수정 기능 추가 (inline edit)

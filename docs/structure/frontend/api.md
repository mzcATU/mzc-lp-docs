# Frontend API 클라이언트

> Frontend API 모듈 구조 (역할별 분리)

---

## 1. API 클라이언트 구성

### 1.1 Axios 인스턴스

```typescript
// src/services/common/api/axiosInstance.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 2. Course API (CM + CR)

> 백엔드 API: [course/api.md](../backend/course/api.md)

### 2.1 courseService.ts

```typescript
// src/services/common/courseService.ts
import axiosInstance from '@/services/common/api/axiosInstance';
import { API_ENDPOINTS } from '@/services/common/api/endpoints';

export const courseService = {
  // ============================================
  // Course CRUD
  // ============================================

  /** 강의 생성 */
  create: (request: CreateCourseRequest) =>
    axiosInstance.post<CourseResponse>(API_ENDPOINTS.COURSES.BASE, request),

  /** 강의 목록 조회 */
  getCourses: (params?: CourseFilterParams) =>
    axiosInstance.get<PageResponse<CourseResponse>>(API_ENDPOINTS.COURSES.BASE, { params }),

  /** 내 강의 목록 조회 */
  getMyCourses: (params?: CourseFilterParams) =>
    axiosInstance.get<PageResponse<CourseResponse>>(API_ENDPOINTS.COURSES.MY, { params }),

  /** 강의 상세 조회 */
  getCourse: (id: number) =>
    axiosInstance.get<CourseDetailResponse>(API_ENDPOINTS.COURSES.BY_ID(id)),

  /** 강의 수정 */
  update: (id: number, request: UpdateCourseRequest) =>
    axiosInstance.put<CourseResponse>(API_ENDPOINTS.COURSES.BY_ID(id), request),

  /** 강의 삭제 */
  delete: (id: number) =>
    axiosInstance.delete(API_ENDPOINTS.COURSES.BY_ID(id)),

  // ============================================
  // 상태 관리 (DRAFT → READY → REGISTERED)
  // ============================================

  /** 작성완료 (DRAFT → READY) */
  ready: (id: number) =>
    axiosInstance.post<CourseResponse>(API_ENDPOINTS.COURSES.READY(id)),

  /** 작성중으로 (READY → DRAFT) */
  unready: (id: number) =>
    axiosInstance.post<CourseResponse>(API_ENDPOINTS.COURSES.UNREADY(id)),

  /** 등록 (READY → REGISTERED) */
  register: (id: number, request?: RegisterCourseRequest) =>
    axiosInstance.post<CourseRegistrationResponse>(API_ENDPOINTS.COURSES.REGISTER(id), request),

  // ============================================
  // Course Items (차시/폴더)
  // ============================================

  /** 차시 추가 */
  createItem: (courseId: number, request: CreateItemRequest) =>
    axiosInstance.post<CourseItemResponse>(API_ENDPOINTS.COURSES.ITEMS(courseId), request),

  /** 폴더 생성 */
  createFolder: (courseId: number, request: CreateFolderRequest) =>
    axiosInstance.post<CourseItemResponse>(API_ENDPOINTS.COURSES.FOLDERS(courseId), request),

  /** 계층 구조 조회 */
  getItemsHierarchy: (courseId: number) =>
    axiosInstance.get<CourseItemHierarchyResponse[]>(API_ENDPOINTS.COURSES.ITEMS_HIERARCHY(courseId)),

  /** 순서대로 차시 조회 */
  getItemsOrdered: (courseId: number) =>
    axiosInstance.get<CourseItemResponse[]>(API_ENDPOINTS.COURSES.ITEMS_ORDERED(courseId)),

  /** 항목 이동 */
  moveItem: (courseId: number, request: MoveItemRequest) =>
    axiosInstance.put<CourseItemResponse>(API_ENDPOINTS.COURSES.ITEMS_MOVE(courseId), request),

  /** 항목 이름 변경 */
  updateItemName: (courseId: number, itemId: number, request: UpdateItemNameRequest) =>
    axiosInstance.patch<CourseItemResponse>(API_ENDPOINTS.COURSES.ITEM_NAME(courseId, itemId), request),

  /** 표시 정보 변경 */
  updateItemDisplayInfo: (courseId: number, itemId: number, request: UpdateDisplayInfoRequest) =>
    axiosInstance.patch<CourseItemResponse>(API_ENDPOINTS.COURSES.ITEM_DISPLAY_INFO(courseId, itemId), request),

  /** 학습 객체 변경 */
  updateItemLearningObject: (courseId: number, itemId: number, request: UpdateLearningObjectRequest) =>
    axiosInstance.patch<CourseItemResponse>(API_ENDPOINTS.COURSES.ITEM_LEARNING_OBJECT(courseId, itemId), request),

  /** 항목 삭제 */
  deleteItem: (courseId: number, itemId: number) =>
    axiosInstance.delete(API_ENDPOINTS.COURSES.ITEM_BY_ID(courseId, itemId)),
};
```

### 2.2 Course Relations API (미구현)

> ⚠️ **TODO**: 학습 순서 관련 API는 프론트엔드에서 아직 구현되지 않음

백엔드에서 제공하는 API:
- `POST /api/courses/{id}/relations` - 학습 순서 설정
- `GET /api/courses/{id}/relations` - 학습 순서 조회
- `PUT /api/courses/{id}/relations` - 학습 순서 수정
- `DELETE /api/courses/{id}/relations/{relationId}` - 순서 연결 삭제
- `PUT /api/courses/{id}/relations/start` - 시작점 설정
- `POST /api/courses/{id}/relations/auto` - 자동 순서 생성

### 2.3 타입 정의

```typescript
// src/types/common/course.types.ts
export type CourseStatus = 'DRAFT' | 'READY' | 'REGISTERED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseType = 'ONLINE' | 'OFFLINE' | 'BLENDED';

export interface CourseResponse {
  courseId: number;
  title: string;
  description: string;
  level: CourseLevel;
  type: CourseType;
  status: CourseStatus;
  estimatedHours: number | null;
  categoryId: number | null;
  thumbnailUrl: string | null;
  tags: string[];
  itemCount: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseItemResponse {
  itemId: number;
  itemName: string;
  displayName: string;
  description: string | null;
  depth: number;
  parentId: number | null;
  learningObjectId: number | null;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  title: string;
  description?: string;
  level?: CourseLevel;
  type?: CourseType;
  estimatedHours?: number;
  categoryId?: number;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface CreateItemRequest {
  itemName: string;
  parentId?: number;
  learningObjectId: number;
  displayName?: string;
  description?: string;
}

export interface CreateFolderRequest {
  folderName: string;
  parentId?: number;
}
```

---

## 3. Content API (CMS)

> 백엔드 API: [content/api.md](../backend/content/api.md)

### 3.1 contentService.ts

```typescript
// src/services/tu/contentService.ts
import axiosInstance from '@/services/common/api/axiosInstance';
import { API_ENDPOINTS } from '@/services/common/api/endpoints';

export const contentService = {
  // ============================================
  // 업로드
  // ============================================

  /** 파일 업로드 */
  uploadFile: async (file: File, options?: UploadFileOptions) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folderId) formData.append('folderId', String(options.folderId));
    if (options?.originalFileName) formData.append('originalFileName', options.originalFileName);
    if (options?.description) formData.append('description', options.description);
    if (options?.tags) formData.append('tags', options.tags);
    if (options?.completionCriteria) formData.append('completionCriteria', options.completionCriteria);
    if (options?.downloadable !== undefined) formData.append('downloadable', String(options.downloadable));

    return axiosInstance.post<ContentResponse>(API_ENDPOINTS.CONTENTS.UPLOAD, formData, {
      headers: { 'Content-Type': undefined },
      timeout: 300000,
    });
  },

  /** 다중 파일 일괄 업로드 (최대 10개) */
  bulkUploadFiles: async (files: File[], options?: BulkUploadOptions) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (options?.folderId) formData.append('folderId', String(options.folderId));

    return axiosInstance.post<BulkUploadResponse>(API_ENDPOINTS.CONTENTS.BULK_UPLOAD, formData, {
      headers: { 'Content-Type': undefined },
      timeout: 600000,
    });
  },

  /** 외부 링크 등록 */
  createExternalLink: (request: CreateExternalLinkRequest) =>
    axiosInstance.post<ContentResponse>(API_ENDPOINTS.CONTENTS.EXTERNAL_LINK, request),

  // ============================================
  // 조회
  // ============================================

  /** 콘텐츠 목록 조회 */
  getContents: (params?: ContentFilterParams) =>
    axiosInstance.get<PageResponse<ContentListResponse>>(API_ENDPOINTS.CONTENTS.BASE, { params }),

  /** 내 콘텐츠 목록 조회 (DESIGNER용) */
  getMyContents: (params?: ContentFilterParams) =>
    axiosInstance.get<PageResponse<ContentListResponse>>(API_ENDPOINTS.CONTENTS.MY, { params }),

  /** 콘텐츠 상세 조회 */
  getContent: (id: number) =>
    axiosInstance.get<ContentResponse>(API_ENDPOINTS.CONTENTS.BY_ID(id)),

  // ============================================
  // 수정/삭제
  // ============================================

  /** 메타데이터 수정 */
  updateContent: (id: number, request: UpdateContentRequest) =>
    axiosInstance.put<ContentResponse>(API_ENDPOINTS.CONTENTS.BY_ID(id), request),

  /** 파일 교체 */
  replaceFile: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.put<ContentResponse>(API_ENDPOINTS.CONTENTS.FILE(id), formData, {
      headers: { 'Content-Type': undefined },
      timeout: 300000,
    });
  },

  /** 콘텐츠 삭제 */
  deleteContent: (id: number) =>
    axiosInstance.delete(API_ENDPOINTS.CONTENTS.BY_ID(id)),

  /** 콘텐츠 보관 (Archive) */
  archiveContent: (id: number) =>
    axiosInstance.post<ContentResponse>(API_ENDPOINTS.CONTENTS.ARCHIVE(id)),

  /** 콘텐츠 복원 */
  restoreContent: (id: number) =>
    axiosInstance.post<ContentResponse>(API_ENDPOINTS.CONTENTS.RESTORE(id)),

  // ============================================
  // 스트리밍/다운로드
  // ============================================

  /** 스트리밍 URL 반환 */
  getStreamUrl: (id: number) => `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.CONTENTS.STREAM(id)}`,

  /** 다운로드 URL 반환 */
  getDownloadUrl: (id: number) => `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.CONTENTS.DOWNLOAD(id)}`,

  /** 미리보기 URL 반환 */
  getPreviewUrl: (id: number) => `${import.meta.env.VITE_API_BASE_URL}${API_ENDPOINTS.CONTENTS.PREVIEW(id)}`,

  // ============================================
  // 버전 관리
  // ============================================

  /** 버전 히스토리 조회 */
  getVersions: (id: number) =>
    axiosInstance.get<ContentVersionResponse[]>(API_ENDPOINTS.CONTENTS.VERSIONS(id)),

  /** 특정 버전 조회 */
  getVersion: (id: number, versionNumber: number) =>
    axiosInstance.get<ContentVersionResponse>(API_ENDPOINTS.CONTENTS.VERSION_BY_NUMBER(id, versionNumber)),

  /** 버전 복원 */
  restoreVersion: (id: number, versionNumber: number, request?: RestoreVersionRequest) =>
    axiosInstance.post<ContentResponse>(API_ENDPOINTS.CONTENTS.VERSION_RESTORE(id, versionNumber), request),
};
```

### 3.2 미구현 API

| 백엔드 API | 설명 | 상태 |
|-----------|------|------|
| `POST /api/contents` | 메타데이터만 생성 | 미구현 |
| `GET /api/contents/type/{type}` | 타입별 조회 | 미구현 |
| `GET /api/contents/uploader/{id}` | 업로더별 조회 | 미구현 |
| `GET /api/contents/{id}/text` | 텍스트 추출 | 미구현 |

### 3.3 타입 정의

```typescript
// src/types/tu/content.types.ts
export type ContentType = 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'EXTERNAL_LINK';
export type ContentStatus = 'ACTIVE' | 'ARCHIVED';
export type CompletionCriteria = 'BUTTON_CLICK' | 'PERCENT_90' | 'PERCENT_100';

export interface ContentResponse {
  contentId: number;
  originalFileName: string;
  storedFileName?: string;
  contentType: ContentType;
  status: ContentStatus;
  fileSize?: number;
  duration?: number;
  resolution?: string;
  pageCount?: number;
  externalUrl?: string;
  filePath?: string;
  thumbnailPath?: string;
  description?: string;
  tags?: string;
  completionCriteria?: CompletionCriteria;
  downloadable: boolean;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileOptions {
  folderId?: number;
  originalFileName?: string;
  description?: string;
  tags?: string;
  category?: string;
  completionCriteria?: CompletionCriteria;
  thumbnail?: File;
  downloadable?: boolean;
}

export interface CreateExternalLinkRequest {
  url: string;
  name: string;
  folderId?: number;
}
```

---

## 4. Learning Object API (LO)

> 백엔드 API: [learning/api.md](../backend/learning/api.md)

### 4.1 learningObjectService.ts

```typescript
// src/services/tu/learningObjectService.ts
import axiosInstance from '@/services/common/api/axiosInstance';
import { API_ENDPOINTS } from '@/services/common/api/endpoints';

export const learningObjectService = {
  /** 학습객체 생성 */
  create: (request: CreateLearningObjectRequest) =>
    axiosInstance.post<LearningObjectResponse>(API_ENDPOINTS.LEARNING_OBJECTS.BASE, request),

  /** 학습객체 목록 조회 */
  getLearningObjects: (params?: LearningObjectFilterParams) =>
    axiosInstance.get<PageResponse<LearningObjectResponse>>(API_ENDPOINTS.LEARNING_OBJECTS.BASE, { params }),

  /** 학습객체 상세 조회 */
  getLearningObject: (id: number) =>
    axiosInstance.get<LearningObjectResponse>(API_ENDPOINTS.LEARNING_OBJECTS.BY_ID(id)),

  /** Content ID로 학습객체 조회 */
  getLearningObjectByContentId: (contentId: number) =>
    axiosInstance.get<LearningObjectResponse>(API_ENDPOINTS.LEARNING_OBJECTS.BY_CONTENT_ID(contentId)),

  /** 학습객체 수정 */
  update: (id: number, request: UpdateLearningObjectRequest) =>
    axiosInstance.put<LearningObjectResponse>(API_ENDPOINTS.LEARNING_OBJECTS.BY_ID(id), request),

  /** 학습객체 폴더 이동 */
  moveToFolder: (id: number, request: MoveFolderRequest) =>
    axiosInstance.put<LearningObjectResponse>(API_ENDPOINTS.LEARNING_OBJECTS.FOLDER(id), request),

  /** 학습객체 삭제 */
  delete: (id: number) =>
    axiosInstance.delete(API_ENDPOINTS.LEARNING_OBJECTS.BY_ID(id)),
};
```

### 4.2 contentFolderService.ts

```typescript
// src/services/tu/contentFolderService.ts
import axiosInstance from '@/services/common/api/axiosInstance';
import { API_ENDPOINTS } from '@/services/common/api/endpoints';

export const contentFolderService = {
  /** 폴더 생성 */
  create: (request: CreateContentFolderRequest) =>
    axiosInstance.post<ContentFolderResponse>(API_ENDPOINTS.CONTENT_FOLDERS.BASE, request),

  /** 전체 폴더 트리 조회 */
  getFolderTree: () =>
    axiosInstance.get<ContentFolderResponse[]>(API_ENDPOINTS.CONTENT_FOLDERS.TREE),

  /** 폴더 상세 조회 */
  getFolder: (id: number) =>
    axiosInstance.get<ContentFolderResponse>(API_ENDPOINTS.CONTENT_FOLDERS.BY_ID(id)),

  /** 하위 폴더 목록 조회 */
  getChildren: (id: number) =>
    axiosInstance.get<ContentFolderResponse[]>(API_ENDPOINTS.CONTENT_FOLDERS.CHILDREN(id)),

  /** 폴더명 수정 */
  update: (id: number, request: UpdateContentFolderRequest) =>
    axiosInstance.put<ContentFolderResponse>(API_ENDPOINTS.CONTENT_FOLDERS.BY_ID(id), request),

  /** 폴더 이동 */
  move: (id: number, request: MoveContentFolderRequest) =>
    axiosInstance.put<ContentFolderResponse>(API_ENDPOINTS.CONTENT_FOLDERS.MOVE(id), request),

  /** 폴더 삭제 */
  delete: (id: number) =>
    axiosInstance.delete(API_ENDPOINTS.CONTENT_FOLDERS.BY_ID(id)),
};
```

### 4.3 미구현 API

| 백엔드 API | 설명 | 상태 |
|-----------|------|------|
| `GET /api/learning-objects/owner/{id}` | 소유자별 조회 | 미구현 |
| `GET /api/learning-objects/{id}/usage-count` | 사용 현황 조회 | 미구현 |

### 4.4 타입 정의

```typescript
// src/types/tu/learning.types.ts
export interface LearningObjectResponse {
  learningObjectId: number;
  name: string;
  contentId?: number;
  contentType?: ContentType;
  duration?: number;
  resolution?: string;
  folderId?: number;
  folderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentFolderResponse {
  folderId: number;
  folderName: string;
  parentId: number | null;
  depth: number;
  childCount?: number;
  itemCount?: number;
  children?: ContentFolderResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearningObjectRequest {
  name: string;
  contentId: number;
  folderId?: number;
}

export interface CreateContentFolderRequest {
  folderName: string;
  parentId?: number;
}
```

---

## 5. 공통 타입

### 5.1 API Response

```typescript
// src/types/common/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ErrorInfo;
}

export interface ErrorInfo {
  code: string;
  message: string;
  status: number;
}

export interface PageResponse<T> {
  content: T[];
  number: number;      // 현재 페이지 (0부터 시작)
  size: number;        // 페이지 크기
  totalElements: number;
  totalPages: number;
}
```

---

## 6. 소스 위치

```
frontend/src/
├── services/
│   ├── common/
│   │   ├── api/
│   │   │   ├── axiosInstance.ts    # Axios 인스턴스
│   │   │   └── endpoints.ts        # API 엔드포인트 상수
│   │   ├── authService.ts          # 인증 서비스
│   │   └── courseService.ts        # Course API (CRUD + Items)
│   ├── sa/                         # System Admin 서비스
│   │   ├── dashboardService.ts
│   │   ├── tenantService.ts
│   │   ├── analyticsService.ts
│   │   ├── systemSettingsService.ts
│   │   └── noticeService.ts
│   ├── ta/                         # Tenant Admin 서비스
│   │   ├── dashboardService.ts
│   │   ├── brandingService.ts
│   │   ├── tenantSettingsService.ts
│   │   ├── employeeService.ts
│   │   ├── groupService.ts
│   │   ├── departmentService.ts
│   │   ├── tenantCategoryService.ts
│   │   ├── tenantFeaturesService.ts
│   │   ├── memberPoolService.ts
│   │   ├── bannerService.ts
│   │   └── notificationTemplateService.ts
│   ├── co/                         # Course Operator 서비스
│   │   ├── dashboardService.ts
│   │   ├── enrollmentService.ts
│   │   ├── timeService.ts
│   │   ├── snapshotService.ts
│   │   ├── memberPoolService.ts
│   │   ├── instructorAssignmentService.ts
│   │   ├── autoEnrollmentRuleService.ts
│   │   └── userService.ts
│   └── tu/                         # Tenant User 서비스
│       ├── contentService.ts       # 콘텐츠 API (CMS)
│       ├── learningObjectService.ts # 학습객체 API (LO)
│       ├── contentFolderService.ts # 콘텐츠 폴더 API
│       ├── courseDetailService.ts  # 강의 상세 (학습자용)
│       ├── courseExploreService.ts # 강의 탐색
│       ├── catalogService.ts       # 카탈로그
│       ├── enrollmentService.ts    # 수강 신청
│       ├── roadmapService.ts       # 로드맵
│       ├── communityService.ts     # 커뮤니티
│       ├── courseReviewService.ts  # 강의 리뷰
│       ├── wishlistService.ts      # 찜하기
│       ├── cartService.ts          # 장바구니
│       ├── notificationService.ts  # 알림
│       ├── certificateService.ts   # 수료증
│       └── ...
├── types/
│   ├── common/
│   │   ├── api.ts                  # 공통 API 타입
│   │   └── course.types.ts         # Course 타입
│   ├── sa/
│   ├── ta/
│   ├── co/
│   └── tu/
│       ├── content.types.ts        # 콘텐츠 타입
│       └── learning.types.ts       # 학습객체 타입
└── hooks/
    ├── common/
    │   └── useCourses.ts           # Course React Query Hooks
    ├── sa/
    ├── ta/
    ├── co/
    └── tu/
        ├── useContents.ts          # 콘텐츠 React Query Hooks
        └── useLearningObjects.ts   # 학습객체 React Query Hooks
```

---

## 7. 백엔드 API 매핑 요약

| 모듈 | 프론트엔드 서비스 | 백엔드 문서 | 구현 상태 |
|------|------------------|------------|----------|
| Course CRUD | `common/courseService.ts` | [course/api.md](../backend/course/api.md) | ✅ 완료 |
| Course Items | `common/courseService.ts` | [course/api.md](../backend/course/api.md) | ✅ 완료 |
| Course Relations | - | [course/api.md](../backend/course/api.md) | ❌ 미구현 |
| Content | `tu/contentService.ts` | [content/api.md](../backend/content/api.md) | ✅ 대부분 완료 |
| Learning Object | `tu/learningObjectService.ts` | [learning/api.md](../backend/learning/api.md) | ✅ 대부분 완료 |
| Content Folder | `tu/contentFolderService.ts` | [learning/api.md](../backend/learning/api.md) | ✅ 완료 |

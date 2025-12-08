# Frontend API 클라이언트

> Frontend API 모듈 구조

---

## 1. API 클라이언트 구성

### 1.1 Axios 인스턴스

```typescript
// src/api/client.ts
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

### 2.1 courseApi.ts

```typescript
// src/api/courseApi.ts
import apiClient from './client';
import { Course, CourseItem, CourseRelation, CreateCourseRequest } from '@/types/course';

export const courseApi = {
  // 강의 CRUD
  createCourse: (data: CreateCourseRequest) =>
    apiClient.post<ApiResponse<Course>>('/courses', data),

  getCourses: () =>
    apiClient.get<ApiResponse<Course[]>>('/courses'),

  getCourse: (id: number) =>
    apiClient.get<ApiResponse<Course>>(`/courses/${id}`),

  updateCourse: (id: number, data: Partial<CreateCourseRequest>) =>
    apiClient.put<ApiResponse<Course>>(`/courses/${id}`, data),

  deleteCourse: (id: number) =>
    apiClient.delete(`/courses/${id}`),

  // 차시/폴더 관리
  addItem: (courseId: number, data: CreateItemRequest) =>
    apiClient.post<ApiResponse<CourseItem>>(`/courses/${courseId}/items`, data),

  createFolder: (courseId: number, data: CreateFolderRequest) =>
    apiClient.post<ApiResponse<CourseItem>>(`/courses/${courseId}/folders`, data),

  deleteItem: (itemId: number) =>
    apiClient.delete(`/courses/items/${itemId}`),

  getHierarchy: (courseId: number) =>
    apiClient.get<ApiResponse<CourseItem[]>>(`/courses/${courseId}/items/hierarchy`),

  updateItemName: (courseId: number, itemId: number, name: string) =>
    apiClient.patch(`/courses/${courseId}/items/${itemId}/name`, { itemName: name }),

  // 학습 순서 (CR)
  setRelations: (courseId: number, relations: RelationInput[]) =>
    apiClient.post<ApiResponse<void>>(`/courses/${courseId}/relations`, { relations }),

  getRelations: (courseId: number) =>
    apiClient.get<ApiResponse<CourseRelation[]>>(`/courses/${courseId}/relations`),

  updateRelations: (courseId: number, relations: RelationInput[]) =>
    apiClient.put<ApiResponse<void>>(`/courses/${courseId}/relations`, { relations }),

  autoGenerateRelations: (courseId: number) =>
    apiClient.post<ApiResponse<void>>(`/courses/${courseId}/relations/auto`),
};
```

### 2.2 타입 정의

```typescript
// src/types/course.ts
export interface Course {
  courseId: number;
  courseName: string;
  instructorId: number;
  items?: CourseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseItem {
  itemId: number;
  itemName: string;
  depth: number;
  parentId: number | null;
  learningObjectId: number | null;
  isFolder: boolean;
  children?: CourseItem[];
}

export interface CourseRelation {
  relationId: number;
  fromItemId: number | null;
  toItemId: number;
}

export interface CreateCourseRequest {
  courseName: string;
  instructorId: number;
}

export interface CreateItemRequest {
  itemName: string;
  parentId?: number;
  learningObjectId: number;
}

export interface CreateFolderRequest {
  folderName: string;
  parentId?: number;
}

export interface RelationInput {
  fromItemId: number | null;
  toItemId: number;
}
```

---

## 3. Content API (CMS)

### 3.1 contentApi.ts

```typescript
// src/api/contentApi.ts
import apiClient from './client';
import { Content, ExternalLinkRequest } from '@/types/content';

export const contentApi = {
  // 파일 업로드
  upload: (file: File, folderId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', String(folderId));
    }

    return apiClient.post<ApiResponse<Content>>('/contents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        console.log(`Upload Progress: ${percent}%`);
      },
    });
  },

  // 외부 링크 등록
  addExternalLink: (data: ExternalLinkRequest) =>
    apiClient.post<ApiResponse<Content>>('/contents/external-link', data),

  // 콘텐츠 조회
  getContents: (params?: ContentQueryParams) =>
    apiClient.get<ApiResponse<PageResponse<Content>>>('/contents', { params }),

  getContent: (id: number) =>
    apiClient.get<ApiResponse<Content>>(`/contents/${id}`),

  deleteContent: (id: number) =>
    apiClient.delete(`/contents/${id}`),

  // 스트리밍/다운로드 URL
  getStreamUrl: (id: number) =>
    `/api/contents/${id}/stream`,

  getDownloadUrl: (id: number) =>
    `/api/contents/${id}/download`,

  getThumbnailUrl: (id: number) =>
    `/api/contents/${id}/thumbnail`,
};
```

### 3.2 타입 정의

```typescript
// src/types/content.ts
export type ContentType = 'VIDEO' | 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'EXTERNAL_LINK';

export interface Content {
  contentId: number;
  originalFileName: string;
  storedFileName?: string;
  contentType: ContentType;
  fileSize?: number;
  duration?: number;
  resolution?: string;
  pageCount?: number;
  externalUrl?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalLinkRequest {
  url: string;
  name: string;
  folderId?: number;
}

export interface ContentQueryParams {
  folderId?: number;
  type?: ContentType;
  page?: number;
  size?: number;
}
```

---

## 4. Learning Object API (LO)

### 4.1 learningApi.ts

```typescript
// src/api/learningApi.ts
import apiClient from './client';
import { LearningObject, ContentFolder } from '@/types/learning';

export const learningApi = {
  // 학습객체 CRUD
  getLearningObjects: (params?: LearningObjectQueryParams) =>
    apiClient.get<ApiResponse<PageResponse<LearningObject>>>('/learning-objects', { params }),

  getLearningObject: (id: number) =>
    apiClient.get<ApiResponse<LearningObject>>(`/learning-objects/${id}`),

  updateLearningObject: (id: number, name: string) =>
    apiClient.put<ApiResponse<LearningObject>>(`/learning-objects/${id}`, { name }),

  deleteLearningObject: (id: number) =>
    apiClient.delete(`/learning-objects/${id}`),

  moveLearningObject: (id: number, targetFolderId: number | null) =>
    apiClient.post(`/learning-objects/${id}/move`, { targetFolderId }),

  // 폴더 CRUD
  createFolder: (data: CreateFolderRequest) =>
    apiClient.post<ApiResponse<ContentFolder>>('/content-folders', data),

  getFolders: (parentId?: number) =>
    apiClient.get<ApiResponse<ContentFolder[]>>('/content-folders', {
      params: { parentId },
    }),

  getFolderTree: () =>
    apiClient.get<ApiResponse<ContentFolder[]>>('/content-folders/tree'),

  updateFolder: (id: number, folderName: string) =>
    apiClient.put<ApiResponse<ContentFolder>>(`/content-folders/${id}`, { folderName }),

  deleteFolder: (id: number) =>
    apiClient.delete(`/content-folders/${id}`),
};
```

### 4.2 타입 정의

```typescript
// src/types/learning.ts
export interface LearningObject {
  learningObjectId: number;
  name: string;
  contentId?: number;
  content?: Content;
  folderId?: number;
  folder?: ContentFolder;
  createdAt: string;
  updatedAt: string;
}

export interface ContentFolder {
  folderId: number;
  folderName: string;
  parentId: number | null;
  depth: number;
  children?: ContentFolder[];
  childCount?: number;
  itemCount?: number;
}

export interface LearningObjectQueryParams {
  folderId?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface CreateFolderRequest {
  folderName: string;
  parentId?: number;
}
```

---

## 5. 공통 타입

### 5.1 API Response

```typescript
// src/types/api.ts
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
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

---

## 6. React Query Hooks

### 6.1 useCourses

```typescript
// src/hooks/useCourses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@/api/courseApi';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.getCourses().then((res) => res.data.data),
  });
};

export const useCourse = (id: number) => {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourse(id).then((res) => res.data.data),
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
```

---

## 7. 소스 위치

```
frontend/src/
├── api/
│   ├── client.ts           # Axios 인스턴스
│   ├── courseApi.ts        # 강의 API (CM + CR)
│   ├── contentApi.ts       # 콘텐츠 API (CMS)
│   └── learningApi.ts      # 학습객체 API (LO)
├── types/
│   ├── api.ts              # 공통 API 타입
│   ├── course.ts           # 강의 타입
│   ├── content.ts          # 콘텐츠 타입
│   └── learning.ts         # 학습객체 타입
└── hooks/
    ├── useCourses.ts       # 강의 React Query Hooks
    ├── useContents.ts      # 콘텐츠 React Query Hooks
    └── useLearningObjects.ts  # 학습객체 React Query Hooks
```

# Frontend API 클라이언트

> API 호출 함수 및 클라이언트 설정 문서

---

## Axios 클라이언트 설정

```typescript
// src/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - 토큰 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor - 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 갱신 로직
    }
    return Promise.reject(error);
  }
);
```

---

## API 함수 목록

### 인증 (Auth)

| 함수 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| `login` | POST | `/auth/login` | 로그인 |
| `register` | POST | `/auth/register` | 회원가입 |
| `logout` | POST | `/auth/logout` | 로그아웃 |
| `refreshToken` | POST | `/auth/refresh` | 토큰 갱신 |

```typescript
// src/services/authApi.ts
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/register', data),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<TokenResponse>>('/auth/refresh', { refreshToken }),
};
```

---

### 사용자 (User)

| 함수 | Method | Endpoint | 설명 |
|------|--------|----------|------|
| `getUsers` | GET | `/users` | 목록 조회 |
| `getUser` | GET | `/users/{id}` | 단건 조회 |
| `createUser` | POST | `/users` | 생성 |
| `updateUser` | PUT | `/users/{id}` | 수정 |
| `deleteUser` | DELETE | `/users/{id}` | 삭제 |

```typescript
// src/services/userApi.ts
export const userApi = {
  getUsers: (params?: PaginationParams) =>
    apiClient.get<ApiResponse<Page<UserResponse>>>('/users', { params }),

  getUser: (id: number) =>
    apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`),

  createUser: (data: CreateUserRequest) =>
    apiClient.post<ApiResponse<UserResponse>>('/users', data),

  updateUser: (id: number, data: UpdateUserRequest) =>
    apiClient.put<ApiResponse<UserResponse>>(`/users/${id}`, data),

  deleteUser: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/users/${id}`),
};
```

---

## React Query 훅

```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/userApi';

export const useUsers = (params?: PaginationParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.getUsers(params),
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

---

## 공통 타입

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errorCode: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}
```

---

## 에러 처리

```typescript
// src/utils/handleApiError.ts
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as ApiResponse<unknown>;
    return response?.message || '알 수 없는 오류가 발생했습니다.';
  }
  return '네트워크 오류가 발생했습니다.';
};

// 사용 예시
try {
  await userApi.createUser(data);
} catch (error) {
  const message = handleApiError(error);
  toast.error(message);
}
```

---

## 관련 문서

- [pages.md](./pages.md) - 페이지 구성
- [14-REACT-API-INTEGRATION](../../conventions/14-REACT-API-INTEGRATION.md) - API 연동 컨벤션

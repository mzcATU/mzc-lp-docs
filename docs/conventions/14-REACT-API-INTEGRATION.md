# 14. React API Integration

> 📌 **먼저 읽기**: [10-REACT-TYPESCRIPT-CORE.md](./10-REACT-TYPESCRIPT-CORE.md)

> API 통신 규칙 (Axios 설정, React Query 사용법, 에러 처리)

---

## 1. Axios 설정

```typescript
// services/api/axiosInstance.ts
import axios from 'axios';

export const axiosInstance = axios.create({
  // ⚠️ 개발 환경 기본값. 운영에서는 반드시 VITE_API_BASE_URL 환경변수 설정 필요
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

// Request Interceptor (토큰)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor (401 처리)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) window.location.href = '/login';
    return Promise.reject(error);
  }
);
```

---

## 2. API Endpoints

```typescript
// services/api/endpoints.ts
export const API_ENDPOINTS = {
  USERS: '/api/users',
  USER_BY_ID: (id: number) => `/api/users/${id}`,
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
} as const;
```

---

## 3. Service Layer

```typescript
// services/userService.ts
import { axiosInstance } from './api/axiosInstance';
import { API_ENDPOINTS } from './api/endpoints';
import type { User, CreateUserRequest } from '@/types/user.types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data } = await axiosInstance.get<User[]>(API_ENDPOINTS.USERS);
    return data;
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    const { data } = await axiosInstance.post<User>(API_ENDPOINTS.USERS, request);
    return data;
  },

  async deleteUser(id: number): Promise<void> {
    await axiosInstance.delete(API_ENDPOINTS.USER_BY_ID(id));
  },
};
```

---

## 4. React Query 사용

### Query Hooks (조회)

```typescript
// hooks/queries/useUsersQuery.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export const useUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });
};

export const useUserQuery = (userId: number) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });
};
```

### Mutation Hooks (변경)

```typescript
// hooks/mutations/useUserMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) => userService.createUser(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      userService.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

### 사용 예시

```typescript
// pages/UserList.tsx
import { useUsersQuery } from '@/hooks/queries/useUsersQuery';
import { useDeleteUserMutation } from '@/hooks/mutations/useUserMutations';

export const UserList = () => {
  const { data: users, isLoading, error } = useUsersQuery();
  const deleteUser = useDeleteUserMutation();

  const handleDelete = async (id: number) => {
    await deleteUser.mutateAsync(id);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => handleDelete(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};
```

> **권장**: Custom Hooks 대신 React Query 사용 (캐싱, 재시도, 낙관적 업데이트 지원)

---

## 5. 에러 처리

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
};

// 사용
try {
  await userService.createUser(data);
} catch (error) {
  const errorMessage = handleApiError(error);
  alert(errorMessage);
}
```

---

## 6. 자주 하는 실수

### ❌ Bad

```typescript
// 1. any 타입 사용
const { data } = await axiosInstance.get('/users');  // data: any

// 2. 에러 처리 누락
const users = await userService.getUsers();  // try-catch 없음

// 3. queryKey 불일치
useQuery({ queryKey: ['user'], ... });      // 조회
queryClient.invalidateQueries(['users']);   // 무효화 (불일치!)

// 4. 하드코딩된 baseURL
axios.create({ baseURL: 'http://localhost:8080' });  // 환경변수 미사용

// 5. mutateAsync 후 로딩 상태 미처리
await createUser.mutateAsync(data);  // isPending 체크 안함
```

### ✅ Good

```typescript
// 1. 명시적 타입 지정
const { data } = await axiosInstance.get<User[]>('/users');

// 2. 에러 처리 포함
try {
  const users = await userService.getUsers();
} catch (error) {
  handleApiError(error);
}

// 3. queryKey 일관성
useQuery({ queryKey: ['users', userId], ... });
queryClient.invalidateQueries({ queryKey: ['users', userId] });

// 4. 환경변수 사용
axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

// 5. 로딩 상태 처리
<button disabled={createUser.isPending}>
  {createUser.isPending ? '저장 중...' : '저장'}
</button>
```
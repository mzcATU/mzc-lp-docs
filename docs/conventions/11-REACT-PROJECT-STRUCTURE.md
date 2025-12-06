# 11. React + TypeScript Project Structure

> 📌 **먼저 읽기**: [10-REACT-TYPESCRIPT-CORE.md](./10-REACT-TYPESCRIPT-CORE.md)

> Frontend 프로젝트 디렉토리 구조 및 파일 배치 규칙

---

## 1. 프로젝트 구조

```
src/
├── components/              # 재사용 컴포넌트
│   ├── common/             # 공통 (Button, Input, Modal)
│   └── domain/             # 도메인별 (user/, product/)
│
├── pages/                  # 페이지 (라우팅)
│   ├── Home/
│   ├── UserList/
│   └── UserDetail/
│
├── features/               # 기능별 모듈 (선택)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── dashboard/
│
├── hooks/                  # 커스텀 훅
│   ├── useAuth.ts
│   └── useUser.ts
│
├── services/               # API 통신
│   ├── api/
│   │   ├── axiosInstance.ts
│   │   └── endpoints.ts
│   ├── userService.ts
│   └── authService.ts
│
├── store/                  # 전역 상태 (Zustand 등)
│   ├── userStore.ts
│   └── authStore.ts
│
├── types/                  # 타입 정의
│   ├── user.types.ts
│   └── api.types.ts
│
├── utils/                  # 유틸
│   ├── format.ts
│   └── validation.ts
│
├── routes/                 # 라우팅
│   └── index.tsx
│
├── App.tsx
└── main.tsx
```

---

## 2. 컴포넌트 폴더 구조

```
components/
└── common/
    └── Button/
        ├── Button.tsx        # 컴포넌트
        ├── Button.types.ts   # Props 타입
        ├── Button.test.tsx   # 테스트 (선택)
        └── index.ts          # export

// index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

---

## 3. Services (API)

```typescript
// services/api/axiosInstance.ts
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// services/userService.ts
import { axiosInstance } from './api/axiosInstance';
import type { User } from '@/types/user.types';

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data } = await axiosInstance.get<User[]>('/users');
    return data;
  },

  async getUser(id: number): Promise<User> {
    const { data } = await axiosInstance.get<User>(`/users/${id}`);
    return data;
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    const { data } = await axiosInstance.post<User>('/users', request);
    return data;
  },
};
```

---

## 4. Types

```typescript
// types/user.types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  Admin = 'ADMIN',
  User = 'USER',
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

// types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 5. Hooks

```typescript
// hooks/useUser.ts
import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import type { User } from '@/types/user.types';

export const useUser = (userId: number) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const data = await userService.getUser(userId);
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  return { user, isLoading, error };
};
```

---

## 6. 설정 파일

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```


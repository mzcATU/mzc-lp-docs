# 11. React + TypeScript Project Structure

> 📌 **먼저 읽기**: [10-REACT-TYPESCRIPT-CORE.md](./10-REACT-TYPESCRIPT-CORE.md)

> Frontend 프로젝트 디렉토리 구조 및 파일 배치 규칙

---

## 1. 프로젝트 구조

```
src/
├── assets/                        # 정적 리소스
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/                    # 재사용 컴포넌트 (역할별 + 공통)
│   ├── common/                    # 공통 UI (Button, Input, Modal, Dialog)
│   └── layout/                    # 레이아웃 컴포넌트
│       ├── sa/                    # Super Admin 레이아웃
│       ├── ta/                    # Tenant Admin 레이아웃
│       ├── to/                    # Tenant Operator 레이아웃
│       └── tu/                    # Tenant User 레이아웃
│
├── pages/                         # 역할별 페이지 (라우팅)
│   ├── sa/                        # Super Admin
│   ├── ta/                        # Tenant Admin
│   ├── to/                        # Tenant Operator
│   └── tu/                        # Tenant User
│
├── hooks/                         # 커스텀 훅 (역할별 + 공통)
│   ├── common/                    # 공통 훅
│   ├── sa/                        # Super Admin 전용
│   ├── ta/                        # Tenant Admin 전용
│   ├── to/                        # Tenant Operator 전용
│   └── tu/                        # Tenant User 전용
│
├── store/                         # 전역 상태 Zustand (역할별 + 공통)
│   ├── common/                    # 공통 스토어
│   ├── sa/                        # Super Admin 전용
│   ├── ta/                        # Tenant Admin 전용
│   ├── to/                        # Tenant Operator 전용
│   └── tu/                        # Tenant User 전용
│
├── services/                      # API 통신 (역할별 + 공통)
│   ├── common/                    # 공통 서비스
│   │   ├── api/
│   │   │   ├── axiosInstance.ts
│   │   │   └── endpoints.ts
│   │   └── authService.ts
│   ├── sa/                        # Super Admin 전용
│   ├── ta/                        # Tenant Admin 전용
│   ├── to/                        # Tenant Operator 전용
│   └── tu/                        # Tenant User 전용
│
├── types/                         # 타입 정의 (역할별 + 공통)
│   ├── common/                    # 공통 타입
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   ├── sa/                        # Super Admin 전용
│   ├── ta/                        # Tenant Admin 전용
│   ├── to/                        # Tenant Operator 전용
│   └── tu/                        # Tenant User 전용
│
├── styles/                        # 스타일
│   └── design-tokens.ts
│
├── utils/                         # 유틸리티
│   ├── cn.ts
│   ├── format.ts
│   └── validation.ts
│
├── config/                        # 설정
│   └── constants.ts
│
├── routes/                        # 라우팅
│   └── index.tsx
│
├── index.css
├── App.tsx
└── main.tsx
```

---

## 2. 역할별 폴더 구조 규칙

### 역할 구분

| 역할 | 폴더명 | 설명 |
|------|--------|------|
| 공통 | `common/` | 모든 역할에서 사용 |
| Super Admin | `sa/` | 슈퍼 관리자 전용 |
| Tenant Admin | `ta/` | 테넌트 관리자 전용 |
| Tenant Operator | `to/` | 테넌트 운영자 전용 |
| Tenant User | `tu/` | 테넌트 사용자 전용 |

### 적용 대상

```
역할별로 분리하는 폴더:
├── components/layout/     # 레이아웃
├── pages/                 # 페이지
├── hooks/                 # 커스텀 훅
├── store/                 # 전역 상태
├── services/              # API 서비스
└── types/                 # 타입 정의

공통으로 유지하는 폴더:
├── assets/                # 정적 리소스
├── components/common/     # 공통 UI 컴포넌트
├── styles/                # 스타일
├── utils/                 # 유틸리티
├── config/                # 설정
└── routes/                # 라우팅
```

---

## 3. 컴포넌트 폴더 구조

### 공통 컴포넌트 (common)

```
components/common/
├── Button/
│   ├── Button.tsx             # 메인 컴포넌트
│   ├── Button.types.ts        # Props 타입 정의
│   ├── Button.test.tsx        # 테스트 (선택)
│   └── index.ts               # re-export
├── Input/
├── Badge/
├── Modal/
├── Dialog/                    # Radix 기반
├── Select/                    # Radix 기반
└── Dropdown/                  # Radix 기반
```

### 레이아웃 컴포넌트 (역할별)

```
components/layout/
├── sa/                        # Super Admin
│   ├── SuperAdminLayout.tsx
│   └── SuperAdminSidebar/
├── ta/                        # Tenant Admin
│   ├── TenantAdminLayout.tsx
│   └── TenantAdminSidebar/
├── to/                        # Tenant Operator
│   ├── TenantOperatorLayout.tsx
│   └── TenantOperatorSidebar/
└── tu/                        # Tenant User
    ├── TenantUserLayout.tsx
    └── TenantUserSidebar/
```

### index.ts 패턴

```typescript
// components/common/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button.types';
```

### 역할별 레이아웃 라우팅

```
/sa/*  → SuperAdminLayout      (슈퍼 관리자)
/ta/*  → TenantAdminLayout     (테넌트 관리자)
/to/*  → TenantOperatorLayout  (테넌트 운영자)
/tu/*  → TenantUserLayout      (테넌트 사용자)
```

---

## 4. Services (API)

### 폴더 구조

```
services/
├── common/                    # 공통 서비스
│   ├── api/
│   │   ├── axiosInstance.ts   # Axios 인스턴스
│   │   └── endpoints.ts       # API 엔드포인트 상수
│   ├── authService.ts         # 인증 API
│   └── userService.ts         # 사용자 API
├── sa/                        # Super Admin 전용
│   └── tenantService.ts
├── ta/                        # Tenant Admin 전용
│   └── userManagementService.ts
├── to/                        # Tenant Operator 전용
│   └── contentService.ts
└── tu/                        # Tenant User 전용
    └── learningService.ts
```

### 예제

```typescript
// services/common/api/axiosInstance.ts
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

// services/common/userService.ts
import { axiosInstance } from './api/axiosInstance';
import type { User } from '@/types/common/user.types';

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

## 5. Types

### 폴더 구조

```
types/
├── common/                    # 공통 타입
│   ├── auth.types.ts          # 인증 관련
│   ├── user.types.ts          # 사용자 관련
│   └── api.types.ts           # API 응답 공통
├── sa/                        # Super Admin 전용
│   └── tenant.types.ts
├── ta/                        # Tenant Admin 전용
│   └── userManagement.types.ts
├── to/                        # Tenant Operator 전용
│   └── content.types.ts
└── tu/                        # Tenant User 전용
    └── learning.types.ts
```

### 예제

```typescript
// types/common/user.types.ts
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

// types/common/api.types.ts
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

## 6. Hooks

### 폴더 구조

```
hooks/
├── common/                    # 공통 훅 (모든 역할에서 사용)
│   ├── useAuth.ts
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
├── sa/                        # Super Admin 전용 훅
│   └── useTenantManagement.ts
├── ta/                        # Tenant Admin 전용 훅
│   └── useUserManagement.ts
├── to/                        # Tenant Operator 전용 훅
│   └── useContentManagement.ts
└── tu/                        # Tenant User 전용 훅
    └── useMyLearning.ts
```

### 예제

```typescript
// hooks/common/useUser.ts
import { useState, useEffect } from 'react';
import { userService } from '@/services/common/userService';
import type { User } from '@/types/common/user.types';

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

## 7. Store (Zustand)

### 폴더 구조

```
store/
├── common/                    # 공통 스토어 (모든 역할에서 사용)
│   ├── authStore.ts           # 인증 상태
│   └── uiStore.ts             # UI 상태 (사이드바, 다크모드)
├── sa/                        # Super Admin 전용 스토어
│   └── tenantStore.ts
├── ta/                        # Tenant Admin 전용 스토어
│   └── userManagementStore.ts
├── to/                        # Tenant Operator 전용 스토어
│   └── contentStore.ts
└── tu/                        # Tenant User 전용 스토어
    └── learningStore.ts
```

### 예제

```typescript
// store/common/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/common/user.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// store/common/uiStore.ts
import { create } from 'zustand';

interface UIState {
  isSidebarExpanded: boolean;
  isDarkMode: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarExpanded: true,
  isDarkMode: true,
  toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
```

---

## 8. 설정 파일

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

---

> 디자인 컨벤션 → [00-DESIGN-CONVENTIONS](./design/00-DESIGN-CONVENTIONS.md)
> 컴포넌트 컨벤션 → [12-REACT-COMPONENT-CONVENTIONS](./12-REACT-COMPONENT-CONVENTIONS.md)
> 상태 관리 → [13-REACT-STATE-MANAGEMENT](./13-REACT-STATE-MANAGEMENT.md)

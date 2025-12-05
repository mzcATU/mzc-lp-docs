# Frontend 페이지 구성

> 페이지 컴포넌트 및 라우팅 문서

---

## 라우트 구성

| 경로 | 컴포넌트 | 설명 | 인증 |
|------|----------|------|:----:|
| `/` | HomePage | 홈/랜딩 페이지 | |
| `/login` | LoginPage | 로그인 | |
| `/register` | RegisterPage | 회원가입 | |
| `/dashboard` | DashboardPage | 대시보드 | ✅ |
| `/users` | UserListPage | 사용자 목록 | ✅ |
| `/users/:id` | UserDetailPage | 사용자 상세 | ✅ |
| `/profile` | ProfilePage | 내 프로필 | ✅ |
| `*` | NotFoundPage | 404 페이지 | |

---

## 라우터 설정

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 페이지 상세

### LoginPage

| 항목 | 내용 |
|------|------|
| 경로 | `/login` |
| 파일 | `src/pages/auth/LoginPage.tsx` |
| 기능 | 이메일/비밀번호 로그인 |
| API | `POST /api/auth/login` |

**주요 기능**
- 폼 유효성 검사
- 로그인 성공 시 대시보드로 리다이렉트
- 에러 메시지 표시

---

### UserListPage

| 항목 | 내용 |
|------|------|
| 경로 | `/users` |
| 파일 | `src/pages/user/UserListPage.tsx` |
| 기능 | 사용자 목록 조회 |
| API | `GET /api/users` |

**주요 기능**
- 페이지네이션
- 검색/필터
- 사용자 상세 페이지로 이동

---

### UserDetailPage

| 항목 | 내용 |
|------|------|
| 경로 | `/users/:id` |
| 파일 | `src/pages/user/UserDetailPage.tsx` |
| 기능 | 사용자 상세 조회/수정/삭제 |
| API | `GET/PUT/DELETE /api/users/{id}` |

**주요 기능**
- 사용자 정보 표시
- 수정 모드 토글
- 삭제 확인 모달

---

## 폴더 구조

```
src/pages/
├── auth/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
│
├── user/
│   ├── UserListPage.tsx
│   └── UserDetailPage.tsx
│
├── dashboard/
│   └── DashboardPage.tsx
│
├── HomePage.tsx
├── ProfilePage.tsx
└── NotFoundPage.tsx
```

---

## 공통 레이아웃

```tsx
// src/components/layout/MainLayout.tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />
      <main className="ml-64 p-6">
        {children}
      </main>
    </div>
  );
}
```

---

## 페이지 추가 시 체크리스트

1. [ ] `src/pages/{도메인}/` 폴더에 페이지 컴포넌트 생성
2. [ ] `App.tsx`에 라우트 추가
3. [ ] 인증 필요 시 `ProtectedRoute` 내부에 배치
4. [ ] 이 문서에 페이지 정보 추가
5. [ ] 네비게이션에 링크 추가 (필요시)

---

## 관련 문서

- [api.md](./api.md) - API 클라이언트
- [12-REACT-COMPONENT](../../conventions/12-REACT-COMPONENT-CONVENTIONS.md) - 컴포넌트 컨벤션

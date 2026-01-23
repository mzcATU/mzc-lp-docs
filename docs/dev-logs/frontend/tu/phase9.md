# Frontend TU (Tenant User) 개발 로그 - Phase 9

> DESIGNER 역할 부여 후 토큰 갱신 버그 수정

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2026-01-02 |
| **관련 이슈** | [#170](https://github.com/mzcATU/mzc-lp-frontend/issues/170) |
| **관련 PR** | TBD |
| **관련 커밋** | TBD |
| **담당 모듈** | TU (Tenant User) - Authentication & Role Management |

---

## 1. 구현 개요

### 1.1 문제 상황

| 항목 | 설명 |
|------|------|
| 증상 | USER 권한 사용자가 "강의 개설" 버튼 클릭 후 DESIGNER 권한이 적용되지 않음 |
| 원인 | DESIGNER 역할 부여 후 JWT 토큰 갱신이 누락됨 |
| 영향 범위 | MyTeachingPage, MyPageSidebar 두 진입점 |

### 1.2 백엔드 역할 구조

```
┌─────────────────────────────────────────────────────────────┐
│ JWT Token (authorities)                                      │
├─────────────────────────────────────────────────────────────┤
│ TenantRole (User.role)    │ CourseRole (UserCourseRole)     │
│ - 단일 값                  │ - 복수 값 가능                   │
│ - USER, DESIGNER,         │ - DESIGNER, OWNER, INSTRUCTOR   │
│   OPERATOR, TENANT_ADMIN  │                                  │
└─────────────────────────────────────────────────────────────┘
```

- `POST /users/me/course-roles/designer`: CourseRole에 DESIGNER 추가
- DB 반영 후 **토큰 갱신 필수** (새 토큰에 CourseRole 포함)

### 1.3 수정 내용

| 파일 | 수정 전 | 수정 후 |
|------|---------|---------|
| MyTeachingPage.tsx | API 호출만 수행 | API 호출 + 토큰 갱신 |
| MyPageSidebar.tsx | API 호출 없음 (프론트엔드 상태만 변경) | API 호출 + 토큰 갱신 + 로딩 상태 |

---

## 2. 수정된 파일

### 2.1 수정 파일 목록 (2개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| MyTeachingPage.tsx | `src/pages/tu/mypage/` | 토큰 갱신 로직 추가 |
| MyPageSidebar.tsx | `src/components/layout/mypage/` | API 호출 + 토큰 갱신 + 로딩/에러 처리 |

---

## 3. 주요 구현 내용

### 3.1 MyTeachingPage.tsx - 토큰 갱신 추가

```typescript
// 추가된 import
import { authService } from '@/services/common/authService';

// handleGrantDesignerRole 함수 수정
const handleGrantDesignerRole = async () => {
  // 이미 DESIGNER인 경우 바로 이동
  if (isDesigner) {
    setShowRoleDialog(false);
    navigate('/tu/teaching/courses/create');
    return;
  }

  setIsGrantingRole(true);
  try {
    // DESIGNER 역할 부여 API 호출
    await userService.applyDesignerRole();

    // 토큰 갱신 (CourseRole이 반영된 새 토큰 발급) - 추가됨
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      const tokenResponse = await authService.refresh(refreshToken);
      useAuthStore.getState().setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
    }

    // 사용자 정보 다시 조회하여 역할 업데이트
    const updatedUser = await userService.getMe();
    useAuthStore.getState().updateUser({ role: updatedUser.role });

    toast.success('강의 개설 권한이 부여되었습니다.');
    // ...
  } catch (error) {
    // 409 Conflict 처리 (이미 DESIGNER인 경우)
    // ...
  }
};
```

### 3.2 MyPageSidebar.tsx - API 호출 및 토큰 갱신 추가

```typescript
// 추가된 imports
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { userService } from '@/services/common/userService';
import { authService } from '@/services/common/authService';

// 추가된 상태
const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
const [isGrantingRole, setIsGrantingRole] = useState(false);

// DESIGNER 역할 확인
const isDesigner = user?.role === 'DESIGNER' || user?.role === 'OPERATOR' || user?.role === 'TENANT_ADMIN';

// 강의 개설 확인 핸들러 (완전 재구현)
const handleCreateCourseConfirm = async () => {
  // 이미 DESIGNER인 경우 바로 이동
  if (isDesigner) {
    setShowCreateCourseDialog(false);
    onMenuItemClick?.('create-course');
    return;
  }

  setIsGrantingRole(true);
  try {
    // DESIGNER 역할 부여 API 호출
    await userService.applyDesignerRole();

    // 토큰 갱신 (CourseRole이 반영된 새 토큰 발급)
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      const tokenResponse = await authService.refresh(refreshToken);
      useAuthStore.getState().setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
    }

    // 사용자 정보 다시 조회하여 역할 업데이트
    const updatedUser = await userService.getMe();
    updateUser({ role: updatedUser.role });

    toast.success(language === 'ko' ? '강의 개설 권한이 부여되었습니다.' : 'Designer permission granted.');
    setShowCreateCourseDialog(false);
    onMenuItemClick?.('create-course');
  } catch (error) {
    // 409 Conflict = 이미 DESIGNER 역할을 가지고 있음
    const axiosError = error as { response?: { status?: number } };
    if (axiosError.response?.status === 409) {
      // 토큰 갱신 (이미 권한이 있어도 토큰에 반영 필요)
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        const tokenResponse = await authService.refresh(refreshToken);
        useAuthStore.getState().setTokens(tokenResponse.accessToken, tokenResponse.refreshToken);
      }

      const updatedUser = await userService.getMe();
      updateUser({ role: updatedUser.role });

      toast.success(language === 'ko' ? '이미 강의 개설 권한이 있습니다.' : 'You already have designer permission.');
      setShowCreateCourseDialog(false);
      onMenuItemClick?.('create-course');
    } else {
      toast.error(language === 'ko' ? '권한 부여에 실패했습니다.' : 'Failed to grant permission.');
    }
  } finally {
    setIsGrantingRole(false);
  }
};
```

### 3.3 다이얼로그 UI 개선

```typescript
// 다이얼로그 설명 텍스트 (역할에 따라 분기)
const getCreateCourseDialogDescription = () => {
  if (user?.role === 'USER') {
    return language === 'ko'
      ? '강의 개설을 위해 디자이너 권한이 부여됩니다. 강의 설계 / 개설 페이지로 이동하시겠습니까?'
      : 'Designer permission will be granted for course creation. Would you like to proceed to the course design / creation page?';
  }
  return language === 'ko'
    ? '강의 설계 / 개설 페이지로 이동하시겠습니까?'
    : 'Would you like to proceed to the course design / creation page?';
};

// 로딩 상태 표시
<AlertDialogAction onClick={handleCreateCourseConfirm} disabled={isGrantingRole}>
  {isGrantingRole ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      {language === 'ko' ? '처리 중...' : 'Processing...'}
    </>
  ) : (
    language === 'ko' ? '이동' : 'Proceed'
  )}
</AlertDialogAction>
```

---

## 4. 토큰 갱신 흐름

```
사용자 클릭 ("강의 개설")
    │
    ▼
┌─────────────────────────────────┐
│ isDesigner 확인                  │
│ (DESIGNER/OPERATOR/TENANT_ADMIN)│
└─────────────────────────────────┘
    │                    │
    │ (이미 DESIGNER)     │ (USER)
    ▼                    ▼
바로 이동            API 호출
                    POST /users/me/course-roles/designer
                         │
                         ▼
                    토큰 갱신
                    POST /auth/refresh
                         │
                         ▼
                    사용자 정보 조회
                    GET /users/me
                         │
                         ▼
                    상태 업데이트 & 이동
```

---

## 5. 409 Conflict 처리

이미 DESIGNER 역할이 있는 경우에도 토큰에 반영되지 않았을 수 있으므로:

1. 409 에러 발생 시에도 토큰 갱신 수행
2. 사용자 정보 조회하여 최신 역할 반영
3. 정상 흐름과 동일하게 페이지 이동

---

## 6. 파일 변경 요약

### DESIGNER 역할 토큰 갱신 수정

| 파일 | 변경 |
|------|------|
| MyTeachingPage.tsx | +8 lines (토큰 갱신 로직) |
| MyPageSidebar.tsx | +45/-5 lines (API 호출 + 토큰 갱신 + 로딩 상태) |

---

## 7. 관련 문서

- [Frontend Phase 7](phase7.md) - 강의 유형 필드 추가 및 강의 수정 페이지 구현
- [Frontend Phase 8](phase8.md) - TU 메인 페이지 및 API 통합

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-02 | Claude Code | MyTeachingPage.tsx 토큰 갱신 로직 추가 |
| 2026-01-02 | Claude Code | MyPageSidebar.tsx API 호출 및 토큰 갱신 구현 |

---

*최종 업데이트: 2026-01-02*

# 다중 역할(Multi-Role) 지원 구현

> **작업 기간**: 2026-01-07 ~ 2026-01-15
> **관련 이슈**: #384, #398, #401, #413, #470, #480, #483

## 개요

사용자가 여러 역할(OPERATOR, DESIGNER, USER 등)을 동시에 보유하고, 필요에 따라 역할을 전환할 수 있는 다중 역할 시스템을 구현했습니다.

## 변경 사항

### Backend

#### 1. UserRole 엔티티 추가
```java
@Entity
@Table(name = "user_roles")
public class UserRole {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @Enumerated(EnumType.STRING)
    private TenantRole role;
}
```

#### 2. JWT 토큰 구조 변경
- `role`: 기본 역할 (하위 호환성)
- `roles`: 사용자가 보유한 모든 역할 목록
- `currentRole`: 현재 선택된 역할

#### 3. 역할 전환 API
```
POST /api/auth/switch-role
{
  "targetRole": "OPERATOR"
}
```
- 새 JWT 토큰 발급
- 활동 로그 기록

#### 4. 사용자 역할 관리 API
```
PUT /api/users/{userId}/roles       - 역할 일괄 수정
POST /api/users/{userId}/roles/{role} - 역할 추가
DELETE /api/users/{userId}/roles/{role} - 역할 제거
GET /api/users/{userId}/roles       - 역할 조회
```

### Frontend

#### 1. 역할 선택 페이지
- 로그인 시 다중 역할 보유자는 `/select-role` 페이지로 리다이렉트
- 관리자/학습자 카드 형태로 역할 선택

#### 2. GlobalRoleSwitcher 컴포넌트
- 헤더에서 실시간 역할 전환 가능
- TA/CO/TU 간 즉시 전환

#### 3. authStore 변경
```typescript
interface AuthState {
  user: AuthUser | null;
  currentRole: TenantRole | null;
  // ...
  setCurrentRole: (role: TenantRole) => void;
  getCurrentRole: () => TenantRole | null;
}
```

## 시드 데이터

### user_roles 테이블
```sql
-- 멀티롤 테스트 사용자
INSERT INTO user_roles (user_id, role) VALUES
(9, 'OPERATOR'),
(9, 'DESIGNER'),
(10, 'DESIGNER'),
(10, 'INSTRUCTOR');
```

## 테스트 계정

| 이메일 | 보유 역할 |
|--------|----------|
| multi1@default.com | OPERATOR, DESIGNER |
| multi2@default.com | DESIGNER, INSTRUCTOR |

## 관련 파일

### Backend
- `UserRole.java` - 새 엔티티
- `UserRoleRepository.java` - 새 리포지토리
- `AuthServiceImpl.java` - switchRole 메서드 추가
- `JwtProvider.java` - 토큰 생성 로직 변경
- `UserServiceImpl.java` - 역할 관리 메서드 추가

### Frontend
- `SelectRolePage.tsx` - 새 페이지
- `GlobalRoleSwitcher.tsx` - 새 컴포넌트
- `useAuthQueries.ts` - useLogin 훅 수정
- `authStore.ts` - currentRole 상태 추가

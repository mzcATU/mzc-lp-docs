# PROJECT_CONTEXT.md - 프로젝트 컨텍스트

> CLAUDE.md의 부록 - 기술 스택, 코드 패턴, 현재 구현 상태 참조용
> **구조 상세는 → [architecture.md](./docs/context/architecture.md)**

---

## 언제 참조?

| 상황 | 참조 |
|------|------|
| 프로젝트 구조 | [conventions/01-PROJECT-STRUCTURE.md](./conventions/01-PROJECT-STRUCTURE.md) |
| 시스템 아키텍처 | [context/architecture.md](./context/architecture.md) |
| 코드 패턴 예시 | 이 문서 아래 섹션 |
| 현재 구현 상태 | 이 문서 하단 |

---

## 코드 패턴 예시

### Backend - Transaction
```java
@Service
@Transactional(readOnly = true)  // 클래스 레벨
@RequiredArgsConstructor
public class UserService {
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional  // 쓰기만 메서드 레벨
    public User create(CreateUserRequest request) {
        return userRepository.save(User.create(request.name(), request.email()));
    }
}
```

### Backend - Entity ↔ DTO 변환
```java
UserResponse response = UserResponse.from(entity);  // Entity → DTO
User entity = User.create(request.name(), request.email());  // DTO → Entity
```

### Frontend - API 클라이언트
```typescript
export const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

---

## 현재 구현 상태

### Tech Stack
| Layer | Stack | Version |
|-------|-------|---------|
| Backend | Java / Spring Boot | 21 / 3.2.11 |
| Frontend | React / TypeScript / Vite | 19.2.0 / 5.9.3 / 7.2.4 |

### 구현 완료
```
Backend: 회원가입/로그인 API, JWT 인증, GlobalExceptionHandler
Frontend: React+TS+Vite, 로그인/회원가입 페이지, AuthContext
```

---

## 상세 문서 링크

| 주제 | 문서 |
|------|------|
| 프로젝트 구조 | [conventions/01-PROJECT-STRUCTURE.md](./conventions/01-PROJECT-STRUCTURE.md) |
| 시스템 아키텍처 | [context/architecture.md](./context/architecture.md) |
| 모듈 구조 | [context/module-structure.md](./context/module-structure.md) |
| API/DB 스펙 | [structure/backend/](./structure/backend/) |
| 보안 | [conventions/21-SECURITY-CONVENTIONS.md](./conventions/21-SECURITY-CONVENTIONS.md) |

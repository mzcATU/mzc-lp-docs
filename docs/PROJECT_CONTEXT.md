# PROJECT_CONTEXT.md - 프로젝트 컨텍스트

> CLAUDE.md의 부록 - 기술 스택, 코드 패턴, 현재 구현 상태 참조용
> **구조 상세는 → [architecture.md](./context/architecture.md)**

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
| Backend | Java / Spring Boot | 21 / 3.4.1 |
| Frontend | React / TypeScript / Vite | 19.x / 5.x / 7.x |

### 구현 완료 모듈

| 모듈 | 설명 | 상태 |
|------|------|------|
| UM | User Master - 회원가입, 로그인, JWT 인증 | ✅ 완료 |
| TS | Time Schedule - 차수 관리 | ✅ 완료 |
| CM | Course Management - 강의 관리 | ✅ 완료 |
| CMS | Content Management - 콘텐츠 관리 | ✅ 완료 |
| LO | Learning Object - 학습 객체 | ✅ 완료 |
| Tenant | Multi-Tenancy 인프라 | ✅ 완료 |
| SIS | Student Info System - 수강 관리 | ✅ 완료 |
| IIS | Instructor Info System - 강사 배정 | ✅ 완료 |

> 상세 진행 상황: [dev-logs/README.md](./dev-logs/README.md)

---

## 상세 문서 링크

| 주제 | 문서 |
|------|------|
| 프로젝트 구조 | [conventions/01-PROJECT-STRUCTURE.md](./conventions/01-PROJECT-STRUCTURE.md) |
| 시스템 아키텍처 | [context/architecture.md](./context/architecture.md) |
| 모듈 구조 | [context/module-structure.md](./context/module-structure.md) |
| API/DB 스펙 | [structure/backend/](./structure/backend/) |
| 보안 | [conventions/20-SECURITY-CONVENTIONS.md](./conventions/20-SECURITY-CONVENTIONS.md) |
| 권한 모델 | [context/authorization-model.md](./context/authorization-model.md) |
| 트랜잭션 경계 | [context/transaction-boundaries.md](./context/transaction-boundaries.md) |

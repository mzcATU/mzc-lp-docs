# Backend 공통 컴포넌트

> 전역 설정, 공통 엔티티, 예외 처리 등 공통 컴포넌트 문서

---

## 폴더 구조

```
backend/src/main/java/com/.../
├── global/
│   ├── config/           # 설정 클래스
│   │   ├── JpaConfig.java
│   │   ├── SecurityConfig.java
│   │   ├── CorsConfig.java
│   │   └── WebConfig.java
│   │
│   ├── exception/        # 예외 처리
│   │   ├── GlobalExceptionHandler.java
│   │   ├── ErrorCode.java
│   │   └── ErrorResponse.java
│   │
│   ├── common/           # 공통 클래스
│   │   ├── BaseTimeEntity.java
│   │   └── ApiResponse.java
│   │
│   └── security/         # 보안
│       ├── JwtTokenProvider.java
│       ├── JwtAuthenticationFilter.java
│       └── CustomUserDetailsService.java
```

---

## 공통 응답 형식

### ApiResponse

```java
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    String errorCode
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message) {
        return new ApiResponse<>(false, null, message, errorCode);
    }
}
```

**성공 응답**
```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "errorCode": null
}
```

**에러 응답**
```json
{
  "success": false,
  "data": null,
  "message": "사용자를 찾을 수 없습니다.",
  "errorCode": "USER_NOT_FOUND"
}
```

---

## BaseTimeEntity

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public abstract class BaseTimeEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

**사용법**: 모든 Entity에서 상속
```java
@Entity
public class User extends BaseTimeEntity {
    // createdAt, updatedAt 자동 관리
}
```

---

## 예외 처리

### ErrorCode (Enum)

```java
@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Common
    INVALID_INPUT(400, "C001", "잘못된 입력입니다."),
    RESOURCE_NOT_FOUND(404, "C002", "리소스를 찾을 수 없습니다."),
    INTERNAL_ERROR(500, "C003", "서버 내부 오류입니다."),

    // User
    USER_NOT_FOUND(404, "U001", "사용자를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(409, "U002", "이미 사용 중인 이메일입니다."),

    // Auth
    INVALID_TOKEN(401, "A001", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(401, "A002", "만료된 토큰입니다.");

    private final int status;
    private final String code;
    private final String message;
}
```

### GlobalExceptionHandler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        log.error("BusinessException: {}", e.getMessage());
        return ResponseEntity
            .status(e.getErrorCode().getStatus())
            .body(ApiResponse.error(e.getErrorCode().getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ResponseEntity
            .badRequest()
            .body(ApiResponse.error("VALIDATION_ERROR", message));
    }
}
```

---

## 설정 클래스

### JpaConfig

```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
```

### CorsConfig

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

---

## HTTP 상태 코드 규칙

| 상태 코드 | 사용 시점 |
|-----------|----------|
| 200 OK | 조회, 수정 성공 |
| 201 Created | 생성 성공 |
| 204 No Content | 삭제 성공 |
| 400 Bad Request | 유효성 검증 실패 |
| 401 Unauthorized | 인증 실패 |
| 403 Forbidden | 권한 없음 |
| 404 Not Found | 리소스 없음 |
| 409 Conflict | 중복 등 충돌 |
| 500 Internal Server Error | 서버 오류 |

---

## 관련 문서

- [CLAUDE.md](../../../CLAUDE.md) - AI 작업 가이드
- [08-EXCEPTION-CONVENTIONS](../../../conventions/08-EXCEPTION-CONVENTIONS.md) - 예외 처리 컨벤션

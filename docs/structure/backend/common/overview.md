# 공통 컴포넌트 개요

> Backend 공통 모듈 (Common)

---

## 1. 공통 Entity

### 1.1 BaseTimeEntity

모든 Entity의 기본 클래스로, 생성/수정 시간을 자동 관리합니다.

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public abstract class BaseTimeEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

**사용 예시**:
```java
@Entity
public class Course extends BaseTimeEntity {
    // createdAt, updatedAt 자동 관리
}
```

### 1.2 TenantEntity (멀티테넌시 지원)

테넌트 분리가 필요한 Entity의 기본 클래스입니다.

```java
@MappedSuperclass
@Getter
public abstract class TenantEntity extends BaseTimeEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @PrePersist
    protected void prePersist() {
        this.tenantId = TenantContext.getCurrentTenantId();
    }
}
```

> 현재 test-lms-v2-integration에서는 단일 테넌트로 구현되어 있음

---

## 2. 공통 Response

### 2.1 ApiResponse

모든 API 응답의 표준 포맷입니다.

```java
@Getter
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorInfo error;

    // 성공 응답
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    // 실패 응답
    public static <T> ApiResponse<T> error(String code, String message, int status) {
        return new ApiResponse<>(false, null, new ErrorInfo(code, message, status));
    }
}

@Getter
@AllArgsConstructor
public class ErrorInfo {
    private String code;
    private String message;
    private int status;
}
```

**성공 응답 예시**:
```json
{
  "success": true,
  "data": {
    "courseId": 1,
    "courseName": "React 기초"
  },
  "error": null
}
```

**실패 응답 예시**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "강의를 찾을 수 없습니다.",
    "status": 404
  }
}
```

### 2.2 PageResponse

페이징 응답을 위한 wrapper입니다.

```java
@Getter
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public static <T> PageResponse<T> of(Page<T> page) {
        PageResponse<T> response = new PageResponse<>();
        response.content = page.getContent();
        response.page = page.getNumber();
        response.size = page.getSize();
        response.totalElements = page.getTotalElements();
        response.totalPages = page.getTotalPages();
        return response;
    }
}
```

---

## 3. 예외 처리

### 3.1 BusinessException

비즈니스 로직 예외의 기본 클래스입니다.

```java
@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
```

### 3.2 ErrorCode

에러 코드를 정의하는 Enum입니다.

```java
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT(400, "INVALID_INPUT", "잘못된 입력입니다."),
    RESOURCE_NOT_FOUND(404, "RESOURCE_NOT_FOUND", "리소스를 찾을 수 없습니다."),
    INTERNAL_ERROR(500, "INTERNAL_ERROR", "서버 오류가 발생했습니다."),

    // Course (CM)
    COURSE_NOT_FOUND(404, "COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."),
    ITEM_NOT_FOUND(404, "ITEM_NOT_FOUND", "차시/폴더를 찾을 수 없습니다."),
    MAX_DEPTH_EXCEEDED(400, "MAX_DEPTH_EXCEEDED", "최대 깊이를 초과했습니다."),
    INVALID_PARENT(400, "INVALID_PARENT", "잘못된 부모 항목입니다."),

    // Content (CMS)
    CONTENT_NOT_FOUND(404, "CONTENT_NOT_FOUND", "콘텐츠를 찾을 수 없습니다."),
    UNSUPPORTED_FILE_TYPE(400, "UNSUPPORTED_FILE_TYPE", "지원하지 않는 파일 형식입니다."),
    FILE_SIZE_EXCEEDED(400, "FILE_SIZE_EXCEEDED", "파일 크기가 초과되었습니다."),
    FILE_UPLOAD_FAILED(500, "FILE_UPLOAD_FAILED", "파일 업로드에 실패했습니다."),
    INVALID_EXTERNAL_URL(400, "INVALID_EXTERNAL_URL", "지원하지 않는 외부 URL입니다."),

    // Learning (LO)
    LEARNING_OBJECT_NOT_FOUND(404, "LEARNING_OBJECT_NOT_FOUND", "학습객체를 찾을 수 없습니다."),
    FOLDER_NOT_FOUND(404, "FOLDER_NOT_FOUND", "폴더를 찾을 수 없습니다."),
    FOLDER_MAX_DEPTH_EXCEEDED(400, "FOLDER_MAX_DEPTH_EXCEEDED", "폴더 최대 깊이를 초과했습니다."),

    // Course Relation (CR)
    CIRCULAR_RELATION(400, "CIRCULAR_RELATION", "순환 참조가 감지되었습니다.");

    private final int status;
    private final String code;
    private final String message;
}
```

### 3.3 GlobalExceptionHandler

전역 예외 처리기입니다.

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn("BusinessException: {}", e.getMessage());

        return ResponseEntity
            .status(errorCode.getStatus())
            .body(ApiResponse.error(
                errorCode.getCode(),
                e.getMessage(),
                errorCode.getStatus()
            ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException e) {

        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.error("VALIDATION_ERROR", message, 400));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Unexpected error", e);

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(
                "INTERNAL_ERROR",
                "서버 오류가 발생했습니다.",
                500
            ));
    }
}
```

---

## 4. 유틸리티

### 4.1 FileUtils

파일 처리 유틸리티입니다.

```java
public class FileUtils {

    // 파일 확장자 추출
    public static String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(dotIndex + 1).toLowerCase() : "";
    }

    // UUID 기반 파일명 생성
    public static String generateStoredFileName(String originalFileName) {
        String extension = getExtension(originalFileName);
        return UUID.randomUUID().toString() + "." + extension;
    }

    // 파일 크기 포맷팅
    public static String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)) + " MB";
        return (bytes / (1024 * 1024 * 1024)) + " GB";
    }
}
```

### 4.2 TimeUtils

시간 처리 유틸리티입니다.

```java
public class TimeUtils {

    // 초 → "HH:MM:SS" 포맷
    public static String formatDuration(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        int secs = seconds % 60;

        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, secs);
        }
        return String.format("%d:%02d", minutes, secs);
    }
}
```

---

## 5. 설정

### 5.1 JPA Auditing 설정

```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
```

### 5.2 파일 업로드 설정

```yaml
# application.yml
spring:
  servlet:
    multipart:
      max-file-size: 2GB
      max-request-size: 2GB

file:
  upload-dir: /uploads
  allowed-extensions:
    video: mp4,avi,mov,mkv,webm
    document: pdf,doc,docx,ppt,pptx,xls,xlsx
    image: jpg,jpeg,png,gif,svg,webp
    audio: mp3,wav,m4a,flac
```

---

## 6. 소스 위치

```
backend/src/main/java/com/lms/platform/common/
├── entity/
│   ├── BaseTimeEntity.java
│   └── TenantEntity.java
├── response/
│   ├── ApiResponse.java
│   ├── ErrorInfo.java
│   └── PageResponse.java
├── exception/
│   ├── BusinessException.java
│   ├── ErrorCode.java
│   └── GlobalExceptionHandler.java
├── util/
│   ├── FileUtils.java
│   └── TimeUtils.java
└── config/
    ├── JpaConfig.java
    └── FileConfig.java
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [module-structure.md](../../context/module-structure.md) | 모듈 설계 개요 |
| [course/api.md](../course/api.md) | Course API (공통 응답 사용) |
| [content/api.md](../content/api.md) | Content API (공통 응답 사용) |
| [learning/api.md](../learning/api.md) | LearningObject API (공통 응답 사용) |

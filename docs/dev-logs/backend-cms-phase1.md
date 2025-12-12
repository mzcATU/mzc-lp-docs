# Backend CMS 모듈 개발 로그

> Content Management System - 파일 업로드 및 콘텐츠 메타데이터 관리

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **담당 모듈** | CMS (Content Management) |

---

## 1. 구현 개요

파일 업로드 및 콘텐츠 메타데이터 관리 API 10개 구현:

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| POST | `/api/contents/upload` | 파일 업로드 + Content 생성 | 201 Created |
| POST | `/api/contents/external-link` | 외부 링크 등록 | 201 Created |
| GET | `/api/contents` | 목록 조회 (필터/페이징) | 200 OK |
| GET | `/api/contents/{id}` | 상세 조회 | 200 OK |
| GET | `/api/contents/{id}/stream` | 스트리밍 | 200 OK |
| GET | `/api/contents/{id}/download` | 다운로드 | 200 OK |
| GET | `/api/contents/{id}/preview` | 미리보기 | 200 OK |
| PATCH | `/api/contents/{id}` | 메타데이터 수정 | 200 OK |
| PUT | `/api/contents/{id}/file` | 파일 교체 | 200 OK |
| DELETE | `/api/contents/{id}` | 삭제 | 204 No Content |

---

## 2. 신규 생성 파일 (16개)

### Constant

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentType.java | `constant/` | VIDEO, DOCUMENT, IMAGE, AUDIO, EXTERNAL_LINK |

### Entity

| 파일 | 경로 | 설명 |
|------|------|------|
| Content.java | `entity/` | 콘텐츠 엔티티 (TenantEntity 상속) |

### Repository

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentRepository.java | `repository/` | JPA Repository |

### Controller

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentController.java | `controller/` | REST API 엔드포인트 |

### Service

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentService.java | `service/` | 서비스 인터페이스 |
| ContentServiceImpl.java | `service/` | 서비스 구현체 |
| FileStorageService.java | `service/` | 파일 저장소 인터페이스 |
| FileStorageServiceImpl.java | `service/` | 로컬 파일 저장소 구현체 |

### DTO - Request

| 파일 | 경로 | 설명 |
|------|------|------|
| CreateExternalLinkRequest.java | `dto/request/` | 외부 링크 등록 (url, name, folderId) |
| UpdateContentRequest.java | `dto/request/` | 메타데이터 수정 (originalFileName, duration, resolution) |

### DTO - Response

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentResponse.java | `dto/response/` | 콘텐츠 상세 응답 |
| ContentListResponse.java | `dto/response/` | 콘텐츠 목록 응답 |

### Event

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentCreatedEvent.java | `event/` | 콘텐츠 생성 이벤트 (LO 모듈에서 수신) |

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| ContentNotFoundException.java | `exception/` | 콘텐츠 미존재 예외 |
| FileStorageException.java | `exception/` | 파일 저장 예외 |
| UnsupportedContentTypeException.java | `exception/` | 미지원 파일 타입 예외 |

---

## 3. 수정 파일 (2개)

### ErrorCode.java

```java
// Content (CMS) 에러 코드 추가
CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "CT001", "Content not found"),
UNSUPPORTED_FILE_TYPE(HttpStatus.BAD_REQUEST, "CT002", "Unsupported file type"),
FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "CT003", "File size exceeded"),
INVALID_EXTERNAL_URL(HttpStatus.BAD_REQUEST, "CT004", "Invalid external URL"),
FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "CT005", "File upload failed"),
METADATA_EXTRACTION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "CT006", "Metadata extraction failed"),
FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "CT007", "File not found on storage"),
```

### application.yml

```yaml
# File Storage 설정 추가
file:
  upload-dir: ${FILE_UPLOAD_DIR:./uploads}
  max-size:
    video: ${FILE_MAX_SIZE_VIDEO:2147483648}      # 2GB
    audio: ${FILE_MAX_SIZE_AUDIO:524288000}       # 500MB
    document: ${FILE_MAX_SIZE_DOCUMENT:104857600} # 100MB
    image: ${FILE_MAX_SIZE_IMAGE:52428800}        # 50MB

spring.servlet.multipart:
  enabled: true
  max-file-size: 2GB
  max-request-size: 2GB
```

---

## 4. 파일 구조

```
domain/content/
├── constant/
│   └── ContentType.java          ✅ 신규
├── controller/
│   └── ContentController.java    ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateExternalLinkRequest.java    ✅ 신규
│   │   └── UpdateContentRequest.java         ✅ 신규
│   └── response/
│       ├── ContentResponse.java              ✅ 신규
│       └── ContentListResponse.java          ✅ 신규
├── entity/
│   └── Content.java              ✅ 신규
├── event/
│   └── ContentCreatedEvent.java  ✅ 신규
├── exception/
│   ├── ContentNotFoundException.java         ✅ 신규
│   ├── FileStorageException.java             ✅ 신규
│   └── UnsupportedContentTypeException.java  ✅ 신규
├── repository/
│   └── ContentRepository.java    ✅ 신규
└── service/
    ├── ContentService.java       ✅ 신규
    ├── ContentServiceImpl.java   ✅ 신규
    ├── FileStorageService.java   ✅ 신규
    └── FileStorageServiceImpl.java ✅ 신규
```

---

## 5. 지원 파일 형식

| 타입 | 확장자 | 최대 크기 |
|------|--------|----------|
| VIDEO | mp4, avi, mov, mkv, webm | 2GB |
| AUDIO | mp3, wav, m4a, flac | 500MB |
| DOCUMENT | pdf, doc, docx, ppt, pptx, xls, xlsx | 100MB |
| IMAGE | jpg, jpeg, png, gif, svg, webp | 50MB |
| EXTERNAL_LINK | YouTube, Vimeo, Google Form URL | - |

---

## 6. 주요 구현 특징

### 멀티테넌시

- Content 엔티티는 `TenantEntity` 상속
- tenant_id 기반 데이터 격리
- Repository 메서드에서 tenantId 필터링

### 파일 저장 패턴

```
/uploads/{year}/{month}/{uuid}.{extension}
예: /uploads/2025/01/550e8400-e29b-41d4-a716-446655440000.mp4
```

- UUID로 파일명 충돌 방지
- 날짜별 디렉토리로 관리 용이
- 원본 파일명은 DB에 별도 저장

### 이벤트 발행

- Content 업로드 시 `ContentCreatedEvent` 발행
- LO 모듈의 `LearningObjectEventListener`가 수신
- LearningObject 자동 생성

### 권한

- DESIGNER, OPERATOR, TENANT_ADMIN 권한 필요
- `@PreAuthorize` 어노테이션으로 검증

---

## 7. 컨벤션 준수 체크

### Entity (02-ENTITY-CONVENTIONS)

- [x] `TenantEntity` 상속 (멀티테넌시)
- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`
- [x] `@Getter` (Setter 금지)
- [x] 정적 팩토리 메서드 (`createFile`, `createExternalLink`)
- [x] 비즈니스 메서드로 상태 변경

### Controller (03-CONTROLLER-CONVENTIONS)

- [x] `@RestController`, `@RequestMapping`, `@RequiredArgsConstructor`, `@Validated`
- [x] `@PreAuthorize` 권한 검증
- [x] `ApiResponse` 래퍼 사용
- [x] try-catch 미사용 (GlobalExceptionHandler 위임)

### Service (04-SERVICE-CONVENTIONS)

- [x] `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- [x] 클래스 레벨 `@Transactional(readOnly = true)`
- [x] 쓰기 메서드에 `@Transactional`

### DTO (07-DTO-CONVENTIONS)

- [x] Java Record 사용
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@Size`)
- [x] Response: `from()` 정적 팩토리 메서드

---

## 8. 다음 작업 (LO 모듈)

Content 생성 이벤트를 수신하여 LearningObject를 자동 생성하는 LO 모듈 구현:

| Method | Endpoint | 기능 |
|--------|----------|------|
| POST | `/api/learning-objects` | 학습객체 수동 생성 |
| GET | `/api/learning-objects` | 목록 조회 |
| GET | `/api/learning-objects/{id}` | 상세 조회 |
| PATCH | `/api/learning-objects/{id}/folder` | 폴더 이동 |
| DELETE | `/api/learning-objects/{id}` | 삭제 |

**필요 작업:**
- LearningObjectEventListener 구현
- ContentFolder 엔티티 (3단계 계층)
- 폴더 관리 API

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | CMS 모듈 구현 완료 (API 10개) |

---

*최종 업데이트: 2025-12-12*

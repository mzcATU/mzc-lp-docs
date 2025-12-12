# Backend LO 모듈 개발 로그

> Learning Object - 학습객체 및 콘텐츠 폴더 관리

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | Claude Code |
| **작업 일자** | 2025-12-12 |
| **담당 모듈** | LO (Learning Object) |

---

## 1. 구현 개요

학습객체 및 콘텐츠 폴더 관리 API 14개 구현:

### LearningObject API (7개)

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| POST | `/api/learning-objects` | LO 수동 생성 | 201 Created |
| GET | `/api/learning-objects` | 목록 조회 (폴더/키워드 필터) | 200 OK |
| GET | `/api/learning-objects/{id}` | 상세 조회 | 200 OK |
| GET | `/api/learning-objects/content/{contentId}` | Content ID로 LO 조회 | 200 OK |
| PATCH | `/api/learning-objects/{id}` | 메타데이터 수정 | 200 OK |
| PATCH | `/api/learning-objects/{id}/folder` | 폴더 이동 | 200 OK |
| DELETE | `/api/learning-objects/{id}` | 삭제 | 204 No Content |

### ContentFolder API (7개)

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| POST | `/api/content-folders` | 폴더 생성 | 201 Created |
| GET | `/api/content-folders/tree` | 전체 트리 조회 | 200 OK |
| GET | `/api/content-folders/{id}` | 폴더 상세 조회 | 200 OK |
| GET | `/api/content-folders/{id}/children` | 하위 폴더 목록 | 200 OK |
| PUT | `/api/content-folders/{id}` | 폴더명 수정 | 200 OK |
| PUT | `/api/content-folders/{id}/move` | 폴더 이동 | 200 OK |
| DELETE | `/api/content-folders/{id}` | 폴더 삭제 | 204 No Content |

---

## 2. 신규 생성 파일 (20개)

### Entity

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObject.java | `entity/` | 학습객체 엔티티 (TenantEntity 상속) |
| ContentFolder.java | `entity/` | 콘텐츠 폴더 엔티티 (3단계 계층) |

### Repository

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectRepository.java | `repository/` | LO JPA Repository |
| ContentFolderRepository.java | `repository/` | 폴더 JPA Repository |

### Controller

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectController.java | `controller/` | LO REST API 엔드포인트 |
| ContentFolderController.java | `controller/` | 폴더 REST API 엔드포인트 |

### Service

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectService.java | `service/` | LO 서비스 인터페이스 |
| LearningObjectServiceImpl.java | `service/` | LO 서비스 구현체 |
| ContentFolderService.java | `service/` | 폴더 서비스 인터페이스 |
| ContentFolderServiceImpl.java | `service/` | 폴더 서비스 구현체 |

### Listener

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectEventListener.java | `listener/` | Content 생성 이벤트 리스너 |

### DTO - Request

| 파일 | 경로 | 설명 |
|------|------|------|
| CreateLearningObjectRequest.java | `dto/request/` | LO 수동 생성 (contentId, name, folderId) |
| UpdateLearningObjectRequest.java | `dto/request/` | LO 수정 (name) |
| MoveFolderRequest.java | `dto/request/` | LO 폴더 이동 (folderId) |
| CreateContentFolderRequest.java | `dto/request/` | 폴더 생성 (folderName, parentId) |
| UpdateContentFolderRequest.java | `dto/request/` | 폴더명 수정 (folderName) |
| MoveContentFolderRequest.java | `dto/request/` | 폴더 이동 (targetParentId) |

### DTO - Response

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectResponse.java | `dto/response/` | LO 응답 (Content 정보 포함) |
| ContentFolderResponse.java | `dto/response/` | 폴더 응답 (children 포함) |

### Exception

| 파일 | 경로 | 설명 |
|------|------|------|
| LearningObjectNotFoundException.java | `exception/` | LO 미존재 예외 |
| ContentFolderNotFoundException.java | `exception/` | 폴더 미존재 예외 |
| MaxDepthExceededException.java | `exception/` | 최대 깊이 초과 예외 |

---

## 3. 수정 파일 (1개)

### ErrorCode.java

```java
// Learning Object (LO) 에러 코드 추가
LEARNING_OBJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "LO001", "Learning object not found"),
CONTENT_FOLDER_NOT_FOUND(HttpStatus.NOT_FOUND, "LO002", "Content folder not found"),
MAX_FOLDER_DEPTH_EXCEEDED(HttpStatus.BAD_REQUEST, "LO003", "Maximum folder depth exceeded"),
FOLDER_NOT_EMPTY(HttpStatus.BAD_REQUEST, "LO004", "Folder is not empty"),
DUPLICATE_FOLDER_NAME(HttpStatus.CONFLICT, "LO005", "Folder name already exists in this location"),
```

---

## 4. 파일 구조

```
domain/learning/
├── controller/
│   ├── LearningObjectController.java    ✅ 신규
│   └── ContentFolderController.java     ✅ 신규
├── dto/
│   ├── request/
│   │   ├── CreateLearningObjectRequest.java     ✅ 신규
│   │   ├── UpdateLearningObjectRequest.java     ✅ 신규
│   │   ├── MoveFolderRequest.java               ✅ 신규
│   │   ├── CreateContentFolderRequest.java      ✅ 신규
│   │   ├── UpdateContentFolderRequest.java      ✅ 신규
│   │   └── MoveContentFolderRequest.java        ✅ 신규
│   └── response/
│       ├── LearningObjectResponse.java          ✅ 신규
│       └── ContentFolderResponse.java           ✅ 신규
├── entity/
│   ├── LearningObject.java              ✅ 신규
│   └── ContentFolder.java               ✅ 신규
├── exception/
│   ├── LearningObjectNotFoundException.java     ✅ 신규
│   ├── ContentFolderNotFoundException.java      ✅ 신규
│   └── MaxDepthExceededException.java           ✅ 신규
├── listener/
│   └── LearningObjectEventListener.java ✅ 신규
├── repository/
│   ├── LearningObjectRepository.java    ✅ 신규
│   └── ContentFolderRepository.java     ✅ 신규
└── service/
    ├── LearningObjectService.java       ✅ 신규
    ├── LearningObjectServiceImpl.java   ✅ 신규
    ├── ContentFolderService.java        ✅ 신규
    └── ContentFolderServiceImpl.java    ✅ 신규
```

---

## 5. 주요 구현 특징

### 멀티테넌시

- LearningObject, ContentFolder 엔티티는 `TenantEntity` 상속
- tenant_id 기반 데이터 격리
- Repository 메서드에서 tenantId 필터링

### ContentFolder 계층 구조

```
depth 0: 루트 폴더 (parent = null)
depth 1: 1단계 하위 폴더
depth 2: 2단계 하위 폴더 (최대)
```

- 최대 3단계 계층 (MAX_DEPTH = 2)
- Self-referencing ManyToOne 관계
- 폴더 이동 시 순환 참조 검증

### 이벤트 기반 LO 자동 생성

```java
@EventListener
public void handleContentCreated(ContentCreatedEvent event) {
    // Content 업로드 시 LearningObject 자동 생성
    LearningObject lo = LearningObject.create(
        event.content().getOriginalFileName(),
        event.content(),
        null  // 기본 폴더 없음
    );
    learningObjectRepository.save(lo);
}
```

- CMS 모듈의 `ContentCreatedEvent` 수신
- Content와 동일한 이름으로 LearningObject 생성
- 폴더 미지정 상태로 생성 (이후 사용자가 이동)

### 폴더 삭제 정책

- 폴더에 LO가 있거나 하위 폴더가 있으면 삭제 불가
- `FOLDER_NOT_EMPTY` 에러 반환
- 먼저 내용물을 이동/삭제해야 함

### 권한

- DESIGNER, OPERATOR, TENANT_ADMIN 권한 필요
- `@PreAuthorize` 어노테이션으로 검증

---

## 6. 컨벤션 준수 체크

### Entity (02-ENTITY-CONVENTIONS)

- [x] `TenantEntity` 상속 (멀티테넌시)
- [x] `@NoArgsConstructor(access = AccessLevel.PROTECTED)`
- [x] `@Getter` (Setter 금지)
- [x] 정적 팩토리 메서드 (`create`, `createRoot`, `createChild`)
- [x] 비즈니스 메서드로 상태 변경 (`moveTo`, `updateName`)

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
- [x] Request: Validation 어노테이션 (`@NotBlank`, `@NotNull`, `@Size`)
- [x] Response: `from()`, `fromWithChildren()` 정적 팩토리 메서드

---

## 7. CM/CR 연동 포인트 (다른 담당자 참고)

LearningObject 엔티티가 완성되었으므로, CM 담당자가 CourseItem에서 다음과 같이 연결 가능:

```java
// CourseItem.java (CM 담당자가 구현)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "learning_object_id")
private LearningObject learningObject;  // NULL이면 폴더, NOT NULL이면 차시
```

**연동 시 주의사항:**
- LearningObject 삭제 전 CourseItem 참조 확인 필요
- tenant_id 일치 검증 필수

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2025-12-12 | Claude Code | LO 모듈 구현 완료 (API 14개) |

---

*최종 업데이트: 2025-12-12*

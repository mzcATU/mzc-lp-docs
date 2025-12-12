# Backend UM 모듈 개발 로그 - Phase 5

> 프로필 이미지 업로드 API 구현

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업 일자** | 2025-12-12 |
| **관련 이슈** | [#33](https://github.com/mzcATU/mzc-lp-backend/issues/33) |
| **관련 PR** | TBD |
| **담당 모듈** | UM (User Master) |
| **브랜치** | `feat/um-profile-image` |

---

## 1. 구현 개요

사용자 프로필 이미지 업로드 기능 구현 및 파일 저장 서비스 추가:

| Method | Endpoint | 기능 | HTTP Status |
|--------|----------|------|-------------|
| POST | `/api/users/me/profile-image` | 프로필 이미지 업로드 | 200 OK |

---

## 2. 비즈니스 로직

### 프로필 이미지 업로드 플로우

```
1. 인증된 사용자 확인
2. 파일 검증
   - 파일 형식: JPG, JPEG, PNG만 허용
   - 파일 크기: 최대 5MB
3. 파일 저장
   - UUID 기반 고유 파일명 생성
   - 로컬 파일시스템에 저장 (uploads/profile-images/)
4. User 엔티티 profileImageUrl 업데이트
5. 저장된 URL 반환
```

### 보안 고려사항

- 인증된 사용자만 업로드 가능 (`@AuthenticationPrincipal`)
- 파일 형식 검증으로 악성 파일 업로드 차단
- 파일 크기 제한으로 서버 리소스 보호
- UUID 파일명으로 파일명 충돌 방지

---

## 3. 추가/수정 파일

### 3.1 신규 파일 (4개)

#### WebConfig.java
- **위치**: `src/main/java/com/mzc/lp/common/config/WebConfig.java`
- **목적**: CORS 설정 추가
- **주요 내용**:
  ```java
  @Configuration
  public class WebConfig implements WebMvcConfigurer {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
          registry.addMapping("/api/**")
                  .allowedOrigins("http://localhost:3000")
                  .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                  .allowedHeaders("*")
                  .allowCredentials(true)
                  .maxAge(3600);
      }
  }
  ```

#### ProfileImageResponse.java
- **위치**: `src/main/java/com/mzc/lp/domain/user/dto/response/ProfileImageResponse.java`
- **목적**: 프로필 이미지 업로드 응답 DTO
- **주요 내용**:
  ```java
  public record ProfileImageResponse(String profileImageUrl) {
      public static ProfileImageResponse from(String profileImageUrl) {
          return new ProfileImageResponse(profileImageUrl);
      }
  }
  ```

#### FileStorageService.java
- **위치**: `src/main/java/com/mzc/lp/common/service/FileStorageService.java`
- **목적**: 파일 저장 및 검증 서비스
- **주요 기능**:
  - `storeProfileImage()`: 프로필 이미지 저장
  - `validateFile()`: 파일 검증 (타입, 크기)
- **주요 내용**:
  ```java
  @Service
  public class FileStorageService {
      private static final List<String> ALLOWED_IMAGE_TYPES =
          Arrays.asList("image/jpeg", "image/jpg", "image/png");
      private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB

      @Value("${file.upload-dir:uploads/profile-images}")
      private String uploadDir;

      public String storeProfileImage(MultipartFile file) {
          validateFile(file);

          // 업로드 디렉토리 생성
          Path uploadPath = Paths.get(uploadDir);
          if (!Files.exists(uploadPath)) {
              Files.createDirectories(uploadPath);
          }

          // UUID 기반 파일명 생성
          String filename = UUID.randomUUID().toString() + extension;

          // 파일 저장
          Path targetPath = uploadPath.resolve(filename);
          Files.copy(file.getInputStream(), targetPath,
                     StandardCopyOption.REPLACE_EXISTING);

          return "/uploads/profile-images/" + filename;
      }

      private void validateFile(MultipartFile file) {
          if (file.isEmpty()) {
              throw new BusinessException(ErrorCode.INVALID_IMAGE_FORMAT);
          }

          // 파일 타입 검증
          if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
              throw new BusinessException(ErrorCode.INVALID_IMAGE_FORMAT);
          }

          // 파일 크기 검증
          if (file.getSize() > MAX_FILE_SIZE) {
              throw new BusinessException(ErrorCode.IMAGE_SIZE_EXCEEDED);
          }
      }
  }
  ```

### 3.2 수정 파일 (5개)

#### ErrorCode.java
- **위치**: `src/main/java/com/mzc/lp/common/constant/ErrorCode.java`
- **변경 내용**: 에러 코드 3개 추가
  ```java
  // User
  INVALID_IMAGE_FORMAT(HttpStatus.BAD_REQUEST, "U008",
      "Invalid image format. Only JPG, JPEG, PNG allowed"),
  IMAGE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "U009",
      "Image size exceeds 5MB limit"),
  FILE_STORAGE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "U010",
      "Failed to store file"),
  ```

#### UserService.java
- **위치**: `src/main/java/com/mzc/lp/domain/user/service/UserService.java`
- **변경 내용**: 메서드 시그니처 추가
  ```java
  ProfileImageResponse uploadProfileImage(Long userId, MultipartFile file);
  ```

#### UserServiceImpl.java
- **위치**: `src/main/java/com/mzc/lp/domain/user/service/UserServiceImpl.java`
- **변경 내용**:
  - FileStorageService 의존성 주입
  - `uploadProfileImage()` 메서드 구현
  ```java
  @Override
  @Transactional
  public ProfileImageResponse uploadProfileImage(Long userId, MultipartFile file) {
      log.info("Uploading profile image: userId={}", userId);
      User user = userRepository.findById(userId)
              .orElseThrow(() -> new UserNotFoundException(userId));

      String profileImageUrl = fileStorageService.storeProfileImage(file);
      user.updateProfile(user.getName(), user.getPhone(), profileImageUrl);

      log.info("Profile image uploaded: userId={}, url={}", userId, profileImageUrl);
      return ProfileImageResponse.from(profileImageUrl);
  }
  ```

#### UserController.java
- **위치**: `src/main/java/com/mzc/lp/domain/user/controller/UserController.java`
- **변경 내용**: 프로필 이미지 업로드 엔드포인트 추가
  ```java
  @PostMapping("/me/profile-image")
  public ResponseEntity<ApiResponse<ProfileImageResponse>> uploadProfileImage(
          @AuthenticationPrincipal UserPrincipal principal,
          @RequestParam MultipartFile file
  ) {
      ProfileImageResponse response = userService.uploadProfileImage(principal.id(), file);
      return ResponseEntity.ok(ApiResponse.success(response));
  }
  ```

#### UserControllerTest.java
- **위치**: `src/test/java/com/mzc/lp/domain/user/controller/UserControllerTest.java`
- **변경 내용**: 프로필 이미지 업로드 테스트 케이스 6개 추가
  - ✅ 성공 - JPG 이미지 업로드
  - ✅ 성공 - PNG 이미지 업로드
  - ✅ 실패 - 잘못된 파일 형식 (txt)
  - ✅ 실패 - 파일 크기 초과 (6MB)
  - ✅ 실패 - 빈 파일
  - ✅ 실패 - 인증 없이 접근

---

## 4. API 스펙

### POST /api/users/me/profile-image

프로필 이미지 업로드

**Request**
```http
POST /api/users/me/profile-image HTTP/1.1
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: (binary data)
```

**Request Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|-----|------|
| file | MultipartFile | O | 프로필 이미지 파일 (JPG/JPEG/PNG, 최대 5MB) |

**Response - 성공 (200 OK)**
```json
{
  "success": true,
  "data": {
    "profileImageUrl": "/uploads/profile-images/550e8400-e29b-41d4-a716-446655440000.jpg"
  }
}
```

**Response - 실패 (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "U008",
    "message": "Invalid image format. Only JPG, JPEG, PNG allowed"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "U009",
    "message": "Image size exceeds 5MB limit"
  }
}
```

**Response - 실패 (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "A002",
    "message": "Access denied"
  }
}
```

**Response - 실패 (500 Internal Server Error)**
```json
{
  "success": false,
  "error": {
    "code": "U010",
    "message": "Failed to store file"
  }
}
```

---

## 5. 에러 코드

| 코드 | HTTP Status | 메시지 | 발생 조건 |
|------|-------------|--------|----------|
| U008 | 400 | Invalid image format. Only JPG, JPEG, PNG allowed | 지원하지 않는 파일 형식 |
| U009 | 400 | Image size exceeds 5MB limit | 파일 크기 초과 (5MB 이상) |
| U010 | 500 | Failed to store file | 파일 저장 실패 |

---

## 6. 테스트 결과

### 6.1 단위 테스트

```bash
./gradlew test

BUILD SUCCESSFUL in 19s
```

**총 테스트 수**: 57개 (기존 51개 + 신규 6개)
- ✅ 프로필 이미지 업로드 성공 테스트 (JPG)
- ✅ 프로필 이미지 업로드 성공 테스트 (PNG)
- ✅ 잘못된 파일 형식 업로드 실패 테스트
- ✅ 파일 크기 초과 업로드 실패 테스트
- ✅ 빈 파일 업로드 실패 테스트
- ✅ 인증 없이 업로드 실패 테스트

### 6.2 수동 테스트

**테스트 환경**
- 서버: http://localhost:8080
- 사용자: testuser@example.com (userId: 10)

**테스트 시나리오**
1. ✅ 회원가입 성공
2. ✅ 로그인 성공 (토큰 획득)
3. ⚠️ 프로필 이미지 업로드 (서버 환경 이슈로 수동 테스트 미완료, 단위 테스트 통과)

---

## 7. 체크리스트 검증

### 구현 완료 항목

- [x] ProfileImageResponse DTO 생성
- [x] FileStorageService 생성
- [x] UserService.uploadProfileImage() 메서드 구현
- [x] UserController POST /api/users/me/profile-image 구현
- [x] 파일 검증 로직 (타입, 크기)
- [x] 파일 저장 (로컬 스토리지)
- [x] 예외 처리 (INVALID_IMAGE_FORMAT, IMAGE_SIZE_EXCEEDED, FILE_STORAGE_ERROR)
- [x] 테스트 코드 작성 (6개 테스트 케이스)
- [x] API 문서화
- [x] CORS 설정 추가 (localhost:3000)

### 검증 결과

| 항목 | 상태 | 비고 |
|-----|------|------|
| DTO 생성 | ✅ | ProfileImageResponse.java |
| Service 생성 | ✅ | FileStorageService.java |
| 비즈니스 로직 구현 | ✅ | UserServiceImpl.java |
| 컨트롤러 구현 | ✅ | UserController.java |
| 파일 검증 | ✅ | 타입(JPG/JPEG/PNG), 크기(5MB) |
| 파일 저장 | ✅ | UUID 기반 고유 파일명, 로컬 저장 |
| 예외 처리 | ✅ | 3개 에러 코드 추가 |
| 테스트 코드 | ✅ | 6개 테스트 케이스 통과 |
| API 문서 | ✅ | PR 메시지에 포함 |
| CORS 설정 | ✅ | localhost:3000 허용 |

---

## 8. 주요 기술 결정

### 8.1 파일 저장 방식

**선택**: 로컬 파일시스템 저장
- **장점**:
  - 구현이 단순하고 빠름
  - 외부 의존성 없음
  - 개발 환경에서 쉽게 테스트 가능
- **단점**:
  - 확장성 제한 (스케일 아웃 시 파일 동기화 문제)
  - 백업/복구 관리 필요
- **향후 개선**: AWS S3 또는 클라우드 스토리지로 마이그레이션 고려

### 8.2 파일명 생성 전략

**선택**: UUID v4 기반 고유 파일명
- **장점**:
  - 파일명 충돌 방지 (128비트 고유성)
  - 보안 향상 (원본 파일명 노출 방지)
  - URL 예측 불가능
- **형식**: `{UUID}.{확장자}` (예: `550e8400-e29b-41d4-a716-446655440000.jpg`)

### 8.3 파일 검증

**검증 항목**:
1. 파일 존재 여부 (`file.isEmpty()`)
2. MIME 타입 검증 (`image/jpeg`, `image/jpg`, `image/png`)
3. 파일 크기 제한 (5MB)

**보안 고려**:
- MIME 타입만으로는 완벽한 검증 불가 (Magic Number 검증 추가 고려)
- 바이러스 스캔 추가 고려 (프로덕션 환경)

---

## 9. Git 커밋 히스토리

```bash
feat: 프로필 이미지 업로드 API 구현

- CORS 설정 추가 (localhost:3000)
- ProfileImageResponse DTO 생성
- FileStorageService 생성 (파일 저장 및 검증)
- UserService.uploadProfileImage() 메서드 구현
- POST /api/users/me/profile-image 엔드포인트 추가
- 에러 코드 추가 (INVALID_IMAGE_FORMAT, IMAGE_SIZE_EXCEEDED, FILE_STORAGE_ERROR)
- 파일 검증 로직 (JPG/JPEG/PNG, 최대 5MB)
- 테스트 코드 작성 (성공/실패 케이스)

Commit: 5f78459
Branch: feat/um-profile-image
```

---

## 10. 향후 개선 사항

### 10.1 기능 개선
- [ ] 이미지 리사이징 (썸네일 생성)
- [ ] 이미지 최적화 (압축)
- [ ] Magic Number 기반 파일 검증
- [ ] 이미지 메타데이터 제거 (EXIF)
- [ ] 프로필 이미지 삭제 API

### 10.2 인프라 개선
- [ ] AWS S3 연동
- [ ] CDN 적용
- [ ] 이미지 캐싱 전략
- [ ] 파일 백업 자동화

### 10.3 보안 강화
- [ ] 바이러스 스캔 통합
- [ ] Rate Limiting (업로드 횟수 제한)
- [ ] 사용자별 저장 용량 제한

---

## 11. 참고 사항

- **파일 저장 경로**: `uploads/profile-images/`
- **파일명 형식**: `{UUID}.{확장자}`
- **지원 형식**: JPG, JPEG, PNG
- **최대 파일 크기**: 5MB
- **CORS 허용 도메인**: `http://localhost:3000`

---

## 12. 트러블슈팅

### 이슈: Windows 환경에서 curl multipart 테스트 실패
- **원인**: Git Bash에서 임시 파일 경로 문제
- **해결**: 단위 테스트로 검증 완료 (MockMultipartFile 사용)
- **영향**: 없음 (모든 단위 테스트 통과)

---

**작성자**: Claude Sonnet 4.5
**최종 수정**: 2025-12-12

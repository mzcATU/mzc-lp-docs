# 01. Project Structure

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> Spring Boot 3.4.x + Java 21 프로젝트 구조

---

## 언제 이 문서를 보는가?

| 상황 | 참조 섹션 |
|------|----------|
| 프로젝트 폴더 구조? | 전체 구조 |
| 도메인 패키지 구성? | Domain 패키지 구조 |
| 공통 컴포넌트 위치? | Common 패키지 |

---

## 전체 구조

```
project-name/
├── src/main/java/com/company/project/
│   ├── ProjectApplication.java
│   ├── domain/          # 도메인별 패키지
│   ├── common/          # 공통 컴포넌트
│   ├── config/          # 설정
│   └── security/        # 보안
├── src/main/resources/
│   ├── application.yml
│   └── application-{env}.yml
└── src/test/
```

---

## Domain 패키지 구조

```
domain/
├── user/
│   ├── controller/UserController.java
│   ├── service/UserService.java
│   ├── repository/UserRepository.java
│   ├── entity/User.java
│   ├── dto/
│   │   ├── request/CreateUserRequest.java
│   │   └── response/UserResponse.java
│   └── exception/UserNotFoundException.java
├── product/
└── order/
```

---

## Common 패키지

```
common/
├── entity/
│   ├── BaseEntity.java         # id
│   └── BaseTimeEntity.java     # + createdAt, updatedAt
├── dto/
│   ├── PageResponse.java
│   └── ErrorResponse.java
├── exception/
│   ├── BusinessException.java
│   ├── NotFoundException.java
│   └── GlobalExceptionHandler.java
├── constant/ErrorCode.java
└── util/
```

---

## 패키지 의존성 규칙

```
Controller → Service → Repository → Entity
    ↓          ↓
   DTO      Common

✅ domain.user → common
✅ domain.user → domain.product (최소화)
❌ common → domain
❌ Repository → Service
❌ Controller → Repository (Service 거쳐야)
```

---

## Common vs Domain

| Common | Domain |
|--------|--------|
| BaseEntity | 도메인 특화 예외 |
| ErrorResponse | 도메인 특화 DTO |
| GlobalExceptionHandler | 비즈니스 로직 |
| 공통 유틸 | |

---

## 파일 네이밍

| 종류 | 예시 |
|------|------|
| Controller | `UserController` |
| Service | `UserService` |
| Repository | `UserRepository` |
| Entity | `User`, `UserStatus` (Enum) |
| DTO | `CreateUserRequest`, `UserResponse` |
| Exception | `UserNotFoundException` |

---

## build.gradle 핵심 의존성

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.4.x'
}

java {
    sourceCompatibility = '21'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    runtimeOnly 'com.h2database:h2'
    runtimeOnly 'com.mysql:mysql-connector-j'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

---

> 상세 구조 → [architecture.md](../docs/context/architecture.md)

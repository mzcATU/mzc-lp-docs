# Backend Setup Guide

> mzc-lp-backend 저장소 설정 상세 가이드

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 섹션/문서 |
|----------|---------------|
| 백엔드 프로젝트 구조? | 섹션 디렉토리 구조 |
| .gitignore 설정? | 섹션 핵심 설정 파일 > .gitignore |
| 환경 변수 설정? | 섹션 핵심 설정 파일 > .env.example |
| application.yml 설정? | 섹션 핵심 설정 파일 > application.yml |
| Docker 설정? | 섹션 Docker 설정 |
| CI/CD 파이프라인? | 섹션 CI/CD |
| 프론트엔드 설정? | [frontend-setup.md](./frontend-setup.md) |
| Repository 분리 전략? | [repository-strategy.md](./repository-strategy.md) |

---

## 디렉토리 구조

```
mzc-lp-backend/
├── .github/workflows/           # CI/CD
├── src/main/java/com/mzc/lp/
│   ├── common/                  # 공통 (config, exception, response)
│   ├── domain/                  # 도메인 모듈
│   │   ├── user/                # UM
│   │   ├── course/              # CM + CR
│   │   ├── content/             # CMS
│   │   ├── learning/            # LO
│   │   ├── enrollment/          # SIS
│   │   └── instructor/          # IIS
│   └── infra/                   # S3, Redis 연동
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   └── application-prod.yml
├── build.gradle
├── Dockerfile
├── docker-compose.yml           # 로컬 DB
├── .gitignore
├── .env.example
└── README.md
```

---

## 핵심 설정 파일

### .gitignore

```gitignore
build/
.gradle/
.idea/
*.jar
!gradle/wrapper/gradle-wrapper.jar

.env
.env.*
!.env.example
application-local.yml
application-prod.yml
*-secret.yml
*.pem
*.jks

*.log
/uploads/
```

### .env.example

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mza_newlp
DB_USERNAME=root
DB_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=
JWT_ACCESS_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2
S3_BUCKET=mzc-lp-contents

# Server
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=local
```

### application.yml

```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}

  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: ${JPA_DDL_AUTO:update}
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
    open-in-view: false

jwt:
  secret: ${JWT_SECRET}
  access-expiration: ${JWT_ACCESS_EXPIRATION:3600000}
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800000}

cloud:
  aws:
    credentials:
      access-key: ${AWS_ACCESS_KEY_ID}
      secret-key: ${AWS_SECRET_ACCESS_KEY}
    region:
      static: ${AWS_REGION:ap-northeast-2}
    s3:
      bucket: ${S3_BUCKET}
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: mza-newlp-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-root}
      MYSQL_DATABASE: mza_newlp
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mza-newlp-redis
    ports:
      - "6379:6379"

volumes:
  mysql_data:
```

---

## Docker 설정

### .dockerignore

```dockerignore
.git/
.gitignore
build/
.gradle/
target/
.idea/
*.iml
*.md
docs/
src/test/
.env*
!.env.example
docker-compose*.yml
Dockerfile*
*.log
```

### Dockerfile

```dockerfile
# Build Stage
FROM gradle:8.5-jdk21 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle bootJar --no-daemon

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Security: non-root user
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
USER appuser

COPY --from=builder /app/build/libs/*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## CI/CD

### .github/workflows/ci.yml

```yaml
on:
  pull_request:
    branches: [dev, main]
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - run: ./gradlew build test
```

### .github/workflows/cd.yml

```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          docker build -t mza-newlp-repo .
          docker tag mza-newlp-repo:latest 697924056608.dkr.ecr.ap-northeast-2.amazonaws.com/mza-newlp-repo:latest
          docker push 697924056608.dkr.ecr.ap-northeast-2.amazonaws.com/mza-newlp-repo:latest
```

---

## 체크리스트

- [ ] GitHub 저장소 생성
- [ ] Spring Boot 프로젝트 초기화 (Java 21)
- [ ] `.gitignore`, `.env.example` 설정
- [ ] `application.yml` 환경별 설정
- [ ] `Dockerfile`, `docker-compose.yml`
- [ ] `.github/workflows/` CI/CD
- [ ] README.md

---

> 관련 문서: [POLY-REPO.md](../POLY-REPO.md), [19-DATABASE-CONVENTIONS](../conventions/19-DATABASE-CONVENTIONS.md)

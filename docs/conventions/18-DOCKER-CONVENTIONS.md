# 18. Docker Conventions

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> 컨테이너화 및 로컬 개발 환경 컨벤션

---

## 핵심 규칙

```
✅ 멀티스테이지 빌드 사용 → 이미지 크기 최소화
✅ .dockerignore 필수 → 불필요한 파일 제외
✅ 비root 사용자 실행 → 보안 강화
✅ 환경변수로 설정 주입 → 하드코딩 금지
✅ 헬스체크 설정 → 컨테이너 상태 모니터링
```

---

## Dockerfile 패턴

### Backend (Spring Boot)

```dockerfile
FROM gradle:8.5-jdk21 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
USER appuser
COPY --from=builder /app/build/libs/*.jar app.jar
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend (React + Nginx)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
HEALTHCHECK --interval=30s CMD wget -q --spider http://localhost:80 || exit 1
EXPOSE 80
```

---

## Docker Compose (개발 환경)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8080:8080"]
    environment:
      - SPRING_PROFILES_ACTIVE=dev
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    volumes:
      - ./frontend/src:/app/src

  db:
    image: mysql:8.0
    env_file: .env
    ports: ["3306:3306"]
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5

volumes:
  mysql_data:
```

---

## 명령어

```bash
docker compose up -d              # 실행
docker compose logs -f backend    # 로그
docker compose build --no-cache   # 리빌드
docker compose down -v            # 정리
```

---

## 체크리스트

### Dockerfile
- [ ] 멀티스테이지 빌드
- [ ] 비root 사용자
- [ ] HEALTHCHECK
- [ ] .dockerignore 설정

### docker-compose
- [ ] depends_on + healthcheck 조합
- [ ] 환경변수는 .env 파일로
- [ ] 볼륨 마운트 (핫리로드)

---

## 자주 하는 실수

| ❌ Bad | ✅ Good |
|--------|---------|
| root 사용자 실행 | `USER appuser` 설정 |
| 싱글스테이지 빌드 | 멀티스테이지 (builder → runtime) |
| `COPY . .` 먼저 | 의존성 파일 먼저 COPY |
| .dockerignore 없음 | node_modules, .git 제외 |
| HEALTHCHECK 없음 | HEALTHCHECK 추가 |
| `depends_on: [db]` | `condition: service_healthy` |
| 환경변수 하드코딩 | `env_file: .env` |
| `image: latest` | `image: backend:${GIT_SHA}` |

---

## 관련 문서

- [20-AWS-CONVENTIONS](./20-AWS-CONVENTIONS.md) - ECR 배포
- [25-IGNORE-CONVENTIONS](./25-IGNORE-CONVENTIONS.md) - .dockerignore
- [infrastructure.md](../docs/context/infrastructure.md) - 상세 인프라

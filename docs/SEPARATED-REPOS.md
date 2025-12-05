# Separated Repositories Guide

> Backend / Frontend **별도 저장소** 운영 가이드

---

## 저장소 구조

```
learning-platform-backend/    # Backend 전용
├── src/main/java/.../
├── build.gradle
└── CLAUDE.md

learning-platform-frontend/   # Frontend 전용
├── src/
├── vite.config.ts
└── CLAUDE.md
```

---

## API 통신 설정

### 개발 환경
| 항목 | Backend | Frontend |
|------|---------|----------|
| Port | 8080 | 3000 |
| URL | `localhost:8080/api` | `localhost:3000` |

### Frontend 환경변수
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api

# .env.production
VITE_API_BASE_URL=https://api.example.com/api
```

### Backend CORS
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:3000");  // 개발
        config.addAllowedOrigin("https://example.com");    // 운영
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

---

## 개발 서버 실행

```bash
# Terminal 1: Backend
cd learning-platform-backend && ./gradlew bootRun

# Terminal 2: Frontend
cd learning-platform-frontend && npm run dev
```

---

## 배포

### 환경별 배포 설정

| 환경 | Backend | Frontend | Database |
|------|---------|----------|----------|
| **Local** | Port 8080 | Port 3000 | MySQL (Docker) |
| **Dev** | ECS 1 Task (Private Subnet) | S3 + CloudFront | RDS db.t3.micro |
| **Staging** | ECS 2 Tasks | S3 + CloudFront | RDS db.t3.small |
| **Prod** | ECS 2+ Tasks (Multi-AZ) | S3 + CloudFront | RDS db.t3.small (Multi-AZ) |

### 배포 플로우

```
Backend:  GitHub Actions → ECR → ECS (Private Subnet) → api.example.com
Frontend: GitHub Actions → S3 → CloudFront → example.com
```

### Backend 배포 예시

```bash
# GitHub Actions에서 자동화
# 1. Docker 빌드
cd learning-platform-backend
docker build -t backend:latest .

# 2. ECR 푸시
docker tag backend:latest {ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/backend:latest
docker push {ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com/backend:latest

# 3. ECS 배포
aws ecs update-service --cluster learning-platform --service backend --force-new-deployment
```

### Frontend 배포 예시

```bash
# GitHub Actions에서 자동화
cd learning-platform-frontend
npm run build

# S3 업로드
aws s3 sync dist/ s3://learning-platform-frontend/

# CloudFront 무효화
aws cloudfront create-invalidation --distribution-id {DIST_ID} --paths "/*"
```

> 상세 배포 플로우 → [20-AWS-CONVENTIONS](./conventions/20-AWS-CONVENTIONS.md)

---

## Git 전략

각 저장소 독립 관리:
```
backend:  main → dev → feat/user-api
frontend: main → dev → feat/login-page
```

### 버전 관리
```bash
# 독립 버전
backend: v1.2.0 / frontend: v1.3.0

# 동기화 버전 (릴리스 맞춤)
backend: v2024.01.15 / frontend: v2024.01.15
```

---

## 문서 공유 방법

| 방법 | 설명 |
|------|------|
| **별도 저장소** | `learning-platform-docs/` 공유 문서 저장소 |
| **복사** | 각 저장소에 필요한 컨벤션만 복사 |
| **Submodule** | `git submodule add <docs-repo> docs` |

---

## 트러블슈팅

### CORS 에러
```
1. Backend CorsConfig에서 Frontend Origin 허용 확인
2. allowCredentials(true) 설정
3. Frontend axios에 withCredentials: true
```

### API 연결 실패
```
1. Backend 서버 실행 확인 (localhost:8080)
2. .env의 VITE_API_BASE_URL 확인
3. 네트워크 탭에서 요청 URL 확인
```

---

## 모노레포 vs 분리형

| 항목 | 모노레포 | 분리형 |
|------|---------|--------|
| 저장소 | 1개 | 2개+ |
| 배포 | 동시/개별 | 완전 독립 |
| 팀 구조 | 풀스택 | 프론트/백 분리 |
| 코드 공유 | 쉬움 | 별도 패키지 |

**분리형 선택 시**: 팀 분리, 독립 배포 주기, 저장소 권한 분리 필요

---

> 모노레포가 필요하면 → [MONOREPO.md](./MONOREPO.md)

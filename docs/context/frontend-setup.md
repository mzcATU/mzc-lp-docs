# Frontend Setup Guide

> mzc-lp-frontend 저장소 설정 상세 가이드

---

## 언제 이 문서를 보는가?

| 궁금한 것 | 참조 섹션/문서 |
|----------|---------------|
| 프론트엔드 프로젝트 구조? | 섹션 디렉토리 구조 |
| .gitignore 설정? | 섹션 핵심 설정 파일 > .gitignore |
| 환경 변수 설정? | 섹션 핵심 설정 파일 > .env.example |
| Vite 설정? | 섹션 핵심 설정 파일 > vite.config.ts |
| Docker/Nginx 설정? | 섹션 Docker 설정 |
| CI/CD 파이프라인? | 섹션 CI/CD |
| 백엔드 설정? | [backend-setup.md](./backend-setup.md) |
| Repository 분리 전략? | [repository-strategy.md](./repository-strategy.md) |

---

## 디렉토리 구조

```
mzc-lp-frontend/
├── .github/workflows/           # CI/CD
├── src/
│   ├── api/                     # API 클라이언트
│   ├── components/              # 공통 컴포넌트
│   ├── features/                # 기능별 모듈
│   ├── hooks/                   # 공통 훅
│   ├── stores/                  # 상태 관리 (Zustand)
│   ├── types/                   # TypeScript 타입
│   └── utils/                   # 유틸리티
├── package.json
├── vite.config.ts
├── .gitignore
├── .env.example
└── README.md
```

---

## 핵심 설정 파일

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build
dist/
build/
.cache/

# Environment
.env
.env.local
.env.development.local
.env.production.local
!.env.example

# IDE
.idea/
.vscode/*
!.vscode/extensions.json

# Test
coverage/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo
```

### .env.example

```bash
# API
VITE_API_BASE_URL=http://localhost:8080/api

# App
VITE_APP_ENV=development
VITE_APP_NAME=MZC Learn

# Feature Flags (optional)
VITE_ENABLE_MOCK=false
```

### .env.development

```bash
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_ENV=development
VITE_APP_NAME=MZC Learn (Dev)
```

### .env.production

```bash
VITE_API_BASE_URL=https://api.mzanewlp.cloudclass.co.kr
VITE_APP_ENV=production
VITE_APP_NAME=MZC Learn
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Docker 설정

### .dockerignore

```dockerignore
node_modules/
dist/
.git/
.gitignore
*.md
coverage/
.env*
!.env.example
**/*.test.ts
**/*.spec.ts
```

### Dockerfile

```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost:80 || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional, if not using separate domain)
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## CI/CD

### .github/workflows/cd.yml

```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - run: npm ci && npm run build
      - run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
      - run: aws cloudfront create-invalidation --paths "/*"
```

---

## 체크리스트

- [ ] GitHub 저장소 생성
- [ ] Vite + React 19 + TypeScript 초기화
- [ ] `.gitignore`, `.env.example` 설정
- [ ] API 클라이언트 설정
- [ ] `.github/workflows/` CI/CD
- [ ] README.md

---

> 관련 문서: [POLY-REPO.md](../POLY-REPO.md), [11-REACT-PROJECT-STRUCTURE](../conventions/11-REACT-PROJECT-STRUCTURE.md)

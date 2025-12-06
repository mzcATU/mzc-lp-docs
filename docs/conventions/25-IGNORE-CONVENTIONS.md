# 25. Ignore 파일 컨벤션

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> 프로젝트에서 사용하는 모든 ignore 파일 설정 가이드

---

## 핵심 원칙

```
✅ 보안 민감 파일 → 반드시 ignore (.env, *.pem, *-secret.yml)
✅ 빌드 산출물 → ignore (build/, dist/)
✅ 의존성 디렉토리 → ignore (node_modules/, .gradle/)
✅ IDE/에디터 설정 → ignore (.idea/, .vscode/)
✅ 로그/캐시 파일 → ignore (*.log, .eslintcache)
```

---

## .gitignore

### Backend (Spring Boot)

```gitignore
# 빌드
build/
.gradle/
*.jar
!gradle/wrapper/gradle-wrapper.jar

# IDE
.idea/
*.iml

# 환경/보안
.env*
application-local.yml
application-prod.yml
*-secret.yml
*.pem
*.jks

# 기타
*.log
.DS_Store
```

### Frontend (React + Vite)

```gitignore
# 의존성/빌드
node_modules/
dist/

# 환경/보안
.env*

# IDE
.idea/
.vscode/*
!.vscode/extensions.json

# 테스트/캐시
coverage/
.eslintcache
*.tsbuildinfo

# 기타
*.log
.DS_Store
```

---

## .dockerignore

```dockerignore
# 공통
.git/
.gitignore
*.md
docs/
.env*
docker-compose*.yml
Dockerfile*
*.log

# Backend
build/
.gradle/
src/test/

# Frontend
node_modules/
dist/
coverage/
**/*.test.ts
**/*.spec.ts
```

---

## .eslintignore / .prettierignore

```
dist/
build/
coverage/
node_modules/
*.config.js
*.d.ts
```

---

## 환경변수 파일 전략

```
.env.example      # 커밋 O (템플릿)
.env              # 커밋 X (로컬)
.env.local        # 커밋 X (개인)
.env.development  # 커밋 X (개발)
.env.production   # 커밋 X (운영)
```

### .env.example (템플릿)

```bash
DB_HOST=
DB_PORT=3306
DB_PASSWORD=
JWT_SECRET=
VITE_API_BASE_URL=
```

---

## 보안 체크리스트

### 절대 커밋 금지

| 유형 | 예시 |
|------|------|
| API Keys | `OPENAI_API_KEY`, `STRIPE_SECRET_KEY` |
| DB 비밀번호 | `application-prod.yml` |
| AWS 자격증명 | `AWS_SECRET_ACCESS_KEY` |
| 인증서/키 | `*.pem`, `*.jks`, `id_rsa` |

### 실수로 커밋한 경우

```bash
# 1. 즉시 키 무효화 (최우선!)
# 2. Git 캐시에서 제거
git rm -r --cached <파일>
# 3. 커밋 & 푸시
git commit -m "chore: Remove sensitive file"
# 4. 새 키 발급
```

---

## 자주 하는 실수

### ❌ Bad

```bash
# node_modules 커밋됨
# .env 커밋됨
# build/ 커밋됨
```

### ✅ Good

```bash
# 이미 커밋된 파일 ignore 하기
echo "build/" >> .gitignore
git rm -r --cached build/
git commit -m "chore: Remove build/ from tracking"
```

---

## 관련 문서

- [02-GIT-CONVENTIONS](./02-GIT-CONVENTIONS.md)
- [18-DOCKER-CONVENTIONS](./18-DOCKER-CONVENTIONS.md)
- [21-SECURITY-CONVENTIONS](./21-SECURITY-CONVENTIONS.md)

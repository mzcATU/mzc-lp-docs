# Ignore 파일 컨벤션

> 프로젝트에서 사용하는 모든 ignore 파일 설정 가이드

---

## 핵심 원칙

```
✅ 보안 민감 파일 → 반드시 ignore
✅ 빌드 산출물 → ignore (재생성 가능)
✅ 의존성 디렉토리 → ignore (설치로 복원)
✅ IDE/에디터 설정 → ignore (개인 환경)
✅ 로그/캐시 파일 → ignore (임시 데이터)
```

---

## .gitignore

### Backend (Spring Boot)

```gitignore
# === 빌드 산출물 ===
build/
target/
out/
*.jar
*.war
!gradle/wrapper/gradle-wrapper.jar

# === Gradle ===
.gradle/
gradle.properties

# === IDE ===
.idea/
*.iml
*.iws
*.ipr
.project
.classpath
.settings/

# === 로그 ===
*.log
logs/

# === 환경 설정 (보안) ===
.env
.env.*
application-local.yml
application-local.yaml
application-prod.yml
application-prod.yaml
application-secret.yml

# === 인증서/키 ===
*.jks
*.p12
*.pem
*.key
!mza-newlp-key.pem  # 필요시 예외 (문서화된 경우만)

# === 테스트 ===
/coverage/
*.exec

# === 기타 ===
.DS_Store
Thumbs.db
*.swp
*.swo
*~
```

### Frontend (React + Vite)

```gitignore
# === 의존성 ===
node_modules/
.pnp/
.pnp.js

# === 빌드 산출물 ===
dist/
dist-ssr/
build/
*.local

# === 환경 설정 (보안) ===
.env
.env.local
.env.*.local

# === 로그 ===
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# === IDE ===
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json  # 팀 공유 설정은 커밋
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# === 테스트/커버리지 ===
coverage/
*.lcov

# === 캐시 ===
.eslintcache
.stylelintcache
*.tsbuildinfo

# === 기타 ===
.DS_Store
Thumbs.db
```

### Monorepo (통합)

```gitignore
# === Root ===
.env
.env.*
*.log

# === Backend ===
backend/build/
backend/.gradle/
backend/out/

# === Frontend ===
frontend/node_modules/
frontend/dist/

# === IDE ===
.idea/
.vscode/*
!.vscode/extensions.json
*.iml

# === 인증서/보안 ===
*.jks
*.pem
*.key
*-secret.yml

# === 기타 ===
.DS_Store
Thumbs.db
```

---

## .dockerignore

### Backend

```dockerignore
# === Git ===
.git/
.gitignore

# === 빌드 (컨테이너에서 새로 빌드) ===
build/
.gradle/
out/

# === IDE ===
.idea/
*.iml

# === 문서 (이미지에 불필요) ===
*.md
docs/
README*

# === 환경 설정 ===
.env*
docker-compose*.yml
Dockerfile*

# === 테스트 ===
src/test/

# === 로그 ===
*.log
logs/
```

### Frontend

```dockerignore
# === Git ===
.git/
.gitignore

# === 의존성 (컨테이너에서 새로 설치) ===
node_modules/

# === 빌드 산출물 ===
dist/
build/

# === 문서 ===
*.md
docs/
README*

# === 환경 설정 ===
.env*
docker-compose*.yml
Dockerfile*

# === 테스트 ===
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx
coverage/
__tests__/

# === IDE ===
.idea/
.vscode/

# === 기타 ===
.DS_Store
```

---

## .eslintignore

```
# === 빌드 산출물 ===
dist/
build/
coverage/

# === 의존성 ===
node_modules/

# === 설정 파일 ===
*.config.js
*.config.ts
vite.config.ts

# === 타입 정의 ===
*.d.ts

# === 기타 ===
public/
```

---

## .prettierignore

```
# === 빌드 산출물 ===
dist/
build/
coverage/

# === 의존성 ===
node_modules/
package-lock.json
pnpm-lock.yaml
yarn.lock

# === 자동 생성 파일 ===
*.min.js
*.min.css
*.generated.ts

# === 기타 ===
public/
*.md
```

---

## 환경별 .env 파일 전략

### 파일 구조

```
project/
├── .env.example      # 커밋 O (템플릿)
├── .env              # 커밋 X (로컬 기본값)
├── .env.local        # 커밋 X (개인 설정)
├── .env.development  # 커밋 X (개발 환경)
├── .env.production   # 커밋 X (운영 환경)
└── .env.test         # 커밋 X (테스트 환경)
```

### .env.example (템플릿 - 커밋 O)

```bash
# Database
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRATION=3600000

# AWS (선택)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-2

# API
VITE_API_BASE_URL=
```

### 우선순위 (Vite 기준)

```
1. .env.{mode}.local   # 최우선 (로컬 오버라이드)
2. .env.{mode}         # 환경별 설정
3. .env.local          # 로컬 공통
4. .env                # 기본값
```

---

## IDE 설정 공유 전략

### .vscode/ (선택적 커밋)

```gitignore
# .gitignore
.vscode/*
!.vscode/extensions.json    # 추천 확장 프로그램
!.vscode/settings.json      # 팀 공통 설정 (선택)
!.vscode/launch.json        # 디버그 설정 (선택)
```

### extensions.json (커밋 O)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "vscjava.vscode-java-pack"
  ]
}
```

### .idea/ (IntelliJ)

```gitignore
# 전체 ignore 권장
.idea/

# 또는 선택적 커밋
.idea/*
!.idea/codeStyles/         # 코드 스타일 (선택)
!.idea/inspectionProfiles/ # 검사 프로필 (선택)
```

---

## 보안 체크리스트

### 절대 커밋 금지

| 항목 | 예시 |
|------|------|
| API Keys | `OPENAI_API_KEY`, `STRIPE_SECRET_KEY` |
| DB 비밀번호 | `application-prod.yml` |
| AWS 자격증명 | `AWS_SECRET_ACCESS_KEY` |
| JWT Secret | `JWT_SECRET` |
| OAuth Secret | `GOOGLE_CLIENT_SECRET` |
| SSH 키 | `*.pem`, `id_rsa` |
| 인증서 | `*.jks`, `*.p12` |

### 실수로 커밋한 경우

```bash
# 1. 즉시 키 무효화 (가장 중요!)

# 2. 히스토리에서 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch PATH/TO/SECRET" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 강제 푸시
git push origin --force --all

# 4. 팀 공지 및 새 키 발급
```

---

## 자주 하는 실수

| 실수 | 해결 |
|------|------|
| `node_modules/` 커밋 | `.gitignore`에 추가 후 `git rm -r --cached node_modules/` |
| `.env` 커밋 | 키 무효화 → 새 키 발급 → `.gitignore` 추가 |
| `build/` 커밋 | `.gitignore`에 추가 후 `git rm -r --cached build/` |
| IDE 설정 충돌 | `.gitignore`에 IDE 폴더 추가 |

### 이미 커밋된 파일 ignore 하기

```bash
# 1. .gitignore에 추가
echo "build/" >> .gitignore

# 2. Git 캐시에서 제거 (파일은 유지)
git rm -r --cached build/

# 3. 커밋
git commit -m "chore: Remove build/ from tracking"
```

---

## 관련 문서

- [02-GIT-CONVENTIONS](./02-GIT-CONVENTIONS.md) - Git 컨벤션
- [18-DOCKER-CONVENTIONS](./18-DOCKER-CONVENTIONS.md) - Docker 컨벤션
- [21-SECURITY-CONVENTIONS](./21-SECURITY-CONVENTIONS.md) - 보안 컨벤션

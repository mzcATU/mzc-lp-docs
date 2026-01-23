# CI/CD 파이프라인

> 작성일: 2026-01-22
> **✅ 구현 상태**: GitHub Actions 워크플로우가 구현되어 있습니다.
>
> - Backend: `.github/workflows/ci.yml`, `.github/workflows/cd.yml`
> - Frontend: `.github/workflows/ci.yml`

## 개요

MZC-LP 프로젝트는 **GitHub Actions**를 사용하여 CI/CD 파이프라인을 구성합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PR / Push to main, develop                                     │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Build     │───►│    Test     │───►│ Code Quality│          │
│  │  (Gradle)   │    │  (JUnit)    │    │ (SonarQube) │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                            │                                     │
│                            ▼                                     │
│                     ┌─────────────┐                              │
│                     │  Coverage   │                              │
│                     │  (JaCoCo)   │                              │
│                     └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         CD Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to main / Tag (v*)                                        │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐    ┌─────────────┐                              │
│  │ Build JAR   │───►│  Artifact   │                              │
│  │  (Gradle)   │    │   Upload    │                              │
│  └─────────────┘    └──────┬──────┘                              │
│                            │                                     │
│        ┌───────────────────┼───────────────────┐                 │
│        │                   │                   │                 │
│        ▼                   ▼                   ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │    Dev      │    │   Staging   │    │ Production  │          │
│  │  (자동)     │    │  (수동)     │    │ (Tag 시)    │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 워크플로우 파일

### CI (ci.yml)

```yaml
경로: .github/workflows/ci.yml
```

| 트리거 | 설명 |
|--------|------|
| `push` | main, develop 브랜치 푸시 |
| `pull_request` | main, develop 브랜치 대상 PR |

**Jobs:**

| Job | 설명 | 의존성 |
|-----|------|--------|
| `build` | Gradle 빌드 및 테스트 | - |
| `code-quality` | SonarQube 분석 | build |

### CD (cd.yml)

```yaml
경로: .github/workflows/cd.yml
```

| 트리거 | 설명 |
|--------|------|
| `push` (main) | main 브랜치 푸시 → Dev 자동 배포 |
| `push` (tags/v*) | 버전 태그 푸시 → Production 배포 |
| `workflow_dispatch` | 수동 실행 (환경 선택) |

**Jobs:**

| Job | 설명 | 조건 |
|-----|------|------|
| `build` | JAR 빌드 및 Artifact 업로드 | 항상 |
| `deploy-dev` | Dev 환경 배포 | main 브랜치 또는 수동(dev) |
| `deploy-staging` | Staging 환경 배포 | 수동(staging) |
| `deploy-prod` | Production 환경 배포 | 태그 또는 수동(prod) |

---

## GitHub Secrets 설정

### 필수 Secrets

| Secret 이름 | 설명 | 필수 |
|-------------|------|------|
| `JWT_SECRET` | JWT 서명 키 (256비트 이상) | ✅ |
| `SONAR_TOKEN` | SonarQube 인증 토큰 | ⚠️ (코드 분석 시) |
| `SONAR_HOST_URL` | SonarQube 서버 URL | ⚠️ (코드 분석 시) |

### 배포용 Secrets (환경별)

| Secret 이름 | 설명 |
|-------------|------|
| `DEV_SERVER` | Dev 서버 SSH 주소 |
| `STAGING_SERVER` | Staging 서버 SSH 주소 |
| `PROD_SERVER` | Production 서버 SSH 주소 |
| `SSH_PRIVATE_KEY` | SSH 인증 키 |

### Secrets 등록 방법

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

---

## 배포 전략

### 환경별 배포 흐름

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│   feature/* ──► PR ──► develop ──► PR ──► main ──► Tag (v*)   │
│                           │                 │           │       │
│                           ▼                 ▼           ▼       │
│                        (없음)              Dev      Production  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

| 환경 | 트리거 | 승인 필요 |
|------|--------|-----------|
| Dev | main 푸시 | ❌ 자동 |
| Staging | workflow_dispatch | ⚠️ 선택적 |
| Production | 태그 (v*) | ✅ 권장 |

### 버전 태깅 규칙

```bash
# 릴리즈 버전
git tag v1.0.0
git push origin v1.0.0

# 프리릴리즈
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

---

## JAR Artifact

### Artifact 저장

GitHub Actions에서 빌드된 JAR 파일은 **GitHub Artifact**로 저장됩니다.

```
Artifact 이름: mzc-lp-backend-jar
보관 기간: 30일
```

### Artifact 네이밍 규칙

| 상황 | 파일명 예시 |
|------|-------------|
| main 브랜치 | `mzc-lp-backend-20241224-abc1234.jar` |
| 태그 (v1.0.0) | `mzc-lp-backend-1.0.0.jar` |

### GitHub Release

태그 푸시 시 자동으로 GitHub Release가 생성되고, JAR 파일이 첨부됩니다.

---

## 수동 배포 실행

### GitHub UI에서 실행

```
Repository → Actions → Backend CD → Run workflow → 환경 선택 → Run
```

### GitHub CLI로 실행

```bash
# Dev 배포
gh workflow run cd.yml -f environment=dev

# Staging 배포
gh workflow run cd.yml -f environment=staging

# Production 배포 (태그 권장)
git tag v1.0.0 && git push origin v1.0.0
```

---

## 로컬 테스트

### CI 시뮬레이션

```bash
# 빌드
./gradlew build -x test

# 테스트
./gradlew test

# 커버리지 리포트
./gradlew test jacocoTestReport

# JAR 생성
./gradlew bootJar

# SonarQube (로컬 서버 필요)
./gradlew sonar -Dsonar.host.url=http://localhost:9000 -Dsonar.token=xxx
```

### JAR 실행 테스트

```bash
# JAR 빌드
./gradlew bootJar

# JAR 실행
java -jar build/libs/lp-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=dev \
  --jwt.secret=your-secret-key
```

---

## 배포 방법 (서버 설정 필요)

### 방법 1: SCP + SSH (간단)

```bash
# cd.yml의 deploy step에 추가
- name: Setup SSH
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    ssh-keyscan ${{ secrets.DEV_SERVER }} >> ~/.ssh/known_hosts

- name: Deploy
  run: |
    scp ${{ needs.build.outputs.artifact-name }} ${{ secrets.DEV_USER }}@${{ secrets.DEV_SERVER }}:/app/
    ssh ${{ secrets.DEV_USER }}@${{ secrets.DEV_SERVER }} "sudo systemctl restart mzc-lp-backend"
```

### 방법 2: AWS CodeDeploy

```bash
# cd.yml의 deploy step에 추가
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ap-northeast-2

- name: Deploy to CodeDeploy
  run: |
    aws deploy create-deployment \
      --application-name mzc-lp \
      --deployment-group-name dev \
      --s3-location bucket=mzc-lp-deploy,key=${{ needs.build.outputs.artifact-name }},bundleType=zip
```

### 방법 3: systemd 서비스 (서버 설정)

```ini
# /etc/systemd/system/mzc-lp-backend.service
[Unit]
Description=MZC LP Backend
After=network.target

[Service]
User=mzc
WorkingDirectory=/app
ExecStart=/usr/bin/java -jar /app/mzc-lp-backend.jar --spring.profiles.active=prod
SuccessExitStatus=143
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 트러블슈팅

### 빌드 실패

| 문제 | 해결 방법 |
|------|-----------|
| Gradle 캐시 문제 | Actions에서 "Re-run all jobs" 선택 |
| 테스트 실패 | 로컬에서 `./gradlew test` 확인 |
| OOM | `_JAVA_OPTIONS`에서 메모리 조정 |

### 배포 실패

| 문제 | 해결 방법 |
|------|-----------|
| SSH 연결 실패 | Secrets의 SSH 키 확인 |
| 권한 오류 | 서버의 사용자 권한 확인 |
| JAR 실행 실패 | Java 버전 확인 (JDK 21 필요) |

---

## 향후 계획

- [ ] Frontend CI/CD 추가 (React/Vite)
- [ ] E2E 테스트 통합 (Playwright)
- [ ] Docker 지원 추가 (선택적)
- [ ] Slack/Discord 알림 연동
- [ ] 성능 테스트 단계 추가 (k6)

---

## 관련 파일

| 파일 | 위치 |
|------|------|
| CI 워크플로우 | `.github/workflows/ci.yml` |
| CD 워크플로우 | `.github/workflows/cd.yml` |
| build.gradle | `build.gradle` |

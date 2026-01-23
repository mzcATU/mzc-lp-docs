# 배포 가이드 (Deployment Guide)

> 작성일: 2026-01-22
> MZC Learning Platform 배포 절차

---

## 📋 개요

### 배포 환경
| 환경 | 용도 | 자동/수동 |
|------|------|-----------|
| **Local** | 로컬 개발 | 수동 |
| **Dev** | 개발 환경 | 자동 (main 푸시) |
| **Staging** | 스테이징/QA | 수동 |
| **Production** | 프로덕션 | 자동 (태그 푸시) |

### 배포 방식
- **CI/CD**: GitHub Actions
- **Backend**: JAR 파일 → 서버 배포
- **Frontend**: Static Files → S3 + CloudFront

---

## 🚀 Backend 배포

### 1. 로컬 빌드 및 실행

```bash
# 1. 레포지토리 클론
cd mzc-lp-backend
git pull origin main

# 2. 빌드
./gradlew clean build -x test

# 3. JAR 실행
java -jar build/libs/lp-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=local \
  --jwt.secret=your-local-secret-key

# 4. 헬스 체크
curl http://localhost:8080/actuator/health
```

---

### 2. Dev 환경 배포 (자동)

**트리거:** `main` 브랜치에 푸시

```bash
# 1. 기능 브랜치에서 작업
git checkout -b feat/123-new-feature
git commit -m "[Feat] 새로운 기능 추가 (#123)"
git push origin feat/123-new-feature

# 2. PR 생성 및 머지
gh pr create --base main --title "새로운 기능 추가"
# PR 승인 및 머지

# 3. main 브랜치로 자동 배포
# GitHub Actions가 자동으로 Dev 환경에 배포
```

**GitHub Actions 워크플로우:**
1. JAR 빌드
2. S3에 Artifact 업로드
3. EC2/ECS로 배포
4. 배포 완료 알림 (Slack/Discord)

---

### 3. Production 배포 (수동/태그)

**트리거:** `v*` 태그 푸시

```bash
# 1. main 브랜치에서 태그 생성
git checkout main
git pull origin main

# 2. 버전 태그 생성
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actions가 자동으로 Production 배포
# - JAR 빌드
# - GitHub Release 생성
# - Production 서버에 배포
```

**수동 배포 (긴급):**
```bash
# GitHub Actions UI에서 수동 실행
# Repository → Actions → Backend CD → Run workflow
# Environment: production 선택
```

---

### 4. 서버 설정 (초기 1회)

#### 4.1 Java 설치
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-21-jdk -y

# 확인
java -version
```

#### 4.2 애플리케이션 디렉토리
```bash
# 디렉토리 생성
sudo mkdir -p /app/mzc-lp
sudo chown $USER:$USER /app/mzc-lp
cd /app/mzc-lp
```

#### 4.3 환경 변수 파일
```bash
# /app/mzc-lp/.env
vi /app/mzc-lp/.env
```

```bash
# .env 파일 내용
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=your-production-jwt-secret-key-min-256-bits
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_NAME=mzclp
DB_USERNAME=admin
DB_PASSWORD=your-db-password
```

#### 4.4 systemd 서비스 등록
```bash
sudo vi /etc/systemd/system/mzc-lp.service
```

```ini
[Unit]
Description=MZC Learning Platform Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/app/mzc-lp
EnvironmentFile=/app/mzc-lp/.env
ExecStart=/usr/bin/java -jar /app/mzc-lp/lp.jar \
  --spring.profiles.active=${SPRING_PROFILES_ACTIVE} \
  --jwt.secret=${JWT_SECRET}
SuccessExitStatus=143
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable mzc-lp.service
sudo systemctl start mzc-lp.service

# 상태 확인
sudo systemctl status mzc-lp.service

# 로그 확인
sudo journalctl -u mzc-lp.service -f
```

---

### 5. 배포 스크립트

#### deploy.sh (서버에서 실행)
```bash
#!/bin/bash

APP_NAME="lp"
APP_DIR="/app/mzc-lp"
JAR_NAME="lp-0.0.1-SNAPSHOT.jar"
BACKUP_DIR="/app/mzc-lp/backups"

echo "=== MZC LP Backend 배포 시작 ==="

# 1. 백업
echo "1. 현재 JAR 백업..."
if [ -f "$APP_DIR/$JAR_NAME" ]; then
  BACKUP_FILE="$BACKUP_DIR/$JAR_NAME.$(date +%Y%m%d_%H%M%S)"
  cp "$APP_DIR/$JAR_NAME" "$BACKUP_FILE"
  echo "백업 완료: $BACKUP_FILE"
fi

# 2. 새 JAR 다운로드 (from S3 or Artifact URL)
echo "2. 새 JAR 다운로드..."
aws s3 cp s3://mzc-lp-artifacts/latest/$JAR_NAME $APP_DIR/$JAR_NAME

# 3. 서비스 재시작
echo "3. 서비스 재시작..."
sudo systemctl restart mzc-lp.service

# 4. 헬스 체크
echo "4. 헬스 체크..."
sleep 10
for i in {1..30}; do
  if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✓ 서비스 정상 작동"
    exit 0
  fi
  echo "대기 중... ($i/30)"
  sleep 2
done

# 5. 배포 실패 - 롤백
echo "✗ 헬스 체크 실패 - 롤백 시작"
if [ -f "$BACKUP_FILE" ]; then
  cp "$BACKUP_FILE" "$APP_DIR/$JAR_NAME"
  sudo systemctl restart mzc-lp.service
  echo "롤백 완료"
fi
exit 1
```

---

## 🌐 Frontend 배포

### 1. 로컬 빌드

```bash
cd mzc-lp-frontend

# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.production
vi .env.production
```

```bash
# .env.production
VITE_API_BASE_URL=https://api.mzc-learning.com
VITE_CDN_URL=https://cdn.mzc-learning.com
```

```bash
# 3. 빌드
npm run build

# 4. dist 폴더 확인
ls -la dist/
```

---

### 2. S3 + CloudFront 배포

#### 초기 설정 (1회)
```bash
# S3 버킷 생성
aws s3 mb s3://mzc-lp-frontend-prod

# 정적 웹사이트 호스팅 활성화
aws s3 website s3://mzc-lp-frontend-prod \
  --index-document index.html \
  --error-document index.html

# CloudFront 배포 생성 (AWS Console에서 권장)
# - Origin: S3 버킷
# - SSL 인증서: ACM
# - Custom Domain: app.mzc-learning.com
```

#### 배포 스크립트
```bash
#!/bin/bash

BUCKET="mzc-lp-frontend-prod"
DISTRIBUTION_ID="E1234567890ABC"

echo "=== Frontend 배포 시작 ==="

# 1. 빌드
npm run build

# 2. S3 업로드
aws s3 sync dist/ s3://$BUCKET \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# index.html은 캐시 안 함
aws s3 cp dist/index.html s3://$BUCKET/index.html \
  --cache-control "no-cache"

# 3. CloudFront 캐시 무효화
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "✓ 배포 완료"
```

---

## 🗄️ 데이터베이스 마이그레이션

### 1. Flyway 사용

```bash
# build.gradle에 이미 설정됨
# 애플리케이션 시작 시 자동으로 마이그레이션 실행
```

### 2. 마이그레이션 파일 추가

```bash
# 새 마이그레이션 파일 생성
cd mzc-lp-backend/src/main/resources/db/migration
touch V002__add_new_table.sql
```

```sql
-- V002__add_new_table.sql
CREATE TABLE new_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3. 수동 마이그레이션 (프로덕션)

```bash
# 1. 백업
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS mzclp > backup_$(date +%Y%m%d).sql

# 2. 마이그레이션 실행
./gradlew flywayMigrate -Dflyway.url=jdbc:mysql://$DB_HOST:3306/mzclp

# 3. 확인
./gradlew flywayInfo
```

---

## 🔒 환경 변수 관리

### Local
```bash
# mzc-lp-backend/src/main/resources/application-local.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mzclp
    username: root
    password: password

jwt:
  secret: local-dev-secret-key-min-256-bits
```

### Dev/Staging/Prod
```bash
# GitHub Secrets로 관리
# Repository → Settings → Secrets → Actions

# 필수 Secrets:
JWT_SECRET=xxx
DB_HOST=xxx
DB_USERNAME=xxx
DB_PASSWORD=xxx
```

---

## 📊 배포 후 체크리스트

### Backend 배포 후
- [ ] 헬스 체크: `GET /actuator/health`
- [ ] API 테스트: `GET /api/courses`
- [ ] 로그 확인: `sudo journalctl -u mzc-lp.service -n 100`
- [ ] DB 연결 확인: 쿼리 실행 테스트
- [ ] 메모리/CPU 사용률 확인

### Frontend 배포 후
- [ ] 페이지 로드 확인: https://app.mzc-learning.com
- [ ] API 통신 확인: 네트워크 탭
- [ ] 캐시 무효화 확인: Ctrl+Shift+R
- [ ] 모바일 반응형 확인

### Database 마이그레이션 후
- [ ] 마이그레이션 상태 확인: `SELECT * FROM flyway_schema_history`
- [ ] 새 테이블/컬럼 확인
- [ ] 인덱스 생성 확인

---

## 🔄 롤백 절차

### Backend 롤백
```bash
# 1. 백업된 JAR로 복구
BACKUP_FILE="/app/mzc-lp/backups/lp.jar.20260122_140000"
cp $BACKUP_FILE /app/mzc-lp/lp.jar

# 2. 서비스 재시작
sudo systemctl restart mzc-lp.service

# 3. 확인
curl http://localhost:8080/actuator/health
```

### Frontend 롤백
```bash
# CloudFront 배포 히스토리에서 이전 버전으로 롤백
# 또는 Git에서 이전 버전 재배포
git checkout v1.0.0
npm run build
npm run deploy
```

### Database 롤백
```bash
# 1. 백업 복원
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS mzclp < backup_20260122.sql

# 2. Flyway 롤백 (지원 안 함, 수동 스크립트 필요)
# 수동으로 ALTER TABLE / DROP TABLE 실행
```

---

## 🚨 트러블슈팅

### 배포 실패 시
1. GitHub Actions 로그 확인
2. 서버 로그 확인: `sudo journalctl -u mzc-lp.service -f`
3. 네트워크 확인: 방화벽, Security Group
4. 환경 변수 확인: `.env` 파일, Secrets

### 502 Bad Gateway
- Backend 서비스 상태 확인
- Nginx/ALB 설정 확인
- 타임아웃 설정 확인

### DB 연결 실패
- RDS 접근 권한 확인
- Security Group 설정 확인
- DB 자격 증명 확인

---

## 📞 배포 담당자

| 역할 | 담당자 | 연락처 |
|------|--------|--------|
| DevOps | - | - |
| Backend | - | - |
| Frontend | - | - |
| DBA | - | - |

---

**최종 업데이트**: 2026-01-22
**버전**: 1.0.0

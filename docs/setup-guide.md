# MZC Learning Platform 개발 환경 설정 가이드

> 작성일: 2026-01-22
> 로컬 개발 환경 설정 및 실행 가이드

---

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [프로젝트 클론](#프로젝트-클론)
3. [백엔드 설정](#백엔드-설정)
4. [프론트엔드 설정](#프론트엔드-설정)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [실행](#실행)
7. [테스트 계정](#테스트-계정)
8. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필수 소프트웨어
| 소프트웨어 | 버전 | 용도 |
|-----------|------|------|
| **Java** | 21+ | 백엔드 |
| **Node.js** | 20+ | 프론트엔드 |
| **MySQL** | 8.0+ | 데이터베이스 |
| **Git** | 최신 | 버전 관리 |

### 권장 도구
- **IDE**: IntelliJ IDEA (백엔드), VSCode (프론트엔드)
- **API 테스트**: Postman, Swagger UI
- **DB 클라이언트**: DBeaver, MySQL Workbench

---

## 프로젝트 클론

```bash
# 메인 레포지토리 클론
git clone https://github.com/mzcATU/mzc-lp.git
cd mzc-lp

# 서브모듈 초기화
git submodule update --init --recursive
```

**프로젝트 구조:**
```
mzc-lp/
├── mzc-lp-backend/      # Spring Boot 백엔드
├── mzc-lp-frontend/     # React 프론트엔드
└── mzc-lp-docs/         # 프로젝트 문서
```

---

## 백엔드 설정

### 1. MySQL 데이터베이스 생성

```sql
CREATE DATABASE mzc_lp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mzc_user'@'localhost' IDENTIFIED BY 'mzc_password';
GRANT ALL PRIVILEGES ON mzc_lp.* TO 'mzc_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 환경 설정 파일 생성

`mzc-lp-backend/src/main/resources/application-local.yml` 생성:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mzc_lp?useUnicode=true&characterEncoding=utf8mb4&serverTimezone=Asia/Seoul
    username: mzc_user
    password: mzc_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: create  # 최초 실행 시만 create, 이후 validate
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect

  sql:
    init:
      mode: always  # 시드 데이터 로드

logging:
  level:
    com.mzc.lp: DEBUG
    org.hibernate.SQL: DEBUG

jwt:
  secret: your-secret-key-here-at-least-256-bits-long-for-hs256-algorithm
  access-token-expiration: 3600000   # 1시간 (ms)
  refresh-token-expiration: 604800000  # 7일 (ms)

cors:
  allowed-origins: http://localhost:5173

file:
  upload-dir: ./uploads
```

### 3. 빌드 및 실행

```bash
cd mzc-lp-backend

# Gradle 빌드
./gradlew clean build

# 실행 (local 프로파일)
./gradlew bootRun --args='--spring.profiles.active=local'
```

**실행 확인:**
- 백엔드: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html

---

## 프론트엔드 설정

### 1. 의존성 설치

```bash
cd mzc-lp-frontend
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# API 엔드포인트
VITE_API_BASE_URL=http://localhost:8080

# 기타 설정
VITE_APP_NAME=MZC Learning Platform
```

### 3. 실행

```bash
npm run dev
```

**실행 확인:**
- 프론트엔드: http://localhost:5173

---

## 데이터베이스 설정

### 시드 데이터 자동 로드

백엔드 실행 시 자동으로 시드 데이터가 로드됩니다:

1. **데이터 소스**: `src/main/resources/db/seed/` 디렉토리
2. **로딩 순서**:
   ```
   V001__truncate_tables.sql
   V002__tenants.sql
   V003__departments.sql
   V004__users.sql
   V004_5__employees.sql
   V005__user_roles.sql
   V006__categories.sql
   V007__contents.sql
   V008__courses.sql
   V009__snapshots.sql
   V010__course_times.sql
   V011__enrollments.sql
   V012__instructor_assignments.sql
   V013__user_course_roles.sql
   V014__community.sql
   V015__cart_wishlist.sql
   V016__reviews.sql
   V017__roadmaps.sql
   V018__member_pools_and_auto_enrollment_rules.sql
   ```

### 수동 초기화

```bash
# MySQL 접속
mysql -u mzc_user -p mzc_lp

# 테이블 초기화
source src/main/resources/db/seed/V001__truncate_tables.sql;

# 데이터 순차 로드
source src/main/resources/db/seed/V002__tenants.sql;
# ... (나머지 파일들)
```

---

## 실행

### 전체 실행 순서

1. **MySQL 실행**
   ```bash
   # Windows
   net start MySQL80

   # macOS/Linux
   sudo systemctl start mysql
   ```

2. **백엔드 실행**
   ```bash
   cd mzc-lp-backend
   ./gradlew bootRun --args='--spring.profiles.active=local'
   ```

3. **프론트엔드 실행**
   ```bash
   cd mzc-lp-frontend
   npm run dev
   ```

4. **접속**
   - 프론트엔드: http://localhost:5173
   - Swagger: http://localhost:8080/swagger-ui/index.html

---

## 테스트 계정

### 시스템 관리자 (SYSTEM_ADMIN)
```
이메일: sysadmin@mzc.com
비밀번호: password123
```

### 테넌트 관리자 (TENANT_ADMIN)
```
Company A (subdomain: company-a)
이메일: admin@company-a.com
비밀번호: password123

Company B (subdomain: company-b)
이메일: admin@company-b.com
비밀번호: password123

Company C (subdomain: company-c)
이메일: admin@company-c.com
비밀번호: password123
```

### 운영자 (OPERATOR)
```
Company A
이메일: operator1@company-a.com
비밀번호: password123
```

### 설계자 (DESIGNER)
```
Company A
이메일: designer1@company-a.com
비밀번호: password123
```

### 다중 역할 사용자
```
Company A (TENANT_ADMIN + OPERATOR + DESIGNER)
이메일: multirole1@company-a.com
비밀번호: password123
```

### 일반 사용자 (USER)
```
Company A
이메일: user1@company-a.com
비밀번호: password123
```

---

## 문제 해결

### 백엔드 문제

#### 1. 데이터베이스 연결 실패
```
Error: Communications link failure
```
**해결:**
- MySQL 서버가 실행 중인지 확인
- `application-local.yml`의 DB 접속 정보 확인
- 방화벽 설정 확인

#### 2. 시드 데이터 로드 실패
```
Error: Duplicate entry for key 'PRIMARY'
```
**해결:**
```sql
-- 데이터베이스 초기화
DROP DATABASE mzc_lp;
CREATE DATABASE mzc_lp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3. 포트 충돌 (8080)
```
Error: Port 8080 is already in use
```
**해결:**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :8080
kill -9 <PID>
```

### 프론트엔드 문제

#### 1. API 연결 실패
```
Error: Network Error
```
**해결:**
- 백엔드가 실행 중인지 확인
- `.env.local`의 `VITE_API_BASE_URL` 확인
- CORS 설정 확인

#### 2. 의존성 설치 실패
```
Error: ERESOLVE unable to resolve dependency tree
```
**해결:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 또는 강제 설치
npm install --legacy-peer-deps
```

#### 3. 포트 충돌 (5173)
```
Error: Port 5173 is already in use
```
**해결:**
- `vite.config.ts`에서 포트 변경
```typescript
export default defineConfig({
  server: {
    port: 3000,  // 다른 포트로 변경
  },
});
```

---

## 다음 단계

- [아키텍처 문서](./architecture.md)
- [모듈 구조 문서](./module-structure.md)
- [API 명세서](./api-specification.md)

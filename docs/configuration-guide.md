# 환경 설정 가이드 (Configuration Guide)

> 작성일: 2026-01-22
> 애플리케이션 설정 및 환경별 구성

---

## 📋 개요

MZC Learning Platform의 환경별 설정 관리 방법과 주요 설정 항목을 설명합니다.

### 환경 구분
| 환경 | Profile | 용도 |
|------|---------|------|
| **Local** | `local` | 로컬 개발 |
| **Dev** | `dev` | 개발 환경 (자동 배포) |
| **Staging** | `staging` | QA/스테이징 |
| **Production** | `prod` | 프로덕션 |

---

## 🔧 Backend 설정 (Spring Boot)

### 1. application.yml (공통 설정)

```yaml
# mzc-lp-backend/src/main/resources/application.yml
spring:
  application:
    name: mzc-lp

  # JPA 설정
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate  # Flyway 사용으로 validate만
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
        use_sql_comments: true
        default_batch_fetch_size: 100

  # Flyway 마이그레이션
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    encoding: UTF-8

  # 파일 업로드
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

# JWT 설정
jwt:
  header: Authorization
  prefix: "Bearer "
  access-token-expiration: 3600000    # 1시간 (밀리초)
  refresh-token-expiration: 604800000 # 7일 (밀리초)

# 서버 설정
server:
  port: 8080
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized

# 로깅
logging:
  level:
    root: INFO
    com.mzc.lp: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

---

### 2. application-local.yml (로컬 개발)

```yaml
# mzc-lp-backend/src/main/resources/application-local.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mzclp?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Seoul
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

  jpa:
    properties:
      hibernate:
        show_sql: true
        format_sql: true

  # H2 Console (선택적)
  h2:
    console:
      enabled: false

# JWT Secret (로컬 전용 - 보안 요구사항 낮음)
jwt:
  secret: local-dev-secret-key-for-jwt-tokens-min-256-bits-required-for-hs256-algorithm

# CORS 설정
cors:
  allowed-origins:
    - http://localhost:5173
    - http://localhost:3000

# S3 설정 (로컬 테스트용)
cloud:
  aws:
    s3:
      bucket: mzc-lp-dev
    region:
      static: ap-northeast-2
    credentials:
      access-key: ${AWS_ACCESS_KEY:your-access-key}
      secret-key: ${AWS_SECRET_KEY:your-secret-key}

# 로깅 레벨 (상세)
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    org.springframework.web: DEBUG
```

---

### 3. application-dev.yml (개발 환경)

```yaml
# mzc-lp-backend/src/main/resources/application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:dev-db.mzc-learning.com}:${DB_PORT:3306}/${DB_NAME:mzclp}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    properties:
      hibernate:
        show_sql: false  # 프로덕션에서는 false

# JWT Secret (환경 변수로 주입)
jwt:
  secret: ${JWT_SECRET}

# CORS 설정
cors:
  allowed-origins:
    - https://dev.mzc-learning.com
    - http://localhost:5173

# S3 설정
cloud:
  aws:
    s3:
      bucket: mzc-lp-dev
    region:
      static: ap-northeast-2
    credentials:
      access-key: ${AWS_ACCESS_KEY}
      secret-key: ${AWS_SECRET_KEY}

# 로깅
logging:
  level:
    root: INFO
    com.mzc.lp: DEBUG
  file:
    name: /var/log/mzc-lp/application.log
    max-size: 10MB
    max-history: 30
```

---

### 4. application-prod.yml (프로덕션)

```yaml
# mzc-lp-backend/src/main/resources/application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?useSSL=true&requireSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 50
      minimum-idle: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000

  jpa:
    properties:
      hibernate:
        show_sql: false
        generate_statistics: false

# JWT Secret (환경 변수로 주입 - 필수)
jwt:
  secret: ${JWT_SECRET}

# CORS 설정 (프로덕션 도메인만)
cors:
  allowed-origins:
    - https://mzc-learning.com
    - https://app.mzc-learning.com

# S3 설정
cloud:
  aws:
    s3:
      bucket: mzc-lp-prod
    region:
      static: ap-northeast-2
    credentials:
      access-key: ${AWS_ACCESS_KEY}
      secret-key: ${AWS_SECRET_KEY}

# 로깅 (최소화)
logging:
  level:
    root: WARN
    com.mzc.lp: INFO
  file:
    name: /var/log/mzc-lp/application.log
    max-size: 50MB
    max-history: 90

# Actuator (보안 강화)
management:
  endpoints:
    web:
      exposure:
        include: health,metrics
  endpoint:
    health:
      show-details: never
```

---

## 🌐 Frontend 설정 (Vite)

### 1. .env.example (템플릿)

```bash
# mzc-lp-frontend/.env.example
# API 설정
VITE_API_BASE_URL=http://localhost:8080

# CDN 설정
VITE_CDN_URL=https://cdn.mzc-learning.com

# 기능 플래그
VITE_FEATURE_ANALYTICS=false
VITE_FEATURE_NOTIFICATIONS=true

# 외부 서비스
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=
```

---

### 2. .env.local (로컬 개발)

```bash
# mzc-lp-frontend/.env.local
VITE_API_BASE_URL=http://localhost:8080
VITE_CDN_URL=http://localhost:8080/static

VITE_FEATURE_ANALYTICS=false
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_DEBUG=true

# 개발자 도구
VITE_REACT_DEVTOOLS=true
```

---

### 3. .env.development (Dev 환경)

```bash
# mzc-lp-frontend/.env.development
VITE_API_BASE_URL=https://api-dev.mzc-learning.com
VITE_CDN_URL=https://cdn-dev.mzc-learning.com

VITE_FEATURE_ANALYTICS=false
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_DEBUG=true

VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXX-1
```

---

### 4. .env.production (Production)

```bash
# mzc-lp-frontend/.env.production
VITE_API_BASE_URL=https://api.mzc-learning.com
VITE_CDN_URL=https://cdn.mzc-learning.com

VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_NOTIFICATIONS=true
VITE_FEATURE_DEBUG=false

VITE_GOOGLE_ANALYTICS_ID=UA-XXXXXXXX-2
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

### 5. vite.config.ts

```typescript
// mzc-lp-frontend/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // 경로 별칭
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },

    // 개발 서버
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },

    // 빌드 설정
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'query-vendor': ['@tanstack/react-query'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    // 환경 변수 타입
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
  };
});
```

---

## 🔐 환경 변수 관리

### 1. 로컬 개발

```bash
# Backend - application-local.yml 사용
./gradlew bootRun --args='--spring.profiles.active=local'

# Frontend - .env.local 사용
npm run dev
```

---

### 2. 서버 배포 (.env 파일)

```bash
# /app/mzc-lp/.env
SPRING_PROFILES_ACTIVE=prod
JWT_SECRET=your-production-jwt-secret-key-min-256-bits-required
DB_HOST=prod-rds.ap-northeast-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=mzclp
DB_USERNAME=admin
DB_PASSWORD=your-secure-db-password
AWS_ACCESS_KEY=AKIA...
AWS_SECRET_KEY=your-secret-key
```

**주의사항:**
- `.env` 파일은 절대 Git에 커밋하지 말 것
- `.gitignore`에 `.env` 추가 확인
- 파일 권한 설정: `chmod 600 .env`

---

### 3. GitHub Secrets (CI/CD)

```yaml
# .github/workflows/deploy.yml에서 사용
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DB_HOST: ${{ secrets.DB_HOST }}
  DB_USERNAME: ${{ secrets.DB_USERNAME }}
  DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**GitHub Secrets 등록:**
1. Repository → Settings → Secrets → Actions
2. New repository secret 클릭
3. 각 환경 변수 추가

---

## 🚩 기능 플래그 (Feature Flags)

### Backend 기능 플래그

```yaml
# application.yml
features:
  enrollment:
    auto-approval: true           # 수강 신청 자동 승인
    waitlist: true                # 대기자 명단 기능
  notifications:
    email: true                   # 이메일 알림
    sms: false                    # SMS 알림 (비활성화)
    push: false                   # 푸시 알림 (향후)
  analytics:
    enabled: true                 # 분석 기능
    real-time: false              # 실시간 분석 (향후)
```

```java
// FeatureConfig.java
@Configuration
@ConfigurationProperties(prefix = "features")
public class FeatureConfig {
    private EnrollmentFeatures enrollment;
    private NotificationFeatures notifications;
    private AnalyticsFeatures analytics;

    // Getters and Setters
}

// 사용 예시
@Service
public class EnrollmentService {
    @Autowired
    private FeatureConfig featureConfig;

    public void enroll(Long userId, Long courseTimeId) {
        // ...
        if (featureConfig.getEnrollment().isAutoApproval()) {
            enrollment.approve();
        }
    }
}
```

---

### Frontend 기능 플래그

```typescript
// src/config/features.ts
export const features = {
  analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
  notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS === 'true',
  debug: import.meta.env.VITE_FEATURE_DEBUG === 'true',
};

// 사용 예시
import { features } from '@/config/features';

function Dashboard() {
  return (
    <div>
      <h1>대시보드</h1>
      {features.analytics && <AnalyticsWidget />}
      {features.notifications && <NotificationBell />}
    </div>
  );
}
```

---

## 🌍 외부 서비스 연동

### 1. AWS S3 (파일 스토리지)

```yaml
# application.yml
cloud:
  aws:
    s3:
      bucket: mzc-lp-prod
      region: ap-northeast-2
    credentials:
      access-key: ${AWS_ACCESS_KEY}
      secret-key: ${AWS_SECRET_KEY}
```

```java
// S3Config.java
@Configuration
public class S3Config {
    @Value("${cloud.aws.credentials.access-key}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;

    @Value("${cloud.aws.region.static}")
    private String region;

    @Bean
    public AmazonS3 amazonS3() {
        BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
        return AmazonS3ClientBuilder.standard()
                .withRegion(region)
                .withCredentials(new AWSStaticCredentialsProvider(credentials))
                .build();
    }
}
```

---

### 2. MySQL RDS

```yaml
# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/${DB_NAME}?useSSL=true
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 50
      minimum-idle: 20
      connection-timeout: 30000
```

**RDS 보안:**
- Security Group에서 EC2 Security Group만 허용
- SSL/TLS 연결 사용
- 비밀번호 정기 변경

---

### 3. Redis (캐싱) - 향후 구현

```yaml
# application.yml (향후)
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD}
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 10
        max-idle: 10
        min-idle: 2
```

---

### 4. Google Analytics

```typescript
// src/services/analytics.ts
import ReactGA from 'react-ga4';

const GA_TRACKING_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

export const initGA = () => {
  if (GA_TRACKING_ID && features.analytics) {
    ReactGA.initialize(GA_TRACKING_ID);
  }
};

export const trackPageView = (path: string) => {
  if (features.analytics) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};
```

---

### 5. Sentry (에러 추적)

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
```

---

## 🗂️ 설정 파일 위치

### Backend
```
mzc-lp-backend/
├── src/main/resources/
│   ├── application.yml              # 공통 설정
│   ├── application-local.yml        # 로컬 개발
│   ├── application-dev.yml          # 개발 환경
│   ├── application-staging.yml      # 스테이징
│   └── application-prod.yml         # 프로덕션
└── .env                             # 로컬 환경 변수 (Git 제외)
```

### Frontend
```
mzc-lp-frontend/
├── .env.example                     # 템플릿
├── .env.local                       # 로컬 개발 (Git 제외)
├── .env.development                 # Dev 환경
├── .env.staging                     # Staging 환경
├── .env.production                  # Production 환경
└── vite.config.ts                   # Vite 설정
```

---

## 🔒 보안 체크리스트

### 환경 변수 보안
- [ ] `.env` 파일을 `.gitignore`에 추가
- [ ] GitHub Secrets에 민감 정보 저장
- [ ] JWT Secret은 256비트 이상
- [ ] DB 비밀번호는 강력한 암호 (16자 이상)
- [ ] AWS Access Key는 최소 권한 원칙

### 설정 보안
- [ ] 프로덕션에서 `show_sql: false`
- [ ] Actuator 엔드포인트 제한
- [ ] CORS 설정에서 프로덕션 도메인만 허용
- [ ] SSL/TLS 연결 사용 (RDS, Redis 등)

---

## 📚 참고 문서

- [Spring Boot Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)

---

**최종 업데이트**: 2026-01-22
**버전**: 1.0.0

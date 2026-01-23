# 트러블슈팅 가이드 (Troubleshooting Guide)

> 작성일: 2026-01-22
> 자주 발생하는 문제와 해결책

---

## 🔍 로그 확인 방법

### Backend 로그
```bash
# systemd 서비스 로그
sudo journalctl -u mzc-lp.service -f

# 최근 100줄
sudo journalctl -u mzc-lp.service -n 100

# 시간대별 조회
sudo journalctl -u mzc-lp.service --since "2026-01-22 14:00" --until "2026-01-22 15:00"

# 특정 로그 레벨만
sudo journalctl -u mzc-lp.service -p err

# 애플리케이션 로그 파일 (설정된 경우)
tail -f /var/log/mzc-lp/application.log
```

### Frontend 로그
```bash
# 브라우저 개발자 도구 (F12)
# - Console 탭: JavaScript 오류
# - Network 탭: API 요청/응답
# - Application 탭: LocalStorage, SessionStorage
```

### Database 로그
```bash
# MySQL slow query log
tail -f /var/log/mysql/mysql-slow.log

# RDS 로그 (AWS CLI)
aws rds download-db-log-file-portion \
  --db-instance-identifier mzc-lp-prod \
  --log-file-name error/mysql-error.log \
  --output text
```

---

## 🚨 인증 문제

### 1. 로그인 실패 (401 Unauthorized)

**증상:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "이메일 또는 비밀번호가 잘못되었습니다"
  }
}
```

**원인:**
- 잘못된 이메일/비밀번호
- 비활성화된 계정
- 비밀번호 암호화 불일치

**해결:**
```sql
-- 사용자 상태 확인
SELECT id, email, status FROM users WHERE email = 'user@example.com';

-- 비활성화된 경우 활성화
UPDATE users SET status = 'ACTIVE' WHERE email = 'user@example.com';

-- 비밀번호 초기화 (임시 비밀번호)
-- BCrypt로 암호화된 'temp1234!' 예시
UPDATE users SET password = '$2a$10$...' WHERE email = 'user@example.com';
```

---

### 2. 토큰 만료 (401)

**증상:**
```json
{
  "error": {
    "code": "AUTH_002",
    "message": "토큰이 만료되었습니다"
  }
}
```

**원인:**
- Access Token 만료 (1시간)
- Refresh Token 만료 (7일)

**해결 (Frontend):**
```typescript
// Axios interceptor로 자동 갱신
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && error.config && !error.config._retry) {
      error.config._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });

        localStorage.setItem('accessToken', data.data.accessToken);
        error.config.headers['Authorization'] = `Bearer ${data.data.accessToken}`;

        return axios(error.config);
      } catch (refreshError) {
        // Refresh 실패 - 재로그인 필요
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### 3. 권한 부족 (403 Forbidden)

**증상:**
```json
{
  "error": {
    "code": "AUTH_004",
    "message": "권한이 없습니다"
  }
}
```

**원인:**
- 현재 역할로 접근 불가한 API
- 역할 전환 필요

**해결:**
```sql
-- 사용자 역할 확인
SELECT ur.id, ur.role_type, c.title as course_title
FROM user_roles ur
LEFT JOIN courses c ON ur.course_id = c.id
WHERE ur.user_id = 1;

-- 역할 추가
INSERT INTO user_roles (tenant_id, user_id, role_type)
VALUES (1, 1, 'INSTRUCTOR');
```

---

## 💾 데이터베이스 문제

### 1. 연결 실패

**증상:**
```
com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
```

**원인:**
- DB 서버 다운
- 네트워크 문제
- 잘못된 호스트/포트
- Security Group 설정 오류

**해결:**
```bash
# 1. DB 서버 접근 가능 확인
telnet your-db-host 3306

# 2. MySQL 클라이언트로 직접 연결 테스트
mysql -h your-db-host -u username -p

# 3. RDS Security Group 확인 (AWS)
# - EC2 Security Group이 RDS Security Group에 허용되어 있는지 확인

# 4. application.yml 확인
spring:
  datasource:
    url: jdbc:mysql://correct-host:3306/mzclp
    username: correct-username
    password: correct-password
```

---

### 2. 정원 동시성 문제

**증상:**
- 정원 30명인데 31명이 수강 신청됨
- `CAPACITY_EXCEEDED` 에러가 안 뜸

**원인:**
- 비관적 락(Pessimistic Lock) 미적용
- 동시 요청 처리

**해결:**
```java
// CourseTimeService.java
@Transactional
public Enrollment enroll(Long courseTimeId, Long userId) {
    // 비관적 락 사용
    CourseTime courseTime = courseTimeRepository
        .findByIdWithLock(courseTimeId)
        .orElseThrow(() -> new NotFoundException("차수를 찾을 수 없습니다"));

    // 정원 확인
    if (courseTime.isFull()) {
        throw new EnrollmentException("정원이 마감되었습니다");
    }

    // 수강 신청 처리
    Enrollment enrollment = courseTime.enroll(userId);
    return enrollmentRepository.save(enrollment);
}
```

```java
// CourseTimeRepository.java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT ct FROM CourseTime ct WHERE ct.id = :id")
Optional<CourseTime> findByIdWithLock(@Param("id") Long id);
```

---

### 3. N+1 쿼리 문제

**증상:**
- API 응답 느림
- 로그에 수백 개의 SELECT 쿼리

**원인:**
- Lazy Loading으로 인한 N+1 문제
- Fetch Join 미사용

**해결:**
```java
// AS-IS (N+1 발생)
@Query("SELECT e FROM Enrollment e WHERE e.courseTime.id = :courseTimeId")
List<Enrollment> findAllByCourseTimeId(@Param("courseTimeId") Long courseTimeId);
// → 각 Enrollment마다 user를 조회하는 쿼리 N개 실행

// TO-BE (Fetch Join)
@Query("SELECT e FROM Enrollment e " +
       "JOIN FETCH e.user " +
       "WHERE e.courseTime.id = :courseTimeId")
List<Enrollment> findAllByCourseTimeIdWithUser(@Param("courseTimeId") Long courseTimeId);
// → 1개의 JOIN 쿼리로 해결
```

**로그 활성화:**
```yaml
# application.yml
spring:
  jpa:
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

---

### 4. 트랜잭션 롤백 안 됨

**증상:**
- 에러 발생했는데 DB에 데이터가 저장됨

**원인:**
- Checked Exception 발생 (기본적으로 롤백 안 함)
- `@Transactional` 누락

**해결:**
```java
// 방법 1: RuntimeException 사용 (권장)
public class EnrollmentException extends RuntimeException {
    public EnrollmentException(String message) {
        super(message);
    }
}

// 방법 2: rollbackFor 명시
@Transactional(rollbackFor = Exception.class)
public void someMethod() throws Exception {
    // ...
}
```

---

## 🌐 API 문제

### 1. 404 Not Found

**증상:**
```
404: The requested URL was not found on this server.
```

**원인:**
- 잘못된 URL
- 프론트엔드 라우팅 문제 (SPA)
- Nginx/ALB 설정 오류

**해결 (Nginx):**
```nginx
# SPA 라우팅 지원
location / {
    root /var/www/mzc-lp-frontend;
    try_files $uri $uri/ /index.html;
}

# Backend API 프록시
location /api/ {
    proxy_pass http://localhost:8080/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

### 2. 502 Bad Gateway

**증상:**
```
502 Bad Gateway
nginx/1.18.0
```

**원인:**
- Backend 서비스 다운
- 타임아웃
- Nginx ↔ Backend 연결 실패

**해결:**
```bash
# 1. Backend 서비스 상태 확인
sudo systemctl status mzc-lp.service

# 2. Backend 직접 접근 테스트
curl http://localhost:8080/actuator/health

# 3. Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# 4. Nginx 설정 테스트
sudo nginx -t

# 5. Nginx 재시작
sudo systemctl restart nginx
```

---

### 3. CORS 오류

**증상:**
```
Access to XMLHttpRequest at 'http://api.example.com' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**원인:**
- Backend CORS 설정 누락
- 잘못된 Origin 설정

**해결 (Backend):**
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",
                    "https://dev.mzc-learning.com",
                    "https://mzc-learning.com"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

---

## 🖼️ Frontend 문제

### 1. 빈 화면 (White Screen)

**증상:**
- 페이지가 로드되지 않음
- 콘솔에 에러

**원인:**
- JavaScript 에러
- API 요청 실패
- 라우팅 문제

**해결:**
```bash
# 1. 브라우저 콘솔 확인 (F12)
# 2. 에러 메시지 확인

# 3. API 요청 실패 시
# Network 탭에서 실패한 요청 확인
# - 401: 인증 문제 → 토큰 확인
# - 404: URL 오류
# - 500: 서버 오류

# 4. 캐시 클리어
Ctrl + Shift + R (또는 Cmd + Shift + R)

# 5. LocalStorage 클리어
localStorage.clear();
sessionStorage.clear();
```

---

### 2. API 호출 무한 루프

**증상:**
- 같은 API가 계속 호출됨
- 네트워크 탭에 수백 개의 요청

**원인:**
- `useEffect` 의존성 배열 오류
- React Query 설정 오류

**해결:**
```typescript
// AS-IS (무한 루프)
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData가 매번 새로 생성됨

// TO-BE
useEffect(() => {
  fetchData();
}, []); // 빈 배열 - 한 번만 실행

// 또는
const fetchData = useCallback(() => {
  // ...
}, []); // useCallback으로 함수 메모이제이션
```

---

## 🔧 성능 문제

### 1. API 응답 느림 (>3초)

**진단:**
```bash
# 1. API 응답 시간 측정
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/api/courses

# curl-format.txt 내용:
#     time_namelookup:  %{time_namelookup}\n
#        time_connect:  %{time_connect}\n
#     time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#         time_total:  %{time_total}\n

# 2. DB 쿼리 시간 확인
# application.yml
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
```

**해결:**
- N+1 쿼리 제거 (Fetch Join)
- 인덱스 추가
- 캐싱 적용 (Redis)
- 페이징 적용

---

### 2. 메모리 부족 (OutOfMemoryError)

**증상:**
```
java.lang.OutOfMemoryError: Java heap space
```

**진단:**
```bash
# 힙 덤프 생성
jmap -dump:format=b,file=heap.bin <PID>

# 힙 사용량 확인
jstat -gc <PID> 1000 10
```

**해결:**
```bash
# JVM 옵션 조정
java -Xms1g -Xmx2g -XX:+HeapDumpOnOutOfMemoryError -jar lp.jar

# systemd 서비스 파일
[Service]
Environment="JAVA_OPTS=-Xms1g -Xmx2g"
ExecStart=/usr/bin/java $JAVA_OPTS -jar /app/mzc-lp/lp.jar
```

**코드 개선:**
- 페이징 적용
- Batch 크기 조정
- Stream 사용 (대용량 데이터 처리 시)

---

## 📁 파일 업로드 문제

### 1. 파일 크기 초과

**증상:**
```
Maximum upload size exceeded
```

**해결:**
```yaml
# application.yml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
```

```nginx
# Nginx 설정
client_max_body_size 10M;
```

---

### 2. S3 업로드 실패

**증상:**
```
Access Denied (403)
```

**원인:**
- IAM 권한 부족
- Bucket Policy 오류

**해결:**
```json
// IAM Policy
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::mzc-lp-storage/*"
    }
  ]
}
```

---

## 🔄 일반적인 해결 순서

1. **로그 확인**: 에러 메시지 파악
2. **재현**: 문제 상황 재현
3. **격리**: 문제 범위 좁히기 (Frontend/Backend/DB)
4. **해결**: 임시 조치 → 근본 원인 해결
5. **검증**: 수정 사항 테스트
6. **문서화**: 해결 과정 기록

---

## 📞 에스컬레이션

해결되지 않는 문제는 다음 순서로 에스컬레이션:
1. 팀 리드
2. DevOps/인프라 팀
3. 외부 전문가

---

**최종 업데이트**: 2026-01-22
**버전**: 1.0.0

# Infrastructure Context

> 인프라 아키텍처 및 환경 설정 컨텍스트
> 상세 컨벤션이 필요하면 → `conventions/18~20` 참조

---

## AWS 아키텍처 개요

### 전체 구성도

```
                                    Internet
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Region: ap-northeast-2                                       │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │  VPC (10.0.0.0/16)                                      │  │  │
│  │  │                                                          │  │  │
│  │  │  ┌────────────── Public Subnets ──────────────┐        │  │  │
│  │  │  │                                              │        │  │  │
│  │  │  │  ┌──────────────┐    ┌──────────────┐      │        │  │  │
│  │  │  │  │   Bastion    │    │     NAT      │      │        │  │  │
│  │  │  │  │   Server     │    │   Gateway    │      │        │  │  │
│  │  │  │  └──────────────┘    └──────┬───────┘      │        │  │  │
│  │  │  │                              │              │        │  │  │
│  │  │  │  ┌──────────────┐    ┌──────▼───────┐      │        │  │  │
│  │  │  │  │     ALB      │◄───│   Internet   │      │        │  │  │
│  │  │  │  │  (Port 80)   │    │   Gateway    │      │        │  │  │
│  │  │  │  └──────┬───────┘    └──────────────┘      │        │  │  │
│  │  │  └─────────┼──────────────────────────────────┘        │  │  │
│  │  │            │                                            │  │  │
│  │  │  ┌─────────▼─── Private Subnets ──────────────┐        │  │  │
│  │  │  │                                              │        │  │  │
│  │  │  │         ┌──────────────┐                    │        │  │  │
│  │  │  │         │  EC2 API     │                    │        │  │  │
│  │  │  │         │   Server     │                    │        │  │  │
│  │  │  │         └──────┬───────┘                    │        │  │  │
│  │  │  │                │                             │        │  │  │
│  │  │  │         ┌──────▼───────┐                    │        │  │  │
│  │  │  │         │  RDS MySQL   │                    │        │  │  │
│  │  │  │         │ (Multi-AZ)   │                    │        │  │  │
│  │  │  │         └──────────────┘                    │        │  │  │
│  │  │  └──────────────────────────────────────────────┘        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  External Services:                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │   ECR    │  │    S3    │  │CloudFront│                         │
│  │(Container│  │ (Static  │  │  (CDN)   │                         │
│  │ Registry)│  │  Files)  │  │(Optional)│                         │
│  └──────────┘  └──────────┘  └──────────┘                         │
└────────────────────────────────────────────────────────────────────┘
```

### 트래픽 흐름

```
User Request
     │
     ▼
Internet Gateway (IGW)
     │
     ▼
Application Load Balancer (ALB)
     │ (Port 80 → 8080)
     ▼
EC2 API Server (Private Subnet)
     │
     ▼
RDS MySQL (Private Subnet)
```

---

## 환경 구성

| 환경 | 용도 | URL | 특징 |
|------|------|-----|------|
| **Local** | 개발 | localhost | Docker Compose |
| **Dev/Test** | 개발 테스트 | api.mzanewlp.cloudclass.co.kr | 단일 인스턴스 |
| **Prod** | 운영 | api.mzanewlp.cloudclass.co.kr | EC2 + RDS |

### 도메인 구성

| 구분 | 도메인 | 비고 |
|------|--------|------|
| **Log API** | log.api.mzanewlp.cloudclass.co.kr | 로그 수집용 |
| **Test Nginx** | api.mzanewlp.cloudclass.co.kr | API 게이트웨이 |
| **App 패턴** | test{N}.api.mzanewlp.cloudclass.co.kr | EC2 앱별 도메인 |

---

## AWS 리소스 상세

### 컴퓨팅

| 서비스 | 용도 | 환경별 설정 | 비고 |
|--------|------|------------|------|
| EC2 | Backend API Server | dev: t3.micro, prod: t3.small | Private Subnet 배치 |
| ECR | Docker 이미지 저장소 | 리전별 Repository | 이미지 태깅: latest, {git-sha} |
| Lambda | 배치/이벤트 | 필요시 추가 | Scheduled Jobs 등 |

#### EC2 API Server 상세
- **Instance Type**: t3.micro (dev), t3.small (prod)
- **Private IP**: 10.50.101.214
- **Health Check**: `/actuator/health` (Spring Boot Actuator)
- **Auto Scaling**: 필요시 ASG 구성 (prod)
- **배포 방식**: Docker Container (ECR Pull → docker run)

### 데이터베이스

| 서비스 | 용도 | 환경별 설정 | 비고 |
|--------|------|------------|------|
| RDS MySQL 8.0 | 메인 DB | dev: db.t3.micro, prod: db.t3.small + Multi-AZ | Private Subnet 배치 |
| ElastiCache | 세션/캐시 | prod만 (선택) | Redis 6.x |

#### RDS 상세
- **스토리지**: 20GB gp3 (dev), 50GB gp3 (prod)
- **백업**: 7일 자동 백업 (prod), Point-in-Time Recovery
- **Multi-AZ**: prod 환경만 활성화 (고가용성)
- **보안**: 암호화 at-rest, SSL/TLS 연결
- **접근**: Private Subnet에서만 접근 가능

### 스토리지

| 서비스 | 용도 | 설정 |
|--------|------|------|
| S3 (frontend) | 정적 파일 호스팅 | Bucket Policy: Public Read |
| S3 (uploads) | 사용자 업로드 파일 | Pre-signed URL, 암호화 |
| S3 (logs) | 로그 아카이빙 | Lifecycle Policy: 90일 → Glacier |

### 네트워킹

| 서비스 | 용도 | 설정 |
|--------|------|------|
| VPC | 네트워크 격리 | CIDR: 10.0.0.0/16 |
| Internet Gateway | 외부 인터넷 연결 | Public Subnet 연결 |
| NAT Gateway | Private → Internet | Public Subnet에 배치 |
| ALB | 로드밸런싱 | Public Subnet, Port 80 → 8080 |
| Bastion Host | SSH 접근 | Public Subnet, 운영자만 접근 |
| Route 53 | DNS | 도메인 라우팅 (선택) |
| CloudFront | CDN | 정적 파일 배포 (선택) |

### Subnet 구성

| Subnet | CIDR | 용도 | 리소스 |
|--------|------|------|--------|
| Public Subnet A | 10.0.1.0/24 | 외부 연결 | ALB, NAT Gateway, Bastion |
| Public Subnet B | 10.0.2.0/24 | 외부 연결 (AZ 분산) | ALB (Multi-AZ) |
| Private Subnet A | 10.0.11.0/24 | 애플리케이션 | EC2 API Server |
| Private Subnet B | 10.0.12.0/24 | 애플리케이션 (AZ 분산) | EC2 (Multi-AZ 시) |
| Private Subnet C | 10.0.21.0/24 | 데이터베이스 | RDS Primary |
| Private Subnet D | 10.0.22.0/24 | 데이터베이스 (AZ 분산) | RDS Standby |

### 보안 그룹

| 보안 그룹 | 대상 | Inbound 규칙 | Outbound 규칙 |
|----------|------|-------------|-------------|
| ALB-SG | ALB | 0.0.0.0/0:80, 0.0.0.0/0:443 | EC2-SG:8080 |
| EC2-SG | EC2 API Server | ALB-SG:8080 | RDS-SG:3306, 0.0.0.0/0:443 (HTTPS) |
| RDS-SG | RDS | EC2-SG:3306, Bastion-SG:3306 | - |
| Bastion-SG | Bastion | 관리자 IP:22 | EC2-SG:*, RDS-SG:3306 |

### 각 리소스 역할 및 설명

#### Internet Gateway (IGW)
- **역할**: VPC와 인터넷 간 통신 게이트웨이
- **용도**: Public Subnet의 리소스가 인터넷과 통신
- **연결**: VPC에 연결, Public Subnet의 Route Table에 0.0.0.0/0 → IGW 라우팅

#### NAT Gateway
- **역할**: Private Subnet → Internet 단방향 통신
- **용도**: ECS Task가 외부 API 호출 (결제, 이메일 등)
- **배치**: Public Subnet (Elastic IP 할당)
- **비용 절감**: Dev 환경에서는 NAT Instance로 대체 가능

#### Application Load Balancer (ALB)
- **역할**: L7 로드밸런서, HTTP/HTTPS 트래픽 분산
- **기능**:
  - Health Check: `/actuator/health` (30초마다)
  - SSL/TLS Termination (HTTPS → HTTP)
  - Sticky Session (선택)
  - Access Log → S3
- **Target Group**: ECS Task (Dynamic Port Mapping)

#### Bastion Host
- **역할**: Private Subnet 리소스 접근용 Jump Server
- **Host/IP**: `43.201.252.223`
- **용도**:
  - RDS 직접 접근 (마이그레이션, 수동 쿼리)
  - API Server 접근
  - Private Subnet 내 작업
- **보안**:
  - SSH Key-based 인증 (Public Key)
  - Private Key: `mza-newlp-key.pem`
  - 특정 IP만 접근 가능 (Security Group)

#### ECR (Elastic Container Registry)
- **역할**: Docker 이미지 저장소
- **Repository 이름**: `mza-newlp-repo`
- **URI**: `697924056608.dkr.ecr.ap-northeast-2.amazonaws.com/mza-newlp-repo`
- **워크플로우**:
  1. GitHub Actions에서 이미지 빌드
  2. ECR에 Push (`697924056608.dkr.ecr.ap-northeast-2.amazonaws.com/mza-newlp-repo:latest`)
  3. ECS Service가 이미지 Pull
- **보안**: IAM Role 기반 접근, 이미지 스캔 활성화

---

## 서버 접근 방법

### SSH 접근 명령어

| 서버 | 명령어 | 비고 |
|------|--------|------|
| **Bastion Server** | `ssh -i "mza-newlp-key.pem" ec2-user@ec2-43-201-252-223.ap-northeast-2.compute.amazonaws.com` | 외부에서 접근 |
| **API Server** | `ssh -i "mza-newlp-key.pem" ec2-user@10.50.101.214` | Bastion 내부에서 실행 |

### RDS 접속

```bash
# Bastion Server 내부에서 실행
mysql -h mza-newlp-db-instance.cni8cqie2yhm.ap-northeast-2.rds.amazonaws.com -u root -p
# Enter password: (DB Password 입력)
```

### SSH 접근 흐름

```
[로컬 PC]
    │ ssh -i "mza-newlp-key.pem" ec2-user@43.201.252.223
    ▼
[Bastion Server] (Public: 43.201.252.223)
    │
    ├─► [API Server] ssh ec2-user@10.50.101.214
    │
    └─► [RDS MySQL] mysql -h mza-newlp-db-instance...
```

> **Key 파일 위치**: `mza-newlp-key.pem` (프로젝트 외부 안전한 위치에 보관)

---

## 상세 트래픽 흐름

### 1. 사용자 요청 → Backend API

```
[User]
  │ HTTP Request
  ▼
[Internet Gateway]
  │ Public IP → VPC
  ▼
[Application Load Balancer] (Public Subnet)
  │ Port 80 → 8080 변환
  │ Health Check: /actuator/health
  ▼
[EC2 API Server] (Private Subnet)
  │ Spring Boot Application (Docker)
  │ JWT 인증 처리
  ▼
[RDS MySQL] (Private Subnet)
  │ Read/Write
  ▼
[Response] → ALB → IGW → User
```

### 2. 배포 프로세스 (ECR → EC2)

```
[GitHub Actions]
  │ docker build
  ▼
[AWS ECR] (Container Registry)
  │ Docker Image Push
  │ Tag: latest, {git-sha}
  ▼
[EC2 API Server]
  │ Pull Image from ECR
  │ docker stop → docker run
  ▼
[Health Check Pass]
  │ ALB Target Group Healthy
  ▼
[배포 완료]
```

### 3. Private → Internet (NAT Gateway)

```
[EC2 API Server] (Private Subnet)
  │ 외부 API 호출 필요
  ▼
[NAT Gateway] (Public Subnet)
  │ Private IP → Public IP 변환
  ▼
[Internet Gateway]
  │
  ▼
[External API] (예: 결제 API, 이메일 서비스)
```

### 4. Bastion Host를 통한 접근

```
[운영자]
  │ SSH (Key-based)
  ▼
[Bastion Host] (Public Subnet)
  │ Port 22
  ▼
[EC2 API Server 또는 RDS] (Private Subnet)
  │ 관리 작업 수행
  │ - DB 마이그레이션
  │ - 로그 확인
  │ - Docker 컨테이너 관리
```

---

## Docker 구성

### 로컬 개발

```bash
# 전체 스택 실행
docker compose -f docker-compose.dev.yml up -d

# 서비스별 확인
docker compose ps
docker compose logs -f backend
```

### 컨테이너 구성

| 컨테이너 | 포트 | 이미지 |
|---------|------|--------|
| backend | 8080 | ./backend (빌드) |
| frontend | 3000 | ./frontend (빌드) |
| db | 3306 | mysql:8.0 |
| redis | 6379 | redis:alpine (선택) |

---

## 데이터베이스

### 연결 정보

| 환경 | Host | Port | Database |
|------|------|------|----------|
| Local | localhost | 3306 | mza_newlp |
| Dev/Prod | mza-newlp-db-instance.cni8cqie2yhm.ap-northeast-2.rds.amazonaws.com | 3306 | mza_newlp |

### RDS 접속 정보

| 항목 | 값 |
|------|-----|
| **Server Host** | mza-newlp-db-instance.cni8cqie2yhm.ap-northeast-2.rds.amazonaws.com |
| **Port** | 3306 |
| **Database** | mza_newlp |
| **Username** | root |
| **Password** | ⚠️ Secrets Manager 또는 환경변수 참조 |

> ⚠️ **주의**: DB 비밀번호는 코드에 하드코딩하지 마세요. 환경변수 또는 Secrets Manager 사용

### 스키마 개요

```
users
├── id (PK)
├── email (UK)
├── name, password
├── role (ADMIN/OPERATOR/INSTRUCTOR/STUDENT/USER)
├── status (ACTIVE/INACTIVE/SUSPENDED)
└── created_at, updated_at

courses
├── id (PK)
├── title, description, category
├── instructor_id (FK → users)
├── status (DRAFT/PUBLISHED/CLOSED/ARCHIVED)
└── created_at, updated_at

course_terms (강의 차수)
├── id (PK)
├── course_id (FK → courses)
├── term_number, start_date, end_date
├── capacity, enrolled_count
├── status (SCHEDULED/ONGOING/COMPLETED/CANCELLED)
└── created_at, updated_at

enrollments (수강 신청)
├── id (PK)
├── user_id (FK → users)
├── course_term_id (FK → course_terms)
├── status (PENDING/APPROVED/REJECTED/CANCELLED)
├── applied_at, processed_at
└── created_at, updated_at
```

> 상세 스키마 → [database.md](./database.md)

---

## 환경변수

### Backend

| 변수 | 설명 | 예시 |
|------|------|------|
| `SPRING_PROFILES_ACTIVE` | 프로파일 | dev/staging/prod |
| `DB_HOST` | DB 호스트 | localhost |
| `DB_PASSWORD` | DB 비밀번호 | Secrets Manager |
| `JWT_SECRET` | JWT 시크릿 | Secrets Manager |

### Frontend

| 변수 | 설명 | 예시 |
|------|------|------|
| `VITE_API_BASE_URL` | API URL | http://localhost:8080/api |
| `VITE_ENV` | 환경 | development/production |

---

## 배포 파이프라인

```
GitHub Push (main)
       ↓
GitHub Actions
       ↓
┌──────┴──────┐
│             │
▼             ▼
Backend      Frontend
Build        Build
(Gradle)     (Vite)
       ↓             ↓
Docker Build  npm build
       ↓             ↓
ECR Push     S3 Upload
       ↓             ↓
EC2 Deploy   CloudFront
(SSH/SSM)    Invalidation
```

---

## 모니터링

| 서비스 | 용도 |
|--------|------|
| CloudWatch Logs | 애플리케이션 로그 |
| CloudWatch Metrics | 서비스 메트릭 |
| CloudWatch Alarms | 알림 (CPU, 메모리, 에러) |
| X-Ray | 분산 추적 (선택) |

### 알림 설정

```
- ECS CPU > 80% → Slack 알림
- RDS Storage < 20% → Slack 알림
- ALB 5xx > 10/min → Slack 알림
```

---

## 비용 예상 (월간)

| 서비스 | Dev | Prod |
|--------|-----|------|
| ECS Fargate | $15 | $60 |
| RDS | 프리티어/$0 | $30 |
| S3 + CloudFront | $5 | $10 |
| ALB | $20 | $25 |
| **합계** | **~$40** | **~$125** |

---

## 관련 문서

- [18-DOCKER-CONVENTIONS](../../conventions/18-DOCKER-CONVENTIONS.md) - Docker 컨벤션
- [19-DATABASE-CONVENTIONS](../../conventions/19-DATABASE-CONVENTIONS.md) - DB 컨벤션
- [20-AWS-CONVENTIONS](../../conventions/20-AWS-CONVENTIONS.md) - AWS 컨벤션
- [database.md](./database.md) - DB 스키마 상세

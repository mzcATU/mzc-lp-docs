# Poly-Repo 가이드

> Backend / Frontend / Docs 별도 저장소 운영 가이드

---

## 레포지토리 전략 결정 배경

### 왜 Poly-Repo인가?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         레포지토리 전략 결정                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [결정 배경]                                                                  │
│  - 부산 팀과 서울 팀이 각각 Backend와 Frontend를 담당                          │
│  - 팀 간 독립적인 개발 사이클 필요                                            │
│  - 배포 파이프라인 분리 필요                                                  │
│                                                                              │
│  [Poly-Repo 선택 이유]                                                        │
│  ├── Backend/Frontend 별도 버전 관리                                         │
│  ├── 팀별 독립적 CI/CD 파이프라인                                             │
│  ├── 저장소별 권한 관리 용이                                                  │
│  └── 각 팀의 개발 속도에 맞춘 릴리스                                          │
│                                                                              │
│  [Docs 레포 (mzc-lp)]                                                         │
│  - 문서 저장소는 모노레포 형식으로 통합 관리                                    │
│  - Backend/Frontend 공통 컨벤션, 설계 문서, 컨텍스트 통합                      │
│  - AI 활용 시 컨텍스트 제공 효율성 극대화                                      │
│  - 문서 간 상호 참조 및 일관성 유지 용이                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mono-Repo vs Poly-Repo

| 항목 | Mono-Repo | Poly-Repo (현재) |
|------|-----------|------------------|
| AI 컨텍스트 | 전체 코드 이해 용이 | 저장소별 분리 |
| 팀 간 독립성 | 낮음 | 높음 ✅ |
| 배포 파이프라인 | 복잡 | 단순 ✅ |
| 권한 관리 | 복잡 | 용이 ✅ |
| 코드 공유 | 쉬움 | 별도 패키지 필요 |

### 문서 저장소의 모노레포 역할

```
mzc-lp (문서 저장소)가 모노레포 역할 수행:

├── 전체 프로젝트 컨텍스트 통합
├── Backend/Frontend 공통 컨벤션 관리
├── 아키텍처 및 설계 문서 중앙화
├── AI 작업 시 단일 컨텍스트 제공
└── 문서 간 상호 참조로 일관성 유지

→ 코드는 분리하되, 지식(문서)은 통합
→ AI가 전체 프로젝트 맥락을 이해하도록 지원
```

---

## 저장소 구성

### 전체 구조

```
GitHub Organization: mzcATU/
├── mzc-lp/                      # 공통 문서 저장소 (현재)
├── mzc-lp-backend/              # Backend API 서버
└── mzc-lp-frontend/             # Frontend 웹 앱
```

### 저장소별 역할

| 저장소 | 역할 | 기술 스택 |
|--------|------|----------|
| **mzc-lp** | 공통 문서, 컨벤션, 설계 문서 | Markdown |
| **mzc-lp-backend** | REST API, 비즈니스 로직 | Java 21, Spring Boot 3.x, JPA |
| **mzc-lp-frontend** | 웹 UI, 사용자 인터페이스 | React 19, TypeScript, Vite |

---

## 개발 환경 실행

### 로컬 환경

```
Browser (:3000) → Frontend (Vite) → Backend (:8080) → MySQL (Docker)
```

### 실행 순서

```bash
# 1. Backend DB 실행
cd mzc-lp-backend
docker-compose up -d

# 2. Backend 실행
./gradlew bootRun

# 3. Frontend 실행 (새 터미널)
cd mzc-lp-frontend
npm install && npm run dev
```

---

## 배포 환경

### AWS 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  AWS Cloud (ap-northeast-2)              │
├─────────────────────────────────────────────────────────┤
│  [Public Subnet]                                         │
│    Bastion Server ──→ NAT Gateway                       │
│                                                          │
│  [Private Subnet - App]                                  │
│    API Server (EC2)                                      │
│                                                          │
│  [Private Subnet - DB]                                   │
│    RDS MySQL                                             │
│                                                          │
│  ECR ──→ Docker Image                                    │
│  CloudFront + S3 (Frontend) - 필요시 구성                │
└─────────────────────────────────────────────────────────┘
```

### 현재 인프라 정보

| 구분 | 값 |
|------|-----|
| **Region** | ap-northeast-2 (서울) |
| **Domain** | api.mzanewlp.cloudclass.co.kr |
| **ECR** | 697924056608.dkr.ecr.ap-northeast-2.amazonaws.com/mza-newlp-repo |

#### RDS (MySQL)

| 항목 | 값 |
|------|-----|
| Host | mza-newlp-db-instance.cni8cqie2yhm.ap-northeast-2.rds.amazonaws.com |
| Port | 3306 |
| Database | mza_newlp |

#### EC2 접속

| 서버 | 명령어 |
|------|--------|
| Bastion | `ssh -i "mza-newlp-key.pem" ec2-user@43.201.252.223` |
| API Server | Bastion 내부에서: `ssh -i "mza-newlp-key.pem" ec2-user@10.50.101.214` |

### 환경별 URL

| 환경 | Backend | Frontend | Database |
|------|---------|----------|----------|
| Local | localhost:8080 | localhost:3000 | Docker MySQL |
| Dev | api.mzanewlp.cloudclass.co.kr | (추후 구성) | RDS MySQL |

---

## 저장소 생성 체크리스트

### Backend (mzc-lp-backend)

> **필수 참조**: [backend-setup.md](./context/backend-setup.md) - .gitignore, .env, Dockerfile 전체 코드

- [ ] GitHub 저장소 생성
- [ ] Spring Boot 프로젝트 초기화
- [ ] `.gitignore`, `.env.example` 설정
- [ ] `application.yml` 환경별 설정
- [ ] `Dockerfile`, `docker-compose.yml`
- [ ] `.github/workflows/` CI/CD
- [ ] README.md

### Frontend (mzc-lp-frontend)

> **필수 참조**: [frontend-setup.md](./context/frontend-setup.md) - .gitignore, .env, vite.config 전체 코드

- [ ] GitHub 저장소 생성
- [ ] Vite + React + TypeScript 초기화
- [ ] `.gitignore`, `.env.example` 설정
- [ ] API 클라이언트 설정
- [ ] `.github/workflows/` CI/CD
- [ ] README.md

---

## 문서 동기화 규칙

### 각 저장소 CLAUDE.md 템플릿

**mzc-lp-backend/CLAUDE.md:**
```markdown
# Backend - AI 작업 가이드

> 📚 전체 문서: https://github.com/mzcATU/mzc-lp

| 작업 | 문서 |
|------|------|
| 컨벤션 | mzc-lp/docs/conventions/ |
| API 스펙 | mzc-lp/docs/structure/backend/ |
| 설정 가이드 | mzc-lp/docs/context/backend-setup.md |

> 상세 → [mzc-lp/docs/CLAUDE.md](https://github.com/mzcATU/mzc-lp/docs/CLAUDE.md)
```

**mzc-lp-frontend/CLAUDE.md:**
```markdown
# Frontend - AI 작업 가이드

> 📚 전체 문서: https://github.com/mzcATU/mzc-lp

| 작업 | 문서 |
|------|------|
| 컨벤션 | mzc-lp/docs/conventions/ |
| 디자인 | mzc-lp/docs/conventions/design/ |
| 설정 가이드 | mzc-lp/docs/context/frontend-setup.md |

> 상세 → [mzc-lp/docs/CLAUDE.md](https://github.com/mzcATU/mzc-lp/docs/CLAUDE.md)
```

### 동기화 체크리스트

```
문서 수정 시:
□ 관련 코드 저장소에 영향 확인
□ API 스펙 변경 → FE/BE 모두 확인
□ 컨벤션 변경 → 기존 코드 호환성 확인

코드 수정 시:
□ 새 API 추가 → docs/structure/ 업데이트
□ 새 패턴 도입 → docs/conventions/ 업데이트
```

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [backend-setup.md](./context/backend-setup.md) | Backend 상세 설정 (.env, Dockerfile 등) |
| [frontend-setup.md](./context/frontend-setup.md) | Frontend 상세 설정 (.env, vite.config 등) |
| [architecture.md](./context/architecture.md) | 시스템 아키텍처, 테넌트 구조 |
| [02-GIT-CONVENTIONS.md](./conventions/02-GIT-CONVENTIONS.md) | Git 브랜치 전략 |
| [20-AWS-CONVENTIONS.md](./conventions/20-AWS-CONVENTIONS.md) | AWS 배포 |
| [18-DOCKER-CONVENTIONS.md](./conventions/18-DOCKER-CONVENTIONS.md) | Docker 설정 |

# 20. AWS Infrastructure Conventions

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> AWS 인프라 구성 및 배포 컨벤션

---

## 핵심 규칙

```
✅ 환경별 분리 → dev/staging/prod 계정 또는 VPC
✅ IAM 최소 권한 원칙 → 필요한 권한만 부여
✅ 비밀값은 Secrets Manager → 코드에 하드코딩 금지
✅ 태깅 필수 → 비용 추적, 리소스 관리
✅ IaC 사용 → Terraform 또는 CloudFormation
```

---

## 아키텍처 패턴

```
Internet → Route 53 → CloudFront → S3 (Frontend)
                    → ALB → ECS Fargate → RDS MySQL
```

### VPC 구성

| Subnet | CIDR | 용도 |
|--------|------|------|
| Public A/B | 10.0.1-2.0/24 | ALB, NAT Gateway |
| Private App A/B | 10.0.11-12.0/24 | ECS Tasks |
| Private DB A/B | 10.0.21-22.0/24 | RDS |

---

## 서비스별 핵심 설정

### ECS Task Definition (핵심)

```json
{
  "cpu": "512",
  "memory": "1024",
  "secrets": [{
    "name": "DB_PASSWORD",
    "valueFrom": "arn:aws:secretsmanager:..."
  }],
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health"]
  },
  "logConfiguration": {
    "logDriver": "awslogs"
  }
}
```

### RDS (핵심)

```hcl
instance_class = "db.t3.micro"  # 프리티어
multi_az       = true           # 운영환경
password       = var.db_password # Secrets Manager
```

### 태깅

```hcl
tags = {
  Project     = "LearningPlatform"
  Environment = "prod"
  ManagedBy   = "Terraform"
}
```

---

## CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml (핵심 단계)
steps:
  - uses: aws-actions/configure-aws-credentials@v4
  - uses: aws-actions/amazon-ecr-login@v2
  - run: docker build && docker push
  - run: aws ecs update-service --force-new-deployment
```

---

## 비용 최적화

| 서비스 | 권장 |
|--------|------|
| ECS | Fargate Spot (70% 절감) |
| RDS | db.t3.micro (프리티어) |
| NAT Gateway | 비용 주의 (시간당 과금) |

---

## 체크리스트

### 배포 전
- [ ] Security Group 최소 권한
- [ ] Secrets Manager에 비밀값 저장
- [ ] IAM Role 권한 확인

### 배포 후
- [ ] Health Check 정상
- [ ] CloudWatch 로그 확인
- [ ] 비용 알림 설정

---

## 자주 하는 실수

| ❌ Bad | ✅ Good |
|--------|---------|
| `Action = "*"` | 필요한 권한만 지정 |
| `cidr_blocks = ["0.0.0.0/0"]` | VPC 내부 IP만 허용 |
| `password = "plain-text"` | Secrets Manager 사용 |
| 태깅 누락 | Project/Environment/Owner |
| `multi_az = false` | `multi_az = true` (운영) |
| 환경변수로 비밀 전달 | secrets로 참조 |

---

> 상세 아키텍처 → [infrastructure.md](../docs/context/infrastructure.md)

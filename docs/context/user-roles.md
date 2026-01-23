# 사용자 역할 및 플로우

> 역할 정의, 역할 부여 플로우, 사이트별 차이점
> **권한 상세는 → [authorization-model.md](./authorization-model.md)**

---

## 언제 이 문서를 보는가?

| 상황 | 이 문서 | 다른 문서 |
|------|---------|----------|
| 역할이 뭐가 있지? | ✅ 섹션 2 | - |
| 역할 부여는 어떻게? | ✅ 섹션 4 | - |
| 권한 검증 코드는? | - | [authorization-model.md](./authorization-model.md) |
| DB 스키마는? | - | [user/db.md](../structure/backend/user/db.md) |

---

## 1. 플랫폼 관계

```
┌─────────────────────────────────────────────────────────────┐
│                    B2C (메인 러닝 플랫폼)                     │
│                      핵심 코어 시스템                         │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │ 테넌트화 (브랜딩 + 커스터마이징) │
            └───────────────┬───────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────┐           ┌───────────────────────┐
│    B2B (기업용 LMS)    │           │  KPOP (K-POP 교육)   │
│  삼성, LG, 현대 등     │           │  외국인 단기 연수     │
└───────────────────────┘           └───────────────────────┘
```

---

## 2. 역할 정의

### 2.1 테넌트 레벨 역할 (TenantRole)

```java
public enum TenantRole {
    SYSTEM_ADMIN,   // 시스템 최고 관리자
    TENANT_ADMIN,   // 테넌트 관리자
    OPERATOR,       // 운영자 (강의 검토, 차수 생성, 역할 부여)
    DESIGNER,       // 설계자 (강의 개설 신청)
    USER            // 일반 사용자 (수강)
}
```

| 역할 | 핵심 책임 |
|------|----------|
| TENANT_ADMIN | 테넌트 설정, 브랜딩, 전체 통계 |
| OPERATOR | 강의 승인, 차수/강사 관리, 역할 부여(B2B) |
| DESIGNER | 강의 설계, 개설 신청 |
| USER | 수강, 리뷰 작성 |

### 2.2 강의 레벨 역할 (CourseRole)

```java
public enum CourseRole {
    DESIGNER,       // 강의 설계자 (커리큘럼 구성)
    OWNER,          // 강의 소유자 (B2C: 소유+강사)
    INSTRUCTOR      // 강사 (B2B/KPOP 전용)
}
```

### 2.3 차수 레벨 역할 (InstructorRole)

```java
public enum InstructorRole {
    MAIN,       // 주강사 (차수당 1명)
    SUB,        // 보조강사 (N명)
    ASSISTANT   // 조교 (N명)
}
```

---

## 3. B2C vs B2B 핵심 차이

| 항목 | B2C (셀프 서비스) | B2B (관리자 통제) |
|------|-------------------|-------------------|
| **DESIGNER 부여** | 셀프 (버튼 클릭) | OPERATOR가 부여 |
| **INSTRUCTOR** | ❌ 없음 (OWNER=강사) | ✅ OPERATOR가 부여 |
| **역할 회수** | ❌ 불가 | ✅ OPERATOR가 회수 |
| **강의 개설 버튼** | 모든 USER에게 노출 | DESIGNER에게만 노출 |

---

## 4. 역할 부여 플로우

### 4.1 B2C 플로우 (셀프 서비스)

```
USER ──► "강의 개설하기" 클릭 ──► DESIGNER 자동 부여
                                      │
                                      ▼
                              강의 구성 (커리큘럼, 영상)
                                      │
                                      ▼
                              "개설 신청" 클릭
                                      │
                                      ▼
                              OPERATOR 승인
                                      │
                                      ▼
                              OWNER 부여 (= 강사)
```

**핵심**: B2C에서 OWNER = 강사 (1인 크리에이터 구조)

### 4.2 B2B 플로우 (관리자 통제)

```
USER
  │
  ├─► OPERATOR "강의설계자 부여" ──► DESIGNER
  │                                    │
  │                                    ▼
  │                              강의 구성 → 승인 → OWNER
  │
  └─► OPERATOR "강사 부여" ────────► INSTRUCTOR
```

**핵심**: OPERATOR가 유저 목록에서 역할 부여/회수

### 4.3 강사 배정 플로우 (차수 레벨)

```
차수 생성 (OPERATOR)
    │
    ▼
강사 배정 (OPERATOR)
    │
    ├─► MAIN 강사 배정 (1명만)
    │
    ├─► SUB 강사 배정 (N명)
    │
    └─► ASSISTANT 배정 (N명)
```

> 상세: [instructor/db.md](../structure/backend/instructor/db.md)

---

## 5. OPERATOR 업무 요약

```
OPERATOR가 수행하는 업무:

1. 강의 승인/반려
   └─ DESIGNER가 개설 신청 → OPERATOR 검토

2. 차수(Time) 생성
   └─ 승인된 강의에 1차, 2차... 차수 추가

3. 강사 배정
   └─ 차수에 MAIN/SUB/ASSISTANT 배정

4. 수강 관리
   └─ 필수 수강 강제 신청 (B2B)

5. 역할 부여/회수 (B2B만)
   └─ USER → DESIGNER, USER → INSTRUCTOR
```

---

## 6. 사이트별 요약

### B2C (인프런형)
```
TENANT_ADMIN ─── 전체 관리
       │
   OPERATOR ──── 강의 승인, 차수 생성
       │
     USER ─────── 수강 + "강의 개설하기" 버튼
       │
   DESIGNER ───► 승인 후 ───► OWNER (= 강사)
```

### B2B (기업 전용)
```
TENANT_ADMIN ─── 브랜딩, 전사 통계
       │
   OPERATOR ──── 운영 + 역할 부여/회수
       │
     USER ─────── 학습 (역할 부여 전까지 강의 개설 불가)
       │
       ├─► DESIGNER (부여됨) → OWNER
       └─► INSTRUCTOR (부여됨)
```

### KPOP (K-POP 연수)
```
OPERATOR ──── 프로그램/스케줄/시설 관리
       │
     USER ─────── 스케줄 조회, 수강, 영상 업로드
                  └─► INSTRUCTOR 피드백 받음
```

---

## 7. 관련 문서

| 문서 | 내용 |
|------|------|
| [authorization-model.md](./authorization-model.md) | **권한 매트릭스, RBAC 3계층, 검증 코드** |
| [multi-tenancy.md](./multi-tenancy.md) | 테넌트 분리 전략 |
| [architecture.md](./architecture.md) | 전체 시스템 구조 |
| [20-SECURITY-CONVENTIONS.md](../conventions/20-SECURITY-CONVENTIONS.md) | 보안 컨벤션 |

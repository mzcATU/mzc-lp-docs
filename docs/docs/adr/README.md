# Architecture Decision Records (ADR)

> 📋 프로젝트의 중요한 아키텍처 결정을 기록합니다.
> "왜 이렇게 만들었는가?"에 대한 답을 기록하여 미래의 개발자(또는 AI)가 맥락을 이해할 수 있게 합니다.

---

## 📖 ADR이란?

ADR(Architecture Decision Record)은 프로젝트에서 내린 중요한 아키텍처 결정을 문서화한 것입니다.

### 핵심 목적
```
✅ Why 기록     → "왜 이 방식을 선택했는가?"
✅ 맥락 보존     → 시간이 지나도 결정 배경 이해
✅ 대안 비교     → 다른 옵션은 왜 선택하지 않았는가?
✅ AI 컨텍스트  → AI가 프로젝트 의도를 이해
```

---

## 🎯 언제 ADR을 작성하는가?

### 작성해야 할 때 (MUST)
| 상황 | 예시 |
|------|------|
| **프레임워크/라이브러리 선택** | React vs Vue, Spring Boot vs NestJS |
| **아키텍처 패턴 결정** | MVC vs Clean Architecture, Monorepo vs Multi-repo |
| **데이터베이스 설계 결정** | MySQL vs PostgreSQL, 정규화 vs 비정규화 |
| **API 설계 방식** | REST vs GraphQL, JWT vs Session |
| **보안 관련 결정** | 인증 방식, 암호화 알고리즘 |
| **성능 최적화 방식** | 캐싱 전략, 인덱스 설계 |

### 작성하지 않아도 될 때
```
❌ 단순 버그 수정
❌ 코드 스타일 변경
❌ 문서 오타 수정
❌ 명백한 베스트 프랙티스 적용
```

---

## 📋 ADR 목록

| 번호 | 제목 | 상태 | 날짜 | 결정 요약 |
|:----:|------|:----:|:----:|----------|
| [000](./000-template.md) | ADR 템플릿 | ACCEPTED | - | ADR 작성 표준 템플릿 |

> 새 ADR은 아래 테이블에 추가하세요

---

## 🏷️ ADR 상태

| 상태 | 의미 | 언제 사용? |
|:----:|------|-----------|
| **PROPOSED** | 제안됨 | 리뷰 대기 중, 아직 확정 안 됨 |
| **ACCEPTED** | 승인됨 | 적용 중, 현재 유효한 결정 |
| **DEPRECATED** | 폐기됨 | 더 이상 유효하지 않음 |
| **SUPERSEDED** | 대체됨 | 다른 ADR로 대체됨 (링크 필수) |

---

## ✍️ 새 ADR 작성하기

### 작성 절차
```bash
# 1. 템플릿 복사
cp docs/adr/000-template.md docs/adr/NNN-제목.md

# 2. 내용 작성
# - Context: 왜 이 결정이 필요한가?
# - Options: 어떤 선택지를 고려했는가?
# - Decision: 왜 이 옵션을 선택했는가?
# - Consequences: 어떤 영향이 있는가?

# 3. README 목록에 추가
```

### 파일명 규칙
```
NNN-결정-제목.md

예시:
001-jwt-authentication.md
002-react-query-state-management.md
003-mysql-over-postgresql.md
```

### 작성 체크리스트
- [ ] Context 섹션: 배경과 문제 명확히 서술
- [ ] Options 섹션: 최소 2개 이상의 대안 비교
- [ ] Decision 섹션: 결정 이유를 구체적으로 설명
- [ ] Consequences 섹션: 긍정/부정 영향 모두 기록
- [ ] 상태: PROPOSED로 시작 (리뷰 후 ACCEPTED)
- [ ] README 테이블에 추가

---

## 🎓 ADR 작성 팁

### 좋은 ADR의 특징
```
✅ Why를 명확히 설명 (What이 아닌 Why)
✅ 대안을 비교 분석 (왜 다른 선택을 하지 않았는가?)
✅ 트레이드오프를 솔직히 기록 (완벽한 선택은 없음)
✅ 구체적인 예시와 데이터 제시
```

### 피해야 할 실수
```
❌ "이게 베스트 프랙티스니까" → Why 없음
❌ 선택한 옵션만 설명 → 대안 비교 없음
❌ 긍정적 측면만 강조 → 트레이드오프 누락
❌ 추상적 설명만 → 구체성 부족
```

---

## 📚 참고 자료

| 자료 | 설명 |
|------|------|
| [ADR GitHub Organization](https://adr.github.io/) | ADR 공식 가이드 |
| [맥도날드화 원칙](https://yozm.wishket.com/magazine/detail/3457/) | Why 기록의 중요성 |
| [000-template.md](./000-template.md) | ADR 작성 템플릿 |
| [md-writing-guide.md](../../templates/md-writing-guide.md) | 마크다운 작성 가이드 |

---

## 🔗 관련 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](../../CLAUDE.md) | AI 작업 가이드 |
| [conventions/](../../conventions/) | 코딩 컨벤션 |
| [templates/](../../templates/) | 템플릿 모음 |

---

**💡 Tip**: ADR은 "과거의 나"와 "미래의 나(또는 팀원/AI)"에게 보내는 편지입니다. 맥락을 충분히 제공하세요.

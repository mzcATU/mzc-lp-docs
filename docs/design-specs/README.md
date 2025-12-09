# 화면 정의서 (Screen Specification)

> MZRUN LMS 플랫폼 프론트엔드 화면 정의서

---

## 문서 구조

```
design-specs/
├── README.md                 # 이 문서
├── TO-screen-spec.md         # TO 핵심 가이드 (~200줄)
├── TO-screens-detail.md      # TO 화면별 상세 (부록)
├── TU-screen-spec.md         # TU 핵심 가이드 (~200줄)
└── TU-screens-detail.md      # TU 화면별 상세 (부록)
```

---

## 문서 목록

| 문서 | 대상 | 내용 | 줄 수 |
|------|------|------|-------|
| [TO-screen-spec.md](./TO-screen-spec.md) | Tenant Operator | 핵심 가이드 | ~200 |
| [TO-screens-detail.md](./TO-screens-detail.md) | Tenant Operator | 화면별 상세 | 부록 |
| [TU-screen-spec.md](./TU-screen-spec.md) | Tenant User | 핵심 가이드 | ~200 |
| [TU-screens-detail.md](./TU-screens-detail.md) | Tenant User | 화면별 상세 | 부록 |

---

## TO vs TU 비교

| 항목 | TO (운영자) | TU (수강생) |
|------|-------------|-------------|
| 레이아웃 | Sidebar + Header | Top Header Only |
| 테마 | 다크/라이트 전환 | 다크 모드 전용 |
| 라우팅 | 탭 기반 (useState) | React Router DOM |
| UI 프레임워크 | Radix UI | 커스텀 컴포넌트 |
| 디자인 | 관리자 대시보드 | Glassmorphism |

---

## 디자인 토큰

> 컬러, 스페이싱, 반응형 등 디자인 토큰은 각 문서 참조

| 대상 | 참조 문서 |
|------|----------|
| TO 디자인 토큰 | [TO-screen-spec.md](./TO-screen-spec.md) |
| TU 디자인 토큰 | [TU-screen-spec.md](./TU-screen-spec.md) |

---

## 언제 참조?

| 상황 | 참조 문서 |
|------|----------|
| TO 화면 개발 시작 | TO-screen-spec.md |
| TO 화면 상세 구현 | TO-screens-detail.md |
| TU 화면 개발 시작 | TU-screen-spec.md |
| TU 화면 상세 구현 | TU-screens-detail.md |
| 디자인 토큰/CVA 패턴 | 각 spec.md의 디자인 토큰 섹션 |

---

## 작성 원칙

```
✅ 핵심 가이드 200줄 제한
✅ 상세 내용은 detail.md로 분리
✅ 디자인 토큰 사용 (하드코딩 금지)
✅ CVA 컴포넌트 패턴 예시 포함
✅ 체크리스트로 마무리
```

---

> 상위 문서 → [../README.md](../README.md)
> 디자인 컨벤션 → [../conventions/17-DESIGN-CONVENTIONS.md](../conventions/17-DESIGN-CONVENTIONS.md)

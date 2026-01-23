# Templates - 작업 템플릿 모음

> 프로젝트 전반에 사용되는 템플릿 및 가이드 문서

---

## 📋 템플릿 목록

### 워크플로우
| 템플릿 | 용도 | 언제 사용? |
|--------|------|-----------|
| [task-workflow](./task-workflow.md) | AI 작업 프로세스 (7단계 워크플로우 포함) | 모든 코드 생성/수정 작업 |

### 기획/우선순위
| 템플릿 | 용도 | 언제 사용? |
|--------|------|-----------|
| [prd](./prd.md) | 기능 요구사항 문서 | 새 기능 기획 시 |
| [moscow-priority](./moscow-priority.md) | 우선순위 분류 | 작업 범위 결정 시 |
| [project-specification](./project-specification.md) | 프로젝트 명세서 | 프로젝트 초기 설정 |

### 코드 리뷰/PR
| 템플릿 | 용도 | 언제 사용? |
|--------|------|-----------|
| [pr-guide](./pr-guide.md) | Pull Request 작성 | PR 생성 시 |
| [code-review-checklist](./code-review-checklist.md) | 코드 리뷰 체크리스트 | 코드 리뷰 시 |

### 문서 작성
| 템플릿 | 용도 | 언제 사용? |
|--------|------|-----------|
| [md-writing-guide](./md-writing-guide.md) | 마크다운 작성 원칙 | 새 문서 작성 시 |
| [feature-docs-guide](./feature-docs-guide.md) | 기능별 문서 작성 | 기능 구현 완료 후 |

---

## 🎯 작업별 빠른 참조

### AI에게 작업 요청할 때
1. **[task-workflow.md](./task-workflow.md)** - AI가 따라야 할 작업 프로세스 (7단계 워크플로우, MoSCoW 포함)

### 새 기능 기획할 때
1. **[prd.md](./prd.md)** - 요구사항 정리
2. **[moscow-priority.md](./moscow-priority.md)** - 우선순위 분류

### 코드 작성 후
1. **[code-review-checklist.md](./code-review-checklist.md)** - 자체 점검
2. **[feature-docs-guide.md](./feature-docs-guide.md)** - 문서화
3. **[pr-guide.md](./pr-guide.md)** - PR 작성

### 문서 작성할 때
1. **[md-writing-guide.md](./md-writing-guide.md)** - 작성 원칙
2. **[feature-docs-guide.md](./feature-docs-guide.md)** - 기능 문서 규칙

---

## 📖 템플릿 사용 원칙

### 1. 선택적 사용
```
✅ 필요한 템플릿만 선택적으로 사용
❌ 모든 템플릿을 무조건 적용
```

### 2. 커스터마이징 가능
```
✅ 프로젝트 상황에 맞게 조정
✅ 섹션 추가/제거 가능
❌ 형식에 얽매이지 말 것
```

### 3. 컨텍스트 절약
```
✅ 작업 전 해당 템플릿만 참조
❌ 모든 템플릿을 한번에 로딩
```

---

## 🔄 템플릿 업데이트

새 템플릿 추가 시:
1. 이 README에 항목 추가
2. [CLAUDE.md](../CLAUDE.md) 참조 테이블 업데이트
3. 200줄 이하 권장 ([md-writing-guide](./md-writing-guide.md) 참조)

---

## 📚 관련 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](../CLAUDE.md) | AI 작업 가이드 (메인) |
| [conventions/](../conventions/) | 코딩 컨벤션 |
| [context/](../context/) | 프로젝트 컨텍스트 |
| [structure/](../structure/) | API/DB 스펙 |

---

**💡 Tip**: 대부분의 작업은 [CLAUDE.md](../CLAUDE.md)만으로 시작 가능합니다. 이 폴더의 템플릿들은 필요할 때 선택적으로 참조하세요.

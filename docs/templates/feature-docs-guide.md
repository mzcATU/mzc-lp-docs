# 기능별 문서 규칙 (guide.md / notes.md)

**목적**: 코드와 같은 폴더에 가이드와 구현 기록을 함께 관리하여 컨텍스트 보존

---

## 핵심 원칙

> **중요**: 작업 완료 후 반드시 해당 폴더의 `notes.md`에 기록할 것
> (AI 대화가 끝나면 컨텍스트가 초기화됨)

---

## 파일 구성

| 파일 | 용도 | 규칙 |
|------|------|------|
| `guide.md` | 해당 폴더 코드의 가이드 | **300줄 이하** |
| `notes.md` | 구현/수정 기록 | 누적 업데이트 (하나의 파일에 계속 추가) |

---

## 문서 위치 예시

```
backend/src/.../domain/user/
├── service/
│   ├── UserService.java
│   ├── guide.md          ← 가이드 (300줄 이하)
│   └── notes.md          ← 구현 기록 (누적)

frontend/src/pages/
├── UserDetailPage.tsx
├── guide.md
└── notes.md
```

---

## guide.md 작성 규칙

### 목적
해당 폴더의 코드 구조, 사용법, 주의사항을 설명

### 규칙
- **300줄 초과 금지** - 초과 시 핵심만 남기고 요약
- 새 코드 작성 시 함께 생성
- 코드 변경 시 guide.md도 업데이트

### 포함 내용
```markdown
# {폴더명} Guide

## 개요
이 폴더의 역할 설명

## 구조
파일/클래스 구조 설명

## 사용법
주요 메서드/컴포넌트 사용 예시

## 주의사항
개발 시 주의할 점

## 관련 문서
- [연관 문서 링크]
```

---

## notes.md 작성 규칙

### 목적
버그 수정, 기능 구현, 로직 변경 등의 **기록**

### 작성 대상
- 버그 수정
- 기능 구현
- 로직 변경
- 중요한 리팩토링

### 필수 포함 사항
- **왜 이 코드를 작성했는지** 반드시 포함
- **파일 링크 필수**: 수정한 파일은 마크다운 링크로 연결
- **구체적 위치 명시**: 어떤 클래스/메서드를 수정했는지 명시
- **코드 스니펫 포함**: 핵심 변경 코드 포함

---

## notes.md 작성 형식

```markdown
## YYYY-MM-DD: 제목

### 문제 (버그인 경우)
문제 상황 설명

### 원인
원인 분석

### 왜 이렇게 해결했는가
해결 방법 선택 이유

### 해결
[수정한파일.java](경로) 수정:
- `클래스명.메서드명()` 에서 ~~ 로직 추가/변경

핵심 코드:
```java
// 변경된 코드 스니펫
```

### 변경된 동작
| 상황 | 이전 | 이후 |
|------|------|------|
| 케이스1 | 동작A | 동작B |
```

---

## 예시: notes.md

```markdown
## 2025-01-15: 사용자 인증 토큰 만료 처리 수정

### 문제
JWT 토큰 만료 시 401 에러가 발생하지만, 프론트엔드에서 리프레시 토큰으로 갱신하지 않고 바로 로그아웃됨

### 원인
Axios interceptor에서 401 에러 시 토큰 갱신 로직이 누락됨

### 왜 이렇게 해결했는가
- 모든 API 호출에서 일관된 토큰 갱신 처리를 위해 interceptor 레벨에서 처리
- 개별 API 호출마다 처리하면 중복 코드 발생

### 해결
[apiClient.ts](../services/apiClient.ts) 수정:
- `setupInterceptors()` 에서 401 에러 시 토큰 갱신 로직 추가

핵심 코드:
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### 변경된 동작
| 상황 | 이전 | 이후 |
|------|------|------|
| 토큰 만료 | 바로 로그아웃 | 자동 갱신 후 재시도 |
| 리프레시 토큰도 만료 | - | 로그아웃 |
```

---

## 언제 작성하는가?

### guide.md
- 새 폴더/모듈 생성 시
- 복잡한 로직이 있는 코드 작성 시
- 다른 개발자(또는 미래의 AI)가 이해해야 할 때

### notes.md
- 버그 수정 완료 후
- 기능 구현 완료 후
- 중요한 로직 변경 후
- **AI 대화 종료 전** (컨텍스트 보존)

---

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - AI 작업 가이드
- [PR 가이드](./pr-guide.md) - PR 시 문서 최신화

# PR 문서 최신화 가이드

**목적**: PR 생성 직전 Claude Code가 참조하여 관련 문서를 자동으로 최신화

---

## 1. 최신화 대상 문서

### 1.1 구조 문서 (docs/structure/)

| 문서 | 설명 |
|------|------|
| `backend/{domain}/api.md` | API 엔드포인트, 요청/응답 형식 |
| `backend/{domain}/db.md` | DB 스키마, 엔티티 관계 |
| `backend/common/overview.md` | 공통 컴포넌트, 예외 처리 |
| `frontend/api.md` | API 클라이언트 함수 |
| `frontend/pages.md` | 페이지 구성, 라우팅 |
| `README.md` | 전체 구조 개요, 도메인 다이어그램 |

### 1.2 프로젝트 명세서 (project-specification.md)

- **진척도 체크리스트**: 완료된 기능 체크 (✅)
- **확장/변경사항**: 초기 기획 대비 변경 내용 기록
- **버전 표기**: 내부 버전 + 파일명 버전 업데이트
- **변경 이력**: 문서 하단 변경 이력 테이블 업데이트

---

## 2. 파일-문서 매핑 테이블

### 2.1 백엔드

| 변경 파일 | 업데이트 문서 | 업데이트 내용 |
|-----------|---------------|---------------|
| `*Controller.java` | `backend/{domain}/api.md` | 엔드포인트 추가/수정/삭제 |
| `*Request.java`, `*Response.java` | `backend/{domain}/api.md` | 요청/응답 필드 변경 |
| `*.java` (Entity) | `backend/{domain}/db.md` | 스키마, 필드, 관계 변경 |
| `*Repository.java` | `backend/{domain}/db.md` | 쿼리 메서드 (필요시) |
| `GlobalExceptionHandler.java` | `backend/common/overview.md` | 예외 처리 변경 |
| `*Config.java` | `backend/common/overview.md` | 설정 변경 |

### 2.2 프론트엔드

| 변경 파일 | 업데이트 문서 | 업데이트 내용 |
|-----------|---------------|---------------|
| `api/client.ts` | `frontend/api.md` | 공통 설정 변경 |
| `api/*Api.ts` | `frontend/api.md` | API 함수 추가/수정 |
| `pages/*.tsx` | `frontend/pages.md` | 페이지 추가/수정 |
| `App.tsx` (라우트) | `frontend/pages.md` | 라우트 추가/변경 |
| `components/*.tsx` | `frontend/components.md` | 컴포넌트 추가 (파일 없으면 생성) |

### 2.3 전체 구조

| 변경 유형 | 업데이트 문서 | 업데이트 내용 |
|-----------|---------------|---------------|
| 새 도메인 추가 | `structure/README.md` | 도메인 다이어그램, 파일 구조 |
| 새 도메인 추가 | `backend/{domain}/api.md`, `db.md` | 새 문서 생성 |
| 기능 구현 완료 | `project-specification` | 체크리스트 체크 |
| 기획 변경 | `project-specification` | 확장/변경사항 섹션 |

---

## 3. PR 생성 프로세스

### Step 1: 변경 파일 분석

```bash
# 변경된 파일 목록 확인
git diff main --name-only

# 또는 staged 파일 확인
git diff --cached --name-only
```

매핑 테이블을 참조하여 업데이트가 필요한 문서 식별

### Step 2: 구조 문서 업데이트

1. **API 변경 시** (`api.md`)
   - 엔드포인트 테이블 업데이트
   - 요청/응답 JSON 예시 업데이트
   - HTTP 상태 코드 확인

2. **엔티티 변경 시** (`db.md`)
   - 스키마 테이블 업데이트
   - ER 다이어그램 업데이트 (필요시)
   - 관계 설명 업데이트

3. **프론트엔드 변경 시** (`frontend/*.md`)
   - API 함수 목록 업데이트
   - 페이지/라우트 테이블 업데이트

### Step 3: project-specification 업데이트

1. **진척도 체크리스트**
   - 완료된 스토리 `- [x]`로 변경
   - 진행중인 스토리 표시 (필요시)

2. **확장/변경사항** (초기 기획 대비 변경이 있을 경우)
   ```markdown
   ### 확장/변경사항

   #### vX.X.X 변경사항
   - **[변경]** 기존 기능 A → 변경된 내용
   - **[추가]** 새로 추가된 기능 B
   - **[제거]** 제거된 기능 C
   ```

3. **버전 번호 업데이트**
   - `문서 버전` 필드 업데이트
   - `최종 수정일` 업데이트
   - `문서 변경 이력` 테이블에 항목 추가

### Step 4: 문서 커밋

```bash
# 문서 변경 커밋
git add docs/
git commit -m "docs: PR 관련 문서 최신화

- structure 문서 업데이트
- project-specification 진척도 업데이트"
```

---

## 4. 버전 관리 규칙

### 4.1 버전 번호 체계 (Semantic Versioning)

| 버전 유형 | 형식 | 변경 시점 |
|-----------|------|-----------|
| **Major** | X.0.0 | 아키텍처/구조 대규모 변경 |
| **Minor** | 0.X.0 | 새 기능 추가, MVP 스토리 완료 |
| **Patch** | 0.0.X | 문서 수정, 오타 수정, 버그 수정 |

### 4.2 파일명 변경 시점

- **Patch 버전**: 파일명 유지 (내부 버전만 변경)
- **Minor 버전 이상**: 파일명도 함께 변경

예시:
```
v0.0.1 → v0.0.2 (patch): 파일명 유지
v0.0.2 → v0.1.0 (minor): 파일명 변경
v0.1.0 → v1.0.0 (major): 파일명 변경
```

---

## 5. 체크리스트 (Claude Code용)

PR 생성 전 다음 항목을 확인:

### 구조 문서 (docs/structure/)

- [ ] 새 API 엔드포인트 추가? → `api.md` 반영
- [ ] 요청/응답 DTO 변경? → `api.md` 요청/응답 섹션 업데이트
- [ ] 엔티티 필드 변경? → `db.md` 스키마 업데이트
- [ ] 새 페이지/라우트 추가? → `pages.md` 반영
- [ ] 새 API 클라이언트 함수? → `frontend/api.md` 반영
- [ ] 새 도메인 추가? → `README.md` 다이어그램 + 새 문서 생성

### 프로젝트 명세서 (project-specification)

- [ ] 완료된 MVP 스토리? → 체크리스트 `[x]` 표시
- [ ] 초기 기획 대비 변경? → 확장/변경사항 섹션 기록
- [ ] 버전 번호 업데이트 필요? → 문서 버전 + 파일명 확인
- [ ] 변경 이력 추가? → 문서 하단 테이블 업데이트

### 커밋 전 최종 확인

- [ ] 모든 문서가 코드와 동기화되어 있는가?
- [ ] 문서 내 링크가 정상 동작하는가?
- [ ] 마크다운 형식이 올바른가?

---

## 6. 예시: PR 문서 최신화 흐름

### 시나리오: 새 API 추가

1. **변경된 파일 확인**
   ```
   backend/.../UserController.java  (새 엔드포인트)
   backend/.../UserService.java
   backend/.../CreateUserRequest.java  (새 DTO)
   backend/.../UserResponse.java  (새 DTO)
   ```

2. **매핑 테이블 참조**
   - Controller 변경 → `backend/user/api.md`
   - DTO 추가 → `backend/user/api.md`

3. **api.md 업데이트**
   ```markdown
   ### 사용자 생성
   POST /api/users

   **Request Body:**
   { "name": "string", "email": "string" }

   **Response (201 Created):**
   { "success": true, "data": { "id": 1, ... } }
   ```

4. **project-specification 업데이트**
   ```markdown
   - [x] USER-001: 사용자 생성 API
   ```

5. **문서 커밋**
   ```bash
   git add docs/
   git commit -m "docs: 사용자 생성 API 문서 추가"
   ```

---

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - AI 작업 가이드
- [project-specification 템플릿](./project-specification.md) - 기획서 템플릿
- [structure/ 가이드](../docs/structure/README.md) - 구조 문서 가이드

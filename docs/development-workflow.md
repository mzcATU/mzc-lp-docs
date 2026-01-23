# 개발 워크플로우 (Development Workflow)

> 작성일: 2026-01-22
> 이슈 생성부터 배포까지 전체 개발 프로세스

---

## 📋 전체 워크플로우

```
[이슈 생성] → [브랜치 생성] → [개발] → [커밋] → [Push] → [PR 생성]
     → [코드 리뷰] → [머지] → [자동 배포]
```

---

## 1️⃣ 이슈 생성

### GitHub Issues 사용

**이슈 템플릿 선택:**
- 🐛 Bug Report
- ✨ Feature Request
- 📝 Documentation
- ♻️ Refactoring

**이슈 작성 예시:**
```markdown
### 설명
사용자가 강의 탐색 페이지에서 카테고리 필터를 선택할 때 정렬 옵션이 초기화되는 문제

### 재현 방법
1. 강의 카탈로그 접속
2. "최신순" 정렬 선택
3. 카테고리 "개발" 선택
4. 정렬이 "인기순"으로 초기화됨

### 예상 동작
카테고리 필터를 변경해도 선택한 정렬 옵션이 유지되어야 함

### 환경
- 브라우저: Chrome 120
- OS: macOS
```

**레이블 추가:**
- `bug`, `feature`, `enhancement`, `documentation`
- `backend`, `frontend`, `database`
- `priority:high`, `priority:medium`, `priority:low`

**담당자 지정:**
- Assignees 설정
- Milestone 설정 (Sprint, Release)

---

## 2️⃣ 브랜치 생성

### 브랜치 네이밍 규칙

```bash
{type}/{issue-number}-{description}
```

**타입:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 수정
- `test`: 테스트 추가/수정
- `chore`: 설정 변경

**예시:**
```bash
git checkout dev
git pull origin dev
git checkout -b feat/123-add-category-filter

# 또는 GitHub CLI
gh issue develop 123 --checkout
```

---

## 3️⃣ 개발

### 컨벤션 준수

#### Backend (Java/Spring)
```java
// ✅ DO
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

    public Course getCourse(Long id) {
        return courseRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("강의를 찾을 수 없습니다"));
    }
}

// ❌ DON'T
public class CourseService {
    @Autowired // Field injection 금지
    private CourseRepository courseRepository;

    public Course getCourse(Long id) throws Exception { // Checked exception 금지
        return courseRepository.findById(id).get(); // NoSuchElementException 위험
    }
}
```

#### Frontend (React/TypeScript)
```typescript
// ✅ DO
interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: number) => void;
}

export function CourseCard({ course, onEnroll }: CourseCardProps) {
  if (!course) return null; // Early return

  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <button onClick={() => onEnroll(course.id)}>수강 신청</button>
    </div>
  );
}

// ❌ DON'T
export function CourseCard({ course, onEnroll }: any) { // any 금지
  return (
    <div>
      {course && ( // Early return 대신 중첩
        <>
          <h3>{course.title}</h3>
          <button onClick={() => onEnroll(course.id)}>수강 신청</button>
        </>
      )}
    </div>
  );
}
```

---

### 테스트 작성

**TDD 권장:**
1. 테스트 먼저 작성 (Red)
2. 최소한의 코드로 테스트 통과 (Green)
3. 리팩토링 (Refactor)

```bash
# Backend 테스트
./gradlew test

# Frontend 테스트
npm run test

# 커버리지 확인
./gradlew jacocoTestReport
npm run test:coverage
```

---

## 4️⃣ 커밋

### 커밋 메시지 규칙

```
[태그] 제목 (#이슈번호)

- 변경사항 1
- 변경사항 2
```

**태그:**
- `[Feat]`: 새로운 기능
- `[Fix]`: 버그 수정
- `[Refactor]`: 리팩토링
- `[Docs]`: 문서 수정
- `[Test]`: 테스트
- `[Chore]`: 설정 변경

**예시:**
```bash
git add .
git commit -m "[Feat] 카테고리 필터 기능 추가 (#123)

- CategoryFilter 컴포넌트 구현
- API 연동 및 상태 관리
- 테스트 코드 작성"
```

**규칙:**
- 제목은 50자 이내
- 명령문 사용 ("추가했다" ❌, "추가" ✅)
- 본문은 72자마다 줄바꿈
- 이슈 번호 필수

---

## 5️⃣ Push & PR 생성

### Push
```bash
git push origin feat/123-add-category-filter
```

### Pull Request 생성

**GitHub CLI:**
```bash
gh pr create \
  --base dev \
  --title "[Feat] 카테고리 필터 기능 추가" \
  --body "Close #123"
```

**PR 템플릿:**
```markdown
## Summary
카테고리 필터 기능을 추가했습니다.

## Related Issue
- Closes #123

## Changes
- CategoryFilter 컴포넌트 구현
- useCourses Hook에 category 파라미터 추가
- API 엔드포인트 수정

## Type of Change
- [x] Feat: 새로운 기능
- [ ] Fix: 버그 수정

## Checklist
- [x] 코드가 컨벤션을 따르고 있습니다
- [x] Self-review를 완료했습니다
- [x] 테스트를 추가/수정했습니다
- [x] 로컬에서 테스트가 통과합니다
```

---

## 6️⃣ 코드 리뷰

### 리뷰어 지정
- 최소 1명의 리뷰어 필수
- 관련 도메인 전문가 포함

### 리뷰 가이드라인

**리뷰어:**
- 코드 로직 검토
- 컨벤션 준수 확인
- 테스트 커버리지 확인
- 성능/보안 이슈 확인

**리뷰 코멘트 예시:**
```markdown
# 개선 제안
이 부분은 `useMemo`를 사용하면 성능이 개선될 것 같습니다.

# 질문
이 함수가 왜 필요한지 설명해주실 수 있나요?

# 버그 발견
null 체크가 누락된 것 같습니다.

# 칭찬
이 리팩토링 깔끔하네요! 👍
```

### 리뷰 반영
```bash
# 피드백 반영
git add .
git commit -m "[Refactor] 코드 리뷰 반영"
git push origin feat/123-add-category-filter
```

---

## 7️⃣ 머지

### 머지 전 체크리스트
- [ ] CI/CD 통과 (테스트, 빌드)
- [ ] 최소 1명의 Approve
- [ ] Conflicts 해결
- [ ] dev 브랜치 최신화

### 머지 방법

**Squash and Merge (기본):**
```bash
# GitHub에서 "Squash and merge" 버튼 클릭
# 커밋 메시지 정리 후 머지
```

**머지 후 정리:**
```bash
# 로컬 브랜치 삭제
git checkout dev
git pull origin dev
git branch -d feat/123-add-category-filter

# 원격 브랜치는 자동 삭제됨 (GitHub 설정)
```

---

## 8️⃣ 배포

### Dev 환경 (자동)
- `dev` 브랜치 머지 시 자동 배포
- GitHub Actions CI/CD

### Production 환경 (수동)
```bash
# main 브랜치로 PR 생성
gh pr create --base main --title "Release v1.0.0"

# 머지 후 태그 생성
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions가 자동으로 Production 배포
```

---

## 🔄 긴급 패치 (Hotfix)

### 프로세스
```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git pull origin main
git checkout -b hotfix/999-critical-bug

# 2. 버그 수정 및 커밋
git commit -m "[Fix] 긴급 버그 수정 (#999)"

# 3. main과 dev 양쪽에 머지
gh pr create --base main --title "[Hotfix] 긴급 버그 수정"
gh pr create --base dev --title "[Hotfix] 긴급 버그 수정"
```

---

## 📊 개발 사이클

### Sprint (2주 단위)
```
Week 1: Mon-Fri
- Mon: Sprint Planning
- Tue-Thu: 개발
- Fri: Code Review

Week 2: Mon-Fri
- Mon-Wed: 개발
- Thu: 테스트 & QA
- Fri: Sprint Review & Retrospective
```

### Daily Standup (매일 10분)
- 어제 한 일
- 오늘 할 일
- 블로커

---

## 🛠️ 유용한 Git 명령어

```bash
# 최근 커밋 수정
git commit --amend

# 커밋 히스토리 정리 (푸시 전)
git rebase -i HEAD~3

# 작업 임시 저장
git stash
git stash pop

# 특정 커밋만 가져오기
git cherry-pick <commit-hash>

# 커밋 되돌리기 (public)
git revert <commit-hash>

# 커밋 되돌리기 (local)
git reset --hard HEAD~1
```

---

## 🚫 금지 사항

### Git
- ❌ `git push --force` (main/dev 브랜치)
- ❌ 대용량 파일 커밋 (> 10MB)
- ❌ 민감 정보 커밋 (.env, 비밀번호)
- ❌ WIP 커밋으로 PR 생성

### 코드
- ❌ 주석으로 코드 비활성화 (삭제할 것)
- ❌ `console.log` 남기기 (디버깅 후 제거)
- ❌ TODO 주석만 남기고 이슈 생성 안 함

---

## 📚 참고 문서

- [Git 브랜치 전략](../README.md#브랜치-전략)
- [PR 템플릿](../.github/PULL_REQUEST_TEMPLATE.md)

---

**최종 업데이트**: 2026-01-22
**버전**: 1.0.0

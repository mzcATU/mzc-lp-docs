# 테스트 가이드 (Testing Guide)

> 작성일: 2026-01-22
> 단위 테스트, 통합 테스트, E2E 테스트 가이드

---

## 📋 테스트 전략

### 테스트 피라미드
```
          /\
         /  \    E2E Tests (10%)
        /____\
       /      \  Integration Tests (30%)
      /________\
     /          \
    /____________\ Unit Tests (60%)
```

### 테스트 범위 목표
- **단위 테스트**: 80% 이상
- **통합 테스트**: 주요 API 엔드포인트 커버
- **E2E 테스트**: 핵심 사용자 플로우

---

## 🧪 Backend 테스트 (Spring Boot)

### 1. 단위 테스트 (Unit Tests)

#### 테스트 구조
```java
@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseService courseService;

    @Test
    @DisplayName("강의 생성 - 성공")
    void createCourse_Success() {
        // Given
        Long designerId = 1L;
        CourseCreateRequest request = CourseCreateRequest.builder()
            .title("React 완벽 가이드")
            .categoryId(1L)
            .level(CourseLevel.INTERMEDIATE)
            .build();

        User designer = User.builder()
            .id(designerId)
            .email("designer@example.com")
            .build();

        when(userRepository.findById(designerId))
            .thenReturn(Optional.of(designer));

        // When
        Course course = courseService.createCourse(designerId, request);

        // Then
        assertThat(course).isNotNull();
        assertThat(course.getTitle()).isEqualTo("React 완벽 가이드");
        assertThat(course.getDesigner()).isEqualTo(designer);

        verify(courseRepository, times(1)).save(any(Course.class));
    }

    @Test
    @DisplayName("강의 생성 - 설계자 없음 (실패)")
    void createCourse_DesignerNotFound() {
        // Given
        Long designerId = 999L;
        CourseCreateRequest request = CourseCreateRequest.builder()
            .title("React 완벽 가이드")
            .build();

        when(userRepository.findById(designerId))
            .thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> courseService.createCourse(designerId, request))
            .isInstanceOf(NotFoundException.class)
            .hasMessage("사용자를 찾을 수 없습니다");
    }
}
```

#### 실행
```bash
# 전체 테스트
./gradlew test

# 특정 테스트 클래스
./gradlew test --tests CourseServiceTest

# 특정 테스트 메서드
./gradlew test --tests CourseServiceTest.createCourse_Success

# 커버리지 리포트 생성
./gradlew test jacocoTestReport

# 리포트 확인
open build/reports/jacoco/test/html/index.html
```

---

### 2. 통합 테스트 (Integration Tests)

#### Repository 테스트
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CourseRepositoryTest {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("강의 조회 - Fetch Join")
    void findByIdWithDesigner() {
        // Given
        User designer = User.builder()
            .email("designer@example.com")
            .name("김설계")
            .build();
        entityManager.persist(designer);

        Course course = Course.builder()
            .title("React 완벽 가이드")
            .designer(designer)
            .build();
        entityManager.persist(course);
        entityManager.flush();
        entityManager.clear();

        // When
        Optional<Course> found = courseRepository.findByIdWithDesigner(course.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getDesigner().getName()).isEqualTo("김설계");
        // N+1 문제 없이 한 번의 쿼리로 조회
    }
}
```

#### API 테스트 (MockMvc)
```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CourseApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CourseService courseService;

    @Test
    @DisplayName("강의 목록 조회 API")
    void getCourses() throws Exception {
        // Given
        List<CourseListResponse> courses = List.of(
            CourseListResponse.builder()
                .id(1L)
                .title("React 완벽 가이드")
                .build()
        );

        when(courseService.getCourses(any(), any()))
            .thenReturn(new PageImpl<>(courses));

        // When & Then
        mockMvc.perform(get("/api/courses")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content").isArray())
            .andExpect(jsonPath("$.data.content[0].title").value("React 완벽 가이드"))
            .andDo(print());
    }

    @Test
    @DisplayName("강의 생성 API - 인증 필요")
    @WithMockUser(roles = "DESIGNER")
    void createCourse_WithAuth() throws Exception {
        // Given
        CourseCreateRequest request = CourseCreateRequest.builder()
            .title("Python 데이터 분석")
            .categoryId(2L)
            .level(CourseLevel.BEGINNER)
            .build();

        Course created = Course.builder()
            .id(10L)
            .title("Python 데이터 분석")
            .build();

        when(courseService.createCourse(any(), any()))
            .thenReturn(created);

        // When & Then
        mockMvc.perform(post("/api/courses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(10))
            .andDo(print());
    }
}
```

#### 실행
```bash
./gradlew integrationTest
```

---

### 3. 테스트 데이터 관리

#### data.sql (테스트용)
```sql
-- src/test/resources/data.sql
INSERT INTO tenants (id, name, domain, status) VALUES (1, 'Test Tenant', 'test', 'ACTIVE');
INSERT INTO users (id, tenant_id, email, password, name, status) VALUES
    (1, 1, 'user@test.com', '$2a$10$...', '테스트 사용자', 'ACTIVE'),
    (2, 1, 'designer@test.com', '$2a$10$...', '테스트 설계자', 'ACTIVE');
INSERT INTO user_roles (tenant_id, user_id, role_type) VALUES
    (1, 1, 'USER'),
    (1, 2, 'DESIGNER');
```

#### Test Fixtures
```java
public class TestFixtures {

    public static User createUser(String email) {
        return User.builder()
            .email(email)
            .password("password123")
            .name("테스트 사용자")
            .status(UserStatus.ACTIVE)
            .build();
    }

    public static Course createCourse(User designer) {
        return Course.builder()
            .title("테스트 강의")
            .designer(designer)
            .status(CourseStatus.ACTIVE)
            .build();
    }
}
```

---

## ⚛️ Frontend 테스트 (React + Vitest)

### 1. 컴포넌트 테스트

#### 설정 (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

#### 테스트 작성
```typescript
// CourseCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  const mockCourse = {
    id: 1,
    title: 'React 완벽 가이드',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    level: 'INTERMEDIATE',
    price: 50000,
  };

  it('강의 정보를 올바르게 표시한다', () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.getByText('React 완벽 가이드')).toBeInTheDocument();
    expect(screen.getByText('50,000원')).toBeInTheDocument();
    expect(screen.getByText('중급')).toBeInTheDocument();
  });

  it('클릭 시 상세 페이지로 이동한다', () => {
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate,
    }));

    render(<CourseCard course={mockCourse} />);

    fireEvent.click(screen.getByRole('button', { name: /자세히 보기/ }));

    expect(mockNavigate).toHaveBeenCalledWith(`/courses/${mockCourse.id}`);
  });
});
```

#### 실행
```bash
# 전체 테스트
npm run test

# Watch 모드
npm run test:watch

# 커버리지
npm run test:coverage
```

---

### 2. Hook 테스트

```typescript
// useCourses.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCourses } from './useCourses';
import { vi } from 'vitest';

describe('useCourses', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('강의 목록을 가져온다', async () => {
    const mockData = {
      content: [{ id: 1, title: 'React 완벽 가이드' }],
      totalElements: 1,
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData }),
    });

    const { result } = renderHook(() => useCourses(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });
});
```

---

## 🌐 E2E 테스트 (Playwright)

### 1. 설정

```bash
npm install -D @playwright/test
npx playwright install
```

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

### 2. 테스트 작성

```typescript
// e2e/enrollment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('수강 신청 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('강의 탐색 → 수강 신청 → 완료', async ({ page }) => {
    // 1. 강의 탐색
    await page.goto('/catalog');
    await expect(page.locator('h1')).toContainText('강의 카탈로그');

    // 2. 강의 선택
    await page.click('text=React 완벽 가이드');
    await page.waitForURL(/\/courses\/\d+/);

    // 3. 차수 선택
    await page.click('text=2026년 1기');
    await page.click('button:has-text("수강 신청")');

    // 4. 확인 모달
    await expect(page.locator('.modal')).toBeVisible();
    await page.click('button:has-text("확인")');

    // 5. 완료 확인
    await expect(page.locator('text=수강 신청이 완료되었습니다')).toBeVisible();
  });

  test('정원 마감 시 신청 불가', async ({ page }) => {
    await page.goto('/courses/999'); // 정원 마감된 강의
    await page.click('button:has-text("수강 신청")');

    await expect(page.locator('text=정원이 마감되었습니다')).toBeVisible();
  });
});
```

#### 실행
```bash
# E2E 테스트 실행
npx playwright test

# UI 모드 (디버깅)
npx playwright test --ui

# 특정 브라우저만
npx playwright test --project=chromium
```

---

## 📊 테스트 커버리지

### Backend (JaCoCo)
```xml
<!-- build.gradle -->
test {
    finalizedBy jacocoTestReport
}

jacoco {
    toolVersion = "0.8.10"
}

jacocoTestReport {
    reports {
        html.required = true
        xml.required = true
    }
}
```

### Frontend (Vitest)
```json
// package.json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 🎯 테스트 작성 가이드

### DO ✅
- 테스트는 독립적으로 실행 가능해야 함
- Given-When-Then 패턴 사용
- 의미 있는 테스트명 작성
- 1개 테스트 = 1개 검증
- Mock은 최소화

### DON'T ❌
- 테스트 간 의존성 생성
- 하드코딩된 값 사용 (날짜, ID 등)
- 실제 외부 API 호출
- Thread.sleep() 사용

---

## 🚀 CI/CD 통합

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '21'
      - name: Run tests
        run: ./gradlew test jacocoTestReport
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./build/reports/jacoco/test/jacocoTestReport.xml

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:coverage
```

---

**최종 업데이트**: 2026-01-22
**버전**: 1.0.0

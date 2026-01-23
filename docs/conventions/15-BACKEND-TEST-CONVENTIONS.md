# 15. Backend Test Conventions

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> Backend 테스트 규칙 (JUnit5, MockMvc, Given-When-Then 패턴)

---

## 언제 이 문서를 보는가?

| 상황 | 참조 섹션 |
|------|----------|
| 테스트 레이어 선택? | 테스트 레이어 분류 |
| Controller 테스트? | Controller Test |
| Service 테스트? | Service Test |
| Given-When-Then? | 패턴 섹션 |

---

## 테스트 레이어 분류

| 레이어 | 애노테이션 | 용도 |
|--------|-----------|------|
| Controller | `@WebMvcTest` | MockMvc, 웹 레이어만 |
| Service | `@ExtendWith(MockitoExtension.class)` | 단위 테스트 |
| Repository | `@DataJpaTest` | JPA, H2 |
| Integration | `@SpringBootTest` | 전체 컨텍스트 |

---

## Controller Test

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("사용자 목록 조회")
    void getUserList() throws Exception {
        // given
        List<UserResponse> users = List.of(
            new UserResponse(1L, "John", "john@example.com")
        );
        given(userService.findAll()).willReturn(users);

        // when & then
        mockMvc.perform(get("/api/users")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].name").value("John"));
    }

    @Test
    @DisplayName("사용자 생성 - 201 Created")
    void createUser() throws Exception {
        // given
        UserResponse response = new UserResponse(1L, "John", "john@example.com");
        given(userService.create(any())).willReturn(response);

        // when & then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "John", "email": "john@example.com"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L));
    }
}
```

---

## Service Test

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserServiceImpl userService;

    @Mock
    private UserRepository userRepository;

    @Test
    @DisplayName("ID로 사용자 조회")
    void findById() {
        // given
        User user = User.create("John", "john@example.com");
        given(userRepository.findById(1L)).willReturn(Optional.of(user));

        // when
        UserResponse result = userService.findById(1L);

        // then
        assertThat(result.name()).isEqualTo("John");
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("존재하지 않는 사용자 - 예외 발생")
    void findByIdNotFound() {
        // given
        given(userRepository.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.findById(999L))
            .isInstanceOf(UserNotFoundException.class);
    }
}
```

---

## Repository Test

```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("이메일로 사용자 조회")
    void findByEmail() {
        // given
        User user = User.create("John", "john@example.com");
        userRepository.save(user);

        // when
        Optional<User> result = userRepository.findByEmail("john@example.com");

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("John");
    }
}
```

---

## Given-When-Then 패턴

```java
@Test
void testExample() {
    // given (준비)
    User user = User.create("John", "john@example.com");
    given(userRepository.findById(1L)).willReturn(Optional.of(user));

    // when (실행)
    UserResponse result = userService.findById(1L);

    // then (검증)
    assertThat(result.name()).isEqualTo("John");
    verify(userRepository).findById(1L);
}
```

---

## 테스트 네이밍

```java
// ✅ @DisplayName 사용 (한글 권장)
@Test
@DisplayName("사용자 생성 시 이메일 중복이면 예외 발생")
void createUserWithDuplicateEmail() { }

// ✅ 메서드명: 동사_조건_결과
@Test
void createUser_WhenEmailDuplicated_ThrowsException() { }
```

---

## 공통 규칙

```
✅ 각 테스트는 독립적으로 실행 가능
✅ 테스트 간 데이터 공유 금지
✅ 하나의 테스트, 하나의 검증
✅ 의미 있는 실패 메시지
```

```java
// ✅ 명확한 메시지
assertThat(user.getEmail())
    .as("사용자 이메일은 john@example.com이어야 함")
    .isEqualTo("john@example.com");
```

---

## 자주 하는 실수

### ❌ Bad

```java
// 1. 테스트 간 데이터 공유
@BeforeAll
static void setup() {
    sharedUser = new User("John");  // 다른 테스트에 영향
}

// 2. 여러 검증을 하나의 테스트에
@Test
void testUser() {
    // 생성, 수정, 삭제를 한 테스트에서 검증 → 실패 시 원인 파악 어려움
}

// 3. Mock 검증 누락
@Test
void findById() {
    given(userRepository.findById(1L)).willReturn(Optional.of(user));
    userService.findById(1L);
    // verify() 누락 → 실제로 호출됐는지 확인 안함
}

// 4. 실제 외부 서비스 호출
@Test
void sendEmail() {
    emailService.send(user.getEmail());  // 실제 메일 발송됨!
}

// 5. @DisplayName 미사용
@Test
void test1() { }  // 무슨 테스트인지 알 수 없음
```

### ✅ Good

```java
// 1. 각 테스트에서 독립적으로 데이터 생성
@Test
void findById() {
    User user = User.create("John", "john@example.com");
    // ...
}

// 2. 하나의 테스트, 하나의 검증
@Test
@DisplayName("사용자 생성")
void createUser() { }

@Test
@DisplayName("사용자 수정")
void updateUser() { }

// 3. Mock 검증 포함
@Test
void findById() {
    given(userRepository.findById(1L)).willReturn(Optional.of(user));
    userService.findById(1L);
    verify(userRepository).findById(1L);  // 호출 검증
}

// 4. 외부 서비스 Mock 처리
@MockBean
private EmailService emailService;

// 5. 명확한 DisplayName
@Test
@DisplayName("이메일 중복 시 UserDuplicateException 발생")
void createUser_WhenEmailDuplicated_ThrowsException() { }
```

---

## 참고 자료

- [Spring Boot Testing Guide](https://spring.io/guides/gs/testing-web/)
- [Baeldung Spring Testing](https://www.baeldung.com/spring-boot-testing)

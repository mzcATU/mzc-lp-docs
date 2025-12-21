# 23. Multi-Tenancy 구현 컨벤션

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> 멀티테넌시 구현 시 코드 패턴 가이드
> **개요/설계 → [multi-tenancy.md](../docs/context/multi-tenancy.md)**

---

## 언제 참조?

```
✅ 테넌트 관련 Entity/Service/Controller 작성 시
✅ Frontend 테넌트 Provider 구현 시
✅ 데이터 격리 로직 작성 시
```

---

## 1. Backend - 테넌트 컨텍스트

### TenantContext

```java
public class TenantContext {
    private static final ThreadLocal<Long> currentTenantId = new ThreadLocal<>();

    public static void setTenantId(Long tenantId) { currentTenantId.set(tenantId); }
    public static Long getTenantId() { return currentTenantId.get(); }
    public static void clear() { currentTenantId.remove(); }
}
```

### TenantFilter

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {
    private final TenantRepository tenantRepository;
    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            TenantContext.setTenantId(resolveTenantId(request));
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private Long resolveTenantId(HttpServletRequest request) {
        // 1. JWT Claim
        String token = resolveToken(request);
        if (token != null && jwtProvider.validateToken(token)) {
            Long tenantId = jwtProvider.getTenantId(token);
            if (tenantId != null) return tenantId;
        }
        // 2. Subdomain
        String host = request.getServerName();
        String subdomain = host.split("\\.")[0];
        return tenantRepository.findBySubdomain(subdomain)
            .map(Tenant::getId).orElse(null);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        return (bearer != null && bearer.startsWith("Bearer ")) ? bearer.substring(7) : null;
    }
}
```

---

## 2. Backend - 데이터 격리

### TenantEntity (기본 클래스)

```java
@MappedSuperclass
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "tenantId", type = Long.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class TenantEntity extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @PrePersist
    public void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContext.getTenantId();
        }
    }
    // Setter 금지
}
```

### TenantAspect (자동 필터)

```java
@Aspect
@Component
@RequiredArgsConstructor
public class TenantAspect {
    private final EntityManager entityManager;

    @Before("execution(* com.example..repository.*Repository.*(..))")
    public void enableTenantFilter() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            entityManager.unwrap(Session.class)
                .enableFilter("tenantFilter")
                .setParameter("tenantId", tenantId);
        }
    }
}
```

### 적용 예시

```java
@Entity
public class Course extends TenantEntity {  // tenant_id 자동 상속
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
}
```

---

## 3. Backend - Tenant Entity

```java
@Entity
@Table(name = "tenants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Tenant extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;
    private String name;
    private String subdomain;

    @Enumerated(EnumType.STRING)
    private TenantStatus status = TenantStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private PlanType plan = PlanType.FREE;

    public static Tenant create(String code, String name, String subdomain) {
        Tenant t = new Tenant();
        t.code = code; t.name = name; t.subdomain = subdomain;
        return t;
    }

    public void approve() { this.status = TenantStatus.ACTIVE; }
    public void suspend() { this.status = TenantStatus.SUSPENDED; }
}

public enum TenantStatus { PENDING, ACTIVE, SUSPENDED, INACTIVE, TERMINATED }
public enum PlanType { FREE, BASIC, PRO, ENTERPRISE }
```

---

## 4. Backend - Service 계층

```java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TenantService {
    private final TenantRepository tenantRepository;

    public Tenant findById(Long id) {
        return tenantRepository.findById(id)
            .orElseThrow(() -> new TenantNotFoundException(id));
    }

    @Transactional
    public Tenant create(CreateTenantRequest request) {
        if (tenantRepository.existsBySubdomain(request.subdomain())) {
            throw new DuplicateSubdomainException(request.subdomain());
        }
        return tenantRepository.save(
            Tenant.create(request.code(), request.name(), request.subdomain())
        );
    }

    @Transactional
    public void approve(Long id) {
        findById(id).approve();
    }
}
```

---

## 5. Backend - 권한 검증

### 역할 Enum

```java
// 시스템 레벨
public enum SystemRole {
    SUPER_ADMIN     // 플랫폼 전체 관리 (MZC 내부)
}

// 테넌트 레벨
public enum TenantRole {
    TENANT_ADMIN,       // 테넌트 최고 관리자

    // B2C/KPOP
    OPERATOR,           // 운영자
    USER,               // 일반 사용자

    // B2B 전용
    TENANT_OPERATOR,    // 테넌트 운영자 (조직/유저/강의/학습현황 관리)
    MEMBER              // 일반 직원
}

// 강의 레벨 (모든 플랫폼 공통)
public enum CourseRole {
    OWNER,              // 강의 생성자
    INSTRUCTOR          // 강사 (피드백 제공)
}
```

### Security 어노테이션

```java
@PreAuthorize("hasRole('SYSTEM_ADMIN')")              // System Admin 전용
@PreAuthorize("hasRole('TENANT_ADMIN')")             // Tenant Admin 전용
@PreAuthorize("hasAnyRole('TENANT_ADMIN', 'TENANT_OPERATOR')")  // 둘 다 허용
@PreAuthorize("@tenantSecurity.belongsTo(#tenantId)")           // 소속 확인
```

### TenantSecurity

```java
@Service
public class TenantSecurity {
    public boolean belongsTo(Long tenantId) {
        Long current = TenantContext.getTenantId();
        return current != null && current.equals(tenantId);
    }
}
```

---

## 6. Frontend - 테넌트 Provider

### Types & Provider

```typescript
const TenantContext = createContext<TenantConfig | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);

  useEffect(() => {
    const subdomain = window.location.hostname.split('.')[0];
    api.get(`/api/tenants/by-subdomain/${subdomain}`).then(res => setTenant(res.data));
  }, []);

  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
};

export const useTenant = () => useContext(TenantContext);
```

---

## 7. Frontend - 동적 테마/네이밍

### useTheme

```typescript
export const useTheme = () => {
  const tenant = useTenant();
  useEffect(() => {
    if (!tenant?.branding?.theme) return;
    const { primaryColor, backgroundColor, fontFamily } = tenant.branding.theme;
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-bg', backgroundColor);
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [tenant]);
};
```

### useNaming

```typescript
export const useNaming = () => {
  const tenant = useTenant();
  const t = (key: keyof TenantNaming, fallback: string) => tenant?.naming?.[key] || fallback;
  return { t };
};
// 사용: const { t } = useNaming(); → {t('course', '강의')}
```

---

## 8. 체크리스트

| Backend | Frontend |
|---------|----------|
| `TenantEntity` 상속 | `useTenant()` 훅 |
| `@PreAuthorize` 권한 검증 | `useNaming()` 동적 텍스트 |
| 크로스 테넌트 접근 방지 | CSS 변수 테마 적용 |

---

**관련**: [multi-tenancy.md](../context/multi-tenancy.md) (개요) · [06-ENTITY](./06-ENTITY-CONVENTIONS.md) · [20-SECURITY](./20-SECURITY-CONVENTIONS.md)

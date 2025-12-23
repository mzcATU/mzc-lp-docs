# 12. React Component Conventions

> 📌 **먼저 읽기**: [10-REACT-TYPESCRIPT-CORE.md](./10-REACT-TYPESCRIPT-CORE.md)

> React 컴포넌트 작성 규칙 (Props, 이벤트, 조건부 렌더링, 성능 최적화)

---

## 언제 이 문서를 보는가?

| 상황 | 참조 섹션 |
|------|----------|
| 컴포넌트 작성? | 섹션 1 템플릿 |
| Props 정의? | 섹션 2 |
| 이벤트 핸들링? | 섹션 3 |
| 조건부 렌더링? | 섹션 4 |
| 성능 최적화? | 섹션 5 |

---

## 1. 컴포넌트 템플릿

```typescript
// Import
import { useState, useEffect } from 'react';
import type { User } from '@/types/user.types';

// Types
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

// Component
export const UserCard = ({ user, onEdit }: UserCardProps) => {
  // State
  const [isExpanded, setIsExpanded] = useState(false);

  // Effects
  useEffect(() => {
    // side effects
  }, [user.id]);

  // Handlers
  const handleEdit = () => {
    if (onEdit) onEdit(user);
  };

  // Early return
  if (!user) return null;

  // JSX
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && <button onClick={handleEdit}>Edit</button>}
    </div>
  );
};
```

---

## 2. Props 관리

```typescript
// ✅ Interface로 정의
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

// ✅ 기본값 설정
export const Button = ({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
}: ButtonProps) => {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ✅ Rest props 전달
type ButtonProps = {
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ children, ...rest }: ButtonProps) => {
  return <button {...rest}>{children}</button>;
};
```

---

## 3. 조건부 렌더링

```typescript
// ✅ Early return
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <div>{data}</div>;

// ✅ 삼항 연산자
{isLoggedIn ? <UserMenu /> : <LoginButton />}

// ✅ && 연산자
{hasError && <ErrorMessage />}
{items.length > 0 && <ItemList items={items} />}
```

---

## 4. 리스트 렌더링

```typescript
// ✅ 고유한 key 사용
{users.map(user => (
  <UserCard key={user.id} user={user} />
))}

// ✅ Fragment에도 key
{users.map(user => (
  <React.Fragment key={user.id}>
    <UserCard user={user} />
    <UserActions user={user} />
  </React.Fragment>
))}

// ✅ 빈 배열 처리
{users.length > 0 ? (
  users.map(user => <UserCard key={user.id} user={user} />)
) : (
  <EmptyState />
)}
```

---

## 5. 이벤트 핸들러

```typescript
// ✅ 네이밍
const handleClick = () => { };
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
};

// ✅ 타입 명시
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSubmit();
  }
};

// ✅ 인라인 vs 함수
<button onClick={() => setCount(count + 1)}>+</button>  // 간단한 로직
<button onClick={handleComplexLogic}>Submit</button>   // 복잡한 로직
```

---

## 6. Compound Components 패턴

```typescript
// Tabs 예시
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export const Tabs = ({ children }: { children: React.ReactNode }) => {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.TabList = ({ children }: { children: React.ReactNode }) => {
  return <div className="tab-list">{children}</div>;
};

Tabs.Tab = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  return (
    <button onClick={() => context.setActiveTab(id)}>
      {children}
    </button>
  );
};

// 사용
<Tabs>
  <Tabs.TabList>
    <Tabs.Tab id="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab id="tab2">Tab 2</Tabs.Tab>
  </Tabs.TabList>
</Tabs>
```

---

## 7. 성능 최적화

```typescript
// ✅ React.memo (Props 변경 없으면 리렌더링 방지)
export const UserCard = React.memo(({ user }: UserCardProps) => {
  return <div>{user.name}</div>;
});

// ✅ useMemo (비용 큰 계산)
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ useCallback (함수 메모이제이션)
const handleClick = useCallback(() => {
  // logic
}, []);

// ⚠️ 주의: 필요한 경우에만 사용
```


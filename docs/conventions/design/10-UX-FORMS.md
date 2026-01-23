# 10. UX Forms

> 폼 패턴 가이드 - 필드 배치, 유효성 검사, 단계별 폼

---

## 핵심 규칙

```
✅ 필수 필드 명확히 표시 (* 마크)
✅ 실시간 유효성 검사 (blur 또는 변경 시)
✅ 명확한 에러 메시지 + 해결 방법 제시
✅ 제출 중 버튼 비활성화 + 로딩 표시
✅ 성공/실패 피드백 제공
```

---

## 1. 폼 레이아웃

### 1.1 기본 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  [폼 제목]                                                  │
│  ─────────────────────────────────────────────────────────│
│                                                             │
│  필드 라벨 *                          필드 라벨            │
│  ┌────────────────────────┐          ┌────────────────────┐│
│  │                        │          │                    ││
│  └────────────────────────┘          └────────────────────┘│
│                                                             │
│  필드 라벨 *                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [ 취소 ]  [ 저장 ]             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 필드 배치 규칙

| 규칙 | 설명 |
|------|------|
| 짧은 필드 | 2열 그리드 (이름, 이메일) |
| 긴 필드 | 전체 너비 (설명, 내용) |
| 관련 필드 | 그룹핑 (주소, 연락처) |
| 논리적 순서 | 위에서 아래, 왼쪽에서 오른쪽 |

```tsx
<form className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* 2열 배치 */}
  <FormField label="이름" required />
  <FormField label="이메일" required />

  {/* 전체 너비 */}
  <FormField label="설명" className="md:col-span-2" />

  {/* 그룹핑 */}
  <fieldset className="md:col-span-2">
    <legend>연락처 정보</legend>
    <div className="grid grid-cols-2 gap-4">
      <FormField label="전화번호" />
      <FormField label="팩스" />
    </div>
  </fieldset>
</form>
```

---

## 2. 필드 컴포넌트

### 2.1 라벨과 필드

```
┌─────────────────────────────────────────────────────────────┐
│  라벨 *                                      (도움말 아이콘) │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Placeholder 텍스트...                                  ││
│  └─────────────────────────────────────────────────────────┘│
│  힌트 텍스트 (선택)                                         │
└─────────────────────────────────────────────────────────────┘
```

```tsx
interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, hint, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm font-medium">
        {label}
        {required && <span className="text-status-error">*</span>}
      </label>

      {children}

      {hint && !error && (
        <p className="text-xs text-text-tertiary">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-status-error flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
```

### 2.2 필드 상태

```
┌─────────────────────────────────────────────────────────────┐
│  [Default]           [Focus]            [Error]             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │              │   │              │   │              │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│   border-border     ring-2 ring-brand  border-error        │
│                                                             │
│  [Disabled]          [Readonly]         [Success]          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │  ░░░░░░░░░░  │   │   읽기 전용   │   │            ✓│    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│   bg-gray-100        bg-gray-50        border-success      │
│   cursor-not-allowed                                        │
└─────────────────────────────────────────────────────────────┘
```

```tsx
const inputVariants = cva(
  'w-full px-3 py-2 border rounded-md transition-colors',
  {
    variants: {
      state: {
        default: 'border-border focus:ring-2 focus:ring-btn-brand focus:border-transparent',
        error: 'border-status-error focus:ring-2 focus:ring-status-error',
        success: 'border-status-success',
        disabled: 'bg-gray-100 cursor-not-allowed opacity-60',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);
```

---

## 3. 유효성 검사

### 3.1 검사 시점

| 시점 | 용도 | 구현 |
|------|------|------|
| **onChange** | 실시간 피드백 | 입력할 때마다 검사 |
| **onBlur** | 필드 이탈 시 | 포커스 나갈 때 검사 (권장) |
| **onSubmit** | 제출 시 | 전체 폼 검사 |

```tsx
// react-hook-form + zod
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur',        // 권장: blur 시 검사
  // mode: 'onChange',   // 실시간 검사
  // mode: 'onSubmit',   // 제출 시만 검사
});
```

### 3.2 검사 규칙 스키마

```tsx
// src/schemas/courseSchema.ts
import { z } from 'zod';

export const courseSchema = z.object({
  courseName: z
    .string()
    .min(1, '강의명을 입력해주세요')
    .max(100, '강의명은 100자 이하이어야 합니다'),

  description: z
    .string()
    .max(1000, '설명은 1000자 이하이어야 합니다')
    .optional(),

  instructorId: z
    .number({ required_error: '강사를 선택해주세요' })
    .positive('강사를 선택해주세요'),

  startDate: z
    .date({ required_error: '시작일을 선택해주세요' }),

  endDate: z
    .date({ required_error: '종료일을 선택해주세요' }),

  maxStudents: z
    .number()
    .min(1, '최소 1명 이상이어야 합니다')
    .max(1000, '최대 1000명까지 가능합니다')
    .optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: '종료일은 시작일 이후여야 합니다',
    path: ['endDate'],
  }
);

export type CourseFormData = z.infer<typeof courseSchema>;
```

### 3.3 서버 에러 처리

```tsx
const onSubmit = async (data: CourseFormData) => {
  try {
    await createCourse(data);
    toast.success('강의가 생성되었습니다.');
    navigate('/courses');
  } catch (error) {
    if (error.response?.status === 400) {
      // 서버 유효성 에러 → 해당 필드에 에러 설정
      const serverErrors = error.response.data.errors;
      Object.keys(serverErrors).forEach((field) => {
        form.setError(field as keyof CourseFormData, {
          type: 'server',
          message: serverErrors[field],
        });
      });
    } else if (error.response?.status === 409) {
      // 중복 에러
      form.setError('courseName', {
        type: 'server',
        message: '동일한 이름의 강의가 이미 존재합니다.',
      });
    } else {
      toast.error('저장에 실패했습니다.');
    }
  }
};
```

---

## 4. 제출 처리

### 4.1 제출 버튼 상태

```
┌─────────────────────────────────────────────────────────────┐
│  [Default]              [Loading]             [Disabled]    │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────┐│
│  │     저장       │    │  ◌ 저장 중...  │    │    저장    ││
│  └────────────────┘    └────────────────┘    └────────────┘│
│   활성 상태            로딩 + 비활성화        비활성 상태   │
└─────────────────────────────────────────────────────────────┘
```

```tsx
<Button
  type="submit"
  disabled={isSubmitting || !isValid}
>
  {isSubmitting ? (
    <>
      <Spinner className="w-4 h-4 mr-2" />
      저장 중...
    </>
  ) : (
    '저장'
  )}
</Button>
```

### 4.2 취소 확인

```tsx
const handleCancel = () => {
  if (isDirty) {
    // 변경사항이 있으면 확인
    const confirmed = window.confirm(
      '변경사항이 저장되지 않았습니다. 페이지를 나가시겠습니까?'
    );
    if (!confirmed) return;
  }
  navigate(-1);
};

// 또는 AlertDialog 사용
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost">취소</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>변경사항 취소</AlertDialogTitle>
      <AlertDialogDescription>
        변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>계속 작성</AlertDialogCancel>
      <AlertDialogAction onClick={() => navigate(-1)}>
        나가기
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 5. 단계별 폼 (Wizard)

### 5.1 와이어프레임

```
┌─────────────────────────────────────────────────────────────┐
│  강의 만들기                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ●────────○────────○────────○                               │
│  기본정보   강사선택   일정설정   완료                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [현재 단계 폼 콘텐츠]                                       │
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [ 이전 ]                              [ 다음 ] 또는 [ 완료 ]│
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Step Indicator

```
┌─────────────────────────────────────────────────────────────┐
│  [Completed]        [Current]         [Upcoming]            │
│       ●──────────────●──────────────────○                   │
│    기본정보        강사선택            일정설정              │
│    (체크 아이콘)   (브랜드 색상)       (회색)                │
└─────────────────────────────────────────────────────────────┘
```

```tsx
interface Step {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              step.status === 'completed' && 'bg-status-success text-white',
              step.status === 'current' && 'bg-btn-brand text-white',
              step.status === 'upcoming' && 'bg-gray-200 text-gray-500',
            )}>
              {step.status === 'completed' ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="mt-1 text-xs">{step.label}</span>
          </div>

          {index < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-2',
              step.status === 'completed' ? 'bg-status-success' : 'bg-gray-200'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

### 5.3 단계별 유효성 검사

```tsx
// 단계별 스키마 분리
const step1Schema = z.object({
  courseName: z.string().min(1, '강의명을 입력해주세요'),
  description: z.string().optional(),
});

const step2Schema = z.object({
  instructorId: z.number().positive('강사를 선택해주세요'),
});

const step3Schema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

// 단계별 검사
const validateCurrentStep = async () => {
  const schemas = [step1Schema, step2Schema, step3Schema];
  const currentSchema = schemas[currentStep];

  try {
    await currentSchema.parseAsync(form.getValues());
    return true;
  } catch (error) {
    // 에러 표시
    return false;
  }
};

const handleNext = async () => {
  const isValid = await validateCurrentStep();
  if (isValid) {
    setCurrentStep(prev => prev + 1);
  }
};
```

---

## 6. 특수 필드 패턴

### 6.1 검색 필드

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔍│  검색어 입력...                               [X]  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
  <input
    type="search"
    placeholder="검색어 입력..."
    className="pl-10 pr-10"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {searchTerm && (
    <button
      className="absolute right-3 top-1/2 -translate-y-1/2"
      onClick={() => setSearchTerm('')}
    >
      <X className="w-4 h-4" />
    </button>
  )}
</div>
```

### 6.2 비밀번호 필드

```
┌─────────────────────────────────────────────────────────────┐
│  비밀번호 *                                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ••••••••                                           [👁] ││
│  └─────────────────────────────────────────────────────────┘│
│  영문, 숫자, 특수문자 포함 8자 이상                          │
└─────────────────────────────────────────────────────────────┘
```

```tsx
function PasswordInput({ ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
```

### 6.3 파일 업로드 필드

```
┌─────────────────────────────────────────────────────────────┐
│  첨부파일                                                   │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐│
│  │                                                         ││
│  │     📎 파일을 드래그하거나 클릭하여 업로드              ││
│  │        PDF, DOC, XLSX (최대 10MB)                       ││
│  │                                                         ││
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📄 document.pdf                    2.3MB         [X]    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 체크리스트

### 폼 구현 시

- [ ] 필수 필드 표시 (*)
- [ ] 적절한 유효성 검사 시점 선택
- [ ] 명확한 에러 메시지
- [ ] 서버 에러 처리
- [ ] 제출 중 로딩 표시
- [ ] 취소 시 확인 다이얼로그
- [ ] 성공/실패 피드백
- [ ] 반응형 레이아웃

### 접근성 체크

- [ ] 라벨과 필드 연결 (htmlFor/id)
- [ ] 에러 메시지 연결 (aria-describedby)
- [ ] 필수 필드 표시 (aria-required)
- [ ] 에러 상태 표시 (aria-invalid)
- [ ] 키보드 탐색 가능

---

## 관련 문서

- [03-UX-PATTERNS](./03-UX-PATTERNS.md) - 폼 제출 플로우
- [05-UX-COMPONENTS](./05-UX-COMPONENTS.md) - 폼 컴포넌트 UX
- [08-UX-ACCESSIBILITY](./08-UX-ACCESSIBILITY.md) - 폼 접근성
- [09-UX-ERROR-MESSAGES](./09-UX-ERROR-MESSAGES.md) - 유효성 검사 에러

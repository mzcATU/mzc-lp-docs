# 25. I18N Conventions (다국어 지원)

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> 다국어 지원 구현 규칙 (Backend MessageSource, Frontend i18next, 번역 키 네이밍)

---

## 빠른 탐색

| 섹션 | 내용 |
|------|------|
| [핵심 규칙](#핵심-규칙) | 5가지 필수 i18n 규칙 |
| [지원 언어](#지원-언어) | ko, en |
| [Backend](#backend-i18n) | Spring MessageSource |
| [Frontend](#frontend-i18n) | i18next + react-i18next |
| [번역 키 네이밍](#번역-키-네이밍-컨벤션) | 일관된 키 패턴 |
| [적용 범위](#적용-범위) | 다국어화 대상/제외 |

---

## 핵심 규칙

```
✅ 사용자 메시지 → 반드시 다국어 처리
✅ 로그/내부 메시지 → 영어 고정 (다국어 제외)
✅ 번역 키 → 도메인.카테고리.항목 패턴
✅ Accept-Language → HTTP 헤더로 언어 전달
✅ Fallback → 영어(en) 기본
```

---

## 지원 언어

| 코드 | 언어 | 역할 |
|------|------|------|
| `ko` | 한국어 | 기본 언어 |
| `en` | 영어 | Fallback 언어 |

---

## Backend I18N

### 파일 구조

```
backend/src/main/resources/
├── messages.properties          # Fallback (영어)
├── messages_en.properties       # 영어
└── messages_ko.properties       # 한국어
```

### MessageSource 설정

```java
@Configuration
public class I18nConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding("UTF-8");
        source.setUseCodeAsDefaultMessage(true);
        source.setCacheSeconds(3600);  // 운영: 3600, 개발: 0
        return source;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.KOREAN);
        resolver.setSupportedLocales(List.of(Locale.KOREAN, Locale.ENGLISH));
        return resolver;
    }
}
```

### MessageService 유틸

```java
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageSource messageSource;

    public String get(String code, Object... args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }

    public String getOrDefault(String code, String defaultMsg, Object... args) {
        try {
            return get(code, args);
        } catch (NoSuchMessageException e) {
            return defaultMsg;
        }
    }
}
```

### 사용 예시

```java
// 예외 메시지
throw new EntityNotFoundException(
    messageService.get("error.course.not-found", courseId)
);

// Bean Validation
public record CreateCourseRequest(
    @NotBlank(message = "{validation.title.required}")
    @Size(max = 100, message = "{validation.title.max-length}")
    String title
) {}
```

### messages 파일 예시

```properties
# messages_ko.properties
error.course.not-found=과정을 찾을 수 없습니다. ID: {0}
error.user.not-found=사용자를 찾을 수 없습니다. ID: {0}
error.access-denied=접근 권한이 없습니다

validation.title.required=제목은 필수입니다
validation.title.max-length=제목은 최대 {max}자입니다
validation.email.required=이메일은 필수입니다
validation.email.invalid=이메일 형식이 올바르지 않습니다

success.course.created=과정이 생성되었습니다
success.enrollment.completed=수강 신청이 완료되었습니다
```

```properties
# messages_en.properties
error.course.not-found=Course not found. ID: {0}
error.user.not-found=User not found. ID: {0}
error.access-denied=Access denied

validation.title.required=Title is required
validation.title.max-length=Title must be at most {max} characters
validation.email.required=Email is required
validation.email.invalid=Invalid email format

success.course.created=Course created successfully
success.enrollment.completed=Enrollment completed successfully
```

---

## Frontend I18N

### 라이브러리

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### 파일 구조

```
frontend/src/i18n/
├── index.ts                    # i18next 설정
└── locales/
    ├── ko/
    │   ├── common.json         # 공통 (버튼, 레이블)
    │   ├── auth.json           # 인증
    │   ├── course.json         # 과정
    │   ├── enrollment.json     # 수강
    │   └── validation.json     # 검증 메시지
    └── en/
        ├── common.json
        ├── auth.json
        ├── course.json
        ├── enrollment.json
        └── validation.json
```

### i18next 설정

```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// locales import
import commonKo from './locales/ko/common.json';
import commonEn from './locales/en/common.json';
import authKo from './locales/ko/auth.json';
import authEn from './locales/en/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { common: commonKo, auth: authKo },
      en: { common: commonEn, auth: authEn },
    },
    fallbackLng: 'en',
    supportedLngs: ['ko', 'en'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

### main.tsx 수정

```typescript
import './i18n';  // 최상단에 추가
```

### Axios Accept-Language 헤더

```typescript
// services/api/axiosInstance.ts
import i18n from '@/i18n';

axiosInstance.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language;
  return config;
});
```

### 번역 파일 예시

```json
// locales/ko/common.json
{
  "button": {
    "confirm": "확인",
    "cancel": "취소",
    "save": "저장",
    "delete": "삭제",
    "edit": "수정"
  },
  "label": {
    "search": "검색",
    "filter": "필터",
    "loading": "로딩 중..."
  },
  "message": {
    "noData": "데이터가 없습니다",
    "error": "오류가 발생했습니다"
  }
}
```

```json
// locales/en/common.json
{
  "button": {
    "confirm": "Confirm",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit"
  },
  "label": {
    "search": "Search",
    "filter": "Filter",
    "loading": "Loading..."
  },
  "message": {
    "noData": "No data available",
    "error": "An error occurred"
  }
}
```

### 컴포넌트에서 사용

```tsx
import { useTranslation } from 'react-i18next';

export const CourseList = () => {
  const { t } = useTranslation(['common', 'course']);

  return (
    <div>
      <h1>{t('course:title')}</h1>
      <button>{t('common:button.confirm')}</button>
      <p>{t('common:message.noData')}</p>
    </div>
  );
};
```

### 언어 전환 컴포넌트

```tsx
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="ko">한국어</option>
      <option value="en">English</option>
    </select>
  );
};
```

---

## 번역 키 네이밍 컨벤션

### Backend

```
{카테고리}.{도메인}.{항목}
```

| 카테고리 | 용도 | 예시 |
|---------|------|------|
| `error` | 에러 메시지 | `error.course.not-found` |
| `validation` | 검증 메시지 | `validation.email.invalid` |
| `success` | 성공 메시지 | `success.enrollment.completed` |
| `label` | 필드 레이블 | `label.course.title` |

### Frontend

```
{namespace}:{카테고리}.{항목}
```

| Namespace | 용도 | 예시 |
|-----------|------|------|
| `common` | 공통 UI | `common:button.confirm` |
| `auth` | 인증 | `auth:login.title` |
| `course` | 과정 | `course:create.submit` |
| `validation` | 검증 | `validation:email.required` |

---

## 적용 범위

### ✅ 다국어 처리 대상

| 구분 | 항목 |
|------|------|
| **Backend** | 예외 메시지, Validation 메시지, API 응답 메시지, 이메일 템플릿 |
| **Frontend** | UI 레이블, 버튼 텍스트, 폼 검증 메시지, 알림/토스트, 모달 내용 |

### ❌ 다국어 제외 대상

| 구분 | 항목 | 이유 |
|------|------|------|
| **Backend** | 로그 메시지 | 운영/디버깅 용 (영어 고정) |
| **Backend** | 내부 주석 | 개발자용 |
| **Frontend** | console.log | 개발자용 |
| **공통** | API 엔드포인트 | 기술적 경로 |
| **공통** | 코드/상수명 | 프로그래밍 요소 |

---

## 자주 하는 실수

### ❌ Bad

```java
// 1. 하드코딩된 메시지
throw new RuntimeException("과정을 찾을 수 없습니다");

// 2. 로그에 다국어 적용 (불필요)
log.info(messageService.get("log.user.login", userId));

// 3. 일관되지 않은 키 네이밍
error.courseNotFound      // camelCase
error.course-not-found    // kebab-case (권장)
```

```typescript
// 4. namespace 없이 사용
t('button.confirm')           // 어느 namespace?

// 5. 하드코딩
<button>확인</button>
```

### ✅ Good

```java
// 1. MessageService 사용
throw new EntityNotFoundException(
    messageService.get("error.course.not-found", courseId)
);

// 2. 로그는 영어 고정
log.info("User logged in: userId={}", userId);

// 3. 일관된 키 네이밍 (kebab-case)
error.course.not-found
validation.email.invalid
```

```typescript
// 4. namespace 명시
t('common:button.confirm')

// 5. 번역 키 사용
<button>{t('common:button.confirm')}</button>
```

---

## 체크리스트

### Backend
- [ ] MessageSource, LocaleResolver 설정?
- [ ] messages_ko.properties, messages_en.properties 생성?
- [ ] 예외 메시지 다국어 처리?
- [ ] Bean Validation 메시지 다국어 처리?

### Frontend
- [ ] i18next 설정 완료?
- [ ] main.tsx에 i18n import?
- [ ] Axios에 Accept-Language 헤더 추가?
- [ ] 모든 UI 텍스트 번역 키로 교체?
- [ ] LanguageSwitcher 컴포넌트 구현?

### 공통
- [ ] 번역 키 네이밍 일관성?
- [ ] 모든 키에 ko/en 번역 존재?
- [ ] Fallback 동작 확인?

---

> 멀티테넌시 연동 → [23-MULTI-TENANCY.md](./23-MULTI-TENANCY.md)
> API 통신 → [14-REACT-API-INTEGRATION.md](./14-REACT-API-INTEGRATION.md)

# 25. I18N Conventions (다국어 지원)

> 📌 **먼저 읽기**: [00-CONVENTIONS-CORE.md](./00-CONVENTIONS-CORE.md)

> 다국어 지원 구현 규칙 (Backend MessageSource, Frontend i18next)

---

## 언제 이 문서를 보는가?

| 상황 | 참조 섹션 |
|------|----------|
| Backend 다국어 설정? | Backend I18N |
| Frontend 다국어 설정? | Frontend I18N |
| 번역 키 네이밍? | 번역 키 네이밍 |
| 메시지 파일 작성? | messages 파일 |

---

## 핵심 규칙

```
✅ 사용자 메시지 → 반드시 다국어 처리
✅ 로그/내부 메시지 → 영어 고정 (다국어 제외)
✅ 번역 키 → 도메인.카테고리.항목 패턴
✅ Accept-Language → HTTP 헤더로 언어 전달
✅ Fallback → 영어(en) 기본
```

**지원 언어**: `ko` (기본), `en` (Fallback)

---

## Backend I18N

### 파일 구조

```
backend/src/main/resources/
├── messages.properties          # Fallback (영어)
├── messages_en.properties       # 영어
└── messages_ko.properties       # 한국어
```

### 설정

```java
@Configuration
public class I18nConfig {
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasename("messages");
        source.setDefaultEncoding("UTF-8");
        source.setUseCodeAsDefaultMessage(true);
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

### 사용

```java
// MessageService
@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageSource messageSource;

    public String get(String code, Object... args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }
}

// 예외 메시지
throw new EntityNotFoundException(messageService.get("error.course.not-found", courseId));

// Bean Validation
@NotBlank(message = "{validation.title.required}")
String title;
```

### messages 파일

```properties
# messages_ko.properties
error.course.not-found=과정을 찾을 수 없습니다. ID: {0}
validation.title.required=제목은 필수입니다
validation.email.invalid=이메일 형식이 올바르지 않습니다
success.course.created=과정이 생성되었습니다
```

---

## Frontend I18N

### 설치 & 파일 구조

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

```
frontend/src/i18n/
├── index.ts
└── locales/
    ├── ko/common.json, auth.json, course.json
    └── en/common.json, auth.json, course.json
```

### 설정

```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    ko: { common: commonKo, auth: authKo },
    en: { common: commonEn, auth: authEn },
  },
  fallbackLng: 'en',
  supportedLngs: ['ko', 'en'],
  defaultNS: 'common',
});

// main.tsx
import './i18n';

// Axios 헤더
axiosInstance.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.language;
  return config;
});
```

### 사용

```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation(['common', 'course']);

// 번역
<button>{t('common:button.confirm')}</button>
<h1>{t('course:title')}</h1>

// 언어 전환
<select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
  <option value="ko">한국어</option>
  <option value="en">English</option>
</select>
```

### 번역 파일

```json
// locales/ko/common.json
{
  "button": { "confirm": "확인", "cancel": "취소", "save": "저장" },
  "message": { "noData": "데이터가 없습니다", "error": "오류가 발생했습니다" }
}
```

---

## 번역 키 네이밍

### Backend: `{카테고리}.{도메인}.{항목}`

| 카테고리 | 예시 |
|---------|------|
| `error` | `error.course.not-found` |
| `validation` | `validation.email.invalid` |
| `success` | `success.enrollment.completed` |

### Frontend: `{namespace}:{카테고리}.{항목}`

| Namespace | 예시 |
|-----------|------|
| `common` | `common:button.confirm` |
| `auth` | `auth:login.title` |
| `course` | `course:create.submit` |

---

## 적용 범위

| 구분 | ✅ 다국어 처리 | ❌ 제외 |
|------|--------------|--------|
| **Backend** | 예외, Validation, API 응답, 이메일 | 로그, 주석 |
| **Frontend** | UI 레이블, 버튼, 알림, 모달 | console.log |

---

## 자주 하는 실수

```java
// ❌ Bad: 하드코딩
throw new RuntimeException("과정을 찾을 수 없습니다");

// ✅ Good: MessageService 사용
throw new EntityNotFoundException(messageService.get("error.course.not-found", courseId));
```

```typescript
// ❌ Bad: namespace 없이, 하드코딩
t('button.confirm')
<button>확인</button>

// ✅ Good: namespace 명시
t('common:button.confirm')
<button>{t('common:button.confirm')}</button>
```

---

## 체크리스트

- [ ] Backend: MessageSource, LocaleResolver 설정
- [ ] Backend: messages_ko/en.properties 생성
- [ ] Frontend: i18next 설정, main.tsx import
- [ ] Frontend: Axios Accept-Language 헤더
- [ ] 번역 키 네이밍 일관성

---

> 멀티테넌시 → [23-MULTI-TENANCY.md](./23-MULTI-TENANCY.md) | API 통신 → [14-REACT-API-INTEGRATION.md](./14-REACT-API-INTEGRATION.md)

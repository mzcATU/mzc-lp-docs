# 알림 템플릿 관리 및 자동 초기화

> **작업 기간**: 2026-01-10 ~ 2026-01-15
> **관련 이슈**: #376, #385, #396, #399, #426, #515

## 개요

테넌트별 알림 템플릿 관리 시스템을 구현하고, 테넌트 생성 시 기본 템플릿이 자동으로 초기화되도록 했습니다.

## Backend 구현

### 1. NotificationTemplate 엔티티
```java
@Entity
@Table(name = "notification_templates")
public class NotificationTemplate extends TenantEntity {
    private String code;           // ENROLLMENT_COMPLETE, COURSE_START 등
    private String category;       // ENROLLMENT, COURSE, SYSTEM, ASSIGNMENT
    private String title;          // 알림 제목 템플릿
    private String content;        // 알림 내용 템플릿
    private boolean enabled;       // 활성화 여부
    private String variables;      // JSON - 사용 가능한 변수 목록
}
```

### 2. 템플릿 자동 초기화 (NotificationTemplateInitializer)
```java
@Component
public class NotificationTemplateInitializer implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) {
        // 모든 테넌트에 기본 템플릿 생성
        List<Tenant> tenants = tenantRepository.findAll();
        for (Tenant tenant : tenants) {
            initializeTemplatesForTenant(tenant.getId());
        }
    }
}
```

### 3. 기본 템플릿 목록

| 코드 | 카테고리 | 설명 |
|------|----------|------|
| ENROLLMENT_COMPLETE | ENROLLMENT | 수강신청 완료 |
| ENROLLMENT_CANCEL | ENROLLMENT | 수강취소 |
| COURSE_START | COURSE | 과정 시작 |
| COURSE_END | COURSE | 과정 종료 |
| ASSIGNMENT_NEW | ASSIGNMENT | 새 과제 등록 |
| ASSIGNMENT_GRADE | ASSIGNMENT | 과제 채점 완료 |
| SYSTEM_NOTICE | SYSTEM | 시스템 공지 |

### 4. 알림 API

#### 템플릿 관리 (TA 권한)
```
GET    /api/notification-templates          - 목록 조회
GET    /api/notification-templates/{id}     - 상세 조회
PUT    /api/notification-templates/{id}     - 수정
PATCH  /api/notification-templates/{id}/toggle - 활성화 토글
```

#### 알림 발송
```
POST /api/notifications/send
{
  "templateCode": "ENROLLMENT_COMPLETE",
  "targetUserIds": [1, 2, 3],
  "variables": {
    "courseName": "React 완벽 가이드",
    "userName": "홍길동"
  }
}
```

## Frontend 구현

### TA 알림 템플릿 관리 페이지
- 경로: `/ta/settings/notifications`
- 템플릿 목록 조회
- 템플릿 제목/내용 수정
- 활성화/비활성화 토글

### 알림 타입별 딥링크

| 타입 | 클릭 시 이동 경로 |
|------|------------------|
| ENROLLMENT | `/tu/b2c/learning/{enrollmentId}` |
| COURSE | `/tu/b2c/courses/{courseId}` |
| ASSIGNMENT | `/tu/b2c/learning/{enrollmentId}/assignments` |
| SYSTEM | `/tu/b2c/notices/{noticeId}` |

## 관련 파일

### Backend
- `NotificationTemplate.java`
- `NotificationTemplateRepository.java`
- `NotificationTemplateService.java`
- `NotificationTemplateInitializer.java`
- `NotificationEventListener.java`

### Frontend
- `NotificationTemplatesPage.tsx`
- `notificationTemplateService.ts`
- `NotificationItem.tsx` (딥링크 처리)

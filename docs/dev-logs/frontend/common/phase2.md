# Frontend Common 개발 로그 - Phase 2

> Axios 인터셉터 ApiResponse 자동 추출 및 서비스 코드 통일

---

## 작업 정보

| 항목 | 내용 |
|------|------|
| **작업자** | hjj240228 |
| **작업 일자** | 2026-01-06 |
| **관련 이슈** | [#272](https://github.com/mzcATU/mzc-lp-frontend/issues/272), [#278](https://github.com/mzcATU/mzc-lp-frontend/issues/278) |
| **관련 PR** | [#274](https://github.com/mzcATU/mzc-lp-frontend/pull/274), [#279](https://github.com/mzcATU/mzc-lp-frontend/pull/279) |
| **담당 모듈** | Common - API Infrastructure |

---

## 1. 구현 개요

### 1.1 배경

| 항목 | 설명 |
|------|------|
| 문제 | 서비스 파일마다 `.data.data` 패턴 중복, 일부는 `.data`만 사용하여 불일치 |
| 원인 | 백엔드 ApiResponse 래퍼 구조 (`{ data: T }`) 처리가 표준화되지 않음 |
| 해결 | axios 인터셉터에서 ApiResponse 래퍼 자동 추출, 서비스는 `.data`만 사용 |

### 1.2 백엔드 응답 구조

```json
// 백엔드 ApiResponse<T> 형식
{
  "success": true,
  "data": {
    "id": 1,
    "title": "강의 제목"
  },
  "error": null
}
```

### 1.3 기존 vs 개선

```
┌─────────────────────────────────────────────────────────────────┐
│ 기존 (불일치)                                                    │
├─────────────────────────────────────────────────────────────────┤
│ // 일부 서비스                                                   │
│ const { data } = await axios.get<{ data: T }>('/api/courses');  │
│ return data.data;  // ApiResponse 래퍼 수동 추출                  │
│                                                                 │
│ // 다른 서비스                                                   │
│ const { data } = await axios.get<T>('/api/users');              │
│ return data;  // 래퍼 없이 직접 반환 (에러 발생 가능)              │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 개선 (통일)                                                      │
├─────────────────────────────────────────────────────────────────┤
│ // axiosInstance (인터셉터)                                       │
│ response.data = response.data.data;  // 자동 추출                │
│                                                                 │
│ // 모든 서비스                                                   │
│ const { data } = await axios.get<T>('/api/courses');            │
│ return data;  // 이미 추출된 데이터                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 수정 파일

### 2.1 인터셉터 수정 (1개)

| 파일 | 경로 | 변경 내용 |
|------|------|----------|
| axiosInstance.ts | `src/services/common/api/` | response interceptor에 ApiResponse 추출 로직 추가 |

### 2.2 서비스 파일 수정 (19개)

| 영역 | 파일 | 변경 내용 |
|------|------|----------|
| common | authService.ts | `.data.data` → `.data` |
| common | userService.ts | `.data.data` → `.data` |
| common | courseService.ts | `.data.data` → `.data` |
| common | categoryService.ts | `.data.data` → `.data` |
| tu | cartService.ts | `.data.data` → `.data` |
| tu | catalogService.ts | `.data.data` → `.data` |
| tu | communityService.ts | `.data.data` → `.data` |
| tu | courseDetailService.ts | `.data.data` → `.data` |
| tu | courseExploreService.ts | `.data.data` → `.data` |
| tu | enrollmentService.ts | `.data.data` → `.data` |
| tu | contentService.ts | `.data.data` → `.data` |
| tu | learningObjectService.ts | `.data.data` → `.data` |
| tu | publicBrandingService.ts | `.data.data` → `.data` |
| to | timeService.ts | `.data.data` → `.data` |
| to | enrollmentService.ts | `.data.data` → `.data` |
| to | userService.ts | `.data.data` → `.data` |
| to | programService.ts | `.data.data` → `.data` |
| to | instructorAssignmentService.ts | `.data.data` → `.data` |
| to | dashboardService.ts | `.data.data` → `.data` |

### 2.3 추가 수정 (2차 PR)

| 영역 | 파일 | 변경 내용 |
|------|------|----------|
| sa | tenantService.ts | 타입/반환값 수정 |
| sa | noticeService.ts | 타입/반환값 수정 |
| sa | analyticsService.ts | 타입/반환값 수정 |
| sa | dashboardService.ts | 타입/반환값 수정 |
| sa | systemSettingsService.ts | 타입/반환값 수정 |
| ta | groupService.ts | 타입/반환값 수정 |
| ta | userService.ts | 타입/반환값 수정 |
| ta | analyticsService.ts | 타입/반환값 수정 |
| ta | dashboardService.ts | 타입/반환값 수정 |
| ta | tenantSettingsService.ts | 타입/반환값 수정 |
| ta | brandingService.ts | 타입/반환값 수정 |

---

## 3. 주요 구현 내용

### 3.1 Axios Response Interceptor

```typescript
// src/services/common/api/axiosInstance.ts
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // ApiResponse 래퍼에서 data 필드 자동 추출
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error: AxiosError) => {
    // 에러 처리...
    return Promise.reject(error);
  }
);
```

### 3.2 서비스 코드 변경 예시

```typescript
// 기존 코드
export const courseService = {
  getAll: async (): Promise<CourseResponse[]> => {
    const { data } = await axiosInstance.get<{ data: CourseResponse[] }>('/api/courses');
    return data.data;  // 중복 접근
  },
};

// 개선된 코드
export const courseService = {
  getAll: async (): Promise<CourseResponse[]> => {
    const { data } = await axiosInstance.get<CourseResponse[]>('/api/courses');
    return data;  // 인터셉터에서 이미 추출됨
  },
};
```

### 3.3 타입 정의 변경

```typescript
// 기존: ApiResponse 래퍼 타입 사용
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

const { data } = await axios.get<ApiResponse<CourseResponse>>('/api/courses');
return data.data;

// 개선: 직접 타입 사용
const { data } = await axios.get<CourseResponse>('/api/courses');
return data;
```

---

## 4. 문제 해결

### 4.1 1차 PR 후 발생한 문제 (#278)

```
문제: 일부 서비스에서 undefined 반환

원인: 인터셉터에서 이미 .data 추출했는데,
      서비스에서 또 .data.data 접근 시도

해결: 모든 서비스 파일에서 타입과 반환값 일괄 수정
```

### 4.2 영향 범위 분석

| 영역 | 서비스 수 | 수정 필요 |
|------|----------|----------|
| common | 4 | 4 |
| tu | 15 | 15 |
| to | 6 | 6 |
| sa | 5 | 5 |
| ta | 6 | 6 |
| **합계** | **36** | **36** |

---

## 5. 변경 전/후 비교

### 5.1 코드 패턴

| 항목 | 기존 | 개선 |
|------|------|------|
| 타입 | `<{ data: T }>` | `<T>` |
| 반환 | `data.data` | `data` |
| 중복 | 모든 서비스에서 반복 | 인터셉터에서 1회 처리 |

### 5.2 코드량 변화

```diff
// 서비스당 평균 변경
- const { data } = await axiosInstance.get<{ data: CourseResponse[] }>('/api/courses');
- return data.data;
+ const { data } = await axiosInstance.get<CourseResponse[]>('/api/courses');
+ return data;

// 총 변경: 약 -50 lines (중복 제거)
```

---

## 6. 주의사항

### 6.1 인터셉터 동작 조건

```typescript
// ApiResponse 래퍼가 있는 경우에만 추출
if (response.data && typeof response.data === 'object' && 'data' in response.data) {
  response.data = response.data.data;
}
```

### 6.2 예외 케이스

| 케이스 | 처리 |
|--------|------|
| 파일 다운로드 (Blob) | `typeof response.data === 'object'` 조건에서 제외 |
| 배열 직접 반환 | `'data' in response.data` 조건에서 제외 |
| Public API | 동일하게 ApiResponse 래퍼 사용, 정상 동작 |

---

## 7. Git 커밋 히스토리

| 커밋 | 날짜 | 내용 |
|------|------|------|
| 1e0b053 | 2026-01-06 | fix: axios 인터셉터에서 ApiResponse wrapper 자동 추출 처리 (#274) |
| e565dd5 | 2026-01-06 | fix: axios 인터셉터와 서비스 data.data 중복 접근 수정 (#279) |

---

## 8. 파일 변경 요약

| 구분 | 파일 수 | 변경 라인 |
|------|---------|----------|
| 인터셉터 | 1 | +16 |
| 서비스 (1차) | 19 | -51 |
| 서비스 (2차) | 19 | -2 |
| **합계** | **39** | **-37 lines** |

---

## 9. 테스트

### 9.1 빌드 확인

```bash
npm run build
# ✓ built in 4.23s (성공)
```

### 9.2 수동 테스트 항목

| 영역 | 테스트 항목 |
|------|------------|
| 인증 | 로그인, 로그아웃, 토큰 갱신 |
| 강의 | 목록 조회, 상세 조회, 생성, 수정 |
| 프로그램 | 목록 조회, 신청, 상태 변경 |
| 차수 | 목록 조회, 수강 신청 |
| 관리자 | 테넌트 관리, 사용자 관리 |

---

## 10. 관련 문서

- [Frontend Common Phase 1](phase1.md) - 디자인 시스템, 레이아웃, 인증
- [Backend API Convention](../../backend/api-convention.md) - ApiResponse 형식

---

## 변경 이력

| 날짜 | 작업자 | 내용 |
|------|--------|------|
| 2026-01-06 | hjj240228 | axios 인터셉터 ApiResponse 자동 추출 |
| 2026-01-06 | hjj240228 | 서비스 파일 타입/반환값 일괄 수정 |

---

*최종 업데이트: 2026-01-06*

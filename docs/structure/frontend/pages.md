# Frontend 페이지 구조

> Frontend 페이지 컴포넌트 (역할별 분리)

---

## 1. 페이지 구조 개요

```
frontend/src/pages/
├── auth/                         # 인증 페이지
│   └── RoleSelectionPage.tsx
├── admin/                        # 관리자 인증
│   └── auth/
│       └── AdminRegisterPage.tsx
├── common/                       # 공통 페이지
│   ├── profile/
│   │   └── ProfileSetupPage.tsx
│   └── settings/
│       ├── SettingsPage.tsx
│       ├── SettingsSecurityPage.tsx
│       ├── SettingsNotificationsPage.tsx
│       └── SettingsAppearancePage.tsx
├── sa/                           # System Admin (SA)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── tenants/
│   │   └── TenantDetailPage.tsx
│   ├── settings/
│   │   ├── SystemSettingsPage.tsx
│   │   └── TenantDefaultsPage.tsx
│   └── system/
│       └── BrandingSettingsPage.tsx
├── ta/                           # Tenant Admin (TA)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── users/
│   │   ├── GroupsPage.tsx
│   │   ├── OperatorsPage.tsx
│   │   └── PermissionsPage.tsx
│   ├── features/
│   │   ├── FeatureSettingsPage.tsx
│   │   └── TenantCategoryPage.tsx
│   ├── branding/
│   │   └── DesignSettingsPage.tsx
│   ├── notices/
│   │   └── NoticeInboxPage.tsx
│   └── settings/
│       ├── TenantSettingsPage.tsx
│       └── UserManagementSettingsPage.tsx
├── co/                           # Course Operator (CO)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── course/
│   │   ├── CourseListPage.tsx
│   │   ├── CourseDetailPage.tsx
│   │   └── CoursePendingPage.tsx
│   ├── time/
│   │   ├── CourseTimesPage.tsx
│   │   ├── CourseTimeCreatePage.tsx
│   │   └── CourseTimeDetailPage.tsx
│   ├── enrollment/
│   │   └── EnrollmentManagementPage.tsx
│   ├── member-pool/
│   │   └── MemberPoolListPage.tsx
│   ├── instructor/
│   │   └── InstructorAssignmentsPage.tsx
│   ├── user/
│   │   └── UserManagementPage.tsx
│   └── notices/
│       ├── OperatorNoticesPage.tsx
│       └── OperatorNoticeInboxPage.tsx
└── tu/                           # Tenant User (TU)
    ├── dashboard/
    │   └── TUDashboardPage.tsx
    ├── main/                     # 메인 페이지들
    │   ├── CoursesExplorePage.tsx
    │   ├── CourseDetailPage.tsx
    │   ├── RoadmapExplorePage.tsx
    │   ├── RoadmapDetailPage.tsx
    │   ├── CommunityPage.tsx
    │   ├── CommunityDetailPage.tsx
    │   ├── SearchPage.tsx
    │   ├── CartPage.tsx
    │   ├── WishlistPage.tsx
    │   ├── NotificationsPage.tsx
    │   ├── NotificationDetailPage.tsx
    │   └── InstructorProfilePage.tsx
    ├── catalog/                  # 카탈로그
    │   ├── CatalogPage.tsx
    │   └── CatalogDetailPage.tsx
    ├── learning/                 # 학습
    │   ├── MyLearningPage.tsx
    │   ├── LearningDetailPage.tsx
    │   └── LearningPlayerPage.tsx
    ├── mypage/                   # 마이페이지
    │   ├── MyPage.tsx
    │   ├── MyPageHome.tsx
    │   ├── ProfilePage.tsx
    │   ├── MyTeachingPage.tsx
    │   ├── TeachingStatsPage.tsx
    │   ├── CertificationsPage.tsx
    │   ├── MyPostsPage.tsx
    │   ├── MyCommentsPage.tsx
    │   ├── UserNoticesPage.tsx
    │   ├── PreferencesPage.tsx
    │   └── SettingsPage.tsx
    ├── teaching/                 # 강의 제작
    │   ├── courses/
    │   │   ├── MyCoursesPage.tsx
    │   │   ├── CourseCreatePage.tsx
    │   │   ├── CourseDetailPage.tsx
    │   │   └── CoursePreviewPage.tsx
    │   ├── content/
    │   │   ├── MyContentPage.tsx
    │   │   ├── ContentCreatePage.tsx
    │   │   ├── ContentDetailPage.tsx
    │   │   └── ContentBulkUploadPage.tsx
    │   └── roadmaps/
    │       ├── RoadmapListPage.tsx
    │       ├── RoadmapCreatePage.tsx
    │       └── RoadmapDetailPage.tsx
    ├── b2b/                      # B2B 전용 페이지
    │   ├── B2BLandingPage.tsx
    │   ├── B2BMyLearningPage.tsx
    │   ├── B2BLearningDetailPage.tsx
    │   ├── B2BLearningPlayerPage.tsx
    │   ├── B2BCourseDetailPage.tsx
    │   ├── B2BSearchPage.tsx
    │   ├── B2BMyPageHome.tsx
    │   ├── B2BProfilePage.tsx
    │   ├── B2BMyTeachingPage.tsx
    │   ├── B2BTeachingStatsPage.tsx
    │   ├── B2BCertificationsPage.tsx
    │   ├── B2BCompletedCoursesPage.tsx
    │   ├── B2BWishlistPage.tsx
    │   ├── B2BPreferencesPage.tsx
    │   ├── B2BSettingsPage.tsx
    │   ├── B2BUserNoticesPage.tsx
    │   └── B2BMyActivityPage.tsx
    └── settings/
        └── SettingsLanguagePage.tsx
```

---

## 2. System Admin 페이지 (SA)

### 2.1 DashboardPage

시스템 전체 현황을 표시합니다.

```tsx
// src/pages/sa/dashboard/DashboardPage.tsx
export const DashboardPage = () => {
  const { data: stats } = useSADashboard();

  return (
    <SuperAdminLayout>
      <h1>시스템 대시보드</h1>
      <div className="stats-grid">
        <StatCard title="전체 테넌트" value={stats?.totalTenants} />
        <StatCard title="활성 사용자" value={stats?.activeUsers} />
        <StatCard title="총 강의 수" value={stats?.totalCourses} />
      </div>
    </SuperAdminLayout>
  );
};
```

### 2.2 TenantDetailPage

테넌트 상세 정보를 조회/관리합니다.

### 2.3 SystemSettingsPage

시스템 전역 설정을 관리합니다.

### 2.4 BrandingSettingsPage

시스템 브랜딩 설정을 관리합니다.

---

## 3. Tenant Admin 페이지 (TA)

### 3.1 DashboardPage

테넌트 관리자 대시보드입니다.

### 3.2 사용자 관리

| 페이지 | 설명 |
|--------|------|
| `GroupsPage` | 그룹 관리 |
| `OperatorsPage` | 운영자 관리 |
| `PermissionsPage` | 권한 관리 |

### 3.3 기능 설정

| 페이지 | 설명 |
|--------|------|
| `FeatureSettingsPage` | 테넌트 기능 설정 |
| `TenantCategoryPage` | 테넌트 카테고리 관리 |

### 3.4 브랜딩/디자인

| 페이지 | 설명 |
|--------|------|
| `DesignSettingsPage` | 테넌트 디자인 설정 |

---

## 4. Course Operator 페이지 (CO)

> 강의 운영 전담 역할

### 4.1 DashboardPage

운영자 대시보드입니다.

```tsx
// src/pages/co/dashboard/DashboardPage.tsx
export const DashboardPage = () => {
  const { data: stats } = useCODashboard();

  return (
    <OperatorLayout>
      <h1>운영 대시보드</h1>
      <div className="stats-grid">
        <StatCard title="승인 대기" value={stats?.pendingCourses} />
        <StatCard title="진행중 차수" value={stats?.activeTimes} />
        <StatCard title="수강생 수" value={stats?.totalEnrollments} />
      </div>
    </OperatorLayout>
  );
};
```

### 4.2 강의 관리

| 페이지 | 설명 |
|--------|------|
| `CourseListPage` | 등록된 강의 목록 |
| `CourseDetailPage` | 강의 상세 조회 |
| `CoursePendingPage` | 승인 대기 강의 목록 |

### 4.3 차수 관리

| 페이지 | 설명 |
|--------|------|
| `CourseTimesPage` | 차수 목록 |
| `CourseTimeCreatePage` | 차수 생성 |
| `CourseTimeDetailPage` | 차수 상세/수정 |

```tsx
// src/pages/co/time/CourseTimesPage.tsx
export const CourseTimesPage = () => {
  const { data: times } = useCourseTimes();

  return (
    <OperatorLayout>
      <header>
        <h1>차수 관리</h1>
        <Button onClick={() => navigate('/co/times/create')}>
          + 차수 생성
        </Button>
      </header>
      <CourseTimeTable data={times} />
    </OperatorLayout>
  );
};
```

### 4.4 수강 관리

| 페이지 | 설명 |
|--------|------|
| `EnrollmentManagementPage` | 수강 신청 관리 |
| `MemberPoolListPage` | 회원풀 관리 |

### 4.5 강사 관리

| 페이지 | 설명 |
|--------|------|
| `InstructorAssignmentsPage` | 강사 배정 |

### 4.6 사용자/공지

| 페이지 | 설명 |
|--------|------|
| `UserManagementPage` | 사용자 관리 |
| `OperatorNoticesPage` | 운영자 공지 관리 |
| `OperatorNoticeInboxPage` | 공지 수신함 |

---

## 5. Tenant User 페이지 (TU)

### 5.1 대시보드

```tsx
// src/pages/tu/dashboard/TUDashboardPage.tsx
export const TUDashboardPage = () => {
  const { data: dashboard } = useTUDashboard();

  return (
    <TenantUserLayout>
      <h1>대시보드</h1>
      <LearningProgressSection data={dashboard?.learningProgress} />
      <RecommendedCoursesSection data={dashboard?.recommended} />
      <RecentActivitySection data={dashboard?.recentActivity} />
    </TenantUserLayout>
  );
};
```

### 5.2 메인 페이지 (탐색)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `CoursesExplorePage` | `/tu/courses` | 강의 탐색 |
| `CourseDetailPage` | `/tu/courses/:id` | 강의 상세 |
| `RoadmapExplorePage` | `/tu/roadmaps` | 로드맵 탐색 |
| `RoadmapDetailPage` | `/tu/roadmaps/:id` | 로드맵 상세 |
| `CommunityPage` | `/tu/community` | 커뮤니티 |
| `SearchPage` | `/tu/search` | 검색 |
| `CartPage` | `/tu/cart` | 장바구니 |
| `WishlistPage` | `/tu/wishlist` | 찜 목록 |
| `NotificationsPage` | `/tu/notifications` | 알림 |

### 5.3 카탈로그

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `CatalogPage` | `/tu/catalog` | 카탈로그 메인 |
| `CatalogDetailPage` | `/tu/catalog/:id` | 카탈로그 상세 |

### 5.4 학습 (수강)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `MyLearningPage` | `/tu/learning` | 내 학습 현황 |
| `LearningDetailPage` | `/tu/learning/:id` | 학습 상세 |
| `LearningPlayerPage` | `/tu/learning/:id/play` | 강의 플레이어 |

```tsx
// src/pages/tu/learning/LearningPlayerPage.tsx
export const LearningPlayerPage = () => {
  const { courseTimeId, itemId } = useParams();
  const { data: learningData } = useLearningContent(courseTimeId, itemId);

  return (
    <PlayerLayout>
      {/* 좌측: 비디오/콘텐츠 플레이어 */}
      <main className="player-main">
        <VideoPlayer src={learningData?.streamUrl} />
        <PlayerCommunitySection />
      </main>

      {/* 우측: 커리큘럼 사이드바 */}
      <CurriculumSidebar
        items={learningData?.curriculum}
        currentItemId={itemId}
      />
    </PlayerLayout>
  );
};
```

### 5.5 마이페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `MyPageHome` | `/tu/mypage` | 마이페이지 홈 |
| `ProfilePage` | `/tu/mypage/profile` | 프로필 |
| `MyTeachingPage` | `/tu/mypage/teaching` | 내 강의 (강사용) |
| `TeachingStatsPage` | `/tu/mypage/teaching/stats` | 강의 통계 |
| `CertificationsPage` | `/tu/mypage/certifications` | 수료증 |
| `MyPostsPage` | `/tu/mypage/posts` | 내 게시글 |
| `MyCommentsPage` | `/tu/mypage/comments` | 내 댓글 |
| `UserNoticesPage` | `/tu/mypage/notices` | 공지사항 |
| `PreferencesPage` | `/tu/mypage/preferences` | 환경설정 |
| `SettingsPage` | `/tu/mypage/settings` | 계정 설정 |

### 5.6 강의 제작 (Teaching)

#### 5.6.1 내 강의 관리

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `MyCoursesPage` | `/tu/teaching/courses` | 내 강의 목록 |
| `CourseCreatePage` | `/tu/teaching/courses/create` | 강의 생성 |
| `CourseDetailPage` | `/tu/teaching/courses/:id` | 강의 상세/편집 |
| `CoursePreviewPage` | `/tu/teaching/courses/:id/preview` | 강의 미리보기 |

```tsx
// src/pages/tu/teaching/courses/MyCoursesPage.tsx
export function MyCoursesPage() {
  const { data: courses } = useMyCourses();
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');

  return (
    <TenantUserLayout>
      <header>
        <h1>내 강의</h1>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <Button onClick={() => navigate('/tu/teaching/courses/create')}>
          + 새 강의
        </Button>
      </header>

      <CourseTable
        data={courses}
        statusFilter={statusFilter}
        onEdit={(id) => navigate(`/tu/teaching/courses/${id}`)}
        onPreview={(id) => navigate(`/tu/teaching/courses/${id}/preview`)}
      />
    </TenantUserLayout>
  );
}
```

#### 5.6.2 콘텐츠 관리

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `MyContentPage` | `/tu/teaching/content` | 내 콘텐츠 목록 |
| `ContentCreatePage` | `/tu/teaching/content/create` | 콘텐츠 업로드 |
| `ContentDetailPage` | `/tu/teaching/content/:id` | 콘텐츠 상세 |
| `ContentBulkUploadPage` | `/tu/teaching/content/bulk-upload` | 일괄 업로드 |

```tsx
// src/pages/tu/teaching/content/MyContentPage.tsx
export function MyContentPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const { data: folders } = useFolderTree();
  const { data: contents } = useMyContents({ folderId: selectedFolderId });

  return (
    <TenantUserLayout>
      <div className="content-page">
        {/* 좌측: 폴더 트리 */}
        <aside className="folder-sidebar">
          <FolderTree
            data={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
          />
        </aside>

        {/* 우측: 콘텐츠 목록 */}
        <main className="content-main">
          <header>
            <h1>내 콘텐츠</h1>
            <Button onClick={() => navigate('/tu/teaching/content/create')}>
              + 업로드
            </Button>
          </header>
          <ContentGrid contents={contents} />
        </main>
      </div>
    </TenantUserLayout>
  );
}
```

#### 5.6.3 로드맵 관리

| 페이지 | 경로 | 설명 |
|--------|------|------|
| `RoadmapListPage` | `/tu/teaching/roadmaps` | 로드맵 목록 |
| `RoadmapCreatePage` | `/tu/teaching/roadmaps/create` | 로드맵 생성 |
| `RoadmapDetailPage` | `/tu/teaching/roadmaps/:id` | 로드맵 상세/편집 |

---

## 6. B2B 전용 페이지

> TU 역할의 B2B 모드 전용 페이지들 (`/tu/b2b/...`)

### 6.1 메인

| 페이지 | 설명 |
|--------|------|
| `B2BLandingPage` | B2B 랜딩 페이지 |
| `B2BSearchPage` | B2B 검색 |

### 6.2 학습

| 페이지 | 설명 |
|--------|------|
| `B2BMyLearningPage` | B2B 내 학습 |
| `B2BLearningDetailPage` | B2B 학습 상세 |
| `B2BLearningPlayerPage` | B2B 강의 플레이어 |
| `B2BCourseDetailPage` | B2B 강의 상세 |

### 6.3 마이페이지

| 페이지 | 설명 |
|--------|------|
| `B2BMyPageHome` | B2B 마이페이지 홈 |
| `B2BProfilePage` | B2B 프로필 |
| `B2BMyTeachingPage` | B2B 내 강의 |
| `B2BTeachingStatsPage` | B2B 강의 통계 |
| `B2BCertificationsPage` | B2B 수료증 |
| `B2BCompletedCoursesPage` | B2B 완료 강의 |
| `B2BWishlistPage` | B2B 찜 목록 |
| `B2BPreferencesPage` | B2B 환경설정 |
| `B2BSettingsPage` | B2B 계정 설정 |
| `B2BUserNoticesPage` | B2B 공지 |
| `B2BMyActivityPage` | B2B 내 활동 |

---

## 7. 공통 설정 페이지 (Settings)

모든 역할이 사용하는 공통 설정 페이지입니다. `src/pages/common/settings/`에 위치합니다.

### 7.1 SettingsPage (설정 메인)

```tsx
// src/pages/common/settings/SettingsPage.tsx
export function SettingsPage() {
  const navigate = useNavigate();
  const { basePath } = useSettingsPath();

  const settingsMenus = [
    { id: 'security', title: '보안', icon: Shield, path: `${basePath}/security` },
    { id: 'notifications', title: '알림', icon: Bell, path: `${basePath}/notifications` },
    { id: 'appearance', title: '외관', icon: Palette, path: `${basePath}/appearance` },
  ];

  return (
    <div className="settings-page">
      <h1>설정</h1>
      <div className="settings-menu-grid">
        {settingsMenus.map((menu) => (
          <Card key={menu.id} onClick={() => navigate(menu.path)}>
            <CardHeader>
              <menu.icon />
              <CardTitle>{menu.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 7.2 SettingsSecurityPage (보안 설정)

비밀번호 변경, 2FA 설정 등 보안 관련 설정을 관리합니다.

### 7.3 SettingsNotificationsPage (알림 설정)

이메일, 푸시 알림 등 알림 관련 설정을 관리합니다.

### 7.4 SettingsAppearancePage (외관 설정)

테마 모드, 날짜 형식 등 UI 관련 설정을 관리합니다.

### 7.5 SettingsLanguagePage (언어 설정 - TU 전용)

```tsx
// src/pages/tu/settings/SettingsLanguagePage.tsx
export function SettingsLanguagePage() {
  const { language, setLanguage } = useUIStore();

  const languageOptions = [
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="language-settings">
      <h1>언어 설정</h1>
      <RadioGroup value={language}>
        {languageOptions.map((option) => (
          <RadioOptionCard
            key={option.value}
            value={option.value}
            label={`${option.flag} ${option.label}`}
            selected={language === option.value}
            onClick={() => setLanguage(option.value as 'ko' | 'en')}
          />
        ))}
      </RadioGroup>
    </div>
  );
}
```

---

## 8. 라우팅 설정

```tsx
// src/App.tsx (주요 라우트)
<Routes>
  {/* Auth */}
  <Route path="/auth/role-selection" element={<RoleSelectionPage />} />

  {/* System Admin (SA) */}
  <Route path="/sa/dashboard" element={<SADashboardPage />} />
  <Route path="/sa/tenants/:id" element={<TenantDetailPage />} />
  <Route path="/sa/settings/*" element={<SASettingsRoutes />} />

  {/* Tenant Admin (TA) */}
  <Route path="/ta/dashboard" element={<TADashboardPage />} />
  <Route path="/ta/users/groups" element={<GroupsPage />} />
  <Route path="/ta/users/operators" element={<OperatorsPage />} />
  <Route path="/ta/features/*" element={<TAFeatureRoutes />} />
  <Route path="/ta/settings/*" element={<TASettingsRoutes />} />

  {/* Course Operator (CO) */}
  <Route path="/co/dashboard" element={<CODashboardPage />} />
  <Route path="/co/courses" element={<CourseListPage />} />
  <Route path="/co/courses/pending" element={<CoursePendingPage />} />
  <Route path="/co/courses/:id" element={<CourseDetailPage />} />
  <Route path="/co/times" element={<CourseTimesPage />} />
  <Route path="/co/times/create" element={<CourseTimeCreatePage />} />
  <Route path="/co/times/:id" element={<CourseTimeDetailPage />} />
  <Route path="/co/enrollments" element={<EnrollmentManagementPage />} />
  <Route path="/co/member-pool" element={<MemberPoolListPage />} />
  <Route path="/co/instructors" element={<InstructorAssignmentsPage />} />

  {/* Tenant User (TU) - 메인 */}
  <Route path="/tu/dashboard" element={<TUDashboardPage />} />
  <Route path="/tu/courses" element={<CoursesExplorePage />} />
  <Route path="/tu/courses/:id" element={<CourseDetailPage />} />
  <Route path="/tu/roadmaps" element={<RoadmapExplorePage />} />
  <Route path="/tu/roadmaps/:id" element={<RoadmapDetailPage />} />
  <Route path="/tu/catalog" element={<CatalogPage />} />
  <Route path="/tu/catalog/:id" element={<CatalogDetailPage />} />
  <Route path="/tu/search" element={<SearchPage />} />
  <Route path="/tu/cart" element={<CartPage />} />
  <Route path="/tu/wishlist" element={<WishlistPage />} />

  {/* Tenant User (TU) - 학습 */}
  <Route path="/tu/learning" element={<MyLearningPage />} />
  <Route path="/tu/learning/:id" element={<LearningDetailPage />} />
  <Route path="/tu/learning/:id/play" element={<LearningPlayerPage />} />

  {/* Tenant User (TU) - 마이페이지 */}
  <Route path="/tu/mypage" element={<MyPageHome />} />
  <Route path="/tu/mypage/profile" element={<ProfilePage />} />
  <Route path="/tu/mypage/teaching" element={<MyTeachingPage />} />
  <Route path="/tu/mypage/certifications" element={<CertificationsPage />} />

  {/* Tenant User (TU) - 강의 제작 */}
  <Route path="/tu/teaching/courses" element={<MyCoursesPage />} />
  <Route path="/tu/teaching/courses/create" element={<CourseCreatePage />} />
  <Route path="/tu/teaching/courses/:id" element={<CourseDetailPage />} />
  <Route path="/tu/teaching/content" element={<MyContentPage />} />
  <Route path="/tu/teaching/content/create" element={<ContentCreatePage />} />
  <Route path="/tu/teaching/content/:id" element={<ContentDetailPage />} />
  <Route path="/tu/teaching/roadmaps" element={<RoadmapListPage />} />

  {/* Tenant User (TU) - B2B */}
  <Route path="/tu/b2b" element={<B2BLandingPage />} />
  <Route path="/tu/b2b/learning" element={<B2BMyLearningPage />} />
  <Route path="/tu/b2b/learning/:id/play" element={<B2BLearningPlayerPage />} />
  <Route path="/tu/b2b/mypage" element={<B2BMyPageHome />} />

  {/* Settings (공통) */}
  <Route path="/:role/settings" element={<SettingsPage />} />
  <Route path="/:role/settings/security" element={<SettingsSecurityPage />} />
  <Route path="/:role/settings/notifications" element={<SettingsNotificationsPage />} />
  <Route path="/:role/settings/appearance" element={<SettingsAppearancePage />} />
  <Route path="/tu/settings/language" element={<SettingsLanguagePage />} />
</Routes>
```

---

## 9. 소스 위치

```
frontend/src/
├── pages/
│   ├── auth/                        # 인증
│   ├── admin/                       # 관리자 인증
│   ├── common/                      # 공통 페이지
│   │   ├── profile/
│   │   └── settings/
│   ├── sa/                          # System Admin
│   │   ├── dashboard/
│   │   ├── tenants/
│   │   ├── settings/
│   │   └── system/
│   ├── ta/                          # Tenant Admin
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── features/
│   │   ├── branding/
│   │   ├── notices/
│   │   └── settings/
│   ├── co/                          # Course Operator
│   │   ├── dashboard/
│   │   ├── course/
│   │   ├── time/
│   │   ├── enrollment/
│   │   ├── member-pool/
│   │   ├── instructor/
│   │   ├── user/
│   │   └── notices/
│   ├── tu/                          # Tenant User
│   │   ├── dashboard/
│   │   ├── main/
│   │   ├── catalog/
│   │   ├── learning/
│   │   ├── mypage/
│   │   ├── teaching/
│   │   │   ├── courses/
│   │   │   ├── content/
│   │   │   └── roadmaps/
│   │   ├── b2b/
│   │   └── settings/
│   └── dev/                         # 개발용
│       └── ComponentShowcase.tsx
├── components/
│   ├── common/                      # 공통 컴포넌트
│   └── layout/
│       ├── sa/
│       ├── ta/
│       ├── co/
│       └── tu/
└── store/
    └── common/
        └── uiStore.ts               # UI 설정 상태
```

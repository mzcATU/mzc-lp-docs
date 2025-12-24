# Frontend 페이지 구조

> Frontend 페이지 컴포넌트 (역할별 분리)

---

## 1. 페이지 구조 개요

```
frontend/src/pages/
├── common/                       # 공통 페이지
│   └── settings/
│       ├── SettingsPage.tsx
│       ├── SettingsSecurityPage.tsx
│       ├── SettingsNotificationsPage.tsx
│       └── SettingsAppearancePage.tsx
├── sa/                           # System Admin (SA)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── tenants/
│   │   ├── TenantListPage.tsx
│   │   └── TenantDetailPage.tsx
│   └── settings/
│       └── SystemSettingsPage.tsx
├── ta/                           # Tenant Admin (TA)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── users/
│   │   └── UserManagementPage.tsx
│   └── settings/
│       └── TenantSettingsPage.tsx
├── to/                           # Tenant Operator (TO)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── contents/
│   │   ├── ContentListPage.tsx
│   │   └── ContentDetailPage.tsx
│   └── learning/
│       └── LearningManagementPage.tsx
└── tu/                           # Tenant User (TU)
    ├── dashboard/
    │   └── DashboardPage.tsx
    ├── learning/
    │   └── MyLearningPage.tsx
    ├── settings/
    │   └── SettingsLanguagePage.tsx
    └── teaching/
        ├── courses/
        │   ├── CourseListPage.tsx
        │   ├── CourseDetailPage.tsx
        │   └── CourseCreatePage.tsx
        └── content/
            ├── ContentPoolPage.tsx
            └── ContentUploadPage.tsx
```

---

## 2. System Admin 페이지 (SA)

### 2.1 DashboardPage

시스템 전체 현황을 표시합니다.

```tsx
// src/pages/sa/dashboard/DashboardPage.tsx
import { useSADashboard } from '@/hooks/sa/useDashboard';
import { SuperAdminLayout } from '@/components/layout/sa';

export const DashboardPage = () => {
  const { data: stats, isLoading } = useSADashboard();

  return (
    <SuperAdminLayout>
      <div className="dashboard-page">
        <h1>시스템 대시보드</h1>
        <div className="stats-grid">
          <StatCard title="전체 테넌트" value={stats?.totalTenants} />
          <StatCard title="활성 사용자" value={stats?.activeUsers} />
          <StatCard title="총 강의 수" value={stats?.totalCourses} />
        </div>
      </div>
    </SuperAdminLayout>
  );
};
```

### 2.2 TenantListPage

테넌트 목록을 관리합니다.

```tsx
// src/pages/sa/tenants/TenantListPage.tsx
import { useTenants } from '@/hooks/sa/useTenants';
import { SuperAdminLayout } from '@/components/layout/sa';

export const TenantListPage = () => {
  const { data: tenants, isLoading } = useTenants();

  return (
    <SuperAdminLayout>
      <div className="tenant-list-page">
        <header>
          <h1>테넌트 관리</h1>
          <Button onClick={() => navigate('/sa/tenants/create')}>
            + 새 테넌트
          </Button>
        </header>
        <table>
          {/* 테넌트 목록 */}
        </table>
      </div>
    </SuperAdminLayout>
  );
};
```

---

## 3. Tenant Admin 페이지 (TA)

### 3.1 UserManagementPage

테넌트 내 사용자를 관리합니다.

```tsx
// src/pages/ta/users/UserManagementPage.tsx
import { useUsers } from '@/hooks/ta/useUsers';
import { TenantAdminLayout } from '@/components/layout/ta';

export const UserManagementPage = () => {
  const { data: users, isLoading } = useUsers();

  return (
    <TenantAdminLayout>
      <div className="user-management-page">
        <header>
          <h1>사용자 관리</h1>
          <Button onClick={handleInviteUser}>+ 사용자 초대</Button>
        </header>
        {/* 사용자 목록 테이블 */}
      </div>
    </TenantAdminLayout>
  );
};
```

---

## 4. Tenant Operator 페이지 (TO)

### 4.1 ContentListPage

운영자용 콘텐츠 목록을 관리합니다.

```tsx
// src/pages/to/contents/ContentListPage.tsx
import { useContents } from '@/hooks/to/useContents';
import { TenantOperatorLayout } from '@/components/layout/to';

export const ContentListPage = () => {
  const { data: contents, isLoading } = useContents();

  return (
    <TenantOperatorLayout>
      <div className="content-list-page">
        <header>
          <h1>콘텐츠 관리</h1>
        </header>
        <ContentGrid contents={contents} />
      </div>
    </TenantOperatorLayout>
  );
};
```

---

## 5. Tenant User 페이지 (TU)

### 5.1 강의 관리 페이지 (CM)

#### CourseListPage

강의 목록을 표시하고 CRUD 기능을 제공합니다.

```tsx
// src/pages/tu/teaching/courses/CourseListPage.tsx
import { useCourses, useDeleteCourse } from '@/hooks/tu/useCourses';
import { TenantUserLayout } from '@/components/layout/tu';

export const CourseListPage = () => {
  const { data: courses, isLoading } = useCourses();
  const deleteMutation = useDeleteCourse();

  const handleDelete = (courseId: number) => {
    if (confirm('강의를 삭제하시겠습니까?')) {
      deleteMutation.mutate(courseId);
    }
  };

  return (
    <TenantUserLayout>
      <div className="course-list-page">
        <header>
          <h1>강의 관리</h1>
          <Link to="/tu/teaching/courses/create">
            <Button>+ 새 강의</Button>
          </Link>
        </header>

        <table>
          <thead>
            <tr>
              <th>강의명</th>
              <th>차시 수</th>
              <th>생성일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {courses?.map((course) => (
              <tr key={course.courseId}>
                <td>
                  <Link to={`/tu/teaching/courses/${course.courseId}`}>
                    {course.courseName}
                  </Link>
                </td>
                <td>{course.itemCount}개</td>
                <td>{formatDate(course.createdAt)}</td>
                <td>
                  <Button onClick={() => handleDelete(course.courseId)}>
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TenantUserLayout>
  );
};
```

**주요 기능**:
- 강의 목록 조회
- 강의 검색/필터링
- 강의 삭제
- 강의 상세 페이지 이동

#### CourseDetailPage

강의 상세 정보와 차시/폴더 계층 구조를 편집합니다.

```tsx
// src/pages/tu/teaching/courses/CourseDetailPage.tsx
import { useCourse, useCourseHierarchy } from '@/hooks/tu/useCourses';
import { TreeView } from '@/components/common/TreeView';
import { TenantUserLayout } from '@/components/layout/tu';

export const CourseDetailPage = () => {
  const { id } = useParams();
  const { data: course } = useCourse(Number(id));
  const { data: hierarchy } = useCourseHierarchy(Number(id));

  return (
    <TenantUserLayout>
      <div className="course-detail-page">
        {/* 강의 정보 */}
        <section className="course-info">
          <h1>{course?.courseName}</h1>
          <Button onClick={handleEditCourse}>수정</Button>
        </section>

        {/* 차시/폴더 계층 구조 */}
        <section className="course-structure">
          <header>
            <h2>커리큘럼 구성</h2>
            <div className="actions">
              <Button onClick={handleAddFolder}>+ 폴더</Button>
              <Button onClick={handleAddItem}>+ 차시</Button>
            </div>
          </header>

          <TreeView
            data={hierarchy}
            onDragDrop={handleReorder}
            renderItem={(item) => (
              <CourseItemRow
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            )}
          />
        </section>

        {/* 학습 순서 설정 */}
        <section className="learning-order">
          <h2>학습 순서</h2>
          <LearningOrderEditor
            courseId={Number(id)}
            items={hierarchy}
          />
        </section>
      </div>
    </TenantUserLayout>
  );
};
```

**주요 기능**:
- 강의 정보 조회/수정
- 차시/폴더 계층 구조 표시 (TreeView)
- 드래그앤드롭으로 순서 변경
- 폴더/차시 추가/수정/삭제
- 학습 순서 설정 (CR)

#### CourseCreatePage

새 강의를 생성합니다.

```tsx
// src/pages/tu/teaching/courses/CourseCreatePage.tsx
import { useCreateCourse } from '@/hooks/tu/useCourses';
import { TenantUserLayout } from '@/components/layout/tu';

export const CourseCreatePage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCourse();

  const handleSubmit = (data: CreateCourseRequest) => {
    createMutation.mutate(data, {
      onSuccess: (response) => {
        navigate(`/tu/teaching/courses/${response.data.data.courseId}`);
      },
    });
  };

  return (
    <TenantUserLayout>
      <div className="course-create-page">
        <h1>새 강의 만들기</h1>

        <form onSubmit={handleSubmit}>
          <FormField label="강의명" required>
            <Input name="courseName" placeholder="강의 이름을 입력하세요" />
          </FormField>

          <FormField label="강사">
            <InstructorSelect name="instructorId" />
          </FormField>

          <div className="actions">
            <Button type="button" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button type="submit" primary>
              생성
            </Button>
          </div>
        </form>
      </div>
    </TenantUserLayout>
  );
};
```

### 5.2 콘텐츠 관리 페이지 (CMS)

#### ContentPoolPage

콘텐츠 파일을 관리하는 메인 페이지입니다.

```tsx
// src/pages/tu/teaching/content/ContentPoolPage.tsx
import { useContents, useFolderTree } from '@/hooks/tu/useContents';
import { FolderTree } from '@/components/common/FolderTree';
import { ContentGrid } from '@/components/common/ContentGrid';
import { TenantUserLayout } from '@/components/layout/tu';

export const ContentPoolPage = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const { data: folders } = useFolderTree();
  const { data: contents } = useContents({ folderId: selectedFolderId });

  return (
    <TenantUserLayout>
      <div className="content-pool-page">
        {/* 좌측: 폴더 트리 */}
        <aside className="folder-sidebar">
          <header>
            <h2>폴더</h2>
            <Button onClick={handleCreateFolder}>+ 새 폴더</Button>
          </header>
          <FolderTree
            data={folders}
            selectedId={selectedFolderId}
            onSelect={setSelectedFolderId}
          />
        </aside>

        {/* 우측: 콘텐츠 목록 */}
        <main className="content-main">
          <header>
            <h1>콘텐츠 풀</h1>
            <div className="actions">
              <Button onClick={handleUpload}>파일 업로드</Button>
              <Button onClick={handleAddExternalLink}>외부 링크</Button>
            </div>
          </header>

          <ContentGrid
            contents={contents?.content}
            onSelect={handleSelectContent}
            onDelete={handleDeleteContent}
          />
        </main>

        {/* 업로드 모달 */}
        <UploadModal
          isOpen={uploadModalOpen}
          folderId={selectedFolderId}
          onClose={() => setUploadModalOpen(false)}
        />
      </div>
    </TenantUserLayout>
  );
};
```

**주요 기능**:
- 폴더 트리 네비게이션 (3단계 계층)
- 콘텐츠 목록 (그리드/리스트 뷰)
- 파일 업로드 (드래그앤드롭)
- 외부 링크 등록 (YouTube, Vimeo, Google Form)
- 콘텐츠 삭제
- 폴더 CRUD

#### ContentUploadPage

파일 업로드 전용 페이지입니다.

```tsx
// src/pages/tu/teaching/content/ContentUploadPage.tsx
import { useUploadContent } from '@/hooks/tu/useContents';
import { FileDropzone } from '@/components/common/FileDropzone';
import { TenantUserLayout } from '@/components/layout/tu';

export const ContentUploadPage = () => {
  const uploadMutation = useUploadContent();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = async (files: File[]) => {
    for (const file of files) {
      await uploadMutation.mutateAsync(file, {
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      });
    }
  };

  return (
    <TenantUserLayout>
      <div className="content-upload-page">
        <h1>콘텐츠 업로드</h1>

        <FileDropzone
          onDrop={handleDrop}
          accept={{
            'video/*': ['.mp4', '.avi', '.mov', '.mkv'],
            'application/pdf': ['.pdf'],
            'image/*': ['.jpg', '.png', '.gif'],
            'audio/*': ['.mp3', '.wav'],
          }}
          maxSize={2 * 1024 * 1024 * 1024} // 2GB
        />

        {uploadProgress > 0 && (
          <ProgressBar value={uploadProgress} />
        )}

        <div className="supported-formats">
          <h3>지원 형식</h3>
          <ul>
            <li>영상: mp4, avi, mov, mkv (최대 2GB)</li>
            <li>문서: pdf, doc, docx, ppt, pptx (최대 100MB)</li>
            <li>이미지: jpg, png, gif, svg (최대 50MB)</li>
            <li>오디오: mp3, wav, m4a (최대 500MB)</li>
          </ul>
        </div>
      </div>
    </TenantUserLayout>
  );
};
```

### 5.3 내 학습 페이지

```tsx
// src/pages/tu/learning/MyLearningPage.tsx
import { useMyLearning } from '@/hooks/tu/useMyLearning';
import { TenantUserLayout } from '@/components/layout/tu';

export const MyLearningPage = () => {
  const { data: learningProgress, isLoading } = useMyLearning();

  return (
    <TenantUserLayout>
      <div className="my-learning-page">
        <h1>내 학습</h1>
        <div className="course-progress-list">
          {learningProgress?.map((progress) => (
            <CourseProgressCard key={progress.courseId} {...progress} />
          ))}
        </div>
      </div>
    </TenantUserLayout>
  );
};
```

---

## 6. 공통 설정 페이지 (Settings)

모든 역할이 사용하는 공통 설정 페이지입니다. `src/pages/common/settings/`에 위치합니다.

### 6.1 SettingsPage (설정 메인)

설정 메뉴 진입점으로, 보안/알림/외관 설정으로 네비게이션합니다.

```tsx
// src/pages/common/settings/SettingsPage.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Bell, Palette, ChevronRight } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const { basePath } = useSettingsPath(); // 역할별 basePath 반환

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
              <ChevronRight />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 6.2 SettingsSecurityPage (보안 설정)

비밀번호 변경, 2FA 설정 등 보안 관련 설정을 관리합니다.

```tsx
// src/pages/common/settings/SettingsSecurityPage.tsx
export function SettingsSecurityPage() {
  return (
    <div className="security-settings">
      <h1>보안 설정</h1>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>비밀번호 변경</Button>
        </CardContent>
      </Card>

      {/* 2단계 인증 */}
      <Card>
        <CardHeader>
          <CardTitle>2단계 인증</CardTitle>
        </CardHeader>
        <CardContent>
          <Switch /> 2단계 인증 활성화
        </CardContent>
      </Card>

      {/* 로그인 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>로그인 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 최근 로그인 목록 */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6.3 SettingsNotificationsPage (알림 설정)

이메일, 푸시 알림 등 알림 관련 설정을 관리합니다.

```tsx
// src/pages/common/settings/SettingsNotificationsPage.tsx
import { EmptyState } from '@/components/common/EmptyState';

export function SettingsNotificationsPage() {
  return (
    <div className="notifications-settings">
      <h1>알림 설정</h1>
      <EmptyState
        icon={Bell}
        title="알림 설정"
        description="알림 설정 기능은 준비 중입니다."
      />
    </div>
  );
}
```

### 6.4 SettingsAppearancePage (외관 설정)

테마 모드, 날짜 형식 등 UI 관련 설정을 관리합니다. `useUIStore`와 연동되어 설정이 localStorage에 저장됩니다.

```tsx
// src/pages/common/settings/SettingsAppearancePage.tsx
import { useUIStore } from '@/store/common/uiStore';
import { RadioOptionCard } from '@/components/common/RadioOptionCard';

export function SettingsAppearancePage() {
  const { isDarkMode, setDarkMode } = useUIStore();

  const themeOptions = [
    { value: 'light', label: '라이트 모드', icon: Sun },
    { value: 'dark', label: '다크 모드', icon: Moon },
  ];

  return (
    <div className="appearance-settings">
      <h1>외관 설정</h1>

      {/* 테마 모드 */}
      <Card>
        <CardHeader>
          <CardTitle>테마 모드</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={isDarkMode ? 'dark' : 'light'}>
            {themeOptions.map((option) => (
              <RadioOptionCard
                key={option.value}
                value={option.value}
                label={option.label}
                icon={option.icon}
                selected={isDarkMode === (option.value === 'dark')}
                onClick={() => setDarkMode(option.value === 'dark')}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 날짜 형식 */}
      <Card>
        <CardHeader>
          <CardTitle>날짜 형식</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 날짜 형식 선택 */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6.5 SettingsLanguagePage (언어 설정 - TU 전용)

TU 역할 전용 언어 설정 페이지입니다. `src/pages/tu/settings/`에 위치합니다.

```tsx
// src/pages/tu/settings/SettingsLanguagePage.tsx
import { useUIStore } from '@/store/common/uiStore';
import { RadioOptionCard } from '@/components/common/RadioOptionCard';

export function SettingsLanguagePage() {
  const { language, setLanguage } = useUIStore();

  const languageOptions = [
    { value: 'ko', label: '한국어', flag: '🇰🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="language-settings">
      <h1>언어 설정</h1>
      <Card>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
```

**주요 특징**:
- `useUIStore`와 연동되어 설정이 localStorage에 자동 저장됨
- `RadioOptionCard` 공통 컴포넌트 사용
- 설정 변경 시 즉시 반영

---

## 7. 공통 컴포넌트

### 7.1 TreeView (계층 구조)

```tsx
// src/components/common/TreeView.tsx
interface TreeViewProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  onDragDrop?: (dragId: number, dropId: number) => void;
  childrenKey?: string;
}

export const TreeView = <T extends { id: number; children?: T[] }>({
  data,
  renderItem,
  onDragDrop,
}: TreeViewProps<T>) => {
  return (
    <ul className="tree-view">
      {data.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          renderItem={renderItem}
          onDragDrop={onDragDrop}
        />
      ))}
    </ul>
  );
};
```

### 7.2 FolderTree (폴더 네비게이션)

```tsx
// src/components/common/FolderTree.tsx
import type { ContentFolder } from '@/types/tu/learning';

interface FolderTreeProps {
  data: ContentFolder[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export const FolderTree = ({ data, selectedId, onSelect }: FolderTreeProps) => {
  return (
    <div className="folder-tree">
      <div
        className={`folder-item ${selectedId === null ? 'selected' : ''}`}
        onClick={() => onSelect(null)}
      >
        전체
      </div>
      {data.map((folder) => (
        <FolderNode
          key={folder.folderId}
          folder={folder}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
};
```

### 7.3 FileDropzone (파일 업로드)

```tsx
// src/components/common/FileDropzone.tsx
import { useDropzone } from 'react-dropzone';

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export const FileDropzone = ({ onDrop, accept, maxSize }: FileDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? 'active' : ''}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>파일을 여기에 놓으세요...</p>
      ) : (
        <p>파일을 드래그하거나 클릭하여 업로드</p>
      )}
    </div>
  );
};
```

---

## 8. 라우팅 설정

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* System Admin (SA) */}
        <Route path="/sa/dashboard" element={<SADashboardPage />} />
        <Route path="/sa/tenants" element={<TenantListPage />} />
        <Route path="/sa/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/sa/settings" element={<SettingsPage />} />
        <Route path="/sa/settings/security" element={<SettingsSecurityPage />} />
        <Route path="/sa/settings/notifications" element={<SettingsNotificationsPage />} />
        <Route path="/sa/settings/appearance" element={<SettingsAppearancePage />} />

        {/* Tenant Admin (TA) */}
        <Route path="/ta/dashboard" element={<TADashboardPage />} />
        <Route path="/ta/users" element={<UserManagementPage />} />
        <Route path="/ta/settings" element={<SettingsPage />} />
        <Route path="/ta/settings/security" element={<SettingsSecurityPage />} />
        <Route path="/ta/settings/notifications" element={<SettingsNotificationsPage />} />
        <Route path="/ta/settings/appearance" element={<SettingsAppearancePage />} />

        {/* Tenant Operator (TO) */}
        <Route path="/to/dashboard" element={<TODashboardPage />} />
        <Route path="/to/contents" element={<TOContentListPage />} />
        <Route path="/to/contents/:id" element={<TOContentDetailPage />} />
        <Route path="/to/learning" element={<LearningManagementPage />} />
        <Route path="/to/settings" element={<SettingsPage />} />
        <Route path="/to/settings/security" element={<SettingsSecurityPage />} />
        <Route path="/to/settings/notifications" element={<SettingsNotificationsPage />} />
        <Route path="/to/settings/appearance" element={<SettingsAppearancePage />} />

        {/* Tenant User (TU) */}
        <Route path="/tu/dashboard" element={<TUDashboardPage />} />
        <Route path="/tu/learning" element={<MyLearningPage />} />
        <Route path="/tu/teaching/courses" element={<CourseListPage />} />
        <Route path="/tu/teaching/courses/create" element={<CourseCreatePage />} />
        <Route path="/tu/teaching/courses/:id" element={<CourseDetailPage />} />
        <Route path="/tu/teaching/content" element={<ContentPoolPage />} />
        <Route path="/tu/teaching/content/upload" element={<ContentUploadPage />} />
        <Route path="/tu/settings" element={<SettingsPage />} />
        <Route path="/tu/settings/security" element={<SettingsSecurityPage />} />
        <Route path="/tu/settings/notifications" element={<SettingsNotificationsPage />} />
        <Route path="/tu/settings/appearance" element={<SettingsAppearancePage />} />
        <Route path="/tu/settings/language" element={<SettingsLanguagePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 9. 소스 위치

```
frontend/src/
├── pages/
│   ├── common/                       # 공통 페이지
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       ├── SettingsSecurityPage.tsx
│   │       ├── SettingsNotificationsPage.tsx
│   │       └── SettingsAppearancePage.tsx
│   ├── sa/                           # System Admin
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── tenants/
│   │   │   ├── TenantListPage.tsx
│   │   │   └── TenantDetailPage.tsx
│   │   └── settings/
│   │       └── SystemSettingsPage.tsx
│   ├── ta/                           # Tenant Admin
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── users/
│   │   │   └── UserManagementPage.tsx
│   │   └── settings/
│   │       └── TenantSettingsPage.tsx
│   ├── to/                           # Tenant Operator
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── contents/
│   │   │   ├── ContentListPage.tsx
│   │   │   └── ContentDetailPage.tsx
│   │   └── learning/
│   │       └── LearningManagementPage.tsx
│   └── tu/                           # Tenant User
│       ├── dashboard/
│       │   └── DashboardPage.tsx
│       ├── learning/
│       │   └── MyLearningPage.tsx
│       ├── settings/
│       │   └── SettingsLanguagePage.tsx
│       └── teaching/
│           ├── courses/
│           │   ├── CourseListPage.tsx
│           │   ├── CourseDetailPage.tsx
│           │   └── CourseCreatePage.tsx
│           └── content/
│               ├── ContentPoolPage.tsx
│               └── ContentUploadPage.tsx
├── components/
│   ├── common/                       # 공통 컴포넌트
│   │   ├── TreeView.tsx
│   │   ├── FolderTree.tsx
│   │   ├── FileDropzone.tsx
│   │   ├── ContentGrid.tsx
│   │   ├── RadioOptionCard.tsx
│   │   ├── EmptyState.tsx
│   │   └── LearningOrderEditor.tsx
│   └── layout/
│       ├── sa/                       # SA 레이아웃
│       │   └── SuperAdminLayout.tsx
│       ├── ta/                       # TA 레이아웃
│       │   └── TenantAdminLayout.tsx
│       ├── to/                       # TO 레이아웃
│       │   └── TenantOperatorLayout.tsx
│       └── tu/                       # TU 레이아웃
│           └── TenantUserLayout.tsx
├── store/
│   └── common/
│       └── uiStore.ts                # UI 설정 상태 (테마, 언어, 사이드바)
└── App.tsx
```

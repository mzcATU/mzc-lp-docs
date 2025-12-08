# Frontend 페이지 구조

> Frontend 페이지 컴포넌트

---

## 1. 페이지 구조 개요

```
frontend/src/pages/
├── courses/                    # 강의 관리 (CM)
│   ├── CourseListPage.tsx      # 강의 목록
│   ├── CourseDetailPage.tsx    # 강의 상세/편집
│   └── CourseCreatePage.tsx    # 강의 생성
├── content/                    # 콘텐츠 관리 (CMS)
│   ├── ContentPoolPage.tsx     # 콘텐츠 풀 (파일 관리)
│   └── ContentUploadPage.tsx   # 콘텐츠 업로드
└── learning/                   # 학습객체 관리 (LO)
    └── LearningObjectsPage.tsx # 학습객체 목록
```

---

## 2. 강의 관리 페이지 (CM)

### 2.1 CourseListPage

강의 목록을 표시하고 CRUD 기능을 제공합니다.

```tsx
// src/pages/courses/CourseListPage.tsx
import { useCourses, useDeleteCourse } from '@/hooks/useCourses';

export const CourseListPage = () => {
  const { data: courses, isLoading } = useCourses();
  const deleteMutation = useDeleteCourse();

  const handleDelete = (courseId: number) => {
    if (confirm('강의를 삭제하시겠습니까?')) {
      deleteMutation.mutate(courseId);
    }
  };

  return (
    <div className="course-list-page">
      <header>
        <h1>강의 관리</h1>
        <Link to="/courses/create">
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
                <Link to={`/courses/${course.courseId}`}>
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
  );
};
```

**주요 기능**:
- 강의 목록 조회
- 강의 검색/필터링
- 강의 삭제
- 강의 상세 페이지 이동

### 2.2 CourseDetailPage

강의 상세 정보와 차시/폴더 계층 구조를 편집합니다.

```tsx
// src/pages/courses/CourseDetailPage.tsx
import { useCourse, useCourseHierarchy } from '@/hooks/useCourses';
import { TreeView } from '@/components/TreeView';

export const CourseDetailPage = () => {
  const { id } = useParams();
  const { data: course } = useCourse(Number(id));
  const { data: hierarchy } = useCourseHierarchy(Number(id));

  return (
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
  );
};
```

**주요 기능**:
- 강의 정보 조회/수정
- 차시/폴더 계층 구조 표시 (TreeView)
- 드래그앤드롭으로 순서 변경
- 폴더/차시 추가/수정/삭제
- 학습 순서 설정 (CR)

### 2.3 CourseCreatePage

새 강의를 생성합니다.

```tsx
// src/pages/courses/CourseCreatePage.tsx
import { useCreateCourse } from '@/hooks/useCourses';

export const CourseCreatePage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCourse();

  const handleSubmit = (data: CreateCourseRequest) => {
    createMutation.mutate(data, {
      onSuccess: (response) => {
        navigate(`/courses/${response.data.data.courseId}`);
      },
    });
  };

  return (
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
  );
};
```

---

## 3. 콘텐츠 관리 페이지 (CMS)

### 3.1 ContentPoolPage

콘텐츠 파일을 관리하는 메인 페이지입니다.

```tsx
// src/pages/content/ContentPoolPage.tsx
import { useContents, useFolderTree } from '@/hooks/useContents';
import { FolderTree } from '@/components/FolderTree';
import { ContentGrid } from '@/components/ContentGrid';

export const ContentPoolPage = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const { data: folders } = useFolderTree();
  const { data: contents } = useContents({ folderId: selectedFolderId });

  return (
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

### 3.2 ContentUploadPage

파일 업로드 전용 페이지입니다.

```tsx
// src/pages/content/ContentUploadPage.tsx
import { useUploadContent } from '@/hooks/useContents';
import { FileDropzone } from '@/components/FileDropzone';

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
  );
};
```

---

## 4. 학습객체 관리 페이지 (LO)

### 4.1 LearningObjectsPage

학습객체 목록을 관리합니다.

```tsx
// src/pages/learning/LearningObjectsPage.tsx
import { useLearningObjects, useFolderTree } from '@/hooks/useLearningObjects';

export const LearningObjectsPage = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const { data: folders } = useFolderTree();
  const { data: learningObjects } = useLearningObjects({
    folderId: selectedFolderId,
    keyword: searchKeyword,
  });

  return (
    <div className="learning-objects-page">
      {/* 좌측: 폴더 트리 */}
      <aside className="folder-sidebar">
        <FolderTree
          data={folders}
          selectedId={selectedFolderId}
          onSelect={setSelectedFolderId}
        />
      </aside>

      {/* 우측: 학습객체 목록 */}
      <main className="lo-main">
        <header>
          <h1>학습객체</h1>
          <SearchInput
            value={searchKeyword}
            onChange={setSearchKeyword}
            placeholder="학습객체 검색..."
          />
        </header>

        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>타입</th>
              <th>재생시간/페이지</th>
              <th>폴더</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {learningObjects?.content.map((lo) => (
              <tr key={lo.learningObjectId}>
                <td>{lo.name}</td>
                <td>
                  <ContentTypeIcon type={lo.content?.contentType} />
                </td>
                <td>{formatDuration(lo.content?.duration)}</td>
                <td>{lo.folder?.folderName || '최상위'}</td>
                <td>
                  <Button onClick={() => handleEdit(lo)}>수정</Button>
                  <Button onClick={() => handleMove(lo)}>이동</Button>
                  <Button onClick={() => handleDelete(lo)}>삭제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* 이동 모달 */}
      <MoveModal
        isOpen={moveModalOpen}
        folders={folders}
        onMove={handleMoveConfirm}
        onClose={() => setMoveModalOpen(false)}
      />
    </div>
  );
};
```

**주요 기능**:
- 학습객체 목록 조회
- 폴더별 필터링
- 이름 검색
- 학습객체 수정 (이름)
- 폴더 간 이동
- 학습객체 삭제

---

## 5. 공통 컴포넌트

### 5.1 TreeView (계층 구조)

```tsx
// src/components/TreeView.tsx
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

### 5.2 FolderTree (폴더 네비게이션)

```tsx
// src/components/FolderTree.tsx
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
        📁 전체
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

### 5.3 FileDropzone (파일 업로드)

```tsx
// src/components/FileDropzone.tsx
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

## 6. 라우팅 설정

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 강의 관리 */}
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/courses/create" element={<CourseCreatePage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />

        {/* 콘텐츠 관리 */}
        <Route path="/content" element={<ContentPoolPage />} />
        <Route path="/content/upload" element={<ContentUploadPage />} />

        {/* 학습객체 관리 */}
        <Route path="/learning-objects" element={<LearningObjectsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 7. 소스 위치

```
frontend/src/
├── pages/
│   ├── courses/
│   │   ├── CourseListPage.tsx
│   │   ├── CourseDetailPage.tsx
│   │   └── CourseCreatePage.tsx
│   ├── content/
│   │   ├── ContentPoolPage.tsx
│   │   └── ContentUploadPage.tsx
│   └── learning/
│       └── LearningObjectsPage.tsx
├── components/
│   ├── TreeView.tsx
│   ├── FolderTree.tsx
│   ├── FileDropzone.tsx
│   ├── ContentGrid.tsx
│   └── LearningOrderEditor.tsx
└── App.tsx
```

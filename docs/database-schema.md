# 데이터베이스 스키마 (Database Schema)

> 작성일: 2026-01-22
> 최종 수정: 2026-01-23
> MZC Learning Platform Database Schema

---

## 📋 개요

### 데이터베이스 정보
- **DBMS**: MySQL 8.0
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB
- **Timezone**: Asia/Seoul

### 스키마 구조
- **총 테이블 수**: 54개 (26개 도메인)
- **멀티테넌트 지원**: Row-Level Security (`tenant_id` 컬럼)
- **감사 로그**: 생성일/수정일 자동 기록
- **낙관적 락**: @Version 필드로 동시성 제어

### 도메인별 테이블 수
| 도메인 | 테이블 수 | 도메인 | 테이블 수 |
|--------|----------|--------|----------|
| User | 6 | Course | 8 |
| Tenant | 5 | Snapshot | 5 |
| Community | 4 | Content | 2 |
| Learning | 2 | Student | 2 |
| Certificate | 2 | Assignment | 2 |
| Notification | 2 | Notice | 2 |
| System | 2 | IIS | 2 |
| Roadmap | 2 | 기타(단일) | 9 |

---

## 🏗️ ERD (주요 관계)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              TENANT                                      │
│  tenants, tenant_settings, tenant_categories, navigation_items          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ 1:N (Row-Level Security)
        ┌────────────────────────┼────────────────────────────┐
        │                        │                            │
┌───────▼───────┐    ┌───────────▼───────────┐    ┌───────────▼───────────┐
│     USER      │    │        COURSE         │    │      MANAGEMENT       │
│  users        │    │  cm_courses           │    │  notices              │
│  user_roles   │    │  cm_course_items      │    │  tenant_notices       │
│  user_groups  │    │  cr_course_relations  │    │  banners              │
│  employees    │    │  cm_course_reviews    │    │  auto_enrollment_rules│
│  departments  │    │  course_announcements │    │  system_settings      │
│  refresh_tokens    └───────────┬───────────┘    └───────────────────────┘
└───────┬───────┘                │ 1:N
        │                        │
        │              ┌─────────▼─────────┐
        │              │     SNAPSHOT      │
        │              │  cm_snapshots     │
        │              │  cm_snapshot_items│
        │              │  cm_snapshot_los  │
        │              │  cm_snapshot_rels │
        │              └─────────┬─────────┘
        │                        │ 1:N
        │              ┌─────────▼─────────┐
        │              │   COURSE_TIME     │
        │              │  course_times     │
        │              └─────────┬─────────┘
        │                        │ 1:N
        └───────────┬────────────┘
                    │
          ┌─────────▼─────────┐
          │    ENROLLMENT     │
          │  sis_enrollments  │
          │  sis_item_progress│
          └─────────┬─────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐   ┌──────▼──────┐  ┌─────▼──────┐
│ASSIGN  │   │ COMMUNITY   │  │ CERTIFICATE│
│ments   │   │ posts/likes │  │ templates  │
│subms   │   │ comments    │  │ issuances  │
└────────┘   └─────────────┘  └────────────┘
```

---

## 📊 테이블 상세

### 1. 테넌트 및 사용자 (UM - User Management)

#### 1.1 tenants (테넌트)
```sql
CREATE TABLE tenants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '테넌트명',
    domain VARCHAR(100) UNIQUE NOT NULL COMMENT '도메인',
    logo_url VARCHAR(500) COMMENT '로고 URL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '상태',
    settings JSON COMMENT '설정',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_domain (domain),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='테넌트';
```

**주요 컬럼:**
- `domain`: 서브도메인 (예: `samsung.mzc-learning.com`)
- `settings`: JSON 형식의 정책 설정 (수료 기준, 알림 설정 등)

---

#### 1.2 users (사용자)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    email VARCHAR(100) NOT NULL COMMENT '이메일',
    password VARCHAR(255) NOT NULL COMMENT '비밀번호 (BCrypt)',
    name VARCHAR(50) NOT NULL COMMENT '이름',
    phone_number VARCHAR(20) COMMENT '전화번호',
    department_id BIGINT COMMENT '부서 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '상태',
    last_login_at TIMESTAMP COMMENT '마지막 로그인',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_email (tenant_id, email),
    INDEX idx_tenant (tenant_id),
    INDEX idx_department (department_id),
    INDEX idx_status (status),
    INDEX idx_name (name),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자';
```

**특징:**
- `tenant_id` + `email`로 유니크 제약 (멀티테넌트)
- 비밀번호는 BCrypt로 암호화 저장

---

#### 1.3 user_roles (사용자 역할)
```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    role_type VARCHAR(30) NOT NULL COMMENT '역할 타입',
    course_id BIGINT COMMENT '연결된 강의 ID (DESIGNER/INSTRUCTOR)',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '부여일',

    UNIQUE KEY uk_user_role_course (user_id, role_type, course_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_role_type (role_type),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자 역할';
```

**role_type 값:**
- `SYSTEM_ADMIN`, `TENANT_ADMIN`, `OPERATOR`
- `DESIGNER`, `INSTRUCTOR`, `USER`

---

#### 1.4 departments (부서)
```sql
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(100) NOT NULL COMMENT '부서명',
    parent_id BIGINT COMMENT '상위 부서 ID',
    path VARCHAR(500) COMMENT '부서 경로',
    order_index INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_parent (parent_id),
    INDEX idx_path (path),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='부서';
```

**특징:**
- 계층 구조 지원 (parent_id)
- `path`: 전체 경로 저장 (예: `/본부/팀`)

---

#### 1.5 refresh_tokens (리프레시 토큰)
```sql
CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    token VARCHAR(500) NOT NULL COMMENT '토큰',
    expires_at TIMESTAMP NOT NULL COMMENT '만료일',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_token (token),
    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='리프레시 토큰';
```

---

### 2. 강의 관리 (CM - Course Management)

#### 2.1 courses (강의 템플릿)
```sql
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    title VARCHAR(200) NOT NULL COMMENT '강의명',
    description TEXT COMMENT '설명',
    category_id BIGINT COMMENT '카테고리 ID',
    level VARCHAR(20) COMMENT '난이도',
    thumbnail_url VARCHAR(500) COMMENT '썸네일 URL',
    designer_id BIGINT NOT NULL COMMENT '설계자 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '상태',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_category (category_id),
    INDEX idx_designer (designer_id),
    INDEX idx_status (status),
    FULLTEXT idx_title (title),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (designer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='강의 템플릿';
```

**status 값:**
- `DRAFT`: 작성 중
- `ACTIVE`: 활성 (수정 가능)
- `ARCHIVED`: 보관됨

---

#### 2.2 course_items (커리큘럼 아이템)
```sql
CREATE TABLE course_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_id BIGINT NOT NULL COMMENT '강의 ID',
    parent_item_id BIGINT COMMENT '상위 아이템 ID',
    item_type VARCHAR(20) NOT NULL COMMENT '아이템 타입',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    description TEXT COMMENT '설명',
    learning_object_id BIGINT COMMENT '학습 객체 ID',
    duration INT COMMENT '소요 시간(초)',
    order_index INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_course (course_id),
    INDEX idx_parent (parent_item_id),
    INDEX idx_order (course_id, order_index),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_item_id) REFERENCES course_items(id) ON DELETE CASCADE,
    FOREIGN KEY (learning_object_id) REFERENCES learning_objects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='커리큘럼 아이템';
```

**item_type 값:**
- `FOLDER`: 폴더 (하위 아이템 포함)
- `CONTENT`: 학습 콘텐츠

---

#### 2.3 course_relations (학습 순서)
```sql
CREATE TABLE course_relations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_id BIGINT NOT NULL COMMENT '강의 ID',
    from_item_id BIGINT NOT NULL COMMENT '시작 아이템 ID',
    to_item_id BIGINT COMMENT '다음 아이템 ID',
    relation_type VARCHAR(20) NOT NULL DEFAULT 'NEXT' COMMENT '관계 타입',

    UNIQUE KEY uk_from_item (from_item_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_course (course_id),
    INDEX idx_to_item (to_item_id),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (from_item_id) REFERENCES course_items(id) ON DELETE CASCADE,
    FOREIGN KEY (to_item_id) REFERENCES course_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 순서';
```

**특징:**
- Linked List 패턴으로 학습 순서 관리
- `from_item_id`는 유니크 (하나의 아이템은 하나의 다음 아이템만 가짐)

---

### 3. 콘텐츠 관리 (CMS - Content Management)

#### 3.1 learning_objects (학습 객체)
```sql
CREATE TABLE learning_objects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    content_type VARCHAR(20) NOT NULL COMMENT '콘텐츠 타입',
    file_url VARCHAR(500) COMMENT '파일 URL',
    external_url VARCHAR(500) COMMENT '외부 링크 URL',
    duration INT COMMENT '소요 시간(초)',
    file_size BIGINT COMMENT '파일 크기(bytes)',
    mime_type VARCHAR(100) COMMENT 'MIME 타입',
    creator_id BIGINT NOT NULL COMMENT '생성자 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '상태',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_content_type (content_type),
    INDEX idx_creator (creator_id),
    INDEX idx_status (status),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (creator_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 객체';
```

**content_type 값:**
- `VIDEO`, `AUDIO`, `DOCUMENT`, `IMAGE`
- `EXTERNAL_LINK`, `QUIZ`, `ASSIGNMENT`

---

### 4. 프로그램 및 스냅샷 (PM, SS)

#### 4.1 programs (강의 개설 신청)
```sql
CREATE TABLE programs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_id BIGINT NOT NULL COMMENT '강의 ID',
    title VARCHAR(200) NOT NULL COMMENT '프로그램명',
    description TEXT COMMENT '설명',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '상태',
    applicant_id BIGINT NOT NULL COMMENT '신청자 ID',
    approved_by BIGINT COMMENT '승인자 ID',
    approved_at TIMESTAMP COMMENT '승인일',
    rejection_reason TEXT COMMENT '반려 사유',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_course (course_id),
    INDEX idx_status (status),
    INDEX idx_applicant (applicant_id),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='강의 개설 신청';
```

**status 값:**
- `DRAFT`: 작성 중
- `PENDING`: 승인 대기
- `APPROVED`: 승인됨
- `REJECTED`: 반려됨

---

#### 4.2 snapshots (스냅샷)
```sql
CREATE TABLE snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    program_id BIGINT NOT NULL COMMENT '프로그램 ID',
    snapshot_name VARCHAR(100) NOT NULL COMMENT '스냅샷명',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '상태',
    published_at TIMESTAMP COMMENT '발행일',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_program (program_id),
    INDEX idx_status (status),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='스냅샷 (불변 강의)';
```

**특징:**
- 승인된 강의의 불변 복사본
- 차수 개설 시 이 스냅샷 사용

---

#### 4.3 snapshot_items (스냅샷 아이템)
```sql
CREATE TABLE snapshot_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    snapshot_id BIGINT NOT NULL COMMENT '스냅샷 ID',
    parent_item_id BIGINT COMMENT '상위 아이템 ID',
    original_item_id BIGINT NOT NULL COMMENT '원본 아이템 ID',
    item_type VARCHAR(20) NOT NULL COMMENT '아이템 타입',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    description TEXT COMMENT '설명',
    learning_object_id BIGINT COMMENT '학습 객체 ID',
    duration INT COMMENT '소요 시간(초)',
    order_index INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_snapshot (snapshot_id),
    INDEX idx_parent (parent_item_id),
    INDEX idx_original (original_item_id),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_item_id) REFERENCES snapshot_items(id) ON DELETE CASCADE,
    FOREIGN KEY (learning_object_id) REFERENCES learning_objects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='스냅샷 아이템';
```

---

### 5. 차수 관리 (TS - Time Session)

#### 5.1 course_times (차수)
```sql
CREATE TABLE course_times (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    program_id BIGINT NOT NULL COMMENT '프로그램 ID',
    snapshot_id BIGINT NOT NULL COMMENT '스냅샷 ID',
    time_name VARCHAR(100) NOT NULL COMMENT '차수명',
    delivery_type VARCHAR(20) NOT NULL COMMENT '수강 방식',
    enrollment_type VARCHAR(20) NOT NULL COMMENT '수강 신청 방식',
    capacity INT COMMENT '정원 (0=무제한)',
    price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '가격',
    start_date DATE NOT NULL COMMENT '시작일',
    end_date DATE NOT NULL COMMENT '종료일',
    enroll_start_date DATE NOT NULL COMMENT '신청 시작일',
    enroll_end_date DATE NOT NULL COMMENT '신청 종료일',
    location_info VARCHAR(500) COMMENT '장소 정보',
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' COMMENT '상태',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_program (program_id),
    INDEX idx_snapshot (snapshot_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (program_id) REFERENCES programs(id),
    FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='차수';
```

**delivery_type 값:**
- `ONLINE`: 온라인
- `OFFLINE`: 오프라인
- `BLENDED`: 혼합

**enrollment_type 값:**
- `AUTO`: 자동 승인
- `APPROVAL`: 관리자 승인
- `INVITE_ONLY`: 초대 전용

**status 값:**
- `SCHEDULED`: 예정
- `ACTIVE`: 진행 중
- `COMPLETED`: 종료
- `CANCELLED`: 취소됨

---

### 6. 수강 관리 (EM - Enrollment Management)

#### 6.1 enrollments (수강)
```sql
CREATE TABLE enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_time_id BIGINT NOT NULL COMMENT '차수 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태',
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청일',
    approved_at TIMESTAMP COMMENT '승인일',
    approved_by BIGINT COMMENT '승인자 ID',
    rejection_reason TEXT COMMENT '반려 사유',
    completed_at TIMESTAMP COMMENT '수료일',

    UNIQUE KEY uk_coursetime_user (course_time_id, user_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_course_time (course_time_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (course_time_id) REFERENCES course_times(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='수강';
```

**status 값:**
- `PENDING`: 승인 대기
- `APPROVED`: 승인됨 (수강 중)
- `REJECTED`: 반려됨
- `COMPLETED`: 수료
- `CANCELLED`: 취소됨

---

### 7. 학습 진행 (PGM - Progress Management)

#### 7.1 learning_progress (학습 진행)
```sql
CREATE TABLE learning_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    enrollment_id BIGINT NOT NULL COMMENT '수강 ID',
    snapshot_item_id BIGINT NOT NULL COMMENT '스냅샷 아이템 ID',
    progress_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' COMMENT '진행 상태',
    time_spent INT NOT NULL DEFAULT 0 COMMENT '학습 시간(초)',
    last_position INT COMMENT '마지막 재생 위치(초)',
    completed_at TIMESTAMP COMMENT '완료일',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_enrollment_item (enrollment_id, snapshot_item_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_item (snapshot_item_id),
    INDEX idx_status (progress_status),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (snapshot_item_id) REFERENCES snapshot_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 진행';
```

**progress_status 값:**
- `NOT_STARTED`: 시작 안 함
- `IN_PROGRESS`: 진행 중
- `COMPLETED`: 완료

---

### 8. 평가 관리 (Assessment)

#### 8.1 assignments (과제)
```sql
CREATE TABLE assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    snapshot_item_id BIGINT NOT NULL COMMENT '스냅샷 아이템 ID',
    title VARCHAR(200) NOT NULL COMMENT '과제명',
    description TEXT COMMENT '설명',
    max_score INT NOT NULL DEFAULT 100 COMMENT '만점',
    due_date TIMESTAMP COMMENT '마감일',
    allow_late BOOLEAN NOT NULL DEFAULT FALSE COMMENT '지각 제출 허용',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_item (snapshot_item_id),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (snapshot_item_id) REFERENCES snapshot_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='과제';
```

---

#### 8.2 submissions (과제 제출)
```sql
CREATE TABLE submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    assignment_id BIGINT NOT NULL COMMENT '과제 ID',
    enrollment_id BIGINT NOT NULL COMMENT '수강 ID',
    content TEXT COMMENT '제출 내용',
    file_url VARCHAR(500) COMMENT '제출 파일 URL',
    score INT COMMENT '점수',
    feedback TEXT COMMENT '피드백',
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' COMMENT '상태',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '제출일',
    graded_at TIMESTAMP COMMENT '채점일',
    graded_by BIGINT COMMENT '채점자 ID',

    UNIQUE KEY uk_assignment_enrollment (assignment_id, enrollment_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_assignment (assignment_id),
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_status (status),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
    FOREIGN KEY (graded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='과제 제출';
```

**status 값:**
- `SUBMITTED`: 제출됨
- `GRADED`: 채점 완료
- `RETURNED`: 재제출 요청

---

#### 8.3 quizzes (퀴즈)
```sql
CREATE TABLE quizzes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    snapshot_item_id BIGINT NOT NULL COMMENT '스냅샷 아이템 ID',
    title VARCHAR(200) NOT NULL COMMENT '퀴즈명',
    description TEXT COMMENT '설명',
    time_limit INT COMMENT '제한 시간(초)',
    passing_score INT NOT NULL DEFAULT 60 COMMENT '합격 점수',
    max_attempts INT COMMENT '최대 응시 횟수',
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE COMMENT '문제 순서 섞기',
    shuffle_options BOOLEAN NOT NULL DEFAULT FALSE COMMENT '선택지 순서 섞기',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_item (snapshot_item_id),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (snapshot_item_id) REFERENCES snapshot_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='퀴즈';
```

---

#### 8.4 quiz_questions (퀴즈 문제)
```sql
CREATE TABLE quiz_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    quiz_id BIGINT NOT NULL COMMENT '퀴즈 ID',
    question_text TEXT NOT NULL COMMENT '문제',
    question_type VARCHAR(20) NOT NULL COMMENT '문제 유형',
    points INT NOT NULL DEFAULT 10 COMMENT '배점',
    order_index INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',
    explanation TEXT COMMENT '해설',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_quiz (quiz_id),
    INDEX idx_order (quiz_id, order_index),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='퀴즈 문제';
```

**question_type 값:**
- `MULTIPLE_CHOICE`: 객관식 (단일 선택)
- `MULTIPLE_ANSWER`: 객관식 (복수 선택)
- `SHORT_ANSWER`: 주관식 (단답형)
- `ESSAY`: 주관식 (서술형)

---

### 9. 알림 (NM - Notification Management)

#### 9.1 notifications (알림)
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    notification_type VARCHAR(30) NOT NULL COMMENT '알림 타입',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    message TEXT NOT NULL COMMENT '내용',
    related_url VARCHAR(500) COMMENT '관련 URL',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '읽음 여부',
    read_at TIMESTAMP COMMENT '읽은 시간',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_type (notification_type),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='알림';
```

**notification_type 예시:**
- `ENROLLMENT_APPROVED`, `ENROLLMENT_REJECTED`
- `ASSIGNMENT_GRADED`, `QUIZ_RESULT`
- `COURSE_STARTED`, `COURSE_ENDING_SOON`

---

### 10. 기타

#### 10.1 categories (카테고리)
```sql
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(100) NOT NULL COMMENT '카테고리명',
    parent_id BIGINT COMMENT '상위 카테고리 ID',
    order_index INT NOT NULL DEFAULT 0 COMMENT '정렬 순서',

    INDEX idx_tenant (tenant_id),
    INDEX idx_parent (parent_id),

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='카테고리';
```

---

#### 10.2 audit_logs (감사 로그)
```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT COMMENT '테넌트 ID',
    user_id BIGINT COMMENT '사용자 ID',
    action VARCHAR(50) NOT NULL COMMENT '액션',
    entity_type VARCHAR(50) NOT NULL COMMENT '엔티티 타입',
    entity_id BIGINT COMMENT '엔티티 ID',
    details JSON COMMENT '상세 정보',
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='감사 로그';
```

---

## 🔑 인덱스 전략

### 주요 인덱스
1. **멀티테넌트**: 모든 테이블에 `tenant_id` 인덱스
2. **외래키**: 모든 FK 컬럼에 인덱스
3. **상태**: `status` 컬럼 (자주 필터링됨)
4. **날짜**: 조회 범위 쿼리용 (start_date, end_date)
5. **검색**: 제목 컬럼에 FULLTEXT 인덱스

### 복합 인덱스
- `(tenant_id, email)`: 사용자 조회
- `(course_id, order_index)`: 커리큘럼 정렬
- `(enrollment_id, snapshot_item_id)`: 학습 진행 조회

---

## 🔒 제약 조건

### 유니크 제약
- `(tenant_id, email)` - users
- `(course_time_id, user_id)` - enrollments
- `(enrollment_id, snapshot_item_id)` - learning_progress

### 외래키 제약
- `ON DELETE CASCADE`: 부모 삭제 시 자식도 삭제
- `ON DELETE SET NULL`: 부모 삭제 시 NULL 설정 (선택적)

---

## 📊 성능 최적화

### 파티셔닝
```sql
-- 로그 테이블을 월 단위로 파티셔닝
ALTER TABLE audit_logs PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    PARTITION p202602 VALUES LESS THAN (202603),
    ...
);
```

### 아카이빙
- 1년 이상 된 audit_logs는 별도 테이블로 이동
- 종료된 course_times 데이터는 압축 저장

---

## 🔄 마이그레이션

### 초기 데이터
```sql
-- 시스템 테넌트
INSERT INTO tenants (name, domain, status) VALUES ('System', 'system', 'ACTIVE');

-- 기본 카테고리
INSERT INTO categories (tenant_id, name) VALUES (1, 'IT'), (1, '개발'), (1, '디자인');
```

### 버전 관리
- Flyway 사용
- 파일명: `V{version}__{description}.sql`
- 예: `V001__create_initial_tables.sql`

---

### 11. 테넌트 확장 (Tenant Extension)

#### 11.1 tenant_settings (테넌트 설정)
```sql
CREATE TABLE tenant_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL UNIQUE COMMENT '테넌트 ID',
    logo_url VARCHAR(500) COMMENT '로고 URL',
    primary_color VARCHAR(20) COMMENT '주 테마 색상',
    default_language VARCHAR(10) DEFAULT 'ko' COMMENT '기본 언어',
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul' COMMENT '타임존',
    allow_self_registration BOOLEAN DEFAULT TRUE COMMENT '자가 등록 허용',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) COMMENT='테넌트 설정';
```

#### 11.2 tenant_categories (테넌트 카테고리)
```sql
CREATE TABLE tenant_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(100) NOT NULL COMMENT '카테고리명',
    slug VARCHAR(100) NOT NULL COMMENT 'URL 슬러그',
    description TEXT COMMENT '설명',
    icon VARCHAR(50) COMMENT '아이콘',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    enabled BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_slug (tenant_id, slug),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='테넌트별 카테고리';
```

#### 11.3 navigation_items (네비게이션 메뉴)
```sql
CREATE TABLE navigation_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    label VARCHAR(100) NOT NULL COMMENT '메뉴 라벨',
    icon VARCHAR(50) COMMENT '아이콘',
    path VARCHAR(200) NOT NULL COMMENT 'URL 경로',
    enabled BOOLEAN DEFAULT TRUE COMMENT '활성화',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    target VARCHAR(20) DEFAULT '_self' COMMENT '링크 타겟',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='테넌트별 네비게이션';
```

---

### 12. 사용자 확장 (User Extension)

#### 12.1 user_groups (사용자 그룹)
```sql
CREATE TABLE user_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(100) NOT NULL COMMENT '그룹명',
    description TEXT COMMENT '설명',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='사용자 그룹';
```

#### 12.2 user_course_roles (사용자-강의별 역할)
```sql
CREATE TABLE user_course_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    course_id BIGINT NOT NULL COMMENT '강의 ID',
    role VARCHAR(30) NOT NULL COMMENT '역할 (DESIGNER, INSTRUCTOR)',
    revenue_share_percent INT COMMENT '수익 배분율',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_course_role (user_id, course_id, role),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='사용자-강의별 역할';
```

#### 12.3 employees (직원)
```sql
CREATE TABLE employees (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT COMMENT '연결된 사용자 ID',
    employee_number VARCHAR(50) NOT NULL COMMENT '사번',
    position VARCHAR(100) COMMENT '직위',
    job_title VARCHAR(100) COMMENT '직책',
    department_id BIGINT COMMENT '부서 ID',
    hire_date DATE COMMENT '입사일',
    resignation_date DATE COMMENT '퇴사일',
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT '상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_empno (tenant_id, employee_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
) COMMENT='직원 정보';
```

---

### 13. 콘텐츠 관리 (Content Management)

#### 13.1 content (콘텐츠)
```sql
CREATE TABLE content (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    status VARCHAR(20) NOT NULL COMMENT '상태 (DRAFT, ACTIVE, ARCHIVED)',
    content_type VARCHAR(30) NOT NULL COMMENT '콘텐츠 타입 (VIDEO, DOCUMENT, etc)',
    original_file_name VARCHAR(255) COMMENT '원본 파일명',
    stored_file_name VARCHAR(255) COMMENT '저장 파일명',
    file_size BIGINT COMMENT '파일 크기(bytes)',
    duration INT COMMENT '재생 시간(초)',
    resolution VARCHAR(20) COMMENT '해상도 (1080p, 720p)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_status (status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='콘텐츠';
```

#### 13.2 content_version (콘텐츠 버전)
```sql
CREATE TABLE content_version (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    content_id BIGINT NOT NULL COMMENT '콘텐츠 ID',
    version_number INT NOT NULL COMMENT '버전 번호',
    change_type VARCHAR(30) COMMENT '변경 유형',
    stored_file_name VARCHAR(255) COMMENT '저장 파일명',
    file_size BIGINT COMMENT '파일 크기(bytes)',
    duration INT COMMENT '재생 시간(초)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
) COMMENT='콘텐츠 버전 이력';
```

#### 13.3 content_folder (콘텐츠 폴더)
```sql
CREATE TABLE content_folder (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    folder_name VARCHAR(200) NOT NULL COMMENT '폴더명',
    parent_id BIGINT COMMENT '상위 폴더 ID',
    depth INT DEFAULT 0 COMMENT '깊이',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES content_folder(id)
) COMMENT='콘텐츠 폴더';
```

---

### 14. 학습 객체 (Learning Object)

#### 14.1 learning_object (학습 객체)
```sql
CREATE TABLE learning_object (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(200) NOT NULL COMMENT '학습 객체명',
    content_id BIGINT COMMENT '연결된 콘텐츠 ID',
    folder_id BIGINT COMMENT '폴더 ID',
    completion_criteria VARCHAR(30) COMMENT '완료 기준',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (content_id) REFERENCES content(id),
    FOREIGN KEY (folder_id) REFERENCES content_folder(id)
) COMMENT='학습 객체';
```

---

### 15. 강의 확장 (Course Extension)

#### 15.1 cm_course_reviews (강의 리뷰)
```sql
CREATE TABLE cm_course_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_time_id BIGINT NOT NULL COMMENT '차수 ID',
    user_id BIGINT NOT NULL COMMENT '작성자 ID',
    rating INT NOT NULL COMMENT '평점 (1-5)',
    content TEXT COMMENT '리뷰 내용',
    completion_rate INT COMMENT '작성 시점 진도율',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_time_user (course_time_id, user_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='강의 리뷰';
```

#### 15.2 course_announcements (강의 공지)
```sql
CREATE TABLE course_announcements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_id BIGINT COMMENT '강의 ID (전체 강의)',
    course_time_id BIGINT COMMENT '차수 ID (특정 차수)',
    author_id BIGINT NOT NULL COMMENT '작성자 ID',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    content TEXT NOT NULL COMMENT '내용',
    is_important BOOLEAN DEFAULT FALSE COMMENT '중요 공지',
    view_count INT DEFAULT 0 COMMENT '조회수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='강의별 공지사항';
```

---

### 16. 스냅샷 (Snapshot - 불변 강의 구조)

#### 16.1 cm_snapshots (스냅샷)
```sql
CREATE TABLE cm_snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    course_id BIGINT NOT NULL COMMENT '원본 강의 ID',
    snapshot_name VARCHAR(100) NOT NULL COMMENT '스냅샷명',
    description TEXT COMMENT '설명',
    hashtags JSON COMMENT '해시태그 목록',
    status VARCHAR(20) NOT NULL COMMENT '상태 (DRAFT, PUBLISHED)',
    version INT DEFAULT 1 COMMENT '버전',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (course_id) REFERENCES cm_courses(id)
) COMMENT='스냅샷 (불변 강의)';
```

#### 16.2 cm_snapshot_items (스냅샷 아이템)
```sql
CREATE TABLE cm_snapshot_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    snapshot_id BIGINT NOT NULL COMMENT '스냅샷 ID',
    item_name VARCHAR(200) NOT NULL COMMENT '아이템명',
    depth INT NOT NULL COMMENT '깊이',
    item_type VARCHAR(20) NOT NULL COMMENT '아이템 타입',
    source_item_id BIGINT COMMENT '원본 아이템 ID',
    parent_id BIGINT COMMENT '상위 아이템 ID',
    lo_id BIGINT COMMENT '스냅샷 학습 객체 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (snapshot_id) REFERENCES cm_snapshots(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES cm_snapshot_items(id)
) COMMENT='스냅샷 아이템';
```

#### 16.3 cm_snapshot_los (스냅샷 학습 객체)
```sql
CREATE TABLE cm_snapshot_los (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    source_lo_id BIGINT COMMENT '원본 학습 객체 ID',
    content_id BIGINT COMMENT '콘텐츠 ID',
    display_name VARCHAR(200) COMMENT '표시명',
    duration INT COMMENT '재생 시간(초)',
    resolution VARCHAR(20) COMMENT '해상도',
    downloadable BOOLEAN DEFAULT FALSE COMMENT '다운로드 허용',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='스냅샷 학습 객체';
```

#### 16.4 cm_snapshot_relations (스냅샷 학습 순서)
```sql
CREATE TABLE cm_snapshot_relations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    snapshot_id BIGINT NOT NULL COMMENT '스냅샷 ID',
    from_item_id BIGINT NOT NULL COMMENT '시작 아이템 ID',
    to_item_id BIGINT COMMENT '다음 아이템 ID',

    FOREIGN KEY (snapshot_id) REFERENCES cm_snapshots(id) ON DELETE CASCADE,
    FOREIGN KEY (from_item_id) REFERENCES cm_snapshot_items(id),
    FOREIGN KEY (to_item_id) REFERENCES cm_snapshot_items(id)
) COMMENT='스냅샷 학습 순서';
```

---

### 17. 수강 관리 (SIS - Student Information System)

#### 17.1 sis_enrollments (수강 등록)
```sql
CREATE TABLE sis_enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '학습자 ID',
    course_time_id BIGINT NOT NULL COMMENT '차수 ID',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    type VARCHAR(20) COMMENT '등록 유형 (SELF, ADMIN, AUTO)',
    status VARCHAR(20) NOT NULL COMMENT '상태 (ACTIVE, COMPLETED, CANCELLED)',
    progress_percent INT DEFAULT 0 COMMENT '진도율',
    score INT COMMENT '점수',
    completed_at TIMESTAMP COMMENT '수료일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_time (user_id, course_time_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='수강 등록';
```

#### 17.2 sis_item_progress (아이템별 진행)
```sql
CREATE TABLE sis_item_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    enrollment_id BIGINT NOT NULL COMMENT '수강 ID',
    item_id BIGINT NOT NULL COMMENT '스냅샷 아이템 ID',
    progress_percent INT DEFAULT 0 COMMENT '진도율',
    watched_seconds INT DEFAULT 0 COMMENT '시청 시간(초)',
    completed BOOLEAN DEFAULT FALSE COMMENT '완료 여부',
    completed_at TIMESTAMP COMMENT '완료일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_enrollment_item (enrollment_id, item_id),
    FOREIGN KEY (enrollment_id) REFERENCES sis_enrollments(id) ON DELETE CASCADE
) COMMENT='아이템별 학습 진행';
```

---

### 18. 수료증 (Certificate)

#### 18.1 certificate_templates (수료증 템플릿)
```sql
CREATE TABLE certificate_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    template_code VARCHAR(50) NOT NULL COMMENT '템플릿 코드',
    title VARCHAR(200) NOT NULL COMMENT '수료증 제목',
    background_image_url VARCHAR(500) COMMENT '배경 이미지 URL',
    certificate_body_html TEXT COMMENT '본문 HTML',
    validity_months INT COMMENT '유효 기간(월)',
    is_default BOOLEAN DEFAULT FALSE COMMENT '기본 템플릿 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_code (tenant_id, template_code),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='수료증 템플릿';
```

#### 18.2 certificates (발급된 수료증)
```sql
CREATE TABLE certificates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    certificate_number VARCHAR(50) NOT NULL COMMENT '수료증 번호',
    user_id BIGINT NOT NULL COMMENT '수료자 ID',
    user_name VARCHAR(100) NOT NULL COMMENT '수료자 이름',
    enrollment_id BIGINT NOT NULL COMMENT '수강 ID',
    course_time_id BIGINT NOT NULL COMMENT '차수 ID',
    template_id BIGINT COMMENT '템플릿 ID',
    status VARCHAR(20) NOT NULL COMMENT '상태 (ISSUED, REVOKED)',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '발급일',
    expires_at TIMESTAMP COMMENT '만료일',

    UNIQUE KEY uk_cert_number (certificate_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (template_id) REFERENCES certificate_templates(id)
) COMMENT='발급된 수료증';
```

---

### 19. 커뮤니티 (Community)

#### 19.1 community_posts (게시글)
```sql
CREATE TABLE community_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    type VARCHAR(20) NOT NULL COMMENT '타입 (QUESTION, DISCUSSION, NOTICE)',
    category VARCHAR(50) COMMENT '카테고리',
    title VARCHAR(300) NOT NULL COMMENT '제목',
    content TEXT NOT NULL COMMENT '내용',
    author_id BIGINT NOT NULL COMMENT '작성자 ID',
    view_count INT DEFAULT 0 COMMENT '조회수',
    is_pinned BOOLEAN DEFAULT FALSE COMMENT '고정 여부',
    is_solved BOOLEAN DEFAULT FALSE COMMENT '해결 여부 (Q&A)',
    course_time_id BIGINT COMMENT '연결된 차수 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_course_time (course_time_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='커뮤니티 게시글';
```

#### 19.2 community_comments (댓글)
```sql
CREATE TABLE community_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    post_id BIGINT NOT NULL COMMENT '게시글 ID',
    author_id BIGINT NOT NULL COMMENT '작성자 ID',
    content TEXT NOT NULL COMMENT '내용',
    parent_id BIGINT COMMENT '상위 댓글 ID (대댓글)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES community_comments(id)
) COMMENT='커뮤니티 댓글';
```

#### 19.3 community_post_likes (게시글 좋아요)
```sql
CREATE TABLE community_post_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL COMMENT '게시글 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_post_user (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
) COMMENT='게시글 좋아요';
```

#### 19.4 community_comment_likes (댓글 좋아요)
```sql
CREATE TABLE community_comment_likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    comment_id BIGINT NOT NULL COMMENT '댓글 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_comment_user (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE
) COMMENT='댓글 좋아요';
```

---

### 20. 공지사항 (Notice)

#### 20.1 notices (시스템 공지)
```sql
CREATE TABLE notices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(300) NOT NULL COMMENT '제목',
    content TEXT NOT NULL COMMENT '내용',
    type VARCHAR(20) NOT NULL COMMENT '타입 (SYSTEM, MAINTENANCE, UPDATE)',
    status VARCHAR(20) NOT NULL COMMENT '상태 (DRAFT, PUBLISHED, EXPIRED)',
    is_pinned BOOLEAN DEFAULT FALSE COMMENT '고정 여부',
    published_at TIMESTAMP COMMENT '게시일',
    expired_at TIMESTAMP COMMENT '만료일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='시스템 공지 (전체 테넌트)';
```

#### 20.2 notice_distributions (공지 배포)
```sql
CREATE TABLE notice_distributions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    notice_id BIGINT NOT NULL COMMENT '공지 ID',
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
    read_at TIMESTAMP COMMENT '읽은 시간',

    UNIQUE KEY uk_notice_tenant (notice_id, tenant_id),
    FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='공지 배포 현황';
```

#### 20.3 tenant_notices (테넌트 공지)
```sql
CREATE TABLE tenant_notices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    title VARCHAR(300) NOT NULL COMMENT '제목',
    content TEXT NOT NULL COMMENT '내용',
    type VARCHAR(20) NOT NULL COMMENT '타입 (GENERAL, IMPORTANT, EVENT)',
    status VARCHAR(20) NOT NULL COMMENT '상태 (DRAFT, PUBLISHED, EXPIRED)',
    target_audience VARCHAR(30) COMMENT '대상 (ALL, ADMIN, LEARNER)',
    is_pinned BOOLEAN DEFAULT FALSE COMMENT '고정 여부',
    published_at TIMESTAMP COMMENT '게시일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_tenant_status (tenant_id, status),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='테넌트별 공지사항';
```

---

### 21. 알림 템플릿 (Notification Template)

#### 21.1 notification_templates (알림 템플릿)
```sql
CREATE TABLE notification_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT COMMENT '테넌트 ID (NULL=시스템 공통)',
    trigger_type VARCHAR(50) NOT NULL COMMENT '트리거 타입',
    category VARCHAR(30) NOT NULL COMMENT '카테고리',
    name VARCHAR(100) NOT NULL COMMENT '템플릿명',
    title_template VARCHAR(300) NOT NULL COMMENT '제목 템플릿',
    message_template TEXT NOT NULL COMMENT '메시지 템플릿',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_trigger (tenant_id, trigger_type)
) COMMENT='알림 템플릿';
```

---

### 22. 기타 관리 (Management)

#### 22.1 banners (배너)
```sql
CREATE TABLE banners (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    title VARCHAR(200) NOT NULL COMMENT '배너 제목',
    image_url VARCHAR(500) NOT NULL COMMENT '이미지 URL',
    link_url VARCHAR(500) COMMENT '링크 URL',
    position VARCHAR(30) NOT NULL COMMENT '위치 (MAIN_TOP, MAIN_MIDDLE)',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화',
    start_date DATE COMMENT '시작일',
    end_date DATE COMMENT '종료일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant_position (tenant_id, position),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='배너';
```

#### 22.2 cart_items (장바구니)
```sql
CREATE TABLE cart_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    course_time_id BIGINT NOT NULL COMMENT '차수 ID',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '추가일',

    UNIQUE KEY uk_user_time (user_id, course_time_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='장바구니';
```

#### 22.3 cm_wishlist_items (위시리스트)
```sql
CREATE TABLE cm_wishlist_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    course_time_id BIGINT NOT NULL COMMENT '차수 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_user_time (user_id, course_time_id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='위시리스트';
```

#### 22.4 member_pools (멤버풀)
```sql
CREATE TABLE member_pools (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(100) NOT NULL COMMENT '멤버풀명',
    description TEXT COMMENT '설명',
    condition_type VARCHAR(30) COMMENT '조건 타입',
    condition_value JSON COMMENT '조건 값',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='멤버풀 (자동 수강 대상 그룹)';
```

#### 22.5 auto_enrollment_rules (자동수강규칙)
```sql
CREATE TABLE auto_enrollment_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    name VARCHAR(100) NOT NULL COMMENT '규칙명',
    description TEXT COMMENT '설명',
    trigger_type VARCHAR(30) NOT NULL COMMENT '트리거 (HIRE, DEPARTMENT_CHANGE)',
    department_id BIGINT COMMENT '대상 부서 ID',
    course_time_id BIGINT COMMENT '자동 등록할 차수 ID',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='자동수강규칙';
```

---

### 23. 로드맵 (Roadmap)

#### 23.1 roadmaps (로드맵)
```sql
CREATE TABLE roadmaps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    title VARCHAR(200) NOT NULL COMMENT '로드맵 제목',
    description TEXT COMMENT '설명',
    author_id BIGINT NOT NULL COMMENT '작성자 ID',
    status VARCHAR(20) NOT NULL COMMENT '상태 (DRAFT, PUBLISHED)',
    enrolled_students INT DEFAULT 0 COMMENT '등록 학습자 수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='학습 로드맵';
```

#### 23.2 roadmap_programs (로드맵 구성)
```sql
CREATE TABLE roadmap_programs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    roadmap_id BIGINT NOT NULL COMMENT '로드맵 ID',
    program_id BIGINT NOT NULL COMMENT '프로그램 ID',
    order_index INT NOT NULL COMMENT '순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
) COMMENT='로드맵 구성 프로그램';
```

---

### 24. 강사 배정 (IIS - Instructor Information System)

#### 24.1 iis_instructor_assignments (강사 배정)
```sql
CREATE TABLE iis_instructor_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT NOT NULL COMMENT '테넌트 ID',
    user_key BIGINT NOT NULL COMMENT '강사 사용자 ID',
    time_key BIGINT NOT NULL COMMENT '차수 ID',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '배정일',
    role VARCHAR(30) NOT NULL COMMENT '역할 (MAIN, ASSISTANT)',
    status VARCHAR(20) NOT NULL COMMENT '상태 (ACTIVE, REPLACED)',
    replaced_at TIMESTAMP COMMENT '교체일',
    assigned_by BIGINT COMMENT '배정자 ID',

    UNIQUE KEY uk_user_time_role (user_key, time_key, role),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) COMMENT='강사 배정';
```

#### 24.2 iis_assignment_history (배정 이력)
```sql
CREATE TABLE iis_assignment_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    assignment_id BIGINT NOT NULL COMMENT '배정 ID',
    action VARCHAR(30) NOT NULL COMMENT '액션 (ASSIGNED, REPLACED, REMOVED)',
    old_status VARCHAR(20) COMMENT '이전 상태',
    new_status VARCHAR(20) COMMENT '새 상태',
    old_role VARCHAR(30) COMMENT '이전 역할',
    new_role VARCHAR(30) COMMENT '새 역할',
    reason TEXT COMMENT '사유',
    changed_by BIGINT COMMENT '변경자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assignment_id) REFERENCES iis_instructor_assignments(id)
) COMMENT='강사 배정 이력';
```

---

### 25. 시스템 설정 (System Settings)

#### 25.1 system_settings (시스템 설정)
```sql
CREATE TABLE system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    platform_name VARCHAR(100) NOT NULL COMMENT '플랫폼명',
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul' COMMENT '기본 타임존',
    maintenance_mode BOOLEAN DEFAULT FALSE COMMENT '점검 모드',
    session_timeout_minutes INT DEFAULT 30 COMMENT '세션 타임아웃(분)',
    max_login_attempts INT DEFAULT 5 COMMENT '최대 로그인 시도',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='시스템 전역 설정';
```

#### 25.2 tenant_defaults (테넌트 기본값)
```sql
CREATE TABLE tenant_defaults (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    default_max_users INT DEFAULT 1000 COMMENT '기본 최대 사용자 수',
    default_max_courses INT DEFAULT 100 COMMENT '기본 최대 강의 수',
    default_max_storage_gb INT DEFAULT 50 COMMENT '기본 최대 스토리지(GB)',
    default_max_admins INT DEFAULT 5 COMMENT '기본 최대 관리자 수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='신규 테넌트 기본값';
```

---

### 26. 분석 (Analytics)

#### 26.1 activity_logs (활동 로그)
```sql
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id BIGINT COMMENT '테넌트 ID',
    user_id BIGINT COMMENT '사용자 ID',
    user_name VARCHAR(100) COMMENT '사용자 이름',
    user_email VARCHAR(100) COMMENT '사용자 이메일',
    activity_type VARCHAR(50) NOT NULL COMMENT '활동 유형',
    description TEXT COMMENT '설명',
    target_type VARCHAR(50) COMMENT '대상 타입',
    target_id BIGINT COMMENT '대상 ID',
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant (tenant_id),
    INDEX idx_user (user_id),
    INDEX idx_type (activity_type),
    INDEX idx_created (created_at)
) COMMENT='활동 로그';
```

---

## 🔄 테이블 전체 목록 (54개)

| # | 테이블명 | 도메인 | 설명 |
|---|----------|--------|------|
| 1 | tenants | Tenant | 테넌트 |
| 2 | tenant_settings | Tenant | 테넌트 설정 |
| 3 | tenant_categories | Tenant | 테넌트 카테고리 |
| 4 | navigation_items | Tenant | 네비게이션 메뉴 |
| 5 | users | User | 사용자 |
| 6 | user_roles | User | 사용자 역할 |
| 7 | user_groups | User | 사용자 그룹 |
| 8 | user_course_roles | User | 사용자-강의별 역할 |
| 9 | refresh_tokens | User | 리프레시 토큰 |
| 10 | employees | User | 직원 정보 |
| 11 | departments | User | 부서 |
| 12 | cm_courses | Course | 강의 템플릿 |
| 13 | cm_course_items | Course | 커리큘럼 아이템 |
| 14 | cr_course_relations | Course | 학습 순서 |
| 15 | cm_course_reviews | Course | 강의 리뷰 |
| 16 | course_announcements | Course | 강의 공지 |
| 17 | course_times | Course | 차수 |
| 18 | cm_snapshots | Snapshot | 스냅샷 |
| 19 | cm_snapshot_items | Snapshot | 스냅샷 아이템 |
| 20 | cm_snapshot_los | Snapshot | 스냅샷 학습 객체 |
| 21 | cm_snapshot_relations | Snapshot | 스냅샷 학습 순서 |
| 22 | content | Content | 콘텐츠 |
| 23 | content_version | Content | 콘텐츠 버전 |
| 24 | content_folder | Learning | 콘텐츠 폴더 |
| 25 | learning_object | Learning | 학습 객체 |
| 26 | sis_enrollments | Student | 수강 등록 |
| 27 | sis_item_progress | Student | 아이템별 진행 |
| 28 | assignments | Assignment | 과제 |
| 29 | assignment_submissions | Assignment | 과제 제출 |
| 30 | certificates | Certificate | 수료증 |
| 31 | certificate_templates | Certificate | 수료증 템플릿 |
| 32 | notifications | Notification | 알림 |
| 33 | notification_templates | Notification | 알림 템플릿 |
| 34 | community_posts | Community | 커뮤니티 게시글 |
| 35 | community_comments | Community | 커뮤니티 댓글 |
| 36 | community_post_likes | Community | 게시글 좋아요 |
| 37 | community_comment_likes | Community | 댓글 좋아요 |
| 38 | notices | Notice | 시스템 공지 |
| 39 | notice_distributions | Notice | 공지 배포 |
| 40 | tenant_notices | Notice | 테넌트 공지 |
| 41 | cm_categories | Category | 강의 카테고리 |
| 42 | banners | Management | 배너 |
| 43 | cart_items | Management | 장바구니 |
| 44 | cm_wishlist_items | Management | 위시리스트 |
| 45 | member_pools | Management | 멤버풀 |
| 46 | auto_enrollment_rules | Management | 자동수강규칙 |
| 47 | roadmaps | Roadmap | 로드맵 |
| 48 | roadmap_programs | Roadmap | 로드맵 구성 |
| 49 | iis_instructor_assignments | IIS | 강사 배정 |
| 50 | iis_assignment_history | IIS | 강사 배정 이력 |
| 51 | system_settings | System | 시스템 설정 |
| 52 | tenant_defaults | System | 테넌트 기본값 |
| 53 | activity_logs | Analytics | 활동 로그 |
| 54 | audit_logs | Analytics | 감사 로그 |

---

**최종 업데이트**: 2026-01-23
**버전**: 2.0.0

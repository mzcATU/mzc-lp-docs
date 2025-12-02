import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/lms.db');

export const db = new Database(dbPath);

export function initDatabase() {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL
    )
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      agree_marketing INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create courses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      instructor TEXT NOT NULL,
      instructor_image TEXT,
      instructor_bio TEXT,
      price INTEGER NOT NULL,
      original_price INTEGER NOT NULL,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      student_count INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      category TEXT NOT NULL,
      description TEXT,
      level TEXT DEFAULT '입문',
      what_you_learn TEXT DEFAULT '[]',
      requirements TEXT DEFAULT '[]',
      total_hours INTEGER DEFAULT 0,
      total_lectures INTEGER DEFAULT 0,
      last_updated TEXT,
      curriculum TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category) REFERENCES categories(id)
    )
  `);

  // Seed categories if empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    seedCategories();
  }

  // Seed courses if empty
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
  if (courseCount.count === 0) {
    seedCourses();
  }

  console.log('✅ Database initialized');
}

function seedCategories() {
  const categories = [
    { id: 'all', label: '전체' },
    { id: 'dev', label: '개발' },
    { id: 'ai', label: 'AI' },
    { id: 'data', label: '데이터' },
    { id: 'design', label: '디자인' },
    { id: 'business', label: '비즈니스' },
    { id: 'marketing', label: '마케팅' },
    { id: 'language', label: '외국어' },
  ];

  const insert = db.prepare('INSERT INTO categories (id, label) VALUES (?, ?)');
  for (const cat of categories) {
    insert.run(cat.id, cat.label);
  }
  console.log('✅ Categories seeded');
}

function seedCourses() {
  const courses = [
    {
      title: '실전! Next.js 15 완벽 마스터',
      instructor: '김개발',
      instructorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      instructorBio: '네이버 시니어 프론트엔드 개발자 출신. 10년간 다양한 대규모 서비스를 개발해왔으며, 현재는 프리랜서로 활동하며 개발 교육에 힘쓰고 있습니다.',
      price: 89000,
      originalPrice: 129000,
      rating: 4.9,
      reviewCount: 1234,
      studentCount: 5678,
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
      tags: JSON.stringify(['NEW', '할인중']),
      category: 'dev',
      description: 'Next.js 15의 새로운 기능부터 실무에서 바로 활용할 수 있는 프로젝트까지! App Router, Server Actions, 그리고 최신 React 19 기능들을 마스터하세요.',
      level: '중급',
      whatYouLearn: JSON.stringify([
        'Next.js 15의 새로운 기능과 App Router 완벽 이해',
        'Server Components와 Client Components의 올바른 사용법',
        'Server Actions를 활용한 풀스택 개발',
        'React 19의 새로운 훅과 기능들',
        '실무에서 바로 쓸 수 있는 인증, 결제 시스템 구현',
        '성능 최적화와 SEO 전략'
      ]),
      requirements: JSON.stringify([
        'React 기본 문법을 알고 있어야 합니다',
        'JavaScript ES6+ 문법에 익숙해야 합니다',
        'HTML/CSS 기본 지식이 필요합니다'
      ]),
      totalHours: 32,
      totalLectures: 156,
      lastUpdated: '2024년 11월',
      curriculum: JSON.stringify([
        {
          title: '섹션 1: Next.js 15 소개',
          lectures: [
            { title: '강의 소개 및 학습 목표', duration: '5:30', preview: true },
            { title: 'Next.js 15의 새로운 기능들', duration: '12:45', preview: true },
            { title: '개발 환경 설정', duration: '8:20', preview: false }
          ]
        },
        {
          title: '섹션 2: App Router 기초',
          lectures: [
            { title: 'App Router vs Pages Router', duration: '15:00', preview: false },
            { title: '파일 기반 라우팅 이해하기', duration: '18:30', preview: false },
            { title: '레이아웃과 템플릿', duration: '14:20', preview: false }
          ]
        },
        {
          title: '섹션 3: Server Components',
          lectures: [
            { title: 'Server Components란?', duration: '10:15', preview: false },
            { title: '클라이언트 vs 서버 컴포넌트', duration: '22:00', preview: false },
            { title: '데이터 페칭 패턴', duration: '25:30', preview: false }
          ]
        }
      ])
    },
    {
      title: 'GPT와 함께하는 AI 서비스 개발',
      instructor: '이에이아이',
      instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      instructorBio: 'AI 스타트업 CTO 출신. OpenAI API를 활용한 다양한 서비스를 개발했으며, AI 기술의 대중화를 위해 교육 활동을 하고 있습니다.',
      price: 109000,
      originalPrice: 159000,
      rating: 4.8,
      reviewCount: 856,
      studentCount: 3421,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
      tags: JSON.stringify(['베스트', '할인중']),
      category: 'ai',
      description: 'OpenAI API를 활용하여 실제 서비스를 만들어보는 실전 프로젝트 강의입니다. ChatGPT, DALL-E, Whisper 등 다양한 AI 모델을 활용합니다.',
      level: '중급',
      whatYouLearn: JSON.stringify([
        'OpenAI API 완벽 활용법',
        'ChatGPT를 활용한 챗봇 서비스 개발',
        'DALL-E를 활용한 이미지 생성 서비스',
        'Whisper를 활용한 음성 인식 기능 구현',
        '프롬프트 엔지니어링 기법',
        'AI 서비스 배포 및 운영'
      ]),
      requirements: JSON.stringify([
        'Python 또는 JavaScript 기본 문법',
        'REST API에 대한 기본 이해',
        'OpenAI API 키 (무료 크레딧 사용 가능)'
      ]),
      totalHours: 28,
      totalLectures: 124,
      lastUpdated: '2024년 10월',
      curriculum: JSON.stringify([
        {
          title: '섹션 1: OpenAI API 시작하기',
          lectures: [
            { title: 'OpenAI API 소개', duration: '8:00', preview: true },
            { title: 'API 키 발급 및 설정', duration: '6:30', preview: true },
            { title: '첫 번째 API 호출', duration: '10:00', preview: false }
          ]
        },
        {
          title: '섹션 2: ChatGPT API 활용',
          lectures: [
            { title: 'Chat Completions API 이해', duration: '15:00', preview: false },
            { title: '대화 컨텍스트 관리', duration: '12:00', preview: false },
            { title: '스트리밍 응답 처리', duration: '18:00', preview: false }
          ]
        }
      ])
    },
    {
      title: 'Python 데이터 분석 마스터클래스',
      instructor: '박데이터',
      instructorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      instructorBio: '삼성전자 데이터 사이언티스트 출신. 대용량 데이터 분석 및 머신러닝 프로젝트 다수 경험.',
      price: 79000,
      originalPrice: 99000,
      rating: 4.7,
      reviewCount: 2341,
      studentCount: 8765,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
      tags: JSON.stringify(['베스트']),
      category: 'data',
      description: 'Pandas, NumPy, Matplotlib을 활용한 실전 데이터 분석! 실제 데이터셋으로 배우는 데이터 분석의 모든 것.',
      level: '입문',
      whatYouLearn: JSON.stringify([
        'Python 데이터 분석 기초',
        'Pandas를 활용한 데이터 처리',
        'NumPy를 활용한 수치 연산',
        'Matplotlib/Seaborn 시각화',
        '실전 데이터 분석 프로젝트'
      ]),
      requirements: JSON.stringify([
        'Python 기본 문법',
        '기초 통계 지식 (선택)'
      ]),
      totalHours: 24,
      totalLectures: 98,
      lastUpdated: '2024년 9월',
      curriculum: JSON.stringify([])
    },
    {
      title: 'Figma 웹디자인 실무 완성',
      instructor: '최디자인',
      instructorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      instructorBio: '토스 프로덕트 디자이너 출신. UI/UX 디자인 7년 경력.',
      price: 69000,
      originalPrice: 89000,
      rating: 4.9,
      reviewCount: 1567,
      studentCount: 4532,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
      tags: JSON.stringify(['NEW']),
      category: 'design',
      description: 'Figma로 배우는 현업 디자인 워크플로우. 디자인 시스템부터 프로토타이핑까지!',
      level: '입문',
      whatYouLearn: JSON.stringify([
        'Figma 기본 도구 마스터',
        '컴포넌트와 변형',
        '디자인 시스템 구축',
        '프로토타이핑',
        '협업 워크플로우'
      ]),
      requirements: JSON.stringify([
        '디자인 경험 불필요',
        'Figma 계정 (무료)'
      ]),
      totalHours: 18,
      totalLectures: 72,
      lastUpdated: '2024년 11월',
      curriculum: JSON.stringify([])
    },
    {
      title: '스타트업 마케팅 A to Z',
      instructor: '정마케팅',
      instructorImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop',
      instructorBio: '쿠팡 그로스 마케터 출신. 다수의 스타트업 마케팅 컨설팅 경험.',
      price: 59000,
      originalPrice: 79000,
      rating: 4.6,
      reviewCount: 892,
      studentCount: 2156,
      image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&h=250&fit=crop',
      tags: JSON.stringify(['할인중']),
      category: 'marketing',
      description: '제한된 예산으로 최대의 효과를! 스타트업을 위한 실전 마케팅 전략.',
      level: '입문',
      whatYouLearn: JSON.stringify([
        '그로스 마케팅 기초',
        '퍼포먼스 마케팅',
        '콘텐츠 마케팅',
        'SNS 마케팅',
        '데이터 기반 의사결정'
      ]),
      requirements: JSON.stringify([
        '마케팅 경험 불필요'
      ]),
      totalHours: 15,
      totalLectures: 56,
      lastUpdated: '2024년 8월',
      curriculum: JSON.stringify([])
    },
    {
      title: '비즈니스 영어 회화 마스터',
      instructor: 'Sarah Kim',
      instructorImage: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      instructorBio: '전 Google 채용담당자. 비즈니스 영어 전문 강사 10년.',
      price: 49000,
      originalPrice: 69000,
      rating: 4.8,
      reviewCount: 3421,
      studentCount: 12543,
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop',
      tags: JSON.stringify(['베스트', '할인중']),
      category: 'language',
      description: '실제 비즈니스 상황에서 사용하는 영어 회화! 회의, 프레젠테이션, 이메일 작성까지.',
      level: '입문',
      whatYouLearn: JSON.stringify([
        '비즈니스 미팅 영어',
        '프레젠테이션 영어',
        '이메일/보고서 작성',
        '협상 영어',
        '네트워킹 영어'
      ]),
      requirements: JSON.stringify([
        '기초 영어 회화 가능자'
      ]),
      totalHours: 20,
      totalLectures: 80,
      lastUpdated: '2024년 10월',
      curriculum: JSON.stringify([])
    },
    {
      title: 'React Native 모바일 앱 개발',
      instructor: '김앱개발',
      instructorImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
      instructorBio: '카카오 모바일 개발팀 출신. iOS/Android 앱 다수 출시.',
      price: 99000,
      originalPrice: 149000,
      rating: 4.7,
      reviewCount: 1123,
      studentCount: 3892,
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
      tags: JSON.stringify(['NEW', '할인중']),
      category: 'dev',
      description: 'React Native로 iOS와 Android 앱을 동시에 개발하는 방법을 배웁니다.',
      level: '중급',
      whatYouLearn: JSON.stringify([
        'React Native 기초',
        '네이티브 모듈 연동',
        '상태 관리',
        '앱 배포'
      ]),
      requirements: JSON.stringify([
        'React 기본 지식',
        'JavaScript ES6+'
      ]),
      totalHours: 26,
      totalLectures: 112,
      lastUpdated: '2024년 11월',
      curriculum: JSON.stringify([])
    },
    {
      title: 'AWS 클라우드 아키텍처',
      instructor: '이클라우드',
      instructorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      instructorBio: 'AWS 솔루션스 아키텍트. 대기업 클라우드 마이그레이션 다수 수행.',
      price: 129000,
      originalPrice: 179000,
      rating: 4.9,
      reviewCount: 756,
      studentCount: 2341,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
      tags: JSON.stringify(['베스트']),
      category: 'dev',
      description: 'AWS 핵심 서비스부터 실전 아키텍처 설계까지. SAA 자격증 준비에도 적합!',
      level: '중급',
      whatYouLearn: JSON.stringify([
        'AWS 핵심 서비스',
        '네트워크 설계',
        '보안 아키텍처',
        '비용 최적화'
      ]),
      requirements: JSON.stringify([
        '기본 네트워크 지식',
        'Linux 기초'
      ]),
      totalHours: 35,
      totalLectures: 145,
      lastUpdated: '2024년 10월',
      curriculum: JSON.stringify([])
    },
    {
      title: '딥러닝 기초부터 실전까지',
      instructor: '신딥러닝',
      instructorImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      instructorBio: '네이버 AI Lab 연구원 출신. 다수의 AI 논문 저자.',
      price: 119000,
      originalPrice: 169000,
      rating: 4.8,
      reviewCount: 923,
      studentCount: 2876,
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop',
      tags: JSON.stringify(['NEW']),
      category: 'ai',
      description: '수학적 기초부터 PyTorch 실전 프로젝트까지. 딥러닝의 모든 것을 배웁니다.',
      level: '중급',
      whatYouLearn: JSON.stringify([
        '신경망 기초 이론',
        'PyTorch 프레임워크',
        'CNN, RNN, Transformer',
        '실전 프로젝트'
      ]),
      requirements: JSON.stringify([
        'Python 중급',
        '선형대수, 미적분 기초'
      ]),
      totalHours: 40,
      totalLectures: 168,
      lastUpdated: '2024년 11월',
      curriculum: JSON.stringify([])
    },
    {
      title: 'PM을 위한 프로덕트 매니지먼트',
      instructor: '한피엠',
      instructorImage: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop',
      instructorBio: '배달의민족 프로덕트 매니저 출신. IT 서비스 기획 8년.',
      price: 89000,
      originalPrice: 119000,
      rating: 4.7,
      reviewCount: 678,
      studentCount: 1923,
      image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=250&fit=crop',
      tags: JSON.stringify(['베스트']),
      category: 'business',
      description: '프로덕트 매니저가 되기 위한 핵심 역량! 기획부터 런칭까지 전 과정을 다룹니다.',
      level: '입문',
      whatYouLearn: JSON.stringify([
        '프로덕트 전략 수립',
        '사용자 리서치',
        '요구사항 정의',
        '개발팀 협업'
      ]),
      requirements: JSON.stringify([
        'IT 서비스에 대한 관심'
      ]),
      totalHours: 22,
      totalLectures: 88,
      lastUpdated: '2024년 9월',
      curriculum: JSON.stringify([])
    }
  ];

  const insert = db.prepare(`
    INSERT INTO courses (
      title, instructor, instructor_image, instructor_bio, price, original_price,
      rating, review_count, student_count, image, tags, category, description,
      level, what_you_learn, requirements, total_hours, total_lectures,
      last_updated, curriculum
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const course of courses) {
    insert.run(
      course.title,
      course.instructor,
      course.instructorImage,
      course.instructorBio,
      course.price,
      course.originalPrice,
      course.rating,
      course.reviewCount,
      course.studentCount,
      course.image,
      course.tags,
      course.category,
      course.description,
      course.level,
      course.whatYouLearn,
      course.requirements,
      course.totalHours,
      course.totalLectures,
      course.lastUpdated,
      course.curriculum
    );
  }
  console.log('✅ Courses seeded');
}

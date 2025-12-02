import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Star, Clock, Users, PlayCircle, FileText, Award, ShoppingCart, Heart, Share2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useState } from 'react';

const coursesData: Record<string, {
  id: number;
  title: string;
  instructor: string;
  instructorImage: string;
  instructorBio: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  image: string;
  tags: string[];
  category: string;
  description: string;
  whatYouLearn: string[];
  requirements: string[];
  totalHours: number;
  totalLectures: number;
  level: string;
  lastUpdated: string;
  curriculum: { title: string; lectures: { title: string; duration: string; preview: boolean }[] }[];
}> = {
  '1': {
    id: 1,
    title: '실전! Next.js 15 완벽 마스터',
    instructor: '김개발',
    instructorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    instructorBio: '네이버 시니어 프론트엔드 개발자 출신. 10년 이상의 웹 개발 경력을 보유하고 있으며, React와 Next.js 생태계의 전문가입니다.',
    price: 89000,
    originalPrice: 129000,
    rating: 4.9,
    reviewCount: 1234,
    studentCount: 5678,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    tags: ['NEW', '할인중'],
    category: 'dev',
    description: 'Next.js 15의 새로운 기능부터 실무에서 바로 활용할 수 있는 프로젝트까지! App Router, Server Components, Server Actions 등 최신 기술을 완벽하게 마스터하세요.',
    whatYouLearn: [
      'Next.js 15의 핵심 개념과 새로운 기능 완벽 이해',
      'App Router를 활용한 모던 라우팅 구현',
      'Server Components와 Client Components 효율적 활용',
      'Server Actions로 폼 처리 및 데이터 뮤테이션',
      '실무 프로젝트를 통한 포트폴리오 완성',
      'Vercel 배포 및 최적화 전략',
    ],
    requirements: [
      'React 기초 지식 (useState, useEffect 등)',
      'JavaScript/TypeScript 기본 문법',
      'HTML/CSS 기초',
    ],
    totalHours: 32,
    totalLectures: 156,
    level: '중급',
    lastUpdated: '2024년 11월',
    curriculum: [
      {
        title: '섹션 1: Next.js 15 소개',
        lectures: [
          { title: '강의 소개 및 학습 목표', duration: '5:30', preview: true },
          { title: 'Next.js 15의 새로운 기능 살펴보기', duration: '12:45', preview: true },
          { title: '개발 환경 설정하기', duration: '8:20', preview: false },
        ],
      },
      {
        title: '섹션 2: App Router 기초',
        lectures: [
          { title: 'App Router vs Pages Router', duration: '15:00', preview: false },
          { title: '파일 기반 라우팅 이해하기', duration: '18:30', preview: false },
          { title: '레이아웃과 템플릿', duration: '20:15', preview: false },
          { title: '로딩과 에러 처리', duration: '14:50', preview: false },
        ],
      },
      {
        title: '섹션 3: Server Components',
        lectures: [
          { title: 'Server Components란?', duration: '16:40', preview: false },
          { title: 'Client Components와의 차이점', duration: '12:20', preview: false },
          { title: '데이터 페칭 패턴', duration: '22:10', preview: false },
        ],
      },
      {
        title: '섹션 4: 실전 프로젝트',
        lectures: [
          { title: '프로젝트 소개 및 설계', duration: '10:00', preview: false },
          { title: '인증 시스템 구현', duration: '45:30', preview: false },
          { title: 'CRUD 기능 구현', duration: '38:20', preview: false },
          { title: '배포 및 최적화', duration: '25:00', preview: false },
        ],
      },
    ],
  },
  '2': {
    id: 2,
    title: 'ChatGPT API 활용 실무 프로젝트',
    instructor: '이에이아이',
    instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    instructorBio: 'OpenAI 공식 파트너사 AI 엔지니어. GPT-4, DALL-E 등 최신 AI 기술을 활용한 다양한 프로젝트 경험 보유.',
    price: 120000,
    originalPrice: 150000,
    rating: 4.8,
    reviewCount: 892,
    studentCount: 3421,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop',
    tags: ['베스트'],
    category: 'ai',
    description: 'ChatGPT API를 활용하여 실제 서비스를 만들어보는 실전 프로젝트 강의입니다. 프롬프트 엔지니어링부터 RAG, Fine-tuning까지 AI 서비스 개발의 모든 것을 배웁니다.',
    whatYouLearn: [
      'ChatGPT API 기초부터 고급 활용법',
      '효과적인 프롬프트 엔지니어링',
      'RAG(Retrieval-Augmented Generation) 구현',
      'Fine-tuning으로 커스텀 모델 만들기',
      '실제 AI 서비스 배포하기',
    ],
    requirements: [
      'Python 기초 문법',
      'REST API 개념 이해',
      'OpenAI API 키 (유료)',
    ],
    totalHours: 28,
    totalLectures: 98,
    level: '중급',
    lastUpdated: '2024년 10월',
    curriculum: [
      {
        title: '섹션 1: OpenAI API 시작하기',
        lectures: [
          { title: 'OpenAI API 소개', duration: '8:00', preview: true },
          { title: 'API 키 발급 및 설정', duration: '6:30', preview: true },
          { title: '첫 번째 API 호출', duration: '12:00', preview: false },
        ],
      },
      {
        title: '섹션 2: 프롬프트 엔지니어링',
        lectures: [
          { title: '프롬프트 설계 원칙', duration: '20:00', preview: false },
          { title: 'Few-shot Learning 활용', duration: '18:00', preview: false },
          { title: 'Chain of Thought 기법', duration: '15:00', preview: false },
        ],
      },
    ],
  },
};

// 기본 강의 데이터 (ID가 없는 경우)
const defaultCourse = coursesData['1'];

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const course = id && coursesData[id] ? coursesData[id] : defaultCourse;
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const toggleSection = (index: number) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

  const discountPercent = Math.round((1 - course.price / course.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0a] py-12">
        <div className="w-full px-4 md:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
            {/* Left Content */}
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Link to="/courses" className="hover:text-white transition-colors">강의</Link>
                <ChevronRight className="w-4 h-4" />
                <Link
                  to={`/courses?category=${course.category}`}
                  className="hover:text-white transition-colors"
                >
                  {course.category === 'dev' ? '개발' : course.category === 'ai' ? 'AI' : course.category}
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{course.title}</span>
              </nav>

              {/* Tags */}
              <div className="flex gap-2 mb-4">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tag === 'NEW'
                        ? 'bg-[#6778ff]/20 text-[#6778ff]'
                        : tag === '베스트'
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                        : 'bg-[#10b981]/20 text-[#10b981]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>

              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">{course.description}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{course.rating}</span>
                  <span className="text-gray-400">({course.reviewCount.toLocaleString()}개 리뷰)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="w-5 h-5" />
                  <span>{course.studentCount.toLocaleString()}명 수강</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-5 h-5" />
                  <span>총 {course.totalHours}시간</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-8">
                <img
                  src={course.instructorImage}
                  alt={course.instructor}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{course.instructor}</p>
                  <p className="text-sm text-gray-400">강사</p>
                </div>
              </div>

              {/* Promo Video */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="relative aspect-video bg-black/50 flex items-center justify-center group cursor-pointer">
                  <img
                    src={course.image}
                    alt="강의 프로모션 영상"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <button className="relative z-10 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                    <PlayCircle className="w-10 h-10 text-white fill-white/20" />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <p className="text-white font-medium mb-1">강의 소개 영상</p>
                    <p className="text-gray-300 text-sm">이 강의가 어떤 내용인지 미리 확인해보세요</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Course Card */}
            <div className="lg:w-96">
              <div className="glass rounded-2xl overflow-hidden sticky top-24">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-6">
                  {/* Price */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold">₩{course.price.toLocaleString()}</span>
                    {discountPercent > 0 && (
                      <>
                        <span className="text-lg text-gray-500 line-through">₩{course.originalPrice.toLocaleString()}</span>
                        <span className="text-[#6778ff] font-bold">{discountPercent}% 할인</span>
                      </>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <button className="w-full btn-primary py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      장바구니 담기
                    </button>
                    <button className="w-full bg-white text-gray-900 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors">
                      바로 구매하기
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                          isWishlisted
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                        {isWishlisted ? '찜함' : '찜하기'}
                      </button>
                      <button className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 border border-white/10 font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                        <Share2 className="w-5 h-5" />
                        공유
                      </button>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-300">
                      <PlayCircle className="w-5 h-5 text-gray-500" />
                      <span>{course.totalLectures}개 강의 ({course.totalHours}시간)</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <span>난이도: {course.level}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Award className="w-5 h-5 text-gray-500" />
                      <span>수료증 발급</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span>평생 무제한 수강</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        <div className="max-w-4xl">
            {/* What You'll Learn */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">이런 걸 배워요</h2>
              <div className="glass rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.whatYouLearn.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Requirements */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">수강 전 필요한 것</h2>
              <div className="glass rounded-xl p-6">
                <ul className="space-y-3">
                  {course.requirements.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 rounded-full bg-[#6778ff]"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Curriculum */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">커리큘럼</h2>
              <div className="space-y-3">
                {course.curriculum.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="glass rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(sectionIndex)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown
                          className={`w-5 h-5 transition-transform ${
                            expandedSections.includes(sectionIndex) ? 'rotate-180' : ''
                          }`}
                        />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <span className="text-sm text-gray-400">{section.lectures.length}개 강의</span>
                    </button>
                    {expandedSections.includes(sectionIndex) && (
                      <div className="border-t border-white/10">
                        {section.lectures.map((lecture, lectureIndex) => (
                          <div
                            key={lectureIndex}
                            className="flex items-center justify-between p-4 pl-12 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <PlayCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-300">{lecture.title}</span>
                              {lecture.preview && (
                                <span className="px-2 py-0.5 bg-[#6778ff]/20 text-[#6778ff] text-xs rounded">
                                  미리보기
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{lecture.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Instructor */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">강사 소개</h2>
              <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={course.instructorImage}
                    alt={course.instructor}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold mb-2">{course.instructor}</h3>
                    <p className="text-gray-400 leading-relaxed">{course.instructorBio}</p>
                  </div>
                </div>
              </div>
            </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

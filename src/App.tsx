import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CourseCard } from './components/CourseCard';
import { Footer } from './components/Footer';
import { ChevronRight } from 'lucide-react';

// 정적 데이터
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

const courses = [
  {
    id: 1,
    title: '실전! Next.js 15 완벽 마스터',
    instructor: '김개발',
    price: '₩89,000',
    rating: 4.9,
    reviewCount: 1234,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    tags: ['NEW', '할인중'],
    category: 'dev',
  },
  {
    id: 2,
    title: 'ChatGPT API 활용 실무 프로젝트',
    instructor: '이에이아이',
    price: '₩120,000',
    rating: 4.8,
    reviewCount: 892,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
    tags: ['베스트'],
    category: 'ai',
  },
  {
    id: 3,
    title: '데이터 분석 with Python',
    instructor: '박데이터',
    price: '₩75,000',
    rating: 4.7,
    reviewCount: 2156,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    tags: [],
    category: 'data',
  },
  {
    id: 4,
    title: 'Figma 마스터 클래스',
    instructor: '최디자인',
    price: '₩65,000',
    rating: 4.9,
    reviewCount: 567,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
    tags: ['NEW'],
    category: 'design',
  },
  {
    id: 5,
    title: '스타트업 마케팅 A to Z',
    instructor: '정마케팅',
    price: '₩55,000',
    rating: 4.6,
    reviewCount: 334,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    tags: ['할인중'],
    category: 'marketing',
  },
  {
    id: 6,
    title: 'React Native로 앱 만들기',
    instructor: '강모바일',
    price: '₩95,000',
    rating: 4.8,
    reviewCount: 723,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
    tags: ['베스트'],
    category: 'dev',
  },
  {
    id: 7,
    title: '비즈니스 영어 회화',
    instructor: '제임스킴',
    price: '₩45,000',
    rating: 4.5,
    reviewCount: 1567,
    image: 'https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=400&h=250&fit=crop',
    tags: [],
    category: 'language',
  },
  {
    id: 8,
    title: 'AWS 클라우드 실무',
    instructor: '윤클라우드',
    price: '₩110,000',
    rating: 4.9,
    reviewCount: 445,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    tags: ['NEW', '베스트'],
    category: 'dev',
  },
  {
    id: 9,
    title: '엑셀 업무 자동화',
    instructor: '한비즈',
    price: '₩35,000',
    rating: 4.7,
    reviewCount: 2890,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    tags: ['할인중'],
    category: 'business',
  },
  {
    id: 10,
    title: 'UI/UX 디자인 시스템',
    instructor: '오유엑스',
    price: '₩85,000',
    rating: 4.8,
    reviewCount: 678,
    image: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=250&fit=crop',
    tags: ['베스트'],
    category: 'design',
  },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredCourses =
    activeCategory === 'all'
      ? courses
      : courses.filter((course) => course.category === activeCategory);

  const featuredCourses = courses.filter((c) => c.tags.includes('베스트')).slice(0, 5);
  const newCourses = courses.filter((c) => c.tags.includes('NEW')).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Search/Category Bar */}
        <div className="w-full px-4 md:px-8 lg:px-16 py-12">
          {/* Quick Category Chips */}
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                  ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white shadow-lg shadow-[#6778ff]/25'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section 1: User's choice */}
        <section className="w-full px-4 md:px-8 lg:px-16 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {activeCategory === 'all'
                  ? '지금 주목해야 할 강의'
                  : `${categories.find((c) => c.id === activeCategory)?.label} 관련 강의`}
              </h2>
              <p className="text-gray-500 text-sm mt-2">성장을 위한 최고의 선택</p>
            </div>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => <CourseCard key={course.id} {...course} />)
            ) : (
              <p className="col-span-5 text-center text-gray-500 py-10">
                해당 카테고리에 강의가 없습니다.
              </p>
            )}
          </div>
        </section>

        {/* Featured Section 2: New Arrivals */}
        <section className="bg-gradient-to-b from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a] py-20">
          <div className="w-full px-4 md:px-8 lg:px-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  따끈따끈 신규 강의
                </h2>
                <p className="text-gray-500 text-sm mt-2">매일 업데이트되는 새로운 배움</p>
              </div>
              <a
                href="#"
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                전체보기 <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {newCourses.map((course) => (
                <CourseCard key={`new-${course.id}`} {...course} />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section 3: Recommendation */}
        <section className="w-full px-4 md:px-8 lg:px-16 py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                왕초보도 할 수 있어요
              </h2>
              <p className="text-gray-500 text-sm mt-2">시작이 반! 기초부터 탄탄하게</p>
            </div>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              전체보기 <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={`beg-${course.id}`} {...course} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

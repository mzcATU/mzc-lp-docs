import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CourseCard } from '../components/CourseCard';
import { Search, SlidersHorizontal } from 'lucide-react';

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
  {
    id: 11,
    title: 'Spring Boot 3.0 실전',
    instructor: '김스프링',
    price: '₩99,000',
    rating: 4.9,
    reviewCount: 1023,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
    tags: ['NEW'],
    category: 'dev',
  },
  {
    id: 12,
    title: '딥러닝 기초부터 실전까지',
    instructor: '이딥러닝',
    price: '₩150,000',
    rating: 4.8,
    reviewCount: 567,
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop',
    tags: ['베스트'],
    category: 'ai',
  },
];

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // URL에서 검색어와 카테고리 가져오기
  useEffect(() => {
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    if (search) {
      setSearchQuery(search);
    }
    if (category) {
      setActiveCategory(category);
    }
  }, [searchParams]);

  // 검색어 변경 시 URL 업데이트
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const filteredCourses = courses
    .filter((course) => activeCategory === 'all' || course.category === activeCategory)
    .filter((course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">전체 강의</h1>
          <p className="text-gray-400">원하는 강의를 찾아보세요</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="강의명, 강사명으로 검색"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6778ff] focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#6778ff] cursor-pointer"
            >
              <option value="popular">인기순</option>
              <option value="latest">최신순</option>
              <option value="rating">평점순</option>
              <option value="price-low">가격 낮은순</option>
              <option value="price-high">가격 높은순</option>
            </select>
            <button className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white hover:bg-white/10 transition-colors">
              <SlidersHorizontal className="w-5 h-5" />
              필터
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
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

        {/* Results Count */}
        <p className="text-gray-400 mb-6">
          총 <span className="text-white font-semibold">{filteredCourses.length}</span>개의 강의
        </p>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => <CourseCard key={course.id} {...course} />)
          ) : (
            <p className="col-span-full text-center text-gray-500 py-20">
              검색 결과가 없습니다.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

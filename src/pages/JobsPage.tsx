import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MapPin, Briefcase, Clock, Building2, ChevronRight, Search, Bookmark } from 'lucide-react';

const jobCategories = [
  { id: 'all', label: '전체' },
  { id: 'frontend', label: '프론트엔드' },
  { id: 'backend', label: '백엔드' },
  { id: 'fullstack', label: '풀스택' },
  { id: 'mobile', label: '모바일' },
  { id: 'data', label: '데이터' },
  { id: 'ai', label: 'AI/ML' },
  { id: 'devops', label: 'DevOps' },
  { id: 'design', label: '디자인' },
];

const jobs = [
  {
    id: 1,
    company: '네이버',
    logo: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=100&h=100&fit=crop',
    title: '프론트엔드 개발자 (신입/경력)',
    category: 'frontend',
    location: '판교',
    experience: '신입~3년',
    type: '정규직',
    salary: '5,000~8,000만원',
    skills: ['React', 'TypeScript', 'Next.js'],
    postedAt: '오늘',
    deadline: 'D-14',
    bookmarked: false,
  },
  {
    id: 2,
    company: '카카오',
    logo: 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=100&h=100&fit=crop',
    title: '백엔드 개발자 (Kotlin/Spring)',
    category: 'backend',
    location: '판교',
    experience: '3년~7년',
    type: '정규직',
    salary: '6,500~10,000만원',
    skills: ['Kotlin', 'Spring', 'Kubernetes'],
    postedAt: '1일 전',
    deadline: 'D-21',
    bookmarked: true,
  },
  {
    id: 3,
    company: '토스',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
    title: 'iOS 개발자',
    category: 'mobile',
    location: '강남',
    experience: '2년~5년',
    type: '정규직',
    salary: '6,000~9,000만원',
    skills: ['Swift', 'SwiftUI', 'RxSwift'],
    postedAt: '2일 전',
    deadline: 'D-7',
    bookmarked: false,
  },
  {
    id: 4,
    company: '쿠팡',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
    title: '데이터 엔지니어',
    category: 'data',
    location: '서울 전체',
    experience: '3년~10년',
    type: '정규직',
    salary: '7,000~12,000만원',
    skills: ['Python', 'Spark', 'Airflow'],
    postedAt: '3일 전',
    deadline: 'D-10',
    bookmarked: false,
  },
  {
    id: 5,
    company: '당근마켓',
    logo: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop',
    title: '풀스택 개발자',
    category: 'fullstack',
    location: '서울',
    experience: '5년~',
    type: '정규직',
    salary: '8,000~15,000만원',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    postedAt: '오늘',
    deadline: '상시',
    bookmarked: true,
  },
  {
    id: 6,
    company: '업스테이지',
    logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop',
    title: 'ML 엔지니어 (LLM)',
    category: 'ai',
    location: '판교',
    experience: '2년~',
    type: '정규직',
    salary: '협의',
    skills: ['Python', 'PyTorch', 'LLM'],
    postedAt: '1주일 전',
    deadline: 'D-30',
    bookmarked: false,
  },
  {
    id: 7,
    company: '라인',
    logo: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=100&h=100&fit=crop',
    title: 'DevOps 엔지니어',
    category: 'devops',
    location: '판교',
    experience: '3년~7년',
    type: '정규직',
    salary: '6,500~11,000만원',
    skills: ['AWS', 'Terraform', 'Docker'],
    postedAt: '4일 전',
    deadline: 'D-18',
    bookmarked: false,
  },
  {
    id: 8,
    company: '무신사',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
    title: '프로덕트 디자이너',
    category: 'design',
    location: '성수',
    experience: '2년~5년',
    type: '정규직',
    salary: '4,500~7,000만원',
    skills: ['Figma', 'Prototyping', 'Design System'],
    postedAt: '2일 전',
    deadline: 'D-12',
    bookmarked: false,
  },
];

export function JobsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs
    .filter((job) => activeCategory === 'all' || job.category === activeCategory)
    .filter((job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            개발자 <span className="gradient-text">채용</span>
          </h1>
          <p className="text-gray-400 text-lg">
            MZRUN 수강생을 찾는 기업들의 채용 공고를 확인하세요.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="회사명, 포지션으로 검색"
              className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6778ff] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {jobCategories.map((cat) => (
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
          총 <span className="text-white font-semibold">{filteredJobs.length}</span>개의 채용 공고
        </p>

        {/* Job Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="glass rounded-2xl p-6 hover-glow card-hover cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <img
                  src={job.logo}
                  alt={job.company}
                  className="w-14 h-14 rounded-xl object-cover"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-gray-400 text-sm">{job.company}</p>
                      <h3 className="text-lg font-bold group-hover:text-[#6778ff] transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                    </div>
                    <button className={`p-2 rounded-lg transition-colors ${job.bookmarked ? 'text-[#6778ff]' : 'text-gray-500 hover:text-white'}`}>
                      <Bookmark className={`w-5 h-5 ${job.bookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.experience}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {job.type}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {job.postedAt}
                      </span>
                      <span className={`font-medium ${job.deadline.startsWith('D-') && parseInt(job.deadline.slice(2)) <= 7 ? 'text-red-400' : 'text-gray-400'}`}>
                        {job.deadline}
                      </span>
                    </div>
                    <button className="flex items-center gap-1 text-[#6778ff] font-medium text-sm group-hover:gap-2 transition-all">
                      지원하기 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 glass rounded-2xl p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            기업 채용 담당자이신가요?
          </h2>
          <p className="text-gray-400 mb-8">
            MZRUN 수강생들에게 채용 공고를 노출하고 인재를 찾아보세요.
          </p>
          <button className="btn-primary px-8 py-4 rounded-full text-white font-bold text-lg">
            채용 공고 등록하기
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

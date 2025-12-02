import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ChevronRight, Clock, Users, Star, CheckCircle } from 'lucide-react';

const roadmaps = [
  {
    id: 1,
    title: '프론트엔드 개발자 로드맵',
    description: 'HTML/CSS부터 React, Next.js까지 프론트엔드 개발의 모든 것',
    level: '입문 → 실무',
    duration: '6개월',
    students: 3420,
    rating: 4.9,
    courses: 12,
    color: 'from-[#6778ff] to-[#a855f7]',
    tags: ['인기', 'NEW'],
  },
  {
    id: 2,
    title: '백엔드 개발자 로드맵',
    description: 'Java, Spring Boot, 데이터베이스, 클라우드까지 백엔드 완전 정복',
    level: '입문 → 고급',
    duration: '8개월',
    students: 2890,
    rating: 4.8,
    courses: 15,
    color: 'from-[#10b981] to-[#059669]',
    tags: ['베스트'],
  },
  {
    id: 3,
    title: 'AI/ML 엔지니어 로드맵',
    description: 'Python, 머신러닝, 딥러닝, LLM까지 AI 전문가 되기',
    level: '중급 → 고급',
    duration: '10개월',
    students: 1567,
    rating: 4.9,
    courses: 18,
    color: 'from-[#f59e0b] to-[#d97706]',
    tags: ['NEW'],
  },
  {
    id: 4,
    title: '데이터 분석가 로드맵',
    description: '데이터 수집, 분석, 시각화, 머신러닝까지 데이터 분석 마스터',
    level: '입문 → 실무',
    duration: '5개월',
    students: 2134,
    rating: 4.7,
    courses: 10,
    color: 'from-[#ec4899] to-[#be185d]',
    tags: [],
  },
  {
    id: 5,
    title: 'DevOps 엔지니어 로드맵',
    description: 'Docker, Kubernetes, CI/CD, 클라우드 인프라 구축',
    level: '중급 → 고급',
    duration: '7개월',
    students: 987,
    rating: 4.8,
    courses: 14,
    color: 'from-[#06b6d4] to-[#0891b2]',
    tags: [],
  },
  {
    id: 6,
    title: '풀스택 개발자 로드맵',
    description: '프론트엔드 + 백엔드를 모두 다루는 풀스택 개발자 되기',
    level: '입문 → 고급',
    duration: '12개월',
    students: 1823,
    rating: 4.9,
    courses: 24,
    color: 'from-[#8b5cf6] to-[#6d28d9]',
    tags: ['인기'],
  },
];

export function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#6778ff]/20 to-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 mb-4">
            <Star className="w-4 h-4" />
            체계적인 학습 경로
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            커리어 <span className="gradient-text">로드맵</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            목표에 맞는 로드맵을 선택하고, 단계별로 학습하며 전문가로 성장하세요.
            <br />검증된 커리큘럼으로 효율적인 학습을 경험해보세요.
          </p>
        </div>

        {/* Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <div
              key={roadmap.id}
              className="glass rounded-2xl p-6 hover-glow card-hover cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roadmap.color} flex items-center justify-center`}>
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-2">
                  {roadmap.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        tag === 'NEW'
                          ? 'bg-[#6778ff]/20 text-[#6778ff]'
                          : tag === '인기'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          : 'bg-[#10b981]/20 text-[#10b981]'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 group-hover:text-[#6778ff] transition-colors">
                {roadmap.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {roadmap.description}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {roadmap.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {roadmap.students.toLocaleString()}명
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {roadmap.rating}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-sm text-gray-400">
                  총 <span className="text-white font-semibold">{roadmap.courses}개</span> 강의
                </span>
                <button className="flex items-center gap-1 text-[#6778ff] font-medium text-sm group-hover:gap-2 transition-all">
                  자세히 보기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center glass rounded-2xl p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            어떤 로드맵을 선택해야 할지 모르겠다면?
          </h2>
          <p className="text-gray-400 mb-8">
            간단한 테스트로 나에게 맞는 로드맵을 추천받아보세요.
          </p>
          <button className="btn-primary px-8 py-4 rounded-full text-white font-bold text-lg">
            로드맵 추천받기
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MessageSquare, Heart, Eye, Clock, TrendingUp, HelpCircle, Lightbulb, Users } from 'lucide-react';

const categories = [
  { id: 'all', label: '전체', icon: MessageSquare },
  { id: 'qna', label: 'Q&A', icon: HelpCircle },
  { id: 'tips', label: '학습 팁', icon: Lightbulb },
  { id: 'review', label: '강의 후기', icon: TrendingUp },
  { id: 'study', label: '스터디 모집', icon: Users },
];

const posts = [
  {
    id: 1,
    category: 'qna',
    title: 'React useEffect에서 비동기 처리 시 클린업 함수 질문드립니다',
    content: 'useEffect 안에서 API 호출을 할 때 컴포넌트가 언마운트되면 어떻게 처리해야 하나요? AbortController를 사용해야 한다고 들었는데...',
    author: '코딩초보',
    authorImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    date: '2시간 전',
    views: 234,
    likes: 12,
    comments: 8,
    tags: ['React', 'JavaScript'],
    solved: true,
  },
  {
    id: 2,
    category: 'tips',
    title: '개발 공부 3개월 만에 취업 성공한 방법 공유합니다',
    content: '비전공자로 시작해서 3개월 만에 스타트업에 프론트엔드 개발자로 취업했습니다. 제가 했던 공부 방법과 포트폴리오 준비 과정을 공유드려요.',
    author: '취준성공',
    authorImage: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop',
    date: '5시간 전',
    views: 1523,
    likes: 187,
    comments: 45,
    tags: ['취업', '포트폴리오'],
    hot: true,
  },
  {
    id: 3,
    category: 'review',
    title: '[후기] Next.js 15 완벽 마스터 강의 솔직 리뷰',
    content: '김개발님의 Next.js 강의를 완강했습니다. App Router부터 서버 컴포넌트까지 정말 깊이있게 다뤄주셔서 실무에 바로 적용할 수 있었어요.',
    author: '프론트마스터',
    authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    date: '1일 전',
    views: 892,
    likes: 56,
    comments: 23,
    tags: ['Next.js', '강의후기'],
  },
  {
    id: 4,
    category: 'study',
    title: '[모집] 알고리즘 스터디 모집합니다 (주 3회)',
    content: '프로그래머스 Lv.2~3 수준으로 함께 알고리즘 문제를 풀 분들을 모집합니다. 디스코드로 진행하며, 주 3회 저녁 9시에 모여서 풀이 공유해요.',
    author: '알고왕',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    date: '3일 전',
    views: 456,
    likes: 34,
    comments: 67,
    tags: ['알고리즘', '스터디'],
    recruiting: true,
  },
  {
    id: 5,
    category: 'qna',
    title: 'Spring Boot에서 JWT 토큰 재발급 로직 구현 방법',
    content: 'Access Token이 만료되었을 때 Refresh Token으로 재발급하는 로직을 어디서 처리해야 할까요? 필터에서 처리하는 게 맞나요?',
    author: '백엔드지망',
    authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    date: '1일 전',
    views: 345,
    likes: 21,
    comments: 15,
    tags: ['Spring', 'JWT'],
  },
  {
    id: 6,
    category: 'tips',
    title: 'VSCode 생산성 높이는 단축키 & 확장 프로그램 추천',
    content: '개발할 때 유용한 VSCode 단축키와 꼭 설치해야 할 확장 프로그램들을 정리해봤습니다. 특히 Vim 모드 쓰시는 분들 참고하세요!',
    author: '생산성덕후',
    authorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    date: '2일 전',
    views: 2341,
    likes: 234,
    comments: 56,
    tags: ['VSCode', '개발도구'],
    hot: true,
  },
];

export function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter((post) => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">커뮤니티</span>
          </h1>
          <p className="text-gray-400 text-lg">
            함께 성장하는 공간, 질문하고 나누고 연결하세요.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white shadow-lg shadow-[#6778ff]/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }
              `}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Write Button */}
        <div className="flex justify-end mb-6">
          <button className="btn-primary px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            글쓰기
          </button>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="glass rounded-xl p-6 hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Author Image */}
                <img
                  src={post.authorImage}
                  alt={post.author}
                  className="w-10 h-10 rounded-full object-cover hidden sm:block"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {post.hot && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                        HOT
                      </span>
                    )}
                    {post.solved && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                        해결됨
                      </span>
                    )}
                    {post.recruiting && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                        모집중
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">
                      {categories.find((c) => c.id === post.category)?.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-2 hover:text-[#6778ff] transition-colors line-clamp-1">
                    {post.title}
                  </h3>

                  {/* Preview */}
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-10">
          <button className="btn-outline px-8 py-3 rounded-full text-white font-medium">
            더보기
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

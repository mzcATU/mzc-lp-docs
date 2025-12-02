import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Star, Clock, MessageCircle, Video, Calendar, ChevronRight } from 'lucide-react';

const mentors = [
  {
    id: 1,
    name: '김시니어',
    role: '네이버 시니어 개발자',
    expertise: ['React', 'TypeScript', 'Node.js'],
    rating: 4.9,
    reviews: 128,
    price: '50,000',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    available: true,
  },
  {
    id: 2,
    name: '이테크',
    role: '카카오 백엔드 리드',
    expertise: ['Java', 'Spring', 'AWS'],
    rating: 4.8,
    reviews: 96,
    price: '60,000',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    available: true,
  },
  {
    id: 3,
    name: '박에이아이',
    role: 'OpenAI 리서처',
    expertise: ['ML', 'Deep Learning', 'LLM'],
    rating: 5.0,
    reviews: 67,
    price: '80,000',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    available: false,
  },
  {
    id: 4,
    name: '최디자인',
    role: '토스 프로덕트 디자이너',
    expertise: ['UI/UX', 'Figma', 'Design System'],
    rating: 4.9,
    reviews: 84,
    price: '45,000',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    available: true,
  },
  {
    id: 5,
    name: '정데이터',
    role: '쿠팡 데이터 사이언티스트',
    expertise: ['Python', 'SQL', 'Tableau'],
    rating: 4.7,
    reviews: 52,
    price: '55,000',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    available: true,
  },
  {
    id: 6,
    name: '강클라우드',
    role: 'AWS Solutions Architect',
    expertise: ['AWS', 'Terraform', 'Kubernetes'],
    rating: 4.8,
    reviews: 73,
    price: '70,000',
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop',
    available: true,
  },
];

const mentoringTypes = [
  {
    icon: Video,
    title: '1:1 화상 멘토링',
    description: '실시간 화상 미팅으로 직접 소통하며 맞춤 조언을 받아보세요.',
  },
  {
    icon: MessageCircle,
    title: '채팅 멘토링',
    description: '언제든 질문하고, 멘토의 피드백을 텍스트로 받아보세요.',
  },
  {
    icon: Calendar,
    title: '정기 멘토링',
    description: '매주 정해진 시간에 체계적인 멘토링을 진행합니다.',
  },
];

export function MentoringPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            현직자 <span className="gradient-text-purple">멘토링</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            현업에서 활약하는 전문가에게 직접 배우세요.
            <br />커리어 고민부터 기술적인 질문까지, 1:1 맞춤 멘토링을 경험해보세요.
          </p>
        </div>

        {/* Mentoring Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {mentoringTypes.map((type, index) => (
            <div key={index} className="glass rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6778ff] to-[#a855f7] flex items-center justify-center mx-auto mb-4">
                <type.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{type.title}</h3>
              <p className="text-gray-400 text-sm">{type.description}</p>
            </div>
          ))}
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">인기 멘토</h2>
            <p className="text-gray-400 mt-1">검증된 현직자 멘토와 함께하세요</p>
          </div>
          <button className="text-[#6778ff] font-medium flex items-center gap-1 hover:gap-2 transition-all">
            전체보기 <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mentor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="glass rounded-2xl p-6 hover-glow card-hover cursor-pointer group"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {mentor.available && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg group-hover:text-[#6778ff] transition-colors">
                    {mentor.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{mentor.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{mentor.rating}</span>
                    <span className="text-gray-500 text-sm">({mentor.reviews})</span>
                  </div>
                </div>
              </div>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.expertise.map((skill) => (
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
                <div>
                  <span className="text-gray-500 text-sm">30분 기준</span>
                  <p className="text-white font-bold">₩{mentor.price}</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mentor.available
                      ? 'btn-primary text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!mentor.available}
                >
                  {mentor.available ? '신청하기' : '예약 마감'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 glass rounded-2xl p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            멘토로 활동하고 싶으신가요?
          </h2>
          <p className="text-gray-400 mb-8">
            지식을 나누고, 수익도 얻으세요. MZRUN 멘토가 되어보세요.
          </p>
          <button className="btn-outline px-8 py-4 rounded-full text-white font-bold text-lg">
            멘토 지원하기
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

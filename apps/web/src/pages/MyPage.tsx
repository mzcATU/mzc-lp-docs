import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, BookOpen, Award, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API_BASE = 'http://localhost:4000';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  agreeMarketing: boolean;
  createdAt: string;
  enrolledCourses: number;
  completedCourses: number;
}

export function MyPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error('프로필을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setProfile(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-red-400">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#6778ff] to-[#a855f7] flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white mb-2">{profile?.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 text-sm mt-1">
                <Calendar className="w-4 h-4" />
                <span>{profile?.createdAt && formatDate(profile.createdAt)} 가입</span>
              </div>
            </div>
            <Link
              to="/mypage/settings"
              className="px-4 py-2 btn-outline text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              설정
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#6778ff]/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#6778ff]" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{profile?.enrolledCourses || 0}</p>
            <p className="text-gray-400 text-sm">수강 중인 강의</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#a855f7]/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-[#a855f7]" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{profile?.completedCourses || 0}</p>
            <p className="text-gray-400 text-sm">완료한 강의</p>
          </div>
        </div>

        {/* Menu List */}
        <div className="glass rounded-2xl overflow-hidden">
          <Link
            to="/mypage/courses"
            className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#6778ff]/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#6778ff]" />
              </div>
              <div>
                <p className="text-white font-medium">내 학습</p>
                <p className="text-gray-500 text-sm">수강 중인 강의 보기</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>

          <Link
            to="/mypage/wishlist"
            className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">위시리스트</p>
                <p className="text-gray-500 text-sm">찜한 강의 보기</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>

          <Link
            to="/mypage/orders"
            className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">주문 내역</p>
                <p className="text-gray-500 text-sm">결제 및 환불 내역</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>

          <Link
            to="/mypage/settings"
            className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">계정 설정</p>
                <p className="text-gray-500 text-sm">프로필 및 알림 설정</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-5 hover:bg-red-500/5 transition-colors text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-medium">로그아웃</p>
                <p className="text-gray-500 text-sm">계정에서 로그아웃</p>
              </div>
            </div>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}

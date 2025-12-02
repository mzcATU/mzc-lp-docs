import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Bell, Menu, X, LogOut, User } from 'lucide-react';

interface UserInfo {
  id: number;
  name: string;
  email: string;
}

export function Header() {
  const [showBanner, setShowBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full flex flex-col">
      {/* Top Notification Banner - Gradient */}
      {showBanner && (
        <div className="bg-gradient-to-r from-[#6778ff] via-[#a855f7] to-[#6bc2f0] text-white text-xs md:text-sm py-2.5 px-4 text-center font-medium flex justify-center items-center gap-2 relative">
          <span>✨ MZRUN 블랙위크 오픈 ✨ 모든 강의 25% 할인 + 100% 환급 + 블랙 천원샵 👉</span>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 text-white/70 hover:text-white text-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation - Dark Glass Effect */}
      <div className="w-full glass-dark sticky top-0 z-50">
        <div className="w-full px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between gap-6">

          {/* Left: Logo & Menu */}
          <div className="flex items-center gap-8 ml-2 md:ml-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="text-2xl">⚡</span>
              <span className="gradient-text">MZRUN</span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-gray-300 font-medium text-[15px]">
              <Link to="/courses" className="hover:text-white transition-colors">강의</Link>
              <Link to="/roadmap" className="hover:text-white transition-colors flex items-center gap-1">
                로드맵 <span className="bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white text-[10px] px-1.5 py-0.5 rounded-full">N</span>
              </Link>
              <Link to="/mentoring" className="hover:text-white transition-colors">멘토링</Link>
              <Link to="/community" className="hover:text-white transition-colors">커뮤니티</Link>
              <Link to="/jobs" className="hover:text-white transition-colors">채용</Link>
            </nav>
          </div>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="배우고 싶은 지식을 입력해보세요."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#6778ff] focus:border-[#6778ff] transition-all"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full btn-primary w-9 h-9 flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </button>
          </form>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 md:gap-5 mr-2 md:mr-4">
            <div className="flex items-center gap-2">
              <Link to="/cart" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-1 right-1 bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
              </Link>
              <Link to="/notifications" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
              </Link>
              {user ? (
                /* Logged in state */
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#6778ff] to-[#a855f7] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white font-medium max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 top-12 w-64 glass rounded-xl p-4 shadow-xl border border-white/10">
                      <Link
                        to="/mypage"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 pb-3 border-b border-white/10 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6778ff] to-[#a855f7] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-gray-400 text-xs truncate">{user.email}</p>
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Logged out state */
                <>
                  <Link to="/login" className="hidden md:flex px-4 py-2 btn-outline text-white rounded-full text-sm font-medium">
                    로그인
                  </Link>
                  <Link to="/signup" className="hidden md:flex px-4 py-2 btn-primary text-white font-bold rounded-full text-sm">
                    회원가입
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button className="p-2 md:hidden text-gray-400">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

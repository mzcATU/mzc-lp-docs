import { useState } from 'react';
import { Search, ShoppingCart, Bell, Globe, Menu, X } from 'lucide-react';

export function Header() {
  const [showBanner, setShowBanner] = useState(true);

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
            <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="text-2xl">⚡</span>
              <span className="gradient-text">MZRUN</span>
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-gray-300 font-medium text-[15px]">
              <a href="#" className="hover:text-white transition-colors">강의</a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                로드맵 <span className="bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white text-[10px] px-1.5 py-0.5 rounded-full">N</span>
              </a>
              <a href="#" className="hover:text-white transition-colors">멘토링</a>
              <a href="#" className="hover:text-white transition-colors">커뮤니티</a>
              <a href="#" className="hover:text-white transition-colors">채용</a>
            </nav>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="배우고 싶은 지식을 입력해보세요."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#6778ff] focus:border-[#6778ff] transition-all"
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full btn-primary w-9 h-9 flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 md:gap-5 mr-2 md:mr-4">
            <button className="hidden md:flex text-gray-400 hover:text-white text-sm font-medium px-3 py-2 transition-colors">
              지식공유
            </button>

            <div className="h-4 w-[1px] bg-white/20 hidden md:block" />

            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Globe className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute top-1 right-1 bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="hidden md:flex px-4 py-2 btn-outline text-white rounded-full text-sm font-medium">
                로그인
              </button>
              <button className="hidden md:flex px-4 py-2 btn-primary text-white font-bold rounded-full text-sm">
                회원가입
              </button>

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

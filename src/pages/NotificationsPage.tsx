import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Bell, CheckCheck, Trash2, Settings, Gift, MessageSquare, BookOpen, Megaphone } from 'lucide-react';

const initialNotifications = [
  {
    id: 1,
    type: 'promo',
    icon: Gift,
    title: '블랙위크 특별 할인!',
    message: '모든 강의 25% 할인 + 100% 환급 이벤트가 시작되었습니다. 지금 바로 확인해보세요!',
    time: '10분 전',
    read: false,
  },
  {
    id: 2,
    type: 'course',
    icon: BookOpen,
    title: '새 강의가 업데이트되었습니다',
    message: '"실전! Next.js 15 완벽 마스터" 강의에 새로운 섹션이 추가되었습니다.',
    time: '1시간 전',
    read: false,
  },
  {
    id: 3,
    type: 'comment',
    icon: MessageSquare,
    title: '질문에 답변이 달렸습니다',
    message: '김개발 강사님이 회원님의 질문에 답변을 남겼습니다.',
    time: '3시간 전',
    read: false,
  },
  {
    id: 4,
    type: 'announcement',
    icon: Megaphone,
    title: '서비스 점검 안내',
    message: '12월 5일 오전 2시~4시 서비스 점검이 예정되어 있습니다.',
    time: '1일 전',
    read: true,
  },
  {
    id: 5,
    type: 'course',
    icon: BookOpen,
    title: '수강 완료를 축하합니다!',
    message: '"React 기초부터 실전까지" 강의를 완료하셨습니다. 수료증을 다운로드해보세요!',
    time: '2일 전',
    read: true,
  },
  {
    id: 6,
    type: 'promo',
    icon: Gift,
    title: '첫 구매 할인 쿠폰 도착',
    message: '첫 강의 구매 시 사용할 수 있는 20% 할인 쿠폰이 발급되었습니다.',
    time: '3일 전',
    read: true,
  },
];

const notificationTypes = [
  { id: 'all', label: '전체' },
  { id: 'promo', label: '이벤트' },
  { id: 'course', label: '강의' },
  { id: 'comment', label: '댓글' },
  { id: 'announcement', label: '공지' },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeType, setActiveType] = useState('all');

  const filteredNotifications = activeType === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeType);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const deleteAllRead = () => {
    setNotifications(notifications.filter(n => !n.read));
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'promo': return 'text-[#f59e0b] bg-[#f59e0b]/20';
      case 'course': return 'text-[#6778ff] bg-[#6778ff]/20';
      case 'comment': return 'text-[#10b981] bg-[#10b981]/20';
      case 'announcement': return 'text-[#ec4899] bg-[#ec4899]/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="w-full px-4 md:px-8 lg:px-16 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">알림</h1>
            <p className="text-gray-400">
              {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 확인했습니다'}
            </p>
          </div>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {notificationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeType === type.id
                  ? 'bg-gradient-to-r from-[#6778ff] to-[#a855f7] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            모두 읽음 처리
          </button>
          <button
            onClick={deleteAllRead}
            disabled={notifications.every(n => !n.read)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            읽은 알림 삭제
          </button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">알림이 없습니다</h2>
            <p className="text-gray-400">새로운 알림이 오면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`glass rounded-xl p-4 flex gap-4 cursor-pointer transition-all hover:bg-white/5 ${
                    !notification.read ? 'border-l-4 border-[#6778ff]' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-semibold mb-1 ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{notification.message}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-[#6778ff] mt-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

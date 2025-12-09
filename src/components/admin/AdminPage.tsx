import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Search,
  Bell,
  MoreVertical,
  Plus,
  TrendingUp,
  DollarSign,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Upload,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock Data - Megazone style colors
const statsData = [
  {
    title: "총 매출",
    value: "₩124,500,000",
    change: "+12.5%",
    icon: DollarSign,
    color: "text-[#6778ff]",
    bg: "bg-gradient-to-br from-[#6778ff]/10 to-[#6bc2f0]/10",
  },
  {
    title: "활성 수강생",
    value: "2,420",
    change: "+18.2%",
    icon: Users,
    color: "text-[#22c55e]",
    bg: "bg-gradient-to-br from-[#70f2a0]/10 to-[#6778ff]/10",
  },
  {
    title: "총 강의 수",
    value: "48",
    change: "+4.3%",
    icon: BookOpen,
    color: "text-[#6bc2f0]",
    bg: "bg-gradient-to-br from-[#6bc2f0]/10 to-[#70f2a0]/10",
  },
  {
    title: "신규 가입",
    value: "145",
    change: "+8.1%",
    icon: UserCheck,
    color: "text-[#6778ff]",
    bg: "bg-gradient-to-br from-[#6778ff]/10 to-[#70f2a0]/10",
  },
];

const courseData = [
  {
    id: 1,
    title: "Web Development Bootcamp 2024",
    instructor: "John Doe",
    price: "₩89,000",
    students: 1240,
    rating: 4.8,
    status: "Active",
  },
  {
    id: 2,
    title: "Python for Data Science Masterclass",
    instructor: "Jane Smith",
    price: "₩55,000",
    students: 850,
    rating: 4.9,
    status: "Active",
  },
  {
    id: 3,
    title: "Complete AI & Machine Learning Guide",
    instructor: "Alice Johnson",
    price: "₩110,000",
    students: 2100,
    rating: 4.7,
    status: "Best Seller",
  },
  {
    id: 4,
    title: "Java Spring Boot for Enterprise",
    instructor: "David Lee",
    price: "₩99,000",
    students: 920,
    rating: 4.8,
    status: "Active",
  },
  {
    id: 5,
    title: "Mobile App Development with React Native",
    instructor: "Bob Williams",
    price: "₩75,000",
    students: 530,
    rating: 4.6,
    status: "Draft",
  }
];

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [newCourse, setNewCourse] = useState({
    title: "",
    instructor: "",
    price: "",
    category: "",
    description: "",
    status: "draft"
  });
  const [newSession, setNewSession] = useState({
    courseId: "",
    sessionNumber: "",
    startDate: "",
    endDate: "",
    maxStudents: "",
    status: "recruiting"
  });

  const handleNewCourseSubmit = () => {
    console.log("New course data:", newCourse);
    setIsNewCourseModalOpen(false);
    setNewCourse({
      title: "",
      instructor: "",
      price: "",
      category: "",
      description: "",
      status: "draft"
    });
  };

  const handleNewSessionSubmit = () => {
    console.log("New session data:", newSession);
    setIsNewSessionModalOpen(false);
    setNewSession({
      courseId: "",
      sessionNumber: "",
      startDate: "",
      endDate: "",
      maxStudents: "",
      status: "recruiting"
    });
  };

  return (
    <div className={`flex min-h-screen font-['Inter',sans-serif] transition-colors duration-300 ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-[#f7f7f7]'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col fixed h-full z-10 transition-all duration-300 ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-[#e5e5e5] text-gray-900'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70f2a0] via-[#6778ff] to-[#6bc2f0] flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>MZRUN</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 rounded-xl ${activeTab === 'dashboard'
              ? (isDarkMode ? 'bg-[#4a4a4a] text-white' : 'bg-white text-gray-900 shadow-sm')
              : (isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50')}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            대시보드
          </Button>
          <div>
            <Button
              variant="ghost"
              className={`w-full justify-between gap-3 rounded-xl ${activeTab === 'courses' || activeTab === 'sessions'
                ? (isDarkMode ? 'bg-[#4a4a4a] text-white' : 'bg-white text-gray-900 shadow-sm')
                : (isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50')}`}
              onClick={() => setIsCoursesOpen(!isCoursesOpen)}
            >
              <span className="flex items-center gap-3">
                <BookOpen size={20} />
                강의 관리
              </span>
              {isCoursesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            {isCoursesOpen && (
              <div className="ml-7 mt-1 space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm rounded-lg ${activeTab === 'courses'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white/70 text-gray-900')
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50')}`}
                  onClick={() => setActiveTab('courses')}
                >
                  강의 목록
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm rounded-lg ${activeTab === 'sessions'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white/70 text-gray-900')
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50')}`}
                  onClick={() => setActiveTab('sessions')}
                >
                  차수 관리
                </Button>
              </div>
            )}
          </div>
          <div>
            <Button
              variant="ghost"
              className={`w-full justify-between gap-3 rounded-xl ${activeTab === 'users'
                ? (isDarkMode ? 'bg-[#4a4a4a] text-white' : 'bg-white text-gray-900 shadow-sm')
                : (isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50')}`}
              onClick={() => setIsUsersOpen(!isUsersOpen)}
            >
              <span className="flex items-center gap-3">
                <Users size={20} />
                사용자 관리
              </span>
              {isUsersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            {isUsersOpen && (
              <div className="ml-7 mt-1 space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm rounded-lg ${activeTab === 'users'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white/70 text-gray-900')
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50')}`}
                  onClick={() => setActiveTab('users')}
                >
                  사용자 목록
                </Button>
              </div>
            )}
          </div>
          <div>
            <Button
              variant="ghost"
              className={`w-full justify-between gap-3 rounded-xl ${activeTab === 'settings' || activeTab === 'userSettings'
                ? (isDarkMode ? 'bg-[#4a4a4a] text-white' : 'bg-white text-gray-900 shadow-sm')
                : (isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50')}`}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              <span className="flex items-center gap-3">
                <Settings size={20} />
                설정
              </span>
              {isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </Button>
            {isSettingsOpen && (
              <div className="ml-7 mt-1 space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm rounded-lg ${activeTab === 'userSettings'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white/70 text-gray-900')
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50')}`}
                  onClick={() => setActiveTab('userSettings')}
                >
                  사용자 설정
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm rounded-lg ${activeTab === 'settings'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-white/70 text-gray-900')
                    : (isDarkMode ? 'text-gray-500 hover:text-gray-200 hover:bg-[#3a3a3a]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50')}`}
                  onClick={() => setActiveTab('settings')}
                >
                  시스템 설정
                </Button>
              </div>
            )}
          </div>
        </nav>

        <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-300'}`}>
          <div className="flex items-center gap-3">
            <Avatar className={`h-9 w-9 border ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-gradient-to-br from-[#70f2a0] to-[#6778ff] text-white">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Admin User</span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>admin@megazone.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {activeTab === 'dashboard' && "대시보드"}
              {activeTab === 'courses' && "강의 관리"}
              {activeTab === 'sessions' && "차수 관리"}
              {activeTab === 'users' && "사용자 목록"}
              {activeTab === 'userSettings' && "사용자 설정"}
              {activeTab === 'settings' && "시스템 설정"}
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>오늘의 학습 현황을 한눈에 확인하세요.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="검색어를 입력하세요"
                className={`pl-10 rounded-full ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-gray-500' : 'bg-white border-gray-200'}`}
              />
            </div>
            <Button size="icon" variant="ghost" className={`relative ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-black/5'}`}>
              <Bell size={20} />
              <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${isDarkMode ? 'bg-[#70f2a0]' : 'bg-[#22c55e]'}`}></span>
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.map((stat, index) => (
                <Card key={index} className={`border-none shadow-sm hover:shadow-lg transition-all duration-300 ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                        <h3 className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{stat.value}</h3>
                      </div>
                      <div className={`p-3 rounded-2xl ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className={`font-medium flex items-center gap-1 ${isDarkMode ? 'text-[#70f2a0]' : 'text-[#22c55e]'}`}>
                        <TrendingUp size={14} /> {stat.change}
                      </span>
                      <span className={`ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>vs 지난달</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className={`col-span-2 border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>월별 매출 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#70f2a0" stopOpacity={0.2}/>
                            <stop offset="50%" stopColor="#6778ff" stopOpacity={0.1}/>
                            <stop offset="100%" stopColor="#6bc2f0" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#4a4a4a' : '#f0f0f0'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#888' : '#999'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#888' : '#999'}} />
                        <Tooltip
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)', background: isDarkMode ? '#1a1a1a' : '#000', color: '#fff'}}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6778ff" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>카테고리별 비중</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                  {/* Megazone style gradient ring */}
                  <div className="relative h-48 w-48">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke={isDarkMode ? '#4a4a4a' : '#f0f0f0'} strokeWidth="12"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient1)" strokeWidth="12" strokeDasharray="150 251" strokeLinecap="round"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="url(#gradient2)" strokeWidth="12" strokeDasharray="60 251" strokeDashoffset="-150" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#70f2a0"/>
                          <stop offset="100%" stopColor="#6778ff"/>
                        </linearGradient>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6778ff"/>
                          <stop offset="100%" stopColor="#6bc2f0"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>48</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Courses</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Courses Table Preview */}
             <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>인기 강의 목록</CardTitle>
                  <Button variant="outline" className={`text-sm rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'border-gray-200 text-black hover:bg-black/5'}`} onClick={() => setActiveTab('courses')}>전체보기 →</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className={`${isDarkMode ? 'border-[#4a4a4a]' : 'border-gray-100'} hover:bg-transparent`}>
                        <TableHead className={`w-[400px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>강의명</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>강사</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>가격</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>수강생</TableHead>
                        <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>평점</TableHead>
                        <TableHead className={`text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseData.slice(0, 3).map((course) => (
                        <TableRow key={course.id} className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-16 bg-gradient-to-br from-[#70f2a0]/20 via-[#6778ff]/20 to-[#6bc2f0]/20 rounded-lg overflow-hidden" />
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{course.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{course.instructor}</TableCell>
                          <TableCell className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{course.price}</TableCell>
                          <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{course.students.toLocaleString()}명</TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              <span className={isDarkMode ? "text-[#70f2a0]" : "text-[#22c55e]"}>★</span> {course.rating}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                             <Badge className={`${course.status === 'Active' ? (isDarkMode ? 'bg-[#70f2a0]/15 text-[#70f2a0]' : 'bg-[#22c55e]/10 text-[#00a63e]') : course.status === 'Best Seller' ? (isDarkMode ? 'bg-[#6778ff]/25 text-[#a0b0ff]' : 'bg-[#6778ff]/10 text-[#6778ff]') : isDarkMode ? 'bg-[#7a7a7a] text-white' : 'bg-gray-100 text-gray-500'} border-none shadow-none rounded-full px-3`}>
                              {course.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </div>
        )}

        {/* Courses Management Content */}
        {activeTab === 'courses' && (
           <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="강의명 또는 강사명 검색"
                    className={`pl-10 rounded-full ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-gray-500' : 'bg-white border-gray-200'}`}
                  />
                </div>
                 <Button variant="outline" className={`rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                   필터
                 </Button>
              </div>
              <Button
                className={`rounded-full px-6 ${isDarkMode ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-black/90 text-white'}`}
                onClick={() => setIsNewCourseModalOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                새 강의 등록
              </Button>
            </div>

            {/* New Course Registration Modal */}
            <Dialog open={isNewCourseModalOpen} onOpenChange={setIsNewCourseModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-black">새 강의 등록</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">썸네일 이미지</Label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-gradient-to-br from-[#70f2a0]/10 via-[#6778ff]/10 to-[#6bc2f0]/10">
                          <Upload size={24} className="text-[#6778ff]" />
                        </div>
                        <p className="text-sm text-gray-500">클릭하거나 파일을 드래그하여 업로드</p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF (최대 10MB)</p>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">강의명 *</Label>
                    <Input
                      id="title"
                      placeholder="강의 제목을 입력하세요"
                      className="rounded-xl border-gray-200 focus:ring-black"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    />
                  </div>

                  {/* Instructor & Category Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructor" className="text-sm font-medium text-gray-700">강사명 *</Label>
                      <Input
                        id="instructor"
                        placeholder="강사명을 입력하세요"
                        className="rounded-xl border-gray-200 focus:ring-black"
                        value={newCourse.instructor}
                        onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">카테고리 *</Label>
                      <Select value={newCourse.category} onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}>
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">개발</SelectItem>
                          <SelectItem value="design">디자인</SelectItem>
                          <SelectItem value="marketing">마케팅</SelectItem>
                          <SelectItem value="business">비즈니스</SelectItem>
                          <SelectItem value="data">데이터 분석</SelectItem>
                          <SelectItem value="ai">AI/머신러닝</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price & Status Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-gray-700">가격 *</Label>
                      <Input
                        id="price"
                        placeholder="₩0"
                        className="rounded-xl border-gray-200 focus:ring-black"
                        value={newCourse.price}
                        onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">상태</Label>
                      <Select value={newCourse.status} onValueChange={(value) => setNewCourse({ ...newCourse, status: value })}>
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">임시저장</SelectItem>
                          <SelectItem value="active">활성</SelectItem>
                          <SelectItem value="inactive">비활성</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">강의 설명</Label>
                    <Textarea
                      id="description"
                      placeholder="강의에 대한 상세 설명을 입력하세요"
                      className="min-h-[120px] rounded-xl border-gray-200 focus:ring-black"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-200"
                    onClick={() => setIsNewCourseModalOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    className="bg-black hover:bg-black/90 text-white rounded-full px-6"
                    onClick={handleNewCourseSubmit}
                  >
                    등록하기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] bg-[#2a2a2a]' : 'border-gray-100 bg-gray-50/50'}`}>
                      <TableHead className={`w-[400px] py-4 pl-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>강의명</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>강사</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>가격</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>수강생</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>평점</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>상태</TableHead>
                      <TableHead className={`text-right pr-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseData.map((course) => (
                      <TableRow key={course.id} className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                        <TableCell className="font-medium pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-16 bg-gradient-to-br from-[#70f2a0]/20 via-[#6778ff]/20 to-[#6bc2f0]/20 rounded-lg" />
                            <div>
                                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{course.title}</div>
                                <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID: #CS-{course.id}002</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{course.instructor}</TableCell>
                        <TableCell className={`font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{course.price}</TableCell>
                        <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{course.students.toLocaleString()}명</TableCell>
                        <TableCell>
                          <span className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            <span className={isDarkMode ? "text-[#70f2a0]" : "text-[#22c55e]"}>★</span> {course.rating}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${course.status === 'Active' ? (isDarkMode ? 'bg-[#70f2a0]/15 text-[#70f2a0]' : 'bg-[#22c55e]/10 text-[#00a63e]') : course.status === 'Best Seller' ? (isDarkMode ? 'bg-[#6778ff]/25 text-[#a0b0ff]' : 'bg-[#6778ff]/10 text-[#6778ff]') : isDarkMode ? 'bg-[#7a7a7a] text-white' : 'bg-gray-100 text-gray-500'} border-none shadow-none rounded-full px-3`}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={`rounded-xl ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a]' : ''}`}>
                              <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>강의 수정</DropdownMenuItem>
                              <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>통계 보기</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">삭제</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between mt-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>총 48개의 강의 중 1-5 표시</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className={`rounded-full ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a] text-gray-500' : ''}`}>이전</Button>
                <Button variant="outline" size="sm" className={`rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'border-gray-200'}`}>다음</Button>
              </div>
            </div>
           </div>
        )}

        {/* Users List Content (Placeholder) */}
        {activeTab === 'users' && (
          <div className="flex flex-col items-center justify-center h-[500px] text-center">
            <div className="p-6 rounded-full mb-4 bg-gradient-to-br from-[#70f2a0]/10 via-[#6778ff]/10 to-[#6bc2f0]/10">
              <Users size={48} className="text-[#6778ff]" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>사용자 목록 준비 중</h3>
            <p className={`mt-2 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              이 페이지는 현재 개발 중입니다. 곧 사용자들의 목록을 확인할 수 있습니다.
            </p>
          </div>
        )}

        {/* User Settings Content - Dark/Light Mode Toggle */}
        {activeTab === 'userSettings' && (
          <div className="space-y-6">
            <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
              <CardHeader>
                <CardTitle className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>테마 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon size={20} className="text-[#6778ff]" /> : <Sun size={20} className="text-[#22c55e]" />}
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>다크 모드</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>어두운 테마로 눈의 피로를 줄입니다</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className={`rounded-full px-6 ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'border-gray-200'}`}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? (
                      <><Sun size={16} className="mr-2" /> 라이트 모드로 전환</>
                    ) : (
                      <><Moon size={16} className="mr-2" /> 다크 모드로 전환</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
              <CardHeader>
                <CardTitle className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>알림 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>이메일 알림</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>새로운 수강 신청 시 이메일로 알림</p>
                  </div>
                  <Button variant="outline" className={`rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'border-gray-200'}`}>활성화</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>푸시 알림</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>브라우저 푸시 알림 받기</p>
                  </div>
                  <Button variant="outline" className={`rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'border-gray-200'}`}>활성화</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Content (Placeholder) */}
        {activeTab === 'settings' && (
          <div className="flex flex-col items-center justify-center h-[500px] text-center">
            <div className="p-6 rounded-full mb-4 bg-gradient-to-br from-[#70f2a0]/10 via-[#6778ff]/10 to-[#6bc2f0]/10">
              <Settings size={48} className="text-[#6778ff]" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>시스템 설정 준비 중</h3>
            <p className={`mt-2 max-w-md ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              이 페이지는 현재 개발 중입니다. 곧 시스템 설정을 관리할 수 있습니다.
            </p>
          </div>
        )}

        {/* Sessions Management Content */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="차수명 또는 강의명 검색"
                    className={`pl-10 rounded-full ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-gray-500' : 'bg-white border-gray-200'}`}
                  />
                </div>
                <Button variant="outline" className={`rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  필터
                </Button>
              </div>
              <Button
                className={`rounded-full px-6 ${isDarkMode ? 'bg-white hover:bg-gray-100 text-black' : 'bg-black hover:bg-black/90 text-white'}`}
                onClick={() => setIsNewSessionModalOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                새 차수 등록
              </Button>
            </div>

            {/* New Session Registration Modal */}
            <Dialog open={isNewSessionModalOpen} onOpenChange={setIsNewSessionModalOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-black">새 차수 등록</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Course Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">강의 선택 *</Label>
                    <Select value={newSession.courseId} onValueChange={(value) => setNewSession({ ...newSession, courseId: value })}>
                      <SelectTrigger className="rounded-xl border-gray-200">
                        <SelectValue placeholder="강의를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseData.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Number */}
                  <div className="space-y-2">
                    <Label htmlFor="sessionNumber" className="text-sm font-medium text-gray-700">차수 *</Label>
                    <Input
                      id="sessionNumber"
                      placeholder="예: 1차, 2차"
                      className="rounded-xl border-gray-200 focus:ring-black"
                      value={newSession.sessionNumber}
                      onChange={(e) => setNewSession({ ...newSession, sessionNumber: e.target.value })}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">시작일 *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        className="rounded-xl border-gray-200 focus:ring-black"
                        value={newSession.startDate}
                        onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">종료일 *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        className="rounded-xl border-gray-200 focus:ring-black"
                        value={newSession.endDate}
                        onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Max Students & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxStudents" className="text-sm font-medium text-gray-700">최대 수강 인원</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        placeholder="0"
                        className="rounded-xl border-gray-200 focus:ring-black"
                        value={newSession.maxStudents}
                        onChange={(e) => setNewSession({ ...newSession, maxStudents: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">상태</Label>
                      <Select value={newSession.status} onValueChange={(value) => setNewSession({ ...newSession, status: value })}>
                        <SelectTrigger className="rounded-xl border-gray-200">
                          <SelectValue placeholder="상태 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recruiting">모집중</SelectItem>
                          <SelectItem value="ongoing">진행중</SelectItem>
                          <SelectItem value="ended">종료</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-gray-200"
                    onClick={() => setIsNewSessionModalOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    className="bg-black hover:bg-black/90 text-white rounded-full px-6"
                    onClick={handleNewSessionSubmit}
                  >
                    등록하기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className={`border-none shadow-sm ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-white'}`}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] bg-[#2a2a2a]' : 'border-gray-100 bg-gray-50/50'}`}>
                      <TableHead className={`w-[80px] py-4 pl-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>차수</TableHead>
                      <TableHead className={`w-[300px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>강의명</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>시작일</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>종료일</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>수강생</TableHead>
                      <TableHead className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>상태</TableHead>
                      <TableHead className={`text-right pr-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                      <TableCell className="font-bold pl-6 py-4 text-[#6778ff]">1차</TableCell>
                      <TableCell className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Web Development Bootcamp 2024</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-01-15</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-03-15</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>320명</TableCell>
                      <TableCell>
                        <Badge className={`${isDarkMode ? 'bg-[#7a7a7a] text-white' : 'bg-gray-100 text-gray-500'} border-none shadow-none rounded-full px-3`}>종료</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={`rounded-xl ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a]' : ''}`}>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>차수 수정</DropdownMenuItem>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>수강생 목록</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                      <TableCell className="font-bold pl-6 py-4 text-[#6778ff]">2차</TableCell>
                      <TableCell className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Web Development Bootcamp 2024</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-04-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-06-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>450명</TableCell>
                      <TableCell>
                        <Badge className={`${isDarkMode ? 'bg-[#70f2a0]/15 text-[#70f2a0]' : 'bg-[#22c55e]/10 text-[#00a63e]'} border-none shadow-none rounded-full px-3`}>진행중</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={`rounded-xl ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a]' : ''}`}>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>차수 수정</DropdownMenuItem>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>수강생 목록</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                      <TableCell className="font-bold pl-6 py-4 text-[#6778ff]">3차</TableCell>
                      <TableCell className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Web Development Bootcamp 2024</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-07-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-09-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>0명</TableCell>
                      <TableCell>
                        <Badge className={`${isDarkMode ? 'bg-[#6778ff]/25 text-[#a0b0ff]' : 'bg-[#6778ff]/10 text-[#6778ff]'} border-none shadow-none rounded-full px-3`}>모집중</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={`rounded-xl ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a]' : ''}`}>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>차수 수정</DropdownMenuItem>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>수강생 목록</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                      <TableCell className="font-bold pl-6 py-4 text-[#6778ff]">1차</TableCell>
                      <TableCell className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Python for Data Science Masterclass</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-02-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-04-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>280명</TableCell>
                      <TableCell>
                        <Badge className={`${isDarkMode ? 'bg-[#70f2a0]/15 text-[#70f2a0]' : 'bg-[#22c55e]/10 text-[#00a63e]'} border-none shadow-none rounded-full px-3`}>진행중</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={`rounded-xl ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a]' : ''}`}>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>차수 수정</DropdownMenuItem>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>수강생 목록</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    <TableRow className={`${isDarkMode ? 'border-[#4a4a4a] hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                      <TableCell className="font-bold pl-6 py-4 text-[#6778ff]">1차</TableCell>
                      <TableCell className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Complete AI & Machine Learning Guide</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-03-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>2024-06-01</TableCell>
                      <TableCell className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>520명</TableCell>
                      <TableCell>
                        <Badge className={`${isDarkMode ? 'bg-[#70f2a0]/15 text-[#70f2a0]' : 'bg-[#22c55e]/10 text-[#00a63e]'} border-none shadow-none rounded-full px-3`}>진행중</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`h-8 w-8 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={`rounded-xl ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a]' : ''}`}>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>차수 수정</DropdownMenuItem>
                            <DropdownMenuItem className={isDarkMode ? 'text-gray-200 focus:bg-white/10' : ''}>수강생 목록</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between mt-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>총 12개의 차수 중 1-5 표시</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className={`rounded-full ${isDarkMode ? 'bg-[#3a3a3a] border-[#4a4a4a] text-gray-500' : ''}`}>이전</Button>
                <Button variant="outline" size="sm" className={`rounded-full ${isDarkMode ? 'bg-[#4a4a4a] border-[#5a5a5a] text-gray-200 hover:bg-[#5a5a5a] hover:text-white' : 'border-gray-200'}`}>다음</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

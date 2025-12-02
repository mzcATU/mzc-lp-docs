import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { SignupPage } from './pages/SignupPage.tsx'
import { CoursesPage } from './pages/CoursesPage.tsx'
import { RoadmapPage } from './pages/RoadmapPage.tsx'
import { MentoringPage } from './pages/MentoringPage.tsx'
import { CommunityPage } from './pages/CommunityPage.tsx'
import { JobsPage } from './pages/JobsPage.tsx'
import { CartPage } from './pages/CartPage.tsx'
import { NotificationsPage } from './pages/NotificationsPage.tsx'
import { CourseDetailPage } from './pages/CourseDetailPage.tsx'
import { MyPage } from './pages/MyPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/mentoring" element={<MentoringPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

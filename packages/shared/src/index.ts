// ============================================
// Course Types
// ============================================

export interface Course {
  id: number;
  title: string;
  instructor: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  studentCount: number;
  image: string;
  tags: string[];
  category: string;
  description: string;
  level: string;
  createdAt: string;
}

export interface CourseDetail extends Course {
  instructorImage: string;
  instructorBio: string;
  whatYouLearn: string[];
  requirements: string[];
  totalHours: number;
  totalLectures: number;
  lastUpdated: string;
  curriculum: CurriculumSection[];
}

export interface CurriculumSection {
  title: string;
  lectures: Lecture[];
}

export interface Lecture {
  title: string;
  duration: string;
  preview: boolean;
}

// ============================================
// Category Types
// ============================================

export interface Category {
  id: string;
  label: string;
}

// ============================================
// User Types
// ============================================

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  id: number;
  courseId: number;
  title: string;
  instructor: string;
  originalPrice: number;
  price: number;
  image: string;
  discount: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CoursesQueryParams {
  category?: string;
  search?: string;
  sort?: 'popular' | 'latest' | 'rating' | 'price_low' | 'price_high';
  page?: number;
  limit?: number;
  tags?: string[];
}

// ============================================
// Utility Functions
// ============================================

export function formatPrice(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`;
}

export function calculateDiscount(originalPrice: number, price: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

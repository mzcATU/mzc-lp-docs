import { Router } from 'express';
import { db } from '../db/init.js';
import type { Course, CourseDetail, PaginatedResponse, ApiResponse } from '@lms/shared';

export const coursesRouter = Router();

interface CourseRow {
  id: number;
  title: string;
  instructor: string;
  instructor_image: string | null;
  instructor_bio: string | null;
  price: number;
  original_price: number;
  rating: number;
  review_count: number;
  student_count: number;
  image: string;
  tags: string;
  category: string;
  description: string | null;
  level: string;
  what_you_learn: string;
  requirements: string;
  total_hours: number;
  total_lectures: number;
  last_updated: string | null;
  curriculum: string;
  created_at: string;
}

function mapRowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    instructor: row.instructor,
    price: row.price,
    originalPrice: row.original_price,
    rating: row.rating,
    reviewCount: row.review_count,
    studentCount: row.student_count,
    image: row.image,
    tags: JSON.parse(row.tags),
    category: row.category,
    description: row.description || '',
    level: row.level,
    createdAt: row.created_at,
  };
}

function mapRowToCourseDetail(row: CourseRow): CourseDetail {
  return {
    ...mapRowToCourse(row),
    instructorImage: row.instructor_image || '',
    instructorBio: row.instructor_bio || '',
    whatYouLearn: JSON.parse(row.what_you_learn),
    requirements: JSON.parse(row.requirements),
    totalHours: row.total_hours,
    totalLectures: row.total_lectures,
    lastUpdated: row.last_updated || '',
    curriculum: JSON.parse(row.curriculum),
  };
}

// GET /api/courses - Get all courses with filtering and pagination
coursesRouter.get('/', (req, res) => {
  const {
    category,
    search,
    sort = 'latest',
    page = '1',
    limit = '10',
    tags,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
  const offset = (pageNum - 1) * limitNum;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  // Category filter
  if (category && category !== 'all') {
    whereClause += ' AND category = ?';
    params.push(category as string);
  }

  // Search filter
  if (search) {
    whereClause += ' AND (title LIKE ? OR instructor LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  // Tags filter (e.g., tags=NEW,베스트)
  if (tags) {
    const tagList = (tags as string).split(',');
    for (const tag of tagList) {
      whereClause += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }
  }

  // Sort order
  let orderBy = 'created_at DESC';
  switch (sort) {
    case 'popular':
      orderBy = 'student_count DESC';
      break;
    case 'rating':
      orderBy = 'rating DESC';
      break;
    case 'price_low':
      orderBy = 'price ASC';
      break;
    case 'price_high':
      orderBy = 'price DESC';
      break;
    case 'latest':
    default:
      orderBy = 'created_at DESC';
  }

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM courses WHERE ${whereClause}`);
  const countResult = countStmt.get(...params) as { total: number };

  // Get paginated courses
  const stmt = db.prepare(`
    SELECT * FROM courses
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...params, limitNum, offset) as CourseRow[];

  const response: PaginatedResponse<Course> = {
    data: rows.map(mapRowToCourse),
    total: countResult.total,
    page: pageNum,
    limit: limitNum,
  };

  res.json(response);
});

// GET /api/courses/:id - Get single course detail
coursesRouter.get('/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare('SELECT * FROM courses WHERE id = ?');
  const row = stmt.get(id) as CourseRow | undefined;

  if (!row) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }

  const response: ApiResponse<CourseDetail> = {
    data: mapRowToCourseDetail(row),
  };

  res.json(response);
});

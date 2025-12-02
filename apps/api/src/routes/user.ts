import { Router } from 'express';
import { db } from '../db/init.js';
import type { ApiResponse } from '@lms/shared';

export const userRouter = Router();

interface UserRow {
  id: number;
  name: string;
  email: string;
  agree_marketing: number;
  created_at: string;
}

// GET /api/user/profile - Get user profile
userRouter.get('/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '인증이 필요합니다.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  // Extract user id from mock token (format: mock-token-{userId})
  const tokenParts = token.split('-');
  const userId = tokenParts[tokenParts.length - 1];

  if (!userId) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;

  if (!user) {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    return;
  }

  const response: ApiResponse<{
    id: number;
    name: string;
    email: string;
    agreeMarketing: boolean;
    createdAt: string;
    enrolledCourses: number;
    completedCourses: number;
  }> = {
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      agreeMarketing: user.agree_marketing === 1,
      createdAt: user.created_at,
      enrolledCourses: 0, // TODO: 실제 수강 데이터 연동
      completedCourses: 0, // TODO: 실제 완료 데이터 연동
    },
  };

  res.json(response);
});

// PUT /api/user/profile - Update user profile
userRouter.put('/profile', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '인증이 필요합니다.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const tokenParts = token.split('-');
  const userId = tokenParts[tokenParts.length - 1];

  if (!userId) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    return;
  }

  const { name, agreeMarketing } = req.body;

  db.prepare('UPDATE users SET name = ?, agree_marketing = ? WHERE id = ?')
    .run(name, agreeMarketing ? 1 : 0, userId);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;

  res.json({
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      agreeMarketing: updatedUser.agree_marketing === 1,
      createdAt: updatedUser.created_at,
    },
    message: '프로필이 업데이트되었습니다.',
  });
});

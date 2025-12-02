import { Router } from 'express';
import { db } from '../db/init.js';
import type { User, ApiResponse } from '@lms/shared';

export const authRouter = Router();

interface UserRow {
  id: number;
  email: string;
  name: string;
  password: string;
  agree_marketing: number;
  created_at: string;
}

// POST /api/auth/signup - User registration
authRouter.post('/signup', (req, res) => {
  const { name, email, password, agreeMarketing } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: '이름, 이메일, 비밀번호를 모두 입력해주세요.' });
    return;
  }

  // Check if email already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    return;
  }

  // Insert new user (in production, hash the password!)
  const result = db.prepare(`
    INSERT INTO users (name, email, password, agree_marketing)
    VALUES (?, ?, ?, ?)
  `).run(name, email, password, agreeMarketing ? 1 : 0);

  const user: User = {
    id: result.lastInsertRowid as number,
    email,
    name,
    createdAt: new Date().toISOString(),
  };

  const response: ApiResponse<{ user: User; token: string }> = {
    data: {
      user,
      token: `mock-token-${user.id}`, // In production, use JWT
    },
    message: '회원가입이 완료되었습니다.',
  };

  res.status(201).json(response);
});

// POST /api/auth/login - User login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

  if (!user || user.password !== password) {
    res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    return;
  }

  const response: ApiResponse<{ user: User; token: string }> = {
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      },
      token: `mock-token-${user.id}`,
    },
    message: '로그인 성공',
  };

  res.json(response);
});

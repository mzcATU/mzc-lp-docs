import express from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { categoriesRouter } from './routes/categories.js';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/user.js';
import { initDatabase } from './db/init.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/courses', coursesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});

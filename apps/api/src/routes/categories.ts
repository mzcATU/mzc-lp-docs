import { Router } from 'express';
import { db } from '../db/init.js';
import type { Category, ApiResponse } from '@lms/shared';

export const categoriesRouter = Router();

interface CategoryRow {
  id: string;
  label: string;
}

// GET /api/categories - Get all categories
categoriesRouter.get('/', (_req, res) => {
  const stmt = db.prepare('SELECT * FROM categories');
  const rows = stmt.all() as CategoryRow[];

  const response: ApiResponse<Category[]> = {
    data: rows.map((row) => ({
      id: row.id,
      label: row.label,
    })),
  };

  res.json(response);
});

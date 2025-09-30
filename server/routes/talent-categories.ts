import { Router } from 'express';
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../logging/logger';

const router = Router();

// Get all talent categories
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: categories, error } = await supabaseAdmin
    .from('talent_categories')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    logger.error('Error fetching talent categories', error, {
      method: req.method,
      path: req.path
    });
    throw ApiError.internal('Failed to fetch talent categories');
  }

  return res.json(categories || []);
}));

// Create new talent category
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.body;

  if (!category) {
    throw ApiError.badRequest('Category name is required');
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: newCategory, error } = await supabaseAdmin
    .from('talent_categories')
    .insert({ category })
    .select()
    .single();

  if (error) {
    logger.error('Error creating talent category', error, {
      method: req.method,
      path: req.path,
      category
    });
    throw ApiError.internal('Failed to create talent category');
  }

  return res.status(201).json(newCategory);
}));

// Update talent category
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category } = req.body;

  if (!category) {
    throw ApiError.badRequest('Category name is required');
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: updated, error } = await supabaseAdmin
    .from('talent_categories')
    .update({
      category,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Talent category not found');
    }
    logger.error('Error updating talent category', error, {
      method: req.method,
      path: req.path,
      id,
      category
    });
    throw ApiError.internal('Failed to update talent category');
  }

  return res.json(updated);
}));

// Delete talent category
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from('talent_categories')
    .delete()
    .eq('id', Number(id));

  if (error) {
    logger.error('Error deleting talent category', error, {
      method: req.method,
      path: req.path,
      id
    });
    throw ApiError.internal('Failed to delete talent category');
  }

  return res.status(204).send();
}));

export default router;
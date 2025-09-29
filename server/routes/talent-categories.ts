import { Router } from 'express';
import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../supabase-admin';
import { ApiError } from '../utils/ApiError';

const router = Router();

// Get all talent categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: categories, error } = await supabaseAdmin
      .from('talent_categories')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching talent categories:', error);
      return res.status(500).json({ error: 'Failed to fetch talent categories' });
    }

    res.json(categories || []);
  } catch (error) {
    console.error('Error fetching talent categories:', error);
    return res.status(500).json({
      error: 'Failed to fetch talent categories'
    });
  }
});

// Create new talent category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.body;

    if (!category) {
      throw new ApiError(400, 'Category name is required');
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: newCategory, error } = await supabaseAdmin
      .from('talent_categories')
      .insert({ category })
      .select()
      .single();

    if (error) {
      console.error('Error creating talent category:', error);
      return res.status(500).json({ error: 'Failed to create talent category' });
    }

    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating talent category:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      return res.status(500).json({
        error: 'Failed to create talent category'
      });
    }
  }
});

// Update talent category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!category) {
      throw new ApiError(400, 'Category name is required');
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
        throw new ApiError(404, 'Talent category not found');
      }
      console.error('Error updating talent category:', error);
      return res.status(500).json({ error: 'Failed to update talent category' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating talent category:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      return res.status(500).json({
        error: 'Failed to update talent category'
      });
    }
  }
});

// Delete talent category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('talent_categories')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error('Error deleting talent category:', error);
      return res.status(500).json({ error: 'Failed to delete talent category' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting talent category:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      return res.status(500).json({
        error: 'Failed to delete talent category'
      });
    }
  }
});

export default router;
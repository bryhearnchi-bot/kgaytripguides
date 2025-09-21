import { Router } from 'express';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { ApiError } from '../utils/ApiError';

const router = Router();

// Get all talent categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await storage.getAllTalentCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching talent categories:', error);
    res.status(500).json({
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

    const newCategory = await storage.createTalentCategory(category);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating talent category:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({
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

    const updated = await storage.updateTalentCategory(Number(id), category);
    res.json(updated);
  } catch (error) {
    console.error('Error updating talent category:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({
        error: 'Failed to update talent category'
      });
    }
  }
});

// Delete talent category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await storage.deleteTalentCategory(Number(id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting talent category:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({
        error: 'Failed to delete talent category'
      });
    }
  }
});

export default router;
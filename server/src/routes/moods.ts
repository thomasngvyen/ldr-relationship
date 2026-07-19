import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { MOODS } from '../constants/moods';
import prisma from '../lib/prisma';
import { Mood } from '@prisma/client';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({ moods: [...MOODS] });
  } catch {
    return res.status(500).json({ error: 'Failed to get moods' });
  }
});

router.post('/:mood/deliver', authMiddleware, async (req, res) => {
    try {
        const { mood } = req.params;
        const { message } = req.body;
        if (!MOODS.includes(mood as Mood)) {
          return res.status(400).json({ error: 'Invalid mood type' });
      }
        const moodMessage = await prisma.moodMessage.create({
            data: { mood: mood as Mood, message, userId: req.user!.userID },
        });
        return res.status(201).json({ moodMessage });
    } catch {
        return res.status(500).json({ error: 'Failed to deliver mood message' });
    }
});
export default router;

import { Router } from 'express';
import type { Mood as PrismaMood } from '@prisma/client';
import prisma from '../lib/prisma';
import { MOODS, type Mood } from '../constants/moods';
import { getCoupleForUser } from './couples';

const router = Router();

function isMood(value: string): value is Mood {
  return (MOODS as readonly string[]).includes(value);
}

router.get('/', async (_req, res) => {
  try {
    return res.status(200).json({ moods: [...MOODS] });
  } catch {
    return res.status(500).json({ error: 'Failed to get moods' });
  }
});

// Pick a random curated message for this mood from either partner's library
router.post('/:mood/deliver', async (req, res) => {
  try {
    const moodParam = req.params.mood;
    if (!moodParam || !isMood(moodParam)) {
      return res.status(400).json({ error: 'Invalid mood type' });
    }

    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple || !couple.userBId) {
      return res.status(403).json({ error: 'User is not in a couple' });
    }

    const authorIds = [couple.userAId, couple.userBId];
    const messages = await prisma.moodMessage.findMany({
      where: {
        mood: moodParam as PrismaMood,
        userId: { in: authorIds },
      },
    });

    if (messages.length === 0) {
      return res.status(404).json({ error: 'No messages for this mood yet' });
    }

    const moodMessage = messages[Math.floor(Math.random() * messages.length)];
    return res.status(200).json({ moodMessage });
  } catch {
    return res.status(500).json({ error: 'Failed to deliver mood message' });
  }
});

export default router;

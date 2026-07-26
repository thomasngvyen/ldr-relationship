import { Router } from 'express';
import type { Mood as PrismaMood } from '@prisma/client';
import prisma from '../lib/prisma';
import { zodValidator } from '../middleware/zodValidator';
import {
  moodMessageSchema,
  moodMessageUpdateSchema,
} from '../schemas/moodMessages';
import { getCoupleForUser } from './couples';

const router = Router();

async function getPairedCouple(userID: string) {
  const couple = await getCoupleForUser(userID);
  return couple?.userBId ? couple : null;
}

router.get('/', async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);
    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const moodMessages = await prisma.moodMessage.findMany({
      where: { userId: userID, coupleId: couple.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ moodMessages });
  } catch {
    return res.status(500).json({ error: 'Failed to get mood messages' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);
    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const moodMessage = await prisma.moodMessage.findFirst({
      where: {
        id: req.params.id as string,
        userId: userID,
        coupleId: couple.id,
      },
    });

    if (!moodMessage) {
      return res.status(404).json({ error: 'Mood message not found' });
    }

    return res.status(200).json({ moodMessage });
  } catch {
    return res.status(500).json({ error: 'Failed to get mood message' });
  }
});

router.post('/', zodValidator(moodMessageSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);
    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const { mood, message } = req.body;
    const moodMessage = await prisma.moodMessage.create({
      data: {
        mood: mood as PrismaMood,
        message,
        userId: userID,
        coupleId: couple.id,
      },
    });
    return res.status(201).json({ moodMessage });
  } catch {
    return res.status(500).json({ error: 'Failed to create mood message' });
  }
});

router.patch('/:id', zodValidator(moodMessageUpdateSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);
    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const existing = await prisma.moodMessage.findFirst({
      where: {
        id: req.params.id as string,
        userId: userID,
        coupleId: couple.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Mood message not found' });
    }

    const moodMessage = await prisma.moodMessage.update({
      where: { id: existing.id },
      data: {
        ...(req.body.mood !== undefined
          ? { mood: req.body.mood as PrismaMood }
          : {}),
        ...(req.body.message !== undefined ? { message: req.body.message } : {}),
      },
    });

    return res.status(200).json({
      moodMessage,
      message: 'Mood message updated successfully',
    });
  } catch {
    return res.status(500).json({ error: 'Failed to update mood message' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);
    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const existing = await prisma.moodMessage.findFirst({
      where: {
        id: req.params.id as string,
        userId: userID,
        coupleId: couple.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Mood message not found' });
    }

    const moodMessage = await prisma.moodMessage.delete({
      where: { id: existing.id },
    });

    return res.status(200).json({
      moodMessage,
      message: 'Mood message deleted successfully',
    });
  } catch {
    return res.status(500).json({ error: 'Failed to delete mood message' });
  }
});

export default router;

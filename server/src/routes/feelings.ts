import { Router } from 'express';
import prisma from '../lib/prisma';
import { zodValidator } from '../middleware/zodValidator';
import { feelingSchema } from '../schemas/feelings';
import { getCoupleForUser } from './couples';
import { sendPushToUser } from '../lib/push';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const feelings = await prisma.feeling.findMany({
      where: { coupleId: couple.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, displayName: true },
        },
      },
    });

    return res.status(200).json({ feelings });
  } catch {
    return res.status(500).json({ error: 'Failed to get feelings for couple' });
  }
});

router.get('/latest', async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const latestFeeling = await prisma.feeling.findFirst({
      where: { coupleId: couple.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!latestFeeling) {
      return res.status(404).json({ error: 'No feelings found' });
    }

    return res.status(200).json({ feeling: latestFeeling });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch latest feeling' });
  }
});

router.post('/', zodValidator(feelingSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const { feeling, reason } = req.body;

    const newFeeling = await prisma.feeling.create({
      data: {
        coupleId: couple.id,
        userId: userID,
        feeling,
        reason,
      },
    });

    const partnerId = couple.userAId === userID ? couple.userBId : couple.userAId;
    const sender = await prisma.user.findUnique({
      where: { id: userID },
      select: { displayName: true },
    });

    if (partnerId) {
      const name = sender?.displayName ?? 'Your partner';
      void sendPushToUser(partnerId, {
        title: `${name} shared that they're feeling ${newFeeling.feeling.toLowerCase().trim().replace(/\s+/g, ' ')}!`,
        body: 'Open HeartSync to see why.',
        url: '/feelings',
      }).catch((err) => {
        console.error('Failed to send partner push notification:', err);
      });
    }

    return res.status(201).json({
      feeling: {
        id: newFeeling.id,
        feeling: newFeeling.feeling,
        reason: newFeeling.reason,
        createdAt: newFeeling.createdAt,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to create feeling for couple' });
  }
});

export default router;

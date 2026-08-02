import { Router } from 'express';
import prisma from '../lib/prisma';
import { zodValidator } from '../middleware/zodValidator';
import { feelingSchema } from '../schemas/feelings';
import { getCoupleForUser } from './couples';
import { sendSMS } from '../lib/sms';

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

    // 1. Create the feeling
    const newFeeling = await prisma.feeling.create({
      data: {
        coupleId: couple.id,
        userId: userID,
        feeling,
        reason,
      },
    });

    // 2. Find partner in the couple (userAId/userBId are IDs, not user objects)
    const partnerId = couple.userAId === userID ? couple.userBId : couple.userAId;

    if (partnerId) {
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { phoneNumber: true, phoneCarrier: true },
      });

      if (partner?.phoneNumber && partner.phoneCarrier) {
        try {
          const messageBody = reason
            ? `Your partner feels ${feeling}: "${reason}"`
            : `Your partner feels ${feeling}!`;

          await sendSMS({
            phoneNumber: partner.phoneNumber,
            carrier: partner.phoneCarrier,
            message: messageBody,
          });
        } catch (smsError) {
          // Log SMS error without failing the whole request
          console.error('Failed to send partner SMS alert:', smsError);
        }
      }
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
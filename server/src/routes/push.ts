import { Router } from 'express';
import prisma from '../lib/prisma';
import { getVapidPublicKey } from '../lib/push';
import { authMiddleware } from '../middleware/auth';
import { zodValidator } from '../middleware/zodValidator';
import { pushSubscribeSchema, pushUnsubscribeSchema } from '../schemas/push';

const router = Router();

router.get('/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ error: 'Push notifications are not configured' });
  }
  return res.status(200).json({ publicKey: key });
});

router.post('/subscribe', authMiddleware, zodValidator(pushSubscribeSchema), async (req, res) => {
  try {
    const userId = req.user!.userID;
    const { endpoint, keys } = req.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return res.status(200).json({
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

router.delete(
  '/subscribe',
  authMiddleware,
  zodValidator(pushUnsubscribeSchema),
  async (req, res) => {
    try {
      const userId = req.user!.userID;
      const { endpoint } = req.body as { endpoint: string };

      await prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });

      return res.status(200).json({ unsubscribed: true });
    } catch {
      return res.status(500).json({ error: 'Failed to remove push subscription' });
    }
  },
);

export default router;

import crypto from 'node:crypto';
import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { zodValidator } from '../middleware/zodValidator';
import { pairSchema } from '../schemas/couples';

const router = Router();

const partnerSelect = {
  id: true,
  email: true,
  displayName: true,
} as const;

export async function getCoupleForUser(userID: string) {
  const user = await prisma.user.findUnique({
    where: { id: userID },
    include: { coupleAsA: true, coupleAsB: true },
  });

  return user?.coupleAsA ?? user?.coupleAsB ?? null;
}

//User A creates a couple and gets an invite code to share
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const userID = req.user!.userID;
    const existing = await getCoupleForUser(userID);

    if (existing) {
      if (existing.userBId) {
        return res.status(409).json({ error: 'Already paired' });
      }

      return res.status(200).json({
        couple: { id: existing.id, inviteCode: existing.inviteCode },
      });
    }

    const couple = await prisma.couple.create({
      data: {
        userAId: userID,
        inviteCode: crypto.randomUUID(),
      },
    });

    return res.status(201).json({
      couple: { id: couple.id, inviteCode: couple.inviteCode },
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// User B: join with User A's invite code
router.post('/pair', authMiddleware, zodValidator(pairSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const { inviteCode } = req.body;

    const existing = await getCoupleForUser(userID);
    if (existing) {
      return res.status(409).json({ error: 'Already in a couple' });
    }

    const couple = await prisma.couple.findUnique({
      where: { inviteCode },
    });

    if (!couple) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (couple.userAId === userID) {
      return res.status(400).json({ error: 'Cannot pair with yourself' });
    }

    if (couple.userBId) {
      return res.status(409).json({ error: 'Invite code already used' });
    }

    const updated = await prisma.couple.update({
      where: { id: couple.id },
      data: { userBId: userID },
      include: {
        userA: { select: partnerSelect },
        userB: { select: partnerSelect },
      },
    });

    return res.status(200).json({ paired: true, couple: updated });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userID = req.user!.userID;

    const user = await prisma.user.findUnique({
      where: { id: userID },
      include: {
        coupleAsA: {
          include: { userB: { select: partnerSelect } },
        },
        coupleAsB: {
          include: { userA: { select: partnerSelect } },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const couple = user.coupleAsA ?? user.coupleAsB;

    if (!couple) {
      return res.status(200).json({ paired: false, couple: null, partner: null });
    }

    const paired = couple.userBId !== null;
    const partner = user.coupleAsA
      ? user.coupleAsA.userB
      : user.coupleAsB!.userA;

    return res.status(200).json({
      paired,
      couple: {
        id: couple.id,
        inviteCode: paired ? null : couple.inviteCode,
        userAId: couple.userAId,
        userBId: couple.userBId,
      },
      partner: paired ? partner : null,
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

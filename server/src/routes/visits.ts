import { Router } from 'express';
import prisma from '../lib/prisma';
import { toVisitDate } from '../lib/visitDates';
import { authMiddleware } from '../middleware/auth';
import { zodValidator } from '../middleware/zodValidator';
import { visitSchema, visitUpdateSchema } from '../schemas/visits';
import { getCoupleForUser } from '../routes/couples';

const router = Router();

const visitingPartnerSelect = { id: true, displayName: true } as const;

/**
 * @param {{ userAId: string, userBId: string | null }} couple
 * @param {string} userId
 */
function isCoupleMember(
  couple: { userAId: string; userBId: string | null },
  userId: string,
) {
  return couple.userAId === userId || couple.userBId === userId;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const visits = await prisma.visit.findMany({
      where: { coupleId: couple.id },
      include: { visitingPartner: { select: visitingPartnerSelect } },
      orderBy: { start_date: 'asc' },
    });

    return res.status(200).json({ visits, message: 'Visits found successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to get visits' });
  }
});

router.get('/next', authMiddleware, async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const nextVisit = await prisma.visit.findFirst({
      where: {
        coupleId: couple.id,
        end_date: { gte: new Date() },
      },
      include: { visitingPartner: { select: visitingPartnerSelect } },
      orderBy: { start_date: 'asc' },
    });

    return res
      .status(200)
      .json({ visit: nextVisit, message: 'Next visit found successfully' });
  } catch {
    return res.status(500).json({ visit: null, error: 'Failed to find next visit' });
  }
});

router.post('/', authMiddleware, zodValidator(visitSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ visit: null, error: 'Couple not found' });
    }

    const { visitingPartnerId } = req.body;
    if (!isCoupleMember(couple, visitingPartnerId)) {
      return res.status(400).json({
        visit: null,
        error: 'Visiting partner must be a member of your couple',
      });
    }

    const start_date = toVisitDate(req.body.start_date);
    const end_date = toVisitDate(req.body.end_date);

    if (start_date > end_date) {
      return res
        .status(400)
        .json({ error: 'Start date must be on or before end date' });
    }

    const visit = await prisma.visit.create({
      data: {
        coupleId: couple.id,
        start_date,
        end_date,
        visitingPartnerId,
      },
      include: {
        visitingPartner: { select: visitingPartnerSelect },
      },
    });

    return res.status(201).json({ visit, message: 'Visit created successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to create visit' });
  }
});

router.patch('/:id', authMiddleware, zodValidator(visitUpdateSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const existing = await prisma.visit.findFirst({
      where: {
        id: req.params.id as string,
        coupleId: couple.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const nextStart =
      req.body.start_date !== undefined
        ? toVisitDate(req.body.start_date)
        : existing.start_date;
    const nextEnd =
      req.body.end_date !== undefined
        ? toVisitDate(req.body.end_date)
        : existing.end_date;

    if (nextStart > nextEnd) {
      return res
        .status(400)
        .json({ error: 'Start date must be on or before end date' });
    }

    if (
      req.body.visitingPartnerId !== undefined &&
      !isCoupleMember(couple, req.body.visitingPartnerId)
    ) {
      return res.status(400).json({
        error: 'Visiting partner must be a member of your couple',
      });
    }

    const visit = await prisma.visit.update({
      where: { id: existing.id },
      data: {
        ...(req.body.start_date !== undefined ? { start_date: nextStart } : {}),
        ...(req.body.end_date !== undefined ? { end_date: nextEnd } : {}),
        ...(req.body.visitingPartnerId !== undefined
          ? { visitingPartnerId: req.body.visitingPartnerId }
          : {}),
      },
      include: {
        visitingPartner: { select: visitingPartnerSelect },
      },
    });

    return res.status(200).json({ visit, message: 'Visit updated successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to update visit' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getCoupleForUser(userID);
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' });
    }

    const existing = await prisma.visit.findFirst({
      where: {
        id: req.params.id as string,
        coupleId: couple.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const visit = await prisma.visit.delete({
      where: { id: existing.id },
    });

    return res.status(200).json({ visit, message: 'Visit deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete visit' });
  }
});

export default router;

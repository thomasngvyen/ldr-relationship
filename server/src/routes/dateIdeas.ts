import { Router } from 'express';
import prisma from '../lib/prisma';
import { toVisitDate } from '../lib/calendarDates';
import { zodValidator } from '../middleware/zodValidator';
import {
  createDateIdeaSchema,
  updateDateIdeaSchema,
} from '../schemas/dateIdeas';
import { getCoupleForUser } from './couples';

const router = Router();

const ideaInclude = {
  user: { select: { id: true, displayName: true } },
  votes: { select: { id: true, userId: true } },
} as const;

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

    const dateIdeas = await prisma.dateIdea.findMany({
      where: { coupleId: couple.id },
      include: ideaInclude,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      dateIdeas: dateIdeas.map((idea) => ({
        ...idea,
        voteCount: idea.votes.length,
        votedByCurrentUser: idea.votes.some((vote) => vote.userId === userID),
      })),
    });
  } catch {
    return res.status(500).json({ error: 'Failed to get date ideas' });
  }
});

router.post('/', zodValidator(createDateIdeaSchema), async (req, res) => {
  try {
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);

    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const dateIdea = await prisma.dateIdea.create({
      data: {
        ...req.body,
        userId: userID,
        coupleId: couple.id,
      },
      include: ideaInclude,
    });

    return res.status(201).json({
      dateIdea: {
        ...dateIdea,
        voteCount: 0,
        votedByCurrentUser: false,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to create date idea' });
  }
});

router.post('/:id/vote', async (req, res) => {
  try {
    const id = req.params.id as string;
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);

    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const dateIdea = await prisma.dateIdea.findFirst({
      where: { id, coupleId: couple.id },
      select: { id: true },
    });

    if (!dateIdea) {
      return res.status(404).json({ error: 'Date idea not found' });
    }

    const existingVote = await prisma.dateIdeaVote.findUnique({
      where: {
        dateIdeaId_userId: { dateIdeaId: dateIdea.id, userId: userID },
      },
    });

    if (existingVote) {
      await prisma.dateIdeaVote.delete({ where: { id: existingVote.id } });
      const voteCount = await prisma.dateIdeaVote.count({
        where: { dateIdeaId: dateIdea.id },
      });
      return res.status(200).json({ voted: false, voteCount });
    }

    try {
      await prisma.dateIdeaVote.create({
        data: { dateIdeaId: dateIdea.id, userId: userID },
      });
    } catch (error) {
      // Concurrent double-vote: treat as already voted
      if (
        !(
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'P2002'
        )
      ) {
        throw error;
      }
    }

    const voteCount = await prisma.dateIdeaVote.count({
      where: { dateIdeaId: dateIdea.id },
    });
    return res.status(201).json({ voted: true, voteCount });
  } catch {
    return res.status(500).json({ error: 'Failed to update vote' });
  }
});

router.patch('/:id', zodValidator(updateDateIdeaSchema), async (req, res) => {
  try {
    const id = req.params.id as string;
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);

    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const existing = await prisma.dateIdea.findFirst({
      where: { id, coupleId: couple.id },
      select: {
        id: true,
        userId: true,
        status: true,
        plannedDate: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Date idea not found' });
    }

    const {
      title,
      description,
      category,
      status,
      plannedDate,
    } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      status?: string;
      plannedDate?: string | null;
    };

    const contentKeys = [title, description, category].filter((v) => v !== undefined);
    const isCreator = existing.userId === userID;

    // Anyone in the couple can move status / set planned date; only creator edits content
    if (!isCreator && contentKeys.length > 0) {
      return res.status(403).json({
        error: 'Only the person who added this idea can edit it',
      });
    }

    const nextStatus = status ?? existing.status;
    /** @type {Record<string, unknown>} */
    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (status !== undefined) data.status = status;

    if (plannedDate !== undefined) {
      if (plannedDate === null) {
        data.plannedDate = null;
        data.dayBeforeNotifiedAt = null;
        data.dayOfNotifiedAt = null;
      } else {
        if (nextStatus !== 'SELECTED' && nextStatus !== 'COMPLETED') {
          return res.status(400).json({
            error: 'Set the idea to Planned before adding a date',
          });
        }
        const nextPlanned = toVisitDate(plannedDate);
        data.plannedDate = nextPlanned;
        const prevKey = existing.plannedDate
          ? existing.plannedDate.toISOString().slice(0, 10)
          : null;
        if (prevKey !== plannedDate) {
          data.dayBeforeNotifiedAt = null;
          data.dayOfNotifiedAt = null;
        }
      }
    }

    // Returning to the backlog clears schedule
    if (status === 'IDEA') {
      data.plannedDate = null;
      data.dayBeforeNotifiedAt = null;
      data.dayOfNotifiedAt = null;
    }

    const dateIdea = await prisma.dateIdea.update({
      where: { id: existing.id },
      data,
      include: ideaInclude,
    });

    return res.status(200).json({
      dateIdea: {
        ...dateIdea,
        voteCount: dateIdea.votes.length,
        votedByCurrentUser: dateIdea.votes.some(
          (vote) => vote.userId === userID,
        ),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to update date idea' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;
    const userID = req.user!.userID;
    const couple = await getPairedCouple(userID);

    if (!couple) {
      return res.status(403).json({ error: 'User is not in a paired couple' });
    }

    const existing = await prisma.dateIdea.findFirst({
      where: { id, coupleId: couple.id },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Date idea not found' });
    }

    if (existing.userId !== userID) {
      return res.status(403).json({
        error: 'Only the person who added this idea can delete it',
      });
    }

    await prisma.dateIdea.delete({ where: { id: existing.id } });
    return res.status(200).json({ message: 'Date idea deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete date idea' });
  }
});

export default router;

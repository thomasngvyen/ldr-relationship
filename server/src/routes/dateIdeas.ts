import { Router } from 'express';
import prisma from '../lib/prisma';
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

    await prisma.dateIdeaVote.create({
      data: { dateIdeaId: dateIdea.id, userId: userID },
    });
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
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Date idea not found' });
    }

    const dateIdea = await prisma.dateIdea.update({
      where: { id: existing.id },
      data: req.body,
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
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Date idea not found' });
    }

    await prisma.dateIdea.delete({ where: { id: existing.id } });
    return res.status(200).json({ message: 'Date idea deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete date idea' });
  }
});

export default router;

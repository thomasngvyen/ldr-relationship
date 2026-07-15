import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { zodValidator } from '../middleware/zodValidator';
import { visitSchema, visitUpdateSchema } from '../schemas/visits';
import { getCoupleForUser } from '../routes/couples';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const userID = req.user!.userID;
        const couple = await getCoupleForUser(userID);
        if (!couple) {
            return res.status(404).json({ error: 'Couple not found' });
        }
        const visits = await prisma.visit.findMany({
            where: {
                coupleId: couple.id,
            },
        });
        return res.status(200).json({ visits: visits, message: 'Visits found successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get visits' });
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
            where:{
                coupleId: couple.id, 
                start_date: {
                    gt: new Date(),
                }
            },
            orderBy: {
                start_date: 'asc',
            }
        })
        return res.status(200).json({ visit: nextVisit, message: 'Next visit found successfully' });
    }
    catch (error) {
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
        const visit = await prisma.visit.create({
            data:{
                coupleId: couple.id,
                start_date: req.body.start_date,
                end_date: req.body.end_date,
            },
            include: {
                couple: {
                    select: {
                        id: true,
                    }
                }
            }
        })
        return res.status(201).json({ visit: visit, message: 'Visit created successfully' });
    }
    catch (error) {
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
        const visit = await prisma.visit.update({
            where: {
                id: req.params.id as string, 
                coupleId: couple.id,
            },
            data: {
                start_date: req.body.start_date,
                end_date: req.body.end_date,
            },
            include: {
                couple: {
                    select: {
                        id: true,
                    }
                }
            }
        })
        return res.status(200).json({ visit: visit, message: 'Visit updated successfully' });
    }
    catch (error) {
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
        const visit = await prisma.visit.delete({
            where: {
                id: req.params.id as string,
                coupleId: couple.id,
            },
            include: {
                couple: {
                    select: {
                        id: true,
                    }
                }
            }
        })
        return res.status(200).json({ visit: visit, message: 'Visit deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to delete visit' });
    }
});
export default router;
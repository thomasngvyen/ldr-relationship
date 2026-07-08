import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const requireCouple = async(req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.userID) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try{
        const user = await prisma.user.findUnique({
            where:{
                id: req.user?.userID,
            },
            include:{
                coupleAsA: true,
                coupleAsB: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (!(user.coupleAsA || user.coupleAsB)) {
            return res.status(403).json({ error: 'User is not in a couple' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
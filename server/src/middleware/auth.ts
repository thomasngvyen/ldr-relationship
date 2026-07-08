import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = verifyToken(token);
    if (
      typeof decoded === 'string' ||
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.userID !== 'string'
    ) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = { userID: decoded.userID };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

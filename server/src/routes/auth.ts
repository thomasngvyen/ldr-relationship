import bcrypt from 'bcrypt';
import { Router } from 'express';
import type { PhoneCarrier } from '@prisma/client';
import { generateToken } from '../lib/jwt';
import prisma from '../lib/prisma';
import { registerSchema, loginSchema, updateProfileSchema } from '../schemas/auth';
import { zodValidator } from '../middleware/zodValidator';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/** Valid bcrypt hash used only so missing-user logins take similar time */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('__timing_dummy__', 10);

function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  phoneCarrier: PhoneCarrier | null;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    phoneCarrier: user.phoneCarrier,
  };
}

router.post('/register', zodValidator(registerSchema), async (req, res) => {
  try {
    const { displayName, email, password, phoneNumber, phoneCarrier } = req.body;

    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    if (await prisma.user.findUnique({ where: { phoneNumber } })) {
      return res.status(409).json({ error: 'Phone number already exists with another account' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { displayName, email, passwordHash, phoneNumber, phoneCarrier },
    });
    const token = generateToken(user.id);

    return res.status(201).json({
      user: publicUser(user),
      token,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', zodValidator(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always hash-compare so missing users don't respond faster than bad passwords
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const valid = await bcrypt.compare(password, passwordHash);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    return res.status(200).json({
      user: publicUser(user),
      token,
    });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', authMiddleware, zodValidator(updateProfileSchema), async (req, res) => {
  try {
    const userId = req.user!.userID;
    const { phoneNumber, phoneCarrier } = req.body as {
      phoneNumber?: string;
      phoneCarrier?: PhoneCarrier;
    };

    if (phoneNumber !== undefined) {
      const existing = await prisma.user.findUnique({ where: { phoneNumber } });
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: 'Phone number already exists with another account' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(phoneCarrier !== undefined ? { phoneCarrier } : {}),
      },
    });

    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Phone number already exists with another account' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

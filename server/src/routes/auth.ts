import bcrypt from 'bcrypt';
import { Router } from 'express';
import { generateToken } from '../lib/jwt';
import prisma from '../lib/prisma';
import { registerSchema, loginSchema } from '../schemas/auth';
import { zodValidator } from '../middleware/zodValidator';

const router = Router();

router.post('/register', zodValidator(registerSchema), async (req, res) => {
  try {
    const { displayName, email, password } = req.body;
    
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({data: {displayName, email, passwordHash}})
    const token = generateToken(user.id);
    
    res.status(201).json({ user: { id: user.id, email: user.email, displayName: user.displayName }, token });

  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', zodValidator(loginSchema), async(req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (await bcrypt.compare(password, user.passwordHash)) {
      const token = generateToken(user.id);
      res.status(200).json({ user: { id: user.id, email: user.email, displayName: user.displayName }, token });
    }
    else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }
  catch(error){
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().min(3).max(20),
  email: z.string().email().transform(val => val.toLowerCase()),
  password: z.string().min(8).max(32),
});

export const loginSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase()),
  password: z.string().min(8).max(32),
});

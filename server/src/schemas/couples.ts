import { z } from 'zod';

export const pairSchema = z.object({
  inviteCode: z.string().uuid(),
});

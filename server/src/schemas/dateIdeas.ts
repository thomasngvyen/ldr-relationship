import { z } from 'zod';
import { DateIdeaCategory, DateIdeaStatus } from '@prisma/client';

export const createDateIdeaSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000),
  category: z.nativeEnum(DateIdeaCategory),
});

export const updateDateIdeaSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    category: z.nativeEnum(DateIdeaCategory).optional(),
    status: z.nativeEnum(DateIdeaStatus).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.category !== undefined ||
      data.status !== undefined,
    { message: 'At least one field is required' },
  );

export type CreateDateIdeaInput = z.infer<typeof createDateIdeaSchema>;
export type UpdateDateIdeaInput = z.infer<typeof updateDateIdeaSchema>;

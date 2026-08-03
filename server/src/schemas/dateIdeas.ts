import { z } from 'zod';
import { DateIdeaCategory, DateIdeaStatus } from '@prisma/client';

/** Calendar day as YYYY-MM-DD, or null to clear */
const plannedDateSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    z.null(),
  ])
  .optional();

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
    plannedDate: plannedDateSchema,
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.category !== undefined ||
      data.status !== undefined ||
      data.plannedDate !== undefined,
    { message: 'At least one field is required' },
  );

export type CreateDateIdeaInput = z.infer<typeof createDateIdeaSchema>;
export type UpdateDateIdeaInput = z.infer<typeof updateDateIdeaSchema>;

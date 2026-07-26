import { z } from 'zod'

export const createMemorySchema = z
  .object({
    visitId: z.string().min(1).optional(),
    dateIdeaId: z.string().min(1).optional(),
    title: z.string().trim().max(120).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => Boolean(data.visitId) !== Boolean(data.dateIdeaId),
    {
      message: 'Provide exactly one of visitId or dateIdeaId',
      path: ['visitId'],
    },
  )

export const updateMemorySchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    note: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.note !== undefined,
    { message: 'At least one field is required' },
  )

export type CreateMemoryInput = z.infer<typeof createMemorySchema>
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>

import { z } from 'zod';

export const visitSchema = z.object({
  coupleID: z.string().uuid(),
  visitDate: z.date(),
  notes: z.string().optional(),
});

export type Visit = z.infer<typeof visitSchema>;

export const visitUpdateSchema = visitSchema.partial();

export type VisitUpdate = z.infer<typeof visitUpdateSchema>;

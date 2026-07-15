import { z } from 'zod';

export const visitSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
}).refine((data) => data.start_date < data.end_date, {
  message: 'Start date must be before end date',
  path: ['start_date'],
});

export const visitUpdateSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
}).refine(
  (data) => data.start_date || data.end_date,
  { message: 'At least one field is required' }
).refine(
  (data) => !data.start_date || !data.end_date || data.start_date < data.end_date,
  { message: 'Start date must be before end date', path: ['start_date'] }
);

export type Visit = z.infer<typeof visitSchema>;


export type VisitUpdate = z.infer<typeof visitUpdateSchema>;

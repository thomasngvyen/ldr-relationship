import { z } from 'zod';
import { MOODS } from '../constants/moods';

export const moodMessageSchema = z.object({
  mood: z.enum(MOODS),
  message: z.string().trim().min(1).max(500),
});

export const moodMessageUpdateSchema = z
  .object({
    mood: z.enum(MOODS).optional(),
    message: z.string().trim().min(1).max(500).optional(),
  })
  .refine((data) => data.mood !== undefined || data.message !== undefined, {
    message: 'At least one field is required',
  });

export type MoodMessageInput = z.infer<typeof moodMessageSchema>;
export type MoodMessageUpdate = z.infer<typeof moodMessageUpdateSchema>;

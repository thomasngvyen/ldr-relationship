import { z } from 'zod';

export const feelingSchema = z.object({
    feeling: z.string().min(1).max(255),
    reason: z.string().min(1).max(255).optional(),
}).refine((data) => data.feeling !== undefined || data.reason !== undefined, {
    message: 'At least one field is required',
});

export const feelingUpdateSchema = z.object({
    feeling: z.string().min(1).max(255).optional(),
    reason: z.string().min(1).max(255).optional(),
}).refine((data) => data.feeling !== undefined || data.reason !== undefined, {
    message: 'At least one field is required',
});

export type FeelingInput = z.infer<typeof feelingSchema>;
export type FeelingUpdate = z.infer<typeof feelingUpdateSchema>;
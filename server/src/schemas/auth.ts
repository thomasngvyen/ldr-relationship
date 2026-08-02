import { z } from 'zod';
import { CARRIER_GATEWAYS } from '../constants/carriers';

const phoneCarrierEnum = z.enum(
  Object.keys(CARRIER_GATEWAYS) as [keyof typeof CARRIER_GATEWAYS, ...(keyof typeof CARRIER_GATEWAYS)[]],
);

const phoneNumberSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\D/g, '').slice(-10))
  .refine((val) => val.length === 10, { message: 'Phone number must be 10 digits' });

export const registerSchema = z.object({
  displayName: z.string().min(3).max(20),
  email: z.string().email().transform((val) => val.toLowerCase()),
  password: z.string().min(8).max(32),
  phoneNumber: phoneNumberSchema,
  phoneCarrier: phoneCarrierEnum,
});

export const loginSchema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase()),
  password: z.string().min(8).max(32),
});

export const updateProfileSchema = z
  .object({
    phoneNumber: phoneNumberSchema.optional(),
    phoneCarrier: phoneCarrierEnum.optional(),
  })
  .refine((data) => data.phoneNumber !== undefined || data.phoneCarrier !== undefined, {
    message: 'Provide phoneNumber and/or phoneCarrier',
  });

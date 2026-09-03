import { z } from 'zod';

export const AccountCreateSchema = z.object({
  username: z.string().trim().min(1).max(254),
  password: z.string().max(512).optional(),
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
});

export const AccountUpdateSchema = z.object({
  id: z.string().trim().min(1),
  username: z.string().trim().min(1).max(254).optional(),
  password: z.string().max(512).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().min(1).max(120).optional(),
});

export const AccountDeleteSchema = z.object({
  id: z.string().trim().min(1),
});

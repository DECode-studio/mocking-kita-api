import { z } from 'zod';

export const AuthLoginSchema = z.object({
  username: z.preprocess(
    (value) => (typeof value === 'string' ? value : ''),
    z.string().trim().min(1, 'Username or Email is required').max(254)
  ),
  password: z.string().max(512).optional().default(''),
  rememberMe: z.boolean().optional().default(false),
  registerExtra: z
    .object({
      name: z.string().trim().min(1, 'Display Name is required').max(120),
      role: z.string().trim().min(1, 'Role is required').max(120),
    })
    .optional(),
});

export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;

import { z } from 'zod';

export const ThemeSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional().default('dark'),
});

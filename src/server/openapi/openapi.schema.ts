import { z } from 'zod';

export const ProjectParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const OpenApiImportSchema = z.object({
  mode: z.enum(['upsert', 'merge', 'replace']).optional().default('upsert'),
  openApiJson: z.unknown().optional(),
}).passthrough();

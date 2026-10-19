import { z } from 'zod';

export const ProjectParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const OpenApiImportSchema = z.object({
  mode: z.enum(['upsert', 'merge', 'replace']).optional().default('upsert'),
  format: z.enum(['openapi', 'confluence_markdown']).optional().default('openapi'),
  openApiJson: z.unknown().optional(),
  markdownText: z.string().optional(),
  markdownTexts: z.array(z.string()).optional(),
}).passthrough();

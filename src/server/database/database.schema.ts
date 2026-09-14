import { z } from 'zod';

export const DatabaseActionSchema = z.object({
  action: z.string().trim().min(1),
  payload: z.unknown().optional(),
});

export type DatabaseActionBody = z.infer<typeof DatabaseActionSchema>;

export const DatabaseImportModeSchema = z.enum(['replace', 'merge']);

export const DatabaseImportPayloadSchema = z.object({
  data: z.unknown(),
  mode: DatabaseImportModeSchema,
});

export const IdPayloadSchema = z.object({
  id: z.string().trim().min(1),
});

export const ProjectIdPayloadSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const ApiIdPayloadSchema = z.object({
  apiId: z.string().trim().min(1),
});

export const RequestScenarioIdPayloadSchema = z.object({
  requestScenarioId: z.string().trim().min(1),
});

export const ApiEnvironmentLookupPayloadSchema = z.object({
  apiId: z.string().trim().min(1),
  environmentId: z.string().trim().min(1),
});

export const UpdatePayloadSchema = z.object({
  id: z.string().trim().min(1),
  input: z.record(z.string(), z.unknown()),
});

export const ObjectPayloadSchema = z.record(z.string(), z.unknown());

export const ExportProjectOpenApiPayloadSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const ImportProjectOpenApiPayloadSchema = z.object({
  projectId: z.string().trim().min(1),
  openApiJson: z.unknown(),
  mode: z.enum(['upsert', 'merge', 'replace']).optional().default('upsert'),
});

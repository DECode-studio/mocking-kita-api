import { z } from 'zod';
import { ok, fail, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { logChange } from '@/src/core/db/change_log_helper';
import {
  getDataSheets,
  getDataSheetById,
  createDataSheet,
  updateDataSheet,
  softDeleteDataSheet,
} from './data-sheet.repository';

const CreateDataSheetSchema = z.object({
  projectId: z.string().nullable().optional(),
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code/Slug is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Code can only contain alphanumeric characters, underscores, dashes, and dots'),
  category: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  format: z.enum(['LIST', 'TABLE']).default('LIST'),
  data: z.array(z.any()).default([]),
  status: z.boolean().default(true),
});

const UpdateDataSheetSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
  category: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  format: z.enum(['LIST', 'TABLE']).optional(),
  data: z.array(z.any()).optional(),
  status: z.boolean().optional(),
});

/**
 * GET /api/data-sheets
 */
export async function listDataSheets(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status');

    let status: boolean | undefined = undefined;
    if (statusParam === 'true') status = true;
    if (statusParam === 'false') status = false;

    const sheets = await getDataSheets({
      projectId: projectId !== null ? projectId : undefined,
      category,
      search,
      status,
    });

    return ok(sheets);
  } catch (error) {
    return jsonUnknownError('Failed to list data sheets', error, 'Data sheets request failed');
  }
}

/**
 * GET /api/data-sheets/[id]
 */
export async function getDataSheetDetail(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    const sheet = await getDataSheetById(id);
    if (!sheet) {
      return fail('Data sheet not found', 404, 'NOT_FOUND');
    }

    return ok(sheet);
  } catch (error) {
    return jsonUnknownError('Failed to fetch data sheet', error, 'Data sheet request failed');
  }
}

/**
 * POST /api/data-sheets
 */
export async function createDataSheetHandler(request: Request) {
  try {
    const body = await request.json();
    const parseResult = CreateDataSheetSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(parseResult.error.issues[0]?.message || 'Validation error', 400, 'VALIDATION_ERROR');
    }

    const input = parseResult.data;
    const sheet = await createDataSheet({
      ...input,
      code: input.code.toLowerCase(),
    });

    await logChange({
      action: 'CREATE',
      entityType: 'data_sheet',
      entityId: sheet.id,
      projectId: sheet.projectId,
      afterState: sheet,
      description: `Created data sheet '${sheet.name}' (${sheet.code})`,
    });

    return ok(sheet);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return fail('Data sheet with this code already exists for this project', 409, 'DUPLICATE_CODE');
    }
    return jsonUnknownError('Failed to create data sheet', error, 'Data sheet creation failed');
  }
}

/**
 * PUT /api/data-sheets/[id]
 */
export async function updateDataSheetHandler(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    const existing = await getDataSheetById(id);
    if (!existing) {
      return fail('Data sheet not found', 404, 'NOT_FOUND');
    }

    const body = await request.json();
    const parseResult = UpdateDataSheetSchema.safeParse(body);
    if (!parseResult.success) {
      return fail(parseResult.error.issues[0]?.message || 'Validation error', 400, 'VALIDATION_ERROR');
    }

    const input = parseResult.data;
    const updated = await updateDataSheet(id, {
      ...input,
      ...(input.code ? { code: input.code.toLowerCase() } : {}),
    });

    await logChange({
      action: 'UPDATE',
      entityType: 'data_sheet',
      entityId: id,
      projectId: updated.projectId,
      beforeState: existing,
      afterState: updated,
      description: `Updated data sheet '${updated.name}'`,
    });

    return ok(updated);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return fail('Data sheet with this code already exists for this project', 409, 'DUPLICATE_CODE');
    }
    return jsonUnknownError('Failed to update data sheet', error, 'Data sheet update failed');
  }
}

/**
 * DELETE /api/data-sheets/[id]
 */
export async function deleteDataSheetHandler(_request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { id } = resolvedParams;

    const existing = await getDataSheetById(id);
    if (!existing) {
      return fail('Data sheet not found', 404, 'NOT_FOUND');
    }

    await softDeleteDataSheet(id);

    await logChange({
      action: 'DELETE',
      entityType: 'data_sheet',
      entityId: id,
      projectId: existing.projectId,
      beforeState: existing,
      description: `Deleted data sheet '${existing.name}'`,
    });

    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Failed to delete data sheet', error, 'Data sheet deletion failed');
  }
}

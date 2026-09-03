import { z } from 'zod';
import { fail, ok, okNoContent } from '@/src/core/utils/api-response';
import { jsonUnknownError } from '@/src/core/server/http/responses';
import { generateId } from '@/src/core/utils/uuid';
import { clearInternalProxyCache } from '@/src/modules/mock-proxy/mock-proxy.cache';
import { createProject, getAllProjects, getProjectById, hardDeleteProject, restoreProject, softDeleteProject, updateProject } from './project.repository';

const ObjectSchema = z.record(z.string(), z.unknown());
const IdParamsSchema = z.object({ id: z.string().trim().min(1) });

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

async function getId(context: RouteContext): Promise<string> {
  return IdParamsSchema.parse(await context.params).id;
}

export async function GET(_request: Request, context?: RouteContext) {
  try {
    if (!context) return ok(await getAllProjects());
    return ok(await getProjectById(await getId(context)));
  } catch (error) {
    return jsonUnknownError('Project request failed', error, 'Project request failed', 'PROJECT_REQUEST_FAILED');
  }
}

export async function POST(request: Request) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const now = new Date().toISOString();
    const project = await createProject({ ...input, id: generateId(), createdAt: now, updatedAt: now } as never);
    clearInternalProxyCache();
    return ok(project);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return fail('Invalid project request', 400, 'INVALID_PROJECT_REQUEST');
    }
    return jsonUnknownError('Project create failed', error, 'Project create failed', 'PROJECT_CREATE_FAILED');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const input = ObjectSchema.parse(await request.json());
    const project = await updateProject(await getId(context), input);
    clearInternalProxyCache();
    return ok(project);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return fail('Invalid project request', 400, 'INVALID_PROJECT_REQUEST');
    }
    return jsonUnknownError('Project update failed', error, 'Project update failed', 'PROJECT_UPDATE_FAILED');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await softDeleteProject(await getId(context));
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Project delete failed', error, 'Project delete failed', 'PROJECT_DELETE_FAILED');
  }
}

export async function restoreProjectRoute(_request: Request, context: RouteContext) {
  try {
    await restoreProject(await getId(context));
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Project restore failed', error, 'Project restore failed', 'PROJECT_RESTORE_FAILED');
  }
}

export async function hardDeleteProjectRoute(_request: Request, context: RouteContext) {
  try {
    await hardDeleteProject(await getId(context));
    clearInternalProxyCache();
    return okNoContent();
  } catch (error) {
    return jsonUnknownError('Project hard delete failed', error, 'Project hard delete failed', 'PROJECT_HARD_DELETE_FAILED');
  }
}

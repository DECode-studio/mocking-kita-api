import prisma from '@/src/core/db/prisma-client';
import { generateId } from '@/src/core/utils/uuid';
import { FlowExportTemplate } from './scenario-flow.types';
import { getScenarioFlowById } from './scenario-flow.repository';
import { Prisma } from '@prisma/client';
import {
  getEnvironmentBaseUrl,
  normalizeEnvironmentValues,
} from '@/src/client/domain/environment/entity/environment';

function toEnvSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Export Scenario Flow to portable JSON
 */
export async function exportScenarioFlowToTemplate(flowId: string): Promise<FlowExportTemplate> {
  const flow = await getScenarioFlowById(flowId);
  if (!flow) {
    throw new Error(`Scenario flow '${flowId}' not found.`);
  }

  // Fetch response scenarios for linked request scenarios
  const reqScenarioIds = flow.steps
    .map((s) => s.requestScenarioId)
    .filter((id): id is string => !!id);

  const responseScenarios = reqScenarioIds.length > 0
    ? await prisma.responseScenario.findMany({
        where: { requestScenarioId: { in: reqScenarioIds }, deletedAt: null },
      })
    : [];

  const responseByReqId = new Map<string, (typeof responseScenarios)[0]>();
  for (const resp of responseScenarios) {
    if (!responseByReqId.has(resp.requestScenarioId)) {
      responseByReqId.set(resp.requestScenarioId, resp);
    }
  }

  // Collect project environments if present
  const envs = flow.projectId
    ? await prisma.environment.findMany({
        where: { projectId: flow.projectId, deletedAt: null },
      })
    : [];

  const exportTemplate: FlowExportTemplate = {
    $schema: 'mock-api-studio/scenario-flow/v1',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    environments: envs.map((e) => ({
      id: toEnvSlug(e.name),
      name: e.name,
      isBaseUrl: e.isBaseUrl !== false,
      values: (e.values as any) || {},
      environmentType: (e.environmentType as any) || undefined,
      baseUrl: getEnvironmentBaseUrl(e as any),
      variables: (e.variables as any) || [],
      isDefault: e.id === flow.defaultEnvironmentId,
    })),
    flow: {
      name: flow.name,
      description: flow.description,
      stopOnFailure: flow.stopOnFailure,
      variables: (flow.variables as Record<string, any>) || {},
    },
    steps: flow.steps.map((step) => {
      const respScenario = step.requestScenarioId
        ? responseByReqId.get(step.requestScenarioId)
        : null;

      const apiEnvs = (step.api as any)?.apiEnvironments || [];
      const envSlugs = apiEnvs
        .map((ae: any) => toEnvSlug(ae.environment?.name || ''))
        .filter(Boolean);

      let targetEnv: string | null = null;
      if (envSlugs.some((s: string) => s.includes('gateway'))) {
        targetEnv = 'gateway';
      } else if (envSlugs.some((s: string) => s.includes('direct'))) {
        targetEnv = 'direct';
      } else if (envSlugs.length > 0) {
        targetEnv = envSlugs[0];
      }

      return {
        order: step.stepOrder,
        name: step.name,
        description: step.description,
        enabled: step.enabled,
        delayMs: step.delayMs,
        continueOnError: step.continueOnError,
        api: {
          method: step.api?.methodRequest || step.methodOverride || 'GET',
          path: step.api?.path || step.pathOverride || '',
          name: step.api?.name,
          collection: step.api?.collection?.name || null,
          description: step.api ? (step.api as any).description : null,
          targetEnvironment: targetEnv,
          environmentIds: envSlugs.length > 0 ? envSlugs : undefined,
          targetEnvironmentType: (step as any).targetEnvironmentType === 'LOCAL' ? 'LOCAL' : undefined,
        },
        requestScenario: step.requestScenario
          ? {
              name: step.requestScenario.name,
              headers: (step.requestScenario.headers as Record<string, string>) || {},
              queryParams: (step.requestScenario.queryParams as Record<string, string>) || {},
              pathParams: (step.requestScenario.pathParams as Record<string, string>) || {},
              body: step.requestScenario.body,
              bodyType: step.requestScenario.bodyType,
            }
          : undefined,
        expectedResponseScenario: respScenario
          ? {
              name: respScenario.name,
              statusCode: respScenario.statusCode ?? 200,
              headers: (respScenario.headers as Record<string, string>) || {},
              body: respScenario.body,
            }
          : undefined,
        overrides: {
          method: step.methodOverride,
          path: step.pathOverride,
          headers: (step.headersOverride as Record<string, string>) || null,
          queryParams: (step.queryParamsOverride as Record<string, string>) || null,
          pathParams: (step.pathParamsOverride as Record<string, string>) || null,
          body: step.bodyOverride,
          bodyType: step.bodyType || step.requestScenario?.bodyType || 'JSON',
        },
        extractors: (step.extractors as any) || [],
        assertions: (step.assertions as any) || [],
      };
    }),
  };

  return exportTemplate;
}

/**
 * Import Scenario Flow from JSON template with full UPSERT support:
 * - Upserts ScenarioFlow
 * - Upserts Collections & APIs (if API doesn't exist, automatically creates it!)
 * - Upserts RequestScenario & ResponseScenario (if provided and doesn't exist, automatically creates them!)
 * - Upserts ScenarioFlowSteps
 */
export async function importScenarioFlowFromTemplate(
  projectId: string,
  template: any
): Promise<{
  success: boolean;
  flowId: string;
  flowName: string;
  apisCreated: number;
  apisExisting: number;
  requestScenariosCreated: number;
  stepsCount: number;
}> {
  if (!template || !template.flow || !template.flow.name) {
    throw new Error('Invalid Scenario Flow template: "flow.name" is required.');
  }

  const rawSteps = Array.isArray(template.steps) ? template.steps : [];
  const flowData = template.flow;
  const now = new Date();

  let apisCreated = 0;
  let apisExisting = 0;
  let requestScenariosCreated = 0;

  // 0. Upsert Environments (from template.environments or inferred from variables)
  let defaultEnvId: string | null = null;
  const envDefinitions: Array<{
    name: string;
    environmentType?: string;
    baseUrl: string;
    isDefault?: boolean;
  }> = [];

  if (Array.isArray(template.environments) && template.environments.length > 0) {
    envDefinitions.push(...template.environments);
  } else {
    // Inferred from variables
    const vars = flowData.variables || {};
    const primaryUrl = vars.apigeeBaseUrl || vars.baseUrl;
    if (primaryUrl && typeof primaryUrl === 'string') {
      envDefinitions.push({
        name: `${flowData.name || 'API'} (Gateway)`,
        baseUrl: primaryUrl,
        environmentType: 'DEVELOPMENT',
        isDefault: true,
      });
    }
    if (vars.kpmBaseUrl && typeof vars.kpmBaseUrl === 'string' && vars.kpmBaseUrl !== primaryUrl) {
      envDefinitions.push({
        name: `${flowData.name || 'API'} (Direct)`,
        baseUrl: vars.kpmBaseUrl,
        environmentType: 'DEVELOPMENT',
        isDefault: false,
      });
    }
  }

  if (projectId && envDefinitions.length > 0) {
    for (const envItem of envDefinitions) {
      const isBaseUrl = (envItem as any).isBaseUrl !== false;
      const cleanBaseUrl = envItem.baseUrl ? String(envItem.baseUrl).trim() : '';
      let values = normalizeEnvironmentValues((envItem as any).values, isBaseUrl);

      // If legacy baseUrl was provided and values is empty, populate the appropriate stage
      if (cleanBaseUrl && Object.values(values).every((v) => !v)) {
        const stage = (envItem.environmentType as any) || 'DEVELOPMENT';
        if (!isBaseUrl || stage !== 'LOCAL') {
          values[stage as any] = cleanBaseUrl;
        }
      }

      const envName = envItem.name || 'Default Environment';
      const envVariables = Array.isArray((envItem as any).variables)
        ? (envItem as any).variables
        : cleanBaseUrl
        ? [{ id: generateId(), key: 'baseUrl', value: cleanBaseUrl, type: 'plain', enabled: true }]
        : [];

      const existingEnv = await prisma.environment.findFirst({
        where: {
          projectId,
          name: envName,
          deletedAt: null,
        },
      });

      let currentId: string;
      if (existingEnv) {
        currentId = existingEnv.id;
        await prisma.environment.update({
          where: { id: existingEnv.id },
          data: {
            isBaseUrl,
            values: values as any,
            variables: envVariables as any,
            updatedAt: now,
          },
        });
      } else {
        const created = await prisma.environment.create({
          data: {
            projectId,
            name: envName,
            isBaseUrl,
            values: values as any,
            variables: envVariables as any,
            environmentType: (envItem.environmentType as any) || null,
            status: true,
            createdAt: now,
            updatedAt: now,
          },
        });
        currentId = created.id;
      }

      if (envItem.isDefault || !defaultEnvId) {
        defaultEnvId = currentId;
      }
    }
  }

  // 1. Fetch all project environments for linking
  const rawProjectEnvs = projectId
    ? await prisma.environment.findMany({
        where: { projectId, deletedAt: null },
      })
    : [];
  const projectEnvs = Array.isArray(rawProjectEnvs) ? rawProjectEnvs : [];

  // Map template env IDs (slugs without spaces / lowercase) to DB environments
  const templateEnvIdMap = new Map<string, (typeof projectEnvs)[0]>();
  for (const def of envDefinitions) {
    const rawDef = def as any;
    const cleanName = def.name || '';
    const dbMatch = projectEnvs.find(
      (pe) =>
        pe.name.toLowerCase() === cleanName.toLowerCase() ||
        toEnvSlug(pe.name) === toEnvSlug(cleanName) ||
        (def.baseUrl && getEnvironmentBaseUrl(pe as any) === def.baseUrl)
    );
    if (dbMatch) {
      if (rawDef.id) {
        templateEnvIdMap.set(String(rawDef.id).toLowerCase().trim(), dbMatch);
      }
      templateEnvIdMap.set(toEnvSlug(cleanName), dbMatch);
      templateEnvIdMap.set(cleanName.toLowerCase(), dbMatch);
    }
  }

  // 2. Find or create Collections
  const existingCollections = await prisma.collection.findMany({
    where: { projectId, deletedAt: null },
  });
  const collectionByName = new Map<string, string>();
  existingCollections.forEach((c) => collectionByName.set(c.name.toLowerCase(), c.id));

  // 2. Find existing APIs for this project
  const existingApis = await prisma.api.findMany({
    where: { projectId, deletedAt: null },
    include: {
      requestScenarios: { where: { deletedAt: null } },
    },
  });

  const apiMap = new Map<string, (typeof existingApis)[0]>();
  existingApis.forEach((api) => {
    const key = `${api.methodRequest.toUpperCase()}::${api.path}`;
    apiMap.set(key, api);
  });

  // 3. Process each step and resolve/create API, RequestScenario, ResponseScenario
  const resolvedSteps: Array<{
    stepOrder: number;
    name: string;
    description: string | null;
    enabled: boolean;
    delayMs: number;
    continueOnError: boolean;
    apiId: string;
    requestScenarioId: string | null;
    methodOverride: string | null;
    pathOverride: string | null;
    headersOverride: any;
    queryParamsOverride: any;
    pathParamsOverride: any;
    bodyOverride: any;
    bodyType?: string | null;
    extractors: any;
    assertions: any;
    targetEnvironmentType: string;
    targetEnvironment: string | null;
  }> = [];

  for (let i = 0; i < rawSteps.length; i++) {
    const step = rawSteps[i];
    const stepOrder = step.order || i + 1;
    const stepName = step.name || `Step ${stepOrder}`;

    const rawApi = step.api || {};
    const method = (rawApi.method || 'GET').toUpperCase();
    const path = rawApi.path || step.path || '';

    if (!path) {
      throw new Error(`Step ${stepOrder} must have an api.path specified.`);
    }

    const apiKey = `${method}::${path}`;
    let matchedApi = apiMap.get(apiKey);

    // If API does not exist, UPSERT API!
    if (!matchedApi) {
      // Check collection
      let collectionId: string | null = null;
      if (rawApi.collection) {
        const colNameLower = String(rawApi.collection).toLowerCase();
        let targetColId = collectionByName.get(colNameLower);
        if (!targetColId) {
          const newCol = await prisma.collection.create({
            data: {
              projectId,
              name: rawApi.collection,
              description: `Auto-generated collection for ${rawApi.collection}`,
              createdAt: now,
              updatedAt: now,
            },
          });
          targetColId = newCol.id;
          collectionByName.set(colNameLower, targetColId);
        }
        collectionId = targetColId;
      }

      // Create API
      const newApi = await prisma.api.create({
        data: {
          projectId,
          collectionId,
          name: rawApi.name || `${method} ${path}`,
          description: rawApi.description || null,
          path,
          methodRequest: method,
          status: true,
          createdAt: now,
          updatedAt: now,
        },
        include: {
          requestScenarios: true,
        },
      });

      apiMap.set(apiKey, newApi);
      matchedApi = newApi;
      apisCreated++;
    } else {
      apisExisting++;
    }

    // 4. Resolve or create RequestScenario & ResponseScenario
    let resolvedReqScenarioId: string | null = null;
    const reqTemplate = step.requestScenario || step.requestPayload;

    // 4.1 Link API to Environments (tblApiEnvironment)
    if (matchedApi && projectEnvs.length > 0) {
      const explicitEnvIds: string[] = Array.isArray(rawApi.environmentIds)
        ? rawApi.environmentIds
        : Array.isArray(rawApi.environments)
        ? rawApi.environments
        : [];

      const targetEnvIdentifier: string =
        rawApi.targetEnvironment ||
        rawApi.environmentName ||
        rawApi.service ||
        '';

      const environmentsToLink: typeof projectEnvs = [];

      if (explicitEnvIds.length > 0) {
        for (const envId of explicitEnvIds) {
          const cleanId = String(envId).toLowerCase().trim();
          const mappedDbEnv =
            templateEnvIdMap.get(cleanId) ||
            projectEnvs.find(
              (e) =>
                toEnvSlug(e.name) === cleanId ||
                e.name.toLowerCase() === cleanId
            );
          if (mappedDbEnv && !environmentsToLink.some((m) => m.id === mappedDbEnv.id)) {
            environmentsToLink.push(mappedDbEnv);
          }
        }
      } else if (targetEnvIdentifier) {
        const identifierLower = targetEnvIdentifier.toLowerCase().trim();
        for (const pe of projectEnvs) {
          const peSlug = toEnvSlug(pe.name);
          if (peSlug.includes(identifierLower) || pe.name.toLowerCase().includes(identifierLower)) {
            environmentsToLink.push(pe);
          }
        }
      }

      // Fallback heuristics if no explicit configuration matched
      if (environmentsToLink.length === 0) {
        const reqHeaders = (reqTemplate?.headers as Record<string, any>) || {};
        const hasApigee =
          Boolean(reqHeaders.apikey || reqHeaders.apiKey || reqHeaders['apikey']) ||
          (matchedApi.description?.toLowerCase().includes('gateway') ?? false) ||
          (rawApi.description?.toLowerCase().includes('gateway') ?? false) ||
          (rawApi.name?.toLowerCase().includes('gateway') ?? false);

        const isDirect =
          (matchedApi.name?.toLowerCase().includes('direct') ?? false) ||
          (matchedApi.description?.toLowerCase().includes('direct') ?? false) ||
          (rawApi.collection?.toLowerCase().includes('direct') ?? false);

        for (const pe of projectEnvs) {
          const envNameLower = pe.name.toLowerCase();
          if (hasApigee && envNameLower.includes('gateway')) {
            environmentsToLink.push(pe);
          } else if (isDirect && envNameLower.includes('direct')) {
            environmentsToLink.push(pe);
          }
        }
      }

      // If still nothing matched, link to first environment of each environmentType
      if (environmentsToLink.length === 0) {
        const seenTypes = new Set<string>();
        for (const pe of projectEnvs) {
          if (!seenTypes.has(pe.environmentType)) {
            seenTypes.add(pe.environmentType);
            environmentsToLink.push(pe);
          }
        }
      }

      // Upsert into tblApiEnvironment
      for (const envToLink of environmentsToLink) {
        await prisma.apiEnvironment.upsert({
          where: {
            tblApiEnvironment_index_1: {
              apiId: matchedApi.id,
              environmentId: envToLink.id,
            },
          },
          create: {
            apiId: matchedApi.id,
            environmentId: envToLink.id,
            enabled: true,
          },
          update: {
            enabled: true,
          },
        });
      }
    }

    if (reqTemplate && matchedApi) {
      const reqName = reqTemplate.name || `${stepName} Scenario`;
      const existingReq = matchedApi.requestScenarios.find(
        (r) => r.name.toLowerCase() === reqName.toLowerCase()
      );

      if (existingReq) {
        resolvedReqScenarioId = existingReq.id;
      } else {
        // Create Request Scenario
        const newReqScenario = await prisma.requestScenario.create({
          data: {
            apiId: matchedApi.id,
            name: reqName,
            description: reqTemplate.description || `Scenario for ${stepName}`,
            headers: (reqTemplate.headers as Prisma.InputJsonValue) ?? {},
            queryParams: (reqTemplate.queryParams as Prisma.InputJsonValue) ?? {},
            pathParams: (reqTemplate.pathParams as Prisma.InputJsonValue) ?? {},
            body: (reqTemplate.body as Prisma.InputJsonValue) ?? {},
            bodyType: reqTemplate.bodyType || 'JSON',
            matchType: 'EXACT',
            status: true,
            createdAt: now,
            updatedAt: now,
          },
        });

        resolvedReqScenarioId = newReqScenario.id;
        requestScenariosCreated++;

        // Add to cached api requestScenarios
        matchedApi.requestScenarios.push(newReqScenario as any);

        // If expectedResponseScenario is provided, create ResponseScenario
        const respTemplate = step.expectedResponseScenario || step.responsePayload;
        if (respTemplate) {
          await prisma.responseScenario.create({
            data: {
              requestScenarioId: newReqScenario.id,
              name: respTemplate.name || `${reqName} Response`,
              statusCode: respTemplate.statusCode || 200,
              headers: (respTemplate.headers as Prisma.InputJsonValue) ?? {},
              body: (respTemplate.body as Prisma.InputJsonValue) ?? {},
              responseType: 'JSON',
              status: true,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
      }
    }

    resolvedSteps.push({
      stepOrder,
      name: stepName,
      description: step.description || null,
      enabled: step.enabled !== false,
      delayMs: step.delayMs || 0,
      continueOnError: step.continueOnError || false,
      apiId: matchedApi.id,
      requestScenarioId: resolvedReqScenarioId,
      methodOverride: step.overrides?.method || null,
      pathOverride: step.overrides?.path || null,
      headersOverride: step.overrides?.headers || null,
      queryParamsOverride: step.overrides?.queryParams || null,
      pathParamsOverride: step.overrides?.pathParams || null,
      bodyOverride: step.overrides?.body || null,
      bodyType: step.overrides?.bodyType || (step as any).bodyType || null,
      extractors: step.extractors || [],
      assertions: step.assertions || [],
      targetEnvironmentType:
        step.targetEnvironmentType === 'LOCAL' || (step.api as any)?.targetEnvironmentType === 'LOCAL'
          ? 'LOCAL'
          : 'DEFAULT',
      targetEnvironment: (step as any).targetEnvironment || (step.api as any)?.targetEnvironment || null,
    });
  }

  // 5. Upsert ScenarioFlow
  const existingFlow = await prisma.scenarioFlow.findFirst({
    where: {
      projectId,
      name: flowData.name,
      deletedAt: null,
    },
  });

  let targetFlowId: string;

  if (existingFlow) {
    targetFlowId = existingFlow.id;
    // Update flow metadata
    await prisma.scenarioFlow.update({
      where: { id: targetFlowId },
      data: {
        description: flowData.description ?? existingFlow.description,
        stopOnFailure: flowData.stopOnFailure !== undefined ? flowData.stopOnFailure : existingFlow.stopOnFailure,
        defaultEnvironmentId: defaultEnvId || existingFlow.defaultEnvironmentId,
        variables: (flowData.variables as Prisma.InputJsonValue) ?? existingFlow.variables,
        updatedAt: now,
      },
    });

    // Delete existing steps to replace with newly imported steps
    await prisma.scenarioFlowStep.deleteMany({
      where: { flowId: targetFlowId },
    });
  } else {
    // Create new flow
    const newFlow = await prisma.scenarioFlow.create({
      data: {
        projectId,
        name: flowData.name,
        description: flowData.description || null,
        stopOnFailure: flowData.stopOnFailure !== false,
        defaultEnvironmentId: defaultEnvId,
        variables: (flowData.variables as Prisma.InputJsonValue) ?? {},
        createdAt: now,
        updatedAt: now,
      },
    });
    targetFlowId = newFlow.id;
  }

  // 6. Insert new steps into database
  for (const step of resolvedSteps) {
    await prisma.scenarioFlowStep.create({
      data: {
        flowId: targetFlowId,
        apiId: step.apiId,
        requestScenarioId: step.requestScenarioId,
        stepOrder: step.stepOrder,
        name: step.name,
        description: step.description,
        enabled: step.enabled,
        delayMs: step.delayMs,
        continueOnError: step.continueOnError,
        methodOverride: step.methodOverride,
        pathOverride: step.pathOverride,
        headersOverride: (step.headersOverride as Prisma.InputJsonValue) ?? null,
        queryParamsOverride: (step.queryParamsOverride as Prisma.InputJsonValue) ?? null,
        pathParamsOverride: (step.pathParamsOverride as Prisma.InputJsonValue) ?? null,
        bodyOverride: (step.bodyOverride as Prisma.InputJsonValue) ?? null,
        bodyType: step.bodyType || 'JSON',
        extractors: (step.extractors as Prisma.InputJsonValue) ?? [],
        assertions: (step.assertions as Prisma.InputJsonValue) ?? [],
        targetEnvironmentType: step.targetEnvironmentType || 'DEFAULT',
        targetEnvironment: step.targetEnvironment || null,
      },
    });
  }

  return {
    success: true,
    flowId: targetFlowId,
    flowName: flowData.name,
    apisCreated,
    apisExisting,
    requestScenariosCreated,
    stepsCount: resolvedSteps.length,
  };
}

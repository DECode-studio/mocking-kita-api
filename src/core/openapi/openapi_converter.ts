import { Project } from '@/src/client/domain/project/entity/project';
import { Collection } from '@/src/client/domain/collection/entity/collection';
import {
  Environment,
  normalizeEnvironmentValues,
  parseRawVariables,
  EnvironmentVariable,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { MethodRequest, MatchType, RequestBodyType, EnvironmentType } from '@/src/core/utils/types';
import { generateId } from '@/src/core/utils/uuid';

export interface OpenApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: Record<string, unknown>;
  example?: unknown;
}

export interface OpenApiResponse {
  description: string;
  headers?: Record<string, unknown>;
  content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>;
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: Record<string, unknown>; example?: unknown }>;
  };
  responses: Record<string, OpenApiResponse>;
}

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
}

export interface ExtractedProjectData {
  collections: Array<Omit<Collection, 'createdAt' | 'updatedAt'> & { id?: string }>;
  environments: Array<Omit<Environment, 'createdAt' | 'updatedAt'> & { id?: string }>;
  apis: Array<Omit<ApiCollection, 'createdAt' | 'updatedAt'> & { id?: string }>;
  requestScenarios: Array<Omit<RequestScenario, 'createdAt' | 'updatedAt'> & { id?: string }>;
  responseScenarios: Array<Omit<ResponseScenario, 'createdAt' | 'updatedAt'> & { id?: string }>;
}

function sanitizeImportedPath(path: string): string {
  const rawPath = path.trim();
  if (!rawPath) return '/';

  try {
    const parsedUrl = new URL(rawPath);
    return parsedUrl.pathname || '/';
  } catch {}

  const hostLikeEnvToken =
    '(?:base[_-]?url|baseurl|host|hostname|domain|server|origin|env(?:ironment)?[_-]?url|api[_-]?url)';
  const schemePrefix = '(?:[a-z][a-z0-9+.-]*:\\/\\/)?';
  const wrappedEnvToken = new RegExp(
    `^\\s*\\/?\\s*${schemePrefix}(?:<\\s*[^>]*${hostLikeEnvToken}[^>]*\\s*>|\\{\\{\\s*[^}]*${hostLikeEnvToken}[^}]*\\s*\\}\\}|\\$\\{\\s*[^}]*${hostLikeEnvToken}[^}]*\\s*\\})(?::\\d+)?\\s*`,
    'i'
  );
  const bareEnvToken = new RegExp(`^\\s*\\/?\\s*${schemePrefix}${hostLikeEnvToken}(?::\\d+)?(?=\\/|$)`, 'i');
  const hostWithOptionalPort = /^\s*\/?\s*(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?=\/|$)/i;

  const withoutHost = rawPath
    .replace(wrappedEnvToken, '')
    .replace(bareEnvToken, '')
    .replace(hostWithOptionalPort, '')
    .trim();

  const pathOnly = withoutHost.split(/[?#]/, 1)[0] || '/';
  return pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
}

/**
 * Converts Project entities into an OpenAPI 3.0.3 specification object.
 */
export function exportProjectToOpenApiSpec(
  project: Project,
  collections: Collection[],
  apis: ApiCollection[],
  requestScenarios: RequestScenario[],
  responseScenarios: ResponseScenario[],
  environments?: Environment[]
): OpenApiSpec {
  const collectionMap = new Map<string, Collection>();
  collections.forEach((c) => collectionMap.set(c.id, c));

  const scenariosByApiId = new Map<string, RequestScenario[]>();
  requestScenarios.forEach((rs) => {
    const list = scenariosByApiId.get(rs.apiId) || [];
    list.push(rs);
    scenariosByApiId.set(rs.apiId, list);
  });

  const responseScenariosByReqId = new Map<string, ResponseScenario[]>();
  responseScenarios.forEach((resp) => {
    const list = responseScenariosByReqId.get(resp.requestScenarioId) || [];
    list.push(resp);
    responseScenariosByReqId.set(resp.requestScenarioId, list);
  });

  const tags = collections.map((c) => ({
    name: c.name,
    description: c.description || undefined,
  }));

  const paths: Record<string, Record<string, OpenApiOperation>> = {};

  for (const api of apis) {
    if (!api.status || api.deletedAt) continue;

    const method = api.methodRequest.toLowerCase();
    const path = api.path || '/';

    if (!paths[path]) {
      paths[path] = {};
    }

    const apiCollection = api.collectionId ? collectionMap.get(api.collectionId) : null;
    const apiTags = apiCollection ? [apiCollection.name] : [];

    const reqScenarios = scenariosByApiId.get(api.id) || [];
    const activeReqScenarios = reqScenarios.filter((s) => s.status && !s.deletedAt);

    const parameters: OpenApiParameter[] = [];
    let requestBody: OpenApiOperation['requestBody'] = undefined;
    const responses: Record<string, OpenApiResponse> = {};

    // Build parameters and request body from request scenarios
    if (activeReqScenarios.length > 0) {
      const primaryReq = activeReqScenarios[0];

      // Query params
      if (primaryReq.queryParams && typeof primaryReq.queryParams === 'object') {
        Object.entries(primaryReq.queryParams).forEach(([key, val]) => {
          parameters.push({
            name: key,
            in: 'query',
            schema: { type: 'string' },
            example: val,
          });
        });
      }

      // Path params
      if (primaryReq.pathParams && typeof primaryReq.pathParams === 'object') {
        Object.entries(primaryReq.pathParams).forEach(([key, val]) => {
          parameters.push({
            name: key,
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: val,
          });
        });
      }

      // Headers
      if (primaryReq.headers && typeof primaryReq.headers === 'object') {
        Object.entries(primaryReq.headers).forEach(([key, val]) => {
          if (key.toLowerCase() !== 'content-type') {
            parameters.push({
              name: key,
              in: 'header',
              schema: { type: 'string' },
              example: val,
            });
          }
        });
      }

      // Body
      if (primaryReq.body && primaryReq.bodyType !== 'NONE') {
        requestBody = {
          content: {
            'application/json': {
              example: primaryReq.body,
            },
          },
        };
      }
    }

    // Build responses from response scenarios across request scenarios for this API
    for (const reqScenario of activeReqScenarios) {
      const respScenarios = responseScenariosByReqId.get(reqScenario.id) || [];
      const activeRespScenarios = respScenarios.filter((r) => r.status && !r.deletedAt);

      for (const resp of activeRespScenarios) {
        const codeStr = String(resp.statusCode || 200);
        if (!responses[codeStr]) {
          responses[codeStr] = {
            description: resp.name || resp.description || `Response ${codeStr}`,
            content: {
              'application/json': {
                example: resp.body,
              },
            },
          };
        }
      }
    }

    // Default response if none defined
    if (Object.keys(responses).length === 0) {
      responses['200'] = {
        description: 'Successful operation',
        content: {
          'application/json': {
            example: { message: 'Success' },
          },
        },
      };
    }

    paths[path][method] = {
      summary: api.name,
      description: api.description || undefined,
      tags: apiTags.length > 0 ? apiTags : undefined,
      parameters: parameters.length > 0 ? parameters : undefined,
      requestBody,
      responses,
    };
  }

  const servers: Array<{ url: string; description?: string }> = [];
  if (Array.isArray(environments)) {
    for (const env of environments) {
      if (env.isBaseUrl === false) continue;
      const values = normalizeEnvironmentValues(env.values, true);
      const stageOrder: EnvironmentType[] = ['DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION'];
      for (const stage of stageOrder) {
        const stageUrl = values[stage];
        if (stageUrl) {
          servers.push({
            url: stageUrl,
            description: `${env.name} (${stage})`,
          });
        }
      }
    }
  }

  return {
    openapi: '3.0.3',
    info: {
      title: project.name,
      description: project.description || 'API documentation exported from Mock API Studio',
      version: '1.0.0',
    },
    servers: servers.length > 0 ? servers : undefined,
    tags: tags.length > 0 ? tags : undefined,
    paths,
    ...(Array.isArray(environments) && environments.length > 0
      ? {
          'x-environments': environments.map((e) => ({
            name: e.name,
            isBaseUrl: e.isBaseUrl !== false,
            values: e.values || {},
            environmentType: e.environmentType,
            baseUrl: getEnvironmentBaseUrl(e),
            variables: parseRawVariables(e.variables),
            status: e.status !== false,
          })),
        }
      : {}),
  };
}

function resolveRef(refStr: string, rootSpec: unknown, visitedRefs: Set<string> = new Set()): unknown {
  if (!refStr || typeof refStr !== 'string' || !rootSpec || typeof rootSpec !== 'object') {
    return null;
  }
  if (visitedRefs.has(refStr)) {
    return null;
  }
  visitedRefs.add(refStr);

  const parts = refStr
    .replace(/^#\//, '')
    .split('/')
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));

  let curr: unknown = rootSpec;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in (curr as Record<string, unknown>)) {
      curr = (curr as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  if (curr && typeof curr === 'object' && typeof (curr as Record<string, unknown>).$ref === 'string') {
    return resolveRef((curr as Record<string, unknown>).$ref as string, rootSpec, visitedRefs);
  }
  return curr;
}

function resolveSchema(schema: unknown, rootSpec: unknown, visitedRefs: Set<string> = new Set()): unknown {
  if (!schema || typeof schema !== 'object') return schema;

  let current = schema as Record<string, unknown>;
  if (typeof current.$ref === 'string') {
    const deref = resolveRef(current.$ref, rootSpec, new Set(visitedRefs));
    if (deref && typeof deref === 'object') {
      const { $ref, ...rest } = current;
      current = { ...(deref as Record<string, unknown>), ...rest };
    }
  }

  if (Array.isArray(current.allOf) && current.allOf.length > 0) {
    let mergedProps: Record<string, unknown> = {};
    let mergedType = current.type;
    let mergedExample = current.example;

    for (const sub of current.allOf) {
      const resSub = resolveSchema(sub, rootSpec, visitedRefs);
      if (resSub && typeof resSub === 'object') {
        const resSubObj = resSub as Record<string, unknown>;
        if (resSubObj.properties && typeof resSubObj.properties === 'object') {
          mergedProps = { ...mergedProps, ...(resSubObj.properties as Record<string, unknown>) };
        }
        if (resSubObj.type && !mergedType) {
          mergedType = resSubObj.type;
        }
        if (resSubObj.example !== undefined && mergedExample === undefined) {
          mergedExample = resSubObj.example;
        }
      }
    }

    const { allOf, ...rest } = current;
    current = {
      ...rest,
      type: mergedType || (Object.keys(mergedProps).length > 0 ? 'object' : rest.type),
      properties: { ...mergedProps, ...((current.properties as Record<string, unknown>) || {}) },
      example: mergedExample,
    };
  }

  return current;
}

function generateSampleFromSchema(schema: unknown, rootSpec: unknown, visitedRefs: Set<string> = new Set()): unknown {
  const resolved = resolveSchema(schema, rootSpec, visitedRefs);
  if (!resolved || typeof resolved !== 'object') return resolved;
  const s = resolved as Record<string, unknown>;

  if (s.example !== undefined) return s.example;
  if (s.default !== undefined) return s.default;
  if (s['x-example'] !== undefined) return s['x-example'];

  if (Array.isArray(s.enum) && s.enum.length > 0) {
    return s.enum[0];
  }

  if (s.type === 'array' || (!s.type && s.items)) {
    if (s.items) {
      return [generateSampleFromSchema(s.items, rootSpec, visitedRefs)];
    }
    return [];
  }

  if (s.type === 'object' || s.properties || (!s.type && !s.items)) {
    if (s.properties && typeof s.properties === 'object') {
      const obj: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(s.properties as Record<string, unknown>)) {
        obj[propName] = generateSampleFromSchema(propSchema, rootSpec, visitedRefs);
      }
      return obj;
    }
    if (s.type === 'object' && !s.properties) {
      return {};
    }
  }

  if (s.type === 'string') {
    if (s.format === 'binary' || s.format === 'byte') return { filename: '(binary_file_data)' };
    if (s.format === 'date' || s.format === 'date-time') return '2026-09-02T00:00:00Z';
    if (s.format === 'email') return 'user@example.com';
    if (s.format === 'uri' || s.format === 'url') return 'https://example.com';
    return 'string';
  }
  if (s.type === 'integer' || s.type === 'number') {
    return 0;
  }
  if (s.type === 'boolean') {
    return true;
  }

  return {};
}

function extractParamExample(param: Record<string, unknown>, rawSpec: unknown): unknown {
  if (param.example !== undefined) return param.example;
  if (param.default !== undefined) return param.default;
  if (param.schema) {
    const sample = generateSampleFromSchema(param.schema, rawSpec);
    if (sample !== undefined && (typeof sample !== 'object' || (sample !== null && Object.keys(sample).length > 0))) {
      return sample;
    }
  }

  if (param.description && typeof param.description === 'string' && param.description.includes('=>')) {
    const hintPart = param.description.split('=>')[1]?.split(/[,;|\n]/)[0]?.trim();
    if (hintPart) {
      const cleanHint = hintPart.replace(/^["']|["']$/g, '').trim();
      if (cleanHint) return cleanHint;
    }
  }

  if (param.type === 'file') return { filename: '(binary_file_data)' };
  if (Array.isArray(param.enum) && param.enum.length > 0) return param.enum[0];

  if (param.type === 'string') return 'sample_text';
  if (param.type === 'integer' || param.type === 'number') return 0;
  if (param.type === 'boolean') return true;

  return 'sample';
}

/**
 * Parses an OpenAPI / Swagger JSON document and converts it into Mock API Studio entity objects scoped to target projectId.
 */
export function parseOpenApiSpecToProjectData(
  projectId: string,
  rawSpec: unknown,
  existingCollections: Collection[] = []
): ExtractedProjectData {
  const spec = rawSpec as Record<string, unknown>;
  const pathsObj = (spec.paths as Record<string, unknown>) || {};
  const collectionsMap = new Map<string, string>(); // collectionName -> collectionId

  existingCollections.forEach((c) => {
    collectionsMap.set(c.name.toLowerCase(), c.id);
  });

  const collectionsToCreate: Array<Omit<Collection, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const environmentsToCreate: Array<Omit<Environment, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const apisToCreate: Array<Omit<ApiCollection, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const requestScenariosToCreate: Array<Omit<RequestScenario, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const responseScenariosToCreate: Array<Omit<ResponseScenario, 'createdAt' | 'updatedAt'> & { id: string }> = [];

  function inferEnvType(text: string): EnvironmentType {
    const lower = text.toLowerCase();
    if (lower.includes('local') || lower.includes('127.0.0.1') || lower.includes('localhost')) return 'LOCAL';
    if (lower.includes('dev') || lower.includes('development')) return 'DEVELOPMENT';
    if (lower.includes('test') || lower.includes('testing')) return 'TESTING';
    if (lower.includes('stag') || lower.includes('staging')) return 'STAGING';
    if (lower.includes('prod') || lower.includes('production')) return 'PRODUCTION';
    return 'DEVELOPMENT';
  }

  // Parse OpenAPI servers / Swagger host -> Environments (Matrix Model)
  const explicitEnvs = (spec['x-environments'] || spec.environments) as Array<Record<string, unknown>> | undefined;

  // Extract any top-level custom variables (e.g. from extensions, securitySchemes, or parameters)
  const topLevelCustomVars: EnvironmentVariable[] = [];
  const rawTopVars = spec['x-variables'] || spec['x-environment-variables'] || spec.variables;
  if (rawTopVars) {
    topLevelCustomVars.push(...parseRawVariables(rawTopVars));
  }

  // Extract security schemes (OpenAPI 3 components.securitySchemes or Swagger 2 securityDefinitions)
  const components = (spec.components || {}) as Record<string, unknown>;
  const securitySchemes = (components.securitySchemes || spec.securityDefinitions || {}) as Record<string, unknown>;
  if (securitySchemes && typeof securitySchemes === 'object') {
    for (const [schemeKey, rawScheme] of Object.entries(securitySchemes as Record<string, Record<string, unknown>>)) {
      if (!rawScheme || typeof rawScheme !== 'object') continue;
      const type = String(rawScheme.type || '').toLowerCase();
      const scheme = String(rawScheme.scheme || '').toLowerCase();
      const inLocation = String(rawScheme.in || '').toLowerCase();
      const name = rawScheme.name ? String(rawScheme.name) : schemeKey;

      if (type === 'apikey') {
        const varKey = name || schemeKey;
        if (!topLevelCustomVars.some((v) => v.key.toLowerCase() === varKey.toLowerCase())) {
          topLevelCustomVars.push({
            id: generateId(),
            key: varKey,
            value: `sample_${varKey.toLowerCase()}_value`,
            type: 'secret',
            enabled: true,
            description: rawScheme.description ? String(rawScheme.description) : `API Key for ${schemeKey} (${inLocation})`,
          });
        }
      } else if (type === 'http' && scheme === 'bearer') {
        if (!topLevelCustomVars.some((v) => v.key.toLowerCase() === 'authorization' || v.key.toLowerCase() === 'token')) {
          topLevelCustomVars.push({
            id: generateId(),
            key: 'Authorization',
            value: 'Bearer sample_token_jwt',
            type: 'secret',
            enabled: true,
            description: rawScheme.description ? String(rawScheme.description) : `Bearer Token for ${schemeKey}`,
          });
        }
      } else if (type === 'http' && scheme === 'basic') {
        if (!topLevelCustomVars.some((v) => v.key.toLowerCase() === 'authorization')) {
          topLevelCustomVars.push({
            id: generateId(),
            key: 'Authorization',
            value: 'Basic sample_credentials',
            type: 'secret',
            enabled: true,
            description: rawScheme.description ? String(rawScheme.description) : `Basic Auth for ${schemeKey}`,
          });
        }
      } else if (type === 'oauth2' || type === 'openidconnect') {
        if (!topLevelCustomVars.some((v) => v.key.toLowerCase() === 'authorization' || v.key.toLowerCase() === 'token')) {
          topLevelCustomVars.push({
            id: generateId(),
            key: 'Authorization',
            value: 'Bearer sample_oauth2_token',
            type: 'secret',
            enabled: true,
            description: rawScheme.description ? String(rawScheme.description) : `OAuth2 Token for ${schemeKey}`,
          });
        }
      }
    }
  }

  // Extract common header parameters defined at root (OpenAPI 3 components.parameters or Swagger 2 parameters)
  const rootParams = (components.parameters || spec.parameters || {}) as Record<string, Record<string, unknown>>;
  if (rootParams && typeof rootParams === 'object') {
    for (const [, p] of Object.entries(rootParams as Record<string, Record<string, unknown>>)) {
      if (p && typeof p === 'object' && p.in === 'header' && p.name) {
        const hName = String(p.name);
        if (!topLevelCustomVars.some((v) => v.key.toLowerCase() === hName.toLowerCase())) {
          const lowerH = hName.toLowerCase();
          const isSecret =
            lowerH.includes('key') ||
            lowerH.includes('token') ||
            lowerH.includes('auth') ||
            lowerH.includes('secret') ||
            lowerH.includes('signature');
          topLevelCustomVars.push({
            id: generateId(),
            key: hName,
            value: String(p.example || p.default || `sample_${hName.toLowerCase()}`),
            type: isSecret ? 'secret' : 'plain',
            enabled: true,
            description: p.description ? String(p.description) : undefined,
          });
        }
      }
    }
  }

  if (Array.isArray(explicitEnvs) && explicitEnvs.length > 0) {
    for (let i = 0; i < explicitEnvs.length; i++) {
      const rawEnv = explicitEnvs[i];
      if (!rawEnv || typeof rawEnv !== 'object') continue;
      const envName = (typeof rawEnv.name === 'string' ? rawEnv.name : '') || `Environment ${i + 1}`;
      const isBaseUrl = rawEnv.isBaseUrl !== false;
      const cleanBaseUrl = rawEnv.baseUrl ? String(rawEnv.baseUrl).trim() : '';
      const values = normalizeEnvironmentValues(rawEnv.values as Record<string, unknown> | undefined, isBaseUrl);
      const parsedVars = parseRawVariables(rawEnv.variables);

      if (cleanBaseUrl && !parsedVars.some((v) => v.key.toLowerCase() === 'baseurl' || v.key.toLowerCase() === 'base_url')) {
        parsedVars.push({
          id: generateId(),
          key: 'baseUrl',
          value: cleanBaseUrl,
          type: 'plain',
          enabled: true,
        });
      }

      // Merge top level custom vars into the environment
      for (const tVar of topLevelCustomVars) {
        if (!parsedVars.some((v) => v.key === tVar.key)) {
          parsedVars.push({ ...tVar });
        }
      }

      environmentsToCreate.push({
        id: (typeof rawEnv.id === 'string' ? rawEnv.id : '') || generateId(),
        projectId,
        name: envName,
        isBaseUrl,
        values,
        environmentType: (rawEnv.environmentType as EnvironmentType) || 'DEVELOPMENT',
        variables: parsedVars,
        baseUrl: cleanBaseUrl || getEnvironmentBaseUrl({ values, isBaseUrl }),
        status: rawEnv.status !== false,
      });
    }
  } else if (Array.isArray(spec.servers) && spec.servers.length > 0) {
    const serversList = spec.servers as Array<Record<string, unknown>>;
    const infoObj = spec.info as Record<string, unknown> | undefined;
    const serviceName = (infoObj?.title ? String(infoObj.title).trim() : '') || 'API Service';
    const values: Partial<Record<EnvironmentType, string | null>> = {
      LOCAL: null,
      DEVELOPMENT: null,
      TESTING: null,
      STAGING: null,
      PRODUCTION: null,
    };

    let firstUrl = '';
    const serverCustomVars: EnvironmentVariable[] = [...topLevelCustomVars];

    for (let i = 0; i < serversList.length; i++) {
      const serverObj = serversList[i];
      if (serverObj && typeof serverObj.url === 'string' && serverObj.url.trim()) {
        const url = serverObj.url.trim();
        if (!firstUrl) firstUrl = url;
        const desc = serverObj.description ? String(serverObj.description).trim() : '';
        const envType = inferEnvType(`${desc} ${url}`);
        if (envType !== 'LOCAL') {
          values[envType] = url;
        }

        // OpenAPI 3 Server Variables support: servers[i].variables
        if (serverObj.variables && typeof serverObj.variables === 'object') {
          for (const [varKey, varData] of Object.entries(serverObj.variables as Record<string, { default?: unknown; enum?: unknown[]; description?: string }>)) {
            if (!serverCustomVars.some((v) => v.key === varKey)) {
              serverCustomVars.push({
                id: generateId(),
                key: varKey,
                value: varData?.default !== undefined ? String(varData.default) : (varData?.enum?.[0] !== undefined ? String(varData.enum[0]) : ''),
                type: 'plain',
                enabled: true,
                description: varData?.description ? String(varData.description) : undefined,
              });
            }
          }
        }
      }
    }

    if (firstUrl && !values.DEVELOPMENT && !values.STAGING && !values.PRODUCTION && !values.TESTING) {
      values.DEVELOPMENT = firstUrl;
    }

    const envVars: EnvironmentVariable[] = firstUrl
      ? [{ id: generateId(), key: 'baseUrl', value: firstUrl, type: 'plain', enabled: true }]
      : [];

    for (const scv of serverCustomVars) {
      if (!envVars.some((v) => v.key === scv.key)) {
        envVars.push(scv);
      }
    }

    const envId = generateId();
    environmentsToCreate.push({
      id: envId,
      projectId,
      name: serviceName,
      isBaseUrl: true,
      values,
      environmentType: 'DEVELOPMENT',
      variables: envVars,
      baseUrl: firstUrl,
      status: true,
    });
  } else if (spec.host && typeof spec.host === 'string' && spec.host.trim()) {
    const scheme = Array.isArray(spec.schemes) && spec.schemes.length > 0 ? spec.schemes[0] : 'https';
    const basePath = typeof spec.basePath === 'string' ? spec.basePath : '';
    const fullUrl = `${scheme}://${spec.host.trim()}${basePath}`;
    const envType = inferEnvType(fullUrl);
    const infoObj = spec.info as Record<string, unknown> | undefined;
    const serviceName = (infoObj?.title ? String(infoObj.title).trim() : '') || 'API Service';
    const envId = generateId();

    const values: Partial<Record<EnvironmentType, string | null>> = {
      LOCAL: null,
      DEVELOPMENT: null,
      TESTING: null,
      STAGING: null,
      PRODUCTION: null,
    };
    if (envType !== 'LOCAL') {
      values[envType] = fullUrl;
    } else {
      values.DEVELOPMENT = fullUrl;
    }

    const envVars: EnvironmentVariable[] = [
      { id: generateId(), key: 'baseUrl', value: fullUrl, type: 'plain', enabled: true },
      ...topLevelCustomVars.filter((v) => v.key !== 'baseUrl'),
    ];

    environmentsToCreate.push({
      id: envId,
      projectId,
      name: serviceName,
      isBaseUrl: true,
      values,
      environmentType: envType,
      variables: envVars,
      baseUrl: fullUrl,
      status: true,
    });
  } else if (topLevelCustomVars.length > 0) {
    const infoObj = spec.info as Record<string, unknown> | undefined;
    const serviceName = (infoObj?.title ? String(infoObj.title).trim() : '') || 'API Service';
    const envId = generateId();
    environmentsToCreate.push({
      id: envId,
      projectId,
      name: serviceName,
      isBaseUrl: false,
      values: {
        LOCAL: null,
        DEVELOPMENT: null,
        TESTING: null,
        STAGING: null,
        PRODUCTION: null,
      },
      environmentType: 'DEVELOPMENT',
      variables: [...topLevelCustomVars],
      baseUrl: '',
      status: true,
    });
  }

  // Parse OpenAPI tags -> collections
  if (Array.isArray(spec.tags)) {
    for (const tagObj of spec.tags as Array<Record<string, unknown>>) {
      if (tagObj && tagObj.name) {
        const tagName = String(tagObj.name).trim();
        const lowerName = tagName.toLowerCase();
        if (!collectionsMap.has(lowerName)) {
          const colId = generateId();
          collectionsMap.set(lowerName, colId);
          collectionsToCreate.push({
            id: colId,
            projectId,
            name: tagName,
            description: tagObj.description ? String(tagObj.description) : undefined,
            status: true,
          });
        }
      }
    }
  }

  const supportedMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

  // Parse paths
  for (const [pathStr, pathItem] of Object.entries(pathsObj)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    // Convert path template if needed (OpenAPI uses /users/{id} -> /users/:id)
    const normalizedPath = sanitizeImportedPath(pathStr).replace(/\{([^}]+)\}/g, ':$1');

    const pathItemObj = pathItem as Record<string, unknown>;

    for (const methodKey of Object.keys(pathItemObj)) {
      const lowerMethod = methodKey.toLowerCase();
      if (!supportedMethods.includes(lowerMethod)) continue;

      const operation = pathItemObj[methodKey] as Record<string, unknown> | undefined;
      if (!operation || typeof operation !== 'object') continue;

      const methodRequest = lowerMethod.toUpperCase() as MethodRequest;
      const apiName = (operation.summary as string) || (operation.operationId as string) || `${methodRequest} ${normalizedPath}`;
      const apiDescription = (operation.description as string) || undefined;

      // Tag handling -> Collection mapping
      let collectionId: string | null = null;
      if (Array.isArray(operation.tags) && operation.tags.length > 0) {
        const primaryTag = String(operation.tags[0]).trim();
        const lowerTag = primaryTag.toLowerCase();
        if (collectionsMap.has(lowerTag)) {
          collectionId = collectionsMap.get(lowerTag)!;
        } else {
          // Auto-create missing collection from operation tag
          const newColId = generateId();
          collectionsMap.set(lowerTag, newColId);
          collectionsToCreate.push({
            id: newColId,
            projectId,
            name: primaryTag,
            status: true,
          });
          collectionId = newColId;
        }
      }

      const apiId = generateId();
      apisToCreate.push({
        id: apiId,
        projectId,
        collectionId,
        name: apiName,
        description: apiDescription,
        path: normalizedPath,
        methodRequest,
        status: true,
      });

      // Extract parameters & requestBody
      const queryParams: Record<string, unknown> = {};
      const pathParams: Record<string, unknown> = {};
      const headers: Record<string, unknown> = {};
      const formDataBody: Record<string, unknown> = {};
      let requestBodyContent: unknown = {};
      let bodyType: RequestBodyType = 'NONE';

      const consumes = Array.isArray(operation.consumes) ? operation.consumes : [];
      const isUrlEncoded = consumes.some((c: unknown) => typeof c === 'string' && c.toLowerCase().includes('x-www-form-urlencoded'));

      const parametersList: Array<Record<string, unknown>> = [];
      const pathItemParams = pathItemObj.parameters;
      if (Array.isArray(pathItemParams)) {
        parametersList.push(...(pathItemParams as Array<Record<string, unknown>>));
      }
      if (Array.isArray(operation.parameters)) {
        parametersList.push(...(operation.parameters as Array<Record<string, unknown>>));
      }

      for (let param of parametersList) {
        if (!param) continue;
        if (typeof param === 'object' && typeof param.$ref === 'string') {
          const resolved = resolveRef(param.$ref, rawSpec);
          if (resolved && typeof resolved === 'object') param = resolved as Record<string, unknown>;
        }
        if (!param || !param.name) continue;
        const pName = String(param.name);
        const pIn = String(param.in || 'query').toLowerCase();
        let pExample = extractParamExample(param, rawSpec);

        if (typeof pExample === 'object' && pExample !== null && '$ref' in pExample) {
          pExample = generateSampleFromSchema(pExample, rawSpec);
        }

        if (pIn === 'query') {
          queryParams[pName] = pExample;
        } else if (pIn === 'path') {
          pathParams[pName] = pExample;
        } else if (pIn === 'header') {
          headers[pName] = pExample;
        } else if (pIn === 'body') {
          bodyType = 'JSON';
          requestBodyContent = pExample;
        } else if (pIn === 'formdata' || pIn === 'form') {
          bodyType = isUrlEncoded ? 'URL_ENCODED' : 'FORM_DATA';
          formDataBody[pName] = pExample;
        }
      }

      if (Object.keys(formDataBody).length > 0) {
        requestBodyContent = formDataBody;
        if (bodyType === 'NONE') {
          bodyType = isUrlEncoded ? 'URL_ENCODED' : 'FORM_DATA';
        }
      }

      const reqBodyObj = operation.requestBody && typeof operation.requestBody === 'object' ? (operation.requestBody as Record<string, unknown>) : null;
      if (reqBodyObj && reqBodyObj.content && typeof reqBodyObj.content === 'object') {
        const contentObj = reqBodyObj.content as Record<string, { example?: unknown; schema?: unknown }>;
        const jsonContent = contentObj['application/json'] || contentObj['*/*'];
        const multipartContent = contentObj['multipart/form-data'];
        const urlEncodedContent = contentObj['application/x-www-form-urlencoded'];

        if (multipartContent) {
          bodyType = 'FORM_DATA';
          requestBodyContent = multipartContent.example !== undefined
            ? multipartContent.example
            : multipartContent.schema
              ? generateSampleFromSchema(multipartContent.schema, rawSpec)
              : {};
        } else if (urlEncodedContent) {
          bodyType = 'URL_ENCODED';
          requestBodyContent = urlEncodedContent.example !== undefined
            ? urlEncodedContent.example
            : urlEncodedContent.schema
              ? generateSampleFromSchema(urlEncodedContent.schema, rawSpec)
              : {};
        } else if (jsonContent) {
          bodyType = 'JSON';
          requestBodyContent = jsonContent.example !== undefined
            ? jsonContent.example
            : jsonContent.schema
              ? generateSampleFromSchema(jsonContent.schema, rawSpec)
              : {};
        }
      }

      if (typeof requestBodyContent === 'string') {
        try {
          requestBodyContent = JSON.parse(requestBodyContent);
        } catch {}
      }

      const reqScenarioId = generateId();
      requestScenariosToCreate.push({
        id: reqScenarioId,
        apiId,
        name: 'Default Request Scenario',
        description: 'Auto-generated from OpenAPI spec',
        headers,
        queryParams,
        pathParams,
        body: requestBodyContent,
        bodyType,
        matchType: 'PARTIAL' as MatchType,
        priority: 0,
        status: true,
      });

      // Extract responses
      const responsesObj = operation.responses || {};
      const responseEntries = Object.entries(responsesObj);

      if (responseEntries.length === 0) {
        responseScenariosToCreate.push({
          id: generateId(),
          requestScenarioId: reqScenarioId,
          name: '200 OK',
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: { message: 'Success' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 0,
          status: true,
        });
      } else {
        for (const [codeKey, respVal] of responseEntries) {
          const statusCode = parseInt(codeKey, 10) || 200;
          const respObj = (respVal && typeof respVal === 'object' ? (respVal as Record<string, unknown>) : {});
          const respName = (typeof respObj.description === 'string' ? respObj.description : '') || `${statusCode} Response`;

          let respBody: unknown = { message: respName };
          const content = respObj.content as Record<string, { example?: unknown; examples?: Record<string, { value?: unknown }>; schema?: unknown }> | undefined;
          if (content && (content['application/json'] || content['*/*'])) {
            const jsonResp = content['application/json'] || content['*/*'];
            if (jsonResp.example !== undefined) {
              respBody = jsonResp.example;
            } else if (jsonResp.examples && typeof jsonResp.examples === 'object') {
              const firstKey = Object.keys(jsonResp.examples)[0];
              const exObj = jsonResp.examples[firstKey];
              respBody = exObj?.value !== undefined ? exObj.value : exObj;
            } else if (jsonResp.schema) {
              respBody = generateSampleFromSchema(jsonResp.schema, rawSpec);
            }
          } else if (respObj.schema) {
            const schemaObj = respObj as { schema?: unknown; example?: unknown; examples?: Record<string, unknown> };
            if (schemaObj.example !== undefined) {
              respBody = schemaObj.example;
            } else if (schemaObj.examples && schemaObj.examples['application/json']) {
              respBody = schemaObj.examples['application/json'];
            } else {
              respBody = generateSampleFromSchema(schemaObj.schema, rawSpec);
            }
          }

          if (typeof respBody === 'string') {
            try {
              respBody = JSON.parse(respBody);
            } catch {}
          } else if (typeof respBody === 'object' && respBody !== null && '$ref' in respBody) {
            respBody = generateSampleFromSchema(respBody, rawSpec);
          }

          responseScenariosToCreate.push({
            id: generateId(),
            requestScenarioId: reqScenarioId,
            name: respName,
            statusCode,
            headers: { 'content-type': 'application/json' },
            body: respBody,
            responseType: 'JSON',
            delayMs: 0,
            weight: 100,
            priority: statusCode >= 200 && statusCode < 300 ? 100 : 0,
            status: statusCode >= 200 && statusCode < 300,
          });
        }
      }
    }
  }

  return {
    collections: collectionsToCreate,
    environments: environmentsToCreate,
    apis: apisToCreate,
    requestScenarios: requestScenariosToCreate,
    responseScenarios: responseScenariosToCreate,
  };
}


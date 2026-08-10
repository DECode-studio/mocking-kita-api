import { Project } from '@/src/domain/project/entity/project';
import { Collection } from '@/src/domain/collection/entity/collection';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { MethodRequest, MatchType, RequestBodyType } from '@/src/core/utils/types';
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
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
}

export interface ExtractedProjectData {
  collections: Array<Omit<Collection, 'createdAt' | 'updatedAt'> & { id?: string }>;
  apis: Array<Omit<ApiCollection, 'createdAt' | 'updatedAt'> & { id?: string }>;
  requestScenarios: Array<Omit<RequestScenario, 'createdAt' | 'updatedAt'> & { id?: string }>;
  responseScenarios: Array<Omit<ResponseScenario, 'createdAt' | 'updatedAt'> & { id?: string }>;
}

/**
 * Converts Project entities into an OpenAPI 3.0.3 specification object.
 */
export function exportProjectToOpenApiSpec(
  project: Project,
  collections: Collection[],
  apis: ApiCollection[],
  requestScenarios: RequestScenario[],
  responseScenarios: ResponseScenario[]
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

  return {
    openapi: '3.0.3',
    info: {
      title: project.name,
      description: project.description || 'API documentation exported from Mock API Studio',
      version: '1.0.0',
    },
    tags: tags.length > 0 ? tags : undefined,
    paths,
  };
}

/**
 * Parses an OpenAPI / Swagger JSON document and converts it into Mock API Studio entity objects scoped to target projectId.
 */
export function parseOpenApiSpecToProjectData(
  projectId: string,
  rawSpec: any,
  existingCollections: Collection[] = []
): ExtractedProjectData {
  if (!rawSpec || typeof rawSpec !== 'object') {
    throw new Error('Invalid OpenAPI JSON format: root must be an object.');
  }

  const pathsObj = rawSpec.paths || {};
  const collectionsMap = new Map<string, string>(); // collectionName -> collectionId

  existingCollections.forEach((c) => {
    collectionsMap.set(c.name.toLowerCase(), c.id);
  });

  const collectionsToCreate: Array<Omit<Collection, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const apisToCreate: Array<Omit<ApiCollection, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const requestScenariosToCreate: Array<Omit<RequestScenario, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const responseScenariosToCreate: Array<Omit<ResponseScenario, 'createdAt' | 'updatedAt'> & { id: string }> = [];

  // Parse OpenAPI tags -> collections
  if (Array.isArray(rawSpec.tags)) {
    for (const tagObj of rawSpec.tags) {
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

    // Convert path template if needed (OpenAPI uses /users/{id})
    const normalizedPath = pathStr.trim();

    for (const methodKey of Object.keys(pathItem)) {
      const lowerMethod = methodKey.toLowerCase();
      if (!supportedMethods.includes(lowerMethod)) continue;

      const operation = (pathItem as any)[methodKey];
      if (!operation || typeof operation !== 'object') continue;

      const methodRequest = lowerMethod.toUpperCase() as MethodRequest;
      const apiName = operation.summary || operation.operationId || `${methodRequest} ${normalizedPath}`;
      const apiDescription = operation.description || undefined;

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

      const parametersList = Array.isArray(operation.parameters) ? operation.parameters : [];
      for (const param of parametersList) {
        if (!param || !param.name) continue;
        const pName = String(param.name);
        const pIn = String(param.in || 'query').toLowerCase();
        const pExample = param.example !== undefined ? param.example : param.schema?.default || 'sample';

        if (pIn === 'query') {
          queryParams[pName] = pExample;
        } else if (pIn === 'path') {
          pathParams[pName] = pExample;
        } else if (pIn === 'header') {
          headers[pName] = pExample;
        }
      }

      let requestBodyContent: unknown = {};
      let bodyType: RequestBodyType = 'NONE';

      if (operation.requestBody && operation.requestBody.content) {
        bodyType = 'JSON';
        const jsonContent = operation.requestBody.content['application/json'] || operation.requestBody.content['*/*'];
        if (jsonContent) {
          requestBodyContent = jsonContent.example !== undefined ? jsonContent.example : jsonContent.schema || {};
        }
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
        matchType: 'EXACT' as MatchType,
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
          const respObj = (respVal as any) || {};
          const respName = respObj.description || `${statusCode} Response`;

          let respBody: unknown = { message: respName };
          if (respObj.content && respObj.content['application/json']) {
            const jsonResp = respObj.content['application/json'];
            respBody = jsonResp.example !== undefined ? jsonResp.example : jsonResp.schema || respBody;
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
            priority: 0,
            status: true,
          });
        }
      }
    }
  }

  return {
    collections: collectionsToCreate,
    apis: apisToCreate,
    requestScenarios: requestScenariosToCreate,
    responseScenarios: responseScenariosToCreate,
  };
}

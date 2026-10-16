/**
 * OpenAPI / Swagger to Mocking Kita Mock API Generator
 * Parses Swagger 2.0 and OpenAPI 3.x specifications (JSON/YAML)
 * into clean Mock APIs, Request Scenarios, and Matrix Environments.
 */

import YAML from 'yaml';

export interface OpenApiEndpointSummary {
  method: string;
  path: string;
  summary: string;
  collection: string;
  parameters: Array<{
    name: string;
    in: 'query' | 'header' | 'path' | 'body';
    required: boolean;
    type?: string;
  }>;
  responses: Array<{
    statusCode: number;
    description: string;
    sampleBody: unknown;
  }>;
}

export interface OpenApiConvertResult {
  success: boolean;
  title?: string;
  version?: string;
  servers?: string[];
  endpoints?: OpenApiEndpointSummary[];
  totalEndpoints?: number;
  collections?: string[];
  error?: string;
}

export function convertOpenApiToMockStudio(rawContent: string): OpenApiConvertResult {
  let doc: unknown = null;

  try {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      doc = JSON.parse(trimmed);
    } else {
      doc = YAML.parse(trimmed);
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Gagal membaca format OpenAPI/Swagger (bukan JSON/YAML yang valid): ${errMsg}`,
    };
  }

  if (!doc || typeof doc !== 'object') {
    return { success: false, error: 'Konten dokumen OpenAPI kosong atau tidak valid.' };
  }

  const docObj = doc as Record<string, unknown>;
  const isSwagger2 = docObj.swagger === '2.0';
  const isOpenApi3 = typeof docObj.openapi === 'string' && docObj.openapi.startsWith('3.');

  if (!isSwagger2 && !isOpenApi3 && !docObj.paths) {
    return {
      success: false,
      error: 'Dokumen bukan OpenAPI 3.x atau Swagger 2.0 yang valid (field "paths" tidak ditemukan).',
    };
  }

  const infoObj = docObj.info && typeof docObj.info === 'object' ? (docObj.info as Record<string, unknown>) : null;
  const title = (infoObj?.title as string) || 'OpenAPI Import';
  const version = (infoObj?.version as string) || '1.0.0';

  // Extract Servers / Base URLs
  const servers: string[] = [];
  if (Array.isArray(docObj.servers)) {
    for (const s of docObj.servers as Array<Record<string, unknown>>) {
      if (typeof s.url === 'string') servers.push(s.url);
    }
  } else if (typeof docObj.host === 'string') {
    const schemes = Array.isArray(docObj.schemes) ? (docObj.schemes as string[]) : [];
    const scheme = schemes[0] || 'https';
    const basePath = typeof docObj.basePath === 'string' ? docObj.basePath : '';
    servers.push(`${scheme}://${docObj.host}${basePath}`);
  }

  // Extract Paths & Methods
  const endpoints: OpenApiEndpointSummary[] = [];
  const collectionsSet = new Set<string>();
  const paths = docObj.paths && typeof docObj.paths === 'object' ? (docObj.paths as Record<string, unknown>) : {};

  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    const pathItemObj = pathItem as Record<string, unknown>;

    for (const method of httpMethods) {
      const op = pathItemObj[method] as Record<string, unknown> | undefined;
      if (!op || typeof op !== 'object') continue;

      const tags = Array.isArray(op.tags) ? (op.tags as string[]) : [];
      const tag = tags[0] || 'Default';
      collectionsSet.add(tag);

      // Extract Parameters
      const parameters: OpenApiEndpointSummary['parameters'] = [];
      const pathParams = Array.isArray(pathItemObj.parameters) ? (pathItemObj.parameters as Array<Record<string, unknown>>) : [];
      const opParams = Array.isArray(op.parameters) ? (op.parameters as Array<Record<string, unknown>>) : [];
      const rawParams = [...pathParams, ...opParams];

      for (const p of rawParams) {
        if (p && p.name && p.in) {
          const schemaObj = p.schema && typeof p.schema === 'object' ? (p.schema as Record<string, unknown>) : null;
          parameters.push({
            name: String(p.name),
            in: p.in as 'query' | 'header' | 'path' | 'body',
            required: Boolean(p.required),
            type: (schemaObj?.type as string) || (p.type as string) || 'string',
          });
        }
      }

      // Extract Responses & Sample Payloads
      const responses: OpenApiEndpointSummary['responses'] = [];
      const rawResponses = op.responses && typeof op.responses === 'object' ? (op.responses as Record<string, unknown>) : {};

      for (const [codeStr, resDef] of Object.entries(rawResponses)) {
        const codeNum = parseInt(codeStr, 10) || 200;
        const resObj = resDef && typeof resDef === 'object' ? (resDef as Record<string, unknown>) : {};
        const description = (resObj.description as string) || 'Response';

        let sampleBody: unknown = {
          code: codeNum < 400 ? 'SUCCESS' : 'ERROR',
          message: description,
        };

        // Try extracting schema in OpenAPI 3 or Swagger 2
        const content = resObj.content && typeof resObj.content === 'object' ? (resObj.content as Record<string, Record<string, unknown>>) : null;
        const schema =
          content?.['application/json']?.schema ||
          content?.['*/*']?.schema ||
          resObj.schema;

        if (schema) {
          sampleBody = generateSampleFromSchema(schema, doc);
        }

        responses.push({
          statusCode: codeNum,
          description,
          sampleBody,
        });
      }

      if (responses.length === 0) {
        responses.push({
          statusCode: 200,
          description: 'OK',
          sampleBody: { code: 'OK', data: {} },
        });
      }

      endpoints.push({
        method: method.toUpperCase(),
        path: pathKey,
        summary:
          (typeof op.summary === 'string' ? op.summary : '') ||
          (typeof op.description === 'string' ? op.description : '') ||
          `${method.toUpperCase()} ${pathKey}`,
        collection: tag,
        parameters,
        responses,
      });
    }
  }

  return {
    success: true,
    title,
    version,
    servers,
    endpoints,
    totalEndpoints: endpoints.length,
    collections: Array.from(collectionsSet),
  };
}

/**
 * Generates sample mock JSON payload from OpenAPI JSON Schema
 */
function generateSampleFromSchema(schema: unknown, rootDoc: unknown, depth = 0): unknown {
  if (depth > 5 || !schema || typeof schema !== 'object') return {};
  const schemaObj = schema as Record<string, unknown>;

  // Resolve $ref if exists
  if (typeof schemaObj.$ref === 'string') {
    const resolved = resolveRef(schemaObj.$ref, rootDoc);
    if (resolved) return generateSampleFromSchema(resolved, rootDoc, depth + 1);
    return {};
  }

  if (schemaObj.example !== undefined) return schemaObj.example;
  if (schemaObj.default !== undefined) return schemaObj.default;

  const type = schemaObj.type;

  if (type === 'object' || (schemaObj.properties && typeof schemaObj.properties === 'object')) {
    const obj: Record<string, unknown> = {};
    const props = (schemaObj.properties as Record<string, unknown>) || {};
    for (const [propKey, propSchema] of Object.entries(props)) {
      obj[propKey] = generateSampleFromSchema(propSchema, rootDoc, depth + 1);
    }
    return obj;
  }

  if (type === 'array' || schemaObj.items) {
    const itemSample = generateSampleFromSchema(schemaObj.items || {}, rootDoc, depth + 1);
    return [itemSample];
  }

  if (type === 'integer' || type === 'number') {
    return 100;
  }

  if (type === 'boolean') {
    return true;
  }

  if (type === 'string') {
    if (schemaObj.format === 'date-time') return new Date().toISOString();
    if (schemaObj.format === 'uuid') return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    if (schemaObj.format === 'email') return 'user@example.com';
    if (Array.isArray(schemaObj.enum) && schemaObj.enum.length > 0) return schemaObj.enum[0];
    return 'sample string';
  }

  return {};
}

function resolveRef(ref: string, rootDoc: unknown): unknown {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.substring(2).split('/');
  let curr: unknown = rootDoc;
  for (const p of parts) {
    if (!curr || typeof curr !== 'object') return null;
    curr = (curr as Record<string, unknown>)[p];
  }
  return curr;
}

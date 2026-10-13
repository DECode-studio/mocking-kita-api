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
    sampleBody: any;
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
  let doc: any = null;

  try {
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      doc = JSON.parse(trimmed);
    } else {
      doc = YAML.parse(trimmed);
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal membaca format OpenAPI/Swagger (bukan JSON/YAML yang valid): ${err.message}`,
    };
  }

  if (!doc || typeof doc !== 'object') {
    return { success: false, error: 'Konten dokumen OpenAPI kosong atau tidak valid.' };
  }

  const isSwagger2 = doc.swagger === '2.0';
  const isOpenApi3 = typeof doc.openapi === 'string' && doc.openapi.startsWith('3.');

  if (!isSwagger2 && !isOpenApi3 && !doc.paths) {
    return {
      success: false,
      error: 'Dokumen bukan OpenAPI 3.x atau Swagger 2.0 yang valid (field "paths" tidak ditemukan).',
    };
  }

  const title = doc.info?.title || 'OpenAPI Import';
  const version = doc.info?.version || '1.0.0';

  // Extract Servers / Base URLs
  const servers: string[] = [];
  if (Array.isArray(doc.servers)) {
    for (const s of doc.servers) {
      if (s.url) servers.push(s.url);
    }
  } else if (doc.host) {
    const scheme = doc.schemes?.[0] || 'https';
    const basePath = doc.basePath || '';
    servers.push(`${scheme}://${doc.host}${basePath}`);
  }

  // Extract Paths & Methods
  const endpoints: OpenApiEndpointSummary[] = [];
  const collectionsSet = new Set<string>();
  const paths = doc.paths || {};

  const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of httpMethods) {
      const op = (pathItem as any)[method];
      if (!op || typeof op !== 'object') continue;

      const tag = op.tags?.[0] || 'Default';
      collectionsSet.add(tag);

      // Extract Parameters
      const parameters: OpenApiEndpointSummary['parameters'] = [];
      const rawParams = [...((pathItem as any).parameters || []), ...(op.parameters || [])];

      for (const p of rawParams) {
        if (p && p.name && p.in) {
          parameters.push({
            name: p.name,
            in: p.in,
            required: Boolean(p.required),
            type: p.schema?.type || p.type || 'string',
          });
        }
      }

      // Extract Responses & Sample Payloads
      const responses: OpenApiEndpointSummary['responses'] = [];
      const rawResponses = op.responses || {};

      for (const [codeStr, resDef] of Object.entries(rawResponses)) {
        const codeNum = parseInt(codeStr, 10) || 200;
        const resObj = (resDef as any) || {};
        const description = resObj.description || 'Response';

        let sampleBody: any = {
          code: codeNum < 400 ? 'SUCCESS' : 'ERROR',
          message: description,
        };

        // Try extracting schema in OpenAPI 3 or Swagger 2
        const schema =
          resObj.content?.['application/json']?.schema ||
          resObj.content?.['*/*']?.schema ||
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
        summary: op.summary || op.description || `${method.toUpperCase()} ${pathKey}`,
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
function generateSampleFromSchema(schema: any, rootDoc: any, depth = 0): any {
  if (depth > 5 || !schema) return {};

  // Resolve $ref if exists
  if (schema.$ref && typeof schema.$ref === 'string') {
    const resolved = resolveRef(schema.$ref, rootDoc);
    if (resolved) return generateSampleFromSchema(resolved, rootDoc, depth + 1);
    return {};
  }

  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  const type = schema.type;

  if (type === 'object' || schema.properties) {
    const obj: Record<string, any> = {};
    const props = schema.properties || {};
    for (const [propKey, propSchema] of Object.entries(props)) {
      obj[propKey] = generateSampleFromSchema(propSchema, rootDoc, depth + 1);
    }
    return obj;
  }

  if (type === 'array' || schema.items) {
    const itemSample = generateSampleFromSchema(schema.items || {}, rootDoc, depth + 1);
    return [itemSample];
  }

  if (type === 'integer' || type === 'number') {
    return 100;
  }

  if (type === 'boolean') {
    return true;
  }

  if (type === 'string') {
    if (schema.format === 'date-time') return new Date().toISOString();
    if (schema.format === 'uuid') return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    if (schema.format === 'email') return 'user@example.com';
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];
    return 'sample string';
  }

  return {};
}

function resolveRef(ref: string, rootDoc: any): any {
  if (!ref.startsWith('#/')) return null;
  const parts = ref.substring(2).split('/');
  let curr = rootDoc;
  for (const p of parts) {
    if (!curr || typeof curr !== 'object') return null;
    curr = curr[p];
  }
  return curr;
}

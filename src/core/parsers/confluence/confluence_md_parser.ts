import { Collection } from '@/src/client/domain/collection/entity/collection';
import {
  Environment,
  EnvironmentVariable,
} from '@/src/client/domain/environment/entity/environment';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { MethodRequest, EnvironmentType } from '@/src/core/utils/types';
import { generateId } from '@/src/core/utils/uuid';
import { ExtractedProjectData } from '@/src/core/openapi/openapi_converter';

interface ResponseStatusDef {
  httpCode: number;
  message: string;
  customCode: string;
}

interface ParsedEndpointSection {
  name: string;
  description?: string;
  method: MethodRequest;
  path: string;
  headers: Record<string, string>;
  requestBody?: unknown;
  statusDefinitions: ResponseStatusDef[];
  responseBodies: unknown[];
}

function unescapeConfluenceMarkdown(text: string): string {
  return text
    .replace(/\\([_*\-[\]()])/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/\r\n/g, '\n');
}

function cleanUrl(urlStr: string): string {
  return urlStr.replace(/[<>]/g, '').trim();
}

function extractCollectionNameFromPath(path: string): string {
  const cleanPath = path.split('?')[0].split('#')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments.length === 0) return 'General';

  // If path has more than 1 segment, take the segment before the last action segment.
  // e.g. /v1/kpm-wg/submission/change-asset-modal -> 'submission'
  // /v1/kpm-wg/kreditmu/detail-perks -> 'kreditmu'
  let targetSegment = segments.length > 1 ? segments[segments.length - 2] : segments[0];

  // If targetSegment looks like a version (e.g. v1, v2) and we have more segments, adjust
  if (/^v\d+(\.\d+)?$/i.test(targetSegment) && segments.length > 2) {
    targetSegment = segments[segments.length - 1];
  }

  // Capitalize or title-case target segment
  return targetSegment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'General';
}

function parseHeadersTable(headersBlock: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const lines = headersBlock.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---')) continue;
    const parts = trimmed.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      const key = parts[0].replace(/\*\*/g, '').trim();
      const val = parts[1].replace(/\*\*/g, '').trim();
      if (key && key.toLowerCase() !== 'parameter' && key.toLowerCase() !== 'header') {
        headers[key] = val;
      }
    }
  }

  return headers;
}

function parseResponseCodeTable(tableBlock: string): ResponseStatusDef[] {
  const statusDefs: ResponseStatusDef[] = [];
  const lines = tableBlock.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---')) continue;
    const parts = trimmed.split('|').map((p) => p.trim()).filter((p) => p.length > 0);
    if (parts.length >= 2) {
      const httpCodeRaw = parts[0].replace(/\*\*/g, '').trim();
      const message = parts[1].replace(/\*\*/g, '').trim();
      const customCode = parts[2] ? parts[2].replace(/\*\*/g, '').trim() : '';

      if (httpCodeRaw.toLowerCase().includes('http code')) continue;

      const codeMatch = httpCodeRaw.match(/\d{3}/);
      const httpCode = codeMatch ? parseInt(codeMatch[0], 10) : 200;

      statusDefs.push({
        httpCode,
        message,
        customCode,
      });
    }
  }

  return statusDefs;
}

function extractJsonCodeBlocks(text: string): unknown[] {
  const blocks: unknown[] = [];
  const jsonRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/gi;
  let match;

  while ((match = jsonRegex.exec(text)) !== null) {
    const content = match[1].trim();
    if (!content) continue;
    try {
      const parsed = JSON.parse(content);
      blocks.push(parsed);
    } catch {
      // not a valid JSON block, ignore
    }
  }

  return blocks;
}

function parseEnvironmentsFromDoc(docText: string): Array<{ name: string; baseUrl: string; environmentType: EnvironmentType }> {
  const envs: Array<{ name: string; baseUrl: string; environmentType: EnvironmentType }> = [];
  const envTableRegex = /###\s*\*{0,2}Environment\*{0,2}\s*\n([\s\S]*?)(?=\n###|\n##|$)/i;
  const match = envTableRegex.exec(docText);

  if (!match) return envs;

  const tableText = match[1];
  const lines = tableText.split('\n').filter((l) => l.trim().startsWith('|') && !l.includes('---'));

  if (lines.length >= 2) {
    const headerCols = lines[0].split('|').map((c) => c.replace(/\*\*/g, '').trim()).filter(Boolean);
    const valueCols = lines[1].split('|').map((c) => cleanUrl(c.replace(/\*\*/g, '').trim())).filter(Boolean);

    for (let i = 0; i < headerCols.length; i++) {
      const name = headerCols[i];
      const url = valueCols[i];
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        let envType: EnvironmentType = 'DEVELOPMENT';
        const lowerName = name.toLowerCase();
        if (lowerName.includes('dev')) envType = 'DEVELOPMENT';
        else if (lowerName.includes('test')) envType = 'TESTING';
        else if (lowerName.includes('stag')) envType = 'STAGING';
        else if (lowerName.includes('prod')) envType = 'PRODUCTION';
        else if (lowerName.includes('local')) envType = 'LOCAL';

        envs.push({
          name,
          baseUrl: url,
          environmentType: envType,
        });
      }
    }
  }

  return envs;
}

function parseSingleConfluenceDocument(docText: string): ParsedEndpointSection[] {
  const text = unescapeConfluenceMarkdown(docText);
  const endpoints: ParsedEndpointSection[] = [];

  // Look for endpoint method & path declaration: e.g. POST **/v1/kpm-wg/submission/change-asset-modal**
  // or `POST /v1/...`
  const methodPathRegex = /(?:^|\n)\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\*{0,2}([^\s\*]+)\*{0,2}/gi;
  const matches: Array<{ method: MethodRequest; path: string; index: number; fullMatch: string }> = [];

  let match;
  while ((match = methodPathRegex.exec(text)) !== null) {
    matches.push({
      method: match[1].toUpperCase() as MethodRequest,
      path: match[2].trim(),
      index: match.index,
      fullMatch: match[0],
    });
  }

  if (matches.length === 0) {
    return endpoints;
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const sectionText = text.substring(current.index, nextIndex);
    const beforeText = text.substring(0, current.index);

    // Find heading before this endpoint: e.g. ## Change Asset Modal
    const beforeHeadings = beforeText.split('\n').filter((l) => l.trim().startsWith('## '));
    const lastHeading = beforeHeadings.length > 0 ? beforeHeadings[beforeHeadings.length - 1].replace(/^##\s+/, '').trim() : '';

    // Find main title if available: # SPEC-WG-API - Change Asset Modal
    const docTitleLine = text.split('\n').find((l) => l.trim().startsWith('# '));
    const docTitle = docTitleLine ? docTitleLine.replace(/^#\s+/, '').replace(/^SPEC(?:-WG)?-API\s*-\s*/i, '').trim() : '';

    const name = lastHeading || docTitle || `${current.method} ${current.path}`;

    // Find description: "Description: <Text>"
    const descMatch = sectionText.match(/Description:\s*([^\n]+)/i) || beforeText.match(/Description:\s*([^\n]+)/i);
    const description = descMatch ? descMatch[1].trim() : undefined;

    // Headers
    let headers: Record<string, string> = {};
    const headersMatch = sectionText.match(/###\s*Headers([\s\S]*?)(?=\n###|\n##|$)/i);
    if (headersMatch) {
      headers = parseHeadersTable(headersMatch[1]);
    }

    // Request payload JSON
    let requestBody: unknown = undefined;
    const payloadMatch = sectionText.match(/###\s*Payload[^\n]*([\s\S]*?)(?=\n###\s*Response|\n##|$)/i);
    if (payloadMatch) {
      const blocks = extractJsonCodeBlocks(payloadMatch[1]);
      if (blocks.length > 0) {
        requestBody = blocks[0];
      }
    }

    // Response Code Table
    let statusDefinitions: ResponseStatusDef[] = [];
    const responseCodeMatch = sectionText.match(/###\s*Response\s*Code([\s\S]*?)(?=\n###\s*Response\b|\n##|$)/i);
    if (responseCodeMatch) {
      statusDefinitions = parseResponseCodeTable(responseCodeMatch[1]);
    }

    // Response JSON Blocks
    let responseBodies: unknown[] = [];
    const responseMatch = sectionText.match(/###\s*Response\b([\s\S]*?)(?=\n##\s+[A-Za-z]|\n#\s+|$)/i);
    if (responseMatch) {
      responseBodies = extractJsonCodeBlocks(responseMatch[1]);
    }

    endpoints.push({
      name,
      description,
      method: current.method,
      path: current.path,
      headers,
      requestBody,
      statusDefinitions,
      responseBodies,
    });
  }

  return endpoints;
}

/**
 * Match a JSON response block to the appropriate HTTP status code & scenario title.
 */
function determineResponseScenarioInfo(
  json: unknown,
  statusDefs: ResponseStatusDef[],
  index: number
): { statusCode: number; name: string } {
  let matchedDef: ResponseStatusDef | undefined = undefined;

  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    const codeVal = obj.code || (obj.error_helper && typeof obj.error_helper === 'object' ? (obj.error_helper as Record<string, unknown>).code : undefined);

    if (codeVal && typeof codeVal === 'string') {
      // 1. Exact match custom code
      matchedDef = statusDefs.find((d) => d.customCode.toLowerCase() === codeVal.toLowerCase());

      // 2. Prefix / pattern matching if exact not found
      if (!matchedDef) {
        if (/000$/i.test(codeVal)) matchedDef = { httpCode: 200, message: 'Success', customCode: codeVal };
        else if (/28\d$/i.test(codeVal)) matchedDef = { httpCode: 400, message: 'Validation Error', customCode: codeVal };
        else if (/18\d$/i.test(codeVal)) matchedDef = { httpCode: 401, message: 'Unauthorized', customCode: codeVal };
        else if (/31\d$/i.test(codeVal)) matchedDef = { httpCode: 404, message: 'Data Not Found', customCode: codeVal };
        else if (/99\d$/i.test(codeVal)) matchedDef = { httpCode: 500, message: 'Internal Server Error', customCode: codeVal };
      }
    }

    // 3. Status field in JSON if present
    if (!matchedDef && typeof obj.status === 'number' && obj.status >= 100 && obj.status < 600) {
      matchedDef = { httpCode: obj.status, message: typeof obj.message === 'string' ? obj.message : `HTTP ${obj.status}`, customCode: '' };
    }
  }

  // 4. Fallback by index or default 200
  if (!matchedDef) {
    if (index === 0) {
      const def200 = statusDefs.find((d) => d.httpCode === 200);
      matchedDef = def200 || { httpCode: 200, message: 'Success', customCode: '' };
    } else if (index < statusDefs.length) {
      matchedDef = statusDefs[index];
    } else {
      matchedDef = { httpCode: 200, message: `Response Scenario ${index + 1}`, customCode: '' };
    }
  }

  const nameParts: string[] = [];
  if (matchedDef.httpCode) nameParts.push(`${matchedDef.httpCode}`);
  if (matchedDef.message) nameParts.push(matchedDef.message);
  if (matchedDef.customCode) nameParts.push(`(${matchedDef.customCode})`);

  const name = nameParts.length > 0 ? nameParts.join(' - ') : `Scenario ${index + 1}`;

  return {
    statusCode: matchedDef.httpCode,
    name,
  };
}

/**
 * Parses Confluence markdown documents into Mock API Studio project data.
 * Supports single markdown text, concatenated documents, or multiple markdown files.
 */
export function parseConfluenceMarkdownToProjectData(
  projectId: string,
  rawMarkdown: string | string[],
  existingCollections: Collection[] = []
): ExtractedProjectData {
  const documents: string[] = Array.isArray(rawMarkdown) ? rawMarkdown : [rawMarkdown];

  const collectionsMap = new Map<string, string>(); // lowercase name -> collectionId
  existingCollections.forEach((c) => {
    collectionsMap.set(c.name.toLowerCase(), c.id);
  });

  const collectionsToCreate: Array<Omit<Collection, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const environmentsToCreate: Array<Omit<Environment, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const apisToCreate: Array<Omit<ApiCollection, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const requestScenariosToCreate: Array<Omit<RequestScenario, 'createdAt' | 'updatedAt'> & { id: string }> = [];
  const responseScenariosToCreate: Array<Omit<ResponseScenario, 'createdAt' | 'updatedAt'> & { id: string }> = [];

  const envsMap = new Map<string, { name: string; baseUrl: string; environmentType: EnvironmentType }>();

  // Process all documents
  for (const doc of documents) {
    if (!doc || !doc.trim()) continue;

    // 1. Environments
    const envs = parseEnvironmentsFromDoc(doc);
    envs.forEach((e) => {
      envsMap.set(e.name.toLowerCase(), e);
    });

    // 2. Endpoints
    const endpoints = parseSingleConfluenceDocument(doc);

    for (const ep of endpoints) {
      const colName = extractCollectionNameFromPath(ep.path);
      const colKey = colName.toLowerCase();

      let collectionId = collectionsMap.get(colKey);
      if (!collectionId) {
        collectionId = generateId();
        collectionsMap.set(colKey, collectionId);
        collectionsToCreate.push({
          id: collectionId,
          projectId,
          name: colName,
          description: `Imported collection for ${colName} endpoints`,
          status: true,
          deletedAt: null,
        });
      }

      const apiId = generateId();
      apisToCreate.push({
        id: apiId,
        projectId,
        collectionId,
        name: ep.name,
        description: ep.description || null,
        path: ep.path,
        methodRequest: ep.method,
        status: true,
        deletedAt: null,
      });

      // Create RequestScenario
      const reqId = generateId();
      requestScenariosToCreate.push({
        id: reqId,
        apiId,
        name: 'Default Scenario',
        description: `Request scenario for ${ep.name}`,
        headers: ep.headers,
        queryParams: {},
        pathParams: {},
        body: ep.requestBody || {},
        bodyType: 'JSON',
        matchType: 'EXACT',
        priority: 0,
        status: true,
      });

      // Create ResponseScenarios
      const usedNamesCount = new Map<string, number>();

      if (ep.responseBodies.length > 0) {
        ep.responseBodies.forEach((bodyJson, idx) => {
          const respId = generateId();
          const { statusCode, name: baseName } = determineResponseScenarioInfo(bodyJson, ep.statusDefinitions, idx);

          const count = usedNamesCount.get(baseName) || 0;
          usedNamesCount.set(baseName, count + 1);

          const finalName = count > 0 ? `${baseName} (Variant ${count + 1})` : baseName;

          responseScenariosToCreate.push({
            id: respId,
            requestScenarioId: reqId,
            name: finalName,
            description: `Auto-generated response from Confluence spec`,
            statusCode,
            headers: { 'Content-Type': 'application/json' },
            body: bodyJson,
            responseType: 'JSON',
            delayMs: 0,
            weight: 100,
            priority: idx,
            status: true,
            deletedAt: null,
          });
        });
      } else {
        // Fallback default 200 response if no JSON block found
        const respId = generateId();
        responseScenariosToCreate.push({
          id: respId,
          requestScenarioId: reqId,
          name: '200 - Success',
          description: 'Default success response',
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { code: '200', message: 'Success' },
          responseType: 'JSON',
          delayMs: 0,
          weight: 100,
          priority: 0,
          status: true,
          deletedAt: null,
        });
      }
    }
  }

  // Build environments to create
  envsMap.forEach((env) => {
    const envVars: EnvironmentVariable[] = [
      { id: generateId(), key: 'baseUrl', value: env.baseUrl, type: 'plain', enabled: true },
    ];
    environmentsToCreate.push({
      id: generateId(),
      projectId,
      name: env.name,
      isBaseUrl: true,
      values: { [env.environmentType]: env.baseUrl },
      environmentType: env.environmentType,
      variables: envVars,
      status: true,
    });
  });

  return {
    collections: collectionsToCreate,
    environments: environmentsToCreate,
    apis: apisToCreate,
    requestScenarios: requestScenariosToCreate,
    responseScenarios: responseScenariosToCreate,
  };
}

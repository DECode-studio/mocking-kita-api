import YAML from 'yaml';
import { FlowExportTemplate, VariableExtractor } from '@/src/server/scenario-flow/scenario-flow.types';

export interface InsomniaConversionSummary {
  source?: string;
  totalRequests: number;
  totalResponseTags: number;
  totalDependencies: number;
  environmentsCount: number;
  scriptEnvironmentReads: string[];
  scriptEnvironmentWrites: string[];
  preRequestScriptsCount: number;
  warnings: string[];
}

export interface InsomniaConversionResult {
  template: FlowExportTemplate;
  summary: InsomniaConversionSummary;
}

const STAGES = ['LOCAL', 'DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION'] as const;
type StageType = (typeof STAGES)[number];

const RESPONSE_TAG_RE =
  /\{%\s*response\s*['"]?(body|header)['"]?\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"][^%]*%\}/g;
const BASE_URL_TOKEN_RE = /^\{\{\s*(?:_\.)?([a-zA-Z0-9_-]+)\s*\}\}(.*)$/s;

function stageFor(name: string): StageType {
  const normalized = (name || '').toLowerCase();
  if (/local|localhost/.test(normalized)) return 'LOCAL';
  if (/dev|development/.test(normalized)) return 'DEVELOPMENT';
  if (/test|testing|qa/.test(normalized)) return 'TESTING';
  if (/stag|staging/.test(normalized)) return 'STAGING';
  if (/prod|production/.test(normalized)) return 'PRODUCTION';
  return 'DEVELOPMENT';
}

function isBaseUrlKey(key: string, value: any): boolean {
  const keyStr = String(key || '');
  const valStr = String(value || '');
  return (
    /(?:^|_)URL$|BASE_URL|API_URL|_URL_/i.test(keyStr) ||
    /^https?:\/\//i.test(valStr)
  );
}

export function normalizeJsonPath(path: any): string {
  let result = String(path || '');
  result = result.replace(/^\$\./, '');
  result = result.replace(/^\$/, '');
  result = result.replace(/\[(\w+)\]/g, '.$1');
  result = result.replace(/^\./, '');
  return result;
}

export function decodeFilter(rawFilter: string): string {
  const match = String(rawFilter || '').match(/^b64::([^:]+)::46b$/);
  if (!match) {
    return normalizeJsonPath(rawFilter);
  }
  try {
    if (typeof atob === 'function') {
      const decoded = atob(match[1]);
      return normalizeJsonPath(decoded);
    }
    if (typeof Buffer !== 'undefined') {
      const decoded = Buffer.from(match[1], 'base64').toString('utf-8');
      return normalizeJsonPath(decoded);
    }
  } catch {
    // fallback
  }
  return normalizeJsonPath(rawFilter);
}

export function generateVariableName(sourceReqId: string, jsonPath: string): string {
  const raw = `${sourceReqId}_${jsonPath}`;
  const cleaned = raw.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
  return cleaned.replace(/_$/, '');
}

export function replaceInsomniaTokens(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  const replaced = value.replace(
    RESPONSE_TAG_RE,
    (_match, _fromPart, sourceReqId, rawFilter) => {
      const jsonPath = decodeFilter(rawFilter);
      return `{{${generateVariableName(sourceReqId, jsonPath)}}}`;
    }
  );

  return replaced.replace(/\{\{\s*_\.([a-zA-Z0-9_-]+)\s*\}\}/g, '{{$1}}');
}

function normalizeListToMap(items: any): Record<string, string> {
  const result: Record<string, string> = {};
  if (!Array.isArray(items)) return result;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    if (item.disabled || !item.name) continue;
    result[String(item.name)] = String(replaceInsomniaTokens(String(item.value || '')));
  }
  return result;
}

function parseBody(req: any): { body: any; bodyType: string } {
  const body = req?.body;
  if (!body || typeof body !== 'object') {
    return { body: {}, bodyType: 'NONE' };
  }

  const text = body.text;
  if (text === undefined || text === null || !String(text).trim()) {
    return { body: {}, bodyType: 'NONE' };
  }

  const contentType = String(body.mimeType || '').toLowerCase();
  const cleanText = replaceInsomniaTokens(String(text));

  if (contentType.includes('x-www-form-urlencoded')) {
    return { body: cleanText, bodyType: 'URL_ENCODED' };
  }
  if (contentType.includes('multipart')) {
    return { body: cleanText, bodyType: 'FORM_DATA' };
  }

  try {
    return { body: JSON.parse(cleanText), bodyType: 'JSON' };
  } catch {
    return { body: cleanText, bodyType: 'JSON' };
  }
}

interface TraversedRequest {
  id: string;
  req: any;
  folderPath: string;
  traversalOrder: number;
  sortKey: number;
}

function traverseCollection(
  items: any,
  parentPath: string[] = [],
  requests: TraversedRequest[] = [],
  order = { value: 0 }
): TraversedRequest[] {
  if (!Array.isArray(items)) return requests;

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const children = item.children;
    if (Array.isArray(children)) {
      const folderName = String(item.name || '').trim();
      traverseCollection(children, folderName ? [...parentPath, folderName] : parentPath, requests, order);
    } else if (item.url && item.method) {
      order.value += 1;
      const meta = item.meta && typeof item.meta === 'object' ? item.meta : {};
      const reqId = meta.id || item._id || `generated_req_${order.value}`;
      requests.push({
        id: String(reqId),
        req: item,
        folderPath: parentPath.join(' / '),
        traversalOrder: order.value,
        sortKey: typeof meta.sortKey === 'number' ? meta.sortKey : order.value,
      });
    }
  }

  return requests;
}

function extractAfterResponse(script: any): VariableExtractor[] {
  const extractors: VariableExtractor[] = [];
  const text = String(script || '');
  const pattern = /insomnia\.environment\.set\(\s*['"]([^'"]+)['"]\s*,\s*response\.([a-zA-Z0-9_.\[\]]+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const [, variable, path] = match;
    extractors.push({
      variable,
      from: 'body',
      path: normalizeJsonPath(path),
    });
  }
  return extractors;
}

function extractScriptEnvironmentRefs(script: any): { reads: Set<string>; writes: Set<string> } {
  const text = String(script || '');
  const reads = new Set<string>();
  const writes = new Set<string>();

  const getPattern = /insomnia\.environment\.get\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = getPattern.exec(text)) !== null) {
    reads.add(m[1]);
  }

  const setPattern = /insomnia\.environment\.set\(\s*['"]([^'"]+)['"]\s*,/g;
  while ((m = setPattern.exec(text)) !== null) {
    writes.add(m[1]);
  }

  return { reads, writes };
}

function isSecretKey(key: string): boolean {
  const lower = String(key || '').toLowerCase();
  return (
    lower.includes('token') ||
    lower.includes('secret') ||
    lower.includes('password') ||
    lower.includes('auth') ||
    lower.includes('key') ||
    lower.includes('bearer') ||
    lower.includes('credential') ||
    lower.includes('signature') ||
    lower.includes('private') ||
    lower.includes('cert')
  );
}

function buildEnvironmentTemplate(
  parsed: any,
  warnings: string[],
  scriptEnvReads = new Set<string>(),
  scriptEnvWrites = new Set<string>()
): { environments: NonNullable<FlowExportTemplate['environments']>; flowVariables: Record<string, any> } {
  const envRoot = parsed?.environments && typeof parsed.environments === 'object' ? parsed.environments : {};
  const stageData: Record<string, Record<string, any>> = {};

  const baseData = envRoot.data && typeof envRoot.data === 'object' ? envRoot.data : {};
  if (Object.keys(baseData).length > 0) {
    stageData['DEVELOPMENT'] = { ...baseData };
  }

  const subEnvs = Array.isArray(envRoot.subEnvironments) ? envRoot.subEnvironments : [];
  for (const subenv of subEnvs) {
    if (!subenv || typeof subenv !== 'object' || !subenv.data || typeof subenv.data !== 'object') {
      continue;
    }
    const stage = stageFor(String(subenv.name || ''));
    if (!stageData[stage]) {
      stageData[stage] = { ...baseData };
    }
    Object.assign(stageData[stage], subenv.data);
  }

  const baseKeys = new Set<string>();
  const variableKeys = new Set<string>();

  for (const data of Object.values(stageData)) {
    for (const [key, value] of Object.entries(data)) {
      if (isBaseUrlKey(key, value)) {
        baseKeys.add(key);
      } else {
        variableKeys.add(key);
      }
    }
  }

  for (const key of [...scriptEnvReads, ...scriptEnvWrites]) {
    if (!baseKeys.has(key)) {
      variableKeys.add(key);
    }
  }

  if (baseKeys.size === 0) {
    warnings.push('No base URL environment variables detected in collection environments.');
  }

  const preferredStage = stageData['DEVELOPMENT'] ? 'DEVELOPMENT' : Object.keys(stageData)[0];
  const sortedVariableKeys = Array.from(variableKeys).sort();

  // Extract non-baseUrl variables (headers, tokens, keys, secrets)
  const envVariables = sortedVariableKeys.map((key) => {
    let rawVal: any = undefined;
    if (preferredStage && stageData[preferredStage] && stageData[preferredStage][key] !== undefined) {
      rawVal = stageData[preferredStage][key];
    } else {
      for (const stage of STAGES) {
        if (stageData[stage] && stageData[stage][key] !== undefined) {
          rawVal = stageData[stage][key];
          break;
        }
      }
    }

    const valueStr =
      rawVal !== undefined && rawVal !== null
        ? typeof rawVal === 'object'
          ? JSON.stringify(rawVal)
          : String(rawVal)
        : '';

    return {
      id: key,
      key,
      value: valueStr,
      type: (isSecretKey(key) ? 'secret' : 'plain') as 'plain' | 'secret',
      enabled: true,
    };
  });

  const sortedBaseKeys = Array.from(baseKeys).sort();
  const environments: NonNullable<FlowExportTemplate['environments']> = [];

  for (let index = 0; index < sortedBaseKeys.length; index++) {
    const key = sortedBaseKeys[index];
    const values: Record<StageType, string | null> = {
      LOCAL: null,
      DEVELOPMENT: null,
      TESTING: null,
      STAGING: null,
      PRODUCTION: null,
    };

    for (const stage of STAGES) {
      if (stageData[stage] && stageData[stage][key] !== undefined && String(stageData[stage][key]) !== '') {
        values[stage] = String(stageData[stage][key]);
      }
    }

    const defaultType: StageType = values.DEVELOPMENT
      ? 'DEVELOPMENT'
      : (Object.keys(stageData)[0] as StageType) || 'DEVELOPMENT';

    environments.push({
      id: key,
      name: key,
      isBaseUrl: true,
      environmentType: defaultType,
      values,
      variables: [...envVariables],
      isDefault: index === 0,
    });
  }

  // Create dedicated variable set environments for variables that have distinct values per stage
  for (const varKey of sortedVariableKeys) {
    const stageValues: Record<StageType, string | null> = {
      LOCAL: null,
      DEVELOPMENT: null,
      TESTING: null,
      STAGING: null,
      PRODUCTION: null,
    };
    let hasDistinctStageValues = false;
    let stageCount = 0;
    let firstVal: string | null = null;

    for (const stage of STAGES) {
      if (stageData[stage] && stageData[stage][varKey] !== undefined && String(stageData[stage][varKey]) !== '') {
        const strVal = String(stageData[stage][varKey]);
        stageValues[stage] = strVal;
        stageCount++;
        if (firstVal === null) {
          firstVal = strVal;
        } else if (firstVal !== strVal) {
          hasDistinctStageValues = true;
        }
      }
    }

    if (hasDistinctStageValues && stageCount > 1) {
      const defaultType: StageType = stageValues.DEVELOPMENT
        ? 'DEVELOPMENT'
        : (Object.keys(stageData)[0] as StageType) || 'DEVELOPMENT';
      environments.push({
        id: varKey,
        name: varKey,
        isBaseUrl: false,
        environmentType: defaultType,
        values: stageValues,
        variables: [
          {
            id: varKey,
            key: varKey,
            value: stageValues[defaultType] || firstVal || '',
            type: isSecretKey(varKey) ? 'secret' : 'plain',
            enabled: true,
          },
        ],
        isDefault: false,
      });
    }
  }

  // If no base keys were detected, but variable keys exist, create a Variable Set environment
  if (environments.length === 0 && envVariables.length > 0) {
    const defaultType: StageType = (preferredStage as StageType) || 'DEVELOPMENT';
    environments.push({
      id: 'env_variables',
      name: String(parsed.name || 'Environment Variables'),
      isBaseUrl: false,
      environmentType: defaultType,
      values: {
        LOCAL: null,
        DEVELOPMENT: null,
        TESTING: null,
        STAGING: null,
        PRODUCTION: null,
      },
      variables: [...envVariables],
      isDefault: true,
    });
  }

  const flowVariables: Record<string, any> = {};
  if (preferredStage && stageData[preferredStage]) {
    for (const key of sortedVariableKeys) {
      const val = stageData[preferredStage][key];
      flowVariables[key] = val !== undefined ? val : null;
    }
  }

  for (const key of [...scriptEnvReads, ...scriptEnvWrites]) {
    if (!(key in flowVariables) && !baseKeys.has(key)) {
      flowVariables[key] = null;
    }
  }

  return { environments, flowVariables };
}

function sortRequests(
  requests: TraversedRequest[],
  dependencies: Map<string, Set<string>>,
  warnings: string[]
): TraversedRequest[] {
  const byId = new Map<string, TraversedRequest>();
  const inbound = new Map<string, Set<string>>();
  const outbound = new Map<string, Set<string>>();

  for (const item of requests) {
    byId.set(item.id, item);
    inbound.set(item.id, new Set());
    outbound.set(item.id, new Set());
  }

  dependencies.forEach((sources, target) => {
    if (!inbound.has(target)) inbound.set(target, new Set());
    for (const source of sources) {
      if (!byId.has(source)) {
        warnings.push(`Missing dependency source ${source} referenced by ${target}.`);
        continue;
      }
      inbound.get(target)!.add(source);
      if (!outbound.has(source)) outbound.set(source, new Set());
      outbound.get(source)!.add(target);
    }
  });

  const sortFn = (a: TraversedRequest, b: TraversedRequest) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    return a.traversalOrder - b.traversalOrder;
  };

  const ready: TraversedRequest[] = requests.filter((item) => (inbound.get(item.id)?.size || 0) === 0);
  ready.sort(sortFn);

  const sortedItems: TraversedRequest[] = [];

  while (ready.length > 0) {
    const current = ready.shift()!;
    sortedItems.push(current);

    const dependents = outbound.get(current.id) || new Set();
    for (const target of dependents) {
      const inSet = inbound.get(target);
      if (inSet) {
        inSet.delete(current.id);
        if (inSet.size === 0) {
          const targetReq = byId.get(target);
          if (targetReq) {
            ready.push(targetReq);
            ready.sort(sortFn);
          }
        }
      }
    }
  }

  if (sortedItems.length !== requests.length) {
    const remaining = requests.filter((item) => !sortedItems.includes(item));
    warnings.push(
      `Dependency cycle or unresolved ordering for ${remaining.length} request(s); appended by folder/sort order.`
    );
    remaining.sort(sortFn);
    sortedItems.push(...remaining);
  }

  return sortedItems;
}

export function parseInsomniaContent(content: string | object): any {
  if (typeof content === 'object' && content !== null) {
    return content;
  }
  const raw = String(content || '').trim();
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback to YAML parse
    }
  }
  return YAML.parse(raw);
}

/**
 * Converts an Insomnia Collection (v5 YAML or JSON) into a Mock API Studio Scenario Flow Template
 */
export function convertInsomniaToScenarioFlow(
  source: string | object,
  options: { sourceFileName?: string } = {}
): InsomniaConversionResult {
  const parsed = parseInsomniaContent(source);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid Insomnia collection format. Root must be a YAML or JSON object.');
  }

  const warnings: string[] = [];
  const rawCollection = parsed.collection || (Array.isArray(parsed) ? parsed : []);
  const requests = traverseCollection(rawCollection);
  const byId = new Map(requests.map((r) => [r.id, r]));

  const extractorsByReq = new Map<string, VariableExtractor[]>();
  const dependencies = new Map<string, Set<string>>();
  let responseTagCount = 0;
  let preRequestCount = 0;
  const scriptEnvReads = new Set<string>();
  const scriptEnvWrites = new Set<string>();

  for (const item of requests) {
    const req = item.req;
    const scanPayload = JSON.stringify({
      url: req.url,
      body: req.body,
      parameters: req.parameters,
      headers: req.headers,
    });

    const matches = Array.from(scanPayload.matchAll(RESPONSE_TAG_RE));
    for (const match of matches) {
      const [, fromPart, sourceReqId, rawFilter] = match;
      responseTagCount += 1;
      const jsonPath = decodeFilter(rawFilter);
      const varName = generateVariableName(sourceReqId, jsonPath);

      if (!extractorsByReq.has(sourceReqId)) {
        extractorsByReq.set(sourceReqId, []);
      }
      const sourceExtractors = extractorsByReq.get(sourceReqId)!;
      if (!sourceExtractors.some((e) => e.variable === varName)) {
        sourceExtractors.push({
          variable: varName,
          from: fromPart === 'header' ? 'headers' : 'body',
          path: jsonPath,
        });
      }

      if (byId.has(sourceReqId)) {
        if (!dependencies.has(item.id)) {
          dependencies.set(item.id, new Set());
        }
        dependencies.get(item.id)!.add(sourceReqId);
      }
    }

    const scripts = req.scripts && typeof req.scripts === 'object' ? req.scripts : {};
    const afterScript = String(scripts.afterResponse || '');
    for (const ext of extractAfterResponse(afterScript)) {
      if (!extractorsByReq.has(item.id)) {
        extractorsByReq.set(item.id, []);
      }
      const targetExtractors = extractorsByReq.get(item.id)!;
      if (!targetExtractors.some((e) => e.variable === ext.variable)) {
        targetExtractors.push(ext);
      }
    }

    const preScript = String(scripts.preRequest || '');
    if (preScript.trim()) {
      preRequestCount += 1;
    }

    for (const script of [preScript, afterScript]) {
      const refs = extractScriptEnvironmentRefs(script);
      refs.reads.forEach((r) => scriptEnvReads.add(r));
      refs.writes.forEach((w) => scriptEnvWrites.add(w));
    }
  }

  const { environments, flowVariables } = buildEnvironmentTemplate(
    parsed,
    warnings,
    scriptEnvReads,
    scriptEnvWrites
  );

  const sortedRequests = sortRequests(requests, dependencies, warnings);

  const steps: FlowExportTemplate['steps'] = sortedRequests.map((item, index) => {
    const req = item.req;
    const description = replaceInsomniaTokens(String(req.meta?.description || ''));
    const rawUrl = String(req.url || '');
    let targetEnvironment: string | null = null;
    let path = rawUrl;

    const baseMatch = BASE_URL_TOKEN_RE.exec(rawUrl);
    if (baseMatch) {
      targetEnvironment = baseMatch[1];
      path = baseMatch[2];
    } else if (/^https?:\/\//i.test(rawUrl)) {
      try {
        const parsedUrl = new URL(rawUrl);
        targetEnvironment = `${parsedUrl.hostname.replace(/[^A-Z0-9_]/gi, '_').toUpperCase()}_BASE_URL`;
        path = parsedUrl.pathname + parsedUrl.search;
      } catch {
        path = rawUrl;
      }
    }

    path = replaceInsomniaTokens(path);
    if (!path || path.trim() === '') {
      path = '/';
    }

    const { body, bodyType } = parseBody(req);
    const headers = normalizeListToMap(req.headers);
    const queryParams = normalizeListToMap(req.parameters);
    const name = String(req.name || `Step ${index + 1}`).trim();

    return {
      order: index + 1,
      name,
      description: description || undefined,
      enabled: true,
      delayMs: 0,
      continueOnError: false,
      api: {
        method: String(req.method || 'GET').toUpperCase(),
        path,
        name,
        collection: item.folderPath || null,
        description: description || undefined,
        targetEnvironment: targetEnvironment || null,
        environmentIds: targetEnvironment ? [targetEnvironment] : [],
      },
      requestScenario: {
        name: `${name} Scenario`,
        headers,
        queryParams,
        pathParams: {},
        body,
        bodyType,
      },
      expectedResponseScenario: {
        name: `${name} Response`,
        statusCode: 200,
        headers: {},
        body: {},
      },
      overrides: {
        method: null,
        path: null,
        headers: null,
        queryParams: null,
        pathParams: null,
        body: null,
      },
      extractors: extractorsByReq.get(item.id) || [],
      assertions: [{ type: 'statusCode', operator: 'equals', expected: 200 }],
    };
  });

  if (preRequestCount > 0) {
    warnings.push(
      `${preRequestCount} request(s) contain preRequest scripts (e.g. HMAC / dynamic variables). Please ensure necessary tokens are mapped to flow variables.`
    );
  }

  const template: FlowExportTemplate = {
    $schema: 'mock-api-studio/scenario-flow/v1',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    environments,
    flow: {
      name: String(parsed.name || 'Imported Insomnia Flow'),
      description: String(parsed.meta?.description || 'Converted from Insomnia collection'),
      stopOnFailure: true,
      variables: flowVariables,
    },
    steps,
  };

  let totalDeps = 0;
  dependencies.forEach((s) => {
    totalDeps += s.size;
  });

  const summary: InsomniaConversionSummary = {
    source: options.sourceFileName || 'Insomnia Collection',
    totalRequests: requests.length,
    totalResponseTags: responseTagCount,
    totalDependencies: totalDeps,
    environmentsCount: environments.length,
    scriptEnvironmentReads: Array.from(scriptEnvReads).sort(),
    scriptEnvironmentWrites: Array.from(scriptEnvWrites).sort(),
    preRequestScriptsCount: preRequestCount,
    warnings: Array.from(new Set(warnings)).sort(),
  };

  return { template, summary };
}

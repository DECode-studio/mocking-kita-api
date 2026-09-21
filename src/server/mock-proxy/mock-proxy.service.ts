import { NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { readDatabase } from '@/src/core/db/database_storage_helper';
import { ApiCollection } from '@/src/client/domain/api/entity/api_collection';
import { ApiEnvironment } from '@/src/client/domain/api/entity/api_environment';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { MatchStrategy, MatchType, RequestBodyType } from '@/src/core/utils/types';
import {
  evaluateBodyPathRules,
  evaluateDeepMatch,
  extractParamRule,
  isParamRule,
  isToleratedHeader,
  matchesHeadersMap,
  matchesParamsMap,
  matchesStructure,
  registerDataSheetLookup,
} from '@/src/core/utils/param-matcher';
import { getUploadDirectory } from '@/src/server/upload/upload.paths';
import { getProxyConfigCache, responseCache, setProxyConfigCache, throttleStates } from './mock-proxy.cache';
import { interpolateVariables, createStepDataSheetCounters } from '@/src/server/scenario-flow/scenario-flow.runner';

export const mockDataSheetCounters: Record<string, number> = {};

export function resetMockDataSheetCounters(): void {
  for (const key of Object.keys(mockDataSheetCounters)) {
    delete mockDataSheetCounters[key];
  }
}

function hasDynamicTokens(value: unknown): boolean {
  if (typeof value === 'string') {
    return /\{\{\s*(datasheet\.|\$)/.test(value);
  }
  if (value && typeof value === 'object') {
    return /\{\{\s*(datasheet\.|\$)/.test(JSON.stringify(value));
  }
  return false;
}

const INTERNAL_ROUTE_PREFIXES = [
  '/api/auth',
  '/api/database',
  '/api/settings',
  '/api/admin',
  '/api/upload',
  '/api/projects',
  '/api/change-logs',
  '/api/faq',
];

type PathMatchResult = {
  matched: boolean;
  params: Record<string, string>;
  specificity: number;
};

type ScenarioMatchResult = {
  scenario: RequestScenario;
  score: number;
};

type ApiMatchResult = {
  apiId: string;
  apiPath: string;
  params: Record<string, string>;
  specificity: number;
  matched: boolean;
};

type CachedResponseEntry = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  expiresAt: number;
};

type ThrottleState = {
  tokens: number;
  lastRefillAt: number;
};

const CACHE_TTL_MS = 5_000;
const PROXY_CONFIG_CACHE_KEY = 'default';
const PROXY_CONFIG_TTL_MS = 30_000;
const THROTTLE_CAPACITY = 30;
const THROTTLE_WINDOW_MS = 10_000;
const THROTTLE_REFILL_PER_MS = THROTTLE_CAPACITY / THROTTLE_WINDOW_MS;
const MAX_REGEX_PATTERN_LENGTH = 500;
const MAX_DELAY_MS = 30_000;
const BLOCKED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-length',
  'date',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'server',
  'set-cookie',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

type ProxyConfig = {
  activeProjectIds: Set<string>;
  activeEnvironmentIds: Set<string>;
  activeApis: ApiCollection[];
  apiById: Map<string, ApiCollection>;
  apiEnvironmentsByApiId: Map<string, ApiEnvironment[]>;
  requestScenariosByApiId: Map<string, RequestScenario[]>;
  responseScenariosByRequestScenarioId: Map<string, ResponseScenario[]>;
  dataSheetsByCode: Map<string, any[]>;
};

function normalizePath(value: string): string {
  if (!value) return '/';
  const trimmed = value.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed || '/' : `/${trimmed}`;
}

function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePathPattern(pattern: string): { regex: RegExp; paramNames: string[]; specificity: number } {
  const segments = normalizePath(pattern).split('/').filter(Boolean);
  const paramNames: string[] = [];
  let specificity = 0;

  const regexBody = segments
    .map((segment) => {
      if (segment === '*') {
        return '(.+)';
      }

      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1));
        return '([^/]+)';
      }

      specificity += 2;
      return escapeRegex(segment);
    })
    .join('/');

  const trailingSlash = '/?';
  return {
    regex: new RegExp(`^/${regexBody}${trailingSlash}$`),
    paramNames,
    specificity,
  };
}

function matchPathPattern(pattern: string, actualPath: string): PathMatchResult {
  const normalizedPattern = normalizePath(pattern);
  const normalizedActual = normalizePath(actualPath);
  const { regex, paramNames, specificity } = compilePathPattern(normalizedPattern);
  const match = normalizedActual.match(regex);

  if (!match) {
    return { matched: false, params: {}, specificity: 0 };
  }

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1] ?? '');
  });

  return { matched: true, params, specificity };
}

function toComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toComparable);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = toComparable((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(toComparable(a)) === JSON.stringify(toComparable(b));
}

function toLooseComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toLooseComparable);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = toLooseComparable((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  if (value == null) return value;
  return String(value);
}

function deepEqualLoose(a: unknown, b: unknown): boolean {
  return JSON.stringify(toLooseComparable(a)) === JSON.stringify(toLooseComparable(b));
}

function objectEntries(obj: unknown): Array<[string, unknown]> {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj as Record<string, unknown>);
}

function objectKeys(obj: unknown): string[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.keys(obj as Record<string, unknown>);
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}

function buildProxyConfig(database: Awaited<ReturnType<typeof readDatabase>>): ProxyConfig {
  const activeProjectIds = new Set(
    database.projects.filter((project) => project.status && !project.deletedAt).map((project) => project.id)
  );
  const activeEnvironmentIds = new Set(
    database.environments.filter((environment) => environment.status && !environment.deletedAt).map((environment) => environment.id)
  );
  const activeApis = database.apiCollections.filter((api) => {
    if (!api.status || api.deletedAt) return false;
    return activeProjectIds.has(api.projectId);
  });

  return {
    activeProjectIds,
    activeEnvironmentIds,
    activeApis,
    apiById: new Map(database.apiCollections.map((api) => [api.id, api])),
    apiEnvironmentsByApiId: groupBy(database.apiEnvironments, (apiEnvironment) => apiEnvironment.apiId),
    requestScenariosByApiId: groupBy(
      database.requestScenarios.filter((scenario) => scenario.status && !scenario.deletedAt),
      (scenario) => scenario.apiId
    ),
    responseScenariosByRequestScenarioId: groupBy(
      database.responseScenarios.filter((scenario) => scenario.status && !scenario.deletedAt),
      (scenario) => scenario.requestScenarioId
    ),
    dataSheetsByCode: new Map(
      (database.dataSheets || [])
        .filter((ds) => ds.status && !ds.deletedAt)
        .map((ds) => [ds.code, Array.isArray(ds.data) ? ds.data : []])
    ),
  };
}

async function getProxyConfig(): Promise<ProxyConfig> {
  const cached = getProxyConfigCache<ProxyConfig>(PROXY_CONFIG_CACHE_KEY);
  if (cached) {
    registerDataSheetLookup((code: string) => cached.dataSheetsByCode.get(code));
    return cached;
  }

  const config = buildProxyConfig(await readDatabase());
  registerDataSheetLookup((code: string) => config.dataSheetsByCode.get(code));
  setProxyConfigCache(PROXY_CONFIG_CACHE_KEY, config, PROXY_CONFIG_TTL_MS);
  return config;
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

function countSpecifiedFields(value: unknown): number {
  if (isEmptyValue(value)) return 0;
  if (isParamRule(value)) {
    const rule = extractParamRule(value);
    return rule.enabled === false ? 0 : 1;
  }
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countSpecifiedFields(item), 0);
  }
  if (typeof value !== 'object') return 1;
  const objectValue = value as Record<string, unknown>;
  const nestedCount = Object.values(objectValue).reduce<number>((sum, item) => sum + countSpecifiedFields(item), 0);
  return nestedCount || Object.keys(objectValue).length;
}

function isBinaryFilePlaceholder(value: unknown): boolean {
  if (typeof value === 'string' && (value === '(binary_file_data)' || value.startsWith('(binary_file'))) {
    return true;
  }
  if (value && typeof value === 'object' && 'filename' in (value as Record<string, unknown>)) {
    const fn = String((value as Record<string, unknown>).filename || '');
    return fn === '(binary_file_data)' || fn.startsWith('(binary_file');
  }
  return false;
}

function matchesExact(expected: unknown, actual: unknown, looseScalars = false, matchStrategy: MatchStrategy = 'ALL'): boolean {
  if (isEmptyValue(expected)) return true;
  if (isBinaryFilePlaceholder(expected)) return actual != null && !isEmptyValue(actual);
  return evaluateDeepMatch(expected, actual, looseScalars, matchStrategy);
}

function matchesPartial(expected: unknown, actual: unknown, looseScalars = false, matchStrategy: MatchStrategy = 'ALL'): boolean {
  if (isEmptyValue(expected)) return true;
  if (isBinaryFilePlaceholder(expected)) return actual != null && !isEmptyValue(actual);
  return evaluateDeepMatch(expected, actual, looseScalars, matchStrategy);
}

function matchesRegex(expected: unknown, actual: unknown, looseScalars = false): boolean {
  if (isEmptyValue(expected)) return true;
  if (isBinaryFilePlaceholder(expected)) return actual != null && !isEmptyValue(actual);

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (expected.length !== actual.length) return false;
    return expected.every((expectedItem, index) => matchesRegex(expectedItem, actual[index], looseScalars));
  }

  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object') return false;
    return objectEntries(expected).every(([key, expectedValue]) =>
      matchesRegex(expectedValue, (actual as Record<string, unknown>)[key], looseScalars)
    );
  }

  try {
    const pattern = String(expected);
    if (pattern.length > MAX_REGEX_PATTERN_LENGTH || hasHighRiskRegexPattern(pattern)) {
      return false;
    }
    const target = looseScalars && actual != null ? String(actual) : String(actual ?? '');
    return new RegExp(pattern, 'i').test(target);
  } catch {
    return false;
  }
}

function hasHighRiskRegexPattern(pattern: string): boolean {
  return /(\([^)]*[+*][^)]*\)[+*?])|(\[[^\]]+\][+*?][+*?])|(\.\*[+*?])/.test(pattern);
}

function isLikelySchemaObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function matchesJsonSchema(schema: unknown, actual: unknown): boolean {
  if (isEmptyValue(schema)) return true;
  if (Array.isArray(schema)) {
    if (!Array.isArray(actual)) return false;
    if (schema.length === 0) return true;
    if (schema.length !== actual.length) return false;
    return actual.every((item) => matchesJsonSchema(schema[0], item));
  }

  if (!isLikelySchemaObject(schema)) {
    return matchesExact(schema, actual);
  }

  const schemaType = schema.type as string | undefined;
  if (schemaType) {
    if (schemaType === 'object' && (!actual || typeof actual !== 'object' || Array.isArray(actual))) return false;
    if (schemaType === 'array' && !Array.isArray(actual)) return false;
    if (schemaType === 'string' && typeof actual !== 'string') return false;
    if (schemaType === 'number' && typeof actual !== 'number') return false;
    if (schemaType === 'integer' && (!Number.isInteger(actual) || typeof actual !== 'number')) return false;
    if (schemaType === 'boolean' && typeof actual !== 'boolean') return false;
    if (schemaType === 'null' && actual !== null) return false;
  }

  const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : [];
  if (required.length) {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false;
    for (const key of required) {
      if (!(key in (actual as Record<string, unknown>))) return false;
    }
  }

  if (schema.properties && actual && typeof actual === 'object' && !Array.isArray(actual)) {
    const properties = schema.properties as Record<string, unknown>;
    for (const [key, childSchema] of Object.entries(properties)) {
      if (key in (actual as Record<string, unknown>) && !matchesJsonSchema(childSchema, (actual as Record<string, unknown>)[key])) {
        return false;
      }
    }
  }

  if (schema.additionalProperties === false && actual && typeof actual === 'object' && !Array.isArray(actual) && schema.properties) {
    const allowedKeys = new Set(Object.keys(schema.properties as Record<string, unknown>));
    for (const key of Object.keys(actual as Record<string, unknown>)) {
      if (!allowedKeys.has(key)) return false;
    }
  }

  if (schema.items && Array.isArray(actual)) {
    return actual.every((item) => matchesJsonSchema(schema.items, item));
  }

  return true;
}

function matchesValue(
  expected: unknown,
  actual: unknown,
  matchType: MatchType,
  looseScalars = false,
  matchStrategy: MatchStrategy = 'ALL'
): boolean {
  switch (matchType) {
    case 'PARTIAL':
      return matchesPartial(expected, actual, looseScalars, matchStrategy);
    case 'REGEX':
      return matchesRegex(expected, actual, looseScalars);
    case 'JSON_SCHEMA':
      return matchesJsonSchema(expected, actual);
    case 'EXACT':
    default:
      return matchesExact(expected, actual, looseScalars, matchStrategy);
  }
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key.toLowerCase()] = value;
  });
  return output;
}


async function parseBodyContent(contentType: string | null, request: Request): Promise<unknown> {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return {};

  const mimeType = contentType || '';
  if (mimeType.includes('application/json')) {
    try {
      const rawBody = await request.text();
      return rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return {};
    }
  }

  if (mimeType.includes('multipart/form-data') || mimeType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await request.formData();
      const parsedBody: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        if (value && typeof value === 'object' && 'name' in value) {
          const file = value as unknown as { name: string; type: string; size: number };
          parsedBody[key] = {
            filename: file.name,
            type: file.type,
            size: file.size,
          };
        } else {
          parsedBody[key] = value;
        }
      }
      return parsedBody;
    } catch {
      return {};
    }
  }

  try {
    return await request.text();
  } catch {
    return '';
  }
}

function getActualRequestBodyType(contentType: string | null, method: string): RequestBodyType {
  const upperMethod = method.toUpperCase();
  if (upperMethod === 'GET' || upperMethod === 'HEAD') return 'NONE';

  const mime = contentType || '';
  if (mime.includes('application/json')) return 'JSON';
  if (mime.includes('multipart/form-data')) return 'FORM_DATA';
  if (mime.includes('application/x-www-form-urlencoded')) return 'URL_ENCODED';
  return 'NONE';
}

function toHeaderValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isSafeHeaderName(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return false;
  if (BLOCKED_RESPONSE_HEADERS.has(normalized)) return false;
  return /^[!#$%&'*+\-.^_`|~0-9a-z]+$/i.test(normalized);
}

function sanitizeScenarioHeaders(headers: unknown): Headers {
  const output = new Headers();
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return output;
  }

  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    const normalizedKey = key.trim().toLowerCase();
    if (!isSafeHeaderName(normalizedKey)) continue;
    output.set(normalizedKey, toHeaderValue(value));
  }

  return output;
}

function sanitizeHeaderFileName(fileName: string): string {
  return fileName.replace(/[\r\n"]/g, '_');
}

function resolveSafeUploadPath(filePath: string): string | null {
  if (!filePath || filePath.includes('\0')) {
    return null;
  }

  const resolvedPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), filePath);
  const relativeToUploads = path.relative(getUploadDirectory(), resolvedPath);
  if (relativeToUploads.startsWith('..') || path.isAbsolute(relativeToUploads)) {
    return null;
  }

  return resolvedPath;
}

export const __mockProxyTestUtils = {
  resolveSafeUploadPath,
};


function matchHeaders(expectedHeaders: unknown, actualHeaders: Record<string, string>, matchStrategy: MatchStrategy = 'ALL'): boolean {
  return matchesHeadersMap(
    expectedHeaders as Record<string, unknown> | null | undefined,
    actualHeaders,
    matchStrategy
  );
}

function scoreScenarioMatch(
  scenario: RequestScenario,
  actual: {
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    pathParams: Record<string, string>;
    body: unknown;
    bodyType: RequestBodyType;
  }
): ScenarioMatchResult | null {
  if (scenario.bodyType && scenario.bodyType !== 'NONE' && actual.bodyType === 'NONE' && !isEmptyValue(scenario.body)) {
    return null;
  }

  if (scenario.bodyType && actual.bodyType !== 'NONE' && scenario.bodyType !== actual.bodyType) {
    const isExpectedForm = scenario.bodyType === 'FORM_DATA' || scenario.bodyType === 'URL_ENCODED';
    const isActualForm = actual.bodyType === 'FORM_DATA' || actual.bodyType === 'URL_ENCODED';
    if (!(isExpectedForm && isActualForm)) {
      return null;
    }
  }

  const strategy = scenario.matchStrategy || 'ALL';
  const headerMatch = matchHeaders(scenario.headers, actual.headers, strategy);
  const queryMatch = matchesParamsMap(scenario.queryParams as Record<string, unknown>, actual.queryParams, strategy, true, false);
  const pathMatch = matchesParamsMap(scenario.pathParams as Record<string, unknown>, actual.pathParams, strategy, true, false);
  
  const isFormOrUrlEncoded = scenario.bodyType === 'FORM_DATA' || scenario.bodyType === 'URL_ENCODED';
  const activeBodyRules = scenario.bodyRules?.filter((r) => r && r.enabled !== false && r.path && r.path.trim() !== '') || [];
  const hasActiveBodyRules = activeBodyRules.length > 0;

  let bodyMatch = true;
  if (hasActiveBodyRules) {
    const isStrictStructure = scenario.strictBodyStructure !== false;
    if (isStrictStructure) {
      bodyMatch = matchesStructure(scenario.body, actual.body);
    } else {
      bodyMatch = true;
    }
  } else {
    bodyMatch = matchesValue(scenario.body, actual.body, scenario.matchType, isFormOrUrlEncoded, strategy);
  }

  const bodyRulesMatch = evaluateBodyPathRules(scenario.bodyRules, actual.body, strategy, true);

  if (!headerMatch || !queryMatch || !pathMatch || !bodyMatch || !bodyRulesMatch) {
    return null;
  }

  const score =
    (scenario.priority ?? 0) * 100 +
    countSpecifiedFields(scenario.headers) +
    countSpecifiedFields(scenario.queryParams) +
    countSpecifiedFields(scenario.pathParams) +
    countSpecifiedFields(scenario.body) +
    (scenario.bodyRules?.filter((r) => r.enabled !== false).length ?? 0);

  return { scenario, score };
}


function chooseWeightedResponse(responses: ResponseScenario[]): ResponseScenario | null {
  if (!responses.length) return null;

  const sorted = [...responses].sort((a, b) => {
    const pDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (pDiff !== 0) return pDiff;

    const aIsSuccess = a.statusCode >= 200 && a.statusCode < 300 ? 1 : 0;
    const bIsSuccess = b.statusCode >= 200 && b.statusCode < 300 ? 1 : 0;
    if (bIsSuccess !== aIsSuccess) return bIsSuccess - aIsSuccess;

    return (b.weight ?? 0) - (a.weight ?? 0);
  });

  const highestPriority = Math.max(...sorted.map((item) => item.priority ?? 0));
  const priorityGroup = sorted.filter((item) => (item.priority ?? 0) === highestPriority);
  if (priorityGroup.length === 1) return priorityGroup[0];

  const firstWeight = priorityGroup[0].weight ?? 100;
  const allWeightsEqual = priorityGroup.every((item) => (item.weight ?? 100) === firstWeight);
  if (allWeightsEqual) {
    return priorityGroup[0];
  }

  const totalWeight = priorityGroup.reduce((sum, item) => sum + Math.max(item.weight ?? 0, 0), 0);
  if (totalWeight <= 0) {
    return priorityGroup[0];
  }

  let cursor = Math.random() * totalWeight;
  for (const item of priorityGroup) {
    cursor -= Math.max(item.weight ?? 0, 0);
    if (cursor <= 0) return item;
  }

  return priorityGroup[priorityGroup.length - 1];
}

function isDeterministicResponseSelection(responses: ResponseScenario[], selectedResponse: ResponseScenario): boolean {
  const highestPriority = Math.max(...responses.map((item) => item.priority ?? 0));
  const priorityGroup = responses.filter((item) => (item.priority ?? 0) === highestPriority);
  if (priorityGroup.length <= 1) return true;

  const firstWeight = priorityGroup[0].weight ?? 100;
  const allWeightsEqual = priorityGroup.every((item) => (item.weight ?? 100) === firstWeight);
  return allWeightsEqual && priorityGroup[0]?.id === selectedResponse.id;
}

function getClientIdentity(request: Request, pathname: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const ip = forwardedFor || realIp || 'anonymous';
  return `${ip}:${request.method.toUpperCase()}:${pathname}`;
}

function isThrottled(request: Request, pathname: string): { throttled: boolean; retryAfterSeconds?: number } {
  const key = getClientIdentity(request, pathname);
  const now = Date.now();
  const state = throttleStates.get(key) ?? { tokens: THROTTLE_CAPACITY, lastRefillAt: now };
  const elapsed = Math.max(0, now - state.lastRefillAt);
  state.tokens = Math.min(THROTTLE_CAPACITY, state.tokens + elapsed * THROTTLE_REFILL_PER_MS);
  state.lastRefillAt = now;

  if (state.tokens < 1) {
    throttleStates.set(key, state);
    return {
      throttled: true,
      retryAfterSeconds: Math.max(1, Math.ceil((1 - state.tokens) / THROTTLE_REFILL_PER_MS / 1000)),
    };
  }

  state.tokens -= 1;
  throttleStates.set(key, state);
  return { throttled: false };
}

function makeCacheKey(
  method: string,
  pathname: string,
  queryParams: Record<string, string>,
  body: unknown,
  headers: Record<string, string>
): string {
  const strictHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const lower = k.toLowerCase();
    if (!isToleratedHeader(lower)) {
      strictHeaders[lower] = v;
    }
  }
  return JSON.stringify({
    method: method.toUpperCase(),
    pathname,
    queryParams,
    body,
    headers: strictHeaders,
  });
}

function getCachedResponse(cacheKey: string): CachedResponseEntry | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }
  return cached;
}

function setCachedResponse(cacheKey: string, entry: Omit<CachedResponseEntry, 'expiresAt'>): void {
  responseCache.set(cacheKey, {
    ...entry,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function responseFromCache(entry: CachedResponseEntry): NextResponse {
  const headers = new Headers(entry.headers);
  headers.set('x-cache', 'HIT');
  if (typeof entry.body === 'string') {
    return new NextResponse(entry.body, {
      status: entry.status,
      headers,
    });
  }

  return NextResponse.json(entry.body ?? null, {
    status: entry.status,
    headers,
  });
}

function headersToObject(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

function getCorsHeaders(request?: Request): Record<string, string> {
  const reqOrigin = request?.headers.get('origin')?.trim();
  const requestedHeaders = request?.headers.get('access-control-request-headers');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': reqOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': requestedHeaders || '*',
    'Access-Control-Max-Age': '86400',
  };

  if (reqOrigin) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function applyCorsHeaders(response: NextResponse, request?: Request): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export async function handleInternalApiRequest(request: Request): Promise<NextResponse> {
  try {
    const response = await processInternalApiRequest(request);
    return applyCorsHeaders(response, request);
  } catch (error) {
    const errResponse = NextResponse.json(
      {
        success: false,
        error: 'Internal server error processing mock request',
      },
      { status: 500 }
    );
    return applyCorsHeaders(errResponse, request);
  }
}

async function processInternalApiRequest(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);

  if (isInternalRoute(pathname)) {
    return NextResponse.json({ error: 'Internal route is handled by a dedicated handler' }, { status: 404 });
  }

  const method = request.method.toUpperCase();

  // Handle CORS preflight explicitly if method is OPTIONS and request has access-control-request-method header
  if (method === 'OPTIONS' && request.headers.has('access-control-request-method')) {
    return new NextResponse(null, { status: 204 });
  }

  const throttle = isThrottled(request, pathname);
  if (throttle.throttled) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        path: pathname,
        method,
      },
      {
        status: 429,
        headers: throttle.retryAfterSeconds
          ? {
              'retry-after': String(throttle.retryAfterSeconds),
            }
          : undefined,
      }
    );
  }

  const headers = normalizeHeaders(request.headers);
  const body = await parseBodyContent(request.headers.get('content-type'), request);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const cacheKey =
    method === 'GET' || method === 'HEAD' ? makeCacheKey(method, pathname, queryParams, body, headers) : null;
  const cached = cacheKey ? getCachedResponse(cacheKey) : null;
  if (cached) {
    if (method === 'HEAD') {
      const cachedHeaders = new Headers(cached.headers);
      cachedHeaders.set('x-cache', 'HIT');
      return new NextResponse(null, {
        status: cached.status,
        headers: cachedHeaders,
      });
    }
    return responseFromCache(cached);
  }

  const proxyConfig = await getProxyConfig();

  let targetPathname = pathname;
  let targetProjectId: string | null = null;

  if (pathname.startsWith('/api/mock/')) {
    const parts = pathname.slice('/api/mock/'.length).split('/').filter(Boolean);
    if (parts.length > 0) {
      targetProjectId = parts[0];
      targetPathname = '/' + parts.slice(1).join('/');
    }
  }

  const apiMatches: ApiMatchResult[] = proxyConfig.activeApis
    .filter((api) => {
      if (targetProjectId && api.projectId !== targetProjectId) return false;
      return true;
    })
    .flatMap((api) => {
      const pathVariations = [
        targetPathname,
        targetPathname.startsWith('/api/') ? targetPathname.replace(/^\/api/, '') : `/api${targetPathname}`,
      ];

      const candidates: ApiMatchResult[] = pathVariations.flatMap((currPathname) => [
        {
          apiId: api.id,
          apiPath: api.path,
          ...matchPathPattern(api.path, currPathname),
        },
        ...(proxyConfig.apiEnvironmentsByApiId.get(api.id) ?? [])
          .filter(
            (apiEnvironment) =>
              apiEnvironment.enabled &&
              !!apiEnvironment.pathOverride &&
              proxyConfig.activeEnvironmentIds.has(apiEnvironment.environmentId)
          )
          .map((apiEnvironment) => ({
            apiId: api.id,
            apiPath: apiEnvironment.pathOverride as string,
            ...matchPathPattern(apiEnvironment.pathOverride as string, currPathname),
          })),
      ]);

      return candidates;
    })
    .filter((candidate) => candidate.matched)
    .sort((a, b) => b.specificity - a.specificity);

  const matchedApi = apiMatches.find((candidate) => {
    const api = proxyConfig.apiById.get(candidate.apiId);
    return api?.methodRequest === method;
  });

  if (!matchedApi) {
    if (method === 'OPTIONS') {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(
      {
        success: false,
        error: 'No internal API collection matched this request',
        path: pathname,
        method,
      },
      { status: 404 }
    );
  }

  const matchedApiCollection = proxyConfig.apiById.get(matchedApi.apiId);
  if (!matchedApiCollection) {
    return NextResponse.json(
      {
        success: false,
        error: 'Matched API collection could not be resolved',
        path: pathname,
        method,
      },
      { status: 404 }
    );
  }

  const activeRequestScenarios = proxyConfig.requestScenariosByApiId.get(matchedApi.apiId) ?? [];
  const requestScenarios = activeRequestScenarios
    .map((scenario) =>
      scoreScenarioMatch(scenario, {
        headers,
        queryParams,
        pathParams: matchedApi.params,
        body,
        bodyType: getActualRequestBodyType(request.headers.get('content-type'), method),
      })
    )
    .filter((value): value is ScenarioMatchResult => value !== null)
    .sort((a, b) => b.score - a.score);

  const matchedRequestScenario = requestScenarios[0]?.scenario || null;

  if (!matchedRequestScenario) {
    return NextResponse.json(
      {
        success: false,
        error: 'No request scenario matched this request',
        path: pathname,
        method,
        apiId: matchedApi.apiId,
      },
      { status: 404 }
    );
  }

  const responseScenarios = (proxyConfig.responseScenariosByRequestScenarioId.get(matchedRequestScenario.id) ?? [])
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (b.weight ?? 0) - (a.weight ?? 0));

  const selectedResponse = chooseWeightedResponse(responseScenarios);

  if (!selectedResponse) {
    return NextResponse.json(
      {
        success: false,
        error: 'No response scenario configured for this request scenario',
        path: pathname,
        method,
        requestScenarioId: matchedRequestScenario.id,
      },
      { status: 404 }
    );
  }

  const responseHeaders = sanitizeScenarioHeaders(selectedResponse.headers);

  responseHeaders.set('x-cache', cacheKey ? 'MISS' : 'BYPASS');
  responseHeaders.set('x-mock-api-id', matchedApi.apiId);
  responseHeaders.set('x-mock-api-path', matchedApi.apiPath);
  responseHeaders.set('x-mock-request-scenario-id', matchedRequestScenario.id);
  responseHeaders.set('x-mock-response-scenario-id', selectedResponse.id);

  if ((selectedResponse.delayMs ?? 0) > 0) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(selectedResponse.delayMs ?? 0, MAX_DELAY_MS)));
  }

  // Handle File Responses
  if (selectedResponse.responseType === 'FILE') {
    const filePath = selectedResponse.filePath;
    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is not configured for this scenario' },
        { status: 500 }
      );
    }

    const resolvedPath = resolveSafeUploadPath(filePath);
    if (!resolvedPath) {
      return NextResponse.json(
        { success: false, error: 'File path is not allowed for this scenario' },
        { status: 403 }
      );
    }

    let fileStat: fs.Stats;
    try {
      fileStat = await fs.promises.stat(/*turbopackIgnore: true*/ resolvedPath);
    } catch {
      return NextResponse.json(
        { success: false, error: `File not found: ${selectedResponse.fileName || 'unknown file'}` },
        { status: 404 }
      );
    }

    if (!fileStat.isFile()) {
      return NextResponse.json(
        { success: false, error: 'Configured file path is not a file' },
        { status: 404 }
      );
    }

    if (!responseHeaders.has('content-type')) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
      };
      responseHeaders.set('content-type', mimeTypes[ext] || 'application/octet-stream');
    }

    if (selectedResponse.fileName && !responseHeaders.has('content-disposition')) {
      responseHeaders.set('content-disposition', `inline; filename="${sanitizeHeaderFileName(selectedResponse.fileName)}"`);
    }

    if (request.method === 'HEAD') {
      return new NextResponse(null, {
        status: selectedResponse.statusCode,
        headers: responseHeaders,
      });
    }

    const stream = Readable.toWeb(fs.createReadStream(/*turbopackIgnore: true*/ resolvedPath)) as ReadableStream;
    return new NextResponse(stream, {
      status: selectedResponse.statusCode,
      headers: responseHeaders,
    });
  }

  // Handle JSON / Default Responses
  if (!responseHeaders.has('content-type')) {
    responseHeaders.set('content-type', 'application/json');
  }

  const isDynamic = hasDynamicTokens(selectedResponse.body);
  let responseBody = typeof selectedResponse.body === 'string' ? selectedResponse.body : selectedResponse.body ?? null;

  if (
    cacheKey &&
    !isDynamic &&
    selectedResponse.statusCode >= 200 &&
    selectedResponse.statusCode < 300 &&
    isDeterministicResponseSelection(responseScenarios, selectedResponse)
  ) {
    const responseHeadersObject = headersToObject(responseHeaders);
    setCachedResponse(cacheKey, {
      status: selectedResponse.statusCode,
      headers: responseHeadersObject,
      body: responseBody,
    });
  }

  // Dynamically interpolate Data Sheet & dynamic generator tokens in response body
  if (responseBody !== null && proxyConfig.dataSheetsByCode && proxyConfig.dataSheetsByCode.size > 0) {
    const dsVariables = {
      datasheet: Object.fromEntries(proxyConfig.dataSheetsByCode.entries()),
    };
    const { stepCounters, commitStep } = createStepDataSheetCounters(mockDataSheetCounters);
    responseBody = interpolateVariables(responseBody, dsVariables, stepCounters);
    commitStep();
  }

  if (request.method === 'HEAD') {
    return new NextResponse(null, {
      status: selectedResponse.statusCode,
      headers: responseHeaders,
    });
  }

  if (typeof responseBody === 'string') {
    return new NextResponse(responseBody as BodyInit, {
      status: selectedResponse.statusCode,
      headers: responseHeaders,
    });
  }

  return NextResponse.json(responseBody, {
    status: selectedResponse.statusCode,
    headers: responseHeaders,
  });
}

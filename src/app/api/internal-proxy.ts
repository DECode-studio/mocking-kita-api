import { NextResponse } from 'next/server';
import { readDatabase } from '@/src/core/db/database_storage_helper';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { MatchType } from '@/src/core/utils/types';
import { responseCache, throttleStates } from './internal-proxy-cache';

const INTERNAL_ROUTE_PREFIXES = ['/api/auth', '/api/database', '/api/settings'];

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
const THROTTLE_CAPACITY = 30;
const THROTTLE_WINDOW_MS = 10_000;
const THROTTLE_REFILL_PER_MS = THROTTLE_CAPACITY / THROTTLE_WINDOW_MS;

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

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

function countSpecifiedFields(value: unknown): number {
  if (isEmptyValue(value)) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value !== 'object') return 1;
  const objectValue = value as Record<string, unknown>;
  const nestedCount = Object.values(objectValue).reduce<number>((sum, item) => sum + countSpecifiedFields(item), 0);
  return nestedCount || Object.keys(objectValue).length;
}

function matchesExact(expected: unknown, actual: unknown, looseScalars = false): boolean {
  if (isEmptyValue(expected)) return true;
  if (Array.isArray(expected) || (expected && typeof expected === 'object')) {
    return looseScalars ? deepEqualLoose(expected, actual) : deepEqual(expected, actual);
  }
  return String(actual ?? '') === String(expected ?? '');
}

function matchesPartial(expected: unknown, actual: unknown, looseScalars = false): boolean {
  if (isEmptyValue(expected)) return true;

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (expected.length !== actual.length) return false;
    return expected.every((expectedItem, index) => matchesPartial(expectedItem, actual[index], looseScalars));
  }

  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object') return false;
    return objectEntries(expected).every(([key, expectedValue]) =>
      matchesPartial(expectedValue, (actual as Record<string, unknown>)[key], looseScalars)
    );
  }

  return String(actual ?? '') === String(expected ?? '');
}

function matchesRegex(expected: unknown, actual: unknown, looseScalars = false): boolean {
  if (isEmptyValue(expected)) return true;

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
    const target = looseScalars && actual != null ? String(actual) : String(actual ?? '');
    return new RegExp(String(expected)).test(target);
  } catch {
    return false;
  }
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

function matchesValue(expected: unknown, actual: unknown, matchType: MatchType, looseScalars = false): boolean {
  switch (matchType) {
    case 'PARTIAL':
      return matchesPartial(expected, actual, looseScalars);
    case 'REGEX':
      return matchesRegex(expected, actual, looseScalars);
    case 'JSON_SCHEMA':
      return matchesJsonSchema(expected, actual);
    case 'EXACT':
    default:
      return matchesExact(expected, actual, looseScalars);
  }
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key.toLowerCase()] = value;
  });
  return output;
}

function parseBodyContent(contentType: string | null, rawBody: string): unknown {
  if (!rawBody) return {};
  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  }
  return rawBody;
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

function scoreScenarioMatch(
  scenario: RequestScenario,
  actual: {
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    pathParams: Record<string, string>;
    body: unknown;
  }
): ScenarioMatchResult | null {
  const headerMatch = matchesValue(scenario.headers, actual.headers, scenario.matchType, true);
  const queryMatch = matchesValue(scenario.queryParams, actual.queryParams, scenario.matchType, true);
  const pathMatch = matchesValue(scenario.pathParams, actual.pathParams, scenario.matchType, true);
  const bodyMatch = matchesValue(scenario.body, actual.body, scenario.matchType);

  if (!headerMatch || !queryMatch || !pathMatch || !bodyMatch) {
    return null;
  }

  const score =
    (scenario.priority ?? 0) * 100 +
    countSpecifiedFields(scenario.headers) +
    countSpecifiedFields(scenario.queryParams) +
    countSpecifiedFields(scenario.pathParams) +
    countSpecifiedFields(scenario.body);

  return { scenario, score };
}

function chooseWeightedResponse(responses: ResponseScenario[]): ResponseScenario | null {
  if (!responses.length) return null;

  const highestPriority = Math.max(...responses.map((item) => item.priority ?? 0));
  const priorityGroup = responses.filter((item) => (item.priority ?? 0) === highestPriority);
  if (priorityGroup.length === 1) return priorityGroup[0];

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

function makeCacheKey(method: string, pathname: string, queryParams: Record<string, string>, body: unknown): string {
  return JSON.stringify({
    method: method.toUpperCase(),
    pathname,
    queryParams,
    body,
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

export async function handleInternalApiRequest(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const pathname = normalizePath(url.pathname);

  if (isInternalRoute(pathname)) {
    return NextResponse.json({ error: 'Internal route is handled by a dedicated handler' }, { status: 404 });
  }

  const throttle = isThrottled(request, pathname);
  if (throttle.throttled) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        path: pathname,
        method: request.method.toUpperCase(),
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

  const method = request.method.toUpperCase();
  const rawBody = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text();

  const body = parseBodyContent(request.headers.get('content-type'), rawBody);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const cacheKey =
    method === 'GET' || method === 'HEAD' ? makeCacheKey(method, pathname, queryParams, body) : null;
  const cached = cacheKey ? getCachedResponse(cacheKey) : null;
  if (cached) {
    if (method === 'HEAD') {
      const headers = new Headers(cached.headers);
      headers.set('x-cache', 'HIT');
      return new NextResponse(null, {
        status: cached.status,
        headers,
      });
    }
    return responseFromCache(cached);
  }

  const database = readDatabase();
  const headers = normalizeHeaders(request.headers);
  const activeEnvironmentIds = new Set(
    database.environments.filter((environment) => environment.status && !environment.deletedAt).map((environment) => environment.id)
  );

  const apiMatches: ApiMatchResult[] = database.apiCollections
    .filter((api) => api.status && !api.deletedAt)
    .flatMap((api) => {
      const candidates: ApiMatchResult[] = [
        {
          apiId: api.id,
          apiPath: api.path,
          ...matchPathPattern(api.path, pathname),
        },
        ...database.apiEnvironments
          .filter(
            (apiEnvironment) =>
              apiEnvironment.apiId === api.id &&
              apiEnvironment.enabled &&
              !!apiEnvironment.pathOverride &&
              activeEnvironmentIds.has(apiEnvironment.environmentId)
          )
          .map((apiEnvironment) => ({
            apiId: api.id,
            apiPath: apiEnvironment.pathOverride as string,
            ...matchPathPattern(apiEnvironment.pathOverride as string, pathname),
          })),
      ];

      return candidates;
    })
    .sort((a, b) => b.specificity - a.specificity);

  const matchedApi = apiMatches.find((candidate) => {
    const api = database.apiCollections.find((item) => item.id === candidate.apiId);
    return api?.methodRequest === method;
  });

  if (!matchedApi) {
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

  const matchedApiCollection = database.apiCollections.find((api) => api.id === matchedApi.apiId);
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

  const requestScenarios = database.requestScenarios
    .filter((scenario) => scenario.apiId === matchedApi.apiId && scenario.status && !scenario.deletedAt)
    .map((scenario) =>
      scoreScenarioMatch(scenario, {
        headers,
        queryParams,
        pathParams: matchedApi.params,
        body,
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

  const responseScenarios = database.responseScenarios
    .filter((scenario) => scenario.requestScenarioId === matchedRequestScenario.id && scenario.status && !scenario.deletedAt)
    .sort((a, b) => b.priority - a.priority || b.weight - a.weight);

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

  const responseHeaders = new Headers(
    Object.entries(selectedResponse.headers ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = toHeaderValue(value);
      return acc;
    }, {})
  );
  if (!responseHeaders.has('content-type')) {
    responseHeaders.set('content-type', 'application/json');
  }
  responseHeaders.set('x-cache', cacheKey ? 'MISS' : 'BYPASS');
  responseHeaders.set('x-mock-api-id', matchedApi.apiId);
  responseHeaders.set('x-mock-api-path', matchedApi.apiPath);
  responseHeaders.set('x-mock-request-scenario-id', matchedRequestScenario.id);
  responseHeaders.set('x-mock-response-scenario-id', selectedResponse.id);

  if ((selectedResponse.delayMs ?? 0) > 0) {
    await new Promise((resolve) => setTimeout(resolve, selectedResponse.delayMs));
  }

  const responseBody = typeof selectedResponse.body === 'string' ? selectedResponse.body : selectedResponse.body ?? null;
  const responseHeadersObject = headersToObject(responseHeaders);
  if (cacheKey && selectedResponse.statusCode >= 200 && selectedResponse.statusCode < 300) {
    setCachedResponse(cacheKey, {
      status: selectedResponse.statusCode,
      headers: responseHeadersObject,
      body: responseBody,
    });
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

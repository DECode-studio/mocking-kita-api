import { BodyPathRule, MatchStrategy, ParamMatchOperator, ParamRule } from './types';

const MAX_REGEX_PATTERN_LENGTH = 500;

export function hasHighRiskRegexPattern(pattern: string): boolean {
  return /(\([^)]*[+*][^)]*\)[+*?])|(\[[^\]]+\][+*?][+*?])|(\.\*[+*?])/.test(pattern);
}

export function isParamRule(val: unknown): val is ParamRule {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }
  const obj = val as Record<string, unknown>;
  const op = obj.$operator ?? (obj.$rule ? obj.operator : undefined);
  return (
    typeof op === 'string' &&
    ['equal', 'regex', 'regex_i', 'null', 'empty_array'].includes(op)
  );
}

export function extractParamRule(raw: unknown): ParamRule {
  if (isParamRule(raw)) {
    const obj = raw as Record<string, unknown>;
    let op = (obj.$operator || obj.operator) as ParamMatchOperator;
    if ((op as string) === 'regex_i') {
      op = 'regex';
    }
    const value = '$value' in obj ? obj.$value : obj.value;
    const enabled =
      obj.$enabled !== undefined
        ? Boolean(obj.$enabled)
        : obj.enabled !== undefined
        ? Boolean(obj.enabled)
        : true;
    return { operator: op, value, enabled };
  }
  return { operator: 'equal', value: raw, enabled: true };
}

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
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

export function isBinaryFilePlaceholder(value: unknown): boolean {
  if (typeof value === 'string' && (value === '(binary_file_data)' || value.startsWith('(binary_file'))) {
    return true;
  }
  if (value && typeof value === 'object' && 'filename' in (value as Record<string, unknown>)) {
    const fn = String((value as Record<string, unknown>).filename || '');
    return fn === '(binary_file_data)' || fn.startsWith('(binary_file');
  }
  return false;
}

export function evaluateParamOperator(
  operator: ParamMatchOperator,
  expectedValue: unknown,
  actualValue: unknown,
  looseScalars = false
): boolean {
  if (isBinaryFilePlaceholder(expectedValue)) {
    return actualValue != null && !isEmptyValue(actualValue);
  }

  switch (operator) {
    case 'null': {
      if (actualValue === null || actualValue === undefined) return true;
      if (typeof actualValue === 'string' && (actualValue.trim() === '' || actualValue === 'null')) return true;
      return false;
    }

    case 'empty_array': {
      if (Array.isArray(actualValue)) return actualValue.length === 0;
      if (typeof actualValue === 'string') {
        const trimmed = actualValue.trim();
        if (trimmed === '[]') return true;
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) && parsed.length === 0;
        } catch {
          return false;
        }
      }
      return false;
    }

    case 'regex':
    case 'regex_i' as any: {
      const pattern = String(expectedValue ?? '');
      if (!pattern || pattern.length > MAX_REGEX_PATTERN_LENGTH || hasHighRiskRegexPattern(pattern)) {
        return false;
      }
      try {
        const reg = new RegExp(pattern, 'i');
        const target =
          actualValue == null
            ? ''
            : typeof actualValue === 'object'
            ? JSON.stringify(actualValue)
            : String(actualValue);
        return reg.test(target);
      } catch {
        return false;
      }
    }

    case 'equal':
    default: {
      if (isEmptyValue(expectedValue)) return true;
      if (Array.isArray(expectedValue) || (expectedValue && typeof expectedValue === 'object')) {
        return evaluateDeepMatch(expectedValue, actualValue, looseScalars);
      }
      if (looseScalars) {
        return String(actualValue ?? '') === String(expectedValue ?? '');
      }
      return actualValue === expectedValue || String(actualValue ?? '') === String(expectedValue ?? '');
    }
  }
}

export const TOLERATED_HEADERS = new Set([
  // HTTP/1.1 & Transport
  'host',
  'connection',
  'keep-alive',
  'upgrade',
  'transfer-encoding',
  'content-length',
  'content-type',
  'date',
  'server',
  'te',
  'trailer',

  // Client & Browser standard headers
  'user-agent',
  'accept',
  'accept-encoding',
  'accept-language',
  'accept-charset',
  'origin',
  'referer',
  'priority',
  'cookie',

  // Cache Control & Conditional
  'cache-control',
  'pragma',
  'if-none-match',
  'if-modified-since',
  'if-match',
  'if-unmodified-since',
  'if-range',
  'range',

  // Dev tools & testing clients
  'postman-token',

  // Proxies, Load Balancers & Gateways
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-forwarded-port',
  'x-forwarded-server',
  'x-real-ip',
  'x-request-id',
  'x-correlation-id',
]);

export function isToleratedHeader(key: string): boolean {
  const lower = key.trim().toLowerCase();
  if (TOLERATED_HEADERS.has(lower)) return true;
  if (
    lower.startsWith('sec-') ||
    lower.startsWith('cf-') ||
    lower.startsWith('x-nextjs-') ||
    lower.startsWith('x-vercel-') ||
    lower.startsWith('x-amzn-')
  ) {
    return true;
  }
  return false;
}

export function matchesHeadersMap(
  expectedHeaders: Record<string, unknown> | null | undefined,
  actualHeaders: Record<string, unknown> | null | undefined,
  matchStrategy: MatchStrategy = 'ALL'
): boolean {
  const expectedMatches = matchesParamsMap(
    expectedHeaders,
    actualHeaders,
    matchStrategy,
    true,
    true
  );

  if (!expectedMatches) {
    return false;
  }

  if (actualHeaders && typeof actualHeaders === 'object') {
    const expectedKeysLower = new Set(
      expectedHeaders && typeof expectedHeaders === 'object'
        ? Object.entries(expectedHeaders)
            .filter(([_, val]) => {
              if (isEmptyValue(val) && !isParamRule(val)) return false;
              const rule = extractParamRule(val);
              return rule.enabled !== false;
            })
            .map(([k]) => k.toLowerCase())
        : []
    );

    for (const [actualKey, actualValue] of Object.entries(actualHeaders)) {
      if (isEmptyValue(actualValue)) continue;
      const lowerKey = actualKey.toLowerCase();
      if (isToleratedHeader(lowerKey)) continue;

      if (!expectedKeysLower.has(lowerKey)) {
        return false;
      }
    }
  }

  return true;
}

export function matchesParamsMap(
  expectedParams: Record<string, unknown> | null | undefined,
  actualParams: Record<string, unknown> | null | undefined,
  matchStrategy: MatchStrategy = 'ALL',
  looseScalars = true,
  caseInsensitiveKeys = false
): boolean {
  if (!expectedParams || typeof expectedParams !== 'object' || Object.keys(expectedParams).length === 0) {
    return true;
  }

  const entries = Object.entries(expectedParams).filter(([_, val]) => {
    if (isEmptyValue(val) && !isParamRule(val)) return false;
    const rule = extractParamRule(val);
    return rule.enabled !== false;
  });
  if (entries.length === 0) return true;

  const actualMap: Record<string, unknown> = {};
  if (actualParams && typeof actualParams === 'object') {
    if (caseInsensitiveKeys) {
      for (const [k, v] of Object.entries(actualParams)) {
        actualMap[k.toLowerCase()] = v;
      }
    } else {
      Object.assign(actualMap, actualParams);
    }
  }

  // Find matches for each key
  const matchResults = entries.map(([key, expected]) => {
    const rule = extractParamRule(expected);
    const lookupKey = caseInsensitiveKeys ? key.toLowerCase() : key;
    const actual = actualMap[lookupKey];
    return evaluateParamOperator(rule.operator, rule.value, actual, looseScalars);
  });

  if (matchStrategy === 'ANY') {
    return matchResults.some(Boolean);
  }

  return matchResults.every(Boolean);
}

export function evaluateDeepMatch(
  expected: unknown,
  actual: unknown,
  looseScalars = false,
  matchStrategy: MatchStrategy = 'ALL'
): boolean {
  if (isBinaryFilePlaceholder(expected)) {
    return actual != null && !isEmptyValue(actual);
  }

  if (isParamRule(expected)) {
    const rule = extractParamRule(expected);
    if (rule.enabled === false) return true;
    return evaluateParamOperator(rule.operator, rule.value, actual, looseScalars);
  }

  if (isEmptyValue(expected)) {
    return true;
  }

  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (expected.length === 0) return actual.length === 0;

    for (let i = 0; i < expected.length; i++) {
      const expItem = expected[i];
      if (isParamRule(expItem) && extractParamRule(expItem).enabled === false) {
        continue;
      }
      if (!evaluateDeepMatch(expItem, actual[i], looseScalars, 'ALL')) {
        return false;
      }
    }
    return true;
  }

  if (expected && typeof expected === 'object') {
    if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
      return false;
    }

    const actualObj = actual as Record<string, unknown>;
    const expectedObj = expected as Record<string, unknown>;

    const activeEntries = Object.entries(expectedObj).filter(([_, expVal]) => {
      if (isParamRule(expVal)) return extractParamRule(expVal).enabled !== false;
      return !isEmptyValue(expVal);
    });

    if (activeEntries.length === 0) return true;

    if (matchStrategy === 'ANY') {
      return activeEntries.some(([key, expVal]) =>
        evaluateDeepMatch(expVal, actualObj[key], looseScalars, 'ALL')
      );
    }

    return activeEntries.every(([key, expVal]) =>
      evaluateDeepMatch(expVal, actualObj[key], looseScalars, 'ALL')
    );
  }

  return evaluateParamOperator('equal', expected, actual, looseScalars);
}

export function matchesStructure(expected: unknown, actual: unknown): boolean {
  if (expected == null || isEmptyValue(expected)) {
    return true;
  }

  let resolvedExpected = expected;
  if (typeof resolvedExpected === 'string') {
    try {
      const trimmed = resolvedExpected.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        resolvedExpected = JSON.parse(trimmed);
      }
    } catch {}
  }

  let resolvedActual = actual;
  if (typeof resolvedActual === 'string') {
    try {
      const trimmed = resolvedActual.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        resolvedActual = JSON.parse(trimmed);
      }
    } catch {}
  }

  if (isParamRule(resolvedExpected)) {
    const rule = extractParamRule(resolvedExpected);
    if (rule.enabled === false) return true;
    return resolvedActual !== undefined;
  }

  if (Array.isArray(resolvedExpected)) {
    if (!Array.isArray(resolvedActual)) return false;
    if (resolvedExpected.length === 0 || resolvedActual.length === 0) return true;

    const sampleItem = resolvedExpected[0];
    if (sampleItem && typeof sampleItem === 'object') {
      return (resolvedActual as unknown[]).every((actItem) => matchesStructure(sampleItem, actItem));
    }

    return true;
  }

  if (resolvedExpected && typeof resolvedExpected === 'object') {
    if (!resolvedActual || typeof resolvedActual !== 'object' || Array.isArray(resolvedActual)) {
      return false;
    }

    const expObj = resolvedExpected as Record<string, unknown>;
    const actObj = resolvedActual as Record<string, unknown>;

    for (const [key, expVal] of Object.entries(expObj)) {
      if (isParamRule(expVal)) {
        const rule = extractParamRule(expVal);
        if (rule.enabled === false) continue;
      }
      if (isEmptyValue(expVal)) continue;

      if (!(key in actObj)) {
        return false;
      }

      if (!matchesStructure(expVal, actObj[key])) {
        return false;
      }
    }

    return true;
  }

  return resolvedActual !== undefined;
}

export function updateDeepPath(
  targetObj: unknown,
  path: (string | number)[],
  updater: (current: unknown) => unknown
): unknown {
  if (path.length === 0) {
    return updater(targetObj);
  }

  const [head, ...tail] = path;

  if (typeof head === 'number' || (Array.isArray(targetObj) && !isNaN(Number(head)))) {
    const idx = Number(head);
    const arr = Array.isArray(targetObj) ? [...targetObj] : [];
    arr[idx] = updateDeepPath(arr[idx], tail, updater);
    return arr;
  }

  const key = String(head);
  const obj =
    targetObj && typeof targetObj === 'object' && !Array.isArray(targetObj)
      ? { ...(targetObj as Record<string, unknown>) }
      : {};

  obj[key] = updateDeepPath(obj[key], tail, updater);
  return obj;
}

export function extractAllJsonPaths(data: unknown, prefix = ''): Array<{ path: string; sampleValue?: unknown }> {
  if (data == null) return [];

  let resolvedData = data;
  if (isParamRule(data)) {
    resolvedData = extractParamRule(data).value;
  }

  if (typeof resolvedData === 'string') {
    try {
      const trimmed = resolvedData.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        resolvedData = JSON.parse(trimmed);
      }
    } catch {}
  }

  if (resolvedData == null || typeof resolvedData !== 'object') {
    if (prefix) {
      return [{ path: prefix, sampleValue: resolvedData }];
    }
    return [];
  }

  const results: Array<{ path: string; sampleValue?: unknown }> = [];

  if (Array.isArray(resolvedData)) {
    if (prefix) {
      results.push({ path: prefix, sampleValue: resolvedData });
    }
    resolvedData.forEach((item, index) => {
      const currentPath = prefix ? `${prefix}.${index}` : `${index}`;
      let actualItem = item;
      if (isParamRule(item)) {
        actualItem = extractParamRule(item).value;
      }
      if (actualItem !== null && typeof actualItem === 'object') {
        results.push({ path: currentPath, sampleValue: actualItem });
        results.push(...extractAllJsonPaths(actualItem, currentPath));
      } else {
        results.push({ path: currentPath, sampleValue: actualItem });
      }
    });
  } else {
    if (prefix) {
      results.push({ path: prefix, sampleValue: resolvedData });
    }
    for (const [key, value] of Object.entries(resolvedData as Record<string, unknown>)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      let actualValue = value;
      if (isParamRule(value)) {
        actualValue = extractParamRule(value).value;
      }
      if (actualValue !== null && typeof actualValue === 'object') {
        results.push({ path: currentPath, sampleValue: actualValue });
        results.push(...extractAllJsonPaths(actualValue, currentPath));
      } else {
        results.push({ path: currentPath, sampleValue: actualValue });
      }
    }
  }

  // Deduplicate by path preserving order
  const seen = new Set<string>();
  return results.filter((item) => {
    if (!item.path || seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

export function getValueByPath(data: unknown, path: string): unknown {
  if (data == null || !path) return undefined;

  let resolvedData = data;
  if (typeof resolvedData === 'string') {
    try {
      const trimmed = resolvedData.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        resolvedData = JSON.parse(trimmed);
      }
    } catch {}
  }

  // Normalize bracket notation e.g. debitur[0].id_number -> debitur.0.id_number
  const normalizedPath = path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '');

  const segments = normalizedPath.split('.').filter(Boolean);
  let current: any = resolvedData;

  for (const segment of segments) {
    if (current == null) return undefined;

    if (isParamRule(current)) {
      current = extractParamRule(current).value;
    }

    if (typeof current === 'object') {
      if (Array.isArray(current) && !isNaN(Number(segment))) {
        current = current[Number(segment)];
      } else if (segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  if (isParamRule(current)) {
    return extractParamRule(current).value;
  }

  return current;
}

export function evaluateBodyPathRules(
  rules: BodyPathRule[] | undefined | null,
  actualBody: unknown,
  matchStrategy: MatchStrategy = 'ALL',
  looseScalars = true
): boolean {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return true;
  }

  const activeRules = rules.filter(
    (r) => r && r.enabled !== false && r.path && r.path.trim() !== ''
  );
  if (activeRules.length === 0) {
    return true;
  }

  const matchResults = activeRules.map((rule) => {
    const actualVal = getValueByPath(actualBody, rule.path.trim());
    return evaluateParamOperator(rule.operator, rule.value, actualVal, looseScalars);
  });

  if (matchStrategy === 'ANY') {
    return matchResults.some(Boolean);
  }

  return matchResults.every(Boolean);
}


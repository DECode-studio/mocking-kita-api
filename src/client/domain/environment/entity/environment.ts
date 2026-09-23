import { EnvironmentType } from '@/src/core/utils/types';

export const ALL_ENVIRONMENT_TYPES: EnvironmentType[] = [
  'LOCAL',
  'DEVELOPMENT',
  'TESTING',
  'STAGING',
  'PRODUCTION',
];

export type EnvironmentValuesMap = Partial<Record<EnvironmentType, string | null>>;

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  type?: 'plain' | 'secret';
  enabled?: boolean;
  description?: string;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  isBaseUrl?: boolean;
  values?: EnvironmentValuesMap;
  environmentType?: EnvironmentType | null;
  variables?: EnvironmentVariable[];
  baseUrl?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Parses raw JSON or object representation of values into a typed EnvironmentValuesMap.
 * Enforces rule: if isBaseUrl is true, LOCAL value is always null.
 */
export function normalizeEnvironmentValues(
  rawValues: any,
  isBaseUrl: boolean = true
): EnvironmentValuesMap {
  let parsed: Record<string, any> = {};

  if (typeof rawValues === 'string') {
    try {
      const obj = JSON.parse(rawValues);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        parsed = obj;
      }
    } catch {
      parsed = {};
    }
  } else if (rawValues && typeof rawValues === 'object' && !Array.isArray(rawValues)) {
    parsed = rawValues;
  }

  const result: EnvironmentValuesMap = {};
  for (const envType of ALL_ENVIRONMENT_TYPES) {
    if (isBaseUrl && envType === 'LOCAL') {
      result[envType] = null;
      continue;
    }

    const val = parsed[envType];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      result[envType] = String(val).trim();
    } else {
      result[envType] = null;
    }
  }

  return result;
}

export function parseRawVariables(raw: any): EnvironmentVariable[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: item.id || item.key || 'var-' + Math.random().toString(36).substring(2, 9),
        key: String(item.key || ''),
        value: typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? ''),
        type: (item.type === 'secret' ? 'secret' : 'plain') as 'plain' | 'secret',
        enabled: item.enabled !== false,
        description: item.description ? String(item.description) : undefined,
      }))
      .filter((v) => v.key.trim().length > 0);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseRawVariables(parsed);
      if (parsed && typeof parsed === 'object') {
        return parseRawVariables(parsed);
      }
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .filter(([k]) => k && k.trim().length > 0)
      .map(([k, v]) => ({
        id: k,
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
        type: 'plain',
        enabled: true,
      }));
  }
  return [];
}

/**
 * Gets value for a specific stage from an environment.
 */
export function getEnvironmentValue(
  env?: { values?: any; environmentType?: string | null; baseUrl?: string | null; variables?: any } | null,
  targetStage?: EnvironmentType | string | null
): string {
  if (!env) return '';

  const isBaseUrl = (env as any).isBaseUrl !== false;
  const values = normalizeEnvironmentValues(env.values, isBaseUrl);

  if (targetStage && targetStage in values) {
    const val = values[targetStage as EnvironmentType];
    if (val) return val;
  }

  // Fallback to legacy single baseUrl or variables if targetStage matches
  if (targetStage && env.environmentType === targetStage) {
    if (env.baseUrl) return String(env.baseUrl).trim();
    const vars = parseRawVariables(env.variables);
    const found = vars.find(
      (v) => (v.key === 'baseUrl' || v.key.toLowerCase() === 'base_url') && v.enabled !== false
    );
    if (found && found.value) return String(found.value).trim();
  }

  return '';
}

/**
 * Helper to resolve the effective base URL from an environment.
 * If targetStage is specified, resolves that specific stage's base URL.
 * If targetStage is omitted, returns the first populated base URL (priority: DEV, STAGING, TESTING, PROD).
 */
export function getEnvironmentBaseUrl(
  env?: { values?: any; isBaseUrl?: boolean; environmentType?: string | null; variables?: any; baseUrl?: string | null } | null,
  targetStage?: EnvironmentType | string | null
): string {
  if (!env) return '';
  if (env.isBaseUrl === false) return '';

  const values = normalizeEnvironmentValues(env.values, true);

  if (targetStage) {
    if (targetStage === 'LOCAL') return '';
    const stageVal = values[targetStage as EnvironmentType];
    if (stageVal) return stageVal;

    // Fallback: check legacy single-environment format
    if (!env.environmentType || env.environmentType === targetStage) {
      if (env.baseUrl) {
        return String(env.baseUrl).trim();
      }
      const vars = parseRawVariables(env.variables);
      if (vars.length > 0) {
        const found = vars.find(
          (v) =>
            (v.key === 'baseUrl' ||
              v.key.toLowerCase() === 'base_url' ||
              v.key.toLowerCase() === 'baseurl') &&
            v.enabled !== false
        );
        if (found && found.value) return String(found.value).trim();
      }
    }
    return '';
  }

  // Default display (targetStage not specified): check priority stages
  const priorityOrder: EnvironmentType[] = ['DEVELOPMENT', 'STAGING', 'TESTING', 'PRODUCTION'];
  for (const stage of priorityOrder) {
    const val = values[stage];
    if (val) return val;
  }

  // Fallback to variables array
  const vars = parseRawVariables(env.variables);
  if (vars.length > 0) {
    const found = vars.find(
      (v) =>
        (v.key === 'baseUrl' ||
          v.key.toLowerCase() === 'base_url' ||
          v.key.toLowerCase() === 'baseurl') &&
        v.enabled !== false
    );
    if (found && found.value) return String(found.value).trim();
  }
  if (env.baseUrl) return String(env.baseUrl).trim();
  return '';
}

/**
 * Helper to convert environment variables array to a key-value record.
 */
export function getEnvironmentVariablesMap(
  env?: { values?: any; isBaseUrl?: boolean; name?: string; variables?: any } | null,
  targetStage?: EnvironmentType | string | null
): Record<string, string> {
  if (!env) return {};
  const map: Record<string, string> = {};

  // If this is a variable set (isBaseUrl === false) and targetStage is provided
  if (env.isBaseUrl === false && targetStage && env.name) {
    const values = normalizeEnvironmentValues(env.values, false);
    const stageVal = values[targetStage as EnvironmentType];
    if (stageVal !== undefined && stageVal !== null) {
      map[env.name] = stageVal;
    }
  }

  // Also include any granular variables
  const vars = parseRawVariables(env.variables);
  for (const v of vars) {
    if (v.enabled !== false && v.key) {
      map[v.key] = v.value ?? '';
    }
  }
  return map;
}

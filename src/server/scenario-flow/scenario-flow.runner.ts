import crypto from 'crypto';
import { generateId } from '@/src/core/utils/uuid';
import {
  AssertionRule,
  AssertionResult,
  FlowRunOptions,
  VariableExtractor,
} from './scenario-flow.types';
import {
  getScenarioFlowById,
  createExecutionRecord,
  updateExecutionRecord,
  createExecutionStepRecord,
} from './scenario-flow.repository';
import prisma from '@/src/core/db/prisma-client';
import {
  getEnvironmentBaseUrl,
  getEnvironmentValue,
  getEnvironmentVariablesMap,
} from '@/src/client/domain/environment/entity/environment';

/**
 * Extract nested value by dot or bracket notation, e.g. "data.users[0].id"
 */
export function getNestedValue(obj: any, path: string): any {
  if (obj === null || obj === undefined || !path) return undefined;
  
  // Normalise array bracket access: "items[0].id" -> "items.0.id"
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalizedPath.split('.');
  
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Handle dynamic generator helpers like {{$uuid}}, {{$timestamp}}, {{$randomInt}}
 */
function resolveDynamicGenerator(token: string): any {
  switch (token.toLowerCase()) {
    case '$uuid':
      return generateId();
    case '$timestamp':
      return Date.now().toString();
    case '$isodate':
      return new Date().toISOString();
    case '$randomint':
      return Math.floor(Math.random() * 1000000);
    case '$randomemail':
      return `test_${Math.floor(Math.random() * 10000)}@example.com`;
    default:
      return null;
  }
}

/**
 * Resolves datasheet tokens like {{datasheet.emails.random}} or {{datasheet.emails.next}} or {{datasheet.emails[0]}}
 */
function resolveDataSheetToken(
  varKey: string,
  variables: Record<string, any>,
  counters?: Record<string, number>
): any {
  if (!varKey.startsWith('datasheet.')) return undefined;

  const normalized = varKey.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalized.split('.');
  // parts[0] is 'datasheet'
  const sheetCode = parts[1];
  const pool = variables.datasheet?.[sheetCode];
  if (!Array.isArray(pool) || pool.length === 0) {
    return undefined;
  }

  const modifier = parts[2];
  let selectedItem: any;
  let remainingStartIdx = 3;

  if (modifier === 'random' || modifier === '$random') {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selectedItem = pool[randomIndex];
  } else if (
    modifier === 'asc' ||
    modifier === 'next' ||
    modifier === '$next' ||
    modifier === 'inc'
  ) {
    if (!counters) {
      selectedItem = pool[0];
    } else {
      const ascKey = `${sheetCode}_asc`;
      const idx = (counters[ascKey] ?? counters[sheetCode] ?? 0) % pool.length;
      counters[ascKey] = idx + 1;
      counters[sheetCode] = idx + 1;
      selectedItem = pool[idx];
    }
  } else if (
    modifier === 'desc' ||
    modifier === 'dsc' ||
    modifier === 'prev' ||
    modifier === '$prev' ||
    modifier === 'dec'
  ) {
    if (!counters) {
      selectedItem = pool[pool.length - 1];
    } else {
      const descKey = `${sheetCode}_desc`;
      const count = counters[descKey] ?? 0;
      const idx = ((pool.length - 1 - (count % pool.length)) + pool.length) % pool.length;
      counters[descKey] = count + 1;
      selectedItem = pool[idx];
    }
  } else if (!isNaN(Number(modifier))) {
    const idx = Number(modifier);
    selectedItem = pool[idx];
  } else {
    return undefined;
  }

  if (parts.length > remainingStartIdx && selectedItem && typeof selectedItem === 'object') {
    const subPath = parts.slice(remainingStartIdx).join('.');
    return getNestedValue(selectedItem, subPath);
  }

  return selectedItem;
}

/**
 * Interpolates string or objects with variable values, dynamic generators, and data sheet tokens
 */
export function interpolateVariables(
  template: any,
  variables: Record<string, any>,
  counters?: Record<string, number>
): any {
  if (typeof template === 'string') {
    // Check if entire string is single variable substitution e.g. "{{count}}" or "{{datasheet.emails.random}}"
    const exactMatch = template.match(/^\{\{\s*([^\}]+?)\s*\}\}$/);
    if (exactMatch) {
      const varKey = exactMatch[1].trim();
      const dynamicVal = resolveDynamicGenerator(varKey);
      if (dynamicVal !== null) return dynamicVal;

      const dsVal = resolveDataSheetToken(varKey, variables, counters);
      if (dsVal !== undefined) return dsVal;

      const val = getNestedValue(variables, varKey);
      return val !== undefined ? val : template;
    }

    // Replace all {{var}} inside string
    return template.replace(/\{\{\s*([^\}]+?)\s*\}\}/g, (_match, rawVarKey) => {
      const varKey = rawVarKey.trim();
      const dynamicVal = resolveDynamicGenerator(varKey);
      if (dynamicVal !== null) return String(dynamicVal);

      const dsVal = resolveDataSheetToken(varKey, variables, counters);
      if (dsVal !== undefined && dsVal !== null) {
        return typeof dsVal === 'object' ? JSON.stringify(dsVal) : String(dsVal);
      }

      const val = getNestedValue(variables, varKey);
      return val !== undefined && val !== null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '';
    });
  }

  if (Array.isArray(template)) {
    return template.map((item) => interpolateVariables(item, variables, counters));
  }

  if (template !== null && typeof template === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = interpolateVariables(value, variables, counters);
    }
    return result;
  }

  return template;
}

/**
 * Global in-memory persistent counters for scenario flows across multiple runs.
 */
export const persistentFlowCounters: Record<string, number> = {};

export function resetPersistentFlowCounters(flowId?: string): void {
  if (!flowId) {
    for (const k of Object.keys(persistentFlowCounters)) {
      delete persistentFlowCounters[k];
    }
  } else {
    const prefix = `${flowId}:`;
    for (const k of Object.keys(persistentFlowCounters)) {
      if (k.startsWith(prefix)) {
        delete persistentFlowCounters[k];
      }
    }
  }
}

/**
 * Creates a step-scoped counter proxy so that multiple references to the same
 * sheet modifier (e.g. users.asc.id and users.asc.name) in a single step resolve
 * to the exact same row index, and the master counter is incremented once per used modifier at step completion.
 */
export function createStepDataSheetCounters(masterCounters: Record<string, number>) {
  const stepIndices: Record<string, number> = {};
  const usedKeys = new Set<string>();

  const proxy = new Proxy(masterCounters, {
    get(target, prop: string) {
      if (typeof prop !== 'string') return undefined;
      if (stepIndices[prop] === undefined) {
        stepIndices[prop] = target[prop] ?? 0;
      }
      return stepIndices[prop];
    },
    set(_target, prop: string, _val: number) {
      if (typeof prop === 'string') {
        usedKeys.add(prop);
      }
      return true;
    },
  });

  const commitStep = () => {
    for (const key of usedKeys) {
      masterCounters[key] = (masterCounters[key] ?? 0) + 1;
    }
  };

  return { stepCounters: proxy, commitStep };
}

/**
 * Standardizes and normalizes HTTP headers adhering to flutter-package-core / network standards:
 * - Deduplicates keys case-insensitively (e.g. eliminates duplicate Content-Type vs content-type)
 * - Automatically injects x-request-id (UUID v4) if not present (matches XRequestIdInterceptor)
 * - Automatically injects x-device-id if device_code/deviceId is in variables (matches XDeviceIdInterceptor)
 * - Automatically injects apikey if flow variables contain apikey/apigeeApiKey (matches AuthHeaderInterceptor)
 * - Sets default Content-Type and Accept to application/json
 */
export function buildNormalizedHeaders(
  scenarioHeaders: Record<string, string> | undefined | null,
  overrideHeaders: Record<string, string> | undefined | null,
  variables: Record<string, any>,
  counters?: Record<string, number>,
  bodyType?: string
): Record<string, string> {
  const normalized: Record<string, string> = {};

  const setHeader = (headerKey: string, headerValue: any) => {
    if (headerValue === undefined || headerValue === null || headerValue === '') return;
    // Find existing key case-insensitively and remove so casing is unified
    const lower = headerKey.toLowerCase();
    for (const k of Object.keys(normalized)) {
      if (k.toLowerCase() === lower) {
        delete normalized[k];
      }
    }
    normalized[headerKey] = String(headerValue);
  };

  // 1. Standard base headers (matches flutter-package-core Dio defaults)
  const normalizedBodyType = (bodyType || 'JSON').toUpperCase();
  if (normalizedBodyType === 'FORM_DATA') {
    // For multipart/form-data, fetch automatically sets Content-Type with boundary.
    setHeader('Accept', 'application/json');
  } else if (normalizedBodyType === 'URL_ENCODED') {
    setHeader('Content-Type', 'application/x-www-form-urlencoded');
    setHeader('Accept', 'application/json');
  } else if (normalizedBodyType === 'NONE') {
    setHeader('Accept', 'application/json');
  } else {
    setHeader('Content-Type', 'application/json');
    setHeader('Accept', 'application/json');
  }

  // 2. Merge scenario headers
  if (scenarioHeaders && typeof scenarioHeaders === 'object') {
    for (const [k, v] of Object.entries(scenarioHeaders)) {
      setHeader(k, v);
    }
  }

  // 3. Merge override headers
  if (overrideHeaders && typeof overrideHeaders === 'object') {
    for (const [k, v] of Object.entries(overrideHeaders)) {
      setHeader(k, v);
    }
  }

  // 4. Interpolate variables in all values
  const interpolated: Record<string, string> = {};
  for (const [k, v] of Object.entries(normalized)) {
    interpolated[k] = String(interpolateVariables(v, variables, counters));
  }

  // If FORM_DATA, strip manually added Content-Type without boundary so fetch can generate it
  if (normalizedBodyType === 'FORM_DATA') {
    for (const k of Object.keys(interpolated)) {
      if (k.toLowerCase() === 'content-type') {
        const val = interpolated[k].toLowerCase();
        if (val.includes('application/json') || (val.includes('multipart/form-data') && !val.includes('boundary='))) {
          delete interpolated[k];
        }
      }
    }
  }

  // 5. Standard flutter-package-core client headers injection:
  // x-request-id (matches XRequestIdInterceptor)
  const hasRequestId = Object.keys(interpolated).some((k) => k.toLowerCase() === 'x-request-id');
  if (!hasRequestId) {
    const reqId = variables['x-request-id'] || crypto.randomUUID();
    interpolated['x-request-id'] = String(reqId);
  }

  // x-device-id (matches XDeviceIdInterceptor)
  const hasDeviceId = Object.keys(interpolated).some((k) => k.toLowerCase() === 'x-device-id');
  if (!hasDeviceId) {
    const devId = variables['x-device-id'] || variables.device_code || variables.deviceCode;
    if (devId) {
      interpolated['x-device-id'] = String(devId);
    }
  }

  // apikey (matches AuthHeaderInterceptor)
  const hasApiKey = Object.keys(interpolated).some((k) => k.toLowerCase() === 'apikey');
  if (!hasApiKey) {
    const key = variables.apikey || variables.apigeeApiKey || variables.apiKey;
    if (key) {
      interpolated['apikey'] = String(key);
    }
  }

  return interpolated;
}

/**
 * Evaluates a single assertion rule against actual response
 */
export function evaluateAssertion(
  rule: AssertionRule,
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
    responseTimeMs: number;
  },
  variables?: Record<string, any>,
  counters?: Record<string, number>
): AssertionResult {
  let actual: any;
  let passed = false;

  switch (rule.type) {
    case 'statusCode':
      actual = response.status;
      break;
    case 'responseTime':
      actual = response.responseTimeMs;
      break;
    case 'header':
      if (rule.path) {
        const headerKey = Object.keys(response.headers).find(
          (k) => k.toLowerCase() === rule.path!.toLowerCase()
        );
        actual = headerKey ? response.headers[headerKey] : undefined;
      }
      break;
    case 'bodyPath':
      actual = rule.path ? getNestedValue(response.body, rule.path) : response.body;
      break;
    default:
      actual = undefined;
  }

  const rawExpected = rule.expected;
  const expected =
    variables && rawExpected !== undefined && rawExpected !== null
      ? interpolateVariables(rawExpected, variables, counters)
      : rawExpected;

  switch (rule.operator) {
    case 'equals':
      passed = actual == expected;
      break;
    case 'notEquals':
      passed = actual != expected;
      break;
    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        passed = actual.includes(expected);
      } else if (Array.isArray(actual)) {
        passed = actual.includes(expected);
      } else {
        passed = false;
      }
      break;
    case 'notContains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        passed = !actual.includes(expected);
      } else if (Array.isArray(actual)) {
        passed = !actual.includes(expected);
      } else {
        passed = true;
      }
      break;
    case 'exists':
      passed = actual !== undefined && actual !== null;
      break;
    case 'notExists':
      passed = actual === undefined || actual === null;
      break;
    case 'greaterThan':
      passed = Number(actual) > Number(expected);
      break;
    case 'lessThan':
      passed = Number(actual) < Number(expected);
      break;
    case 'in_datasheet': {
      const targetCode = String(rawExpected || '')
        .replace(/^\{\{\s*datasheet\./, '')
        .replace(/\s*\}\}$/, '')
        .replace(/^datasheet\./, '')
        .trim();
      const pool =
        variables?.datasheet && Array.isArray(variables.datasheet[targetCode])
          ? variables.datasheet[targetCode]
          : [];
      passed = pool.some((item) => {
        if (typeof item === 'object') {
          return JSON.stringify(item) === JSON.stringify(actual);
        }
        return String(item) === String(actual);
      });
      break;
    }
    default:
      passed = false;
  }

  return {
    rule,
    passed,
    actual,
    message: passed
      ? `Assertion passed: ${rule.type} ${rule.operator} ${expected ?? ''}`
      : `Assertion failed: expected ${rule.type} ${rule.operator} ${expected ?? ''}, but got ${JSON.stringify(actual)}`,
  };
}

/**
 * Extracts variables from response based on rules
 */
export function extractVariables(
  extractors: VariableExtractor[] | undefined | null,
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  }
): Record<string, any> {
  const extracted: Record<string, any> = {};
  if (!extractors || !Array.isArray(extractors)) return extracted;

  for (const ext of extractors) {
    let val: any;
    if (ext.from === 'status') {
      val = response.status;
    } else if (ext.from === 'headers') {
      const headerKey = Object.keys(response.headers).find(
        (k) => k.toLowerCase() === ext.path.toLowerCase()
      );
      val = headerKey ? response.headers[headerKey] : undefined;
    } else {
      // Default to body
      val = getNestedValue(response.body, ext.path);
    }

    if (val !== undefined) {
      extracted[ext.variable] = val;
    } else if (ext.defaultValue !== undefined) {
      extracted[ext.variable] = ext.defaultValue;
    }
  }

  return extracted;
}

/**
 * Resolves the effective base URL for a step:
 * - If step.targetEnvironmentType === 'LOCAL', overrides to local APP_URL.
 * - Otherwise inherits targetEnvType from header:
 *   1. Resolves via step.api.apiEnvironments (Option A)
 *   2. Falls back to projectEnvironments
 *   3. Falls back to variables.baseUrl
 */
export function resolveStepBaseUrl(
  step: { targetEnvironmentType?: string | null; targetEnvironment?: string | null; api?: any },
  targetEnvType: string,
  projectEnvironments: Array<any> = [],
  currentVariables: Record<string, any> = {}
): string {
  const isStepLocal = (step as any).targetEnvironmentType === 'LOCAL';
  const effectiveStepEnvType = isStepLocal ? 'LOCAL' : targetEnvType;

  if (effectiveStepEnvType === 'LOCAL') {
    const defaultPort = process.env.PORT || '3000';
    return (process.env.APP_URL || `http://localhost:${defaultPort}`).replace(/\/+$/, '');
  }

  // Check explicit targetEnvironment if specified on step or step.api (can be ID, name, or slug)
  const apiEnvs = (step.api as any)?.apiEnvironments || [];
  const explicitTarget = String(
    (step as any).targetEnvironment || (step.api as any)?.targetEnvironment || ''
  ).trim();

  if (explicitTarget) {
    const explicitTargetLower = explicitTarget.toLowerCase();
    const explicitSlug = explicitTargetLower.replace(/[^a-z0-9]+/g, '-');

    // 1. Check in step.api.apiEnvironments
    const matchedByTargetInApi = apiEnvs.find((ae: any) => {
      const env = ae.environment;
      if (!env || env.status === false || ae.enabled === false) return false;
      const envName = (env.name || '').toLowerCase();
      const envSlug = envName.replace(/[^a-z0-9]+/g, '-');
      const matchesTarget =
        ae.environmentId === explicitTarget ||
        env.id === explicitTarget ||
        envName === explicitTargetLower ||
        envSlug === explicitSlug ||
        envSlug.includes(explicitSlug) ||
        explicitSlug.includes(envSlug);
      if (!matchesTarget) return false;
      if (env.environmentType && env.environmentType !== effectiveStepEnvType) {
        if (!env.values || !env.values[effectiveStepEnvType]) return false;
      }
      return true;
    });

    if (matchedByTargetInApi?.environment) {
      const url = getEnvironmentBaseUrl(matchedByTargetInApi.environment, effectiveStepEnvType);
      if (url) return url.replace(/\/+$/, '');
    }

    // 2. Check in projectEnvironments
    const matchedByTargetInProj = projectEnvironments.find((e: any) => {
      if (e.status === false) return false;
      const envName = (e.name || '').toLowerCase();
      const envSlug = envName.replace(/[^a-z0-9]+/g, '-');
      const matchesTarget =
        e.id === explicitTarget ||
        envName === explicitTargetLower ||
        envSlug === explicitSlug ||
        envSlug.includes(explicitSlug) ||
        explicitSlug.includes(envSlug);
      if (!matchesTarget) return false;
      if (e.environmentType && e.environmentType !== effectiveStepEnvType) {
        if (!e.values || !e.values[effectiveStepEnvType]) return false;
      }
      return true;
    });

    if (matchedByTargetInProj) {
      const url = getEnvironmentBaseUrl(matchedByTargetInProj, effectiveStepEnvType);
      if (url) return url.replace(/\/+$/, '');
    }
  }

  // Option A: Check step.api.apiEnvironments (first enabled Base URL environment)
  for (const ae of apiEnvs) {
    if (ae.enabled !== false && ae.environment && ae.environment.status !== false) {
      const url = getEnvironmentBaseUrl(ae.environment, effectiveStepEnvType);
      if (url) return url.replace(/\/+$/, '');
    }
  }

  // Fallback: Check projectEnvironments (first Base URL environment with a URL for effectiveStepEnvType)
  for (const pe of projectEnvironments) {
    if (pe.status !== false) {
      const url = getEnvironmentBaseUrl(pe, effectiveStepEnvType);
      if (url) return url.replace(/\/+$/, '');
    }
  }

  // Fallback: Check variables.baseUrl if present
  if (currentVariables.baseUrl) {
    return String(currentVariables.baseUrl).replace(/\/+$/, '');
  }

  return '';
}

/**
 * Main Server-Side Scenario Flow Execution Engine
 */
export async function executeScenarioFlow(
  flowId: string,
  options: FlowRunOptions = {}
) {
  const flow = await getScenarioFlowById(flowId);
  if (!flow) {
    throw new Error(`Scenario flow with ID '${flowId}' not found.`);
  }

  // 1. Resolve Target Environment Stage
  let targetEnvType = options.environmentType || null;
  let recordedEnvId = options.environmentId || null;

  if (options.environmentId && !targetEnvType) {
    const env = await prisma.environment.findUnique({
      where: { id: options.environmentId },
    });
    if (env) {
      targetEnvType = env.environmentType || 'DEVELOPMENT';
      recordedEnvId = env.id;
    }
  }

  if (!targetEnvType && flow.defaultEnvironmentId) {
    const defaultEnv = await prisma.environment.findUnique({
      where: { id: flow.defaultEnvironmentId },
    });
    if (defaultEnv) {
      targetEnvType = defaultEnv.environmentType || 'DEVELOPMENT';
      if (!recordedEnvId) recordedEnvId = defaultEnv.id;
    }
  }

  if (!targetEnvType) {
    targetEnvType = 'DEVELOPMENT';
  }

  // Pre-load project environments
  const projectEnvironments = flow.projectId
    ? await prisma.environment.findMany({
        where: { projectId: flow.projectId, deletedAt: null },
      })
    : [];

  if (!recordedEnvId && projectEnvironments.length > 0) {
    const firstBaseUrlEnv = projectEnvironments.find((e) => e.isBaseUrl !== false && e.status);
    recordedEnvId = firstBaseUrlEnv ? firstBaseUrlEnv.id : projectEnvironments[0]?.id || null;
  }

  let stepsToRun = flow.steps.filter((s) => s.enabled);
  if (options.stepId) {
    const singleStep = flow.steps.find((s) => s.id === options.stepId);
    if (!singleStep) {
      throw new Error(`Step with ID '${options.stepId}' not found in scenario flow.`);
    }
    stepsToRun = [singleStep];
  }

  // Extract variables from all active project environments for the target stage
  let activeEnvVars: Record<string, string> = {};

  // 1. Extract non-baseUrl matrix variables (e.g. API keys, secrets) for active stage
  for (const envRecord of projectEnvironments) {
    if (envRecord.status === false) continue;
    if (envRecord.isBaseUrl === false && envRecord.name) {
      const stageVal = getEnvironmentValue(envRecord, targetEnvType);
      if (stageVal) {
        activeEnvVars[envRecord.name] = stageVal;
        const normalizedKey = envRecord.name.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
        if (normalizedKey && !activeEnvVars[normalizedKey]) {
          activeEnvVars[normalizedKey] = stageVal;
        }
      }
    }
    // Also include granular variables if present
    const envVars = getEnvironmentVariablesMap(envRecord, targetEnvType);
    activeEnvVars = { ...activeEnvVars, ...envVars };
  }

  // 2. Specific recorded environment variables if available
  const activeEnvRecord = recordedEnvId
    ? projectEnvironments.find((e) => e.id === recordedEnvId) ||
      (await prisma.environment.findUnique({ where: { id: recordedEnvId } }))
    : null;

  if (activeEnvRecord) {
    const specificVars = getEnvironmentVariablesMap(activeEnvRecord, targetEnvType);
    activeEnvVars = { ...activeEnvVars, ...specificVars };
  }

  // Initialize runtime variables
  // Priority: Active Env Variables -> Flow Variables -> Runtime Invocation Variables
  const initialFlowVars = (flow.variables as Record<string, any>) || {};
  const currentVariables: Record<string, any> = {
    ...activeEnvVars,
    env: activeEnvVars, // makes both {{API_KEY}} and {{env.API_KEY}} available
    ...initialFlowVars,
    ...(options.initialVariables || {}),
  };

  // Load Active Data Sheets for project or global
  try {
    const activeDataSheets = await prisma.dataSheet.findMany({
      where: {
        status: true,
        deletedAt: null,
        OR: [
          ...(flow.projectId ? [{ projectId: flow.projectId }] : []),
          { projectId: null },
        ],
      },
    });

    const datasheetPools: Record<string, any[]> = {};
    for (const ds of activeDataSheets) {
      datasheetPools[ds.code] = Array.isArray(ds.data) ? ds.data : [];
    }
    currentVariables['datasheet'] = datasheetPools;
  } catch (err) {
    console.warn('Failed to pre-load data sheets for scenario flow execution:', err);
  }

  // Load persistent counters: from DB flow.variables._dataSheetCounters, overlaid with in-memory persistentFlowCounters
  const flowSavedCounters =
    ((flow.variables as Record<string, any>)?._dataSheetCounters as Record<string, number>) || {};

  const dataSheetCounters: Record<string, number> = {
    ...flowSavedCounters,
  };

  const flowPrefix = `${flow.id}:`;
  for (const [k, v] of Object.entries(persistentFlowCounters)) {
    if (k.startsWith(flowPrefix)) {
      const bareKey = k.slice(flowPrefix.length);
      dataSheetCounters[bareKey] = v;
    } else if (!k.includes(':')) {
      if (dataSheetCounters[k] === undefined) {
        dataSheetCounters[k] = v;
      }
    }
  }

  // Create Execution Record in DB
  const execution = await createExecutionRecord({
    flowId: flow.id,
    environmentId: recordedEnvId || null,
    targetMode: options.targetMode || 'LIVE',
    totalSteps: stepsToRun.length,
    initialVariables: currentVariables,
    executedBy: options.executedBy || 'User',
  });

  const stepExecutionResults: any[] = [];
  let passedCount = 0;
  let failedCount = 0;
  let hasFailed = false;
  let errorSummary: string | null = null;
  const executionStartTime = Date.now();

  for (let i = 0; i < stepsToRun.length; i++) {
    const step = stepsToRun[i];

    // If flow stopped due to previous failure
    if (hasFailed && flow.stopOnFailure && !step.continueOnError) {
      const skippedStepResult = await createExecutionStepRecord({
        executionId: execution.id,
        flowStepId: step.id,
        stepOrder: step.stepOrder,
        stepName: step.name,
        method: step.methodOverride || step.api?.methodRequest || 'GET',
        url: step.pathOverride || step.api?.path || '',
        status: 'SKIPPED',
        durationMs: 0,
        errorMessage: 'Skipped because previous step failed and stopOnFailure is true',
      });
      stepExecutionResults.push(skippedStepResult);
      continue;
    }

    // Step delay if configured
    if (step.delayMs && step.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, step.delayMs));
    }

    // Step-scoped counter proxy so all tokens in this step lock to the same row index
    const { stepCounters, commitStep } = createStepDataSheetCounters(dataSheetCounters);

    // Resolve Method & Path
    const rawMethod = (step.methodOverride || step.api?.methodRequest || 'GET').toUpperCase();
    const rawPath = step.pathOverride || step.api?.path || '';

    // Interpolate Path Params in rawPath e.g. /users/:id or /users/{id}
    let interpolatedPath = rawPath;
    const pathParamsObj = {
      ...((step.requestScenario?.pathParams as Record<string, string>) || {}),
      ...((step.pathParamsOverride as Record<string, string>) || {}),
    };

    // Replace :param and {param}
    for (const [k, v] of Object.entries(pathParamsObj)) {
      const resolvedVal = interpolateVariables(v, currentVariables, stepCounters);
      interpolatedPath = interpolatedPath
        .replace(new RegExp(`:${k}\\b`, 'g'), String(resolvedVal))
        .replace(new RegExp(`\\{${k}\\}`, 'g'), String(resolvedVal));
    }

    // Interpolate any remaining {{variables}} directly in the URL path
    interpolatedPath = interpolateVariables(interpolatedPath, currentVariables, stepCounters);

    // Resolve Step Base URL (handles LOCAL override vs global targetEnvType)
    const stepBaseUrl = resolveStepBaseUrl(step, targetEnvType, projectEnvironments, currentVariables);

    // Build URL
    let fullUrl = '';
    if (interpolatedPath.startsWith('http://') || interpolatedPath.startsWith('https://')) {
      fullUrl = interpolatedPath;
    } else if (stepBaseUrl) {
      fullUrl = `${stepBaseUrl}${interpolatedPath.startsWith('/') ? '' : '/'}${interpolatedPath}`;
    } else {
      fullUrl = interpolatedPath;
    }

    // Query Params
    const queryParamsObj = {
      ...((step.requestScenario?.queryParams as Record<string, string>) || {}),
      ...((step.queryParamsOverride as Record<string, string>) || {}),
    };
    const interpolatedQuery = interpolateVariables(queryParamsObj, currentVariables, stepCounters);
    const queryParts: string[] = [];
    for (const [k, v] of Object.entries(interpolatedQuery)) {
      if (v !== undefined && v !== null && v !== '') {
        queryParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
    if (queryParts.length > 0) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryParts.join('&');
    }

    // Resolve effective bodyType
    const effectiveBodyType = (step.bodyType || step.requestScenario?.bodyType || 'JSON').toUpperCase();

    // Headers: standardized & normalized conforming to flutter-package-core / network standards
    const interpolatedHeaders = buildNormalizedHeaders(
      step.requestScenario?.headers as Record<string, string>,
      step.headersOverride as Record<string, string>,
      currentVariables,
      stepCounters,
      effectiveBodyType
    );

    // Body
    let rawBody = step.bodyOverride !== undefined && step.bodyOverride !== null
      ? step.bodyOverride
      : step.requestScenario?.body;

    let finalBody: any = undefined;
    if (effectiveBodyType !== 'NONE' && rawBody !== undefined && rawBody !== null && rawMethod !== 'GET' && rawMethod !== 'HEAD') {
      finalBody = interpolateVariables(rawBody, currentVariables, stepCounters);
    }

    // Commit step counters so that subsequent steps advance to the next row
    commitStep();

    // Request snapshot
    const requestSnapshot = {
      method: rawMethod,
      url: fullUrl,
      headers: interpolatedHeaders,
      body: finalBody,
      bodyType: effectiveBodyType,
    };

    const stepStartTime = Date.now();
    let stepStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let stepError: string | null = null;
    let responseSnapshot: any = null;
    let assertionResults: AssertionResult[] = [];
    let extractedVars: Record<string, any> = {};

    try {
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        throw new Error(
          `Cannot execute step "${step.name}": Base URL is empty for environment '${targetEnvType}' and step path '${rawPath}' is not an absolute URL.`
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const fetchOptions: RequestInit = {
        method: rawMethod,
        headers: interpolatedHeaders,
        signal: controller.signal,
      };

      if (finalBody !== undefined && effectiveBodyType !== 'NONE') {
        if (effectiveBodyType === 'FORM_DATA') {
          const formData = new FormData();
          if (typeof finalBody === 'object' && finalBody !== null) {
            for (const [k, v] of Object.entries(finalBody)) {
              if (v !== undefined && v !== null) {
                if (typeof v === 'object' && v !== null && 'filename' in v) {
                  const blob = new Blob([String((v as any).content || '')], { type: (v as any).type || 'application/octet-stream' });
                  formData.append(k, blob, String((v as any).filename));
                } else if (typeof v === 'object') {
                  formData.append(k, JSON.stringify(v));
                } else {
                  formData.append(k, String(v));
                }
              }
            }
          } else {
            formData.append('data', String(finalBody));
          }
          fetchOptions.body = formData;
        } else if (effectiveBodyType === 'URL_ENCODED') {
          const params = new URLSearchParams();
          if (typeof finalBody === 'object' && finalBody !== null) {
            for (const [k, v] of Object.entries(finalBody)) {
              if (v !== undefined && v !== null) {
                params.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
              }
            }
          } else {
            params.append('data', String(finalBody));
          }
          fetchOptions.body = params.toString();
        } else {
          fetchOptions.body = typeof finalBody === 'object' ? JSON.stringify(finalBody) : String(finalBody);
        }
      }

      const res = await fetch(fullUrl, fetchOptions);
      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - stepStartTime;
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        respHeaders[key] = value;
      });

      let parsedBody: any = null;
      const responseText = await res.text();
      try {
        parsedBody = JSON.parse(responseText);
      } catch {
        parsedBody = responseText;
      }

      responseSnapshot = {
        status: res.status,
        statusText: res.statusText,
        headers: respHeaders,
        body: parsedBody,
        responseTimeMs,
      };

      // Extract variables
      extractedVars = extractVariables(step.extractors as unknown as VariableExtractor[], {
        status: res.status,
        headers: respHeaders,
        body: parsedBody,
      });

      // Merge into currentVariables for subsequent steps
      Object.assign(currentVariables, extractedVars);

      // Evaluate assertions
      const rules = (step.assertions as unknown as AssertionRule[]) || [];
      if (rules.length > 0) {
        assertionResults = rules.map((rule) =>
          evaluateAssertion(
            rule,
            {
              status: res.status,
              headers: respHeaders,
              body: parsedBody,
              responseTimeMs,
            },
            currentVariables,
            dataSheetCounters
          )
        );
        const hasFailedAssertion = assertionResults.some((a) => !a.passed);
        if (hasFailedAssertion) {
          stepStatus = 'FAILED';
          stepError = assertionResults.find((a) => !a.passed)?.message || 'One or more assertions failed';
        }
      } else {
        // If no explicit assertions, default rule: 2xx or 3xx is SUCCESS, 4xx/5xx is FAILED
        if (res.status >= 400) {
          stepStatus = 'FAILED';
          stepError = `HTTP ${res.status} ${res.statusText}`;
        }
      }
    } catch (err: any) {
      stepStatus = 'FAILED';
      stepError = err.name === 'AbortError' ? 'Request timed out after 30s' : err.message || 'Unknown network error';
      responseSnapshot = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: null,
        responseTimeMs: Date.now() - stepStartTime,
      };
    }

    const stepDurationMs = Date.now() - stepStartTime;

    if (stepStatus === 'SUCCESS') {
      passedCount++;
    } else {
      failedCount++;
      hasFailed = true;
      if (!errorSummary) {
        errorSummary = `Step ${step.stepOrder} (${step.name}) failed: ${stepError}`;
      }
    }

    const savedStep = await createExecutionStepRecord({
      executionId: execution.id,
      flowStepId: step.id,
      stepOrder: step.stepOrder,
      stepName: step.name,
      method: rawMethod,
      url: fullUrl,
      status: stepStatus,
      httpStatusCode: responseSnapshot?.status || 0,
      durationMs: stepDurationMs,
      requestSnapshot,
      responseSnapshot,
      extractedVariables: extractedVars,
      assertionResults,
      errorMessage: stepError,
    });

    stepExecutionResults.push(savedStep);
  }

  const totalDurationMs = Date.now() - executionStartTime;
  const finalExecutionStatus = failedCount > 0 ? 'FAILED' : 'SUCCESS';

  // Persist updated counters into in-memory store
  for (const [k, v] of Object.entries(dataSheetCounters)) {
    persistentFlowCounters[`${flow.id}:${k}`] = v;
    persistentFlowCounters[k] = v;
  }

  // Persist updated counters into database ScenarioFlow.variables._dataSheetCounters
  try {
    const currentDbVars = (flow.variables as Record<string, any>) || {};
    await prisma.scenarioFlow.update({
      where: { id: flow.id },
      data: {
        variables: {
          ...currentDbVars,
          _dataSheetCounters: dataSheetCounters,
        },
      },
    });
  } catch (err) {
    console.warn('Failed to persist flow data sheet counters to DB:', err);
  }

  currentVariables['_dataSheetCounters'] = dataSheetCounters;

  const updatedExecution = await updateExecutionRecord(execution.id, {
    status: finalExecutionStatus,
    passedSteps: passedCount,
    failedSteps: failedCount,
    durationMs: totalDurationMs,
    finalVariables: currentVariables,
    errorSummary,
  });

  return {
    execution: updatedExecution,
    steps: stepExecutionResults,
    finalVariables: currentVariables,
  };
}

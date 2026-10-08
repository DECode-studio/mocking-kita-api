/**
 * Variable Interpolation & Assertion Rule Simulator
 * Simulates runtime expressions for Mocking Kita Scenario Flow:
 * {{var}}, {{$uuid}}, {{$timestamp}}, {{$isoDate}}, {{datasheet.sheet.next.col}}, and assertions
 */

export interface SimulationVariableContext {
  variables: Record<string, any>;
  dataSheetValues?: Record<string, any>;
}

export interface SimulationResult {
  interpolated: any;
  replacedTokens: Array<{
    token: string;
    resolvedValue: any;
    type: 'generator' | 'variable' | 'datasheet';
  }>;
}

export interface AssertionSimulationInput {
  actualStatusCode: number;
  actualResponseTime: number;
  actualBody: any;
  assertions: Array<{
    type: 'STATUS_CODE' | 'RESPONSE_TIME' | 'JSON_PATH';
    property?: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'REGEX_MATCH';
    expectedValue: string;
    message?: string;
  }>;
}

export interface AssertionSimulationResult {
  passed: boolean;
  results: Array<{
    assertionIndex: number;
    passed: boolean;
    actualValue: any;
    expectedValue: any;
    operator: string;
    message: string;
  }>;
}

export function simulateVariableInterpolation(
  input: any,
  context: SimulationVariableContext = { variables: {} }
): SimulationResult {
  const replacedTokens: SimulationResult['replacedTokens'] = [];

  function interpolateString(str: string): string {
    const tokenRegex = /\{\{([^}]+)\}\}/g;
    return str.replace(tokenRegex, (match, rawKey) => {
      const key = rawKey.trim();

      // 1. Dynamic Generator Tokens
      if (key === '$uuid') {
        const val = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        replacedTokens.push({ token: match, resolvedValue: val, type: 'generator' });
        return val;
      }
      if (key === '$timestamp') {
        const val = String(Math.floor(Date.now() / 1000));
        replacedTokens.push({ token: match, resolvedValue: val, type: 'generator' });
        return val;
      }
      if (key === '$timestampMs') {
        const val = String(Date.now());
        replacedTokens.push({ token: match, resolvedValue: val, type: 'generator' });
        return val;
      }
      if (key === '$isoDate') {
        const val = new Date().toISOString();
        replacedTokens.push({ token: match, resolvedValue: val, type: 'generator' });
        return val;
      }
      if (key.startsWith('$randomInt')) {
        const val = '42';
        replacedTokens.push({ token: match, resolvedValue: val, type: 'generator' });
        return val;
      }

      // 2. Data Sheet tokens: datasheet.sheet.next.column
      if (key.startsWith('datasheet.')) {
        const parts = key.split('.');
        const col = parts[parts.length - 1] || 'col';
        const val = context.dataSheetValues?.[col] ?? `[DataSheet:${col}:SampleRow]`;
        replacedTokens.push({ token: match, resolvedValue: val, type: 'datasheet' });
        return String(val);
      }

      // 3. User Variables
      if (key in context.variables) {
        const val = context.variables[key];
        replacedTokens.push({ token: match, resolvedValue: val, type: 'variable' });
        return String(val);
      }

      // Fallback
      replacedTokens.push({ token: match, resolvedValue: match, type: 'variable' });
      return match;
    });
  }

  function walk(val: any): any {
    if (typeof val === 'string') {
      return interpolateString(val);
    }
    if (Array.isArray(val)) {
      return val.map(walk);
    }
    if (val !== null && typeof val === 'object') {
      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        res[interpolateString(k)] = walk(v);
      }
      return res;
    }
    return val;
  }

  const interpolated = walk(input);
  return { interpolated, replacedTokens };
}

export function simulateAssertions(input: AssertionSimulationInput): AssertionSimulationResult {
  const results: AssertionSimulationResult['results'] = [];
  let allPassed = true;

  input.assertions.forEach((ast, index) => {
    let actualVal: any = null;
    let passed = false;

    if (ast.type === 'STATUS_CODE') {
      actualVal = input.actualStatusCode;
      const exp = parseInt(ast.expectedValue, 10);
      passed = ast.operator === 'NOT_EQUALS' ? actualVal !== exp : actualVal === exp;
    } else if (ast.type === 'RESPONSE_TIME') {
      actualVal = input.actualResponseTime;
      const exp = parseInt(ast.expectedValue, 10);
      passed = ast.operator === 'GREATER_THAN' ? actualVal > exp : actualVal <= exp;
    } else {
      // JSON_PATH
      const path = ast.property || '$.code';
      actualVal = extractJsonPath(input.actualBody, path);
      const expStr = String(ast.expectedValue);

      switch (ast.operator) {
        case 'EQUALS':
          passed = String(actualVal) === expStr;
          break;
        case 'NOT_EQUALS':
          passed = String(actualVal) !== expStr;
          break;
        case 'CONTAINS':
          passed = String(actualVal).includes(expStr);
          break;
        case 'GREATER_THAN':
          passed = Number(actualVal) > Number(expStr);
          break;
        case 'LESS_THAN':
          passed = Number(actualVal) < Number(expStr);
          break;
        case 'REGEX_MATCH':
          try {
            passed = new RegExp(expStr).test(String(actualVal));
          } catch {
            passed = false;
          }
          break;
        default:
          passed = String(actualVal) === expStr;
      }
    }

    if (!passed) allPassed = false;

    results.push({
      assertionIndex: index + 1,
      passed,
      actualValue: actualVal,
      expectedValue: ast.expectedValue,
      operator: ast.operator,
      message: ast.message || `Assertion #${index + 1} (${ast.type})`,
    });
  });

  return { passed: allPassed, results };
}

function extractJsonPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const cleanPath = path.replace(/^\$\.?/, '');
  const keys = cleanPath.split('.');
  let curr = obj;
  for (const k of keys) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[k];
  }
  return curr;
}

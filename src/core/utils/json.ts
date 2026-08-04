export function safeParseJson<T>(jsonString: string, fallback: T): T {
  try {
    if (!jsonString || jsonString.trim() === '') return fallback;
    return JSON.parse(jsonString) as T;
  } catch (err) {
    return fallback;
  }
}

export function formatJsonString(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    return jsonString;
  }
}

export function minifyJsonString(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (err) {
    return jsonString;
  }
}

export function validateJsonString(jsonString: string): { isValid: boolean; error?: string } {
  if (!jsonString || jsonString.trim() === '') {
    return { isValid: true };
  }
  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error: unknown) {
    return {
      isValid: false,
      error: error instanceof Error && error.message ? error.message : 'Invalid JSON syntax',
    };
  }
}

export function objectToKeyValuePairs(obj: Record<string, unknown> | null | undefined): Array<{ id: string; key: string; value: string; enabled: boolean }> {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, val], idx) => ({
    id: `kv-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    key,
    value: typeof val === 'object' ? JSON.stringify(val) : String(val ?? ''),
    enabled: true,
  }));
}

export function keyValuePairsToObject(pairs: Array<{ key: string; value: string; enabled?: boolean }>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const pair of pairs) {
    if (pair.enabled !== false && pair.key.trim() !== '') {
      let parsedVal: unknown = pair.value;
      if (pair.value === 'true') parsedVal = true;
      else if (pair.value === 'false') parsedVal = false;
      else if (pair.value !== '' && !isNaN(Number(pair.value)) && !pair.value.startsWith('0') && pair.value !== '0') parsedVal = Number(pair.value);
      else if (pair.value === '0') parsedVal = 0;
      else if (pair.value.startsWith('{') || pair.value.startsWith('[')) {
        try {
          parsedVal = JSON.parse(pair.value);
        } catch {
          parsedVal = pair.value;
        }
      }
      result[pair.key.trim()] = parsedVal;
    }
  }
  return result;
}

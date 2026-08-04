export function toBoolean(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

export function toDbBoolean(value: boolean | undefined): number {
  return value ? 1 : 0;
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

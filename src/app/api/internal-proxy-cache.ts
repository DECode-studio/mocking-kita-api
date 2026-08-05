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

const globalScope = globalThis as typeof globalThis & {
  __mockApiProxyCache?: Map<string, CachedResponseEntry>;
  __mockApiProxyThrottle?: Map<string, ThrottleState>;
};

export const responseCache = globalScope.__mockApiProxyCache ??= new Map<string, CachedResponseEntry>();
export const throttleStates = globalScope.__mockApiProxyThrottle ??= new Map<string, ThrottleState>();

export function clearInternalProxyCache(): void {
  responseCache.clear();
}


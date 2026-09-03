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

type ProxyConfigCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const globalScope = globalThis as typeof globalThis & {
  __mockApiProxyCache?: Map<string, CachedResponseEntry>;
  __mockApiProxyThrottle?: Map<string, ThrottleState>;
  __mockApiProxyConfigCache?: Map<string, ProxyConfigCacheEntry<unknown>>;
};

export const responseCache = globalScope.__mockApiProxyCache ??= new Map<string, CachedResponseEntry>();
export const throttleStates = globalScope.__mockApiProxyThrottle ??= new Map<string, ThrottleState>();
export const proxyConfigCache = globalScope.__mockApiProxyConfigCache ??= new Map<string, ProxyConfigCacheEntry<unknown>>();

export function getProxyConfigCache<T>(key: string): T | null {
  const cached = proxyConfigCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    proxyConfigCache.delete(key);
    return null;
  }
  return cached.value as T;
}

export function setProxyConfigCache<T>(key: string, value: T, ttlMs: number): void {
  proxyConfigCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearInternalProxyCache(): void {
  responseCache.clear();
  proxyConfigCache.clear();
}

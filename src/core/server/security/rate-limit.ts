type RateLimitState = {
  count: number;
  resetAt: number;
};

const globalScope = globalThis as typeof globalThis & {
  __mockApiRateLimit?: Map<string, RateLimitState>;
};

const rateLimitStates = globalScope.__mockApiRateLimit ??= new Map<string, RateLimitState>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const current = rateLimitStates.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStates.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitStates.set(key, current);
  return { allowed: true };
}

export function getRequestRateLimitKey(request: Request, scope: string): string {
  const headers = request.headers ?? new Headers();
  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = headers.get('x-real-ip')?.trim();
  return `${scope}:${forwardedFor || realIp || 'anonymous'}`;
}

export function clearRateLimitState(): void {
  rateLimitStates.clear();
}

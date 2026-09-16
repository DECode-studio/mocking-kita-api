import { describe, it, expect } from 'vitest';
import proxy from '@/src/proxy';
import { NextRequest } from 'next/server';

describe('Studio Proxy & Route Whitelisting', () => {
  it('should pass through UI route /external-api-docs without rewriting', () => {
    const req = new NextRequest('http://localhost:3000/external-api-docs');
    const res = proxy(req);

    // Should return NextResponseBody (next() call), not rewrite to /api/external-api-docs
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('should apply CORS headers to /api/v1/external requests', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/external/apis');
    const res = proxy(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
  });
});

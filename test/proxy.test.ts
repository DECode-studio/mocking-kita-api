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

  it('should pass through UI route /scenario-flows and detail without rewriting', () => {
    const reqList = new NextRequest('http://localhost:3000/scenario-flows');
    const resList = proxy(reqList);
    expect(resList.headers.get('x-middleware-rewrite')).toBeNull();

    const reqDetail = new NextRequest('http://localhost:3000/scenario-flows/flow-123');
    const resDetail = proxy(reqDetail);
    expect(resDetail.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('should apply CORS headers to /api/scenario-flows management requests', () => {
    const req = new NextRequest('http://localhost:3000/api/scenario-flows');
    const res = proxy(req);

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined();
  });
});

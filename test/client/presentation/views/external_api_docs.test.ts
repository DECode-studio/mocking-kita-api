import { describe, it, expect } from 'vitest';
import { EXTERNAL_ENDPOINTS } from '@/src/client/presentation/views/external-api-docs/constant/externalDocsData';

describe('External API Docs Specifications', () => {
  it('should contain all 8 external endpoints in documentation dataset', () => {
    expect(EXTERNAL_ENDPOINTS.length).toBe(8);

    const categories = new Set(EXTERNAL_ENDPOINTS.map((e) => e.category));
    expect(categories.has('Authentication')).toBe(true);
    expect(categories.has('APIs')).toBe(true);
    expect(categories.has('Request Scenarios')).toBe(true);
    expect(categories.has('Response Scenarios')).toBe(true);
    expect(categories.has('OpenAPI Import')).toBe(true);
  });

  it('should have valid cURL examples and JSON response structures for each endpoint', () => {
    EXTERNAL_ENDPOINTS.forEach((ep) => {
      expect(ep.path.startsWith('/api/v1/external')).toBe(true);
      expect(ep.responseExamples.length).toBeGreaterThan(0);
      expect(ep.responseExamples[0].body).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { convertInsomniaToScenarioFlow } from '@/src/core/ai/insomnia-to-scenario';
import { convertOpenApiToMockStudio } from '@/src/core/ai/openapi-to-mock';
import { simulateVariableInterpolation, simulateAssertions } from '@/src/core/ai/variable-simulator';

describe('AI Studio Converters & Simulators', () => {
  it('should successfully convert Insomnia collection to Scenario Flow Template v1', () => {
    const sampleInsomnia = JSON.stringify({
      _type: 'export',
      __export_format: 4,
      resources: [
        {
          _id: 'wrk_1',
          _type: 'workspace',
          name: 'Payment Service',
        },
        {
          _id: 'env_1',
          _type: 'environment',
          name: 'DEV',
          data: { baseUrl: 'https://dev-pay.example.com' },
        },
        {
          _id: 'req_1',
          _type: 'request',
          name: 'Create Invoice',
          method: 'POST',
          url: '{{baseUrl}}/v1/invoices',
          headers: [{ name: 'Content-Type', value: 'application/json' }],
          body: { mimeType: 'application/json', text: '{"amount": 50000}' },
        },
        {
          _id: 'req_2',
          _type: 'request',
          name: 'Pay Invoice',
          method: 'POST',
          url: '{{baseUrl}}/v1/invoices/pay',
          headers: [
            {
              name: 'Authorization',
              value: "Bearer {% response 'body', 'req_1', 'b64::JC5kYXRhLnRva2Vu::46bf', 'never', 60 %}",
            },
          ],
        },
      ],
    });

    const result = convertInsomniaToScenarioFlow(sampleInsomnia);
    expect(result.success).toBe(true);
    expect(result.template).toBeDefined();
    expect(result.template?.$schema).toBe('mock-api-studio/scenario-flow/v1');
    expect(result.template?.steps.length).toBe(2);
    expect(result.summary?.chainingTagsFound).toBe(1);
    expect(result.summary?.environmentsExtracted).toBe(1);
  });

  it('should parse OpenAPI 3.x document and generate Mock APIs', () => {
    const sampleOpenApi = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'User Service API', version: '1.0.0' },
      paths: {
        '/users': {
          get: {
            tags: ['Users'],
            summary: 'Get all users',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          email: { type: 'string', format: 'email' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = convertOpenApiToMockStudio(sampleOpenApi);
    expect(result.success).toBe(true);
    expect(result.endpoints?.length).toBe(1);
    expect(result.endpoints?.[0].method).toBe('GET');
    expect(result.endpoints?.[0].path).toBe('/users');
    expect(result.endpoints?.[0].responses[0].statusCode).toBe(200);
    expect(Array.isArray(result.endpoints?.[0].responses[0].sampleBody)).toBe(true);
  });

  it('should simulate runtime variable interpolation and dynamic generator tokens', () => {
    const payload = {
      id: '{{$uuid}}',
      timestamp: '{{$timestamp}}',
      user: '{{username}}',
      sheetPhone: '{{datasheet.customers.next.phone}}',
    };

    const res = simulateVariableInterpolation(payload, {
      variables: { username: 'Budi' },
      dataSheetValues: { phone: '08123456789' },
    });

    expect(res.interpolated.user).toBe('Budi');
    expect(res.interpolated.sheetPhone).toBe('08123456789');
    expect(res.interpolated.id).not.toContain('{{');
    expect(res.interpolated.timestamp).not.toContain('{{');
  });

  it('should evaluate assertion rules correctly', () => {
    const res = simulateAssertions({
      actualStatusCode: 200,
      actualResponseTime: 120,
      actualBody: { code: 'SUCCESS', data: { role: 'ADMIN' } },
      assertions: [
        { type: 'STATUS_CODE', operator: 'EQUALS', expectedValue: '200' },
        { type: 'RESPONSE_TIME', operator: 'LESS_THAN', expectedValue: '300' },
        { type: 'JSON_PATH', property: '$.code', operator: 'EQUALS', expectedValue: 'SUCCESS' },
        { type: 'JSON_PATH', property: '$.data.role', operator: 'EQUALS', expectedValue: 'ADMIN' },
      ],
    });

    expect(res.passed).toBe(true);
    expect(res.results.every((r) => r.passed)).toBe(true);
  });
});

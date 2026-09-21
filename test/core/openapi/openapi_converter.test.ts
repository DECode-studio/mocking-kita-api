import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseOpenApiSpecToProjectData } from '@/src/core/openapi/openapi_converter';

describe('parseOpenApiSpecToProjectData', () => {
  it('should dereference $ref and resolve schemas for dev-deasy-agent-kmb.kbfinansia.com.json', () => {
    const filePath = path.join(process.cwd(), '.data/swag/dev-deasy-agent-kmb.kbfinansia.com.json');
    const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const result = parseOpenApiSpecToProjectData('test-project-id', jsonContent);

    expect(result.apis.length).toBeGreaterThan(0);
    expect(result.responseScenarios.length).toBeGreaterThan(0);

    for (const resp of result.responseScenarios) {
      const bodyStr = JSON.stringify(resp.body);
      expect(bodyStr).not.toContain('"$ref"');
    }

    const resp404 = result.responseScenarios.find((r) => r.statusCode === 404);
    expect(resp404).toBeDefined();
    expect(resp404?.body).toEqual({
      code: 404,
      errors: {
        code: 'DSY-NOT-FOUND',
        message: 'record not found',
      },
      message: 'Not Found',
    });
  });

  it('should parse formData parameters and bodyType for dev-plat-media.kbfinansia.com.json', () => {
    const filePath = path.join(process.cwd(), '.data/swag/dev-plat-media.kbfinansia.com.json');
    const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const result = parseOpenApiSpecToProjectData('test-project-id', jsonContent);

    const uploadApi = result.apis.find((a) => a.path.includes('/upload') && a.methodRequest === 'POST');
    expect(uploadApi).toBeDefined();

    const uploadReqScenario = result.requestScenarios.find((r) => r.apiId === uploadApi?.id);
    expect(uploadReqScenario).toBeDefined();
    expect(uploadReqScenario?.bodyType).toBe('FORM_DATA');
    expect(uploadReqScenario?.body).toEqual({
      type: 'ktp',
      reference_no: 'Ecommerce001',
      expired_at: '1d',
      file: { filename: '(binary_file_data)' },
      date_label: { filename: '(binary_file_data)' },
      custom_label: { filename: '(binary_file_data)' },
      use_versioning: true,
    });
  });

  it('should extract environments into matrix model from OpenAPI servers and Swagger host', () => {
    const specWithServers = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [
        { url: 'https://dev-api.example.com/v1', description: 'Development Server' },
        { url: 'https://api.example.com/v1', description: 'Production Server' },
      ],
      paths: {},
    };

    const result = parseOpenApiSpecToProjectData('test-project-id', specWithServers);

    expect(result.environments).toHaveLength(1);
    const env = result.environments[0];
    expect(env.name).toBe('Test API');
    expect(env.isBaseUrl).toBe(true);
    expect(env.values?.DEVELOPMENT).toBe('https://dev-api.example.com/v1');
    expect(env.values?.PRODUCTION).toBe('https://api.example.com/v1');
    expect(env.values?.LOCAL).toBeNull();
    expect(env.variables).toEqual([
      expect.objectContaining({ key: 'baseUrl', value: 'https://dev-api.example.com/v1' }),
    ]);
  });
});

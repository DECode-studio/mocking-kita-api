import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseConfluenceMarkdownToProjectData } from '@/src/core/parsers/confluence/confluence_md_parser';

describe('confluence_md_parser', () => {
  const confluenceDir = path.resolve(process.cwd(), '.extra/confluence');

  it('should parse single file "SPEC-WG-API - Change Asset Modal.md" correctly', () => {
    const filePath = path.join(confluenceDir, 'SPEC-WG-API - Change Asset Modal.md');
    const content = fs.readFileSync(filePath, 'utf-8');

    const result = parseConfluenceMarkdownToProjectData('test-project-id', content);

    expect(result.apis).toHaveLength(1);
    const api = result.apis[0];
    expect(api.name).toBe('Change Asset Modal');
    expect(api.methodRequest).toBe('POST');
    expect(api.path).toBe('/v1/kpm-wg/submission/change-asset-modal');

    // Collection inferred from segment path: /v1/kpm-wg/submission/... -> 'Submission'
    expect(result.collections).toHaveLength(1);
    expect(result.collections[0].name).toBe('Submission');
    expect(api.collectionId).toBe(result.collections[0].id);

    // Request Scenario
    expect(result.requestScenarios).toHaveLength(1);
    const req = result.requestScenarios[0];
    expect(req.headers).toHaveProperty('ApiKey', 'CLIENT KEY APIGEE');
    expect(req.headers).toHaveProperty('Authorization', 'JWT TOKEN FROM KPM');
    expect(req.body).toEqual({
      order_id: 'NWG-1042623072600025',
      device_code: 'aaaa',
    });

    // Response Scenarios
    expect(result.responseScenarios.length).toBeGreaterThanOrEqual(5);

    // Check 200 response scenario
    const resp200 = result.responseScenarios.find((r) => r.statusCode === 200);
    expect(resp200).toBeDefined();
    expect(resp200?.name).toContain('200');

    // Check 400 validation scenario
    const resp400 = result.responseScenarios.find((r) => r.statusCode === 400);
    expect(resp400).toBeDefined();

    // Check 404 scenario
    const resp404 = result.responseScenarios.find((r) => r.statusCode === 404);
    expect(resp404).toBeDefined();

    // Check 500 scenario
    const resp500 = result.responseScenarios.find((r) => r.statusCode === 500);
    expect(resp500).toBeDefined();
  });

  it('should parse multiple files in batch correctly', () => {
    const files = fs.readdirSync(confluenceDir).filter((f) => f.endsWith('.md'));
    const contents = files.map((f) => fs.readFileSync(path.join(confluenceDir, f), 'utf-8'));

    const result = parseConfluenceMarkdownToProjectData('test-project-id', contents);

    expect(result.apis.length).toBe(files.length);

    // Collections derived from segment paths ('Submission', 'Kreditmu')
    const colNames = result.collections.map((c) => c.name);
    expect(colNames).toContain('Submission');
    expect(colNames).toContain('Kreditmu');

    // All APIs should have valid collection IDs
    result.apis.forEach((api) => {
      expect(api.collectionId).toBeDefined();
      expect(result.collections.some((c) => c.id === api.collectionId)).toBe(true);
    });

    // Environments extracted from doc
    expect(result.environments.length).toBeGreaterThan(0);
    const envNames = result.environments.map((e) => e.name);
    expect(envNames).toContain('Development');
  });

  it('should parse CONFLUENCE_MD_TEMPLATE correctly meeting all minimum requirements', async () => {
    const { CONFLUENCE_MD_TEMPLATE } = await import('@/src/client/presentation/views/project-detail/constant/templateMd');
    const result = parseConfluenceMarkdownToProjectData('test-project-id', CONFLUENCE_MD_TEMPLATE);

    expect(result.apis).toHaveLength(1);
    const api = result.apis[0];
    expect(api.name).toBe('Sample Endpoint');
    expect(api.methodRequest).toBe('POST');
    expect(api.path).toBe('/v1/sample/endpoint');

    // Environments
    expect(result.environments.length).toBeGreaterThanOrEqual(4);

    // Request Scenario & Headers
    expect(result.requestScenarios).toHaveLength(1);
    const req = result.requestScenarios[0];
    expect(req.headers).toHaveProperty('Authorization', 'Bearer {{token}}');
    expect(req.headers).toHaveProperty('Content-Type', 'application/json');
    expect(req.body).toEqual({
      name: 'Contoh Permintaan',
      status: 'ACTIVE',
    });

    // Response Scenarios
    expect(result.responseScenarios.length).toBe(4);
    const statusCodes = result.responseScenarios.map((r) => r.statusCode);
    expect(statusCodes).toContain(200);
    expect(statusCodes).toContain(400);
    expect(statusCodes).toContain(404);
    expect(statusCodes).toContain(500);
  });
});


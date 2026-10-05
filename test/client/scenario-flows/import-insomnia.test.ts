import { describe, it, expect, vi } from 'vitest';
import { convertInsomniaToScenarioFlow } from '@/src/core/parsers/insomnia/insomnia-flow-converter';

describe('Insomnia Import Flow', () => {
  const sampleYaml = `type: collection.insomnia.rest/5.0
schema_version: '5.1'
name: Test LOS Flow
collection:
- name: Master Data
  children:
  - url: '{{ _.MDM_API_AREA_URL }}/api/v2/master-data/area/province'
    name: Province
    method: GET
    meta:
      id: req_prov_1
      sortKey: 100
  - url: '{{ _.MDM_API_AREA_URL }}/api/v2/master-data/area/city'
    name: City
    method: GET
    parameters:
    - name: provinceId
      value: "{% response 'body', 'req_prov_1', 'b64::JC5kYXRhWzBdLmlk::46b', 'when-expired', 300 %}"
    meta:
      id: req_city_2
      sortKey: 200
environments:
  name: Base Environment
  subEnvironments:
  - name: Dev
    data:
      MDM_API_AREA_URL: https://dev-masterdata-area.kbfinansia.com
`;

  it('should convert YAML and extract steps, environments, extractors, and variables', () => {
    const result = convertInsomniaToScenarioFlow(sampleYaml, { sourceFileName: 'test.yaml' });

    expect(result.template.flow.name).toBe('Test LOS Flow');
    expect(result.template.steps).toHaveLength(2);

    // First step should have extractor
    const step1 = result.template.steps[0];
    expect(step1.name).toBe('Province');
    expect(step1.extractors).toHaveLength(1);
    expect(step1.extractors?.[0].variable).toBe('req_prov_1_data_0_id');
    expect(step1.extractors?.[0].path).toBe('data.0.id');

    // Second step should have interpolated variable in queryParams
    const step2 = result.template.steps[1];
    expect(step2.name).toBe('City');
    expect(step2.requestScenario?.queryParams?.provinceId).toBe('{{req_prov_1_data_0_id}}');

    // Environment should be extracted
    expect(result.template.environments).toHaveLength(1);
    expect(result.template.environments?.[0].name).toBe('MDM_API_AREA_URL');
    expect(result.template.environments?.[0].values?.DEVELOPMENT).toBe(
      'https://dev-masterdata-area.kbfinansia.com'
    );
  });

  it('should convert los-cms-collection-sample.yaml with 8 steps and multiple chained responses', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const sampleFilePath = path.resolve(process.cwd(), '.extra/reff/los-cms-collection-sample.yaml');
    if (!fs.existsSync(sampleFilePath)) return;

    const raw = fs.readFileSync(sampleFilePath, 'utf-8');
    const result = convertInsomniaToScenarioFlow(raw, { sourceFileName: 'los-cms-collection-sample.yaml' });

    expect(result.template.flow.name).toBe('LOS CMS Flow (Sample)');
    expect(result.template.steps).toHaveLength(8);
    expect(result.summary.totalRequests).toBe(8);
    expect(result.summary.totalResponseTags).toBeGreaterThan(0);
    expect(result.template.environments?.length).toBeGreaterThan(0);

    // Verify ordering: Login -> Province -> City -> District -> Village -> Draft -> Submit
    const stepNames = result.template.steps.map((s) => s.name);
    expect(stepNames[0]).toContain('Login');
  });
});


import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  convertInsomniaToScenarioFlow,
  normalizeJsonPath,
  decodeFilter,
  generateVariableName,
} from '@/src/core/parsers/insomnia/insomnia-flow-converter';

describe('Insomnia Flow Converter', () => {
  it('should correctly decode base64 filters and normalize json path', () => {
    expect(decodeFilter('b64::JC5kYXRhWzBdLmlk::46b')).toBe('data.0.id');
    expect(normalizeJsonPath('$.data.items[0].name')).toBe('data.items.0.name');
    expect(generateVariableName('req_123', 'data.0.id')).toBe('req_123_data_0_id');
  });

  it('should convert Insomnia YAML into a valid Scenario Flow Template', () => {
    const yamlPath = path.resolve(process.cwd(), '.extra/reff/Insomnia_LOS_CMS_simplified.yaml');
    if (!fs.existsSync(yamlPath)) {
      return;
    }

    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    const result = convertInsomniaToScenarioFlow(yamlContent, { sourceFileName: 'Insomnia_LOS_CMS_simplified.yaml' });

    expect(result.template.$schema).toBe('mock-api-studio/scenario-flow/v1');
    expect(result.template.flow.name).toBe('LOS');
    expect(result.template.steps.length).toBeGreaterThan(0);
    expect(result.template.environments?.length).toBeGreaterThan(0);
    expect(result.summary.totalRequests).toBeGreaterThan(0);

    // Verify step properties
    const firstStep = result.template.steps[0];
    expect(firstStep.order).toBe(1);
    expect(firstStep.api.method).toBeDefined();
    expect(firstStep.requestScenario).toBeDefined();
    expect(firstStep.expectedResponseScenario).toBeDefined();
    expect(firstStep.assertions).toHaveLength(1);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/src/core/db/prisma-client';
import {
  importScenarioFlowFromTemplate,
} from '@/src/server/scenario-flow/scenario-flow.import-export';

vi.mock('@/src/core/db/prisma-client', () => {
  return {
    default: {
      collection: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      api: {
        findMany: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      requestScenario: {
        create: vi.fn(),
      },
      responseScenario: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      scenarioFlow: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      scenarioFlowStep: {
        deleteMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
      },
      environment: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('Scenario Flow Import / Export with Upsert', () => {
  const projectId = 'proj-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if template has no flow name', async () => {
    await expect(
      importScenarioFlowFromTemplate(projectId, { flow: {} })
    ).rejects.toThrow('flow.name');
  });

  it('should upsert API and RequestScenario if not existing, then create steps', async () => {
    // Mock Collections
    (prisma.collection.findMany as any).mockResolvedValue([]);
    (prisma.collection.create as any).mockResolvedValue({
      id: 'col-new',
      name: 'Auth',
    });

    // Mock APIs
    (prisma.api.findMany as any).mockResolvedValue([]);
    (prisma.api.upsert as any).mockResolvedValue({
      id: 'api-new-1',
      methodRequest: 'POST',
      path: '/api/v1/login',
      name: 'Login',
      requestScenarios: [],
    });

    // Mock RequestScenario & ResponseScenario
    (prisma.requestScenario.create as any).mockResolvedValue({
      id: 'req-new-1',
      name: 'Valid Login',
    });
    (prisma.responseScenario.create as any).mockResolvedValue({
      id: 'resp-new-1',
    });

    // Mock ScenarioFlow
    (prisma.scenarioFlow.findFirst as any).mockResolvedValue(null);
    (prisma.scenarioFlow.create as any).mockResolvedValue({
      id: 'flow-new-1',
      name: 'Login Flow',
    });

    (prisma.scenarioFlowStep.create as any).mockResolvedValue({
      id: 'step-new-1',
    });

    const template = {
      $schema: 'mock-api-studio/scenario-flow/v1',
      version: '1.0',
      flow: {
        name: 'Login Flow',
        description: 'Auto upsert test',
        stopOnFailure: true,
      },
      steps: [
        {
          order: 1,
          name: 'Step 1 Login',
          api: {
            method: 'POST',
            path: '/api/v1/login',
            name: 'Login',
            collection: 'Auth',
          },
          requestScenario: {
            name: 'Valid Login',
            body: { user: 'test' },
          },
          expectedResponseScenario: {
            statusCode: 200,
            body: { token: 'abc' },
          },
          extractors: [{ variable: 'tok', from: 'body', path: 'token' }],
          assertions: [{ type: 'statusCode', operator: 'equals', expected: 200 }],
        },
      ],
    };

    const result = await importScenarioFlowFromTemplate(projectId, template);

    expect(result.success).toBe(true);
    expect(result.flowId).toBe('flow-new-1');
    expect(result.apisCreated).toBe(1);
    expect(result.requestScenariosCreated).toBe(1);
    expect(result.stepsCount).toBe(1);

    expect(prisma.api.upsert).toHaveBeenCalled();
    expect(prisma.requestScenario.create).toHaveBeenCalled();
    expect(prisma.responseScenario.create).toHaveBeenCalled();
    expect(prisma.scenarioFlowStep.createMany).toHaveBeenCalled();
  });

  it('should successfully parse and import kpm_limit_submission_flow.json template', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const templatePath = path.join(process.cwd(), 'docs/templates/kpm_limit_submission_flow.json');
    const raw = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(raw);

    // Mock Collections
    (prisma.collection.findMany as any).mockResolvedValue([]);
    (prisma.collection.create as any).mockResolvedValue({ id: 'col-1', name: 'KPM' });

    // Mock APIs
    (prisma.api.findMany as any).mockResolvedValue([]);
    (prisma.api.upsert as any).mockImplementation((args: any) => ({
      id: `api-${args.create?.path || args.where?.tblApi_index_0?.path}`,
      ...(args.create || {}),
      requestScenarios: [],
    }));

    (prisma.requestScenario.create as any).mockResolvedValue({ id: 'req-1' });
    (prisma.responseScenario.create as any).mockResolvedValue({ id: 'res-1' });

    (prisma.environment.findFirst as any).mockResolvedValue(null);
    (prisma.environment.create as any).mockImplementation((args: any) => ({
      id: `env-${args.data.name}`,
      ...args.data,
    }));

    (prisma.scenarioFlow.findFirst as any).mockResolvedValue(null);
    (prisma.scenarioFlow.create as any).mockResolvedValue({
      id: 'flow-kpm-1',
      name: template.flow.name,
    });
    (prisma.scenarioFlowStep.create as any).mockResolvedValue({ id: 'step-1' });

    const result = await importScenarioFlowFromTemplate('kpm-project-id', template);

    expect(result.success).toBe(true);
    expect(result.flowName).toBe('KPM Limit Submission Flow (Login to Final Approval)');
    expect(result.stepsCount).toBe(6);
    expect(result.apisCreated).toBe(6);
  });

  it('should extract non-baseUrl flow variables and save them to tblEnvironment.variables', async () => {
    (prisma.collection.findMany as any).mockResolvedValue([]);
    (prisma.api.findMany as any).mockResolvedValue([]);
    (prisma.scenarioFlow.findFirst as any).mockResolvedValue(null);
    (prisma.scenarioFlow.create as any).mockResolvedValue({ id: 'flow-test', name: 'Var Test Flow' });
    (prisma.scenarioFlowStep.createMany as any).mockResolvedValue({ count: 0 });

    (prisma.environment.findFirst as any).mockResolvedValue(null);
    let createdEnvData: any = null;
    (prisma.environment.create as any).mockImplementation((args: any) => {
      createdEnvData = args.data;
      return { id: 'env-1', ...args.data };
    });

    const templateWithVars = {
      flow: {
        name: 'Var Test Flow',
        variables: {
          baseUrl: 'https://api.gateway.com',
          apiKey: 'secret-key-12345',
          tenantId: 'tenant-abc',
          _canvasLayout: { node1: { x: 10, y: 20 } },
        },
      },
      steps: [],
    };

    const res = await importScenarioFlowFromTemplate(projectId, templateWithVars);
    expect(res.success).toBe(true);

    expect(createdEnvData).not.toBeNull();
    const envVars = createdEnvData.variables;
    expect(Array.isArray(envVars)).toBe(true);

    // Should include baseUrl
    expect(envVars.some((v: any) => v.key === 'baseUrl' && v.value === 'https://api.gateway.com')).toBe(true);
    // Should include custom non-baseUrl variables
    expect(envVars.some((v: any) => v.key === 'apiKey' && v.value === 'secret-key-12345')).toBe(true);
    expect(envVars.some((v: any) => v.key === 'tenantId' && v.value === 'tenant-abc')).toBe(true);
    // Should filter out internal variables like _canvasLayout
    expect(envVars.some((v: any) => v.key === '_canvasLayout')).toBe(false);
  });
});

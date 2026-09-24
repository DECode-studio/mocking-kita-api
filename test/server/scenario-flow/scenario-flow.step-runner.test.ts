import { describe, it, expect, vi } from 'vitest';
import { executeScenarioFlow } from '@/src/server/scenario-flow/scenario-flow.runner';
import * as repo from '@/src/server/scenario-flow/scenario-flow.repository';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    environment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    dataSheet: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    scenarioFlow: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Scenario Flow Run-Per-Step Isolated Execution', () => {
  it('executes only the target step when stepId is specified in options', async () => {
    const mockSteps = [
      {
        id: 'step-1',
        stepOrder: 1,
        name: 'Step 1: Auth Login',
        enabled: true,
        methodOverride: 'POST',
        pathOverride: 'http://localhost:3000/api/login',
        api: null,
        requestScenario: null,
      },
      {
        id: 'step-2',
        stepOrder: 2,
        name: 'Step 2: Get Profile',
        enabled: true,
        methodOverride: 'GET',
        pathOverride: 'http://localhost:3000/api/profile',
        api: null,
        requestScenario: null,
      },
      {
        id: 'step-3',
        stepOrder: 3,
        name: 'Step 3: Checkout',
        enabled: true,
        methodOverride: 'POST',
        pathOverride: 'http://localhost:3000/api/checkout',
        api: null,
        requestScenario: null,
      },
    ];

    const mockFlow = {
      id: 'flow-test-1',
      name: 'User Flow',
      steps: mockSteps,
      defaultEnvironmentId: null,
      stopOnFailure: true,
      variables: {},
    };

    vi.spyOn(repo, 'getScenarioFlowById').mockResolvedValue(mockFlow as any);

    let recordedTotalSteps = 0;
    vi.spyOn(repo, 'createExecutionRecord').mockImplementation(async (input: any) => {
      recordedTotalSteps = input.totalSteps;
      return {
        id: 'exec-1',
        flowId: input.flowId,
        totalSteps: input.totalSteps,
        status: 'RUNNING',
      } as any;
    });

    const createdStepRecords: any[] = [];
    vi.spyOn(repo, 'createExecutionStepRecord').mockImplementation(async (input: any) => {
      createdStepRecords.push(input);
      return { id: `step-exec-${input.stepOrder}`, ...input };
    });

    vi.spyOn(repo, 'updateExecutionRecord').mockImplementation(async (id: string, input: any) => {
      return { id, totalSteps: recordedTotalSteps, ...input };
    });

    // Mock global fetch to return 200 OK
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ success: true, message: 'profile loaded' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    // Execute only Step 2
    const result = await executeScenarioFlow('flow-test-1', {
      stepId: 'step-2',
    });

    expect(recordedTotalSteps).toBe(1);
    expect(result.execution.totalSteps).toBe(1);
    expect(result.steps.length).toBe(1);
    expect(result.steps[0].flowStepId).toBe('step-2');
    expect(result.steps[0].stepName).toBe('Step 2: Get Profile');
    expect(result.steps[0].status).toBe('SUCCESS');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/profile');
  });

  it('throws an error if the specified stepId does not exist in the flow', async () => {
    const mockFlow = {
      id: 'flow-test-2',
      name: 'User Flow',
      steps: [{ id: 'step-1', stepOrder: 1, name: 'Login', enabled: true }],
      variables: {},
    };

    vi.spyOn(repo, 'getScenarioFlowById').mockResolvedValue(mockFlow as any);

    await expect(
      executeScenarioFlow('flow-test-2', { stepId: 'non-existent-step' })
    ).rejects.toThrow("Step with ID 'non-existent-step' not found in scenario flow.");
  });
});

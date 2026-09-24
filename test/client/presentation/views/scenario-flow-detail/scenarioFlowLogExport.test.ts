import { describe, it, expect } from 'vitest';
import {
  generateExecutionLogMarkdown,
  generateExecutionLogCsv,
} from '@/src/client/presentation/views/scenario-flow-detail/utils/scenarioFlowLogExport';
import { ScenarioFlowExecution } from '@/src/client/domain/scenario-flow/entity/scenario_flow';

describe('scenarioFlowLogExport', () => {
  const mockExecution = (id: string, status: 'SUCCESS' | 'FAILED', durationMs: number): ScenarioFlowExecution => ({
    id,
    flowId: 'flow-123',
    status,
    triggerSource: 'MANUAL',
    targetMode: 'LIVE',
    totalSteps: 2,
    passedSteps: status === 'SUCCESS' ? 2 : 1,
    failedSteps: status === 'SUCCESS' ? 0 : 1,
    durationMs,
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: `step-1-${id}`,
        executionId: id,
        stepOrder: 1,
        stepName: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        status: 'SUCCESS',
        httpStatusCode: 200,
        durationMs: 50,
        createdAt: new Date().toISOString(),
      },
      {
        id: `step-2-${id}`,
        executionId: id,
        stepOrder: 2,
        stepName: 'Create User',
        method: 'POST',
        url: 'https://api.example.com/users',
        status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        httpStatusCode: status === 'SUCCESS' ? 201 : 500,
        durationMs: durationMs - 50,
        errorMessage: status === 'FAILED' ? 'Internal Server Error' : null,
        createdAt: new Date().toISOString(),
      },
    ],
  });

  describe('Markdown Export', () => {
    it('generates a single execution report when 1 execution is provided', () => {
      const exec1 = mockExecution('exec-1', 'SUCCESS', 120);
      const md = generateExecutionLogMarkdown(exec1, 'Login Flow');

      expect(md).toContain('# 🧪 Test Execution Report: Login Flow');
      expect(md).toContain('`exec-1`');
      expect(md).not.toContain('Multi-Run');
    });

    it('generates a single execution report when an array of 1 execution is provided', () => {
      const exec1 = mockExecution('exec-1', 'SUCCESS', 120);
      const md = generateExecutionLogMarkdown([exec1], 'Login Flow');

      expect(md).toContain('# 🧪 Test Execution Report: Login Flow');
      expect(md).toContain('`exec-1`');
    });

    it('generates a multi-run report containing all runs when 2 executions are provided', () => {
      const exec1 = mockExecution('exec-1', 'SUCCESS', 120);
      const exec2 = mockExecution('exec-2', 'FAILED', 150);
      const md = generateExecutionLogMarkdown([exec1, exec2], 'Login Flow');

      expect(md).toContain('# 🧪 Multi-Run Test Execution Report: Login Flow (2 Iterations)');
      expect(md).toContain('Run #1');
      expect(md).toContain('Run #2');
      expect(md).toContain('`exec-1`');
      expect(md).toContain('`exec-2`');
      expect(md).toContain('2 runs');
      expect(md).toContain('50%'); // 1 passed, 1 failed
    });

    it('generates a multi-run report containing all 10 runs when 10 executions are provided', () => {
      const executions = Array.from({ length: 10 }, (_, i) =>
        mockExecution(`exec-${i + 1}`, i % 2 === 0 ? 'SUCCESS' : 'FAILED', 100 + i * 10)
      );
      const md = generateExecutionLogMarkdown(executions, 'Batch Flow');

      expect(md).toContain('10 Iterations');
      for (let i = 1; i <= 10; i++) {
        expect(md).toContain(`Run #${i}`);
        expect(md).toContain(`\`exec-${i}\``);
      }
    });
  });

  describe('CSV Export', () => {
    it('generates a single execution CSV when 1 execution is provided', () => {
      const exec1 = mockExecution('exec-1', 'SUCCESS', 120);
      const csv = generateExecutionLogCsv(exec1, 'Login Flow');

      expect(csv).toContain('"Step Order","Step Name"');
      expect(csv).toContain('"Get Users"');
      expect(csv).toContain('"Create User"');
    });

    it('generates a multi-run CSV with Run # and Execution ID columns when multiple executions are provided', () => {
      const exec1 = mockExecution('exec-1', 'SUCCESS', 120);
      const exec2 = mockExecution('exec-2', 'FAILED', 150);
      const csv = generateExecutionLogCsv([exec1, exec2], 'Login Flow');

      expect(csv).toContain('"Run #","Execution ID","Step Order"');
      expect(csv).toContain('"Run #1","exec-1"');
      expect(csv).toContain('"Run #2","exec-2"');
    });
  });
});

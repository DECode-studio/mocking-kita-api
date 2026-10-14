import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/src/core/db/prisma-client';
import { getJobExecutions } from '@/src/server/scenario-flow/scenario-flow-job.repository';
import { listJobExecutionsHandler } from '@/src/server/scenario-flow/scenario-flow-job.controller';
import {
  generateSingleExecutionLogMarkdown,
  generateMultiRunLogMarkdown,
  generateSingleExecutionLogCsv,
  generateMultiRunLogCsv,
  exportJobExecutionsReport,
} from '@/src/server/scenario-flow/scenario-flow-job-export.service';

vi.mock('@/src/core/db/prisma-client', () => ({
  default: {
    scenarioFlowExecution: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Scenario Flow Job Executions Report & Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getJobExecutions repository', () => {
    it('should paginate and filter executions by jobId', async () => {
      const mockItems = [
        {
          id: 'exec-1',
          flowId: 'flow-1',
          jobId: 'job-1',
          status: 'SUCCESS',
          durationMs: 120,
          passedSteps: 2,
          totalSteps: 2,
          createdAt: new Date('2026-10-13T10:00:00Z'),
          job: { id: 'job-1', name: 'Sync Job', scheduleType: 'CRON', cronExpression: '*/5 * * * *' },
          flow: { id: 'flow-1', name: 'User Flow', projectId: 'proj-1' },
          environment: { id: 'env-1', name: 'Production' },
          steps: [],
        },
      ];

      vi.mocked(prisma.scenarioFlowExecution.count).mockResolvedValue(1);
      vi.mocked(prisma.scenarioFlowExecution.findMany).mockResolvedValue(mockItems as any);

      const result = await getJobExecutions({
        jobId: 'job-1',
        page: 1,
        limit: 10,
      });

      expect(prisma.scenarioFlowExecution.count).toHaveBeenCalledTimes(1);
      expect(prisma.scenarioFlowExecution.findMany).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('exec-1');
    });

    it('should filter executions by flowId to avoid mixing logs across flows', async () => {
      vi.mocked(prisma.scenarioFlowExecution.count).mockResolvedValue(0);
      vi.mocked(prisma.scenarioFlowExecution.findMany).mockResolvedValue([]);

      await getJobExecutions({
        flowId: 'flow-target-xyz',
        page: 1,
        limit: 10,
      });

      expect(prisma.scenarioFlowExecution.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            flowId: 'flow-target-xyz',
          }),
        })
      );
    });


    it('should construct correct date range where clause', async () => {
      vi.mocked(prisma.scenarioFlowExecution.count).mockResolvedValue(0);
      vi.mocked(prisma.scenarioFlowExecution.findMany).mockResolvedValue([]);

      await getJobExecutions({
        startDate: '2026-10-01',
        endDate: '2026-10-10',
        status: 'FAILED',
        page: 2,
        limit: 25,
      });

      expect(prisma.scenarioFlowExecution.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'FAILED',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('listJobExecutionsHandler controller', () => {
    it('should parse search params and return JSON response', async () => {
      vi.mocked(prisma.scenarioFlowExecution.count).mockResolvedValue(0);
      vi.mocked(prisma.scenarioFlowExecution.findMany).mockResolvedValue([]);

      const req = new Request('http://localhost/api/scenario-flows/jobs/executions?jobId=job-99&page=1&limit=10&status=SUCCESS');
      const response = await listJobExecutionsHandler(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.items).toEqual([]);
      expect(data.data.total).toBe(0);
    });
  });

  describe('Report Export Generators (Markdown & CSV)', () => {
    const sampleExecutions: any[] = [
      {
        id: 'exec-1',
        flowId: 'flow-1',
        jobId: 'job-1',
        status: 'SUCCESS',
        durationMs: 250,
        passedSteps: 1,
        totalSteps: 1,
        createdAt: '2026-10-13T10:00:00.000Z',
        job: { name: 'Payment Cron' },
        flow: { name: 'Payment Flow' },
        environment: { name: 'Sandbox' },
        steps: [
          {
            stepOrder: 1,
            stepName: 'Charge Card',
            method: 'POST',
            url: 'https://api.test/charge',
            status: 'SUCCESS',
            httpStatusCode: 200,
            durationMs: 250,
            assertionResults: [{ passed: true, rule: { type: 'statusCode', operator: 'equals', expected: 200 } }],
          },
        ],
      },
      {
        id: 'exec-2',
        flowId: 'flow-1',
        jobId: 'job-1',
        status: 'FAILED',
        durationMs: 180,
        passedSteps: 0,
        totalSteps: 1,
        createdAt: '2026-10-13T10:05:00.000Z',
        job: { name: 'Payment Cron' },
        flow: { name: 'Payment Flow' },
        environment: { name: 'Sandbox' },
        steps: [
          {
            stepOrder: 1,
            stepName: 'Charge Card',
            method: 'POST',
            url: 'https://api.test/charge',
            status: 'FAILED',
            httpStatusCode: 500,
            durationMs: 180,
            errorMessage: 'Gateway Timeout',
          },
        ],
      },
    ];

    it('should generate multi-run markdown with Job Name and Summary table', () => {
      const md = generateMultiRunLogMarkdown(sampleExecutions, 'Payment Flow');
      expect(md).toContain('Multi-Run Test Execution Report');
      expect(md).toContain('Payment Cron');
      expect(md).toContain('Charge Card');
      expect(md).toContain('POST https://api.test/charge');
    });

    it('should generate multi-run CSV with Job Name and Flow Name columns', () => {
      const csv = generateMultiRunLogCsv(sampleExecutions, 'Payment Flow');
      expect(csv).toContain('"Job Name"');
      expect(csv).toContain('"Flow Name"');
      expect(csv).toContain('"Payment Cron"');
      expect(csv).toContain('"Payment Flow"');
      expect(csv).toContain('"Charge Card"');
    });

    it('should generate single-run markdown with Job Name metadata', () => {
      const md = generateSingleExecutionLogMarkdown(sampleExecutions[0], 'Payment Flow');
      expect(md).toContain('Payment Flow');
      expect(md).toContain('Payment Cron');
      expect(md).toContain('Charge Card');
    });

    it('should generate single-run CSV', () => {
      const csv = generateSingleExecutionLogCsv(sampleExecutions[0], 'Payment Flow');
      expect(csv).toContain('"Charge Card"');
      expect(csv).toContain('https://api.test/charge');
    });

    it('should export via exportJobExecutionsReport multi-run query', async () => {
      vi.mocked(prisma.scenarioFlowExecution.count).mockResolvedValue(2);
      vi.mocked(prisma.scenarioFlowExecution.findMany).mockResolvedValue(sampleExecutions as any);

      const result = await exportJobExecutionsReport({
        format: 'md',
        jobId: 'job-1',
        flowName: 'Payment Flow',
      });

      expect(result.contentType).toBe('text/markdown; charset=utf-8');
      expect(result.filename).toContain('payment-flow-2-runs-');
      expect(result.content).toContain('Multi-Run Test Execution Report');
    });

  });
});

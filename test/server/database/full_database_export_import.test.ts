import { describe, it, expect, vi, beforeEach } from 'vitest';
import prisma from '@/src/core/db/prisma-client';
import { generateDatabaseSqlDump, importDatabaseSql } from '@/src/core/db/sql_database_storage_helper';
import { readDatabase, seedDatabase } from '@/src/core/db/database_storage_helper';
import { MockApiDatabase } from '@/src/client/domain/database/entity/mock_api_database';

vi.mock('@/src/core/db/prisma-client', () => {
  const mockPrisma = {
    account: { findMany: vi.fn().mockResolvedValue([]) },
    project: { findMany: vi.fn().mockResolvedValue([]) },
    environment: { findMany: vi.fn().mockResolvedValue([]) },
    collection: { findMany: vi.fn().mockResolvedValue([]) },
    api: { findMany: vi.fn().mockResolvedValue([]) },
    projectPic: { findMany: vi.fn().mockResolvedValue([]) },
    apiPic: { findMany: vi.fn().mockResolvedValue([]) },
    apiEnvironment: { findMany: vi.fn().mockResolvedValue([]) },
    requestScenario: { findMany: vi.fn().mockResolvedValue([]) },
    responseScenario: { findMany: vi.fn().mockResolvedValue([]) },
    dataSheet: { findMany: vi.fn().mockResolvedValue([]) },
    scenarioFlow: { findMany: vi.fn().mockResolvedValue([]) },
    scenarioFlowStep: { findMany: vi.fn().mockResolvedValue([]) },
    scenarioFlowJob: { findMany: vi.fn().mockResolvedValue([]) },
    scenarioFlowExecution: { findMany: vi.fn().mockResolvedValue([]) },
    scenarioFlowExecutionStep: { findMany: vi.fn().mockResolvedValue([]) },
    aiApiKey: { findMany: vi.fn().mockResolvedValue([]) },
    changeLog: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  };
  return { default: mockPrisma };
});

describe('Full Database Export & Import Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateDatabaseSqlDump should export all tables including DataSheets, Flows, Jobs, AI Keys, Accounts and new scenario fields', async () => {
    (prisma.account.findMany as any).mockResolvedValue([
      {
        id: 'acc-1',
        username: 'admin',
        password: 'hashedpassword',
        role: 'ADMIN',
        name: 'Administrator',
        googleId: null,
        hasCustomPassword: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    (prisma.project.findMany as any).mockResolvedValue([
      {
        id: 'proj-1',
        name: 'Project One',
        description: 'Test Project',
        status: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);

    (prisma.environment.findMany as any).mockResolvedValue([]);
    (prisma.collection.findMany as any).mockResolvedValue([]);
    (prisma.api.findMany as any).mockResolvedValue([]);
    (prisma.projectPic.findMany as any).mockResolvedValue([
      {
        id: 'pp-1',
        projectId: 'proj-1',
        accountId: 'acc-1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    (prisma.apiPic.findMany as any).mockResolvedValue([]);
    (prisma.apiEnvironment.findMany as any).mockResolvedValue([]);

    (prisma.requestScenario.findMany as any).mockResolvedValue([
      {
        id: 'scen-1',
        apiId: 'api-1',
        name: 'Scenario with Rules',
        description: 'Desc',
        headers: {},
        queryParams: {},
        pathParams: {},
        body: { test: true },
        bodyType: 'JSON',
        matchType: 'EXACT',
        matchStrategy: 'ANY',
        bodyRules: [{ path: '$.test', operator: 'EQUALS', expectedValue: true }],
        strictBodyStructure: false,
        priority: 10,
        status: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);

    (prisma.responseScenario.findMany as any).mockResolvedValue([]);

    (prisma.dataSheet.findMany as any).mockResolvedValue([
      {
        id: 'ds-1',
        projectId: 'proj-1',
        name: 'User DataSheet',
        code: 'DS_USERS',
        category: 'QA',
        description: 'Mock user records',
        format: 'TABLE',
        data: [{ name: 'John' }],
        status: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);

    (prisma.scenarioFlow.findMany as any).mockResolvedValue([
      {
        id: 'flow-1',
        projectId: 'proj-1',
        name: 'Order Flow',
        description: 'Checkout flow',
        status: true,
        defaultEnvironmentId: null,
        stopOnFailure: true,
        variables: { token: 'xyz' },
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);

    (prisma.scenarioFlowStep.findMany as any).mockResolvedValue([
      {
        id: 'step-1',
        flowId: 'flow-1',
        apiId: null,
        requestScenarioId: null,
        stepOrder: 1,
        name: 'Step 1',
        description: null,
        enabled: true,
        delayMs: 100,
        continueOnError: false,
        methodOverride: 'POST',
        pathOverride: null,
        headersOverride: null,
        queryParamsOverride: null,
        pathParamsOverride: null,
        bodyOverride: null,
        bodyType: 'JSON',
        extractors: null,
        assertions: null,
        targetEnvironmentType: 'DEFAULT',
        targetEnvironment: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    (prisma.scenarioFlowJob.findMany as any).mockResolvedValue([
      {
        id: 'job-1',
        projectId: 'proj-1',
        flowId: 'flow-1',
        environmentId: null,
        name: 'Daily Job',
        description: null,
        status: 'ACTIVE',
        scheduleType: 'CRON',
        cronExpression: '0 0 * * *',
        intervalSeconds: null,
        scheduledAt: null,
        targetMode: 'LIVE',
        stopCondition: 'FOREVER',
        maxIterations: null,
        currentIteration: 0,
        endAt: null,
        dataSourceType: 'NONE',
        dataSheetId: null,
        dataIterationMode: 'PER_TICK',
        dataSheetCurrentIndex: 0,
        customVariables: null,
        lastRunAt: null,
        nextRunAt: null,
        lastStatus: null,
        lastError: null,
        totalRuns: 0,
        successRuns: 0,
        failedRuns: 0,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);

    (prisma.scenarioFlowExecution.findMany as any).mockResolvedValue([]);
    (prisma.scenarioFlowExecutionStep.findMany as any).mockResolvedValue([]);
    (prisma.aiApiKey.findMany as any).mockResolvedValue([
      {
        id: 'key-1',
        name: 'NIM Key',
        provider: 'NVIDIA_NIM',
        encryptedKey: 'enc_123',
        keyHint: 'nvapi-...',
        priority: 1,
        isActive: true,
        lastUsedAt: null,
        failureCount: 0,
        lastError: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);
    (prisma.changeLog.findMany as any).mockResolvedValue([]);

    const sqlDump = await generateDatabaseSqlDump('upsert');

    // Verify all tables have INSERT statements in SQL dump
    expect(sqlDump).toContain('INSERT INTO "tblAccount"');
    expect(sqlDump).toContain('INSERT INTO "tblProject"');
    expect(sqlDump).toContain('INSERT INTO "tblProjectPic"');
    expect(sqlDump).toContain('INSERT INTO "tblDataSheet"');
    expect(sqlDump).toContain('INSERT INTO "tblScenarioFlow"');
    expect(sqlDump).toContain('INSERT INTO "tblScenarioFlowStep"');
    expect(sqlDump).toContain('INSERT INTO "tblScenarioFlowJob"');
    expect(sqlDump).toContain('INSERT INTO "tblAiApiKey"');

    // Verify the previously missing fields in tblRequestScenario are now present!
    expect(sqlDump).toContain('"match_strategy"');
    expect(sqlDump).toContain('"body_rules"');
    expect(sqlDump).toContain('"strict_body_structure"');
    expect(sqlDump).toContain("'ANY'");
  });

  it('readDatabase should return all entities for JSON export', async () => {
    (prisma.project.findMany as any).mockResolvedValue([
      {
        id: 'proj-1',
        name: 'P1',
        description: null,
        status: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);
    (prisma.environment.findMany as any).mockResolvedValue([]);
    (prisma.collection.findMany as any).mockResolvedValue([]);
    (prisma.api.findMany as any).mockResolvedValue([]);
    (prisma.apiEnvironment.findMany as any).mockResolvedValue([]);
    (prisma.requestScenario.findMany as any).mockResolvedValue([]);
    (prisma.responseScenario.findMany as any).mockResolvedValue([]);
    (prisma.dataSheet.findMany as any).mockResolvedValue([
      {
        id: 'ds-1',
        projectId: 'proj-1',
        name: 'Sheet 1',
        code: 'S1',
        category: null,
        description: null,
        format: 'LIST',
        data: ['a', 'b'],
        status: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);
    (prisma.scenarioFlow.findMany as any).mockResolvedValue([
      {
        id: 'flow-1',
        projectId: 'proj-1',
        name: 'Flow 1',
        description: null,
        status: true,
        defaultEnvironmentId: null,
        stopOnFailure: true,
        variables: {},
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
      },
    ]);
    (prisma.scenarioFlowStep.findMany as any).mockResolvedValue([]);
    (prisma.scenarioFlowJob.findMany as any).mockResolvedValue([]);
    (prisma.projectPic.findMany as any).mockResolvedValue([]);
    (prisma.apiPic.findMany as any).mockResolvedValue([]);
    (prisma.aiApiKey.findMany as any).mockResolvedValue([]);
    (prisma.account.findMany as any).mockResolvedValue([]);

    const result = await readDatabase();

    expect(result.projects).toHaveLength(1);
    expect(result.dataSheets).toHaveLength(1);
    expect(result.scenarioFlows).toHaveLength(1);
    expect(result.dataSheets?.[0].code).toBe('S1');
    expect(result.scenarioFlows?.[0].name).toBe('Flow 1');
  });

  it('seedDatabase should handle transaction and restore dataSheets, flows, jobs, ai keys', async () => {
    const mockTx = {
      scenarioFlowExecutionStep: { deleteMany: vi.fn().mockResolvedValue({}) },
      scenarioFlowExecution: { deleteMany: vi.fn().mockResolvedValue({}) },
      scenarioFlowJob: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      scenarioFlowStep: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      scenarioFlow: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      dataSheet: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      responseScenario: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      requestScenario: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      apiEnvironment: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      apiPic: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      projectPic: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      api: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      collection: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      environment: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      project: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      aiApiKey: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      account: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });

    const mockData: MockApiDatabase = {
      version: '1.0.0',
      projects: [
        {
          id: 'proj-1',
          name: 'P1',
          status: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      ],
      environments: [],
      collections: [],
      apiCollections: [],
      apiEnvironments: [],
      requestScenarios: [],
      responseScenarios: [],
      dataSheets: [
        {
          id: 'ds-1',
          name: 'DS1',
          code: 'CODE1',
          format: 'LIST',
          data: [],
          status: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      scenarioFlows: [
        {
          id: 'flow-1',
          name: 'Flow1',
          status: true,
          stopOnFailure: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      scenarioFlowSteps: [
        {
          id: 'step-1',
          flowId: 'flow-1',
          stepOrder: 1,
          name: 'Step 1',
          enabled: true,
          delayMs: 0,
          continueOnError: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      scenarioFlowJobs: [
        {
          id: 'job-1',
          flowId: 'flow-1',
          name: 'Job 1',
          status: 'ACTIVE',
          scheduleType: 'CRON',
          targetMode: 'LIVE',
          stopCondition: 'FOREVER',
          currentIteration: 0,
          dataSourceType: 'NONE',
          dataIterationMode: 'PER_TICK',
          dataSheetCurrentIndex: 0,
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      aiApiKeys: [
        {
          id: 'key-1',
          name: 'Key 1',
          provider: 'NVIDIA_NIM',
          encryptedKey: 'enc',
          keyHint: 'hint',
          priority: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    await seedDatabase(mockData);

    // Verify dataSheet was created
    expect(mockTx.dataSheet.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'ds-1', code: 'CODE1' }),
        ]),
      })
    );

    // Verify scenarioFlow was created
    expect(mockTx.scenarioFlow.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'flow-1', name: 'Flow1' }),
        ]),
      })
    );

    // Verify scenarioFlowStep was created
    expect(mockTx.scenarioFlowStep.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'step-1', flowId: 'flow-1' }),
        ]),
      })
    );

    // Verify scenarioFlowJob was created
    expect(mockTx.scenarioFlowJob.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'job-1', flowId: 'flow-1' }),
        ]),
      })
    );

    // Verify aiApiKey was created
    expect(mockTx.aiApiKey.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'key-1', name: 'Key 1' }),
        ]),
      })
    );
  });
});


import { describe, it, expect, beforeEach } from 'vitest';
import {
  interpolateVariables,
  evaluateAssertion,
  createStepDataSheetCounters,
} from '@/src/server/scenario-flow/scenario-flow.runner';
import {
  evaluateParamOperator,
  evaluateBodyPathRules,
  matchesParamsMap,
  registerDataSheetLookup,
} from '@/src/core/utils/param-matcher';

describe('Phase 6: End-to-End Data Sheet Integration Flow', () => {
  // 1. Mock DB Data Sheet records
  const mockDbDataSheets = [
    {
      id: 'ds-1',
      projectId: 'proj-123',
      name: 'Customer Emails',
      code: 'emails',
      category: 'Contact',
      format: 'LIST' as const,
      data: [
        'customer1@acme.com',
        'customer2@acme.com',
        'customer3@acme.com',
      ],
      status: true,
    },
    {
      id: 'ds-2',
      projectId: 'proj-123',
      name: 'Registered Users',
      code: 'users',
      category: 'Auth',
      format: 'TABLE' as const,
      data: [
        { id: 101, username: 'alice', phone: '08111111' },
        { id: 102, username: 'bob', phone: '08222222' },
      ],
      status: true,
    },
  ];

  const runtimeVariables: Record<string, any> = {
    datasheet: {},
  };

  beforeEach(() => {
    // Populate runtime variables as scenario-flow.runner does
    const pool: Record<string, any[]> = {};
    for (const sheet of mockDbDataSheets) {
      pool[sheet.code] = sheet.data;
    }
    runtimeVariables.datasheet = pool;

    // Register lookup for mock proxy engine
    registerDataSheetLookup((code: string) => pool[code]);
  });

  it('Step 1: Scenario Flow step creates request using Data Sheet dynamic parameters', () => {
    const stepUrlTemplate = '/api/v1/customers/{{datasheet.emails[0]}}';
    const stepHeadersTemplate = {
      'Content-Type': 'application/json',
      'X-Target-User': '{{datasheet.users[0].username}}',
    };
    const stepBodyTemplate = {
      email: '{{datasheet.emails.random}}',
      contactPhone: '{{datasheet.users[0].phone}}',
      notificationType: 'EMAIL',
    };

    const counters: Record<string, number> = {};

    const resolvedUrl = interpolateVariables(stepUrlTemplate, runtimeVariables, counters);
    const resolvedHeaders = interpolateVariables(stepHeadersTemplate, runtimeVariables, counters);
    const resolvedBody = interpolateVariables(stepBodyTemplate, runtimeVariables, counters);

    expect(resolvedUrl).toBe('/api/v1/customers/customer1@acme.com');
    expect(resolvedHeaders['X-Target-User']).toBe('alice');
    expect(mockDbDataSheets[0].data).toContain(resolvedBody.email);
    expect(resolvedBody.contactPhone).toBe('08111111');
  });

  it('Step 2: Mock Server receives request and matches it using in_datasheet rules', () => {
    // 1. Mock verifies incoming query parameter against Data Sheet
    const queryRules = {
      user_email: {
        $operator: 'in_datasheet' as const,
        $value: 'emails',
        $enabled: true,
      },
    };

    const incomingValidQuery = { user_email: 'customer2@acme.com' };
    expect(matchesParamsMap(queryRules, incomingValidQuery)).toBe(true);

    const incomingInvalidQuery = { user_email: 'unregistered@fraud.com' };
    expect(matchesParamsMap(queryRules, incomingInvalidQuery)).toBe(false);

    // 2. Mock verifies incoming body path using in_datasheet
    const incomingValidBody = {
      payload: {
        customerEmail: 'customer3@acme.com',
      },
    };
    const bodyRules = [
      {
        path: 'payload.customerEmail',
        operator: 'in_datasheet' as const,
        value: 'emails',
        enabled: true,
      },
    ];
    expect(evaluateBodyPathRules(bodyRules, incomingValidBody)).toBe(true);

    const incomingInvalidBody = {
      payload: {
        customerEmail: 'not_in_sheet@acme.com',
      },
    };
    expect(evaluateBodyPathRules(bodyRules, incomingInvalidBody)).toBe(false);
  });

  it('Step 3: Scenario Flow runner asserts response contains expected values from Data Sheet', () => {
    const mockApiResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: {
        data: {
          assignedEmail: 'customer1@acme.com',
          status: 'ACTIVATED',
        },
      },
      responseTimeMs: 85,
    };

    // Assertion 1: Check if assignedEmail matches Data Sheet index 0
    const assertExactMatch = evaluateAssertion(
      {
        type: 'bodyPath',
        path: 'data.assignedEmail',
        operator: 'equals',
        expected: '{{datasheet.emails[0]}}',
      },
      mockApiResponse,
      runtimeVariables
    );
    expect(assertExactMatch.passed).toBe(true);

    // Assertion 2: Check if assignedEmail is in Data Sheet pool using in_datasheet operator
    const assertInDatasheet = evaluateAssertion(
      {
        type: 'bodyPath',
        path: 'data.assignedEmail',
        operator: 'in_datasheet',
        expected: 'emails',
      },
      mockApiResponse,
      runtimeVariables
    );
    expect(assertInDatasheet.passed).toBe(true);
  });

  it('Step 4: Sequential round-robin (.next) distributes distinct items sequentially', () => {
    const counters: Record<string, number> = {};

    const call1 = interpolateVariables('{{datasheet.emails.next}}', runtimeVariables, counters);
    const call2 = interpolateVariables('{{datasheet.emails.next}}', runtimeVariables, counters);
    const call3 = interpolateVariables('{{datasheet.emails.next}}', runtimeVariables, counters);
    const call4 = interpolateVariables('{{datasheet.emails.next}}', runtimeVariables, counters);

    expect(call1).toBe('customer1@acme.com');
    expect(call2).toBe('customer2@acme.com');
    expect(call3).toBe('customer3@acme.com');
    expect(call4).toBe('customer1@acme.com'); // Wrap around
  });

  it('Step 5: Sequential ASC (.asc) and DESC (.desc/.dsc) progression in flow steps', () => {
    const counters: Record<string, number> = {};

    // ASC progression (0 -> 1 -> 2 -> 0)
    expect(interpolateVariables('{{datasheet.emails.asc}}', runtimeVariables, counters)).toBe('customer1@acme.com');
    expect(interpolateVariables('{{datasheet.emails.asc}}', runtimeVariables, counters)).toBe('customer2@acme.com');
    expect(interpolateVariables('{{datasheet.emails.asc}}', runtimeVariables, counters)).toBe('customer3@acme.com');
    expect(interpolateVariables('{{datasheet.emails.asc}}', runtimeVariables, counters)).toBe('customer1@acme.com');

    // DESC progression (2 -> 1 -> 0 -> 2)
    expect(interpolateVariables('{{datasheet.emails.desc}}', runtimeVariables, counters)).toBe('customer3@acme.com');
    expect(interpolateVariables('{{datasheet.emails.desc}}', runtimeVariables, counters)).toBe('customer2@acme.com');
    expect(interpolateVariables('{{datasheet.emails.dsc}}', runtimeVariables, counters)).toBe('customer1@acme.com');
    expect(interpolateVariables('{{datasheet.emails.desc}}', runtimeVariables, counters)).toBe('customer3@acme.com');
  });

  it('Step 6: Mock Proxy dynamic response interpolation with .asc and .desc tokens', async () => {
    const { mockDataSheetCounters, resetMockDataSheetCounters } = await import('@/src/server/mock-proxy/mock-proxy.service');
    resetMockDataSheetCounters();

    const mockResponseTemplate = {
      status: 'success',
      nextCustomer: '{{datasheet.emails.asc}}',
      lastCustomer: '{{datasheet.emails.desc}}',
    };

    const firstRun = interpolateVariables(mockResponseTemplate, runtimeVariables, mockDataSheetCounters);
    expect(firstRun).toEqual({
      status: 'success',
      nextCustomer: 'customer1@acme.com',
      lastCustomer: 'customer3@acme.com',
    });

    const secondRun = interpolateVariables(mockResponseTemplate, runtimeVariables, mockDataSheetCounters);
    expect(secondRun).toEqual({
      status: 'success',
      nextCustomer: 'customer2@acme.com',
      lastCustomer: 'customer2@acme.com',
    });

    const thirdRun = interpolateVariables(mockResponseTemplate, runtimeVariables, mockDataSheetCounters);
    expect(thirdRun).toEqual({
      status: 'success',
      nextCustomer: 'customer3@acme.com',
      lastCustomer: 'customer1@acme.com',
    });
  });

  it('Step 7: Multiple fields in single step resolve to the exact same row (createStepDataSheetCounters)', () => {
    const masterCounters: Record<string, number> = {};

    // Step 1: Body contains multiple fields of the same data sheet
    const { stepCounters: step1Counters, commitStep: commitStep1 } = createStepDataSheetCounters(masterCounters);
    const step1Template = {
      username: '{{datasheet.users.asc.username}}',
      phone: '{{datasheet.users.asc.phone}}',
    };
    const step1Result = interpolateVariables(step1Template, runtimeVariables, step1Counters);
    commitStep1();

    expect(step1Result).toEqual({
      username: 'alice',
      phone: '08111111',
    });

    // Step 2: Second step moves to row 1
    const { stepCounters: step2Counters, commitStep: commitStep2 } = createStepDataSheetCounters(masterCounters);
    const step2Result = interpolateVariables(step1Template, runtimeVariables, step2Counters);
    commitStep2();

    expect(step2Result).toEqual({
      username: 'bob',
      phone: '08222222',
    });
  });

  it('Step 8: Persistent progression across multiple flow runs preserves counter state', () => {
    const persistentFlowStore: Record<string, number> = {};

    const runFlowSimulation = () => {
      // Simulate executeScenarioFlow loading from persistent store
      const flowCounters = { ...persistentFlowStore };
      const { stepCounters, commitStep } = createStepDataSheetCounters(flowCounters);

      const template = {
        itemAsc: '{{datasheet.emails.asc}}',
        itemDesc: '{{datasheet.emails.desc}}',
      };
      const result = interpolateVariables(template, runtimeVariables, stepCounters);
      commitStep();

      // Save back to persistent store
      Object.assign(persistentFlowStore, flowCounters);
      return result;
    };

    // Run 1
    const run1 = runFlowSimulation();
    expect(run1).toEqual({
      itemAsc: 'customer1@acme.com',
      itemDesc: 'customer3@acme.com',
    });

    // Run 2
    const run2 = runFlowSimulation();
    expect(run2).toEqual({
      itemAsc: 'customer2@acme.com',
      itemDesc: 'customer2@acme.com',
    });

    // Run 3
    const run3 = runFlowSimulation();
    expect(run3).toEqual({
      itemAsc: 'customer3@acme.com',
      itemDesc: 'customer1@acme.com',
    });

    // Run 4: Wraps around
    const run4 = runFlowSimulation();
    expect(run4).toEqual({
      itemAsc: 'customer1@acme.com',
      itemDesc: 'customer3@acme.com',
    });
  });
});

import { describe, it, expect } from 'vitest';
import { interpolateVariables } from '@/src/server/scenario-flow/scenario-flow.runner';

describe('Data Sheet Variable Interpolation in Scenario Flow Runner', () => {
  const variables = {
    datasheet: {
      emails: [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ],
      phone_numbers: [
        '081234567890',
        '089876543210',
      ],
      users: [
        { name: 'Alice', phone: '081111' },
        { name: 'Bob', phone: '082222' },
      ],
    },
  };

  it('should interpolate fixed index tokens correctly e.g. {{datasheet.emails[0]}}', () => {
    const result = interpolateVariables('{{datasheet.emails[0]}}', variables);
    expect(result).toBe('user1@example.com');

    const result2 = interpolateVariables('{{datasheet.emails[1]}}', variables);
    expect(result2).toBe('user2@example.com');
  });

  it('should interpolate random pick token e.g. {{datasheet.emails.random}}', () => {
    const result = interpolateVariables('{{datasheet.emails.random}}', variables);
    expect(variables.datasheet.emails).toContain(result);
  });

  it('should interpolate sequential .next tokens across steps', () => {
    const counters: Record<string, number> = {};

    const first = interpolateVariables('{{datasheet.phone_numbers.next}}', variables, counters);
    expect(first).toBe('081234567890');

    const second = interpolateVariables('{{datasheet.phone_numbers.next}}', variables, counters);
    expect(second).toBe('089876543210');

    // Wraps around modulo length
    const third = interpolateVariables('{{datasheet.phone_numbers.next}}', variables, counters);
    expect(third).toBe('081234567890');
  });

  it('should interpolate nested object properties in TABLE records e.g. {{datasheet.users[0].name}}', () => {
    const result = interpolateVariables('{{datasheet.users[0].name}}', variables);
    expect(result).toBe('Alice');

    const resultPhone = interpolateVariables('{{datasheet.users[1].phone}}', variables);
    expect(resultPhone).toBe('082222');
  });

  it('should interpolate inline string template e.g. "Email: {{datasheet.emails[0]}}"', () => {
    const result = interpolateVariables('Email: {{datasheet.emails[0]}}', variables);
    expect(result).toBe('Email: user1@example.com');
  });

  it('should interpolate nested objects and arrays in request body', () => {
    const bodyTemplate = {
      contact: {
        email: '{{datasheet.emails[0]}}',
        phone: '{{datasheet.phone_numbers[0]}}',
      },
      tags: ['test', '{{datasheet.emails[1]}}'],
    };

    const interpolated = interpolateVariables(bodyTemplate, variables);
    expect(interpolated).toEqual({
      contact: {
        email: 'user1@example.com',
        phone: '081234567890',
      },
      tags: ['test', 'user2@example.com'],
    });
  });

  it('should interpolate sequential .asc tokens in ascending order with loop', () => {
    const counters: Record<string, number> = {};

    const first = interpolateVariables('{{datasheet.emails.asc}}', variables, counters);
    expect(first).toBe('user1@example.com');

    const second = interpolateVariables('{{datasheet.emails.asc}}', variables, counters);
    expect(second).toBe('user2@example.com');

    const third = interpolateVariables('{{datasheet.emails.asc}}', variables, counters);
    expect(third).toBe('user3@example.com');

    // Loops back to index 0
    const fourth = interpolateVariables('{{datasheet.emails.asc}}', variables, counters);
    expect(fourth).toBe('user1@example.com');
  });

  it('should interpolate sequential .desc and .dsc tokens in descending order with loop', () => {
    const counters: Record<string, number> = {};

    // 3 items in emails: index 2, then 1, then 0, then 2
    const first = interpolateVariables('{{datasheet.emails.desc}}', variables, counters);
    expect(first).toBe('user3@example.com');

    const second = interpolateVariables('{{datasheet.emails.desc}}', variables, counters);
    expect(second).toBe('user2@example.com');

    const third = interpolateVariables('{{datasheet.emails.dsc}}', variables, counters);
    expect(third).toBe('user1@example.com');

    // Loops back to end (index 2)
    const fourth = interpolateVariables('{{datasheet.emails.desc}}', variables, counters);
    expect(fourth).toBe('user3@example.com');
  });

  it('should maintain independent counters for asc and desc sequences on the same data sheet', () => {
    const counters: Record<string, number> = {};

    expect(interpolateVariables('{{datasheet.emails.asc}}', variables, counters)).toBe('user1@example.com');
    expect(interpolateVariables('{{datasheet.emails.desc}}', variables, counters)).toBe('user3@example.com');

    expect(interpolateVariables('{{datasheet.emails.asc}}', variables, counters)).toBe('user2@example.com');
    expect(interpolateVariables('{{datasheet.emails.desc}}', variables, counters)).toBe('user2@example.com');
  });

  it('should interpolate nested object properties with .asc and .desc tokens', () => {
    const counters: Record<string, number> = {};

    // users: [ { name: 'Alice', phone: '081111' }, { name: 'Bob', phone: '082222' } ]
    const ascUser1 = interpolateVariables('{{datasheet.users.asc.name}}', variables, counters);
    expect(ascUser1).toBe('Alice');

    const ascUser2 = interpolateVariables('{{datasheet.users.asc.name}}', variables, counters);
    expect(ascUser2).toBe('Bob');

    const descUser1 = interpolateVariables('{{datasheet.users.desc.phone}}', variables, counters);
    expect(descUser1).toBe('082222');

    const descUser2 = interpolateVariables('{{datasheet.users.desc.phone}}', variables, counters);
    expect(descUser2).toBe('081111');
  });

  it('should evaluate assertions with in_datasheet operator successfully', async () => {
    const { evaluateAssertion } = await import('@/src/server/scenario-flow/scenario-flow.runner');

    const res = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { email: 'user2@example.com' },
      responseTimeMs: 45,
    };

    const passResult = evaluateAssertion(
      {
        type: 'bodyPath',
        path: 'email',
        operator: 'in_datasheet',
        expected: 'emails',
      },
      res,
      variables
    );
    expect(passResult.passed).toBe(true);

    const failResult = evaluateAssertion(
      {
        type: 'bodyPath',
        path: 'email',
        operator: 'in_datasheet',
        expected: 'phone_numbers',
      },
      res,
      variables
    );
    expect(failResult.passed).toBe(false);
  });

  it('should interpolate variables in assertion expected value e.g. {{datasheet.emails[0]}}', async () => {
    const { evaluateAssertion } = await import('@/src/server/scenario-flow/scenario-flow.runner');

    const res = {
      status: 200,
      headers: {},
      body: { userEmail: 'user1@example.com' },
      responseTimeMs: 30,
    };

    const assertionResult = evaluateAssertion(
      {
        type: 'bodyPath',
        path: 'userEmail',
        operator: 'equals',
        expected: '{{datasheet.emails[0]}}',
      },
      res,
      variables
    );
    expect(assertionResult.passed).toBe(true);
  });
});


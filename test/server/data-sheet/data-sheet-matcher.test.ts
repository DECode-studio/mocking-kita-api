import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateParamOperator,
  registerDataSheetLookup,
} from '@/src/core/utils/param-matcher';

describe('Data Sheet Matcher in Mock Proxy Engine', () => {
  const dataSheets: Record<string, any[]> = {
    emails: [
      'user1@example.com',
      'user2@example.com',
      'tester@domain.com',
    ],
    phone_numbers: [
      '081234567890',
      '089876543210',
    ],
    customers: [
      { id: 1, phone: '081234567890' },
      { id: 2, phone: '089876543210' },
    ],
  };

  beforeEach(() => {
    registerDataSheetLookup((code: string) => dataSheets[code]);
  });

  it('should match actual value with in_datasheet operator if value is in data sheet', () => {
    const isMatch = evaluateParamOperator('in_datasheet', 'emails', 'user2@example.com');
    expect(isMatch).toBe(true);

    const isMatchFail = evaluateParamOperator('in_datasheet', 'emails', 'unknown@attacker.com');
    expect(isMatchFail).toBe(false);
  });

  it('should match actual value with {{datasheet.emails}} template token', () => {
    const isMatch = evaluateParamOperator('equal', '{{datasheet.emails}}', 'user1@example.com');
    expect(isMatch).toBe(true);

    const isMatchFail = evaluateParamOperator('equal', '{{datasheet.emails}}', 'invalid@domain.com');
    expect(isMatchFail).toBe(false);
  });

  it('should match fixed index token {{datasheet.phone_numbers[0]}}', () => {
    const isMatch = evaluateParamOperator('equal', '{{datasheet.phone_numbers[0]}}', '081234567890');
    expect(isMatch).toBe(true);

    const isMatchWrongIndex = evaluateParamOperator('equal', '{{datasheet.phone_numbers[0]}}', '089876543210');
    expect(isMatchWrongIndex).toBe(false);
  });

  it('should match object table records if property value exists', () => {
    const isMatch = evaluateParamOperator('in_datasheet', 'customers', '081234567890');
    expect(isMatch).toBe(true);
  });

  it('should match incoming body with evaluateBodyPathRules using in_datasheet operator', async () => {
    const { evaluateBodyPathRules } = await import('@/src/core/utils/param-matcher');

    const incomingBody = {
      user: {
        email: 'user1@example.com',
      },
    };

    const rules = [
      {
        path: 'user.email',
        operator: 'in_datasheet' as const,
        value: 'emails',
        enabled: true,
      },
    ];

    expect(evaluateBodyPathRules(rules, incomingBody)).toBe(true);

    const failBody = {
      user: {
        email: 'nonexistent@hacker.io',
      },
    };
    expect(evaluateBodyPathRules(rules, failBody)).toBe(false);
  });

  it('should match incoming query params with matchesParamsMap using in_datasheet operator', async () => {
    const { matchesParamsMap } = await import('@/src/core/utils/param-matcher');

    const expectedConfig = {
      email: {
        __rule: true,
        operator: 'in_datasheet' as const,
        value: 'emails',
      },
    };

    const actualQueryParams = {
      email: 'user2@example.com',
    };

    expect(matchesParamsMap(expectedConfig, actualQueryParams)).toBe(true);

    const failParams = {
      email: 'random@unknown.com',
    };
    expect(matchesParamsMap(expectedConfig, failParams)).toBe(false);
  });
});

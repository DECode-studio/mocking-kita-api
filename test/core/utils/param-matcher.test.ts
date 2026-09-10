import { describe, it, expect } from 'vitest';
import {
  evaluateDeepMatch,
  evaluateParamOperator,
  extractParamRule,
  isParamRule,
  matchesParamsMap,
  matchesHeadersMap,
  isToleratedHeader,
  updateDeepPath,
  extractAllJsonPaths,
  getValueByPath,
  evaluateBodyPathRules,
  matchesStructure,
} from '@/src/core/utils/param-matcher';

describe('param-matcher', () => {
  describe('isParamRule and extractParamRule', () => {
    it('identifies valid param rule objects', () => {
      expect(isParamRule({ $operator: 'equal', $value: '123' })).toBe(true);
      expect(isParamRule({ $operator: 'regex', $value: '^[0-9]+$' })).toBe(true);
      expect(isParamRule({ $operator: 'regex_i', $value: '^admin' })).toBe(true);
      expect(isParamRule({ $operator: 'null' })).toBe(true);
      expect(isParamRule({ $operator: 'empty_array' })).toBe(true);
      expect(isParamRule({ $rule: true, operator: 'regex', value: 'abc' })).toBe(true);

      expect(isParamRule(null)).toBe(false);
      expect(isParamRule('hello')).toBe(false);
      expect(isParamRule(123)).toBe(false);
      expect(isParamRule([])).toBe(false);
      expect(isParamRule({ key: 'val' })).toBe(false);
      // Raw JSON objects with 'operator' are NOT rules without $ prefix
      expect(isParamRule({ operator: 'equal', value: true, enabled: true })).toBe(false);
    });

    it('extracts rule or falls back to equal', () => {
      expect(extractParamRule({ $operator: 'regex_i', $value: 'abc' })).toEqual({
        operator: 'regex_i',
        value: 'abc',
        enabled: true,
      });
      expect(extractParamRule('simple_string')).toEqual({
        operator: 'equal',
        value: 'simple_string',
        enabled: true,
      });
      expect(extractParamRule({ $operator: 'regex', $value: 'xyz', $enabled: false })).toEqual({
        operator: 'regex',
        value: 'xyz',
        enabled: false,
      });
    });
  });

  describe('evaluateParamOperator', () => {
    it('evaluates equal operator', () => {
      expect(evaluateParamOperator('equal', 'hello', 'hello')).toBe(true);
      expect(evaluateParamOperator('equal', '123', 123, true)).toBe(true);
      expect(evaluateParamOperator('equal', 'foo', 'bar')).toBe(false);
    });

    it('evaluates regex operator', () => {
      expect(evaluateParamOperator('regex', '^[A-Z]{3}-\\d+$', 'ABC-123')).toBe(true);
      expect(evaluateParamOperator('regex', '^[A-Z]{3}-\\d+$', 'abc-123')).toBe(false);
      expect(evaluateParamOperator('regex', '^$', null)).toBe(true);
    });

    it('evaluates regex_i operator (case-insensitive)', () => {
      expect(evaluateParamOperator('regex_i', '^admin_', 'ADMIN_123')).toBe(true);
      expect(evaluateParamOperator('regex_i', '^admin_', 'admin_456')).toBe(true);
      expect(evaluateParamOperator('regex_i', '^admin_', 'user_123')).toBe(false);
    });

    it('evaluates null operator', () => {
      expect(evaluateParamOperator('null', undefined, null)).toBe(true);
      expect(evaluateParamOperator('null', undefined, undefined)).toBe(true);
      expect(evaluateParamOperator('null', undefined, '')).toBe(true);
      expect(evaluateParamOperator('null', undefined, 'null')).toBe(true);
      expect(evaluateParamOperator('null', undefined, 'existing_value')).toBe(false);
    });

    it('evaluates empty_array operator', () => {
      expect(evaluateParamOperator('empty_array', undefined, [])).toBe(true);
      expect(evaluateParamOperator('empty_array', undefined, '[]')).toBe(true);
      expect(evaluateParamOperator('empty_array', undefined, [1, 2, 3])).toBe(false);
      expect(evaluateParamOperator('empty_array', undefined, 'not_an_array')).toBe(false);
    });
  });

  describe('matchesParamsMap with ALL and ANY strategies', () => {
    const expected = {
      role: { $operator: 'regex_i', $value: '^admin' },
      deletedAt: { $operator: 'null' },
      tags: { $operator: 'empty_array' },
    };

    it('matches ALL strategy when all match', () => {
      const actual = {
        role: 'ADMINISTRATOR',
        deletedAt: null,
        tags: [],
      };
      expect(matchesParamsMap(expected, actual, 'ALL')).toBe(true);
    });

    it('fails ALL strategy when one fails', () => {
      const actual = {
        role: 'ADMINISTRATOR',
        deletedAt: '2026-01-01',
        tags: [],
      };
      expect(matchesParamsMap(expected, actual, 'ALL')).toBe(false);
    });

    it('matches ANY strategy when at least one matches', () => {
      const actual = {
        role: 'GUEST',
        deletedAt: '2026-01-01',
        tags: [], // matches empty_array
      };
      expect(matchesParamsMap(expected, actual, 'ANY')).toBe(true);
    });

    it('fails ANY strategy when none match', () => {
      const actual = {
        role: 'GUEST',
        deletedAt: '2026-01-01',
        tags: ['tag1'],
      };
      expect(matchesParamsMap(expected, actual, 'ANY')).toBe(false);
    });
  });
});

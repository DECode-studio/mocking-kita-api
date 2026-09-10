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

  describe('evaluateDeepMatch with the user complex nested payload', () => {
    const scenarioExpectedBody = {
      '1_level': {
        status_aktif: { value: true, enabled: true, operator: 'equal' },
        jumlah_karyawan: 150,
      },
      '2_level': {
        divisi_teknologi: {
          ruangan: 'Lantai 4',
          kepala_divisi: 'Budi Santoso',
        },
      },
      '3_level': {
        infrastruktur: {
          server_utama: {
            lokasi: 'Data Center Jakarta',
            kapasitas_gb: 1024,
          },
        },
      },
      perusahaan: 'Tech Innovation Asia',
      array_in_json: ['JavaScript', 'Python', 'Go', 'SQL'],
      json_in_array: [
        {
          status: 'In Progress',
          id_proyek: 'P-01',
          nama_proyek: 'Pengembangan Mobile App',
        },
        {
          status: 'Completed',
          id_proyek: 'P-02',
          nama_proyek: 'Migrasi Cloud',
        },
      ],
    };

    const actualIncomingBody = {
      perusahaan: 'Tech Innovation Asia',
      '1_level': {
        status_aktif: {
          value: true,
          enabled: true,
          operator: 'equal',
        },
        jumlah_karyawan: 150,
      },
      '2_level': {
        divisi_teknologi: {
          kepala_divisi: 'Budi Santoso',
          ruangan: 'Lantai 4',
        },
      },
      '3_level': {
        infrastruktur: {
          server_utama: {
            lokasi: 'Data Center Jakarta',
            kapasitas_gb: 1024,
          },
        },
      },
      array_in_json: ['JavaScript', 'Python', 'Go', 'SQL'],
      json_in_array: [
        {
          id_proyek: 'P-01',
          nama_proyek: 'Pengembangan Mobile App',
          status: 'In Progress',
        },
        {
          id_proyek: 'P-02',
          nama_proyek: 'Migrasi Cloud',
          status: 'Completed',
        },
      ],
    };

    it('matches user complex request body correctly when expected contains raw object with operator/value/enabled properties', () => {
      expect(evaluateDeepMatch(scenarioExpectedBody, actualIncomingBody, true)).toBe(true);
    });

    it('matches boolean value when rule is explicitly defined with $operator', () => {
      const scenarioWithRule = {
        '1_level': {
          status_aktif: { $operator: 'equal', $value: true, $enabled: true },
        },
      };
      const actualWithBoolean = {
        '1_level': {
          status_aktif: true,
        },
      };
      expect(evaluateDeepMatch(scenarioWithRule, actualWithBoolean, true)).toBe(true);
    });

    it('fails when deep nested property mismatches', () => {
      const mismatchedBody = {
        ...actualIncomingBody,
        '3_level': {
          infrastruktur: {
            server_utama: {
              lokasi: 'Data Center Singapore',
              kapasitas_gb: 1024,
            },
          },
        },
      };
      expect(evaluateDeepMatch(scenarioExpectedBody, mismatchedBody, true)).toBe(false);
    });

    it('skips disabled rules at nested levels', () => {
      const withDisabled = {
        ...scenarioExpectedBody,
        '3_level': {
          infrastruktur: {
            server_utama: {
              lokasi: { $operator: 'equal', $value: 'Data Center Tokyo', $enabled: false },
              kapasitas_gb: 1024,
            },
          },
        },
      };

      expect(evaluateDeepMatch(withDisabled, actualIncomingBody, true)).toBe(true);
    });
  });

  describe('updateDeepPath', () => {
    it('updates a nested property immutably', () => {
      const original = {
        '2_level': {
          divisi_teknologi: {
            kepala_divisi: { $operator: 'equal', $value: 'Budi', $enabled: true },
          },
        },
      };

      const updated = updateDeepPath(
        original,
        ['2_level', 'divisi_teknologi', 'kepala_divisi'],
        (current) => {
          const rule = extractParamRule(current);
          return { $operator: rule.operator, $value: rule.value, $enabled: false };
        }
      ) as typeof original;

      expect(updated['2_level'].divisi_teknologi.kepala_divisi.$enabled).toBe(false);
      expect(original['2_level'].divisi_teknologi.kepala_divisi.$enabled).toBe(true);
    });
  });

  describe('extractAllJsonPaths', () => {
    const userPayload = {
      debitur: [
        {
          birth_date: '2003-10-21',
          id_number: '3603110302740006',
          legal_name: 'HARWADLI MANDEA',
          surgate_mother_name: 'YASLA SARATU',
          type: 'KTP',
        },
      ],
      lob: 1,
      transaction_id: 'KPM-TST-66772340038',
    };

    it('extracts all dot-notation paths from JSON object', () => {
      const suggestions = extractAllJsonPaths(userPayload);
      const paths = suggestions.map((s) => s.path);

      expect(paths).toContain('debitur');
      expect(paths).toContain('debitur.0');
      expect(paths).toContain('debitur.0.birth_date');
      expect(paths).toContain('debitur.0.id_number');
      expect(paths).toContain('debitur.0.legal_name');
      expect(paths).toContain('debitur.0.surgate_mother_name');
      expect(paths).toContain('debitur.0.type');
      expect(paths).toContain('lob');
      expect(paths).toContain('transaction_id');

      const idNumberSuggestion = suggestions.find((s) => s.path === 'debitur.0.id_number');
      expect(idNumberSuggestion?.sampleValue).toBe('3603110302740006');
    });

    it('extracts paths from JSON string input', () => {
      const suggestions = extractAllJsonPaths(JSON.stringify(userPayload));
      expect(suggestions.some((s) => s.path === 'debitur.0.id_number')).toBe(true);
    });

    it('returns empty array for invalid JSON or primitives', () => {
      expect(extractAllJsonPaths('{invalid json')).toEqual([]);
      expect(extractAllJsonPaths(null)).toEqual([]);
      expect(extractAllJsonPaths('hello')).toEqual([]);
      expect(extractAllJsonPaths(123)).toEqual([]);
    });
  });

  describe('getValueByPath', () => {
    const data = {
      debitur: [
        {
          id_number: '3603110302740006',
          legal_name: 'HARWADLI MANDEA',
        },
      ],
      nested: {
        a: {
          b: 42,
        },
      },
    };

    it('resolves dot notation for arrays and nested objects', () => {
      expect(getValueByPath(data, 'debitur.0.id_number')).toBe('3603110302740006');
      expect(getValueByPath(data, 'nested.a.b')).toBe(42);
    });

    it('resolves bracket notation for arrays', () => {
      expect(getValueByPath(data, 'debitur[0].id_number')).toBe('3603110302740006');
      expect(getValueByPath(data, 'debitur[0].legal_name')).toBe('HARWADLI MANDEA');
    });

    it('returns undefined for non-existent paths', () => {
      expect(getValueByPath(data, 'debitur.1.id_number')).toBeUndefined();
      expect(getValueByPath(data, 'non.existent.path')).toBeUndefined();
      expect(getValueByPath(null, 'foo.bar')).toBeUndefined();
    });
  });

  describe('evaluateBodyPathRules', () => {
    const incomingBody = {
      debitur: [
        {
          birth_date: '2003-10-21',
          id_number: '3603110302740006',
          legal_name: 'HARWADLI MANDEA',
          surgate_mother_name: 'YASLA SARATU',
          type: 'KTP',
        },
      ],
      lob: 1,
      transaction_id: 'KPM-TST-66772340038',
      tags: [],
      notes: null,
    };

    it('matches when equal rule on dot path is satisfied', () => {
      const rules = [
        { path: 'debitur.0.id_number', operator: 'equal' as const, value: '3603110302740006', enabled: true },
      ];
      expect(evaluateBodyPathRules(rules, incomingBody, 'ALL')).toBe(true);
    });

    it('fails when equal rule on dot path is not satisfied', () => {
      const rules = [
        { path: 'debitur.0.id_number', operator: 'equal' as const, value: '9999999999999999', enabled: true },
      ];
      expect(evaluateBodyPathRules(rules, incomingBody, 'ALL')).toBe(false);
    });

    it('supports regex and regex_i on paths', () => {
      const rules = [
        { path: 'transaction_id', operator: 'regex' as const, value: '^KPM-TST-\\d+$', enabled: true },
        { path: 'debitur.0.legal_name', operator: 'regex_i' as const, value: '^harwadli', enabled: true },
      ];
      expect(evaluateBodyPathRules(rules, incomingBody, 'ALL')).toBe(true);
    });

    it('supports empty_array and null operators on paths', () => {
      const rules = [
        { path: 'tags', operator: 'empty_array' as const, enabled: true },
        { path: 'notes', operator: 'null' as const, enabled: true },
      ];
      expect(evaluateBodyPathRules(rules, incomingBody, 'ALL')).toBe(true);
    });

    it('ignores disabled rules', () => {
      const rules = [
        { path: 'debitur.0.id_number', operator: 'equal' as const, value: '3603110302740006', enabled: true },
        { path: 'debitur.0.type', operator: 'equal' as const, value: 'SIM', enabled: false }, // Disabled, shouldn't fail ALL
      ];
      expect(evaluateBodyPathRules(rules, incomingBody, 'ALL')).toBe(true);
    });

    it('respects ANY match strategy', () => {
      const rules = [
        { path: 'debitur.0.id_number', operator: 'equal' as const, value: 'WRONG_ID', enabled: true },
        { path: 'transaction_id', operator: 'equal' as const, value: 'KPM-TST-66772340038', enabled: true },
      ];
      expect(evaluateBodyPathRules(rules, incomingBody, 'ANY')).toBe(true);
      expect(evaluateBodyPathRules(rules, incomingBody, 'ALL')).toBe(false);
    });

    it('returns true when rules array is empty or all disabled', () => {
      expect(evaluateBodyPathRules([], incomingBody)).toBe(true);
      expect(evaluateBodyPathRules([{ path: 'x', operator: 'equal', value: 'y', enabled: false }], incomingBody)).toBe(true);
    });
  });

  describe('isToleratedHeader', () => {
    it('tolerates standard transport and browser headers', () => {
      expect(isToleratedHeader('Host')).toBe(true);
      expect(isToleratedHeader('user-agent')).toBe(true);
      expect(isToleratedHeader('ACCEPT')).toBe(true);
      expect(isToleratedHeader('connection')).toBe(true);
      expect(isToleratedHeader('sec-ch-ua')).toBe(true);
      expect(isToleratedHeader('sec-fetch-mode')).toBe(true);
      expect(isToleratedHeader('x-forwarded-for')).toBe(true);
      expect(isToleratedHeader('postman-token')).toBe(true);
      expect(isToleratedHeader('cf-ray')).toBe(true);
    });

    it('does not tolerate custom/business/auth headers', () => {
      expect(isToleratedHeader('Authorization')).toBe(false);
      expect(isToleratedHeader('token')).toBe(false);
      expect(isToleratedHeader('x-api-key')).toBe(false);
      expect(isToleratedHeader('x-custom-header')).toBe(false);
    });
  });

  describe('matchesHeadersMap', () => {
    it('matches when expected is empty and only tolerated headers are present', () => {
      const actual = {
        host: 'localhost:3000',
        'user-agent': 'Mozilla/5.0',
        accept: '*/*',
        connection: 'keep-alive',
      };
      expect(matchesHeadersMap({}, actual)).toBe(true);
      expect(matchesHeadersMap(null, actual)).toBe(true);
    });

    it('fails when expected is empty but unexpected strict header like Authorization is sent', () => {
      const actual = {
        host: 'localhost:3000',
        'user-agent': 'PostmanRuntime/7.43.0',
        authorization: 'xx2',
      };
      expect(matchesHeadersMap({}, actual)).toBe(false);
      expect(matchesHeadersMap(null, actual)).toBe(false);
    });

    it('matches when expected header matches actual non-tolerated header', () => {
      const expected = {
        authorization: 'Bearer token-123',
      };
      const actual = {
        host: 'localhost:3000',
        'user-agent': 'PostmanRuntime/7.43.0',
        authorization: 'Bearer token-123',
      };
      expect(matchesHeadersMap(expected, actual)).toBe(true);
    });

    it('fails when expected header value does not match actual header', () => {
      const expected = {
        authorization: 'Bearer token-123',
      };
      const actual = {
        host: 'localhost:3000',
        authorization: 'Bearer wrong-token',
      };
      expect(matchesHeadersMap(expected, actual)).toBe(false);
    });

    it('fails when request contains extra undeclared custom header in addition to valid auth', () => {
      const expected = {
        authorization: 'Bearer token-123',
      };
      const actual = {
        host: 'localhost:3000',
        authorization: 'Bearer token-123',
        'x-extra-custom': 'surprise',
      };
      expect(matchesHeadersMap(expected, actual)).toBe(false);
    });
  });
});

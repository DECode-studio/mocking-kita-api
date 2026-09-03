import { pbkdf2Sync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/src/core/utils/password-hash';

describe('password hash helper', () => {
  it('hashes passwords with a versioned PBKDF2 format and verifies them', () => {
    const stored = hashPassword('correct-password');

    expect(stored).toMatch(/^pbkdf2:sha512:210000:[a-f0-9]+:[a-f0-9]+$/);
    expect(verifyPassword('correct-password', stored)).toBe(true);
    expect(verifyPassword('wrong-password', stored)).toBe(false);
  });

  it('keeps verifying legacy salt:hash values', () => {
    const salt = '0123456789abcdef0123456789abcdef';
    const legacyHash = pbkdf2Sync('legacy-password', salt, 1000, 64, 'sha512').toString('hex');

    expect(verifyPassword('legacy-password', `${salt}:${legacyHash}`)).toBe(true);
    expect(verifyPassword('wrong-password', `${salt}:${legacyHash}`)).toBe(false);
  });

  it('rejects malformed hashes safely', () => {
    expect(verifyPassword('password', '')).toBe(false);
    expect(verifyPassword('password', 'pbkdf2:sha512:not-a-number:salt:hash')).toBe(false);
    expect(verifyPassword('password', 'not-a-valid-format')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { encryptApiKey, decryptApiKey, createKeyHint } from '@/src/server/ai/encryption';

describe('AI API Key Encryption & Fallback System', () => {
  it('should encrypt and decrypt API key correctly with AES-256-GCM', () => {
    const rawApiKey = 'nvapi-TEST-99887766554433221100';
    const encrypted = encryptApiKey(rawApiKey);

    expect(encrypted).toBeDefined();
    expect(encrypted).toContain(':');
    expect(encrypted.split(':').length).toBe(4); // salt:iv:authTag:ciphertext

    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(rawApiKey);
  });

  it('should generate secure masked key hints for UI display', () => {
    const key1 = 'nvapi-aB12cD34eF56gH78iJ90';
    const hint1 = createKeyHint(key1);
    expect(hint1).toBe('nvapi-••••iJ90');

    const key2 = 'sk-proj-1234567890abcdef';
    const hint2 = createKeyHint(key2);
    expect(hint2).toBe('sk-p••••cdef');
  });

  it('should throw error on invalid ciphertext format or tampering', () => {
    expect(() => decryptApiKey('invalid-tampered-string')).toThrow();
  });
});

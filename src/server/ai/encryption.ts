import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

/**
 * Derive 256-bit encryption key from application secret
 */
function getDerivedKey(salt: Buffer): Buffer {
  const secret = process.env.APP_PASSWORD || process.env.DATABASE_URL || 'mocking-kita-ai-encryption-master-secret-2026';
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt a plain text API key into a secure hex string:
 * format: salt(hex):iv(hex):authTag(hex):ciphertext(hex)
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey) return '';
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getDerivedKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plainKey, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Decrypt an encrypted API key back to plain text
 */
export function decryptApiKey(encryptedPayload: string): string {
  if (!encryptedPayload) return '';

  const parts = encryptedPayload.split(':');
  if (parts.length !== 4) {
    throw new Error('Format encrypted API key tidak valid');
  }

  const [saltHex, ivHex, authTagHex, ciphertextHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getDerivedKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Creates a masked hint for UI display, e.g. "nvapi-****3F9a"
 */
export function createKeyHint(plainKey: string): string {
  const trimmed = plainKey.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  const prefix = trimmed.startsWith('nvapi-') ? 'nvapi-' : trimmed.substring(0, 4);
  const suffix = trimmed.substring(trimmed.length - 4);
  return `${prefix}••••${suffix}`;
}

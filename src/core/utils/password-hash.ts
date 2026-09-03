import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'sha512';
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PBKDF2_ITERATIONS = 210_000;
const LEGACY_PBKDF2_ITERATIONS = 1_000;
const PREFIX = 'pbkdf2';

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a versioned string in format: pbkdf2:sha512:iterations:salt:hash
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, ALGORITHM).toString('hex');
  return `${PREFIX}:${ALGORITHM}:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash string.
 * Supports the legacy salt:hash format for existing local accounts.
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split(':');
  if (parts.length === 5 && parts[0] === PREFIX) {
    const [, algorithm, iterationsRaw, salt, hash] = parts;
    const iterations = Number(iterationsRaw);
    if (algorithm !== ALGORITHM || !Number.isSafeInteger(iterations) || iterations < LEGACY_PBKDF2_ITERATIONS) {
      return false;
    }
    return comparePasswordHash(password, salt, hash, iterations);
  }

  if (parts.length === 2) {
    const [salt, hash] = parts;
    return comparePasswordHash(password, salt, hash, LEGACY_PBKDF2_ITERATIONS);
  }

  return false;
}

function comparePasswordHash(password: string, salt: string, expectedHex: string, iterations: number): boolean {
  try {
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== KEY_LENGTH) return false;
    const actual = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, ALGORITHM);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

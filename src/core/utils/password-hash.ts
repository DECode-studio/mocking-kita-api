import { pbkdf2Sync, randomBytes } from 'node:crypto';

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a string in format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash string (in format salt:hash).
 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const verifyHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

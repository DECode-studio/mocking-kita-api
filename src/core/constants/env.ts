/**
 * Centralized Environment Configuration
 * 
 * Provides type-safe access and defaults for all environment variables specified in .env.example.
 * Uses getters to ensure dynamic evaluation during testing and runtime updates.
 */
export const ENV = {
  /** Application base URL */
  get APP_URL(): string {
    return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  },

  /** PostgreSQL Database URL */
  get DATABASE_URL(): string {
    return process.env.DATABASE_URL || '';
  },

  /** Upload directory path for stored files */
  get UPLOAD_PATH(): string {
    const val = process.env.UPLOAD_PATH?.trim();
    return val ? val : '.data/uploads';
  },

  /** Admin account username */
  get APP_USERNAME(): string {
    return process.env.APP_USERNAME?.trim() || '';
  },

  /** Admin account password */
  get APP_PASSWORD(): string {
    return process.env.APP_PASSWORD?.trim() || '';
  },

  /** Array of whitelisted SSO domains */
  get SSO_DOMAINS(): string[] {
    const domainsStr = process.env.SSO_DOMAINS || '';
    return domainsStr
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  },

  /** Google OAuth Client ID */
  get GOOGLE_CLIENT_ID(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  },

  /** Google OAuth Client Secret */
  get GOOGLE_CLIENT_SECRET(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  },

  /** Google OAuth Callback Route */
  get GOOGLE_CALLBACK_ROUTE(): string {
    return process.env.GOOGLE_CALLBACK_ROUTE || '/api/auth/sso/callback';
  },

  /** Google Space Webhook URL for Notifications */
  get GOOGLE_SPACE_WEBHOOK_URL(): string {
    return process.env.GOOGLE_SPACE_WEBHOOK_URL || '';
  },

  /** Node Environment ('development' | 'production' | 'test') */
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  },

  /** Whether the environment is production */
  get IS_PRODUCTION(): boolean {
    return process.env.NODE_ENV === 'production';
  },

  /** Whether the environment is development */
  get IS_DEVELOPMENT(): boolean {
    return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  },
};

export default ENV;

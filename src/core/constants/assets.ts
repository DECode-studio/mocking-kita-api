import path from 'node:path';

export const ASSET_PATHS = {
  SSO_REGISTER_TEMPLATE: path.join(process.cwd(), 'src/core/assets/templates/sso-register.html'),
  SSO_SUCCESS_TEMPLATE: path.join(process.cwd(), 'src/core/assets/templates/sso-success.html'),
} as const;

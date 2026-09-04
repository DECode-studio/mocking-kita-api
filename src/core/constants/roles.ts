export enum AccountRole {
  ADMINISTRATOR = 'Administrator',
  MANAGER = 'Manager',
  PRODUCT_PROJECT_MANAGER = 'Product / Project Manager',
  BACKEND_DEVELOPER = 'Backend Developer',
  FRONTEND_DEVELOPER = 'Frontend Developer',
  MOBILE_DEVELOPER = 'Mobile Developer',
  QUALITY_ASSURANCE = 'Quality Assurance',
}

/**
 * Roles offered to new users during initial registration / sign-in (excludes Admin/Manager authority).
 */
export const INITIAL_USER_ROLES = [
  AccountRole.PRODUCT_PROJECT_MANAGER,
  AccountRole.BACKEND_DEVELOPER,
  AccountRole.FRONTEND_DEVELOPER,
  AccountRole.MOBILE_DEVELOPER,
  AccountRole.QUALITY_ASSURANCE,
];

/**
 * All roles available for management in /admin/accounts (includes Manager and Administrator).
 */
export const ADMIN_ACCOUNT_ROLES = [
  ...INITIAL_USER_ROLES,
  AccountRole.MANAGER,
];

/**
 * Default alias for initial registration roles list.
 */
export const ROLES_LIST = INITIAL_USER_ROLES;

export function hasAdminAuthority(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.trim().toLowerCase();
  return ['administrator', 'admin', 'manager'].includes(normalized);
}

export function canResetDatabase(role?: string | null): boolean {
  return hasAdminAuthority(role);
}

export function canBackupRestoreDatabase(role?: string | null): boolean {
  return hasAdminAuthority(role);
}

